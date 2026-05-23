import React, { useState, useRef, useEffect } from "react";

const INITIAL_SYSTEM = {
  role: "system",
  content: "Você é o BRANPY, um assistente de IA completo para criação de conteúdo, automação, afiliados e negócios digitais. Responda em português brasileiro, seja direto e prático.",
};

const WELCOME_MESSAGE = {
  role: "assistant",
  content: "Olá! Sou o BRANPY, sua plataforma completa de IA para negócios digitais.\n\nPosso ajudar com:\n\n• **Criação de conteúdo** para redes sociais\n• **Copywriting** e roteiros para vídeos\n• **Importação de produtos** de marketplaces\n• **Automação** de fluxos de trabalho\n• **Geração de ideias** para campanhas\n\nO que você precisa hoje?",
};

const QUICK_ACTIONS = [
  { label: "Criar legenda para vídeo", prompt: "Crie uma legenda curta e impactante para um vídeo de produto no TikTok/Instagram" },
  { label: "Roteiro para review", prompt: "Crie um roteiro de 30 segundos para um vídeo de review de produto" },
  { label: "Ideias de conteúdo", prompt: "Me dê 5 ideias de conteúdo para redes sociais sobre afiliados" },
  { label: "Otimizar descrição", prompt: "Melhore esta descrição de produto para conversão: " },
];

export default function AIChat() {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState("gpt-4o-mini");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text) => {
    const userText = text || input;
    if (!userText.trim() || loading) return;
    setInput("");

    const userMsg = { role: "user", content: userText.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);

    const assistantMsg = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      const apiKey = localStorage.getItem("openai_key") || import.meta.env?.REACT_APP_OPENAI_KEY || "";
      const baseUrl = localStorage.getItem("openai_base_url") || "https://api.openai.com/v1";

      if (!apiKey) {
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            role: "assistant",
            content: "⚠️ Chave da API não configurada. Adicione sua chave OpenAI em **Configurações > Integrações** ou configure a variável `REACT_APP_OPENAI_KEY`.",
          };
          return copy;
        });
        setLoading(false);
        return;
      }

      const chatMessages = [INITIAL_SYSTEM, ...updated.map((m) => ({ role: m.role, content: m.content }))];

      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model, messages: chatMessages, stream: false, max_tokens: 1024 }),
      });

      if (!res.ok) {
        const errData = await res.text();
        throw new Error(`API error: ${res.status} — ${errData.slice(0, 150)}`);
      }

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || "Sem resposta.";
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content: reply };
        return copy;
      });
    } catch (e) {
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          role: "assistant",
          content: `❌ Erro: ${e.message}`,
        };
        return copy;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (prompt) => {
    handleSend(prompt);
  };

  const clearChat = () => {
    setMessages([WELCOME_MESSAGE]);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0d0d0d]">
      <div className="flex items-center justify-between px-6 h-14 border-b border-white/[0.06] flex-shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-medium text-white/90">AI Chat</h1>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white/70 outline-none focus:border-white/20"
          >
            <option value="gpt-4o-mini">GPT-4o Mini</option>
            <option value="gpt-4o">GPT-4o</option>
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
          </select>
        </div>
        <button onClick={clearChat} className="text-xs text-white/30 hover:text-white/70 transition-colors px-2 py-1 rounded hover:bg-white/5">
          Nova conversa
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/20 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                B
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-emerald-500/10 text-white/90 border border-emerald-500/10"
                  : "bg-white/5 text-white/80 border border-white/5"
              }`}
            >
              {msg.content}
            </div>
            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                U
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/20 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
              B
            </div>
            <div className="max-w-[75%] rounded-2xl px-4 py-3 bg-white/5 border border-white/5">
              <div className="flex gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length === 1 && !loading && (
        <div className="px-6 pb-4">
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((action, i) => (
              <button
                key={i}
                onClick={() => handleQuickAction(action.prompt)}
                className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white/80 hover:bg-white/10 hover:border-white/20 transition-all"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 pb-4 pt-2 border-t border-white/[0.06]">
        <div className="max-w-3xl mx-auto flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem..."
            rows={1}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/80 placeholder:text-white/20 outline-none focus:border-white/20 focus:bg-white/[0.07] resize-none transition-all"
            style={{ minHeight: 40, maxHeight: 160 }}
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="h-10 w-10 rounded-xl bg-emerald-500/80 hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all flex-shrink-0"
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
