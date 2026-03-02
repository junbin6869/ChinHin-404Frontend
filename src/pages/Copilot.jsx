import { useMemo, useRef, useState, useEffect } from "react";
import "./Copilot.css";
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const API_URL = `${BASE_URL}/copilot`;

export default function Copilot() {
  const [input, setInput] = useState("");

  const [messages, setMessages] = useState(() => [
    {
      role: "assistant",
      content:
        "Hi! I’m your Copilot. Tell me what you want to solve (procurement / promotion / document).",
    },
  ]);

  // ✅ NEW: conversation id from backend
  const [conversationId, setConversationId] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const listRef = useRef(null);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, isLoading]);

  const canSend = useMemo(
    () => input.trim().length > 0 && !isLoading,
    [input, isLoading]
  );

  async function send() {
    const text = input.trim();
    if (!text || isLoading) return;

    setError("");
    setInput("");
    setIsLoading(true);

    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // ✅ Send conversation_id, first time can be null/undefined
        body: JSON.stringify({
          message: text,
          conversation_id: conversationId, // IMPORTANT
        }),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${res.statusText}${t ? ` - ${t}` : ""}`);
      }

      const data = await res.json();

      // ✅ Save conversation_id returned by backend (first call)
      if (!conversationId && data.conversation_id) {
        setConversationId(data.conversation_id);
      }

      const reply =
        data.reply ??
        data.message ??
        data?.choices?.[0]?.message?.content ??
        JSON.stringify(data, null, 2);

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      setError(e?.message || "Request failed");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry — I couldn’t reach the server. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  // Optional: Start a new conversation (reset conversationId and messages)
  function newChat() {
    setConversationId(null);
    setMessages([
      {
        role: "assistant",
        content:
          "Hi! I’m your Copilot. Tell me what you want to solve (procurement / promotion / document).",
      },
    ]);
    setError("");
    setInput("");
  }

  return (
    <div className="copilot-root">
      <div className="copilot-header">
        <div className="copilot-text">
          <div className="copilot-title">Copilot</div>
          <div className="copilot-subtitle">
            Ask anything — I’ll route to the right agent (Procurement / Promotion / Document).
          </div>
        </div>

        <button className="btn btn-primary" onClick={newChat}>
          New Chat
        </button>
      </div>

      <div className="chat-shell">
        <div className="chat-list" ref={listRef}>
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`chat-row ${m.role === "user" ? "is-user" : "is-assistant"}`}
            >
              <div className="chat-bubble">{m.content}</div>
            </div>
          ))}

          {isLoading && (
            <div className="chat-row is-assistant">
              <div className="chat-bubble chat-bubble-loading">Thinking…</div>
            </div>
          )}
        </div>

        <div className="chat-composer">
          <textarea
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type your request… (Enter to send, Shift+Enter for newline)"
            rows={2}
          />
          <button className="chat-send" onClick={send} disabled={!canSend}>
            Send
          </button>
        </div>

      </div>
    </div>
  );
}