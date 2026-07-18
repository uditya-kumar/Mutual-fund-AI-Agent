import { useMemo } from "react";
import type { ChatMessage, Theme } from "../types";
import { parseMessage } from "../lib/markdown";
import { Chart } from "./Chart";

interface MessageProps {
  message: ChatMessage;
  theme: Theme;
}

/**
 * A single message. User messages render as plain text inside a rounded box
 * aligned right. Agent messages are parsed into ordered segments of markdown
 * and interactive charts; charts re-render with the current theme.
 */
export function Message({ message, theme }: MessageProps) {
  if (message.role === "user") {
    return (
      <div className="message user">
        <div className="bubble">{message.content}</div>
      </div>
    );
  }

  const segments = useMemo(
    () => parseMessage(message.content),
    [message.content]
  );

  return (
    <div className="message agent">
      {segments.map((segment, i) =>
        segment.kind === "chart" ? (
          <Chart key={i} spec={segment.spec} theme={theme} />
        ) : (
          <div
            key={i}
            className="content"
            dangerouslySetInnerHTML={{ __html: segment.html }}
          />
        )
      )}
    </div>
  );
}
