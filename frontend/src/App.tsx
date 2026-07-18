import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "./types";
import { streamChat } from "./lib/api";
import { renderMarkdown, renderChartLink } from "./lib/markdown";
import { useTheme } from "./hooks/useTheme";
import { Message } from "./components/Message";
import { StatusMessage } from "./components/StatusMessage";
import { ChatInput } from "./components/ChatInput";

const WELCOME_HTML = renderMarkdown(
  "Hello! I'm your mutual fund advisor. I can help you:\n" +
    "- Search and analyze mutual funds\n" +
    "- Calculate returns and SIP projections\n" +
    "- Compare funds and visualize trends\n\n" +
    "Type **@** to search for funds or just ask me anything!"
);

let idCounter = 0;
const nextId = () => `msg-${idCounter++}`;

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: nextId(), role: "agent", content: WELCOME_HTML },
  ]);
  const [status, setStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const chatRef = useRef<HTMLDivElement>(null);

  // Keep the view pinned to the newest content.
  useEffect(() => {
    const el = chatRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, status]);

  function addMessage(message: ChatMessage) {
    setMessages((prev) => [...prev, message]);
  }

  async function handleSend(text: string) {
    if (isProcessing) return;

    addMessage({ id: nextId(), role: "user", content: text });
    setIsProcessing(true);
    setStatus("Thinking...");

    try {
      for await (const event of streamChat(text)) {
        if (event.type === "status") {
          if (event.status === "tool_call" && event.tool?.includes("Chart")) {
            setStatus("Creating chart...");
          } else if (event.status === "thinking") {
            setStatus("Thinking...");
          } else {
            setStatus(event.tool ?? event.status);
          }
        } else if (event.type === "chart") {
          setStatus(null);
          addMessage({
            id: nextId(),
            role: "agent",
            content: renderChartLink(event.url),
            chartUrl: event.url,
          });
        } else if (event.type === "message") {
          setStatus(null);
          addMessage({
            id: nextId(),
            role: "agent",
            content: renderMarkdown(event.content),
          });
        } else if (event.type === "done") {
          setStatus(null);
        } else if (event.type === "error") {
          setStatus(null);
          addMessage({
            id: nextId(),
            role: "agent",
            content: renderMarkdown(
              `Sorry, an error occurred: ${event.error}`
            ),
          });
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setStatus(null);
      addMessage({
        id: nextId(),
        role: "agent",
        content: renderMarkdown("Sorry, something went wrong. Please try again."),
      });
    } finally {
      setStatus(null);
      setIsProcessing(false);
    }
  }

  return (
    <div className="container">
      <div className="header">
        <div className="header-left">
          <h1>🏦 Mutual Fund AI Assistant</h1>
        </div>
        <button className="theme-toggle" onClick={toggleTheme}>
          <span className="icon">{theme === "light" ? "☀️" : "🌙"}</span>
          <span>{theme === "light" ? "Light" : "Dark"}</span>
        </button>
      </div>

      <div className="chat-scroll" ref={chatRef}>
        <div className="chat-column">
          {messages.map((message) => (
            <Message key={message.id} message={message} />
          ))}
          {status && <StatusMessage text={status} />}
        </div>
      </div>

      <ChatInput disabled={isProcessing} onSend={handleSend} />
    </div>
  );
}
