"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import ChatBubble from "@/components/ChatBubble";
import Header from "@/components/Header";
import MessageInput from "@/components/MessageInput";
import Sidebar from "@/components/Sidebar";
import { Message } from "@/lib/types";
import {
  saveChatHistory,
  getUserId,
  clearChatHistory,
  getAllSessions,
  createNewSession,
  switchSession,
  deleteSession,
  ChatSession,
} from "@/lib/chatStorage";

// Storage key for pending requests
const PENDING_REQUEST_KEY = "greenlaw_pending_request";

interface PendingRequest {
  sessionId: string;
  userMessageContent: string;
  timestamp: number;
}

// Save pending request to storage
function savePendingRequest(sessionId: string, userMessageContent: string) {
  const pending: PendingRequest = {
    sessionId,
    userMessageContent,
    timestamp: Date.now(),
  };
  sessionStorage.setItem(PENDING_REQUEST_KEY, JSON.stringify(pending));
}

// Get pending request (don't clear - let the caller decide)
function getPendingRequest(): PendingRequest | null {
  const data = sessionStorage.getItem(PENDING_REQUEST_KEY);
  if (!data) return null;
  try {
    const pending = JSON.parse(data) as PendingRequest;
    // Expire after 10 minutes
    if (Date.now() - pending.timestamp > 600000) {
      sessionStorage.removeItem(PENDING_REQUEST_KEY);
      return null;
    }
    return pending;
  } catch {
    return null;
  }
}

function clearPendingRequest() {
  sessionStorage.removeItem(PENDING_REQUEST_KEY);
}

// Fetch history from backend
async function fetchBackendHistory(
  sessionId: string,
  userId: string,
): Promise<Message[]> {
  try {
    const response = await fetch(
      `/api/history/${sessionId}?user_id=${encodeURIComponent(userId)}`,
    );
    if (!response.ok) return [];
    const data = await response.json();
    return (data.messages || []).map(
      (msg: {
        id: string;
        role: string;
        content: string;
        references?: { text: string; tooltip: string }[];
      }) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        references: msg.references,
      }),
    );
  } catch (error) {
    console.error("Failed to fetch backend history:", error);
    return [];
  }
}

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  // Track if component is mounted for safe state updates
  const isMountedRef = useRef(true);

  // Keep a ref to latest messages so handleSend always reads current state
  const messagesRef = useRef<Message[]>([]);

  // Keep messagesRef in sync with messages state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Refresh sessions list
  const refreshSessions = () => {
    setSessions(getAllSessions());
  };

  // Clear history and return to landing
  const handleClearChat = () => {
    clearChatHistory();
    router.push("/chat");
  };

  // Handle new chat - create new session and navigate
  const handleNewChat = () => {
    const newId = createNewSession();
    setIsSidebarOpen(false);
    router.push(`/chat/${newId}`);
  };

  // Handle selecting a session from sidebar
  const handleSelectSession = (selectedSessionId: string) => {
    setIsSidebarOpen(false);
    if (selectedSessionId !== sessionId) {
      router.push(`/chat/${selectedSessionId}`);
    }
  };

  // Handle deleting a session
  const handleDeleteSession = (deletedSessionId: string) => {
    deleteSession(deletedSessionId);
    refreshSessions();
    // If deleted current session, go to landing
    if (deletedSessionId === sessionId) {
      router.push("/chat");
    }
  };

  // Load session messages when sessionId changes
  useEffect(() => {
    const allSessions = getAllSessions();
    setSessions(allSessions);

    // Switch to the session from URL (load from localStorage first)
    const localMessages = switchSession(sessionId);
    setMessages(localMessages);
    setHasLoadedHistory(true);

    // Check for pending message from landing page
    const pendingMessage = sessionStorage.getItem("pendingMessage");
    if (pendingMessage && localMessages.length === 0) {
      sessionStorage.removeItem("pendingMessage");
      // messagesRef is already synced, so handleSend reads correct state
      handleSend(pendingMessage);
      return; // Don't fetch backend history if we're sending a new message
    }

    // Check if there's a pending request for this session
    const pending = getPendingRequest();
    const hasPendingForThisSession = pending && pending.sessionId === sessionId;

    // Fetch history from backend to check for updates
    const userId = getUserId();
    fetchBackendHistory(sessionId, userId).then((backendMessages) => {
      if (!isMountedRef.current) return;

      // If backend has more messages than local, use backend data
      if (backendMessages.length > localMessages.length) {
        setMessages(backendMessages);
        saveChatHistory(backendMessages);
        // Clear pending request since we got the response
        if (hasPendingForThisSession) {
          clearPendingRequest();
        }
      } else if (hasPendingForThisSession) {
        // We have a pending request but backend doesn't have the response yet
        // Show loading state and retry the request
        setIsLoading(true);
        handleSend(pending.userMessageContent);
        clearPendingRequest();
      }
    });
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save messages when they change
  useEffect(() => {
    if (hasLoadedHistory && messages.length > 0) {
      const timeoutId = setTimeout(() => {
        saveChatHistory(messages);
        refreshSessions();
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [messages, hasLoadedHistory]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // State for streaming message
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  // Dynamic loading status (like Claude CLI)
  const LOADING_STATES = [
    "Searching knowledge base...",
    "Analyzing documents...",
    "Generating response...",
    "Organizing references...",
  ];
  const [loadingStateIndex, setLoadingStateIndex] = useState(0);

  useEffect(() => {
    if (!isLoading || streamingContent) return;
    const interval = setInterval(() => {
      setLoadingStateIndex((prev) => (prev + 1) % LOADING_STATES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isLoading, streamingContent, LOADING_STATES.length]);

  // Reset loading state index when a new request starts
  useEffect(() => {
    if (isLoading) setLoadingStateIndex(0);
  }, [isLoading]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  const handleSend = async (message: string) => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: message,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setStreamingContent("");
    setIsStreaming(true);

    // Save pending request in case user navigates away
    savePendingRequest(sessionId, message);

    try {
      // Prepare conversation history using ref to avoid stale closure
      const conversationHistory = messagesRef.current.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Get user ID for tracking
      const userId = getUserId();

      // Call the streaming API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          conversation_history: conversationHistory,
          session_id: sessionId,
          user_id: userId,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      // Check if we got a streaming response
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("text/event-stream")) {
        // Handle SSE streaming with line buffer for cross-packet safety
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullContent = "";
        let streamCompleted = false;
        let sseBuffer = "";

        if (reader) {
          // Helper to save completed content to messages
          const saveContent = (content: string) => {
            if (isMountedRef.current && content) {
              const aiMessage: Message = {
                id: `ai-${Date.now()}`,
                role: "assistant",
                content,
              };
              setMessages((prev) => [...prev, aiMessage]);
              setStreamingContent("");
              setIsStreaming(false);
            }
            clearPendingRequest();
          };

          // Helper to process a single parsed SSE data object
          const processSSEData = (data: Record<string, unknown>) => {
            if (data.error) {
              // Backend error — but we may already have partial content
              // If we have content from the same stream, use it
              // The error + done often come together from backend
              console.error("Backend stream error:", data.error);
              if (data.done && fullContent) {
                streamCompleted = true;
                saveContent(fullContent);
                return;
              }
              // If the done event has content attached, use that
              if (data.done && data.content) {
                streamCompleted = true;
                saveContent(data.content as string);
                return;
              }
              // No content at all — propagate error
              if (!fullContent) {
                throw new Error(data.error as string);
              }
              // Have partial content — save what we have
              streamCompleted = true;
              saveContent(fullContent);
              return;
            }

            if (data.chunk) {
              fullContent += data.chunk;
              if (isMountedRef.current) {
                setStreamingContent(fullContent);
              }
            }

            if (data.done) {
              streamCompleted = true;
              saveContent((data.content as string) || fullContent);
            }
          };

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              sseBuffer += decoder.decode(value, { stream: true });
              const lines = sseBuffer.split("\n");
              // Keep the last (potentially incomplete) line in the buffer
              sseBuffer = lines.pop() ?? "";

              for (const line of lines) {
                if (line.startsWith("data:")) {
                  const jsonStr = line.slice(5).trim();
                  if (!jsonStr) continue;

                  try {
                    const data = JSON.parse(jsonStr);
                    processSSEData(data);
                  } catch (e) {
                    // Only warn for JSON parse errors, re-throw app errors
                    if (e instanceof SyntaxError) {
                      console.warn("Failed to parse SSE data:", jsonStr);
                    } else {
                      throw e;
                    }
                  }
                }
              }
            }

            // Process any remaining data left in the SSE buffer
            if (sseBuffer.startsWith("data:")) {
              const jsonStr = sseBuffer.slice(5).trim();
              if (jsonStr) {
                try {
                  const data = JSON.parse(jsonStr);
                  processSSEData(data);
                } catch (e) {
                  if (!(e instanceof SyntaxError)) throw e;
                }
              }
            }
          } finally {
            // If stream ended without "done" signal but we have content, save it
            if (!streamCompleted && fullContent && isMountedRef.current) {
              saveContent(fullContent);
            }
          }
        }
      } else {
        // Fallback to non-streaming JSON response
        const aiResponse = await response.json();
        const aiMessage: Message = {
          ...aiResponse,
          id: `ai-${Date.now()}`,
        };

        if (isMountedRef.current) {
          setMessages((prev) => [...prev, aiMessage]);
          setIsStreaming(false);
        }
        clearPendingRequest();
      }
    } catch (error) {
      console.error("Error sending message:", error);
      if (isMountedRef.current) {
        setIsStreaming(false);
        setStreamingContent("");
        // Show error message with the actual error detail
        const errorDetail =
          error instanceof Error ? error.message : "Unknown error";
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Request failed: ${errorDetail}. Please try again.`,
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNewChat={handleNewChat}
        sessions={sessions}
        currentSessionId={sessionId}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          onClearChat={handleClearChat}
          onMenuClick={() => setIsSidebarOpen(true)}
          showMenuButton={true}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="flex justify-center py-5">
            <div className="layout-content-container flex flex-col w-full max-w-3xl flex-1 px-4">
              <div className="space-y-6">
                {messages.map((message, index) => (
                  <ChatBubble
                    key={message.id}
                    message={message}
                    delay={index * 0.2}
                  />
                ))}
                {/* Streaming response - show as it comes in */}
                {isStreaming && streamingContent && (
                  <ChatBubble
                    key="streaming"
                    message={{
                      id: "streaming",
                      role: "assistant",
                      content: streamingContent,
                    }}
                    delay={0}
                  />
                )}
                {/* Loading indicator - show when waiting for first chunk or non-streaming */}
                {isLoading && !streamingContent && (
                  <div className="flex items-start gap-3 p-4 animate-fade-in">
                    <div
                      className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10 h-10 shrink-0 shadow-sm"
                      style={{
                        backgroundImage:
                          'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDrkDJRueG6cbTc-pK2U118OcT-5KblcDRskAzZVfP0X_7RJDy816UrmdXAd2MRPiVEYm59VZjnO6IQh7QnRyQiUwk1zz3EkF_Xrk2_C7UKRtsC7seOPZBkhzPNyw1GltrIANbDtFRn4ae2THwRRRfPQ67oMLEV5PCIIMK8X3lNqw8PeDaEsLxgjah83QXIeTAPXy9IdgixokHl1ZbCsHQ1zrY7zyoU7Sv88-j9-q-IuKpNhIg1td9Spgax93tk7ppyxCpGLdorTAM")',
                      }}
                    />
                    <div className="flex flex-1 flex-col gap-1 items-start">
                      <p className="text-[#333333] dark:text-gray-400 text-xs font-normal leading-normal">
                        GreenLaw AI
                      </p>
                      <div className="px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
                            <div
                              className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            />
                            <div
                              className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            />
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400 transition-opacity duration-300">
                            {LOADING_STATES[loadingStateIndex]}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>
        </main>

        {/* Input fixed at bottom */}
        <div className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-4">
          <div className="mx-auto max-w-3xl">
            <MessageInput
              value={input}
              onChange={setInput}
              onSend={handleSend}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
