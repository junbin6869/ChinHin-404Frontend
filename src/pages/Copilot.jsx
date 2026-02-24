import { useMemo, useRef, useState, useEffect } from "react";
import "./Copilot.css";

const API_URL =
  import.meta.env.VITE_COPILOT_API_URL ||
  "https://404-e7hygxh9bqdudbhq.malaysiawest-01.azurewebsites.net/api/copilot";


export default function Copilot() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(() => [
    {
      role: "assistant",
      content: "Hi! I’m your Copilot. Tell me what you want to solve (procurement / promotion / document).",
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const listRef = useRef(null);

  // auto scroll to bottom when messages change
  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, isLoading]);

  const canSend = useMemo(() => input.trim().length > 0 && !isLoading, [input, isLoading]);

  async function send() {
    const text = input.trim();
    if (!text || isLoading) return;

    setError("");
    setInput("");
    setIsLoading(true);

    // 1) optimistic add user message
    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);

    try {
      // 2) call API
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          // optional: pass conversation context
          history: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${res.statusText}${t ? ` - ${t}` : ""}`);
      }

      // 3) parse response
      // Expect either:
      //  A) { reply: "..." }
      //  B) { message: "..." }
      //  C) OpenAI-style: { choices: [{ message: { content: "..." } }] }
      const data = await res.json();

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
        {
          role: "assistant",
          content: "Sorry — I couldn’t reach the server. Please try again.",
        },
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

  return (
    <div className="copilot-root">
      <div className="copilot-header">
        <div className="copilot-title">Copilot</div>
        <div className="copilot-subtitle">
          Ask anything — I’ll route to the right agent (Procurement / Promotion / Document).
        </div>
      </div>

      <div className="chat-shell">
        <div className="chat-list" ref={listRef}>
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`chat-row ${m.role === "user" ? "is-user" : "is-assistant"}`}
            >
              <div className="chat-bubble">
                {m.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="chat-row is-assistant">
              <div className="chat-bubble chat-bubble-loading">
                Thinking…
              </div>
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

        {error && <div className="chat-error">⚠ {error}</div>}
        <div className="chat-hint">
          API: <code>{API_URL}</code>
        </div>
      </div>
    </div>
  );
}
