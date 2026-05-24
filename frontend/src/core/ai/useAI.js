import { useState, useCallback, useRef, useEffect } from "react";
import { aiRouter as defaultRouter } from "./router/AIRouter";
import { aiMemory } from "./memory/AIMemory";
import { getAgent, DEFAULT_AGENT } from "./agents/AgentRegistry";
import { getAvailableProviders, getProvider } from "./providers/ProviderFactory";

export function useAI(routerInstance = null) {
  const router = routerInstance || defaultRouter;
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [currentStream, setCurrentStream] = useState("");
  const [error, setError] = useState(null);
  const [currentAgent, setCurrentAgent] = useState(DEFAULT_AGENT);
  const [currentModel, setCurrentModel] = useState("");
  const [currentProvider, setCurrentProvider] = useState("opencode");
  const [sessions, setSessions] = useState([]);
  const [providerStatus, setProviderStatus] = useState([]);
  const [executionStatus, setExecutionStatus] = useState(null);
  const abortRef = useRef(null);
  const activeStreamRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    try {
      router.setToolStatusHandler((status) => {
        if (!mountedRef.current) return;
        setExecutionStatus(status);
        if (status && (status.type === "done" || status.type === "tool-error")) {
          setTimeout(() => { if (mountedRef.current) setExecutionStatus(null); }, 2000);
        }
      });
    } catch { /* handler setup fail */ }
  }, [router]);

  useEffect(() => {
    try {
      router.getSessions().then((list) => { if (mountedRef.current) setSessions(list || []); }).catch(() => {});
      const status = router.getProviderStatus();
      if (mountedRef.current) setProviderStatus(status || []);
      // Auto-detect Ollama on mount
      (async () => {
        try {
          const ollama = getProvider("ollama");
          if (ollama && await ollama.healthCheck()) {
            const models = await ollama.listModels();
            if (mountedRef.current) {
              const available = models.length > 0 ? models[0] : ollama.defaultModel;
              setCurrentProvider("ollama");
              setCurrentModel(available);
            }
          }
        } catch { /* Ollama not available, keep default */ }
      })();
    } catch { /* init fail */ }
  }, [router]);

  const stopGeneration = useCallback(() => {
    if (abortRef.current) {
      try { abortRef.current.abort(); } catch {}
      abortRef.current = null;
    }
    if (activeStreamRef.current) {
      try { activeStreamRef.current.return ? activeStreamRef.current.return() : null; } catch {}
      activeStreamRef.current = null;
    }
    setStreaming(false);
    setLoading(false);
  }, []);

  const addAssistantMessage = useCallback((content, provider, model, agent) => {
    if (!mountedRef.current) return;
    const msg = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      role: "assistant",
      content: content || "",
      provider: provider || "",
      model: model || (agent ? agent.defaultModel : "") || "",
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, msg]);
  }, []);

  const sendMessage = useCallback(async (content, options = {}) => {
    if (!mountedRef.current) return { content: "" };
    setLoading(true);
    setError(null);
    setStreaming(false);

    const msg = (content || "").trim();
    if (!msg) { setLoading(false); return { content: "" }; }

    const userMsg = { id: `msg_${Date.now()}`, role: "user", content: msg, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);

    const agent = options.agent || currentAgent;
    const model = options.model || currentModel;
    const provider = options.provider || currentProvider;

    try {
      const result = await router.chat(msg, { agent, model: model || undefined, provider, ...options });
      if (mountedRef.current) {
        setLoading(false);
        if (result && result.content) {
          addAssistantMessage(result.content, result.provider, result.model, agent);
        }
      }
      return result || { content: "" };
    } catch (err) {
      if (mountedRef.current) {
        setError(err ? err.message : "Chat failed");
        setLoading(false);
      }
      return { content: "", error: err ? err.message : "Chat failed" };
    }
  }, [router, currentAgent, currentModel, currentProvider, addAssistantMessage]);

  const sendStreamMessage = useCallback(async (content, options = {}) => {
    if (!mountedRef.current) return { content: "" };
    const msg = (content || "").trim();
    if (!msg) { setLoading(false); return { content: "" }; }

    setLoading(true);
    setError(null);
    setStreaming(true);
    setCurrentStream("");

    const controller = new AbortController();
    abortRef.current = controller;

    const userMsg = { id: `msg_${Date.now()}`, role: "user", content: msg, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);

    const agent = options.agent || currentAgent;
    const model = options.model || currentModel;
    const provider = options.provider || currentProvider;

    let fullContent = "";
    let resultProvider = "";

    try {
      const stream = router.chatStream(msg, { agent, model: model || undefined, provider, signal: controller.signal, ...options });
      activeStreamRef.current = stream;

      for await (const chunk of stream) {
        if (!mountedRef.current || controller.signal.aborted) break;
        if (!chunk) continue;
        if (chunk.done) {
          if (chunk.error) break;
          break;
        }
        fullContent += (chunk.content || "");
        resultProvider = chunk.provider || resultProvider;
        if (!controller.signal.aborted) {
          setCurrentStream(fullContent);
        }
      }

      activeStreamRef.current = null;
      abortRef.current = null;

      if (mountedRef.current) {
        setStreaming(false);
        setCurrentStream("");
        setLoading(false);
        if (fullContent) {
          addAssistantMessage(fullContent, resultProvider, model, agent);
        }
      }
      return { content: fullContent || "", provider: resultProvider };
    } catch (err) {
      activeStreamRef.current = null;
      abortRef.current = null;
      if (!mountedRef.current) return { content: "" };
      setStreaming(false);
      setCurrentStream("");
      setLoading(false);
      // Fallback to non-streaming
      try {
        const result = await router.chat(msg, { agent, model: model || undefined, provider, ...options });
        if (mountedRef.current && result && result.content) {
          addAssistantMessage(result.content, result.provider, result.model, agent);
          return { content: result.content, provider: result.provider };
        }
      } catch {}
      return { content: "", error: err ? err.message : "Stream failed" };
    }
  }, [router, currentAgent, currentModel, currentProvider, addAssistantMessage]);

  const clearMessages = useCallback(async () => {
    setMessages([]);
    setCurrentStream("");
    setError(null);
    try { await router.clearHistory(); } catch {}
  }, [router]);

  const loadSession = useCallback(async (sessionId) => {
    if (!sessionId) return;
    try {
      router.setSession(sessionId);
      const history = await router.getHistory(sessionId);
      if (mountedRef.current) {
        setMessages((history || []).map((m) => ({
          id: m.id || `msg_${m.timestamp || Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          role: m.role,
          content: m.content || "",
          provider: m.provider,
          model: m.model,
          timestamp: m.timestamp,
        })));
      }
    } catch { if (mountedRef.current) setMessages([]); }
  }, [router]);

  const newSession = useCallback(() => {
    setMessages([]);
    setCurrentStream("");
    setError(null);
    router.setSession(`session_${Date.now()}`);
  }, [router]);

  return {
    messages, loading, streaming, currentStream, error, executionStatus,
    currentAgent, currentModel, currentProvider, sessions, providerStatus,

    sendMessage, sendStreamMessage, clearMessages, loadSession, newSession,
    setCurrentAgent, setCurrentModel, setCurrentProvider, stopGeneration,
    addAssistantMessage,

    router, memory: aiMemory,
    getProviderStatus: providerStatus,
    getAgent,
  };
}
