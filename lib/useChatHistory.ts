/**
 * React hook for managing chat history persistence
 */

import { useEffect, useCallback } from "react";
import { Message } from "@/app/page";
import {
  saveChatHistory,
  loadChatHistory,
  clearChatHistory,
  getSessionId,
  getStorageInfo,
} from "./chatStorage";

interface UseChatHistoryOptions {
  autoSave?: boolean; // Auto-save on messages change
  autoLoad?: boolean; // Auto-load on mount
}

export function useChatHistory(
  messages: Message[],
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  options: UseChatHistoryOptions = {}
) {
  const { autoSave = true, autoLoad = true } = options;

  // Load chat history on mount
  useEffect(() => {
    if (autoLoad && messages.length === 0) {
      const savedMessages = loadChatHistory();
      if (savedMessages.length > 0) {
        setMessages(savedMessages);
      }
    }
  }, []); // Only run on mount

  // Auto-save when messages change
  useEffect(() => {
    if (autoSave && messages.length > 0) {
      // Debounce saves to avoid excessive writes
      const timeoutId = setTimeout(() => {
        saveChatHistory(messages);
      }, 500); // Wait 500ms after last change

      return () => clearTimeout(timeoutId);
    }
  }, [messages, autoSave]);

  // Manual save function
  const save = useCallback(() => {
    saveChatHistory(messages);
  }, [messages]);

  // Clear function
  const clear = useCallback(() => {
    clearChatHistory();
    setMessages([]);
  }, [setMessages]);

  // Get session info
  const getSessionInfo = useCallback(() => {
    return {
      sessionId: getSessionId(),
      ...getStorageInfo(),
    };
  }, []);

  return {
    save,
    clear,
    load: () => {
      const savedMessages = loadChatHistory();
      if (savedMessages.length > 0) {
        setMessages(savedMessages);
      }
    },
    getSessionInfo,
  };
}

