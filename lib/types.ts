/**
 * Shared type definitions for the GreenLaw AI application
 */

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
