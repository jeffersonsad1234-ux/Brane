import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAI } from "../useAI";
import { listAgents, getAgentConfigs } from "../agents/AgentRegistry";
import { getAvailableProviders } from "../providers/ProviderFactory";
import { listTools } from "../tools/index";

const QUICK_ACTIONS = [
  { label: "Criar roteiro", prompt: "Crie um roteiro curto para um vídeo de produto no TikTok" },
  { label: "Melhorar copy", prompt: "Melhore esta descrição de produto: " },
  { label: "Ideias de conteúdo", prompt: "Me dê 5 ideias de conteúdo para afiliados" },
  { label: "Análise de concorrente", prompt: "Analise um concorrente e sugira melhorias" },
];

export default function AIChatPanel({ onClose, initialAgent = null, fullScreen = false }) {
  const {
    messages, loading, streaming, currentStream, error,
    sendMessage, sendStreamMessage, clearMessages, newSession, loadSession,
    sessions, currentAgent, setCurrentAgent, currentProvider, setCurrentProvider,
    currentModel, setCurrentModel,
  } = useAI();

  const [input, setInput] = useState("");
  const [showAgents, setShowAgents] = useState(false);
  const [showModels, setShowModels] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [showProviders, setShowProviders] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const agents = getAgentConfigs();
  const providers = getAvailableProviders();

  useEffect(() => {
    if (initialAgent) {
      const agent = typeof initialAgent === "string" ? getAgentConfigs().find(a => a.id === initialAgent) : initialAgent;
      if (agent) setCurrentAgent(agent);
    }
  }, [initialAgent]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentStream]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    await sendStreamMessage(text, { agent: currentAgent, provider: currentProvider, model: currentModel });
    inputRef.current?.focus();
  }, [input, loading, sendStreamMessage, currentAgent, currentProvider, currentModel]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (prompt) => {
    setInput(prompt);
  };

  const selectAgent = (agent) => {
    setCurrentAgent(agent);
    setShowAgents(false);
  };

  const selectProvider = (provider) => {
    setCurrentProvider(provider.id);
    setShowProviders(false);
  };

  const selectModel = (model) => {
    setCurrentModel(model);
    setShowModels(false);
  };

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column", minHeight: 0,
      background: "#0a0a0a", color: "white",
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      ...(fullScreen ? { position: "fixed", inset: 0, zIndex: 100 } : {}),
    }}>
      {/* Header */}
      <div style={{
        height: 44, flexShrink: 0, display: "flex", alignItems: "center", gap: 6,
        padding: "0 12px", borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "#0c0c0c",
      }}>
        <div style={{
          width: 24, height: 24, borderRadius: 6,
          background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 700, color: "white",
        }}>B</div>
        <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>BRANPY Chat</span>

        {/* Agent selector */}
        <div style={{ position: "relative" }}>
          <button onClick={() => setShowAgents(!showAgents)}
            style={{
              display: "flex", alignItems: "center", gap: 4, padding: "3px 8px",
              borderRadius: 4, border: "none", cursor: "pointer", fontSize: 12,
              background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)",
              fontFamily: "inherit",
            }}
            className="cs-hover-soft"
          >
            <span>{currentAgent.avatar}</span>
            <span>{currentAgent.name}</span>
            <span style={{ fontSize: 8, color: "rgba(255,255,255,0.3)" }}>▼</span>
          </button>
          {showAgents && (
            <div style={{
              position: "absolute", top: "100%", left: 0, marginTop: 4,
              width: 200, background: "#151515", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8, padding: 4, zIndex: 50, maxHeight: 300, overflow: "hidden auto",
              boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
            }}>
              {agents.map((agent) => (
                <button key={agent.id} onClick={() => selectAgent(agent)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, width: "100%",
                    padding: "6px 8px", borderRadius: 4, border: "none", cursor: "pointer",
                    background: currentAgent.id === agent.id ? "rgba(59,130,246,0.12)" : "transparent",
                    color: currentAgent.id === agent.id ? "rgba(59,130,246,0.7)" : "rgba(255,255,255,0.65)",
                    fontSize: 12, fontFamily: "inherit", textAlign: "left",
                  }}
                  className="cs-hover-item"
                >
                  <span style={{ fontSize: 16 }}>{agent.avatar}</span>
                  <div>
                    <div style={{ fontWeight: 500 }}>{agent.name}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{agent.description?.slice(0, 50)}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ flex: 1 }} />

        {/* Provider/Model info */}
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>
          {currentModel || (currentAgent.defaultModel || "")}
        </div>

        {/* New session */}
        <button onClick={newSession}
          style={{
            padding: "3px 8px", borderRadius: 4, border: "none", cursor: "pointer",
            background: "none", color: "rgba(255,255,255,0.35)", fontSize: 12,
            fontFamily: "inherit",
          }}
          className="cs-hover-soft"
          title="Nova conversa"
        >✕</button>

        {onClose && (
          <button onClick={onClose}
            style={{
              padding: 3, border: "none", cursor: "pointer", background: "none",
              color: "rgba(255,255,255,0.3)", display: "flex", fontSize: 13,
              fontFamily: "inherit",
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
            justifyContent: "center", height: "100%", gap: 12,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22,
            }}>🧠</div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>
              Como posso ajudar?
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center", maxWidth: 300 }}>
              Converse com os agentes BRANPY, peça ajuda com conteúdo, marketing, vídeos, design e muito mais.
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={msg.id || i} style={{
            display: "flex", gap: 8, marginBottom: 12,
            justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
          }}>
            {msg.role !== "user" && (
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13,
              }}>B</div>
            )}
            <div style={{
              maxWidth: "75%", padding: "8px 12px", borderRadius: 10,
              background: msg.role === "user" ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.04)",
              border: msg.role === "user" ? "1px solid rgba(59,130,246,0.15)" : "1px solid rgba(255,255,255,0.06)",
              fontSize: 13, lineHeight: "1.5",
              color: msg.role === "user" ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.75)",
              whiteSpace: "pre-wrap",
            }}>
              {msg.content}
              {msg.provider && (
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 4 }}>
                  via {msg.provider}
                </div>
              )}
            </div>
          </div>
        ))}

        {streaming && currentStream && (
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
              background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13,
            }}>B</div>
            <div style={{
              maxWidth: "75%", padding: "8px 12px", borderRadius: 10,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
              fontSize: 13, lineHeight: "1.5", color: "rgba(255,255,255,0.75)", whiteSpace: "pre-wrap",
            }}>
              {currentStream}
              <span style={{ display: "inline-block", width: 6, height: 14, background: "rgba(59,130,246,0.6)", marginLeft: 2, animation: "blink 1s infinite" }} />
            </div>
          </div>
        )}

        {error && (
          <div style={{
            padding: "8px 12px", borderRadius: 8, marginBottom: 12,
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)",
            fontSize: 12, color: "rgba(239,68,68,0.7)",
          }}>
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick actions */}
      {messages.length <= 1 && !streaming && (
        <div style={{
          display: "flex", gap: 4, padding: "0 16px 4px",
          overflow: "hidden auto", flexShrink: 0,
        }}>
          {QUICK_ACTIONS.map((qa, i) => (
            <button key={i} onClick={() => handleQuickAction(qa.prompt)}
              style={{
                flexShrink: 0, padding: "4px 10px", borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer",
                background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.5)",
                fontSize: 11, fontFamily: "inherit", whiteSpace: "nowrap",
              }}
              className="cs-hover-soft"
            >{qa.label}</button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{
        padding: "8px 12px", borderTop: "1px solid rgba(255,255,255,0.06)",
        flexShrink: 0,
      }}>
        <div style={{
          display: "flex", gap: 6, alignItems: "flex-end",
          background: "rgba(255,255,255,0.04)", borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.08)", padding: "4px",
        }}>
          <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown} rows={1}
            placeholder="Digite sua mensagem..."
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              color: "rgba(255,255,255,0.8)", fontSize: 13, fontFamily: "inherit",
              padding: "6px 8px", resize: "none", lineHeight: "1.4", minHeight: 24,
            }}
          />
          <button onClick={handleSend} disabled={!input.trim() || loading}
            style={{
              padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer",
              background: input.trim() ? "rgba(59,130,246,0.7)" : "rgba(255,255,255,0.06)",
              color: input.trim() ? "white" : "rgba(255,255,255,0.3)",
              fontSize: 12, fontWeight: 600, fontFamily: "inherit",
              transition: "background 0.12s",
            }}
          >{loading ? "..." : "→"}</button>
        </div>
      </div>

      <style>{`
        .cs-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .cs-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .cs-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 2px; }
        .cs-hover-soft:hover { background: rgba(255,255,255,0.06) !important; }
        .cs-hover-item:hover { background: rgba(255,255,255,0.04) !important; }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}
