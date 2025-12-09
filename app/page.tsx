"use client";

import { useState, useRef, useEffect } from "react";
import ChatBubble from "@/components/ChatBubble";
import Header from "@/components/Header";
import MessageInput from "@/components/MessageInput";
import LandingView from "@/components/LandingView";
import Sidebar from "@/components/Sidebar";
import { useChatHistory } from "@/lib/useChatHistory";
import {
  loadChatHistory,
  saveChatHistory,
  getSessionId,
  getUserId,
  clearChatHistory,
  getAllSessions,
  getCurrentSessionId,
  createNewSession,
  switchSession,
  deleteSession,
  ChatSession,
} from "@/lib/chatStorage";

export interface Reference {
  text: string;
  tooltip: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  references?: Reference[];
  citation?: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Initialize chat history hook
  const { clear: clearHistoryHook } = useChatHistory(messages, setMessages, {
    autoSave: true,
    autoLoad: false,
  });

  // Refresh sessions list
  const refreshSessions = () => {
    setSessions(getAllSessions());
  };

  // Clear history and return to landing
  const handleClearChat = () => {
    clearChatHistory();
    setMessages([]);
    setCurrentSessionId(null);
    refreshSessions();
  };

  // Handle new chat from sidebar - save current and start fresh
  const handleNewChat = () => {
    // Current messages are already auto-saved
    // Create new session
    const newId = createNewSession();
    setCurrentSessionId(newId);
    setMessages([]);
    refreshSessions();
  };

  // Handle selecting a session from sidebar
  const handleSelectSession = (sessionId: string) => {
    const sessionMessages = switchSession(sessionId);
    setMessages(sessionMessages);
    setCurrentSessionId(sessionId);
    setIsSidebarOpen(false);
  };

  // Handle deleting a session
  const handleDeleteSession = (sessionId: string) => {
    deleteSession(sessionId);
    // If deleted current session, clear messages
    if (sessionId === currentSessionId) {
      setMessages([]);
      setCurrentSessionId(null);
    }
    refreshSessions();
  };

  // Load chat history on mount
  useEffect(() => {
    if (!hasLoadedHistory) {
      // Load all sessions
      const allSessions = getAllSessions();
      setSessions(allSessions);

      // Load current session
      const currentId = getCurrentSessionId();
      setCurrentSessionId(currentId);

      const savedMessages = loadChatHistory();
      if (savedMessages.length > 0) {
        setMessages(savedMessages);
      }
      // No default messages - show landing page instead
      setHasLoadedHistory(true);
    }
  }, [hasLoadedHistory]);

  // Auto-save messages when they change
  useEffect(() => {
    if (hasLoadedHistory && messages.length > 0) {
      const timeoutId = setTimeout(() => {
        saveChatHistory(messages);
        // Refresh sessions list to update titles
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

    try {
      // Get session ID (from localStorage or generate new)
      const sessionId = getSessionId();

      // Prepare conversation history (exclude current message)
      const conversationHistory = messages.map(msg => ({
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
      // Use unique ID for each message (backend returns session ID, not message ID)
      const aiMessage: Message = {
        ...aiResponse,
        id: `ai-${Date.now()}`,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      // Show error message to user
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I apologize, but I encountered an error processing your request. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Determine if we should show landing page
  // Show landing when: not loaded yet, or no messages at all
  const isLandingMode = !hasLoadedHistory || messages.length === 0;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNewChat={handleNewChat}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {isLandingMode && !isLoading ? (
          // Landing page view
          <div className="flex-1 flex flex-col bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 overflow-y-auto">
            {/* Mobile menu button for landing */}
            <div className="lg:hidden p-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Open menu"
              >
                <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
            <LandingView onSend={handleSend} disabled={isLoading} />
          </div>
        ) : (
          // Chat view
          <div className="flex-1 flex flex-col overflow-hidden">
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
        )}
      </div>
    </div>
  );
}
