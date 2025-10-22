export interface ParsedReference {
  number: string;
  text: string;
}

export interface ParsedContent {
  mainContent: string;
  references: ParsedReference[];
  citationMap: Map<string, string>; // citation number -> full reference text
}

/**
 * Parse Gemini's response to extract inline citations and references
 * Format: [Citation Name]^[1] for inline, and ## References section with [1] entries
 */
export function parseCitations(content: string): ParsedContent {
  const citationMap = new Map<string, string>();
  const references: ParsedReference[] = [];
  
  // Split content into main content and references section
  const refSectionMatch = content.match(/##\s*References\s*\n([\s\S]+)$/i);
  let mainContent = content;
  
  if (refSectionMatch) {
    // Extract main content (everything before ## References)
    mainContent = content.substring(0, refSectionMatch.index).trim();
    
    // Parse references section
    const refSection = refSectionMatch[1];
    const refMatches = refSection.matchAll(/\[(\d+)\]\s*(.+?)(?=\n\[|\n*$)/gs);
    
    for (const match of refMatches) {
      const number = match[1];
      const text = match[2].trim();
      citationMap.set(number, text);
      references.push({ number, text });
    }
  }
  
  return { mainContent, references, citationMap };
}

/**
 * Convert inline citations to HTML with hover tooltips
 * Converts [Citation Name]^[1] to styled span with tooltip
 */
export function renderInlineCitations(
  content: string,
  citationMap: Map<string, string>
): string {
  // Match pattern: [Citation Text]^[Number]
  const citationPattern = /\[([^\]]+)\]\^\[(\d+)\]/g;
  
  return content.replace(citationPattern, (match, citationText, number) => {
    const fullRef = citationMap.get(number) || "Reference not found";
    
    return `<span class="citation-tooltip inline-flex items-center bg-blue-50 dark:bg-blue-900/30 rounded-md px-2 py-0.5 mx-0.5 border border-blue-200 dark:border-blue-800 cursor-help relative group">
      <span class="text-blue-600 dark:text-blue-400 font-medium text-sm">${citationText}</span>
      <span class="citation-number text-blue-500 dark:text-blue-300 text-xs ml-1 font-semibold">[${number}]</span>
      <span class="tooltip-content invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg max-w-xs whitespace-normal">
        ${fullRef}
        <span class="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></span>
      </span>
    </span>`;
  });
}
