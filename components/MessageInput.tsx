import { KeyboardEvent } from "react";

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message: string) => void;
  disabled?: boolean;
  variant?: "chat" | "landing";
  placeholder?: string;
}

export default function MessageInput({
  value,
  onChange,
  onSend,
  disabled = false,
  variant = "chat",
  placeholder = "Type your message...",
}: MessageInputProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend(value);
    }
  };

  const handleSendClick = () => {
    onSend(value);
  };

  const canSend = !disabled && value.trim().length > 0;

  const isLanding = variant === "landing";

  return (
    <div className={isLanding ? "" : "sticky bottom-0 bg-background-light dark:bg-background-dark py-4"}>
      <div className={`flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 ${
        isLanding
          ? "px-6 py-4 shadow-xl"
          : "px-4 py-2 shadow-lg"
      }`}>
        <label className={`flex flex-col min-w-40 flex-1 ${isLanding ? "h-14" : "h-12"}`}>
          <div className="flex w-full flex-1 items-stretch rounded-xl h-full">
            <input
              type="text"
              className={`form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#333333] dark:text-white focus:outline-0 focus:ring-0 border-none bg-transparent h-full placeholder:text-gray-500 dark:placeholder-gray-500 px-2 font-normal leading-normal ${
                isLanding ? "text-lg" : "text-base"
              }`}
              placeholder={placeholder}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
            />
            <div className="flex border-none items-center justify-center pr-2">
              <button
                className={`flex items-center justify-center rounded-full transition-all ${
                  isLanding ? "p-3" : "p-2"
                } ${
                  canSend
                    ? "bg-emerald-500 hover:bg-emerald-600 cursor-pointer shadow-md"
                    : "bg-gray-300 dark:bg-gray-600 cursor-not-allowed"
                }`}
                onClick={handleSendClick}
                disabled={!canSend}
                aria-label="Send message"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className={`${isLanding ? "w-6 h-6" : "w-5 h-5"} ${
                    canSend ? "text-white" : "text-gray-500"
                  }`}
                >
                  <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
              </button>
            </div>
          </div>
        </label>
      </div>
    </div>
  );
}
