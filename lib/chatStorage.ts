/**
 * Chat storage utilities for persisting conversation history
 * Uses localStorage to save/load chat messages
 */

import { Message } from "@/app/page";

const STORAGE_KEY = "greenlaw_chat_history";
const MAX_MESSAGES = 100; // Limit stored messages to prevent storage overflow
const STORAGE_VERSION = "1.0";

interface StoredChat {
  version: string;
  messages: Message[];
  lastUpdated: number;
  sessionId: string;
}

/**
 * Generate or retrieve a session ID
 * This helps identify the conversation session
 */
export function getSessionId(): string {
  if (typeof window === "undefined") return "";

  let sessionId = localStorage.getItem("greenlaw_session_id");
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("greenlaw_session_id", sessionId);
  }
  return sessionId;
}

/**
 * Generate or retrieve a user ID
 * Supports URL parameter for easy integration (e.g., ?user_id=john)
 * Falls back to auto-generated anonymous ID stored in localStorage
 */
export function getUserId(): string {
  if (typeof window === "undefined") return "";

  // Priority 1: URL parameter (for easy testing and integration)
  const urlParams = new URLSearchParams(window.location.search);
  const urlUserId = urlParams.get('user_id');
  if (urlUserId) {
    localStorage.setItem("greenlaw_user_id", urlUserId);
    return urlUserId;
  }

  // Priority 2: Existing localStorage value
  let userId = localStorage.getItem("greenlaw_user_id");
  if (!userId) {
    // Auto-generate anonymous user ID
    userId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    localStorage.setItem("greenlaw_user_id", userId);
  }
  return userId;
}

/**
 * Clear user ID (optional utility)
 */
export function clearUserId(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("greenlaw_user_id");
}

/**
 * Save messages to localStorage
 */
export function saveChatHistory(messages: Message[]): void {
  if (typeof window === "undefined") return;
  
  try {
    // Limit message count to prevent storage issues
    const messagesToSave = messages.slice(-MAX_MESSAGES);
    
    const storedChat: StoredChat = {
      version: STORAGE_VERSION,
      messages: messagesToSave,
      lastUpdated: Date.now(),
      sessionId: getSessionId(),
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedChat));
  } catch (error) {
    console.error("Failed to save chat history:", error);
    // If storage is full, try to clear old data
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      clearOldChatHistory();
      // Retry with fewer messages
      try {
        const messagesToSave = messages.slice(-Math.floor(MAX_MESSAGES / 2));
        const storedChat: StoredChat = {
          version: STORAGE_VERSION,
          messages: messagesToSave,
          lastUpdated: Date.now(),
          sessionId: getSessionId(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(storedChat));
      } catch (retryError) {
        console.error("Failed to save chat history after cleanup:", retryError);
      }
    }
  }
}

/**
 * Load messages from localStorage
 */
export function loadChatHistory(): Message[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const storedChat: StoredChat = JSON.parse(stored);
    
    // Validate version and structure
    if (storedChat.version !== STORAGE_VERSION) {
      console.warn("Chat history version mismatch, clearing old data");
      clearChatHistory();
      return [];
    }
    
    // Check if data is too old (optional: clear after 30 days)
    const DAYS_TO_KEEP = 30;
    const daysSinceUpdate = (Date.now() - storedChat.lastUpdated) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate > DAYS_TO_KEEP) {
      console.info("Chat history is older than 30 days, clearing");
      clearChatHistory();
      return [];
    }
    
    return storedChat.messages || [];
  } catch (error) {
    console.error("Failed to load chat history:", error);
    return [];
  }
}

/**
 * Clear chat history from localStorage
 */
export function clearChatHistory(): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
    // Optionally clear session ID to start fresh
    // localStorage.removeItem("greenlaw_session_id");
  } catch (error) {
    console.error("Failed to clear chat history:", error);
  }
}

/**
 * Clear old chat history to free up space
 */
function clearOldChatHistory(): void {
  try {
    // Keep only the most recent 50 messages
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const storedChat: StoredChat = JSON.parse(stored);
      if (storedChat.messages.length > 50) {
        storedChat.messages = storedChat.messages.slice(-50);
        storedChat.lastUpdated = Date.now();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(storedChat));
      }
    }
  } catch (error) {
    console.error("Failed to clear old chat history:", error);
  }
}

/**
 * Get storage usage info (for debugging)
 */
export function getStorageInfo(): {
  sessionId: string;
  messageCount: number;
  lastUpdated: number | null;
  storageSize: number;
} {
  if (typeof window === "undefined") {
    return {
      sessionId: "",
      messageCount: 0,
      lastUpdated: null,
      storageSize: 0,
    };
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return {
        sessionId: getSessionId(),
        messageCount: 0,
        lastUpdated: null,
        storageSize: 0,
      };
    }
    
    const storedChat: StoredChat = JSON.parse(stored);
    return {
      sessionId: storedChat.sessionId || getSessionId(),
      messageCount: storedChat.messages?.length || 0,
      lastUpdated: storedChat.lastUpdated || null,
      storageSize: new Blob([stored]).size,
    };
  } catch (error) {
    return {
      sessionId: getSessionId(),
      messageCount: 0,
      lastUpdated: null,
      storageSize: 0,
    };
  }
}









