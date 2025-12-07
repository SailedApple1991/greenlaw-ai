"use client";

import { useState } from "react";
import MessageInput from "./MessageInput";

interface LandingViewProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

const QUICK_PROMPTS = [
  { label: "EU ETS", prompt: "Explain the EU Emissions Trading System and its key requirements" },
  { label: "Taxonomy", prompt: "What is the EU Taxonomy Regulation and how does it classify sustainable activities?" },
  { label: "CSRD", prompt: "Explain CSRD reporting requirements for companies" },
  { label: "CBAM", prompt: "What is the Carbon Border Adjustment Mechanism?" },
];

export default function LandingView({ onSend, disabled }: LandingViewProps) {
  const [input, setInput] = useState("");

  const handleSend = (message: string) => {
    if (message.trim()) {
      onSend(message);
      setInput("");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 animate-fade-in">
      {/* Logo and Title */}
      <div className="mb-10 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg">
          <svg
            className="w-10 h-10 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
          GreenLaw AI
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400">
          Environmental Law & Policy Assistant
        </p>
      </div>

      {/* Large Input */}
      <div className="w-full max-w-2xl mb-8">
        <MessageInput
          value={input}
          onChange={setInput}
          onSend={handleSend}
          disabled={disabled}
          variant="landing"
          placeholder="Ask about EU environmental regulations..."
        />
      </div>

      {/* Quick Chips */}
      <div className="flex flex-wrap gap-3 justify-center max-w-2xl">
        {QUICK_PROMPTS.map((chip) => (
          <button
            key={chip.label}
            onClick={() => onSend(chip.prompt)}
            disabled={disabled}
            className="px-5 py-2.5 rounded-full bg-gray-100 dark:bg-gray-800
                       hover:bg-emerald-100 dark:hover:bg-emerald-900/30
                       hover:border-emerald-300 dark:hover:border-emerald-700
                       text-sm font-medium text-gray-700 dark:text-gray-300
                       border border-gray-200 dark:border-gray-700
                       transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Subtle footer hint */}
      <p className="mt-12 text-xs text-gray-400 dark:text-gray-600">
        Powered by Sustain Nexus • Ask questions about EU environmental law
      </p>
    </div>
  );
}
