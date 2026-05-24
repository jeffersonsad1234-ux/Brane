import { useState, useCallback, useRef, useEffect } from "react";
import { aiRouter as defaultRouter } from "./router/AIRouter";
import { aiMemory } from "./memory/AIMemory";
import { getAgent, DEFAULT_AGENT } from "./agents/AgentRegistry";
import { getAvailableProviders, getProvider } from "./providers/ProviderFactory";

const POLL_INTERVAL = 3000;
const DEFAULT_MODEL = "qwen2.5-coder:7b";

function isCorsError(err) {
  if (!err) return false;
  const m = err.message || "";
  return m.includes("CORS") || m.includes("Failed to fetch") || m.includes("NetworkError") || m.includes("TypeError");
}

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
  const [ollamaOnline, setOllamaOnline] = useState(null);
  const abortRef = useRef(null);
  const activeStreamRef = useRef(null);
  const mountedRef = useRef(true);
  const pollRef = useRef(null);
  const currentProviderRef = useRef(currentProvider);
  currentProviderRef.current = currentProvider;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
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
    const checkOllama = async () => {
      if (!mountedRef.current) return;
      try {
        const ollama = getProvider("ollama");
        if (!ollama) { setOllamaOnline("offline"); return; }
        const ok = await ollama.healthCheck();
        if (!mountedRef.current) return;
        if (ok) {
          console.log("[Ollama] Conectado com sucesso");
          setOllamaOnline("online");
          const models = await ollama.listModels();
          if (!mountedRef.current) return;
          const firstModel = models.length > 0 ? models[0] : DEFAULT_MODEL;
          if (currentProviderRef.current !== "ollama") {
            setCurrentProvider("ollama");
          }
          if (firstModel) setCurrentModel(firstModel);
        } else {
          setOllamaOnline("offline");
        }
      } catch {
        if (mountedRef.current) setOllamaOnline("offline");
      }
    };

    setOllamaOnline("connecting");
    checkOllama();
    pollRef.current = setInterval(checkOllama, POLL_INTERVAL);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

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

  const ollamaStream = useCallback(async (msg, model, controller) => {
    const ollama = getProvider("ollama");
    if (!ollama) throw new Error("Ollama provider não encontrado");
    const modelName = model || ollama.defaultModel || "qwen2.5-coder:7b";
    const stream = await ollama.streamMessage([
      { role: "system", content: "Você é uma assistente local inteligente rodando via Ollama. Responda de forma direta, útil e completa em português brasileiro." },
      { role: "user", content: msg },
    ], { model: modelName, signal: controller?.signal });
    return { stream, model: modelName, provider: "ollama" };
  }, []);

  const ollamaSend = useCallback(async (msg, model, controller) => {
    const ollama = getProvider("ollama");
    if (!ollama) throw new Error("Ollama provider não encontrado");
    const modelName = model || ollama.defaultModel || "qwen2.5-coder:7b";
    return await ollama.sendMessage([
      { role: "system", content: "Você é uma assistente local inteligente rodando via Ollama. Responda de forma direta, útil e completa em português brasileiro." },
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
      if (provider === "ollama") {
        const text = await ollamaSend(msg, model, null);
        if (mountedRef.current) {
          setLoading(false);
          if (text) addAssistantMessage(text, "ollama", model || "qwen2.5-coder:7b", agent);
        }
        return { content: text || "", provider: "ollama", model: model || "qwen2.5-coder:7b" };
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
      if (!mountedRef.current) return { content: "" };
      setLoading(false);
      if (provider === "ollama") {
        const errorMsg = err ? err.message : "Ollama offline";
        const cors = isCorsError(err);
        addAssistantMessage(
          "**Ollama Local offline**\n\n" + (cors
            ? "Não foi possível conectar ao Ollama pelo navegador (CORS).\nSoluções:\n1. Execute: set OLLAMA_ORIGINS=* && ollama serve\n2. Ou instale extensão 'CORS Unblock' no Chrome\n3. Ou acesse via http://localhost:11434"
            : errorMsg),
          "ollama", model || "qwen2.5-coder:7b", agent
        );
        return { content: "", error: errorMsg };
      }
      setError(err ? err.message : "Chat failed");
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
      if (provider === "ollama") {
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
        fullContent = await ollamaSend(msg, model, controller) || "";
        resultProvider = "ollama";
        resultModel = model || "qwen2.5-coder:7b";
        setStreaming(false);
        setCurrentStream("");
        setLoading(false);
        if (fullContent) addAssistantMessage(fullContent, resultProvider, resultModel, agent);
        return { content: fullContent, provider: resultProvider };
      }

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

      if (provider === "ollama") {
        const errorMsg = err ? err.message : "Erro ao conectar com Ollama Local";
        const cors = isCorsError(err);
        addAssistantMessage(
          "**Ollama Local offline**\n\n" + (cors
            ? "Não foi possível conectar ao Ollama pelo navegador (CORS).\nSoluções:\n1. Execute: set OLLAMA_ORIGINS=* && ollama serve\n2. Ou instale extensão 'CORS Unblock' no Chrome\n3. Ou acesse via http://localhost:11434"
            : errorMsg),
          "ollama", model || "qwen2.5-coder:7b", agent
        );
        return { content: "", error: errorMsg };
      }

      addAssistantMessage("Erro ao processar resposta. Tente novamente ou selecione outro provider.", provider || "unknown", model, agent);
      return { content: "", error: err ? err.message : "Stream failed" };
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
    ollamaOnline,

    sendMessage, sendStreamMessage, clearMessages, loadSession, newSession,
    setCurrentAgent, setCurrentModel, setCurrentProvider, stopGeneration,
    addAssistantMessage,

    router, memory: aiMemory,
    getProviderStatus: providerStatus,
    getAgent,
  };
}
