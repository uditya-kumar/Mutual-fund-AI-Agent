export type Role = "user" | "agent";

export interface ChatMessage {
  id: string;
  role: Role;
  /** For user messages this is plain text; for agent messages this is sanitized HTML. */
  content: string;
  /** When present, the message renders a chart image instead of text. */
  chartUrl?: string;
}

export interface Fund {
  schemeName: string;
  schemeCode: string;
  category: string;
}

export type Theme = "dark" | "light";
