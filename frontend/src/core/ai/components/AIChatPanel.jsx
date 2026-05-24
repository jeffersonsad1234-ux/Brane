import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAI } from "../useAI";
import { getAgentConfigs } from "../agents/AgentRegistry";
import { getAvailableProviders } from "../providers/ProviderFactory";
import { intentEngine } from "../utils/IntentEngine";
import MarkdownRenderer from "./MarkdownRenderer";
import { AIChatErrorBoundary } from "./AIChatErrorBoundary";

const QUICK_ACTIONS = [
  { label: "Criar roteiro", prompt: "Crie um roteiro curto para um vídeo de produto no TikTok" },
  { label: "Melhorar copy", prompt: "Melhore esta descrição de produto: " },
  { label: "Ideias de conteúdo", prompt: "Me dê 5 ideias de conteúdo para afiliados" },
  { label: "Criar prompt", prompt: "Monte um prompt profissional para criar um anúncio do Facebook" },
  { label: "Estratégia SEO", prompt: "Crie uma estratégia de SEO para um ecommerce de moda" },
  { label: "Analisar", prompt: "Analise um concorrente e sugira melhorias" },
];

const PROVIDER_LABELS = {
  opencode: "OpenCode",
  openrouter: "OpenRouter",
  groq: "Groq",
  gemini: "Gemini",
  openai: "OpenAI",
  deepseek: "DeepSeek",
  qwen: "Qwen API",
  ollama: "Ollama Local",
  "branpy-demo": "BRANPY Demo",
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
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const agentsRef = useRef(null);
  if (!agentsRef.current) { try { agentsRef.current = getAgentConfigs(); } catch { agentsRef.current = []; } }
  const providersRef = useRef(null);
  if (!providersRef.current) { try { providersRef.current = getAvailableProviders(); } catch { providersRef.current = []; } }
  const agents = agentsRef.current;
  const providers = providersRef.current;
  const isStreaming = streaming || loading;

  useEffect(() => {
    if (initialAgent) {
      const agent = typeof initialAgent === "string" ? getAgentConfigs().find((a) => a.id === initialAgent) : initialAgent;
      if (agent) setCurrentAgent(agent);
    }
  }, [initialAgent]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentStream]);

  const currentAgentRef = useRef(currentAgent);
  currentAgentRef.current = currentAgent;
  const currentProviderRef = useRef(currentProvider);
  currentProviderRef.current = currentProvider;
  const currentModelRef = useRef(currentModel);
  currentModelRef.current = currentModel;

  const handleSend = useCallback(async (text) => {
    const msg = (text || input || "").trim();
    if (!msg || isStreaming) return;
    setInput("");

    let intent = { id: "general", label: "Geral" };
    let targetAgentId = null;
    try {
      if (intentEngine) {
        intent = intentEngine.classify(msg);
        targetAgentId = intentEngine.getAgentForIntent(intent.id);
      }
    } catch { intent = { id: "general", label: "Geral" }; }

    const agent = currentAgentRef.current;
    if (targetAgentId && targetAgentId !== agent.id) {
      const target = (agentsRef.current || []).find((a) => a.id === targetAgentId);
      if (target) {
        setCurrentAgent(target);
        currentAgentRef.current = target;
      }
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
    } catch (err) {
      console.error("[AIChat] send error:", err);
    }
    if (inputRef.current) inputRef.current.focus();
  }, [input, isStreaming, sendStreamMessage]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (prompt) => {
    handleSend(prompt);
  };

  const handleRegenerate = async (msg) => {
    await clearMessages();
    const userMsgs = messages.filter((m) => m.role === "user");
    if (userMsgs.length > 0) {
      await handleSend(userMsgs[userMsgs.length - 1].content);
    }
  };

  const handleEdit = (msg) => {
    setEditingMsg(msg.id);
    setEditText(msg.content);
  };

  const handleSaveEdit = async () => {
    setEditingMsg(null);
    await handleSend(editText);
  };

  const handleCancelEdit = () => {
    setEditingMsg(null);
    setEditText("");
  };

  const selectAgent = (agent) => {
    setCurrentAgent(agent);
    setShowAgents(false);
  };

  const selectProvider = (provider) => {
    setCurrentProvider(provider.id);
    setShowProviders(false);
  };

  const providerName = (id) => PROVIDER_LABELS[id] || id;
  const isDemo = currentProvider === "branpy-demo";

  const ollamaStatusColor = ollamaOnline === "online" ? "rgba(16,185,129,0.7)" :
                            ollamaOnline === "connecting" ? "rgba(251,191,36,0.7)" :
                            "rgba(239,68,68,0.5)";
  const ollamaStatusBg = ollamaOnline === "online" ? "rgba(16,185,129,0.12)" :
                         ollamaOnline === "connecting" ? "rgba(251,191,36,0.08)" :
                         "rgba(239,68,68,0.08)";
  const ollamaStatusBorder = ollamaOnline === "online" ? "1px solid rgba(16,185,129,0.2)" :
                             ollamaOnline === "connecting" ? "1px solid rgba(251,191,36,0.15)" :
                             "1px solid rgba(239,68,68,0.15)";
  const ollamaStatusText = ollamaOnline === "online" ? "rgba(16,185,129,0.7)" :
                           ollamaOnline === "connecting" ? "rgba(251,191,36,0.6)" :
                           "rgba(239,68,68,0.6)";
  const ollamaLabel = ollamaOnline === "online" ? `Ollama ${currentModel || "qwen2.5-coder:7b"}` :
                      ollamaOnline === "connecting" ? "Ollama conectando..." :
                      "Ollama offline";

  return (
    <AIChatErrorBoundary>
    <div style={{
      flex: 1, display: "flex", flexDirection: "column", minHeight: 0,
      background: "linear-gradient(160deg, #080808 0%, #0a0a0a 50%, #0d0d0d 100%)",
      color: "white",
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      position: "relative",
      ...(fullScreen ? { position: "fixed", inset: 0, zIndex: 100 } : {}),
    }}>
      <div style={{
        position: "absolute", top: "-50%", right: "-20%", width: 400, height: 400,
        borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.04) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Header */}
      <div style={{
        height: 48, flexShrink: 0, display: "flex", alignItems: "center", gap: 8,
        padding: "0 14px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(12,12,12,0.8)", backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        zIndex: 2,
      }}>
        <div style={{
          width: 26, height: 26, borderRadius: 7,
          background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 700, color: "white", flexShrink: 0,
        }}>B</div>
        <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>BRANPY Chat</span>

        {/* Ollama status badge — always visible */}
        {ollamaOnline !== null && (
          <div style={{
            fontSize: 10, padding: "2px 7px", borderRadius: 4,
            background: ollamaStatusBg,
            border: ollamaStatusBorder,
            color: ollamaStatusText,
            fontFamily: "monospace",
            display: "flex", alignItems: "center", gap: 4,
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: "50%", display: "inline-block",
              background: ollamaStatusColor,
              animation: ollamaOnline === "connecting" ? "blink 1s infinite" : "none",
            }} />
            {ollamaLabel}
          </div>
        )}

        {/* Agent selector */}
        <div style={{ position: "relative" }}>
          <button onClick={() => setShowAgents(!showAgents)}
            style={{
              display: "flex", alignItems: "center", gap: 4, padding: "3px 8px",
              borderRadius: 5, border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer",
              fontSize: 11, background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.55)",
              fontFamily: "inherit",
            }}
            className="cs-hover-soft"
          >
            <span>{currentAgent.avatar}</span>
            <span>{currentAgent.name}</span>
            <span style={{ fontSize: 7, color: "rgba(255,255,255,0.3)", marginLeft: 2 }}>▼</span>
          </button>
          {showAgents && (
            <div style={{
              position: "absolute", top: "100%", left: 0, marginTop: 4,
              width: 220, background: "rgba(20,20,20,0.96)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10, padding: 6, zIndex: 50, maxHeight: 340, overflow: "hidden auto",
              boxShadow: "0 16px 48px rgba(0,0,0,0.6)", backdropFilter: "blur(16px)",
            }}>
              {agents.map((agent) => (
                <button key={agent.id} onClick={() => selectAgent(agent)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, width: "100%",
                    padding: "7px 10px", borderRadius: 6, border: "none", cursor: "pointer",
                    background: currentAgent.id === agent.id ? (agent.color ? `${agent.color}15` : "rgba(59,130,246,0.12)") : "transparent",
                    color: currentAgent.id === agent.id ? (agent.color || "rgba(59,130,246,0.7)") : "rgba(255,255,255,0.6)",
                    fontSize: 12, fontFamily: "inherit", textAlign: "left",
                  }}
                  className="cs-hover-item"
                >
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{agent.avatar}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 12 }}>{agent.name}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{agent.description?.slice(0, 50)}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Provider selector */}
        <div style={{ position: "relative" }}>
          <button onClick={() => setShowProviders(!showProviders)}
            style={{
              display: "flex", alignItems: "center", gap: 4, padding: "3px 8px",
              borderRadius: 5, border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer",
              fontSize: 11, background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.55)",
              fontFamily: "inherit",
            }}
            className="cs-hover-soft"
          >
            <span style={{
              width: 5, height: 5, borderRadius: "50%", display: "inline-block",
              background: currentProvider === "ollama" ? ollamaStatusColor :
                          currentProvider === "branpy-demo" ? "rgba(251,191,36,0.7)" :
                          "rgba(59,130,246,0.6)",
            }} />
            <span>{providerName(currentProvider)}</span>
            {currentProvider === "ollama" && ollamaOnline === "online" && (
              <span style={{ fontSize: 9, color: "rgba(16,185,129,0.6)", fontFamily: "monospace" }}>
                {currentModel || "qwen2.5-coder:7b"}
              </span>
            )}
            <span style={{ fontSize: 7, color: "rgba(255,255,255,0.3)", marginLeft: 2 }}>▼</span>
          </button>
          {showProviders && (
            <div style={{
              position: "absolute", top: "100%", left: 0, marginTop: 4,
              width: 200, background: "rgba(20,20,20,0.96)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10, padding: 6, zIndex: 50, maxHeight: 340, overflow: "hidden auto",
              boxShadow: "0 16px 48px rgba(0,0,0,0.6)", backdropFilter: "blur(16px)",
            }}>
              {providers.filter((p) => p.id !== "branpy-demo" || true).map((p) => {
                if (["local", "llama"].includes(p.id)) return null;
                return (
                <button key={p.id} onClick={() => selectProvider(p)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, width: "100%",
                    padding: "7px 10px", borderRadius: 6, border: "none", cursor: "pointer",
                    background: currentProvider === p.id ? "rgba(59,130,246,0.12)" : "transparent",
                    color: currentProvider === p.id ? "rgba(59,130,246,0.7)" : "rgba(255,255,255,0.6)",
                    fontSize: 12, fontFamily: "inherit", textAlign: "left",
                  }}
                  className="cs-hover-item"
                >
                  <div style={{
                    width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
                    background: p.id === "ollama" ? ollamaStatusColor : "rgba(59,130,246,0.4)",
                  }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 12 }}>{providerName(p.id)}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>
                      {p.id === "ollama" ? (ollamaOnline === "online" ? (currentModel || "qwen2.5-coder:7b") : "offline") : p.id}
                    </div>
                  </div>
                </button>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ flex: 1 }} />

        {/* Sessions */}
        <div style={{ position: "relative" }}>
          <button onClick={() => setShowSessions(!showSessions)}
            style={{
              padding: "3px 8px", borderRadius: 5, border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer",
              background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.4)", fontSize: 10, fontFamily: "inherit",
            }}
            className="cs-hover-soft"
            title="Histórico"
          >Histórico ▾</button>
          {showSessions && (
            <div style={{
              position: "absolute", top: "100%", right: 0, marginTop: 4,
              width: 260, background: "rgba(20,20,20,0.96)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10, padding: 6, zIndex: 50, maxHeight: 300, overflow: "hidden auto",
              boxShadow: "0 16px 48px rgba(0,0,0,0.6)", backdropFilter: "blur(16px)",
            }}>
              {sessions.length === 0 && (
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", padding: "12px 8px", textAlign: "center" }}>
                  Nenhuma conversa salva
                </div>
              )}
              {sessions.map((s) => (
                <button key={s.id} onClick={() => { loadSession(s.id); setShowSessions(false); }}
                  style={{
                    display: "block", width: "100%", padding: "7px 10px", borderRadius: 6, border: "none", cursor: "pointer",
                    background: "transparent", color: "rgba(255,255,255,0.55)", fontSize: 11, fontFamily: "inherit", textAlign: "left",
                  }}
                  className="cs-hover-item"
                >
                  <div style={{ fontWeight: 500, fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {s.preview || "Nova conversa"}
                  </div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", marginTop: 1 }}>
                    {s.messageCount} msgs · {new Date(s.updated).toLocaleDateString("pt-BR")}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={newSession}
          style={{
            padding: "3px 8px", borderRadius: 5, border: "none", cursor: "pointer",
            background: "none", color: "rgba(255,255,255,0.3)", fontSize: 12, fontFamily: "inherit",
          }}
          className="cs-hover-soft"
          title="Nova conversa"
        >✕</button>

        {onClose && (
          <button onClick={onClose}
            style={{
              padding: 3, border: "none", cursor: "pointer", background: "none",
              color: "rgba(255,255,255,0.3)", display: "flex", fontSize: 13, fontFamily: "inherit",
            }}
            className="cs-hover-soft"
          >✕</button>
        )}
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflow: "hidden auto", padding: "12px 16px",
      }} className="cs-scrollbar">
        {messages.length === 0 && !currentStream && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", height: "100%", gap: 14, padding: "0 20px",
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.12))",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24,
            }}>🧠</div>
            <div style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>
              Como posso ajudar?
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", textAlign: "center", maxWidth: 340, lineHeight: "1.5" }}>
              Peça ideias, crie roteiros, escreva copy, desenvolva código, pesquise concorrentes e muito mais.
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.15)", marginTop: 4 }}>
              Agente ativo: {currentAgent.avatar} {currentAgent.name}
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          if (msg.role !== "user" && !msg.content) return null;
          const isUser = msg.role === "user";
          const isEditing = editingMsg === msg.id;

          return (
          <div key={msg.id || i} style={{
            display: "flex", gap: 8, marginBottom: 14, position: "relative",
            justifyContent: isUser ? "flex-end" : "flex-start",
            animation: "fadeIn 0.2s ease",
          }}>
            {!isUser && (
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, marginTop: 2,
              }}>B</div>
            )}
            <div style={{
              maxWidth: "78%", minWidth: editingMsg ? 300 : 0,
              padding: isEditing ? 4 : "8px 12px",
              borderRadius: isUser ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
              background: isUser ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${isUser ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.05)"}`,
              fontSize: 13, lineHeight: "1.55",
              color: isUser ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.75)",
              whiteSpace: isUser ? "pre-wrap" : "normal",
              wordBreak: "break-word",
              transition: "background 0.15s",
              position: "relative",
            }}>
              {isEditing ? (
                <div>
                  <textarea value={editText} onChange={(e) => setEditText(e.target.value)}
                    style={{
                      width: "100%", minHeight: 60, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(59,130,246,0.3)",
                      borderRadius: 6, color: "white", fontSize: 13, padding: 6, fontFamily: "inherit",
                      resize: "vertical", outline: "none",
                    }}
                  />
                  <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                    <button onClick={handleSaveEdit} style={{ padding: "3px 10px", borderRadius: 4, border: "none", cursor: "pointer", background: "rgba(59,130,246,0.2)", color: "rgba(59,130,246,0.7)", fontSize: 11, fontFamily: "inherit" }}>Salvar</button>
                    <button onClick={handleCancelEdit} style={{ padding: "3px 10px", borderRadius: 4, border: "none", cursor: "pointer", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", fontSize: 11, fontFamily: "inherit" }}>Cancelar</button>
                  </div>
                </div>
              ) : isUser ? (
                msg.content
              ) : (
                <MarkdownRenderer content={msg.content} />
              )}

              {msg.provider && (
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.15)", marginTop: 4, fontFamily: "monospace" }}>
                  via {providerName(msg.provider)}
                </div>
              )}
            </div>

            {!isEditing && !isUser && msg.content && (
              <div style={{
                display: "flex", gap: 2, alignItems: "flex-start", marginTop: 4, opacity: 0.5,
                transition: "opacity 0.15s",
              }} className="cs-msg-actions">
                <button onClick={() => handleRegenerate(msg)}
                  style={{ padding: 2, border: "none", cursor: "pointer", background: "none", color: "rgba(255,255,255,0.3)", fontSize: 11, fontFamily: "inherit" }}
                  title="Regenerar"
                >↻</button>
              </div>
            )}
          </div>
          );
        })}

        {streaming && currentStream && (
          <div style={{ display: "flex", gap: 8, marginBottom: 14, animation: "fadeIn 0.15s ease" }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
              background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, marginTop: 2,
            }}>B</div>
            <div style={{
              maxWidth: "78%", padding: "8px 12px", borderRadius: "12px 12px 12px 4px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.05)",
              fontSize: 13, lineHeight: "1.55",
              color: "rgba(255,255,255,0.75)",
              wordBreak: "break-word",
            }}>
              <MarkdownRenderer content={currentStream} />
              <span style={{ animation: "blink 1s infinite", marginLeft: 2, color: "rgba(59,130,246,0.5)", fontSize: 14 }}>▍</span>
            </div>
          </div>
        )}

        {loading && !currentStream && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8, padding: "8px 0",
            fontSize: 12, color: "rgba(255,255,255,0.3)", animation: "fadeIn 0.2s ease",
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: 6,
              background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700, color: "white",
            }}>B</div>
            BRANPY está pensando
            <span style={{ animation: "blink 1s infinite", marginLeft: 2 }}>.</span>
            <span style={{ animation: "blink 1s infinite 0.2s", marginLeft: 1 }}>.</span>
            <span style={{ animation: "blink 1s infinite 0.4s", marginLeft: 1 }}>.</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Execution status */}
      {executionStatus && executionStatus.type !== "done" && (
        <div style={{
          display: "flex", alignItems: "center", gap: 6, padding: "4px 14px",
          borderTop: "1px solid rgba(255,255,255,0.03)",
          background: "rgba(59,130,246,0.03)", fontSize: 11, color: "rgba(255,255,255,0.4)",
          fontFamily: "monospace", flexShrink: 0,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: executionStatus.type === "tool-error" ? "rgba(239,68,68,0.6)" :
                        executionStatus.type === "tool-done" ? "rgba(16,185,129,0.6)" :
                        "rgba(59,130,246,0.6)",
            animation: executionStatus.type === "tool" || executionStatus.type === "intent" ? "blink 1s infinite" : "none",
          }} />
          <span>
            {executionStatus.icon || ""} {executionStatus.message}
          </span>
          {executionStatus.type === "intent" && executionStatus.intent && (
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginLeft: 4 }}>
              ({executionStatus.intent})
            </span>
          )}
        </div>
      )}

      {/* Quick actions */}
      {messages.length <= 1 && !isStreaming && (
        <div style={{
          display: "flex", gap: 4, padding: "0 16px 4px",
          overflow: "hidden auto", flexShrink: 0,
        }}>
          {QUICK_ACTIONS.map((qa, i) => (
            <button key={i} onClick={() => handleQuickAction(qa.prompt)}
              style={{
                flexShrink: 0, padding: "4px 10px", borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer",
                background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.4)",
                fontSize: 11, fontFamily: "inherit", whiteSpace: "nowrap",
                transition: "all 0.12s",
              }}
              className="cs-hover-soft"
            >{qa.label}</button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div style={{
        padding: "8px 14px 10px", borderTop: "1px solid rgba(255,255,255,0.04)",
        flexShrink: 0, background: "rgba(10,10,10,0.6)", zIndex: 2,
      }}>
        <div style={{
          display: "flex", gap: 6, alignItems: "flex-end",
          background: "rgba(255,255,255,0.04)", borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.06)", padding: "4px 4px 4px 12px",
          transition: "border-color 0.15s",
        }} className="cs-input-border">
          <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown} rows={1}
            placeholder="Digite sua mensagem... (Enter para enviar)"
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              color: "rgba(255,255,255,0.8)", fontSize: 13, fontFamily: "inherit",
              padding: "7px 0", resize: "none", lineHeight: "1.4", minHeight: 20, maxHeight: 120,
            }}
          />
          <button onClick={() => handleSend()} disabled={!input.trim() || isStreaming}
            style={{
              padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer",
              background: input.trim() ? "linear-gradient(135deg, #3b82f6, #2563eb)" : "rgba(255,255,255,0.06)",
              color: input.trim() ? "white" : "rgba(255,255,255,0.25)",
              fontSize: 13, fontWeight: 600, fontFamily: "inherit",
              transition: "all 0.12s", flexShrink: 0,
            }}
          >
            {isStreaming ? (
              <span style={{ animation: "blink 1s infinite" }}>■</span>
            ) : "→"}
          </button>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, padding: "0 4px" }}>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.12)" }}>
            {currentAgent.avatar} {currentAgent.name}
          </div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.12)", fontFamily: "monospace" }}>
            {currentProvider === "ollama" ? ollamaLabel : providerName(currentProvider)}
          </div>
        </div>
      </div>

      <style>{`
        .cs-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .cs-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .cs-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 2px; }
        .cs-hover-soft:hover { background: rgba(255,255,255,0.08) !important; }
        .cs-hover-item:hover { background: rgba(255,255,255,0.06) !important; }
        .cs-input-border:focus-within { border-color: rgba(59,130,246,0.2) !important; }
        .cs-msg-actions { opacity: 0 !important; }
        div:hover > .cs-msg-actions { opacity: 0.5 !important; }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
    </AIChatErrorBoundary>
  );
}
