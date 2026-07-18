import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import type { Fund } from "../types";
import { fetchFundSuggestions } from "../lib/api";

interface ChatInputProps {
  disabled: boolean;
  onSend: (message: string) => void;
}

/**
 * Message textarea with `@`-triggered fund autocomplete. Ports the vanilla
 * implementation: find the `@` before the cursor, debounce the search, and
 * let the selection replace `@query` with `Scheme Name (code)`.
 */
export function ChatInput({ disabled, onSend }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [results, setResults] = useState<Fund[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const atPositionRef = useRef(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentQueryRef = useRef("");

  const dropdownOpen = results.length > 0;

  // Auto-resize the textarea to fit its content.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  function closeDropdown() {
    setResults([]);
    setSelectedIndex(-1);
    atPositionRef.current = -1;
    currentQueryRef.current = "";
  }

  function handleAutocomplete() {
    const el = textareaRef.current;
    if (!el) return;

    const text = el.value;
    const cursorPos = el.selectionStart;

    // Find the `@` before the cursor (allow spaces, stop at newline).
    let atPos = -1;
    for (let i = cursorPos - 1; i >= 0; i--) {
      if (text[i] === "@") {
        atPos = i;
        break;
      }
      if (text[i] === "\n") break;
    }

    if (atPos === -1) {
      closeDropdown();
      return;
    }

    atPositionRef.current = atPos;
    const query = text.substring(atPos + 1, cursorPos).trim();

    if (query.length < 2) {
      setResults([]);
      setSelectedIndex(-1);
      return;
    }

    if (query === currentQueryRef.current) return;
    currentQueryRef.current = query;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const funds = await fetchFundSuggestions(query);
        // Ignore stale results if the query moved on.
        if (query !== currentQueryRef.current) return;
        setResults(funds);
        setSelectedIndex(-1);
      } catch {
        setResults([]);
      }
    }, 200);
  }

  function selectItem(index: number) {
    const el = textareaRef.current;
    if (!el || index < 0 || index >= results.length) return;

    const fund = results[index];
    const text = el.value;
    const beforeAt = text.substring(0, atPositionRef.current);
    const afterCursor = text.substring(el.selectionStart);

    setValue(`${beforeAt}${fund.schemeName} (${fund.schemeCode})${afterCursor}`);
    closeDropdown();
    el.focus();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (!dropdownOpen) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        send();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) selectItem(selectedIndex);
        else send();
        break;
      case "Escape":
        closeDropdown();
        break;
    }
  }

  function send() {
    const message = value.trim();
    if (disabled || !message) return;
    onSend(message);
    setValue("");
    closeDropdown();
  }

  // Enabled only when there is text to send and we're not already processing.
  const canSend = !disabled && value.trim().length > 0;

  return (
    <div className="input-container">
      <div className="input-inner">
        {dropdownOpen && (
          <div className="autocomplete-dropdown">
            {results.map((fund, index) => (
              <div
                key={`${fund.schemeCode}-${index}`}
                className={`autocomplete-item ${
                  index === selectedIndex ? "selected" : ""
                }`}
                onMouseDown={(e) => {
                  // Prevent the textarea from losing focus before selection.
                  e.preventDefault();
                  selectItem(index);
                }}
              >
                <span className="fund-name">{fund.schemeName}</span>
                <span className="fund-code">
                  {fund.category ? `${fund.category} • ` : ""}ID:{" "}
                  {fund.schemeCode}
                </span>
              </div>
            ))}
          </div>
        )}
        <div className="input-box">
          <textarea
            id="messageInput"
            ref={textareaRef}
            rows={1}
            placeholder="Write a message… (@ to search funds)"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              handleAutocomplete();
            }}
            onKeyDown={handleKeyDown}
          />
          <button id="sendButton" disabled={!canSend} onClick={send}>
            <span>➤</span>
          </button>
        </div>
        <div className="disclaimer">
          AI can make mistakes. Please double-check responses.
        </div>
      </div>
    </div>
  );
}
