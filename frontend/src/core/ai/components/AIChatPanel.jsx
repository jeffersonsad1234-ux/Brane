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
  const [ollamaModelMode, setOllamaModelMode] = useState("codigo");
  const OLLAMA_MODELS = { rapido: "llama3.2:3b", codigo: "qwen2.5-coder:7b" };
  const OLLAMA_MODES = [
    { id: "rapido", label: "Rápido", model: "llama3.2:3b" },
    { id: "codigo", label: "Código", model: "qwen2.5-coder:7b" },
  ];
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
  const selectOllamaMode = (modeId) => {
    setOllamaModelMode(modeId);
    const model = OLLAMA_MODELS[modeId];
    if (model) setCurrentModel(model);
  };
  const currentOllamaMode = OLLAMA_MODES.find((m) => m.id === ollamaModelMode);

  return (
    <AIChatErrorBoundary>
      <div
        className="flex flex-col min-h-0"
        style={{
          flex: 1,
          background: "linear-gradient(160deg, #030303 0%, #070707 50%, #0a0a0a 100%)",
          color: "white",
          fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          position: "relative",
          ...(fullScreen ? { position: "fixed", inset: 0, zIndex: 100 } : {}),
        }}
      >
        {/* Ambient glow background */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
          <div style={{ position: "absolute", top: "-20%", left: "-10%", width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 70%)" }} />
          <div style={{ position: "absolute", bottom: "-15%", right: "-5%", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(168,85,247,0.03) 0%, transparent 70%)" }} />
          <div style={{ position: "absolute", top: "30%", right: "40%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.02) 0%, transparent 70%)" }} />
        </div>

        {/* ===== TOP BAR ===== */}
        <motion.header
          initial={false}
          className="flex-shrink-0 relative z-20"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(3,3,3,0.85)", backdropFilter: "blur(20px) saturate(1.5)" }}
        >
          <div className="flex items-center justify-between px-5 h-14">
            {/* Left: Brand */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm"
                  style={{
                    background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                    color: "white",
                    boxShadow: "0 2px 12px rgba(59,130,246,0.3)",
                  }}
                >
                  B
                </div>
                <span className="text-sm font-semibold tracking-tight" style={{ color: "rgba(255,255,255,0.9)" }}>
                  BRANPY
                </span>
              </div>

              {/* Status */}
              {ollamaOnline !== null && currentProvider === "ollama" && (
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium tracking-wide"
                  style={{
                    background: ollamaOnline === "online"
                      ? "rgba(16,185,129,0.1)"
                      : ollamaOnline === "connecting"
                      ? "rgba(251,191,36,0.08)"
                      : "rgba(239,68,68,0.08)",
                    border: `1px solid ${ollamaStatusColor}22`,
                    color: ollamaStatusColor,
                  }}
                >
                  <motion.span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: ollamaStatusColor }}
                    animate={ollamaOnline === "connecting" ? { scale: [1, 1.3, 1], opacity: [1, 0.5, 1] } : {}}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  {ollamaOnline === "online" ? "Ollama Online" : ollamaOnline === "connecting" ? "Conectando..." : "Offline"}
                </div>
              )}
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-2">
              {/* Provider selector */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowProviders(!showProviders)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
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
                      className="absolute top-full right-0 mt-1.5 rounded-xl overflow-hidden z-50 min-w-[180px]"
                      style={{ background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 12px 40px rgba(0,0,0,0.6)" }}
                    >
                      {providers.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => selectProvider(p)}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs transition-colors text-left"
                          style={{
                            color: currentProvider === p.id ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.45)",
                            background: currentProvider === p.id ? "rgba(59,130,246,0.1)" : "transparent",
                          }}
                          onMouseEnter={(e) => { if (currentProvider !== p.id) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                          onMouseLeave={(e) => { if (currentProvider !== p.id) e.currentTarget.style.background = "transparent"; }}
                        >
                          <span className="w-2 h-2 rounded-full" style={{ background: PROVIDER_COLORS[p.id] || "#666" }} />
                          <span className="font-medium">{p.name}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Ollama model mode selector */}
              {currentProvider === "ollama" && ollamaOnline === "online" && (
                <div className="flex items-center gap-1 bg-[rgba(255,255,255,0.03)] rounded-lg p-0.5 border border-[rgba(255,255,255,0.06)]">
                  {OLLAMA_MODES.map((mode) => (
                    <motion.button
                      key={mode.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => selectOllamaMode(mode.id)}
                      className="px-2.5 py-1 rounded-md text-[10px] font-medium transition-all whitespace-nowrap"
                      style={{
                        background: ollamaModelMode === mode.id
                          ? "rgba(99,102,241,0.15)"
                          : "transparent",
                        color: ollamaModelMode === mode.id
                          ? "rgba(255,255,255,0.85)"
                          : "rgba(255,255,255,0.35)",
                      }}
                    >
                      {mode.label}
                    </motion.button>
                  ))}
                </div>
              )}

              {/* New chat */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNewChat}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  color: "rgba(255,255,255,0.6)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 2.5v7M2.5 6h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Nova conversa
              </motion.button>
            </div>
          </div>
        </motion.header>

        {/* ===== MAIN CONTENT ===== */}
        <div className="flex-1 overflow-hidden relative z-10" style={{ display: "flex", flexDirection: "column" }}>
          {!hasMessages && showToolGrid ? (
            /* ===== LANDING: HERO + TOOL GRID ===== */
            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
              <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 sm:py-20">
                {/* Premium Hero */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="text-center mb-12 sm:mb-16 relative"
                >
                  {/* Hero glow */}
                  <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ width: "80%", height: 200, background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)" }}
                  />

                  <motion.div
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
                    style={{
                      background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))",
                      border: "1px solid rgba(99,102,241,0.2)",
                      boxShadow: "0 8px 40px rgba(99,102,241,0.12)",
                    }}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </motion.div>

                  <h1
                    className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-4 tracking-tight"
                    style={{
                      color: "rgba(255,255,255,0.95)",
                      textShadow: "0 2px 24px rgba(0,0,0,0.4)",
                      letterSpacing: "-0.03em",
                    }}
                  >
                    BRANPY
                    <span style={{
                      background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}> AI Studio</span>
                  </h1>

                  <p
                    className="text-sm sm:text-base lg:text-lg max-w-xl mx-auto mb-8"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                  >
                    Crie, edite e publique com inteligência artificial.
                    <br />
                    Escolha uma ferramenta abaixo para começar.
                  </p>
                </motion.div>

                {/* Tool Grid */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  <ToolGrid
                    onSelectTool={handleToolSelect}
                    activeCategory={activeCategory}
                    onCategoryChange={setActiveCategory}
                  />
                </motion.div>
              </div>
            </div>
          ) : (
            /* ===== CHAT VIEW ===== */
            <div className="flex-1 flex flex-col min-h-0">
              {/* Messages area */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5" style={{ scrollbarWidth: "thin" }}>
                <div className="max-w-3xl mx-auto space-y-4">
                  <AnimatePresence initial={false}>
                    {messages.map((msg, i) => {
                      if (msg.role !== "user" && !msg.content) return null;
                      const isUser = msg.role === "user";
                      const isEditing = editingMsg === msg.id;
                      const pColor = PROVIDER_COLORS[msg.provider] || providerColor;

                      return (
                        <motion.div
                          key={msg.id || i}
                          initial={{ opacity: 0, y: 12, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                          className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
                        >
                          {/* Avatar */}
                          {!isUser && (
                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5"
                              style={{
                                background: `linear-gradient(135deg, ${pColor}22, transparent)`,
                                border: `1px solid ${pColor}22`,
                                color: pColor,
                              }}
                            >
                              B
                            </div>
                          )}

                          {/* Message */}
                          <div className={`max-w-[85%] sm:max-w-[75%] ${isUser ? "text-right" : ""}`}>
                            <div
                              className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                                isUser ? "rounded-tr-md" : "rounded-tl-md"
                              }`}
                              style={
                                isUser
                                  ? {
                                      background: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.1))",
                                      border: "1px solid rgba(59,130,246,0.12)",
                                      color: "rgba(255,255,255,0.9)",
                                    }
                                  : {
                                      background: "rgba(255,255,255,0.03)",
                                      border: "1px solid rgba(255,255,255,0.06)",
                                      color: "rgba(255,255,255,0.85)",
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
                                    <button onClick={handleCancelEdit} className="text-xs px-3 py-1 rounded-lg" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>Cancelar</button>
                                    <button onClick={handleSaveEdit} className="text-xs px-3 py-1 rounded-lg font-medium" style={{ background: "rgba(59,130,246,0.2)", color: "#3b82f6" }}>Enviar</button>
                                  </div>
                                </div>
                              ) : isUser ? (
                                msg.content
                              ) : (
                                <MarkdownRenderer content={msg.content} />
                              )}
                            </div>

                            {/* Footer badge */}
                            {!isUser && msg.provider && (
                              <div className="flex items-center gap-2 mt-1.5 px-1">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: pColor }} />
                                <span className="text-[10px] font-medium tracking-wide" style={{ color: "rgba(255,255,255,0.2)" }}>
                                  {providerName(msg.provider)}
                                </span>
                                {!isStreaming && msg.content && (
                                  <button
                                    onClick={() => handleEdit(msg)}
                                    className="text-[10px] opacity-0 hover:opacity-100 transition-opacity px-1.5 py-0.5 rounded"
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

                  {/* Streaming */}
                  <AnimatePresence>
                    {streaming && currentStream && (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex gap-3"
                      >
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5"
                          style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.15), transparent)", border: "1px solid rgba(99,102,241,0.15)", color: "#6366f1" }}
                        >
                          B
                        </div>
                        <div
                          className="rounded-2xl rounded-tl-md px-4 py-3 text-sm leading-relaxed max-w-[85%] sm:max-w-[75%]"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.85)" }}
                        >
                          <MarkdownRenderer content={currentStream} />
                          <motion.span
                            animate={{ opacity: [1, 0] }}
                            transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
                            style={{ color: "#6366f1" }}
                          >
                            ▍
                          </motion.span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Loading */}
                  <AnimatePresence>
                    {loading && !currentStream && (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex gap-3"
                      >
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5"
                          style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.15), transparent)", border: "1px solid rgba(99,102,241,0.15)", color: "#6366f1" }}
                        >
                          B
                        </div>
                        <div
                          className="flex items-center gap-3 px-4 py-3 rounded-2xl rounded-tl-md"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                        >
                          <div className="flex gap-1">
                            {[0, 1, 2].map((i) => (
                              <motion.div
                                key={i}
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ background: "#6366f1" }}
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
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs mx-auto"
                        style={{
                          background: executionStatus.type === "search"
                            ? "rgba(251,191,36,0.08)"
                            : executionStatus.type === "search-done"
                            ? "rgba(16,185,129,0.06)"
                            : executionStatus.type === "composing"
                            ? "rgba(99,102,241,0.06)"
                            : "rgba(99,102,241,0.06)",
                          border: executionStatus.type === "search"
                            ? "1px solid rgba(251,191,36,0.15)"
                            : executionStatus.type === "search-done"
                            ? "1px solid rgba(16,185,129,0.12)"
                            : "1px solid rgba(99,102,241,0.1)",
                          color: executionStatus.type === "search"
                            ? "rgba(251,191,36,0.8)"
                            : executionStatus.type === "search-done"
                            ? "rgba(16,185,129,0.7)"
                            : "rgba(99,102,241,0.7)",
                          maxWidth: 460,
                        }}
                      >
                        <motion.div
                          animate={executionStatus.type === "search" || executionStatus.type === "composing"
                            ? { rotate: 360 }
                            : { scale: [1, 1.2, 1] }
                          }
                          transition={
                            executionStatus.type === "search" || executionStatus.type === "composing"
                              ? { duration: 1.5, repeat: Infinity, ease: "linear" }
                              : { duration: 0.6, repeat: 2 }
                          }
                          style={{
                            width: 12, height: 12,
                            border: executionStatus.type === "search-done"
                              ? "none"
                              : `2px solid ${executionStatus.type === "search" ? "rgba(251,191,36,0.2)" : "rgba(99,102,241,0.2)"}`,
                            borderTopColor: executionStatus.type === "search" ? "#f59e0b" : "#6366f1",
                            borderRadius: "50%",
                            flexShrink: 0,
                            background: executionStatus.type === "search-done" ? "rgba(16,185,129,0.7)" : "transparent",
                          }}
                        />
                        <span>{executionStatus.message || "Executando..."}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div ref={bottomRef} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ===== INPUT AREA ===== */}
        <motion.div
          initial={false}
          className="flex-shrink-0 relative z-20 px-4 sm:px-6 pb-5 pt-3"
          style={{
            background: "linear-gradient(0deg, rgba(3,3,3,0.95) 0%, rgba(3,3,3,0) 100%)",
          }}
        >
          <div className="max-w-3xl mx-auto">
            <div
              className="relative rounded-2xl overflow-hidden transition-all duration-300"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${input.trim() ? `${providerColor}44` : "rgba(255,255,255,0.08)"}`,
                boxShadow: input.trim()
                  ? `0 0 20px ${providerColor}11, 0 4px 24px rgba(0,0,0,0.3)`
                  : "0 2px 16px rgba(0,0,0,0.2)",
              }}
            >
              <div className="flex items-end gap-2 p-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={hasMessages ? "Digite sua mensagem..." : "Digite sua mensagem ou escolha uma ferramenta..."}
                  rows={1}
                  className="flex-1 bg-transparent text-sm outline-none resize-none px-3 py-2"
                  style={{ color: "rgba(255,255,255,0.85)", maxHeight: 120, lineHeight: 1.5 }}
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
                  className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200"
                  style={{
                    background: input.trim()
                      ? `linear-gradient(135deg, ${providerColor}, ${providerColor}cc)`
                      : "rgba(255,255,255,0.06)",
                    opacity: input.trim() && !isStreaming ? 1 : 0.4,
                    cursor: input.trim() && !isStreaming ? "pointer" : "not-allowed",
                    boxShadow: input.trim() ? `0 4px 12px ${providerColor}33` : "none",
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
            <div className="flex items-center justify-between mt-2 px-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium" style={{ color: "rgba(255,255,255,0.2)" }}>
                  {providerName(currentProvider)}
                </span>
                {currentModel && (
                  <>
                    <span style={{ color: "rgba(255,255,255,0.08)", fontSize: 6 }}>●</span>
                    <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>
                      {currentModel}
                    </span>
                  </>
                )}
              </div>
              {hasMessages && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowToolGrid(true)}
                  className="text-[10px] font-medium px-2.5 py-1 rounded-lg transition-colors"
                  style={{ background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.25)" }}
                >
                  Ferramentas
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AIChatErrorBoundary>
  );
}
