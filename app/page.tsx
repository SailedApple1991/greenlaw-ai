"use client";

import { useState, useRef, useEffect } from "react";
import ChatBubble from "@/components/ChatBubble";
import Header from "@/components/Header";
import MessageInput from "@/components/MessageInput";
import { useChatHistory } from "@/lib/useChatHistory";
import { loadChatHistory, saveChatHistory, getSessionId } from "@/lib/chatStorage";

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

// Default welcome messages (only shown if no saved history)
const DEFAULT_MESSAGES: Message[] = [
  {
    id: "1",
    role: "assistant",
    content:
      'The key regulations for industrial emissions in the EU are primarily governed by the Industrial Emissions Directive (IED).\n\nSpecifically, <span class="quote-ref" data-ref="0">Directive 2010/75/EU</span> establishes the main principles for the permitting and control of industrial installations. This directive aims to prevent and control pollution from large industrial and agricultural activities. It requires installations to operate under a permit with conditions based on the Best Available Techniques (BAT).',
    references: [
      {
        text: "Directive 2010/75/EU",
        tooltip:
          "Directive 2010/75/EU of the European Parliament and of the Council of 24 November 2010 on industrial emissions (integrated pollution prevention and control)",
      },
    ],
    citation:
      "European Parliament & Council of the European Union. (2010). <i>Directive 2010/75/EU of the European Parliament and of the Council of 24 November 2010 on industrial emissions (integrated pollution prevention and control)</i>. Official Journal of the European Union, L 334/17.",
  },
  {
    id: "2",
    role: "user",
    content:
      "What are the key regulations for industrial emissions in the European Union?",
  },
  {
    id: "3",
    role: "assistant",
    content:
      'Of course. In addition to the IED, another landmark case is <span class="quote-ref" data-ref="0">Case C-59/89</span>. This case clarified that environmental protection requirements must be integrated into the definition and implementation of other EU policies.',
    references: [
      {
        text: "Case C-59/89",
        tooltip:
          'Commission v Germany (1991) ECR I-2607, also known as the "Grosskrotzenburg" case.',
      },
    ],
    citation:
      "Court of Justice of the European Communities. (1991). <i>Case C-59/89, Commission of the European Communities v Federal Republic of Germany (Grosskrotzenburg power station)</i>. ECR I-2607.",
  },
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);

  // Initialize chat history hook
  const { clear: clearHistory } = useChatHistory(messages, setMessages, {
    autoSave: true,
    autoLoad: false, // We'll load manually to show default messages if empty
  });

  // Load chat history on mount
  useEffect(() => {
    if (!hasLoadedHistory) {
      const savedMessages = loadChatHistory();
      if (savedMessages.length > 0) {
        setMessages(savedMessages);
      } else {
        // Only show default messages if no saved history
        setMessages(DEFAULT_MESSAGES);
      }
      setHasLoadedHistory(true);
    }
  }, [hasLoadedHistory]);

  // Auto-save messages when they change
  useEffect(() => {
    if (hasLoadedHistory && messages.length > 0) {
      const timeoutId = setTimeout(() => {
        saveChatHistory(messages);
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
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const aiMessage: Message = await response.json();
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

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden">
      <div className="layout-container flex h-full grow flex-col">
        <Header onClearChat={clearHistory} />

        <main className="flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col w-full max-w-3xl flex-1 px-4">
            <div className="flex-grow space-y-6">
              {messages.map((message, index) => (
                <ChatBubble
                  key={message.id}
                  message={message}
                  delay={index * 0.2}
                />
              ))}
              {isLoading && (
                <div className="flex items-end gap-3 p-4">
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

            <MessageInput
              value={input}
              onChange={setInput}
              onSend={handleSend}
              disabled={isLoading}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
