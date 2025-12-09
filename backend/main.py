"""
FastAPI backend for GreenLaw AI
Connects to RAGFlow API using official RAGFlow SDK for RAG-powered chat responses
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os
from ragflow_sdk import RAGFlow
import logging
from dotenv import load_dotenv

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
_sessions = {}

def get_or_create_session(assistant, session_id: Optional[str] = None, user_id: str = "anonymous"):
    """
    Get existing session or create a new one.
    Session key includes user_id for better tracking.
    """
    # Build session key that includes user_id
    session_key = f"{user_id}_{session_id}" if session_id else None

    if not session_key:
        # Create new session with auto-generated ID
        session_name = f"user_{user_id}_new"
        session = assistant.create_session(name=session_name)
        logger.info(f"User [{user_id}] created new session: {session.id}")
        return session

    # Check if we have this session cached
    if session_key in _sessions:
        return _sessions[session_key]

    # Try to find existing session in RAGFlow
    try:
        sessions = assistant.list_sessions()
        for sess in sessions:
            if sess.id == session_id:
                _sessions[session_key] = sess
                logger.info(f"User [{user_id}] found existing session: {session_id}")
                return sess
    except Exception as e:
        logger.warning(f"Error listing sessions: {e}")

    # Session not found, create new one with user info in name
    # Extract meaningful part from session_id (skip "session_" prefix)
    short_id = session_id[8:16] if session_id and len(session_id) > 8 else (session_id or 'new')
    session_name = f"{user_id}_{short_id}"
    session = assistant.create_session(name=session_name)
    _sessions[session_key] = session
    logger.info(f"User [{user_id}] created new session: {session.id} (name: {session_name})")
    return session


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Chat endpoint that connects to RAGFlow API using official SDK
    """
    try:
        # Validate configuration
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

        # Get Chat Assistant
        assistant = get_ragflow_assistant()

        # Get user ID (default to anonymous if not provided)
        user_id = request.user_id or "anonymous"

        # Get or create session with user tracking
        session = get_or_create_session(assistant, request.session_id, user_id=user_id)

        # Log session info for debugging with user context
        logger.info(f"User [{user_id}] session [{session.id}] - Processing message")
        logger.info(f"User [{user_id}] message: {request.message[:100]}...")

        # Send message to RAGFlow using direct HTTP API (more stable than SDK streaming)
        import requests as http_requests
        references_data = []
        content = ""

        try:
            logger.info("Calling RAGFlow HTTP API directly...")

            # Use RAGFlow HTTP API directly for more control
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

            response = http_requests.post(api_url, headers=headers, json=payload, timeout=120)
            response.raise_for_status()

            result = response.json()
            logger.info(f"RAGFlow API response: {result.get('code', 'no code')}")

            if result.get("code") == 0:
                data = result.get("data", {})
                content = data.get("answer", "")
                references_data = data.get("reference", {})
            else:
                raise ValueError(f"RAGFlow API error: {result.get('message', 'Unknown error')}")

            logger.info(f"RAGFlow response received, content length: {len(content)}")

        except Exception as api_error:
            logger.error(f"RAGFlow API error: {api_error}")
            raise api_error

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

        logger.info(f"User [{user_id}] session [{session.id}] - Response generated successfully")
        return response

    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Error calling RAGFlow API: {e}", exc_info=True)
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


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
