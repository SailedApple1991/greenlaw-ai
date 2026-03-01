import Link from "next/link";
import { Menu } from "lucide-react";

interface HeaderProps {
  onClearChat?: () => void;
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export default function Header({ onClearChat, onMenuClick, showMenuButton = true }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-gradient-to-b from-emerald-50/80 to-transparent dark:from-emerald-900/20 dark:to-transparent pt-4 pb-4">
      <div className="px-4 flex justify-center">
        <div className="layout-content-container flex flex-col w-full max-w-3xl">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              {/* Mobile Menu Button */}
              {showMenuButton && (
                <button
                  onClick={onMenuClick}
                  className="lg:hidden p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  aria-label="Open menu"
                >
                  <Menu className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                </button>
              )}

              <Link href="/" className="flex items-center gap-3 group">
                <svg className="w-10 h-10 lg:w-12 lg:h-12 transition-transform group-hover:scale-105" viewBox="0 0 84.785 73.288" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="48.622 0 48.622 72.327 84.785 36.164 48.622 0" fill="#9dd3c0"/>
                  <polygon points="60.741 37.124 24.577 .96 24.577 25.538 36.164 37.124 24.577 48.71 24.577 73.288 60.741 37.124" fill="#1ba577"/>
                  <polygon points="0 .96 0 12.679 24.445 37.124 0 61.569 0 73.288 24.577 48.71 24.577 25.538 0 .96" fill="#1ba577"/>
                </svg>
                <div className="flex flex-col">
                  <p className="text-xl lg:text-2xl font-bold leading-tight tracking-tight font-brand">
                    <span className="text-[#1ba577]">Sustain</span><span className="text-[#9dd3c0]">Nexus</span>
                  </p>
                  <p className="text-[#333333] dark:text-gray-300 text-xs lg:text-sm font-normal leading-normal hidden sm:block font-display">
                    ESG Regulatory Intelligence
                  </p>
                </div>
              </Link>
            </div>
            {onClearChat && (
              <button
                onClick={onClearChat}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Clear chat history"
              >
                <span className="material-symbols-outlined text-lg">
                  delete_outline
                </span>
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
