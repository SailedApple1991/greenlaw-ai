"""
FastAPI backend for GreenLaw AI
Connects to RAGFlow API using official RAGFlow SDK for RAG-powered chat responses
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, AsyncGenerator
import os
import json
import time
import asyncio
from concurrent.futures import ThreadPoolExecutor
from ragflow_sdk import RAGFlow
import logging
from dotenv import load_dotenv
import requests as http_requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="GreenLaw AI Backend", version="1.0.0")

# CORS middleware to allow Next.js frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*",  # 生产环境建议改为具体域名
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Environment variables
RAGFLOW_API_KEY = os.getenv("RAGFLOW_API_KEY")
RAGFLOW_BASE_URL = os.getenv("RAGFLOW_BASE_URL")  # e.g., http://localhost:9380
RAGFLOW_CHAT_ID = os.getenv("RAGFLOW_CHAT_ID")  # Chat assistant ID

if not RAGFLOW_API_KEY:
    logger.warning("RAGFLOW_API_KEY not set in environment variables")
if not RAGFLOW_BASE_URL:
    logger.warning("RAGFLOW_BASE_URL not set in environment variables")
if not RAGFLOW_CHAT_ID:
    logger.warning("RAGFLOW_CHAT_ID not set in environment variables")

# Initialize RAGFlow client (singleton)
_ragflow_client = None
_chat_assistant = None

# Thread pool for running blocking SDK calls
_thread_pool = ThreadPoolExecutor(max_workers=4)

# Global HTTP session with connection pooling
_http_session = None

def get_http_session() -> http_requests.Session:
    """
    Get or create a global HTTP session with connection pooling and retry logic.
    This improves performance by reusing connections and handles transient failures.
    """
    global _http_session
    if _http_session is None:
        _http_session = http_requests.Session()

        # Configure retry strategy for transient failures
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["HEAD", "GET", "POST", "OPTIONS"]
        )

        # Configure connection pooling
        adapter = HTTPAdapter(
            pool_connections=10,
            pool_maxsize=10,
            max_retries=retry_strategy
        )
        _http_session.mount('http://', adapter)
        _http_session.mount('https://', adapter)

        logger.info("HTTP session with connection pooling initialized")

    return _http_session

def get_ragflow_assistant():
    """
    Get or initialize RAGFlow Chat Assistant
    """
    global _ragflow_client, _chat_assistant

    if not RAGFLOW_API_KEY or not RAGFLOW_BASE_URL:
        raise ValueError("RAGFlow configuration missing. Please set RAGFLOW_API_KEY and RAGFLOW_BASE_URL")

    if not RAGFLOW_CHAT_ID:
        raise ValueError("RAGFLOW_CHAT_ID not set. Please set it in .env file")

    if _ragflow_client is None:
        logger.info(f"Initializing RAGFlow client: {RAGFLOW_BASE_URL}")
        _ragflow_client = RAGFlow(
            api_key=RAGFLOW_API_KEY,
            base_url=RAGFLOW_BASE_URL
        )

    if _chat_assistant is None:
        logger.info(f"Getting Chat Assistant: {RAGFLOW_CHAT_ID}")

        # List all chats and find the one matching our ID
        # Note: RAGFlow SDK doesn't have get_chat(), use list_chats() instead
        chats = _ragflow_client.list_chats()
        _chat_assistant = next((c for c in chats if c.id == RAGFLOW_CHAT_ID), None)

        if not _chat_assistant:
            raise ValueError(
                f"Chat Assistant with ID {RAGFLOW_CHAT_ID} not found. "
                f"Available chats: {[c.id for c in chats]}"
            )

        logger.info(f"Found Chat Assistant: {_chat_assistant.name}")

    return _chat_assistant


async def get_ragflow_assistant_async():
    """
    Async version that runs the blocking SDK calls in a thread pool.
    This prevents blocking the FastAPI event loop.
    """
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(_thread_pool, get_ragflow_assistant)


# Request/Response models
class ChatMessage(BaseModel):
    role: str  # "user" or "assistant" or "system"
    content: str


class ChatRequest(BaseModel):
    message: str
    stream: Optional[bool] = False
    reference: Optional[bool] = True  # Get references from RAGFlow
    conversation_history: Optional[List[ChatMessage]] = []  # Optional: conversation history for context
    session_id: Optional[str] = None  # Optional: session identifier for multi-user support
    user_id: Optional[str] = None  # Optional: user identifier for tracking


class Reference(BaseModel):
    text: str
    tooltip: str


class ChatResponse(BaseModel):
    id: str
    role: str = "assistant"
    content: str
    references: Optional[List[Reference]] = []
    citation: Optional[str] = ""


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "GreenLaw AI Backend",
        "ragflow_configured": bool(RAGFLOW_API_KEY and RAGFLOW_BASE_URL and RAGFLOW_CHAT_ID),
        "mode": "chat_assistant",
        "sdk": "ragflow-sdk"
    }


# In-memory session storage (simple implementation)
# For production, use Redis or database
# Format: {session_key: {"session": session_obj, "last_used": timestamp}}
_sessions = {}
SESSION_EXPIRY_SECONDS = 3600  # 1 hour


def cleanup_expired_sessions():
    """Remove expired sessions from cache to prevent memory growth."""
    current_time = time.time()
    expired_keys = [
        key for key, data in _sessions.items()
        if current_time - data.get("last_used", 0) > SESSION_EXPIRY_SECONDS
    ]
    for key in expired_keys:
        del _sessions[key]
        logger.info(f"Cleaned up expired session cache: {key}")


def get_or_create_session(assistant, session_id: Optional[str] = None, user_id: str = "anonymous"):
    """
    Get existing session or create a new one.
    Session key includes user_id for better tracking.
    """
    start_time = time.time()

    # Cleanup expired sessions periodically (every 10th call approximately)
    if len(_sessions) > 0 and hash(str(time.time())) % 10 == 0:
        cleanup_expired_sessions()

    # Build session key that includes user_id
    session_key = f"{user_id}_{session_id}" if session_id else None

    if not session_key:
        # Create new session with auto-generated ID
        session_name = f"user_{user_id}_new"
        session = assistant.create_session(name=session_name)
        logger.info(f"User [{user_id}] created new session: {session.id} in {time.time() - start_time:.2f}s")
        return session

    # Check if we have this session cached
    if session_key in _sessions:
        _sessions[session_key]["last_used"] = time.time()
        logger.info(f"User [{user_id}] using cached session: {session_id} in {time.time() - start_time:.2f}s")
        return _sessions[session_key]["session"]

    # Try to find existing session in RAGFlow
    list_start = time.time()
    try:
        sessions = assistant.list_sessions()
        logger.info(f"Listed {len(sessions)} sessions in {time.time() - list_start:.2f}s")
        for sess in sessions:
            if sess.id == session_id:
                _sessions[session_key] = {"session": sess, "last_used": time.time()}
                logger.info(f"User [{user_id}] found existing session: {session_id} in {time.time() - start_time:.2f}s")
                return sess
    except Exception as e:
        logger.warning(f"Error listing sessions after {time.time() - list_start:.2f}s: {e}")

    # Session not found, create new one with user info in name
    # Extract meaningful part from session_id (skip "session_" prefix)
    short_id = session_id[8:16] if session_id and len(session_id) > 8 else (session_id or 'new')
    session_name = f"{user_id}_{short_id}"
    session = assistant.create_session(name=session_name)
    _sessions[session_key] = {"session": session, "last_used": time.time()}
    logger.info(f"User [{user_id}] created new session: {session.id} (name: {session_name}) in {time.time() - start_time:.2f}s")
    return session


async def get_or_create_session_async(assistant, session_id: Optional[str] = None, user_id: str = "anonymous"):
    """
    Async version that runs the blocking session operations in a thread pool.
    """
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        _thread_pool,
        lambda: get_or_create_session(assistant, session_id, user_id)
    )


def validate_ragflow_config():
    """Validate RAGFlow configuration"""
    if not RAGFLOW_API_KEY or not RAGFLOW_BASE_URL:
        raise HTTPException(
            status_code=500,
            detail="RAGFlow not configured. Please set RAGFLOW_API_KEY and RAGFLOW_BASE_URL in environment variables"
        )
    if not RAGFLOW_CHAT_ID:
        raise HTTPException(
            status_code=500,
            detail="RAGFlow not configured. Please set RAGFLOW_CHAT_ID in environment variables"
        )


async def stream_ragflow_response(session_id: str, message: str, user_id: str) -> AsyncGenerator[str, None]:
    """
    Stream response from RAGFlow API using SSE format.
    Yields SSE-formatted data chunks.
    Uses connection pooling for better performance.
    """
    api_url = f"{RAGFLOW_BASE_URL}/api/v1/chats/{RAGFLOW_CHAT_ID}/completions"
    headers = {
        "Authorization": f"Bearer {RAGFLOW_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "question": message,
        "stream": True,
        "session_id": session_id
    }

    start_time = time.time()
    logger.info(f"User [{user_id}] starting streaming request to RAGFlow...")

    response = None
    try:
        # Use connection pool for better performance
        http_session = get_http_session()
        response = http_session.post(api_url, headers=headers, json=payload, stream=True, timeout=300)
        response.raise_for_status()

        connect_time = time.time() - start_time
        logger.info(f"User [{user_id}] connected to RAGFlow in {connect_time:.2f}s, starting to receive stream...")

        full_content = ""
        chunk_count = 0
        last_chunk_time = time.time()

        for line in response.iter_lines():
            if not line:
                continue

            line_str = line.decode('utf-8')
            chunk_count += 1

            # Log if there's a long gap between chunks (potential hang detection)
            current_time = time.time()
            if current_time - last_chunk_time > 30:
                logger.warning(f"User [{user_id}] long gap detected: {current_time - last_chunk_time:.2f}s since last chunk")
            last_chunk_time = current_time

            # RAGFlow returns SSE format: data: {...}
            if line_str.startswith('data:'):
                json_str = line_str[5:].strip()
                if json_str == '[DONE]':
                    # Stream finished
                    yield f"data: {json.dumps({'done': True, 'content': full_content})}\n\n"
                    break

                try:
                    chunk_data = json.loads(json_str)
                    # RAGFlow format: {"code": 0, "data": {"answer": "...", ...}}
                    if chunk_data.get("code") == 0:
                        data = chunk_data.get("data", {})
                        answer = data.get("answer", "")
                        if answer:
                            # Send incremental content
                            new_content = answer[len(full_content):]
                            if new_content:
                                full_content = answer
                                yield f"data: {json.dumps({'chunk': new_content, 'done': False})}\n\n"
                    elif "data" in chunk_data:
                        # Alternative format: direct data
                        answer = chunk_data["data"].get("answer", "")
                        if answer:
                            new_content = answer[len(full_content):]
                            if new_content:
                                full_content = answer
                                yield f"data: {json.dumps({'chunk': new_content, 'done': False})}\n\n"
                except json.JSONDecodeError:
                    logger.warning(f"Failed to parse JSON: {json_str[:100]}...")
                    continue
            else:
                # Try to parse as raw JSON (some RAGFlow versions)
                try:
                    chunk_data = json.loads(line_str)
                    if chunk_data.get("code") == 0:
                        data = chunk_data.get("data", {})
                        answer = data.get("answer", "")
                        if answer:
                            new_content = answer[len(full_content):]
                            if new_content:
                                full_content = answer
                                yield f"data: {json.dumps({'chunk': new_content, 'done': False})}\n\n"
                except json.JSONDecodeError:
                    continue

        # Final summary log
        total_time = time.time() - start_time
        logger.info(f"User [{user_id}] streaming complete: {len(full_content)} chars, {chunk_count} chunks, {total_time:.2f}s total")

    except http_requests.exceptions.Timeout as e:
        elapsed = time.time() - start_time
        logger.error(f"User [{user_id}] streaming timeout after {elapsed:.2f}s: {e}")
        yield f"data: {json.dumps({'error': f'Request timed out after {elapsed:.0f}s', 'done': True})}\n\n"
    except http_requests.exceptions.ConnectionError as e:
        elapsed = time.time() - start_time
        logger.error(f"User [{user_id}] connection error after {elapsed:.2f}s: {e}")
        yield f"data: {json.dumps({'error': 'Connection to RAGFlow failed', 'done': True})}\n\n"
    except Exception as e:
        elapsed = time.time() - start_time
        logger.error(f"User [{user_id}] streaming error after {elapsed:.2f}s: {e}", exc_info=True)
        yield f"data: {json.dumps({'error': str(e), 'done': True})}\n\n"
    finally:
        # Ensure response is properly closed to return connection to pool
        if response is not None:
            try:
                response.close()
            except Exception:
                pass


@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """
    Streaming chat endpoint - returns SSE stream for real-time response.
    Uses async functions to prevent blocking the event loop.
    """
    request_start = time.time()
    user_id = request.user_id or "anonymous"

    try:
        validate_ragflow_config()

        # Get Chat Assistant (async to prevent blocking)
        t1 = time.time()
        assistant = await get_ragflow_assistant_async()
        logger.info(f"User [{user_id}] got assistant in {time.time() - t1:.2f}s")

        # Get or create session with user tracking (async to prevent blocking)
        t2 = time.time()
        session = await get_or_create_session_async(assistant, request.session_id, user_id=user_id)
        logger.info(f"User [{user_id}] got session in {time.time() - t2:.2f}s")

        setup_time = time.time() - request_start
        logger.info(f"User [{user_id}] session [{session.id}] - Starting streaming chat (setup took {setup_time:.2f}s)")
        logger.info(f"User [{user_id}] message: {request.message[:100]}...")

        return StreamingResponse(
            stream_ragflow_response(session.id, request.message, user_id),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",  # Disable nginx buffering
            }
        )

    except ValueError as e:
        elapsed = time.time() - request_start
        logger.error(f"User [{user_id}] configuration error after {elapsed:.2f}s: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        elapsed = time.time() - request_start
        logger.error(f"User [{user_id}] error in streaming chat after {elapsed:.2f}s: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Chat endpoint that connects to RAGFlow API using official SDK (non-streaming)
    Uses async functions to prevent blocking the event loop.
    """
    request_start = time.time()
    user_id = request.user_id or "anonymous"

    try:
        validate_ragflow_config()

        # Get Chat Assistant (async to prevent blocking)
        t1 = time.time()
        assistant = await get_ragflow_assistant_async()
        logger.info(f"User [{user_id}] got assistant in {time.time() - t1:.2f}s")

        # Get or create session with user tracking (async to prevent blocking)
        t2 = time.time()
        session = await get_or_create_session_async(assistant, request.session_id, user_id=user_id)
        logger.info(f"User [{user_id}] got session in {time.time() - t2:.2f}s")

        # Log session info for debugging with user context
        setup_time = time.time() - request_start
        logger.info(f"User [{user_id}] session [{session.id}] - Processing message (setup took {setup_time:.2f}s)")
        logger.info(f"User [{user_id}] message: {request.message[:100]}...")

        # Send message to RAGFlow using direct HTTP API
        references_data = []
        content = ""
        http_response = None

        try:
            t3 = time.time()
            logger.info(f"User [{user_id}] calling RAGFlow HTTP API...")

            # Use RAGFlow HTTP API directly for more control with connection pooling
            api_url = f"{RAGFLOW_BASE_URL}/api/v1/chats/{RAGFLOW_CHAT_ID}/completions"
            headers = {
                "Authorization": f"Bearer {RAGFLOW_API_KEY}",
                "Content-Type": "application/json"
            }
            payload = {
                "question": request.message,
                "stream": False,
                "session_id": session.id
            }

            http_session = get_http_session()
            http_response = http_session.post(api_url, headers=headers, json=payload, timeout=300)
            http_response.raise_for_status()

            result = http_response.json()
            api_time = time.time() - t3
            logger.info(f"User [{user_id}] RAGFlow API response in {api_time:.2f}s: code={result.get('code', 'no code')}")

            if result.get("code") == 0:
                data = result.get("data", {})
                content = data.get("answer", "")
                references_data = data.get("reference", {})
            else:
                raise ValueError(f"RAGFlow API error: {result.get('message', 'Unknown error')}")

            logger.info(f"User [{user_id}] RAGFlow response received, content length: {len(content)}")

        except http_requests.exceptions.Timeout as e:
            elapsed = time.time() - request_start
            logger.error(f"User [{user_id}] RAGFlow API timeout after {elapsed:.2f}s: {e}")
            raise HTTPException(status_code=504, detail=f"RAGFlow request timed out after {elapsed:.0f}s")
        except http_requests.exceptions.ConnectionError as e:
            elapsed = time.time() - request_start
            logger.error(f"User [{user_id}] RAGFlow connection error after {elapsed:.2f}s: {e}")
            raise HTTPException(status_code=503, detail="Connection to RAGFlow failed")
        except Exception as api_error:
            logger.error(f"User [{user_id}] RAGFlow API error: {api_error}")
            raise api_error
        finally:
            # Ensure response is properly closed
            if http_response is not None:
                try:
                    http_response.close()
                except Exception:
                    pass

        # Parse references from RAGFlow response
        references = parse_ragflow_references(references_data)

        # Parse citations from content
        parsed_content = parse_citations_from_content(content)

        # Build response
        response = ChatResponse(
            id=session.id if hasattr(session, 'id') else str(os.urandom(8).hex()),
            role="assistant",
            content=parsed_content["content"],
            references=parsed_content["references"] + references,
            citation=parsed_content["citation"]
        )

        total_time = time.time() - request_start
        logger.info(f"User [{user_id}] session [{session.id}] - Response generated successfully in {total_time:.2f}s")
        return response

    except HTTPException:
        raise
    except ValueError as e:
        elapsed = time.time() - request_start
        logger.error(f"User [{user_id}] configuration error after {elapsed:.2f}s: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        elapsed = time.time() - request_start
        logger.error(f"User [{user_id}] error calling RAGFlow API after {elapsed:.2f}s: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate response: {str(e)}"
        )


def parse_ragflow_references(reference_data) -> List[Reference]:
    """
    Parse references from RAGFlow response
    RAGFlow SDK returns references in a specific format
    """
    references = []

    if not reference_data:
        return references

    if isinstance(reference_data, dict):
        # Handle dict format
        if "chunks" in reference_data:
            for idx, chunk in enumerate(reference_data["chunks"], 1):
                ref_text = chunk.get("content", "")[:100]  # First 100 chars
                doc_name = chunk.get("document_name", f"Reference {idx}")
                references.append(Reference(
                    text=doc_name,
                    tooltip=chunk.get("content", ref_text)
                ))
    elif isinstance(reference_data, list):
        # Handle list format
        for idx, ref in enumerate(reference_data, 1):
            if isinstance(ref, dict):
                ref_text = ref.get("content", "")[:100]
                doc_name = ref.get("document_name", f"Reference {idx}")
                references.append(Reference(
                    text=doc_name,
                    tooltip=ref.get("content", ref_text)
                ))

    return references


def parse_citations_from_content(content: str) -> dict:
    """
    Parse citations from content - extract references section only.
    Returns raw markdown content (no HTML conversion) + references list.
    Frontend will handle markdown rendering and citation formatting.
    """
    import re

    # Extract references section
    ref_section_match = re.search(r'##\s*References?\s*\n([\s\S]+)$', content, re.IGNORECASE)
    main_content = content
    references = []

    if ref_section_match:
        main_content = content[:ref_section_match.start()].strip()
        ref_section = ref_section_match.group(1)

        # Parse reference entries: [1] Full citation text
        ref_matches = re.finditer(r'\[(\d+)\]\s*(.+?)(?=\n\[|\n*$)', ref_section, re.MULTILINE | re.DOTALL)
        for match in ref_matches:
            number = match.group(1)
            full_text = match.group(2).strip()

            references.append(Reference(
                text=full_text,   # Full citation text
                tooltip=number    # Reference number
            ))

    # Return raw markdown - no HTML conversion
    # Frontend will handle citation markers like [Text]^[1] and {{CITATION:1:}}
    return {
        "content": main_content,
        "references": references,
        "citation": ""
    }


class HistoryMessage(BaseModel):
    id: str
    role: str
    content: str
    references: Optional[List[Reference]] = []


class HistoryResponse(BaseModel):
    session_id: str
    messages: List[HistoryMessage]


@app.get("/history/{session_id}", response_model=HistoryResponse)
async def get_history(session_id: str, user_id: Optional[str] = None):
    """
    Get chat history for a session from RAGFlow.
    This allows the frontend to recover conversation state after page navigation.
    Uses async functions to prevent blocking the event loop.
    """
    request_start = time.time()
    user = user_id or "anonymous"

    try:
        if not RAGFLOW_API_KEY or not RAGFLOW_BASE_URL or not RAGFLOW_CHAT_ID:
            raise HTTPException(
                status_code=500,
                detail="RAGFlow not configured"
            )

        logger.info(f"User [{user}] fetching history for session: {session_id}")

        # Get the assistant (async to prevent blocking)
        t1 = time.time()
        assistant = await get_ragflow_assistant_async()
        logger.info(f"User [{user}] got assistant in {time.time() - t1:.2f}s")

        # Find the session from cache first
        session_key = f"{user}_{session_id}"
        cached = _sessions.get(session_key)
        session = cached["session"] if cached else None

        if not session:
            # Try to find in RAGFlow (run in thread pool to avoid blocking)
            def find_session():
                try:
                    sessions = assistant.list_sessions()
                    return next((s for s in sessions if s.id == session_id), None)
                except Exception as e:
                    logger.warning(f"Error listing sessions: {e}")
                    return None

            t2 = time.time()
            loop = asyncio.get_event_loop()
            session = await loop.run_in_executor(_thread_pool, find_session)
            logger.info(f"User [{user}] searched for session in {time.time() - t2:.2f}s")

            if session:
                _sessions[session_key] = {"session": session, "last_used": time.time()}

        if not session:
            # Session not found, return empty
            logger.info(f"User [{user}] session {session_id} not found, returning empty history")
            return HistoryResponse(session_id=session_id, messages=[])

        # Get conversation history from RAGFlow using HTTP API with connection pooling
        api_url = f"{RAGFLOW_BASE_URL}/api/v1/chats/{RAGFLOW_CHAT_ID}/sessions/{session_id}/messages"
        headers = {
            "Authorization": f"Bearer {RAGFLOW_API_KEY}",
            "Content-Type": "application/json"
        }

        t3 = time.time()
        http_session = get_http_session()
        response = http_session.get(api_url, headers=headers, timeout=30)

        messages = []
        try:
            if response.status_code == 200:
                result = response.json()
                api_time = time.time() - t3
                logger.info(f"User [{user}] fetched history API in {api_time:.2f}s")

                if result.get("code") == 0:
                    data = result.get("data", [])
                    for msg in data:
                        role = msg.get("role", "assistant")
                        content = msg.get("content", "")

                        # Parse references if present
                        refs = []
                        if role == "assistant":
                            parsed = parse_citations_from_content(content)
                            content = parsed["content"]
                            refs = parsed["references"]

                        messages.append(HistoryMessage(
                            id=msg.get("id", str(len(messages))),
                            role=role,
                            content=content,
                            references=refs
                        ))
            else:
                logger.warning(f"User [{user}] history API returned status {response.status_code}")
        finally:
            # Ensure response is properly closed
            try:
                response.close()
            except Exception:
                pass

        total_time = time.time() - request_start
        logger.info(f"User [{user}] session [{session_id}] - Found {len(messages)} messages in {total_time:.2f}s")
        return HistoryResponse(session_id=session_id, messages=messages)

    except HTTPException:
        raise
    except http_requests.exceptions.Timeout as e:
        elapsed = time.time() - request_start
        logger.error(f"User [{user}] history request timeout after {elapsed:.2f}s: {e}")
        raise HTTPException(status_code=504, detail="History request timed out")
    except Exception as e:
        elapsed = time.time() - request_start
        logger.error(f"User [{user}] error fetching history after {elapsed:.2f}s: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
