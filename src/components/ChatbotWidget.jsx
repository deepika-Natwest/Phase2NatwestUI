import React, { useEffect, useRef, useState } from "react";
import api from "../services/api";
import "./ChatbotWidget.css";

function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Ask me about the people, teams, leadership, events, capabilities, deliveries, or program data shown in this app.",
    },
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) return;

    const userMessage = { role: "user", text: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    setLoading(true);

    try {
      const response = await api.post("/chatbot/ask", { question: trimmed });
      setMessages((prev) => [...prev, { role: "assistant", text: response.data.answer }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "assistant", text: "I could not answer from the current app data. Please try a more specific question." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <div className="chatbot-widget">
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="chatbot-launcher"
        >
          Ask AI
        </button>
      )}

      {isOpen && (
        <div className="chatbot-panel">
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
            {messages.map((message, index) => (
              <div
                key={index}
                className={`chatbot-message ${message.role === "assistant" ? "chatbot-message-assistant" : "chatbot-message-user"}`}
              >
                <strong>{message.role === "assistant" ? "AI" : "You"}:</strong>
                <div className="chatbot-message-text">{message.text}</div>
              </div>
            ))}

            {loading && (
              <div className="chatbot-thinking">Thinking...</div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="chatbot-form">
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
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
              aria-label={loading ? "Searching" : "Send question"}
              title={loading ? "Searching" : "Send question"}
            >
              <span aria-hidden="true">&rarr;</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default ChatbotWidget;
