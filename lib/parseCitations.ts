export interface ParsedReference {
  number: string;
  title: string;      // Short title (first line or extracted name)
  description: string; // Full description
  text: string;       // Original full text
}

export interface ParsedContent {
  mainContent: string;
  references: ParsedReference[];
  citationMap: Map<string, ParsedReference>;
}

/**
 * Parse AI response to extract inline citations and references
 * Supports formats:
 *   - [Citation Name]^[1] (Gemini style)
 *   - {{CITATION:1:Label}} (RAGFlow style)
 *   - ^[1] (superscript only)
 *   - [1] (bracket only in references section)
 */
export function parseCitations(content: string): ParsedContent {
  const citationMap = new Map<string, ParsedReference>();
  const references: ParsedReference[] = [];

  // Split content into main content and references section
  const refSectionMatch = content.match(/##\s*References?\s*\n([\s\S]+)$/i);
  let mainContent = content;

  if (refSectionMatch) {
    // Extract main content (everything before ## References)
    mainContent = content.substring(0, refSectionMatch.index).trim();

    // Parse references section
    const refSection = refSectionMatch[1];
    const refMatches = refSection.matchAll(/\[(\d+)\]\s*(.+?)(?=\n\[|\n*$)/gs);

    for (const match of refMatches) {
      const number = match[1];
      const fullText = match[2].trim();

      // Extract title and description
      const { title, description } = extractTitleAndDescription(fullText);

      const ref: ParsedReference = {
        number,
        title,
        description,
        text: fullText
      };

      citationMap.set(number, ref);
      references.push(ref);
    }
  }

  return { mainContent, references, citationMap };
}

/**
 * Extract a short title and description from reference text
 */
function extractTitleAndDescription(text: string): { title: string; description: string } {
  // Try to extract title from common patterns
  // Pattern 1: "Title: Description" or "Title - Description"
  const colonMatch = text.match(/^([^:–—-]+)[:\-–—]\s*(.+)$/s);
  if (colonMatch) {
    return {
      title: colonMatch[1].trim().substring(0, 80),
      description: colonMatch[2].trim()
    };
  }

  // Pattern 2: First sentence as title
  const sentenceMatch = text.match(/^([^.!?]+[.!?])\s*(.*)$/s);
  if (sentenceMatch && sentenceMatch[1].length <= 100) {
    return {
      title: sentenceMatch[1].trim(),
      description: sentenceMatch[2].trim() || sentenceMatch[1].trim()
    };
  }

  // Fallback: First 60 chars as title
  const title = text.length > 60 ? text.substring(0, 60) + '...' : text;
  return { title, description: text };
}

/**
 * Process content to convert citation markers to React-compatible format
 * Returns content with citation placeholders that will be replaced by React components
 * Supports:
 *   - [Citation Text]^[Number] → {{CITATION:number:CitationText}}
 *   - Citation Text^[Number] → {{CITATION:number:CitationText}} (no brackets around name)
 *   - ^[Number] → {{CITATION:number:}}
 *   - {{CITATION:number:label}} (already in correct format, kept as-is)
 */
export function processCitationsForReact(
  content: string,
  _citationMap: Map<string, ParsedReference>
): string {
  let processed = content;

  // Pattern 1: [Citation Text]^[Number] - Full citation with name in brackets (Gemini style)
  processed = processed.replace(
    /\[([^\]]+)\]\^\[(\d+)\]/g,
    (_, citationText, number) => {
      return `{{CITATION:${number}:${citationText}}}`;
    }
  );

  // Pattern 1b: Citation Text^[Number] - Citation name WITHOUT brackets (RAGFlow style)
  // Match: word characters, spaces, parentheses, slashes, hyphens before ^[N]
  // Examples: "EU Taxonomy Regulation^[3]", "Regulation (EU) 2020/852^[1]"
  processed = processed.replace(
    /([A-Z][A-Za-z0-9\s()\/\-]+?)\^\[(\d+)\]/g,
    (_, citationText, number) => {
      return `{{CITATION:${number}:${citationText.trim()}}}`;
    }
  );

  // Pattern 2: ^[Number] - Superscript only (standalone, not captured by patterns above)
  processed = processed.replace(
    /\^\[(\d+)\]/g,
    (_, number) => {
      return `{{CITATION:${number}:}}`;
    }
  );

  // Pattern 3: [Number] - Simple bracket citation (RAGFlow common format)
  // Must be careful not to match markdown links like [text](url)
  // Only match [Number] where Number is 1-3 digits, not followed by ( or preceded by ]
  processed = processed.replace(
    /(?<!\])\[(\d{1,3})\](?!\()/g,
    (_, number) => {
      return `{{CITATION:${number}:}}`;
    }
  );

  // {{CITATION:number:label}} format is already correct (RAGFlow style)
  // No conversion needed

  return processed;
}

/**
 * Parse citation placeholder back to components data
 */
export function parseCitationPlaceholder(text: string): { number: string; label: string } | null {
  const match = text.match(/\{\{CITATION:(\d+):([^}]*)\}\}/);
  if (match) {
    return { number: match[1], label: match[2] };
  }
  return null;
}
