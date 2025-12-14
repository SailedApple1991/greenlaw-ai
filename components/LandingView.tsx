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
    <div className="flex-1 flex flex-col items-center justify-center px-4 animate-fade-in">
      {/* Logo and Title */}
      <div className="mb-10 text-center">
        <svg className="w-20 h-20 mx-auto mb-6" viewBox="0 0 84.785 73.288" xmlns="http://www.w3.org/2000/svg">
          <polygon points="48.622 0 48.622 72.327 84.785 36.164 48.622 0" fill="#9dd3c0"/>
          <polygon points="60.741 37.124 24.577 .96 24.577 25.538 36.164 37.124 24.577 48.71 24.577 73.288 60.741 37.124" fill="#1ba577"/>
          <polygon points="0 .96 0 12.679 24.445 37.124 0 61.569 0 73.288 24.577 48.71 24.577 25.538 0 .96" fill="#1ba577"/>
        </svg>
        <h1 className="text-4xl font-bold mb-3">
          <span className="text-[#1ba577]">Sustain</span> <span className="text-[#9dd3c0]">Nexus</span>
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
