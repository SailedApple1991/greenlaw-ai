"use client";

import { useEffect } from "react";
import { Plus, X, MessageSquare, User, Settings, BookOpen } from "lucide-react";

// Mock chat history data
const MOCK_HISTORY = {
  today: [
    { id: "1", title: "EU ETS Carbon Trading", preview: "Explain the EU Emissions..." },
    { id: "2", title: "CSRD Reporting Requirements", preview: "What are the CSRD..." },
  ],
  yesterday: [
    { id: "3", title: "EU Taxonomy Regulation", preview: "How does the EU Taxonomy..." },
  ],
  previous7Days: [
    { id: "4", title: "Environmental Impact Assessment", preview: "What is an EIA..." },
    { id: "5", title: "CBAM Implementation", preview: "Carbon Border Adjustment..." },
  ],
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onSelectChat?: (chatId: string) => void;
}

export default function Sidebar({ isOpen, onClose, onNewChat, onSelectChat }: SidebarProps) {
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
    onClose();
  };

  const handleSelectChat = (chatId: string) => {
    onSelectChat?.(chatId);
    onClose();
  };

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
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">GreenLaw AI</span>
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
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {/* Today */}
          {MOCK_HISTORY.today.length > 0 && (
            <HistorySection title="Today" chats={MOCK_HISTORY.today} onSelect={handleSelectChat} />
          )}

          {/* Yesterday */}
          {MOCK_HISTORY.yesterday.length > 0 && (
            <HistorySection title="Yesterday" chats={MOCK_HISTORY.yesterday} onSelect={handleSelectChat} />
          )}

          {/* Previous 7 Days */}
          {MOCK_HISTORY.previous7Days.length > 0 && (
            <HistorySection title="Previous 7 Days" chats={MOCK_HISTORY.previous7Days} onSelect={handleSelectChat} />
          )}
        </div>

        {/* Bottom Section - User/Settings */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-800">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
              <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Guest User</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Settings</p>
            </div>
            <Settings className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </aside>
    </>
  );
}

// History Section Component
function HistorySection({
  title,
  chats,
  onSelect,
}: {
  title: string;
  chats: { id: string; title: string; preview: string }[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="mb-4">
      <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        {title}
      </h3>
      <ul className="space-y-1">
        {chats.map((chat) => (
          <li key={chat.id}>
            <button
              onClick={() => onSelect(chat.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors text-left group"
            >
              <MessageSquare className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {chat.title}
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
