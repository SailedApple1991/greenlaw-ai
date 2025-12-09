/**
 * Chat storage utilities for persisting conversation history
 * Uses localStorage to save/load chat messages
 * Supports multiple chat sessions with history
 */

import { Message } from "@/lib/types";

const STORAGE_KEY = "greenlaw_chat_sessions";
const OLD_STORAGE_KEY = "greenlaw_chat_history"; // For migration
const MAX_MESSAGES_PER_SESSION = 100;
const MAX_SESSIONS = 50;
const STORAGE_VERSION = "2.0";

/**
 * Single chat session
 */
export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

/**
 * All sessions storage structure
 */
interface StoredSessions {
  version: string;
  currentSessionId: string | null;
  sessions: ChatSession[];
}

// Legacy format for migration
interface LegacyStoredChat {
  version: string;
  messages: Message[];
  lastUpdated: number;
  sessionId: string;
}

/**
 * Generate a new session ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate or retrieve a session ID (legacy support)
 */
export function getSessionId(): string {
  if (typeof window === "undefined") return "";

  let sessionId = localStorage.getItem("greenlaw_session_id");
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem("greenlaw_session_id", sessionId);
  }
  return sessionId;
}

/**
 * Generate or retrieve a user ID
 */
export function getUserId(): string {
  if (typeof window === "undefined") return "";

  const urlParams = new URLSearchParams(window.location.search);
  const urlUserId = urlParams.get('user_id');
  if (urlUserId) {
    localStorage.setItem("greenlaw_user_id", urlUserId);
    return urlUserId;
  }

  let userId = localStorage.getItem("greenlaw_user_id");
  if (!userId) {
    userId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    localStorage.setItem("greenlaw_user_id", userId);
  }
  return userId;
}

/**
 * Clear user ID
 */
export function clearUserId(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("greenlaw_user_id");
}

/**
 * Generate a title from the first user message
 */
export function generateSessionTitle(messages: Message[]): string {
  const firstUserMessage = messages.find(m => m.role === "user");
  if (!firstUserMessage) return "New Chat";

  const content = firstUserMessage.content.trim();
  if (content.length <= 30) return content;
  return content.substring(0, 30) + "...";
}

/**
 * Get stored sessions data
 */
function getStoredSessions(): StoredSessions {
  if (typeof window === "undefined") {
    return { version: STORAGE_VERSION, currentSessionId: null, sessions: [] };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored) as StoredSessions;
      if (data.version === STORAGE_VERSION) {
        return data;
      }
    }

    // Try to migrate from old format
    const oldStored = localStorage.getItem(OLD_STORAGE_KEY);
    if (oldStored) {
      const oldData = JSON.parse(oldStored) as LegacyStoredChat;
      if (oldData.messages && oldData.messages.length > 0) {
        const migratedSession: ChatSession = {
          id: oldData.sessionId || generateSessionId(),
          title: generateSessionTitle(oldData.messages),
          messages: oldData.messages,
          createdAt: oldData.lastUpdated - 3600000, // Approximate
          updatedAt: oldData.lastUpdated,
        };
        const newData: StoredSessions = {
          version: STORAGE_VERSION,
          currentSessionId: migratedSession.id,
          sessions: [migratedSession],
        };
        saveStoredSessions(newData);
        localStorage.removeItem(OLD_STORAGE_KEY);
        console.info("Migrated chat history to new multi-session format");
        return newData;
      }
    }

    return { version: STORAGE_VERSION, currentSessionId: null, sessions: [] };
  } catch (error) {
    console.error("Failed to load sessions:", error);
    return { version: STORAGE_VERSION, currentSessionId: null, sessions: [] };
  }
}

/**
 * Save sessions data to localStorage
 */
function saveStoredSessions(data: StoredSessions): void {
  if (typeof window === "undefined") return;

  try {
    // Limit sessions count
    if (data.sessions.length > MAX_SESSIONS) {
      data.sessions = data.sessions
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, MAX_SESSIONS);
    }

    // Limit messages per session
    data.sessions = data.sessions.map(session => ({
      ...session,
      messages: session.messages.slice(-MAX_MESSAGES_PER_SESSION),
    }));

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save sessions:", error);
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      // Remove oldest sessions to free space
      data.sessions = data.sessions
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, Math.floor(MAX_SESSIONS / 2));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (retryError) {
        console.error("Failed to save after cleanup:", retryError);
      }
    }
  }
}

/**
 * Get all chat sessions
 */
export function getAllSessions(): ChatSession[] {
  const data = getStoredSessions();
  return data.sessions.sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * Get current session ID
 */
export function getCurrentSessionId(): string | null {
  const data = getStoredSessions();
  return data.currentSessionId;
}

/**
 * Get current session
 */
export function getCurrentSession(): ChatSession | null {
  const data = getStoredSessions();
  if (!data.currentSessionId) return null;
  return data.sessions.find(s => s.id === data.currentSessionId) || null;
}

/**
 * Create a new session and set it as current
 * Returns the new session ID
 */
export function createNewSession(): string {
  const data = getStoredSessions();
  const newSessionId = generateSessionId();

  // Update localStorage session ID for backend communication
  localStorage.setItem("greenlaw_session_id", newSessionId);

  // Don't create empty session yet, just update current ID
  data.currentSessionId = newSessionId;
  saveStoredSessions(data);

  return newSessionId;
}

/**
 * Save messages to current session
 */
export function saveCurrentSession(messages: Message[]): void {
  if (typeof window === "undefined") return;
  if (messages.length === 0) return;

  const data = getStoredSessions();
  let sessionId = data.currentSessionId;

  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem("greenlaw_session_id", sessionId);
    data.currentSessionId = sessionId;
  }

  const existingIndex = data.sessions.findIndex(s => s.id === sessionId);
  const now = Date.now();

  if (existingIndex >= 0) {
    // Update existing session
    data.sessions[existingIndex] = {
      ...data.sessions[existingIndex],
      messages,
      title: generateSessionTitle(messages),
      updatedAt: now,
    };
  } else {
    // Create new session
    data.sessions.push({
      id: sessionId,
      title: generateSessionTitle(messages),
      messages,
      createdAt: now,
      updatedAt: now,
    });
  }

  saveStoredSessions(data);
}

/**
 * Switch to a different session
 * Returns the messages of that session
 */
export function switchSession(sessionId: string): Message[] {
  const data = getStoredSessions();
  const session = data.sessions.find(s => s.id === sessionId);

  if (!session) {
    console.warn(`Session ${sessionId} not found`);
    return [];
  }

  data.currentSessionId = sessionId;
  localStorage.setItem("greenlaw_session_id", sessionId);
  saveStoredSessions(data);

  return session.messages;
}

/**
 * Delete a session
 */
export function deleteSession(sessionId: string): void {
  const data = getStoredSessions();
  data.sessions = data.sessions.filter(s => s.id !== sessionId);

  // If deleted current session, clear current
  if (data.currentSessionId === sessionId) {
    data.currentSessionId = null;
  }

  saveStoredSessions(data);
}

/**
 * Clear all chat history (all sessions)
 */
export function clearChatHistory(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(OLD_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear chat history:", error);
  }
}

// ============================================
// Legacy functions for backward compatibility
// ============================================

/**
 * Load messages from current session (legacy API)
 */
export function loadChatHistory(): Message[] {
  const session = getCurrentSession();
  return session?.messages || [];
}

/**
 * Save messages to current session (legacy API)
 */
export function saveChatHistory(messages: Message[]): void {
  saveCurrentSession(messages);
}

/**
 * Get storage usage info (for debugging)
 */
export function getStorageInfo(): {
  sessionId: string;
  messageCount: number;
  lastUpdated: number | null;
  storageSize: number;
  sessionCount: number;
} {
  if (typeof window === "undefined") {
    return {
      sessionId: "",
      messageCount: 0,
      lastUpdated: null,
      storageSize: 0,
      sessionCount: 0,
    };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const data = getStoredSessions();
    const currentSession = getCurrentSession();

    return {
      sessionId: data.currentSessionId || "",
      messageCount: currentSession?.messages.length || 0,
      lastUpdated: currentSession?.updatedAt || null,
      storageSize: stored ? new Blob([stored]).size : 0,
      sessionCount: data.sessions.length,
    };
  } catch (error) {
    return {
      sessionId: "",
      messageCount: 0,
      lastUpdated: null,
      storageSize: 0,
      sessionCount: 0,
    };
  }
}

/**
 * Categorize sessions by time period
 */
export function categorizeSessionsByTime(sessions: ChatSession[]): {
  today: ChatSession[];
  yesterday: ChatSession[];
  previous7Days: ChatSession[];
  older: ChatSession[];
} {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
  const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000;

  return {
    today: sessions.filter(s => s.updatedAt >= todayStart),
    yesterday: sessions.filter(s => s.updatedAt >= yesterdayStart && s.updatedAt < todayStart),
    previous7Days: sessions.filter(s => s.updatedAt >= weekStart && s.updatedAt < yesterdayStart),
    older: sessions.filter(s => s.updatedAt < weekStart),
  };
}
