import type { Fund } from "../types";

/** Search mutual funds via the backend proxy. */
export async function searchFunds(query: string): Promise<Fund[]> {
  const response = await fetch(
    `/api/search-funds?query=${encodeURIComponent(query)}`
  );
  if (!response.ok) return [];
  return (await response.json()) as Fund[];
}

export type ChatEvent =
  | { type: "status"; status: string; tool?: string }
  | { type: "chart"; url: string }
  | { type: "message"; content: string }
  | { type: "done" }
  | { type: "error"; error: string };

/**
 * Stream a chat response from the backend. The backend uses SSE-style
 * `data: {json}\n\n` framing over a plain POST response body.
 */
export async function* streamChat(
  message: string
): AsyncGenerator<ChatEvent> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  if (!response.body) throw new Error("No response body");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    // Keep the last (possibly partial) line in the buffer.
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          yield JSON.parse(line.slice(6)) as ChatEvent;
        } catch {
          // Ignore malformed frames.
        }
      }
    }
  }
}
