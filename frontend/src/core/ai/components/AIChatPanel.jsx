import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAI } from "../useAI";
import { getAgentConfigs } from "../agents/AgentRegistry";
import { getAvailableProviders } from "../providers/ProviderFactory";
import { intentEngine } from "../utils/IntentEngine";
import MarkdownRenderer from "./MarkdownRenderer";
import ToolGrid from "./ToolGrid";
import { AIChatErrorBoundary } from "./AIChatErrorBoundary";

const PROVIDER_LABELS = {
  opencode: "OpenCode", openrouter: "OpenRouter", groq: "Groq", gemini: "Gemini",
  openai: "OpenAI", deepseek: "DeepSeek", qwen: "Qwen API", ollama: "Ollama Local",
  "branpy-demo": "BRANPY Demo",
};

const PROVIDER_COLORS = {
  opencode: "#6366f1", openrouter: "#8b5cf6", groq: "#10b981", gemini: "#3b82f6",
  openai: "#10a37f", deepseek: "#4f46e5", qwen: "#a855f7", ollama: "#f59e0b",
  "branpy-demo": "#06b6d4",
};

const CHAT_INTRO = [
  { text: "Comece digitando sua mensagem abaixo", icon: "💬" },
  { text: "Ou escolha uma ferramenta rápida acima", icon: "⚡" },
  { text: "Pressione ⌘K para comandos", icon: "⌨️" },
];

export default function AIChatPanel({ onClose, initialAgent = null, fullScreen = false }) {
  const {
    messages, loading, streaming, currentStream, error, executionStatus,
    sendMessage, sendStreamMessage, clearMessages, newSession, loadSession,
    sessions, currentAgent, setCurrentAgent, currentProvider, setCurrentProvider,
    currentModel, setCurrentModel, stopGeneration, ollamaOnline,
  } = useAI();

  const [input, setInput] = useState("");
  const [showAgents, setShowAgents] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [showProviders, setShowProviders] = useState(false);
  const [editingMsg, setEditingMsg] = useState(null);
  const [editText, setEditText] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [showToolGrid, setShowToolGrid] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const agentsRef = useRef(null);
  if (!agentsRef.current) { try { agentsRef.current = getAgentConfigs(); } catch { agentsRef.current = []; } }
  const providersRef = useRef(null);
  if (!providersRef.current) { try { providersRef.current = getAvailableProviders(); } catch { providersRef.current = []; } }
  const agents = agentsRef.current;
  const providers = providersRef.current;
  const isStreaming = streaming || loading;
  const hasMessages = messages.length > 0;

  useEffect(() => {
    if (initialAgent) {
      const agent = typeof initialAgent === "string" ? getAgentConfigs().find((a) => a.id === initialAgent) : initialAgent;
      if (agent) setCurrentAgent(agent);
    }
  }, [initialAgent]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, currentStream]);

  const currentAgentRef = useRef(currentAgent);
  currentAgentRef.current = currentAgent;
  const currentProviderRef = useRef(currentProvider);
  currentProviderRef.current = currentProvider;
  const currentModelRef = useRef(currentModel);
  currentModelRef.current = currentModel;

  const providerColor = PROVIDER_COLORS[currentProvider] || "#6366f1";
  const providerName = (id) => PROVIDER_LABELS[id] || id;

  const ollamaStatusColor = ollamaOnline === "online"
    ? "rgba(16,185,129,0.7)"
    : ollamaOnline === "connecting"
    ? "rgba(251,191,36,0.7)"
    : "rgba(239,68,68,0.5)";

  const handleSend = useCallback(async (text) => {
    const msg = (text || input || "").trim();
    if (!msg || isStreaming) return;
    setInput("");
    setShowToolGrid(false);
    let intent = { id: "general", label: "Geral" };
    let targetAgentId = null;
    try {
      if (intentEngine) { intent = intentEngine.classify(msg); targetAgentId = intentEngine.getAgentForIntent(intent.id); }
    } catch { intent = { id: "general", label: "Geral" }; }
    const agent = currentAgentRef.current;
    if (targetAgentId && targetAgentId !== agent.id) {
      const target = (agentsRef.current || []).find((a) => a.id === targetAgentId);
      if (target) { setCurrentAgent(target); currentAgentRef.current = target; }
    }
    try {
      const shouldExec = intentEngine ? intentEngine.shouldExecute(intent.id) : false;
      const finalAgent = currentAgentRef.current;
      const finalProvider = currentProviderRef.current;
      const finalModel = currentModelRef.current;
      if (shouldExec) {
        let execPrompt = msg;
        try { execPrompt = intentEngine.generateExecutionPrompt(intent.id, msg) || msg; } catch { execPrompt = msg; }
        await sendStreamMessage(execPrompt, { agent: finalAgent, provider: finalProvider, model: finalModel });
      } else {
        await sendStreamMessage(msg, { agent: finalAgent, provider: finalProvider, model: finalModel });
      }
    } catch (err) { console.error("[AIChat] send error:", err); }
    if (inputRef.current) inputRef.current.focus();
  }, [input, isStreaming, sendStreamMessage]);

  const handleKeyDown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };
  const handleToolSelect = (tool) => { handleSend(tool.prompt); };
  const handleNewChat = () => { clearMessages(); setShowToolGrid(true); };

  const handleRegenerate = async (msg) => {
    await clearMessages();
    const userMsgs = messages.filter((m) => m.role === "user");
    if (userMsgs.length > 0) await handleSend(userMsgs[userMsgs.length - 1].content);
  };

  const handleEdit = (msg) => { setEditingMsg(msg.id); setEditText(msg.content); };
  const handleSaveEdit = async () => { setEditingMsg(null); await handleSend(editText); };
  const handleCancelEdit = () => { setEditingMsg(null); setEditText(""); };

  const selectAgent = (agent) => { setCurrentAgent(agent); setShowAgents(false); };
  const selectProvider = (provider) => { setCurrentProvider(provider.id); setShowProviders(false); };

  return (
    <AIChatErrorBoundary>
      <div
        className="flex flex-col min-h-0"
        style={{
          flex: 1,
          background: "linear-gradient(160deg, #080808 0%, #0a0a0a 50%, #0d0d0d 100%)",
          color: "white",
          fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
          position: "relative",
          ...(fullScreen ? { position: "fixed", inset: 0, zIndex: 100 } : {}),
        }}
      >
        {/* Ambient glow */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
          <div style={{ position: "absolute", top: "-20%", right: "-10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.03) 0%, transparent 70%)" }} />
          <div style={{ position: "absolute", bottom: "-10%", left: "-5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(168,85,247,0.02) 0%, transparent 70%)" }} />
        </div>

        {/* ===== TOP BAR ===== */}
        <motion.div
          initial={false}
          className="flex-shrink-0 relative z-10"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(10,10,10,0.8)", backdropFilter: "blur(16px)" }}
        >
          <div className="flex items-center justify-between px-4 h-12">
            {/* Left: Brand + Status */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", color: "white" }}
                >
                  B
                </div>
                <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
                  BRANPY
                </span>
              </div>

              {/* Online status */}
              {currentProvider === "ollama" && ollamaOnline && (
                <div
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono"
                  style={{
                    background: ollamaOnline === "online"
                      ? "rgba(16,185,129,0.1)"
                      : ollamaOnline === "connecting"
                      ? "rgba(251,191,36,0.08)"
                      : "rgba(239,68,68,0.08)",
                    border: ollamaOnline === "online"
                      ? "1px solid rgba(16,185,129,0.15)"
                      : ollamaOnline === "connecting"
                      ? "1px solid rgba(251,191,36,0.12)"
                      : "1px solid rgba(239,68,68,0.12)",
                    color: ollamaStatusColor,
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: ollamaStatusColor,
                      animation: ollamaOnline === "connecting" ? "pulse 1.5s infinite" : "none",
                    }}
                  />
                  {ollamaOnline === "online" ? `Ollama ${currentModel || "qwen2.5-coder:7b"}` : ollamaOnline === "connecting" ? "Conectando..." : "Offline"}
                </div>
              )}
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-1.5">
              {/* Provider selector */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowProviders(!showProviders)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors"
                  style={{
                    background: showProviders ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
                    color: "rgba(255,255,255,0.7)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: providerColor }} />
                  {providerName(currentProvider)}
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.5 }}>
                    <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.button>
                <AnimatePresence>
                  {showProviders && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full right-0 mt-1 rounded-xl overflow-hidden z-50 min-w-[160px]"
                      style={{ background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}
                    >
                      {providers.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => selectProvider(p)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors text-left"
                          style={{
                            color: currentProvider === p.id ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)",
                            background: currentProvider === p.id ? "rgba(59,130,246,0.1)" : "transparent",
                          }}
                          onMouseEnter={(e) => { if (currentProvider !== p.id) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                          onMouseLeave={(e) => { if (currentProvider !== p.id) e.currentTarget.style.background = "transparent"; }}
                        >
                          <span className="w-2 h-2 rounded-full" style={{ background: PROVIDER_COLORS[p.id] || "#666" }} />
                          <span>{p.name}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* New chat */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNewChat}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors"
                style={{ background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 2.5v7M2.5 6h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Novo chat
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* ===== MAIN CONTENT ===== */}
        <div className="flex-1 overflow-hidden relative z-10" style={{ display: "flex", flexDirection: "column" }}>
          {!hasMessages && showToolGrid ? (
            /* ===== LANDING: EMPTY STATE WITH TOOL GRID ===== */
            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
              <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                {/* Hero section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                  className="text-center mb-8"
                >
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                    className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
                    style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.1))", border: "1px solid rgba(59,130,246,0.15)" }}
                  >
                    <span className="text-2xl">🧠</span>
                  </motion.div>
                  <h1 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: "rgba(255,255,255,0.9)" }}>
                    O que você quer criar hoje?
                  </h1>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                    Escolha uma ferramenta abaixo ou digite sua mensagem
                  </p>
                </motion.div>

                {/* Tool Grid */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <ToolGrid
                    onSelectTool={handleToolSelect}
                    activeCategory={activeCategory}
                    onCategoryChange={setActiveCategory}
                  />
                </motion.div>

                {/* Bottom hints */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="flex justify-center gap-4 mt-8"
                >
                  {CHAT_INTRO.map((hint, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px]"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.35)" }}
                    >
                      <span>{hint.icon}</span>
                      <span>{hint.text}</span>
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>
          ) : (
            /* ===== CHAT VIEW ===== */
            <div className="flex-1 flex flex-col min-h-0">
              {/* Messages area */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4" style={{ scrollbarWidth: "thin" }}>
                <div className="max-w-3xl mx-auto space-y-3">
                  <AnimatePresence initial={false}>
                    {messages.map((msg, i) => {
                      if (msg.role !== "user" && !msg.content) return null;
                      const isUser = msg.role === "user";
                      const isEditing = editingMsg === msg.id;

                      return (
                        <motion.div
                          key={msg.id || i}
                          initial={{ opacity: 0, y: 10, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                          className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
                        >
                          {/* Avatar */}
                          {!isUser && (
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                              style={{
                                background: msg.provider
                                  ? `linear-gradient(135deg, ${PROVIDER_COLORS[msg.provider] || "#6366f1"}33, transparent)`
                                  : "linear-gradient(135deg, rgba(59,130,246,0.15), transparent)",
                                border: `1px solid ${msg.provider ? (PROVIDER_COLORS[msg.provider] || "#6366f1") + "22" : "rgba(59,130,246,0.15)"}`,
                                color: msg.provider ? (PROVIDER_COLORS[msg.provider] || "#6366f1") : "#3b82f6",
                              }}
                            >
                              B
                            </div>
                          )}

                          {/* Message bubble */}
                          <div className={`max-w-[80%] ${isUser ? "text-right" : ""}`}>
                            <div
                              className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                                isUser ? "rounded-tr-md" : "rounded-tl-md"
                              }`}
                              style={
                                isUser
                                  ? {
                                      background: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.1))",
                                      border: "1px solid rgba(59,130,246,0.12)",
                                      color: "rgba(255,255,255,0.85)",
                                    }
                                  : {
                                      background: "rgba(255,255,255,0.03)",
                                      border: "1px solid rgba(255,255,255,0.06)",
                                      color: "rgba(255,255,255,0.8)",
                                    }
                              }
                            >
                              {isEditing ? (
                                <div className="flex flex-col gap-2">
                                  <textarea
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    className="w-full bg-transparent text-sm outline-none resize-none"
                                    style={{ color: "rgba(255,255,255,0.8)", minHeight: 60 }}
                                    autoFocus
                                  />
                                  <div className="flex gap-2 justify-end">
                                    <button onClick={handleCancelEdit} className="text-[11px] px-2.5 py-1 rounded-md" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>Cancelar</button>
                                    <button onClick={handleSaveEdit} className="text-[11px] px-2.5 py-1 rounded-md" style={{ background: "rgba(59,130,246,0.2)", color: "#3b82f6" }}>Enviar</button>
                                  </div>
                                </div>
                              ) : isUser ? (
                                msg.content
                              ) : (
                                <MarkdownRenderer content={msg.content} />
                              )}
                            </div>

                            {/* Provider badge */}
                            {!isUser && msg.provider && (
                              <div className="flex items-center gap-1.5 mt-1 px-1">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: PROVIDER_COLORS[msg.provider] || "#666" }} />
                                <span className="text-[10px] font-medium" style={{ color: "rgba(255,255,255,0.25)" }}>
                                  {providerName(msg.provider)}
                                </span>
                                {!isStreaming && (
                                  <button
                                    onClick={() => handleEdit(msg)}
                                    className="text-[10px] ml-1 opacity-0 hover:opacity-100 transition-opacity"
                                    style={{ color: "rgba(255,255,255,0.2)" }}
                                  >
                                    Editar
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {/* Streaming indicator */}
                  <AnimatePresence>
                    {streaming && currentStream && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex gap-3"
                      >
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                          style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.15), transparent)", border: "1px solid rgba(59,130,246,0.15)", color: "#3b82f6" }}
                        >
                          B
                        </div>
                        <div className="rounded-2xl rounded-tl-md px-4 py-2.5 text-sm leading-relaxed max-w-[80%]"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.8)" }}
                        >
                          <MarkdownRenderer content={currentStream} />
                          <motion.span
                            animate={{ opacity: [1, 0] }}
                            transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
                            style={{ color: "#3b82f6" }}
                          >
                            ▍
                          </motion.span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Loading indicator */}
                  <AnimatePresence>
                    {loading && !currentStream && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex gap-3"
                      >
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                          style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.15), transparent)", border: "1px solid rgba(59,130,246,0.15)", color: "#3b82f6" }}
                        >
                          B
                        </div>
                        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl rounded-tl-md"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                        >
                          <div className="flex gap-1">
                            {[0, 1, 2].map((i) => (
                              <motion.div
                                key={i}
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ background: "#3b82f6" }}
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                              />
                            ))}
                          </div>
                          <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>BRANPY está pensando...</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Execution status */}
                  <AnimatePresence>
                    {executionStatus && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs mx-auto"
                        style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.1)", color: "rgba(59,130,246,0.7)", maxWidth: 400 }}
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                          style={{ width: 12, height: 12, border: "2px solid rgba(59,130,246,0.2)", borderTopColor: "#3b82f6", borderRadius: "50%" }}
                        />
                        <span>{executionStatus.message || "Executando..."}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div ref={bottomRef} />
                </div>
              </div>

              {/* Separator */}
              {hasMessages && (
                <div className="flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }} />
              )}
            </div>
          )}
        </div>

        {/* ===== INPUT AREA ===== */}
        <motion.div
          initial={false}
          className="flex-shrink-0 relative z-10 px-4 sm:px-6 pb-4 pt-3"
          style={{
            background: "linear-gradient(0deg, rgba(8,8,8,0.95) 0%, rgba(8,8,8,0) 100%)",
          }}
        >
          <div className="max-w-3xl mx-auto">
            <div
              className="relative rounded-2xl overflow-hidden transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: input.trim()
                  ? `0 0 0 1px ${providerColor}33, 0 4px 20px rgba(0,0,0,0.3)`
                  : "0 2px 12px rgba(0,0,0,0.2)",
              }}
            >
              <div className="flex items-end gap-2 p-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite sua mensagem..."
                  rows={1}
                  className="flex-1 bg-transparent text-sm outline-none resize-none px-2 py-1.5"
                  style={{ color: "rgba(255,255,255,0.8)", maxHeight: 120, lineHeight: 1.5 }}
                  onInput={(e) => {
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                  }}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isStreaming}
                  className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
                  style={{
                    background: input.trim()
                      ? `linear-gradient(135deg, ${providerColor}, ${providerColor}cc)`
                      : "rgba(255,255,255,0.06)",
                    opacity: input.trim() && !isStreaming ? 1 : 0.4,
                    cursor: input.trim() && !isStreaming ? "pointer" : "not-allowed",
                  }}
                >
                  {isStreaming ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 rounded-full"
                      style={{ border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "white" }}
                    />
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M2 8l12-6-6 12-1-5-5-1z" fill="white" />
                    </svg>
                  )}
                </motion.button>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="flex items-center justify-between mt-1.5 px-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>
                  {providerName(currentProvider)}
                </span>
                {currentModel && (
                  <>
                    <span style={{ color: "rgba(255,255,255,0.1)", fontSize: 8 }}>●</span>
                    <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>
                      {currentModel}
                    </span>
                  </>
                )}
              </div>
              {hasMessages && (
                <button
                  onClick={() => setShowToolGrid(true)}
                  className="text-[10px] px-2 py-0.5 rounded-md transition-colors"
                  style={{ background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.25)" }}
                >
                  Ferramentas
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AIChatErrorBoundary>
  );
}
