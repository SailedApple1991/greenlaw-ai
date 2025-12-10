"use client";

import { useState, useRef, useEffect } from "react";
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
async function fetchBackendHistory(sessionId: string, userId: string): Promise<Message[]> {
  try {
    const response = await fetch(
      `/api/history/${sessionId}?user_id=${encodeURIComponent(userId)}`
    );
    if (!response.ok) return [];
    const data = await response.json();
    return (data.messages || []).map((msg: { id: string; role: string; content: string; references?: { text: string; tooltip: string }[] }) => ({
      id: msg.id,
      role: msg.role as "user" | "assistant",
      content: msg.content,
      references: msg.references,
    }));
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
    router.push("/");
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
      router.push("/");
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
      // Send the pending message after a brief delay to ensure state is set
      setTimeout(() => {
        handleSend(pendingMessage);
      }, 100);
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

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

    // Save pending request in case user navigates away
    savePendingRequest(sessionId, message);

    try {
      // Prepare conversation history (exclude current message)
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Get user ID for tracking
      const userId = getUserId();

      // Call the API route with conversation history
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
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const aiResponse = await response.json();
      const aiMessage: Message = {
        ...aiResponse,
        id: `ai-${Date.now()}`,
      };

      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setMessages((prev) => [...prev, aiMessage]);
      }

      // Clear pending request on success
      clearPendingRequest();
    } catch (error) {
      console.error("Error sending message:", error);
      // Only show error if component is still mounted
      if (isMountedRef.current) {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "I apologize, but I encountered an error processing your request. Please try again.",
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
      // Don't clear pending request on error - user might want to retry
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
                {isLoading && (
                  <div className="flex items-end gap-3 p-4 animate-fade-in">
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
        <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex justify-center">
            <div className="w-full max-w-3xl px-4">
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
    </div>
  );
}
