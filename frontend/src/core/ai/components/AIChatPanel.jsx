import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAI } from "../useAI";
import { intentEngine } from "../utils/IntentEngine";
import MarkdownRenderer from "./MarkdownRenderer";
import { AIChatErrorBoundary } from "./AIChatErrorBoundary";

export default function AIChatPanel({ onClose, initialAgent = null, fullScreen = false }) {
  const {
    messages, loading, streaming, currentStream, error, executionStatus,
    sendStreamMessage, clearMessages, currentAgent, setCurrentAgent,
    stopGeneration,
  } = useAI();

  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const isStreaming = streaming || loading;
  const hasMessages = messages.length > 0;

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, currentStream]);

  const handleSend = useCallback(async (text) => {
    const msg = (text || input || "").trim();
    if (!msg || isStreaming) return;
    setInput("");
    try {
      await sendStreamMessage(msg, { agent: currentAgent });
    } catch (err) { console.error("[AIChat] send error:", err); }
    if (inputRef.current) inputRef.current.focus();
  }, [input, isStreaming, sendStreamMessage, currentAgent]);

  const handleKeyDown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };

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
        {/* ===== TOP BAR ===== */}
        <header
          className="flex-shrink-0 relative z-20"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(3,3,3,0.85)", backdropFilter: "blur(20px) saturate(1.5)" }}
        >
          <div className="flex items-center justify-between px-5 h-14">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm"
                  style={{
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    color: "white",
                    boxShadow: "0 2px 12px rgba(99,102,241,0.3)",
                  }}
                >
                  B
                </div>
                <span className="text-sm font-semibold tracking-tight" style={{ color: "rgba(255,255,255,0.9)" }}>
                  BRANPY
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isStreaming && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={stopGeneration}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: "rgba(239,68,68,0.1)",
                    color: "rgba(239,68,68,0.8)",
                    border: "1px solid rgba(239,68,68,0.15)",
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><rect x="1" y="1" width="8" height="8" rx="1" /></svg>
                  Parar
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={clearMessages}
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
        </header>

        {/* ===== MAIN CONTENT ===== */}
        <div className="flex-1 overflow-hidden relative z-10" style={{ display: "flex", flexDirection: "column" }}>
          {!hasMessages ? (
            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
              <div className="max-w-3xl mx-auto px-5 sm:px-8 py-10 sm:py-20">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="text-center mb-12 sm:mb-16"
                >
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
                    className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 tracking-tight"
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
                    }}> AI</span>
                  </h1>

                  <p
                    className="text-sm sm:text-base max-w-xl mx-auto"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                  >
                    Inteligência artificial para criar, editar e publicar.
                  </p>
                </motion.div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5" style={{ scrollbarWidth: "thin" }}>
                <div className="max-w-3xl mx-auto space-y-4">
                  <AnimatePresence initial={false}>
                    {messages.map((msg, i) => {
                      if (msg.role !== "user" && !msg.content) return null;
                      const isUser = msg.role === "user";

                      return (
                        <motion.div
                          key={msg.id || i}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                          className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
                        >
                          {!isUser && (
                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5"
                              style={{
                                background: "linear-gradient(135deg, rgba(99,102,241,0.15), transparent)",
                                border: "1px solid rgba(99,102,241,0.15)",
                                color: "#6366f1",
                              }}
                            >
                              B
                            </div>
                          )}

                          <div className={`max-w-[85%] sm:max-w-[75%] ${isUser ? "" : ""}`}>
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
                              {isUser ? msg.content : <MarkdownRenderer content={msg.content} />}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

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
                          <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Pensando...</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {executionStatus && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs mx-auto"
                      style={{
                        background: executionStatus.type === "search"
                          ? "rgba(251,191,36,0.08)"
                          : executionStatus.type === "search-done"
                          ? "rgba(16,185,129,0.06)"
                          : "rgba(99,102,241,0.06)",
                        border: `1px solid ${
                          executionStatus.type === "search"
                            ? "rgba(251,191,36,0.15)"
                            : executionStatus.type === "search-done"
                            ? "rgba(16,185,129,0.12)"
                            : "rgba(99,102,241,0.1)"
                        }`,
                        color: executionStatus.type === "search"
                          ? "rgba(251,191,36,0.8)"
                          : executionStatus.type === "search-done"
                          ? "rgba(16,185,129,0.7)"
                          : "rgba(99,102,241,0.7)",
                        maxWidth: 460,
                      }}
                    >
                      <span>{executionStatus.message || "Processando..."}</span>
                    </motion.div>
                  )}

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
                border: `1px solid ${input.trim() ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.08)"}`,
                boxShadow: input.trim()
                  ? "0 0 20px rgba(99,102,241,0.08), 0 4px 24px rgba(0,0,0,0.3)"
                  : "0 2px 16px rgba(0,0,0,0.2)",
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
                      ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                      : "rgba(255,255,255,0.06)",
                    opacity: input.trim() && !isStreaming ? 1 : 0.4,
                    cursor: input.trim() && !isStreaming ? "pointer" : "not-allowed",
                    boxShadow: input.trim() ? "0 4px 12px rgba(99,102,241,0.3)" : "none",
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
          </div>
        </motion.div>
      </div>
    </AIChatErrorBoundary>
  );
}
