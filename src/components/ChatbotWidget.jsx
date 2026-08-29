import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import api from "../services/api";
import "./ChatbotWidget.css";

const BTN_W     = 96;
const BTN_H     = 48;
const PANEL_W   = 360;
const PANEL_H   = 520;
const EDGE      = 12;
const MIN_W     = 280;
const MIN_H     = 320;

function loadSize() {
  try {
    const s = JSON.parse(localStorage.getItem("chatbotSize"));
    if (s && typeof s.w === "number" && typeof s.h === "number") return s;
  } catch { /* ignore */ }
  return null;
}

function saveSize(s) {
  try { localStorage.setItem("chatbotSize", JSON.stringify(s)); } catch { /* ignore */ }
}

function loadPanelPos() {
  try {
    const p = JSON.parse(localStorage.getItem("chatbotPanelPos"));
    if (p && typeof p.top === "number" && typeof p.left === "number") return p;
  } catch { /* ignore */ }
  return null;
}

function savePanelPos(p) {
  try { localStorage.setItem("chatbotPanelPos", JSON.stringify(p)); } catch { /* ignore */ }
}

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
function getPanelStyle(bx, by, pw, ph) {
  const VW = window.innerWidth;
  const VH = window.innerHeight;
  const effectivePanelH = Math.min(ph, VH - EDGE * 2);
  const effectivePanelW = Math.min(pw, VW - EDGE * 2);

  // Position above the launcher if launcher is in bottom half, else below
  let top = (by > VH / 2) ? by - effectivePanelH - 10 : by + BTN_H + 10;
  top = clamp(top, EDGE, VH - effectivePanelH - EDGE);

  let left = bx + BTN_W / 2 - effectivePanelW / 2;
  left = clamp(left, EDGE, VW - effectivePanelW - EDGE);

  return {
    position: "fixed",
    top: `${Math.round(top)}px`,
    left: `${Math.round(left)}px`,
    width: `${Math.round(effectivePanelW)}px`,
    height: `${Math.round(effectivePanelH)}px`,
    zIndex: 110000,
  };
}

const INITIAL_MESSAGES = [
  { role: "assistant", text: "Hi! How may I help you?" },
  { role: "assistant", text: "Select one of the options below or type your query." },
];

const CATEGORIES = [
  {
    id: "people",
    label: "👥 People & Projects",
    questions: [
      "Which users are on SOW contracts expiring this month?",
      "How many users are assigned to each capability?",
      "Who in Bangalore is at Career Level 5 or above?",
      "Which franchise has the most people assigned?",
      "Are there any users with no franchise assigned?",
      "How many contractors vs permanent staff do we have?",
    ],
  },
  {
    id: "deliverables",
    label: "📦 Deliverables Insights",
    questions: [
      "Which capability has the most deliverables?",
      "How many cost-saving deliverables do we have and what is the total saving?",
      "Which franchise has delivered the most AI-based work?",
      "Are there any deliverables with no capability linked?",
      "Which deliverables involve process improvement and how many hours were saved?",
    ],
  },
  {
    id: "utilization",
    label: "📊 Utilization & Trends",
    questions: [
      "Which month had the highest utilization this year?",
      "Has utilization been going up or down over the last 3 months?",
      "What is the gap between current headcount and billable headcount?",
      "What percentage of the team is billable?",
    ],
  },
  {
    id: "programs",
    label: "🚀 Program & Franchise Analysis",
    questions: [
      "How many programs are currently active across all franchises?",
      "Which franchise has the highest number of programs?",
      "Are there any programs with no resources assigned?",
      "Which programs are AI-based?",
    ],
  },
  {
    id: "recognitions",
    label: "🏆 Recognition Pattern",
    questions: [
      "Who has received more than one recognition?",
      "Which location has the most recognitions?",
      "How many people were recognised this year?",
      "What is the most common recognition type given?",
    ],
  },
  {
    id: "events",
    label: "📅 Event Intelligence",
    questions: [
      "How many events are planned for this quarter?",
      "Which location hosts the most events?",
      "Are there any events with no location set?",
      "How many events were cancelled vs completed?",
    ],
  },
  {
    id: "sow",
    label: "📋 SOW & Resource Details",
    questions: [
      "Which users have SOW end dates within the next 30 days?",
      "How many people are on bench (no project assigned)?",
      "Which resources have been on the project the longest based on NatWest DOJ?",
    ],
  },
  {
    id: "org",
    label: "🏢 Org Structure",
    questions: [
      "Are there capabilities with no franchises under them?",
      "Are there franchises with no users assigned?",
      "Which teams have no upcoming deliverables?",
    ],
  },
];

function ChatbotWidget() {
  const [pos,              setPos]             = useState(() => loadPos() || defaultPos());
  const [panelSize,        setPanelSize]       = useState(() => loadSize() || { w: PANEL_W, h: PANEL_H });
  const [panelPos,         setPanelPos]        = useState(() => loadPanelPos());
  const [isOpen,           setIsOpen]          = useState(false);
  const [isMinimized,      setIsMinimized]     = useState(false);
  const [question,         setQuestion]        = useState("");
  const [loading,          setLoading]         = useState(false);
  const [messages,         setMessages]        = useState(INITIAL_MESSAGES);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const posRef        = useRef(pos);
  const panelSizeRef  = useRef(panelSize);
  const panelPosRef   = useRef(panelPos);
  const messagesEnd   = useRef(null);

  // Keep refs current so closures always see the latest values
  useEffect(() => { posRef.current = pos; }, [pos]);
  useEffect(() => { panelSizeRef.current = panelSize; }, [panelSize]);
  useEffect(() => { panelPosRef.current = panelPos; }, [panelPos]);

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

  // ── Resize handles ───────────────────────────────────────────────────────
  // direction: "e" (right), "s" (bottom), "se" (corner)
  const onResizeStart = useCallback((e, direction) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const startMX = e.clientX;
    const startMY = e.clientY;
    const startW  = panelSizeRef.current.w;
    const startH  = panelSizeRef.current.h;

    const onMove = (e) => {
      const dx = e.clientX - startMX;
      const dy = e.clientY - startMY;
      const newW = direction === "s" ? startW : Math.max(MIN_W, Math.min(startW + dx, window.innerWidth  - EDGE * 2));
      const newH = direction === "e" ? startH : Math.max(MIN_H, Math.min(startH + dy, window.innerHeight - EDGE * 2));
      const next = { w: newW, h: newH };
      panelSizeRef.current = next;
      setPanelSize(next);
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
      saveSize(panelSizeRef.current);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
  }, []);

  // ── Panel header drag (moves the open panel independently) ─────────────
  const onPanelHeaderMouseDown = useCallback((e) => {
    // Ignore clicks on buttons inside the header
    if (e.target.closest("button")) return;
    if (e.button !== 0) return;
    e.preventDefault();

    const startMX   = e.clientX;
    const startMY   = e.clientY;
    const startTop  = (panelPosRef.current?.top)  ?? (parseInt(e.currentTarget.closest(".chatbot-panel").style.top,  10) || 0);
    const startLeft = (panelPosRef.current?.left) ?? (parseInt(e.currentTarget.closest(".chatbot-panel").style.left, 10) || 0);
    const pw = panelSizeRef.current.w;
    const ph = panelSizeRef.current.h;

    const onMove = (e) => {
      const next = {
        top:  clamp(startTop  + (e.clientY - startMY), EDGE, window.innerHeight - ph - EDGE),
        left: clamp(startLeft + (e.clientX - startMX), EDGE, window.innerWidth  - pw - EDGE),
      };
      panelPosRef.current = next;
      setPanelPos(next);
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
      savePanelPos(panelPosRef.current);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
  }, []);

  // ── Chat submit & Send ───────────────────────────────────────────────────
  // viaChip=true  → keep selected category so its questions reappear after the answer
  // viaChip=false → reset to full category list after the answer
  const sendQuery = async (queryText, viaChip = false) => {
    const trimmed = queryText.trim();
    if (!trimmed || loading) return;

    const userMsg = { role: "user", text: trimmed };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setQuestion("");
    setLoading(true);

    // Build context from recent history (last 6 turns, ignoring welcome messages)
    const historyPayload = nextMessages
      .filter(m => !INITIAL_MESSAGES.includes(m))
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
      if (!viaChip) setSelectedCategory(null); // typed query → show full category list
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await sendQuery(question, false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  };

  const handleResetChat = () => {
    setMessages(INITIAL_MESSAGES);
    setSelectedCategory(null);
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

  const autoStyle  = getPanelStyle(pos.x, pos.y, panelSize.w, panelSize.h);
  const panelStyle = panelPos
    ? { ...autoStyle, top: `${panelPos.top}px`, left: `${panelPos.left}px` }
    : autoStyle;

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
        <div className={`chatbot-panel${isMinimized ? " chatbot-panel--minimized" : ""}`} style={panelStyle}>
          <div
            className="chatbot-header"
            onMouseDown={onPanelHeaderMouseDown}
            style={{ cursor: "move" }}
            title="Drag to move panel"
          >
            <div className="chatbot-header-title">
              <span className="chatbot-badge">AI</span>
              <span>NatWest Assistant</span>
            </div>
            <div className="chatbot-header-actions">
              {messages.length > INITIAL_MESSAGES.length && !isMinimized && (
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
                onClick={() => setIsMinimized(m => !m)}
                className="chatbot-action-btn chatbot-minimize-btn"
                title={isMinimized ? "Restore" : "Minimise"}
                aria-label={isMinimized ? "Restore chat" : "Minimise chat"}
              >
                {isMinimized ? "▲" : "▬"}
              </button>
              <button
                type="button"
                onClick={() => { setIsOpen(false); setIsMinimized(false); }}
                className="chatbot-close"
                aria-label="Close AI assistant"
                title="Close"
              >
                &times;
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
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

                {/* Category / question chips — always visible */}
                <div className="chatbot-suggestions">
                    {!selectedCategory ? (
                      /* Level 1: category chips */
                      <>
                        <span className="chatbot-suggestions-title">Choose a category:</span>
                        <div className="chatbot-chips">
                          {CATEGORIES.map((cat) => (
                            <button
                              key={cat.id}
                              type="button"
                              className="chatbot-chip"
                              onClick={() => setSelectedCategory(cat)}
                              disabled={loading}
                            >
                              {cat.label}
                            </button>
                          ))}
                        </div>
                      </>
                    ) : (
                      /* Level 2: question chips — re-appears after each answer */
                      <>
                        <div className="chatbot-cat-header">
                          <button
                            type="button"
                            className="chatbot-back-btn"
                            onClick={() => setSelectedCategory(null)}
                          >
                            ← Back
                          </button>
                          <span className="chatbot-suggestions-title">{selectedCategory.label}</span>
                        </div>
                        <div className="chatbot-chips">
                          {selectedCategory.questions.map((q, idx) => (
                            <button
                              key={idx}
                              type="button"
                              className="chatbot-chip"
                              onClick={() => sendQuery(q, true)}
                              disabled={loading}
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

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
            </>
          )}

          {/* Resize handles — only when panel is open and not minimized */}
          {!isMinimized && (
            <>
              <div className="chatbot-resize chatbot-resize-e"  onMouseDown={(e) => onResizeStart(e, "e")}  title="Drag to resize width" />
              <div className="chatbot-resize chatbot-resize-s"  onMouseDown={(e) => onResizeStart(e, "s")}  title="Drag to resize height" />
              <div className="chatbot-resize chatbot-resize-se" onMouseDown={(e) => onResizeStart(e, "se")} title="Drag to resize" />
            </>
          )}
        </div>,
        document.body,
      )}
    </>
  );
}

export default ChatbotWidget;

