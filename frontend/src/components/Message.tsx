import type { ChatMessage } from "../types";

interface MessageProps {
  message: ChatMessage;
}

/**
 * A single message. User messages render as plain text inside a rounded
 * box aligned right; agent messages render pre-sanitized markdown HTML with
 * no bubble, injected via innerHTML.
 */
export function Message({ message }: MessageProps) {
  if (message.role === "user") {
    return (
      <div className="message user">
        <div className="bubble">{message.content}</div>
      </div>
    );
  }

  return (
    <div className="message agent">
      <div
        className="content"
        dangerouslySetInnerHTML={{ __html: message.content }}
      />
    </div>
  );
}
