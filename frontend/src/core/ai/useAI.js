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
      // Auto-detect Ollama on mount (retry 3x with delay)
      (async () => {
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const ollama = getProvider("ollama");
            if (ollama && await ollama.healthCheck()) {
              const models = await ollama.listModels();
              if (mountedRef.current) {
                const available = (models.length > 0 ? models[0] : ollama.defaultModel) || "qwen2.5-coder:7b";
                setCurrentProvider("ollama");
                setCurrentModel(available);
              }
              return;
            }
          } catch { /* retry */ }
          if (attempt < 2) await new Promise((r) => setTimeout(r, 1000));
        }
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

  // ⚠️ ollamaStream/ollamaSend MUST be declared BEFORE sendMessage/sendStreamMessage (const TDZ)
  const ollamaStream = useCallback(async (msg, model, controller) => {
    const ollama = getProvider("ollama");
    if (!ollama) throw new Error("Ollama provider não encontrado");
    const available = ollama.isAvailable();
    if (!available) {
      const ok = await ollama.healthCheck();
      if (!ok) throw new Error("Ollama Local offline. Verifique se o Ollama está rodando em http://localhost:11434");
    }
    const modelName = model || ollama.defaultModel || "qwen2.5-coder:7b";
    const stream = ollama.streamMessage([
      { role: "system", content: "Você é a BRANPY AI, uma assistente local inteligente. Responda de forma direta, útil e completa em português brasileiro. NUNCA use frases genéricas como 'entendi sua pergunta', 'posso ajudar', 'vou analisar'." },
      { role: "user", content: msg },
    ], { model: modelName, signal: controller?.signal });
    return { stream, model: modelName, provider: "ollama" };
  }, []);

  const ollamaSend = useCallback(async (msg, model, controller) => {
    const ollama = getProvider("ollama");
    if (!ollama) throw new Error("Ollama provider não encontrado");
    const available = ollama.isAvailable();
    if (!available) {
      const ok = await ollama.healthCheck();
      if (!ok) throw new Error("Ollama Local offline. Verifique se o Ollama está rodando em http://localhost:11434");
    }
    const modelName = model || ollama.defaultModel || "qwen2.5-coder:7b";
    return await ollama.sendMessage([
      { role: "system", content: "Você é a BRANPY AI, uma assistente local inteligente. Responda de forma direta, útil e completa em português brasileiro." },
      { role: "user", content: msg },
    ], { model: modelName, signal: controller?.signal });
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
      // Direct Ollama path
      if (provider === "ollama") {
        try {
          const text = await ollamaSend(msg, model, null);
          if (mountedRef.current) {
            setLoading(false);
            if (text) addAssistantMessage(text, "ollama", model || "qwen2.5-coder:7b", agent);
          }
          return { content: text || "", provider: "ollama", model: model || "qwen2.5-coder:7b" };
        } catch (err) {
          if (!mountedRef.current) return { content: "" };
          setLoading(false);
          const errorMsg = err ? err.message : "Ollama offline";
          addAssistantMessage("**Ollama Local offline**\n\n" + errorMsg, "ollama", model || "qwen2.5-coder:7b", agent);
          return { content: "", error: errorMsg };
        }
      }

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
  }, [router, currentAgent, currentModel, currentProvider, addAssistantMessage, ollamaSend]);

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
    let resultModel = "";

    try {
      // DIRECT OLLAMA PATH — when Ollama is selected, call it directly, never use templates
      if (provider === "ollama") {
        try {
          const { stream, model: m, provider: p } = await ollamaStream(msg, model, controller);
          activeStreamRef.current = stream;
          resultProvider = p;
          resultModel = m;
          for await (const chunk of stream) {
            if (!mountedRef.current || controller.signal.aborted) break;
            fullContent += (chunk || "");
            if (!controller.signal.aborted) setCurrentStream(fullContent);
          }
          activeStreamRef.current = null;
          abortRef.current = null;
          if (!mountedRef.current) return { content: "" };
          if (fullContent) {
            setStreaming(false);
            setCurrentStream("");
            setLoading(false);
            addAssistantMessage(fullContent, resultProvider, resultModel, agent);
            return { content: fullContent, provider: resultProvider };
          }
          // Stream empty — try non-streaming
          fullContent = await ollamaSend(msg, model, controller) || "";
          resultProvider = "ollama";
          resultModel = model || "qwen2.5-coder:7b";
          setStreaming(false);
          setCurrentStream("");
          setLoading(false);
          if (fullContent) addAssistantMessage(fullContent, resultProvider, resultModel, agent);
          return { content: fullContent, provider: resultProvider };
        } catch (err) {
          activeStreamRef.current = null;
          abortRef.current = null;
          if (!mountedRef.current) return { content: "" };
          const errorMsg = err ? err.message : "Erro ao conectar com Ollama Local";
          setStreaming(false);
          setCurrentStream("");
          setLoading(false);
          const isCors = errorMsg.includes("CORS") || errorMsg.includes("fetch") || errorMsg.includes("Failed to fetch") || errorMsg.includes("NetworkError");
          const cleanError = isCors ?
            "Ollama Local não está acessível pelo navegador (erro de CORS ou conexão).\n\n" +
            "Soluções:\n" +
            "1. Instale extensão 'CORS Unblock' no Chrome\n" +
            "2. Ou execute: set OLLAMA_ORIGINS=* && ollama serve\n" +
            "3. Ou use http://localhost:11434 diretamente" :
            errorMsg;
          addAssistantMessage("**Ollama Local offline**\n\n" + cleanError, "ollama", model || "qwen2.5-coder:7b", agent);
          return { content: "", error: cleanError };
        }
      }

      // NORMAL PATH — for other providers (OpenRouter, OpenAI, etc.)
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
          if (!controller.signal.aborted) setCurrentStream(fullContent);
        }

        activeStreamRef.current = null;
        abortRef.current = null;

        if (mountedRef.current) {
          setStreaming(false);
          setCurrentStream("");
          setLoading(false);
          if (fullContent) addAssistantMessage(fullContent, resultProvider, model, agent);
        }
        return { content: fullContent || "", provider: resultProvider };
      } catch (err) {
        activeStreamRef.current = null;
        abortRef.current = null;
        if (!mountedRef.current) return { content: "" };
        setStreaming(false);
        setCurrentStream("");
        setLoading(false);
        addAssistantMessage("Erro ao processar resposta. Tente novamente ou selecione outro provider.", provider || "unknown", model, agent);
        return { content: "", error: err ? err.message : "Stream failed" };
      }
    } finally {
      activeStreamRef.current = null;
      abortRef.current = null;
    }
  }, [router, currentAgent, currentModel, currentProvider, addAssistantMessage, ollamaStream, ollamaSend]);

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
