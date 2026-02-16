import React, { useState, useRef, useEffect } from "react";
import "./AIAgent.css";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const AIAgent: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Привет! Я ИИ-агент этого сайта. Что мне доработать?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userMessage },
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:3001/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.content },
      ]);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Ошибка: ${errorMessage}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`ai-agent-container ${isOpen ? "open" : ""}`}>
      {!isOpen && (
        <button className="ai-agent-toggle" onClick={() => setIsOpen(true)}>
          🤖 Сделай сайт лучше
        </button>
      )}

      {isOpen && (
        <div className="ai-agent-chat">
          <div className="ai-agent-header">
            <span>AI Agent - Архитектор</span>
            <button onClick={() => setIsOpen(false)}>✕</button>
          </div>
          <div className="ai-agent-messages">
            {messages.map((m, i) => (
              <div key={i} className={`message ${m.role}`}>
                <div className="message-content">{m.content}</div>
              </div>
            ))}
            {isLoading && (
              <div className="message assistant loading">
                Думаю и редактирую файлы...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <form className="ai-agent-input" onSubmit={handleSubmit}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Введите запрос (например: 'Сделай темную тему')"
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading}>
              Отправить
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
