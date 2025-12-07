"use client";

import { Message } from "@/app/page";
import React, { useMemo, useCallback, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
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

// Citation Badge Component with Smart Tooltip Positioning
function CitationBadge({
  number,
  label,
  tooltipText,
}: {
  number: string;
  label?: string;
  tooltipText?: string;
}) {
  const displayTooltip = tooltipText || `Reference ${number}`;
  const badgeRef = useRef<HTMLSpanElement>(null);
  const [position, setPosition] = useState<TooltipPosition>("top");
  const [isVisible, setIsVisible] = useState(false);

  // Calculate best position for tooltip based on viewport
  const calculatePosition = useCallback(() => {
    if (!badgeRef.current) return;

    const rect = badgeRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const tooltipWidth = 320; // w-80 = 20rem = 320px
    const tooltipHeight = 120; // approximate height with content
    const margin = 20; // spacing from edge

    // Check available space in each direction
    const spaceTop = rect.top;
    const spaceBottom = viewportHeight - rect.bottom;
    const spaceLeft = rect.left;
    const spaceRight = viewportWidth - rect.right;

    // Determine position based on available space
    // Priority: check which edges are close, then pick best direction

    // Near top edge of viewport -> show below
    if (spaceTop < tooltipHeight + margin) {
      setPosition("bottom");
      return;
    }

    // Near bottom edge of viewport -> show above
    if (spaceBottom < tooltipHeight + margin) {
      setPosition("top");
      return;
    }

    // Near left edge -> show right
    if (spaceLeft < tooltipWidth / 2 + margin) {
      if (spaceRight >= tooltipWidth + margin) {
        setPosition("right");
        return;
      }
    }

    // Near right edge -> show left
    if (spaceRight < tooltipWidth / 2 + margin) {
      if (spaceLeft >= tooltipWidth + margin) {
        setPosition("left");
        return;
      }
    }

    // Default: show above (most common case for inline content)
    setPosition("top");
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsVisible(false);
  }, []);

  // Calculate tooltip style with fixed positioning to avoid clipping
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});

  // Update tooltip position using fixed positioning
  const updateTooltipStyle = useCallback(() => {
    if (!badgeRef.current) return;

    const rect = badgeRef.current.getBoundingClientRect();
    const tooltipWidth = 320;
    const tooltipHeight = 120;
    const gap = 8;

    const style: React.CSSProperties = {
      position: 'fixed',
      width: tooltipWidth,
      zIndex: 9999,
    };

    switch (position) {
      case "top":
        style.left = rect.left + rect.width / 2 - tooltipWidth / 2;
        style.top = rect.top - tooltipHeight - gap;
        // Prevent horizontal overflow
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

  // Handle mouse enter - calculate position and show tooltip
  const handleMouseEnter = useCallback(() => {
    calculatePosition();
    setIsVisible(true);
    // Delay style calculation to ensure position is set
    setTimeout(() => updateTooltipStyle(), 0);
  }, [calculatePosition, updateTooltipStyle]);

  // Get tooltip classes (without positioning, just appearance)
  const getTooltipClasses = () => {
    const baseClasses = "pointer-events-none p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl transition-all duration-200";
    const visibilityClasses = isVisible ? "visible opacity-100" : "invisible opacity-0";
    return `${baseClasses} ${visibilityClasses}`;
  };

  // Tooltip component (rendered with fixed positioning via portal-like behavior)
  const TooltipContent = () => (
    <span
      className={getTooltipClasses()}
      style={tooltipStyle}
    >
      <span className="font-semibold text-emerald-400 block mb-1">
        [{number}] {label || ''}
      </span>
      <span className="leading-relaxed">{displayTooltip}</span>
    </span>
  );

  // If label exists, show "Label [number]" style badge
  if (label) {
    return (
      <>
        <span
          ref={badgeRef}
          className="relative inline-flex items-center bg-emerald-50 dark:bg-emerald-900/30 rounded-md px-2 py-0.5 mx-0.5 border border-emerald-200 dark:border-emerald-800 cursor-help"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <span className="text-emerald-600 dark:text-emerald-400 font-medium text-sm">
            {label}
          </span>
          <span className="text-emerald-500 dark:text-emerald-300 text-xs ml-1 font-semibold">
            [{number}]
          </span>
        </span>
        {/* Fixed position tooltip */}
        {isVisible && <TooltipContent />}
      </>
    );
  }

  // No label - just show "[number]" badge
  return (
    <>
      <span
        ref={badgeRef}
        className="relative inline-block ml-0.5 align-baseline"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <span className="cursor-pointer text-xs font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/50 dark:text-emerald-300 px-1.5 py-0.5 rounded hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-500 transition-colors">
          [{number}]
        </span>
      </span>
      {/* Fixed position tooltip */}
      {isVisible && <TooltipContent />}
    </>
  );
}

// Single Reference Item with copy functionality
function ReferenceItem({ ref }: { ref: ParsedReference }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const textToCopy = `[${ref.number}] ${ref.text}`;
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
      id={`ref-${ref.number}`}
      className="relative text-sm p-2.5 hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm rounded-md transition-all cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-gray-700 group"
      onClick={handleCopy}
    >
      <span className="text-gray-700 dark:text-gray-300 leading-relaxed pr-20">
        <span className="cursor-pointer text-xs font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/50 dark:text-emerald-300 px-1.5 py-0.5 rounded mr-2">
          [{ref.number}]
        </span>
        {ref.text}
      </span>

      {/* Floating copy indicator / toast outside text */}
      <span className="absolute -right-2 top-1/2 -translate-y-1/2 translate-x-full whitespace-nowrap z-10">
        {copied ? (
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-md shadow-sm animate-fade-in-out flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Copied!
          </span>
        ) : (
          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md shadow-sm">
            Click to copy
          </span>
        )}
      </span>
    </li>
  );
}

// Backend Reference Item with copy functionality (for message.references format)
function BackendReferenceItem({ number, text }: { number: string; text: string }) {
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
      className="relative text-sm p-2.5 hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm rounded-md transition-all cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-gray-700 group"
      onClick={handleCopy}
    >
      <span className="text-gray-700 dark:text-gray-300 leading-relaxed pr-20">
        <span className="cursor-pointer text-xs font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/50 dark:text-emerald-300 px-1.5 py-0.5 rounded mr-2">
          [{number}]
        </span>
        {text}
      </span>

      {/* Floating copy indicator / toast outside text */}
      <span className="absolute -right-2 top-1/2 -translate-y-1/2 translate-x-full whitespace-nowrap z-10">
        {copied ? (
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-md shadow-sm animate-fade-in-out flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Copied!
          </span>
        ) : (
          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md shadow-sm">
            Click to copy
          </span>
        )}
      </span>
    </li>
  );
}

// References Section Component
function ReferencesSection({
  references,
}: {
  references: ParsedReference[];
}) {
  if (references.length === 0) return null;

  return (
    <div className="references-section bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mt-4">
      <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
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
        References
      </h4>

      <ul className="space-y-2">
        {references.map((ref) => (
          <ReferenceItem key={ref.number} ref={ref} />
        ))}
      </ul>
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
  // Process citations in the content
  const processedContent = useMemo(() => {
    return processCitationsForReact(content, citationMap);
  }, [content, citationMap]);

  // Custom component to render text with citations
  const renderTextWithCitations = useCallback(
    (text: string): React.ReactNode => {
      const parts = text.split(/(\{\{CITATION:\d+:[^}]*\}\})/g);

      return parts.map((part, index) => {
        const citationMatch = part.match(/\{\{CITATION:(\d+):([^}]*)\}\}/);
        if (citationMatch) {
          const [, number, label] = citationMatch;
          const reference = citationMap.get(number);
          return (
            <CitationBadge
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
    [citationMap]
  );

  // Process children recursively to handle citations in nested elements
  const processChildren = useCallback(
    (children: React.ReactNode): React.ReactNode => {
      return React.Children.map(children, (child, idx) => {
        if (typeof child === "string") {
          // Check if this string contains citation markers
          if (child.includes("{{CITATION:")) {
            return <React.Fragment key={idx}>{renderTextWithCitations(child)}</React.Fragment>;
          }
          return child;
        }
        if (React.isValidElement(child)) {
          // Recursively process child elements
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
    [renderTextWithCitations]
  );

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        // Paragraph styling
        p: ({ children }) => (
          <p className="mb-4 text-gray-700 dark:text-gray-300 leading-[1.7] text-[15px]">
            {processChildren(children)}
          </p>
        ),

        // Headers
        h1: ({ children }) => (
          <h1 className="text-2xl font-bold mt-6 mb-4 text-gray-900 dark:text-white">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-xl font-bold mt-5 mb-3 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-lg font-semibold mt-4 mb-2 text-emerald-700 dark:text-emerald-400">
            {children}
          </h3>
        ),

        // Lists
        ul: ({ children }) => (
          <ul className="list-disc list-outside ml-5 space-y-2 my-4 marker:text-emerald-500">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-outside ml-5 space-y-2 my-4 marker:text-emerald-600">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="text-gray-700 dark:text-gray-300 leading-relaxed pl-1">
            {processChildren(children)}
          </li>
        ),

        // Strong and emphasis
        strong: ({ children }) => (
          <strong className="font-semibold text-gray-900 dark:text-white">
            {children}
          </strong>
        ),
        em: ({ children }) => (
          <em className="italic text-gray-800 dark:text-gray-200">{children}</em>
        ),

        // Code
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

        // Blockquote
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-emerald-500 pl-4 py-2 my-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-r-lg italic text-gray-700 dark:text-gray-300">
            {children}
          </blockquote>
        ),

        // Links
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

export default function ChatBubble({ message, delay = 0 }: ChatBubbleProps) {
  const isUser = message.role === "user";

  // Parse content for AI messages
  const parsedContent = useMemo(() => {
    if (isUser) {
      return null;
    }

    // Parse citations from the message content
    const { mainContent, references, citationMap } = parseCitations(
      message.content
    );

    // Merge backend references into citationMap (for tooltip display)
    // Backend returns: { text: "full citation text", tooltip: "number" }
    if (message.references && message.references.length > 0) {
      message.references.forEach((ref, index) => {
        const number = ref.tooltip || String(index + 1);
        if (!citationMap.has(number)) {
          citationMap.set(number, {
            number,
            title: ref.text.substring(0, 60),
            description: ref.text,
            text: ref.text
          });
        }
      });
    }

    return { mainContent, references, citationMap };
  }, [message.content, message.references, isUser]);

  // User message bubble
  if (isUser) {
    return (
      <div
        className="flex items-end gap-3 p-4 justify-end chat-bubble"
        style={{ animationDelay: `${delay}s` }}
      >
        <div className="flex flex-1 flex-col gap-1 items-end">
          <p className="text-gray-500 dark:text-gray-400 text-xs font-medium">
            You
          </p>
          <p className="text-base font-normal leading-relaxed max-w-lg rounded-xl px-4 py-3 bg-emerald-100 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-100 shadow-sm border border-emerald-200 dark:border-emerald-800">
            {message.content}
          </p>
        </div>
        <div
          className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10 h-10 shrink-0 ring-2 ring-emerald-200 dark:ring-emerald-800"
          style={{
            backgroundImage:
              'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBRqumJAgVByoXuzEYyKYepSO48jaVL4SHaLztYntgLwSuk8dHqOgnsRiVj2h1UDGrKXBQHCuaam0hxyZ2_0dGnusWne0ZRO6jyJ6QXEQHSNvqKj8JeiEYTVrPJvyaGupKLmHvG1MK8MOSAgMUuP7rYL3BZKqmQg6Qe7uGxHf2Pr9x60H1CFBHZJKiKpeH3eh3LjpV7Lmh5_Jw7X_sGm3U_IYJrSdkrHetvNQhVxAFUHU3J2s-nHayWa1DNpOmSfqBoen20iVCjwik")',
          }}
        />
      </div>
    );
  }

  // AI message bubble
  return (
    <div
      className="flex items-start gap-3 p-4 chat-bubble"
      style={{ animationDelay: `${delay}s` }}
    >
      <div
        className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10 h-10 shrink-0 shadow-md ring-2 ring-white dark:ring-gray-700"
        style={{
          backgroundImage:
            'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDrkDJRueG6cbTc-pK2U118OcT-5KblcDRskAzZVfP0X_7RJDy816UrmdXAd2MRPiVEYm59VZjnO6IQh7QnRyQiUwk1zz3EkF_Xrk2_C7UKRtsC7seOPZBkhzPNyw1GltrIANbDtFRn4ae2THwRRRfPQ67oMLEV5PCIIMK8X3lNqw8PeDaEsLxgjah83QXIeTAPXy9IdgixokHl1ZbCsHQ1zrY7zyoU7Sv88-j9-q-IuKpNhIg1td9Spgax93tk7ppyxCpGLdorTAM")',
        }}
      />
      <div className="flex flex-1 flex-col gap-1 items-start">
        <p className="text-gray-500 dark:text-gray-400 text-xs font-medium">
          GreenLaw AI
        </p>

        {/* Message Container */}
        <div className="message-bubble bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 max-w-3xl">
          {/* Main Content */}
          <div className="prose-content text-gray-700 dark:text-gray-300 leading-[1.7] text-[15px]">
            {parsedContent && (
              <MarkdownContent
                content={parsedContent.mainContent}
                citationMap={parsedContent.citationMap}
              />
            )}
          </div>

          {/* Divider (only if has references) */}
          {parsedContent && parsedContent.references.length > 0 && (
            <div className="border-t border-gray-100 dark:border-gray-700 my-4"></div>
          )}

          {/* References Section */}
          {parsedContent && (
            <ReferencesSection references={parsedContent.references} />
          )}

          {/* Backend format: message.references array with {text, tooltip} */}
          {/* text = full citation text, tooltip = reference number */}
          {message.references && message.references.length > 0 && !parsedContent?.references.length && (
            <div className="references-section bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mt-4">
              <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
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
                References
              </h4>
              <ul className="space-y-2">
                {message.references.map((ref, index) => (
                  <BackendReferenceItem
                    key={index}
                    number={ref.tooltip || String(index + 1)}
                    text={ref.text}
                  />
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
