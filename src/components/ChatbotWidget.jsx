import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import api from "../services/api";
import "./ChatbotWidget.css";

const BTN_W  = 96;   // approx launcher button width
const BTN_H  = 48;   // approx launcher button height
const PANEL_W = 360;
const PANEL_H = 520;
const EDGE    = 12;  // min gap from viewport edge

function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }

function defaultPos() {
  return {
    x: window.innerWidth  - BTN_W  - 20,
    y: window.innerHeight - BTN_H  - 20,
  };
}

function loadPos() {
  try {
    const p = JSON.parse(localStorage.getItem("chatbotPos"));
    if (p && typeof p.x === "number" && typeof p.y === "number") return p;
  } catch { /* ignore */ }
  return null;
}

function savePos(p) {
  try { localStorage.setItem("chatbotPos", JSON.stringify(p)); } catch { /* ignore */ }
}

function clampToViewport(x, y) {
  return {
    x: clamp(x, EDGE, window.innerWidth  - BTN_W  - EDGE),
    y: clamp(y, EDGE, window.innerHeight - BTN_H  - EDGE),
  };
}

// Smart panel position: appears near the button, stays strictly inside viewport
function getPanelStyle(bx, by) {
  const VW = window.innerWidth;
  const VH = window.innerHeight;
  const effectivePanelH = Math.min(PANEL_H, VH - EDGE * 2);
  const effectivePanelW = Math.min(PANEL_W, VW - EDGE * 2);

  // Position above the launcher if launcher is in bottom half, else below
  let top = (by > VH / 2) ? by - effectivePanelH - 10 : by + BTN_H + 10;
  top = clamp(top, EDGE, VH - effectivePanelH - EDGE);

  let left = bx + BTN_W / 2 - effectivePanelW / 2;
  left = clamp(left, EDGE, VW - effectivePanelW - EDGE);

  return {
    position: "fixed",
    top: `${Math.round(top)}px`,
    left: `${Math.round(left)}px`,
    zIndex: 110000,
  };
}

const INITIAL_MESSAGE = {
  role: "assistant",
  text: "Hi! Ask me about people, teams, leadership, events, capabilities, deliverables, pricing metrics, or program data in this app.",
};

const SUGGESTION_PROMPTS = [
  { label: "👥 Noida Team", prompt: "Who are all the users in Noida?" },
  { label: "💼 Leadership", prompt: "Show me all leadership team members" },
  { label: "📊 D&A Grand Total", prompt: "What is the grand total for D&A?" },
  { label: "🚀 AI Deliverables", prompt: "Show me all AI-based deliverables" },
];

function ChatbotWidget() {
  const [pos,     setPos]     = useState(() => loadPos() || defaultPos());
  const [isOpen,  setIsOpen]  = useState(false);
  const [question, setQuestion] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);

  const posRef      = useRef(pos);
  const messagesEnd = useRef(null);

  // Keep posRef current so drag closures always see the latest value
  useEffect(() => { posRef.current = pos; }, [pos]);

  // Clamp to viewport on window resize
  useEffect(() => {
    const onResize = () => setPos(p => clampToViewport(p.x, p.y));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  // ── Drag logic ────────────────────────────────────────────────────────────
  const onMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    e.preventDefault();

    const startMX = e.clientX;
    const startMY = e.clientY;
    const startPX = posRef.current.x;
    const startPY = posRef.current.y;
    let   moved   = false;

    const onMove = (e) => {
      const dx = e.clientX - startMX;
      const dy = e.clientY - startMY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true;
      const next = clampToViewport(startPX + dx, startPY + dy);
      posRef.current = next;
      setPos(next);
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
      savePos(posRef.current);
      if (!moved) setIsOpen(o => !o);   // click: toggle panel
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
  }, []);

  // Touch support
  const onTouchStart = useCallback((e) => {
    const touch  = e.touches[0];
    const startMX = touch.clientX;
    const startMY = touch.clientY;
    const startPX = posRef.current.x;
    const startPY = posRef.current.y;
    let   moved   = false;

    const onMove = (e) => {
      const t = e.touches[0];
      const dx = t.clientX - startMX;
      const dy = t.clientY - startMY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true;
      const next = clampToViewport(startPX + dx, startPY + dy);
      posRef.current = next;
      setPos(next);
    };

    const onEnd = () => {
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend",  onEnd);
      savePos(posRef.current);
      if (!moved) setIsOpen(o => !o);
    };

    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend",  onEnd);
  }, []);

  // ── Chat submit & Send ───────────────────────────────────────────────────
  const sendQuery = async (queryText) => {
    const trimmed = queryText.trim();
    if (!trimmed || loading) return;

    const userMsg = { role: "user", text: trimmed };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setQuestion("");
    setLoading(true);

    // Build context from recent history (last 6 turns, ignoring welcome greeting)
    const historyPayload = nextMessages
      .filter(m => m !== INITIAL_MESSAGE)
      .slice(-6)
      .map(m => ({ role: m.role, text: m.text }));

    try {
      const res = await api.post("/chatbot/ask", {
        question: trimmed,
        history: historyPayload,
      });
      setMessages(prev => [...prev, { role: "assistant", text: res.data.answer }]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          text: "I could not answer from the current app data. Please try a more specific question.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await sendQuery(question);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  };

  const handleResetChat = () => {
    setMessages([INITIAL_MESSAGE]);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const launcherStyle = {
    position: "fixed",
    left: pos.x,
    top:  pos.y,
    zIndex: 110000,
    cursor: "grab",
    userSelect: "none",
  };

  const panelStyle = getPanelStyle(pos.x, pos.y);

  return (
    <>
      {/* Draggable launcher button */}
      <div
        style={launcherStyle}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        title="Drag to move • Click to open AI chat"
      >
        <button
          type="button"
          className="chatbot-launcher"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setIsOpen(o => !o); }}
          aria-label="Open AI assistant"
        >
          {isOpen ? "✕ Close" : "Ask AI"}
        </button>
      </div>

      {/* Panel rendered as a portal so it's never clipped */}
      {isOpen && ReactDOM.createPortal(
        <div className="chatbot-panel" style={panelStyle}>
          <div className="chatbot-header">
            <div className="chatbot-header-title">
              <span className="chatbot-badge">AI</span>
              <span>NatWest Assistant</span>
            </div>
            <div className="chatbot-header-actions">
              {messages.length > 1 && (
                <button
                  type="button"
                  onClick={handleResetChat}
                  className="chatbot-action-btn"
                  title="Clear conversation"
                  aria-label="Clear conversation"
                >
                  ↺ Reset
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="chatbot-close"
                aria-label="Close AI assistant"
                title="Close"
              >
                &times;
              </button>
            </div>
          </div>

          <div className="chatbot-messages" aria-live="polite">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`chatbot-message ${msg.role === "assistant" ? "chatbot-message-assistant" : "chatbot-message-user"}`}
              >
                <strong>{msg.role === "assistant" ? "AI" : "You"}:</strong>
                <div className="chatbot-message-text">{msg.text}</div>
              </div>
            ))}
            
            {messages.length === 1 && (
              <div className="chatbot-suggestions">
                <span className="chatbot-suggestions-title">Suggested questions:</span>
                <div className="chatbot-chips">
                  {SUGGESTION_PROMPTS.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="chatbot-chip"
                      onClick={() => sendQuery(item.prompt)}
                      disabled={loading}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loading && <div className="chatbot-thinking">Thinking...</div>}
            <div ref={messagesEnd} />
          </div>

          <form onSubmit={handleSubmit} className="chatbot-form">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              placeholder="Ask a question about the app data..."
              className="chatbot-input"
              aria-label="Ask a question"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="chatbot-submit"
              aria-label={loading ? "Searching" : "Send"}
              title="Send"
            >
              <span aria-hidden="true">&rarr;</span>
            </button>
          </form>
        </div>,
        document.body,
      )}
    </>
  );
}

export default ChatbotWidget;

