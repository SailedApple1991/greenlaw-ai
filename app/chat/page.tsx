"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LandingView from "@/components/LandingView";
import Sidebar from "@/components/Sidebar";
import {
  getAllSessions,
  createNewSession,
  deleteSession,
  ChatSession,
} from "@/lib/chatStorage";
import InvitationModal from "@/components/InvitationModal";
import {
  hasReachedLimit,
  incrementQuestionCount,
  setUnlocked,
  QUESTION_LIMIT_VALUE,
} from "@/lib/questionLimit";

// Re-export types for backward compatibility
export type { Message, Reference } from "@/lib/types";

export default function Home() {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [showInvitationModal, setShowInvitationModal] = useState(false);

  // Refresh sessions list
  const refreshSessions = () => {
    setSessions(getAllSessions());
  };

  // Load sessions on mount
  useEffect(() => {
    if (!hasLoaded) {
      refreshSessions();
      setHasLoaded(true);
    }
  }, [hasLoaded]);

  // Handle new chat - create new session and navigate
  const handleNewChat = () => {
    const newId = createNewSession();
    setIsSidebarOpen(false);
    router.push(`/chat/${newId}`);
  };

  // Handle selecting a session from sidebar
  const handleSelectSession = (sessionId: string) => {
    setIsSidebarOpen(false);
    router.push(`/chat/${sessionId}`);
  };

  // Handle deleting a session
  const handleDeleteSession = (sessionId: string) => {
    deleteSession(sessionId);
    refreshSessions();
  };

  // Handle invitation success
  const handleInvitationSuccess = () => {
    setUnlocked();
    setShowInvitationModal(false);
  };

  // Handle send from landing - create session and navigate
  const handleSend = (message: string) => {
    if (!message.trim()) return;

    // Check question limit
    if (hasReachedLimit()) {
      setShowInvitationModal(true);
      return;
    }

    // Increment count before navigating
    incrementQuestionCount();

    // Create new session
    const newId = createNewSession();

    // Store the initial message in sessionStorage to be picked up by chat page
    sessionStorage.setItem("pendingMessage", message);

    // Navigate to chat
    router.push(`/chat/${newId}`);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNewChat={handleNewChat}
        sessions={sessions}
        currentSessionId={null}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Landing page view */}
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
          <LandingView onSend={handleSend} disabled={false} />
        </div>
      </div>
      {showInvitationModal && (
        <InvitationModal
          onSuccess={handleInvitationSuccess}
          questionsUsed={QUESTION_LIMIT_VALUE}
          questionLimit={QUESTION_LIMIT_VALUE}
        />
      )}
    </div>
  );
}
