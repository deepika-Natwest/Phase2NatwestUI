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

// Smart panel position: appears near the button, stays inside viewport
function getPanelStyle(bx, by) {
  const VW = window.innerWidth;
  const VH = window.innerHeight;
  const spaceBelow = VH - (by + BTN_H);
  const spaceAbove = by;

  const top    = spaceBelow >= PANEL_H + EDGE ? by + BTN_H + 8 : null;
  const bottom = top === null ? VH - by + 8 : null;
  let   left   = bx + BTN_W / 2 - PANEL_W / 2;               // centre-align with button
  left = clamp(left, EDGE, VW - PANEL_W - EDGE);

  return top !== null
    ? { position: "fixed", top, left, zIndex: 110000 }
    : { position: "fixed", bottom, left, zIndex: 110000 };
}

function ChatbotWidget() {
  const [pos,     setPos]     = useState(() => loadPos() || defaultPos());
  const [isOpen,  setIsOpen]  = useState(false);
  const [question, setQuestion] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Ask me about the people, teams, leadership, events, capabilities, deliveries, or program data shown in this app." },
  ]);

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

  // ── Chat submit ───────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) return;

    setMessages(prev => [...prev, { role: "user", text: trimmed }]);
    setQuestion("");
    setLoading(true);

    try {
      const res = await api.post("/chatbot/ask", { question: trimmed });
      setMessages(prev => [...prev, { role: "assistant", text: res.data.answer }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "I could not answer from the current app data. Please try a more specific question." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
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
            <span>NatWest AI Assistant</span>
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
