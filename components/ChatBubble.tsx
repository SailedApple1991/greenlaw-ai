"use client";

import { Message } from "@/lib/types";
import React, { useMemo, useCallback, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import {
  parseCitations,
  processCitationsForReact,
  ParsedReference,
} from "@/lib/parseCitations";

interface ChatBubbleProps {
  message: Message;
  delay?: number;
}

// Tooltip position types
type TooltipPosition = "top" | "bottom" | "left" | "right";

// Superscript Citation with Smart Tooltip
function CitationSup({
  number,
  label,
  tooltipText,
}: {
  number: string;
  label?: string;
  tooltipText?: string;
}) {
  const displayTooltip = tooltipText || `Reference ${number}`;
  const badgeRef = useRef<HTMLElement>(null);
  const [position, setPosition] = useState<TooltipPosition>("top");
  const [isVisible, setIsVisible] = useState(false);

  const calculatePosition = useCallback(() => {
    if (!badgeRef.current) return;

    const rect = badgeRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const tooltipWidth = 320;
    const tooltipHeight = 120;
    const margin = 20;

    const spaceTop = rect.top;
    const spaceBottom = viewportHeight - rect.bottom;
    const spaceLeft = rect.left;
    const spaceRight = viewportWidth - rect.right;

    if (spaceTop < tooltipHeight + margin) {
      setPosition("bottom");
      return;
    }
    if (spaceBottom < tooltipHeight + margin) {
      setPosition("top");
      return;
    }
    if (spaceLeft < tooltipWidth / 2 + margin) {
      if (spaceRight >= tooltipWidth + margin) {
        setPosition("right");
        return;
      }
    }
    if (spaceRight < tooltipWidth / 2 + margin) {
      if (spaceLeft >= tooltipWidth + margin) {
        setPosition("left");
        return;
      }
    }
    setPosition("top");
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsVisible(false);
  }, []);

  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});

  const updateTooltipStyle = useCallback(() => {
    if (!badgeRef.current) return;

    const rect = badgeRef.current.getBoundingClientRect();
    const tooltipWidth = 320;
    const tooltipHeight = 120;
    const gap = 8;

    const style: React.CSSProperties = {
      position: "fixed",
      width: tooltipWidth,
      zIndex: 9999,
    };

    switch (position) {
      case "top":
        style.left = rect.left + rect.width / 2 - tooltipWidth / 2;
        style.top = rect.top - tooltipHeight - gap;
        if ((style.left as number) < 10) style.left = 10;
        if ((style.left as number) + tooltipWidth > window.innerWidth - 10) {
          style.left = window.innerWidth - tooltipWidth - 10;
        }
        break;
      case "bottom":
        style.left = rect.left + rect.width / 2 - tooltipWidth / 2;
        style.top = rect.bottom + gap;
        if ((style.left as number) < 10) style.left = 10;
        if ((style.left as number) + tooltipWidth > window.innerWidth - 10) {
          style.left = window.innerWidth - tooltipWidth - 10;
        }
        break;
      case "left":
        style.left = rect.left - tooltipWidth - gap;
        style.top = rect.top + rect.height / 2 - tooltipHeight / 2;
        break;
      case "right":
        style.left = rect.right + gap;
        style.top = rect.top + rect.height / 2 - tooltipHeight / 2;
        break;
    }

    setTooltipStyle(style);
  }, [position]);

  const handleMouseEnter = useCallback(() => {
    calculatePosition();
    setIsVisible(true);
    setTimeout(() => updateTooltipStyle(), 0);
  }, [calculatePosition, updateTooltipStyle]);

  const getTooltipClasses = () => {
    const baseClasses =
      "pointer-events-none p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl transition-all duration-200 font-display";
    const visibilityClasses = isVisible
      ? "visible opacity-100"
      : "invisible opacity-0";
    return `${baseClasses} ${visibilityClasses}`;
  };

  const TooltipContent = () => (
    <span className={getTooltipClasses()} style={tooltipStyle}>
      <span className="font-semibold text-emerald-400 block mb-1">
        [{number}] {label || ""}
      </span>
      <span className="leading-relaxed">{displayTooltip}</span>
    </span>
  );

  // If label exists, show "Label" with superscript number
  if (label) {
    return (
      <>
        <span
          ref={badgeRef}
          className="inline cursor-pointer"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <span className="text-emerald-700 dark:text-emerald-400 font-medium text-[0.95em]">
            {label}
          </span>
          <sup className="citation-sup">{number}</sup>
        </span>
        {isVisible && <TooltipContent />}
      </>
    );
  }

  // No label - just superscript number
  return (
    <>
      <sup
        ref={badgeRef}
        className="citation-sup"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {number}
      </sup>
      {isVisible && <TooltipContent />}
    </>
  );
}

// Single Reference Item with copy functionality
function ReferenceItem({ reference }: { reference: ParsedReference }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const textToCopy = `[${reference.number}] ${reference.text}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <li
      id={`ref-${reference.number}`}
      className="relative text-sm py-2.5 px-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded transition-colors cursor-pointer group font-serif leading-relaxed border-l-2 border-emerald-400 dark:border-emerald-600 ml-1"
      onClick={handleCopy}
    >
      <span className="text-gray-600 dark:text-gray-400">
        <span className="font-display text-xs font-bold text-emerald-700 dark:text-emerald-400 mr-2">
          {reference.number}.
        </span>
        {reference.text}
      </span>

      <span className="absolute -right-2 top-1/2 -translate-y-1/2 translate-x-full whitespace-nowrap z-10">
        {copied ? (
          <span className="text-xs font-medium font-display text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-md shadow-sm animate-fade-in-out flex items-center gap-1">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Copied!
          </span>
        ) : (
          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-display text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md shadow-sm">
            Click to copy
          </span>
        )}
      </span>
    </li>
  );
}

// Backend Reference Item with copy functionality
function BackendReferenceItem({
  number,
  text,
}: {
  number: string;
  text: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const textToCopy = `[${number}] ${text}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <li
      className="relative text-sm py-2.5 px-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded transition-colors cursor-pointer group font-serif leading-relaxed border-l-2 border-emerald-400 dark:border-emerald-600 ml-1"
      onClick={handleCopy}
    >
      <span className="text-gray-600 dark:text-gray-400">
        <span className="font-display text-xs font-bold text-emerald-700 dark:text-emerald-400 mr-2">
          {number}.
        </span>
        {text}
      </span>

      <span className="absolute -right-2 top-1/2 -translate-y-1/2 translate-x-full whitespace-nowrap z-10">
        {copied ? (
          <span className="text-xs font-medium font-display text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-md shadow-sm animate-fade-in-out flex items-center gap-1">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Copied!
          </span>
        ) : (
          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-display text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md shadow-sm">
            Click to copy
          </span>
        )}
      </span>
    </li>
  );
}

// Collapsible References Section
function ReferencesSection({ references }: { references: ParsedReference[] }) {
  const [isOpen, setIsOpen] = useState(false);

  if (references.length === 0) return null;

  return (
    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm font-display font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
      >
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
        <svg
          className="w-4 h-4"
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
        References ({references.length})
      </button>

      <div className={`references-collapse ${isOpen ? "open" : ""}`}>
        <div>
          <ul className="space-y-1 mt-3">
            {references.map((ref) => (
              <ReferenceItem key={ref.number} reference={ref} />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// Custom renderer for markdown with citation support
function MarkdownContent({
  content,
  citationMap,
}: {
  content: string;
  citationMap: Map<string, ParsedReference>;
}) {
  const processedContent = useMemo(() => {
    return processCitationsForReact(content, citationMap);
  }, [content, citationMap]);

  const renderTextWithCitations = useCallback(
    (text: string): React.ReactNode => {
      const parts = text.split(/(\{\{CITATION:\d+:[^}]*\}\})/g);

      return parts.map((part, index) => {
        const citationMatch = part.match(/\{\{CITATION:(\d+):([^}]*)\}\}/);
        if (citationMatch) {
          const [, number, label] = citationMatch;
          const reference = citationMap.get(number);
          return (
            <CitationSup
              key={index}
              number={number}
              label={label || undefined}
              tooltipText={reference?.text}
            />
          );
        }
        return <span key={index}>{part}</span>;
      });
    },
    [citationMap],
  );

  const processChildren = useCallback(
    (children: React.ReactNode): React.ReactNode => {
      return React.Children.map(children, (child, idx) => {
        if (typeof child === "string") {
          if (child.includes("{{CITATION:")) {
            return (
              <React.Fragment key={idx}>
                {renderTextWithCitations(child)}
              </React.Fragment>
            );
          }
          return child;
        }
        if (React.isValidElement(child)) {
          const childProps = child.props as { children?: React.ReactNode };
          if (childProps.children) {
            return React.cloneElement(child, {
              ...child.props,
              children: processChildren(childProps.children),
            } as React.Attributes);
          }
        }
        return child;
      });
    },
    [renderTextWithCitations],
  );

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, rehypeSanitize]}
      components={{
        p: ({ children }) => (
          <p className="mb-5 leading-[1.8]">{processChildren(children)}</p>
        ),

        h1: ({ children }) => (
          <h1 className="text-2xl font-semibold mt-6 mb-4 text-gray-900 dark:text-white font-serif">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-xl font-semibold mt-7 mb-3 text-gray-900 dark:text-white font-serif border-b border-gray-200 dark:border-gray-700 pb-2">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-lg font-semibold mt-5 mb-2 text-emerald-700 dark:text-emerald-400 font-serif">
            {children}
          </h3>
        ),

        ul: ({ children }) => (
          <ul className="list-disc list-outside ml-5 space-y-2 my-4 marker:text-emerald-500">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-outside ml-5 space-y-2 my-4 marker:text-emerald-600 dark:marker:text-emerald-400">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="leading-[1.7] pl-1">{processChildren(children)}</li>
        ),

        strong: ({ children }) => (
          <strong className="font-semibold text-gray-900 dark:text-white">
            {children}
          </strong>
        ),
        em: ({ children }) => (
          <em className="italic text-gray-800 dark:text-gray-200">
            {children}
          </em>
        ),

        code: ({ className, children }) => {
          const isInline = !className;
          if (isInline) {
            return (
              <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono text-emerald-600 dark:text-emerald-400">
                {children}
              </code>
            );
          }
          return (
            <code className="block bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono my-4">
              {children}
            </code>
          );
        },

        blockquote: ({ children }) => (
          <blockquote className="border-l-[3px] border-emerald-500 pl-4 py-2 my-5 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-r-lg italic">
            {children}
          </blockquote>
        ),

        a: ({ href, children }) => (
          <a
            href={href}
            className="text-emerald-600 dark:text-emerald-400 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        ),
      }}
    >
      {processedContent}
    </ReactMarkdown>
  );
}

// Collapsible wrapper for backend-format references
function CollapsibleBackendReferences({
  references,
}: {
  references: { text: string; tooltip: string }[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm font-display font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
      >
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
        <svg
          className="w-4 h-4"
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
        References ({references.length})
      </button>

      <div className={`references-collapse ${isOpen ? "open" : ""}`}>
        <div>
          <ul className="space-y-1 mt-3">
            {references.map((ref, index) => (
              <BackendReferenceItem
                key={index}
                number={ref.tooltip || String(index + 1)}
                text={ref.text}
              />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function ChatBubble({ message, delay = 0 }: ChatBubbleProps) {
  const isUser = message.role === "user";

  const parsedContent = useMemo(() => {
    if (isUser) {
      return null;
    }

    const { mainContent, references, citationMap } = parseCitations(
      message.content,
    );

    if (message.references && message.references.length > 0) {
      message.references.forEach((ref, index) => {
        const number = ref.tooltip || String(index + 1);
        if (!citationMap.has(number)) {
          citationMap.set(number, {
            number,
            title: ref.text.substring(0, 60),
            description: ref.text,
            text: ref.text,
          });
        }
      });
    }

    return { mainContent, references, citationMap };
  }, [message.content, message.references, isUser]);

  // User message
  if (isUser) {
    return (
      <div
        className="flex justify-end px-4 py-3 chat-bubble"
        style={{ animationDelay: `${delay}s` }}
      >
        <div className="flex flex-col items-end gap-1 max-w-lg">
          <p className="text-gray-400 dark:text-gray-500 text-xs font-medium font-display">
            You
          </p>
          <p className="text-base font-normal font-display leading-relaxed rounded-2xl px-4 py-2.5 bg-emerald-600 text-white shadow-sm">
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  // AI message — academic article style
  return (
    <div
      className="px-4 py-3 chat-bubble"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="max-w-3xl">
        {/* Label */}
        <div className="flex items-center gap-2 mb-2">
          <svg
            className="w-4 h-4 text-emerald-600 dark:text-emerald-400"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path
              d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="currentColor"
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-xs font-semibold font-display text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Sustain Nexus
          </span>
        </div>

        {/* Main Content — academic prose */}
        <div className="academic-prose">
          {parsedContent && (
            <MarkdownContent
              content={parsedContent.mainContent}
              citationMap={parsedContent.citationMap}
            />
          )}
        </div>

        {/* References Section — collapsible */}
        {parsedContent && (
          <ReferencesSection references={parsedContent.references} />
        )}

        {/* Backend format references */}
        {message.references &&
          message.references.length > 0 &&
          !parsedContent?.references.length && (
            <CollapsibleBackendReferences references={message.references} />
          )}
      </div>
    </div>
  );
}
