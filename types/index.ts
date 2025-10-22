// Core message types for the chat interface

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

export interface ChatRequest {
  message: string;
}

export interface ChatResponse extends Message {
  // Response is a Message with additional metadata if needed
  timestamp?: string;
}
