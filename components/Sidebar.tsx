"use client";

import { useEffect } from "react";
import { Plus, X, BookOpen, MessageSquare, Trash2 } from "lucide-react";
import { ChatSession, categorizeSessionsByTime } from "@/lib/chatStorage";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onDeleteSession?: (id: string) => void;
}

interface HistorySectionProps {
  title: string;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onDeleteSession?: (id: string) => void;
}

function HistorySection({
  title,
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
}: HistorySectionProps) {
  if (sessions.length === 0) return null;

  return (
    <div className="mb-4">
      <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        {title}
      </h3>
      <div className="space-y-1">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`group flex items-center gap-2 px-3 py-2 mx-1 rounded-lg cursor-pointer transition-colors ${
              session.id === currentSessionId
                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
            }`}
            onClick={() => onSelectSession(session.id)}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span className="flex-1 text-sm truncate">{session.title}</span>
            {onDeleteSession && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(session.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-all"
                aria-label="Delete chat"
              >
                <Trash2 className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Sidebar({
  isOpen,
  onClose,
  onNewChat,
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
}: SidebarProps) {
  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleNewChat = () => {
    onNewChat();
  };

  // Categorize sessions by time
  const categorized = categorizeSessionsByTime(sessions);

  const hasAnySessions = sessions.length > 0;

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-[280px] bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-50 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header with Close button (mobile only) */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <svg
              className="w-8 h-8"
              viewBox="0 0 84.785 73.288"
              xmlns="http://www.w3.org/2000/svg"
            >
              <polygon
                points="48.622 0 48.622 72.327 84.785 36.164 48.622 0"
                fill="#9dd3c0"
              />
              <polygon
                points="60.741 37.124 24.577 .96 24.577 25.538 36.164 37.124 24.577 48.71 24.577 73.288 60.741 37.124"
                fill="#1ba577"
              />
              <polygon
                points="0 .96 0 12.679 24.445 37.124 0 61.569 0 73.288 24.577 48.71 24.577 25.538 0 .96"
                fill="#1ba577"
              />
            </svg>
            <span className="font-semibold font-brand text-lg">
              <span className="text-[#1ba577]">Sustain</span>
              <span className="text-[#9dd3c0]">Nexus</span>
            </span>
          </div>
          {/* Close button - mobile only */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-3 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            New Chat
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {hasAnySessions ? (
            <>
              <HistorySection
                title="Today"
                sessions={categorized.today}
                currentSessionId={currentSessionId}
                onSelectSession={onSelectSession}
                onDeleteSession={onDeleteSession}
              />
              <HistorySection
                title="Yesterday"
                sessions={categorized.yesterday}
                currentSessionId={currentSessionId}
                onSelectSession={onSelectSession}
                onDeleteSession={onDeleteSession}
              />
              <HistorySection
                title="Previous 7 Days"
                sessions={categorized.previous7Days}
                currentSessionId={currentSessionId}
                onSelectSession={onSelectSession}
                onDeleteSession={onDeleteSession}
              />
              <HistorySection
                title="Older"
                sessions={categorized.older}
                currentSessionId={currentSessionId}
                onSelectSession={onSelectSession}
                onDeleteSession={onDeleteSession}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No chat history yet
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Start a new conversation
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
