import { Message } from "@/app/page";
import { useMemo } from "react";
import { parseCitations, renderInlineCitations } from "@/lib/parseCitations";

interface ChatBubbleProps {
  message: Message;
  delay?: number;
}

// Enhanced markdown to HTML converter with better formatting
function markdownToHtml(text: string): string {
  let html = text;

  // Headers with enhanced styling
  html = html.replace(
    /^### (.+)$/gm,
    '<h3 class="text-xl font-bold mt-6 mb-4 pb-2 text-emerald-700 dark:text-emerald-400 border-b-2 border-emerald-200 dark:border-emerald-800">$1</h3>'
  );
  html = html.replace(
    /^## (.+)$/gm,
    '<h2 class="text-2xl font-bold mt-7 mb-4 text-gray-900 dark:text-white">$1</h2>'
  );
  html = html.replace(
    /^# (.+)$/gm,
    '<h1 class="text-3xl font-bold mt-8 mb-5 text-gray-900 dark:text-white">$1</h1>'
  );

  // Bold and italic with better contrast
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900 dark:text-white">$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em class="italic text-gray-800 dark:text-gray-200">$1</em>');

  // Code blocks inline
  html = html.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono text-emerald-600 dark:text-emerald-400">$1</code>');

  // Lists with better spacing
  const lines = html.split('\n');
  let inList = false;
  const processed: string[] = [];

  for (const line of lines) {
    const listMatch = line.match(/^\s*(\*|-)\s+(.+)$/);
    if (listMatch) {
      if (!inList) {
        processed.push('<ul class="list-disc list-inside ml-6 space-y-2 my-4 marker:text-emerald-500 dark:marker:text-emerald-400">');
        inList = true;
      }
      processed.push(`<li class="text-gray-700 dark:text-gray-300 leading-relaxed">${listMatch[2]}</li>`);
    } else {
      if (inList && line.trim() === '') {
        processed.push('</ul>');
        inList = false;
      }
      processed.push(line);
    }
  }
  if (inList) processed.push('</ul>');

  html = processed.join('\n');

  // Paragraphs with better line height and spacing
  html = html.split('\n\n').map(para => {
    para = para.trim();
    if (para && !para.match(/^<[uh]/)) {
      return `<p class="mb-4 text-gray-700 dark:text-gray-300 leading-7 text-justify">${para}</p>`;
    }
    return para;
  }).join('\n');

  // Convert single newlines to <br/> but preserve structure
  html = html.replace(/\n(?!<)/g, '<br />');

  return html;
}

export default function ChatBubble({ message, delay = 0 }: ChatBubbleProps) {
  const isUser = message.role === "user";

  const content = useMemo(() => {
    // For user messages, just return plain text
    if (isUser) {
      return { html: message.content, hasReferences: false };
    }

    // Check if using OLD format (message.references array exists)
    if (message.references && message.references.length > 0) {
      // Handle old format with HTML spans
      let html = message.content;
      message.references.forEach((ref, index) => {
        const placeholder = `<span class="quote-ref" data-ref="${index}">${ref.text}</span>`;
        html = html.replace(
          placeholder,
          `<span class="citation-tooltip inline-flex items-center bg-blue-50 dark:bg-blue-900/30 rounded-md px-2 py-0.5 mx-0.5 border border-blue-200 dark:border-blue-800 cursor-help relative group">
            <span class="text-blue-600 dark:text-blue-400 font-medium text-sm">${ref.text}</span>
            <span class="tooltip-content invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg max-w-xs whitespace-normal">
              ${ref.tooltip}
              <span class="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></span>
            </span>
          </span>`
        );
      });
      return { html, hasReferences: false, usesOldFormat: true };
    }

    // NEW format: Parse citations from AI response
    const { mainContent, references, citationMap } = parseCitations(message.content);
    
    // Convert markdown to HTML
    let html = markdownToHtml(mainContent);
    
    // Add inline citations with hover tooltips
    html = renderInlineCitations(html, citationMap);
    
    return { html, hasReferences: references.length > 0, references, usesOldFormat: false };
  }, [message.content, isUser, message.references]);

  const renderContent = () => {
    return <div dangerouslySetInnerHTML={{ __html: content.html }} />;
  };

  if (isUser) {
    return (
      <div
        className="flex items-end gap-3 p-4 justify-end chat-bubble"
        style={{ animationDelay: `${delay}s` }}
      >
        <div className="flex flex-1 flex-col gap-1 items-end">
          <p className="text-[#333333] dark:text-gray-400 text-xs font-normal leading-normal max-w-[360px] text-right">
            You
          </p>
          <p className="text-base font-normal leading-normal flex max-w-lg rounded-xl px-4 py-3 bg-emerald-100 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-100 shadow-sm border border-emerald-200 dark:border-emerald-800">
            {message.content}
          </p>
        </div>
        <div
          className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10 h-10 shrink-0"
          style={{
            backgroundImage:
              'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBRqumJAgVByoXuzEYyKYepSO48jaVL4SHaLztYntgLwSuk8dHqOgnsRiVj2h1UDGrKXBQHCuaam0hxyZ2_0dGnusWne0ZRO6jyJ6QXEQHSNvqKj8JeiEYTVrPJvyaGupKLmHvG1MK8MOSAgMUuP7rYL3BZKqmQg6Qe7uGxHf2Pr9x60H1CFBHZJKiKpeH3eh3LjpV7Lmh5_Jw7X_sGm3U_IYJrSdkrHetvNQhVxAFUHU3J2s-nHayWa1DNpOmSfqBoen20iVCjwik")',
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="flex items-start gap-3 p-4 chat-bubble"
      style={{ animationDelay: `${delay}s` }}
    >
      <div
        className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10 h-10 shrink-0 shadow-sm"
        style={{
          backgroundImage:
            'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDrkDJRueG6cbTc-pK2U118OcT-5KblcDRskAzZVfP0X_7RJDy816UrmdXAd2MRPiVEYm59VZjnO6IQh7QnRyQiUwk1zz3EkF_Xrk2_C7UKRtsC7seOPZBkhzPNyw1GltrIANbDtFRn4ae2THwRRRfPQ67oMLEV5PCIIMK8X3lNqw8PeDaEsLxgjah83QXIeTAPXy9IdgixokHl1ZbCsHQ1zrY7zyoU7Sv88-j9-q-IuKpNhIg1td9Spgax93tk7ppyxCpGLdorTAM")',
        }}
      />
      <div className="flex flex-1 flex-col gap-1 items-start">
        <p className="text-[#333333] dark:text-gray-400 text-xs font-normal leading-normal max-w-[360px]">
          GreenLaw AI
        </p>
        <div className="text-base font-normal leading-normal flex flex-col max-w-2xl rounded-xl bg-white dark:bg-gray-800 text-[#2D3748] dark:text-gray-200 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="px-4 py-3">{renderContent()}</div>
          
          {/* New format: Parsed references from ## References section */}
          {content.hasReferences && content.references && content.references.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-4 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900/30 dark:to-gray-900/50">
              <h4 className="text-sm font-bold uppercase text-emerald-700 dark:text-emerald-400 mb-4 tracking-wide flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                References
              </h4>
              <div className="space-y-3">
                {content.references.map((ref) => (
                  <div
                    key={ref.number}
                    className="flex gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200"
                  >
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex-shrink-0 text-sm">
                      [{ref.number}]
                    </span>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
                      {ref.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Old format: message.citation HTML */}
          {message.citation && !content.hasReferences && (
            <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-4 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900/30 dark:to-gray-900/50">
              <h4 className="text-sm font-bold uppercase text-emerald-700 dark:text-emerald-400 mb-4 tracking-wide flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                References
              </h4>
              <div
                className="text-sm text-gray-700 dark:text-gray-300 leading-7 space-y-2 citation-list"
                dangerouslySetInnerHTML={{ __html: message.citation }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
