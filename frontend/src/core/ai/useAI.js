import { useState, useCallback, useRef, useEffect } from "react";
import { aiRouter as defaultRouter } from "./router/AIRouter";
import { aiMemory } from "./memory/AIMemory";
import { getAgent, DEFAULT_AGENT } from "./agents/AgentRegistry";
import { getProvider } from "./providers/ProviderFactory";
import { intentEngine } from "./utils/IntentEngine";
import { browserEngine } from "./browser/BrowserEngine";

export function useAI(routerInstance = null) {
  const router = routerInstance || defaultRouter;
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [currentStream, setCurrentStream] = useState("");
  const [error, setError] = useState(null);
  const [currentAgent, setCurrentAgent] = useState(DEFAULT_AGENT);
  const [currentModel, setCurrentModel] = useState("");
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
          setTimeout(() => { if (mountedRef.current) setExecutionStatus(null); }, 5000);
        }
      });
    } catch { }
  }, [router]);

  const stopGeneration = useCallback(() => {
    if (abortRef.current) { try { abortRef.current.abort(); } catch {} abortRef.current = null; }
    if (activeStreamRef.current) { try { activeStreamRef.current.return ? activeStreamRef.current.return() : null; } catch {} activeStreamRef.current = null; }
    setStreaming(false); setLoading(false);
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

  const detectAndRunSearch = useCallback(async (message) => {
    if (!message) return null;
    try {
      const intent = intentEngine ? intentEngine.classify(message) : null;
      const needsSearch = intent && ["news", "search", "browser"].includes(intent.id);
      if (!needsSearch) return null;

      setExecutionStatus({ type: "search", message: "Pesquisando na internet..." });

      const result = await browserEngine.search(message);
      if (!result || !result.results || result.results.length === 0) {
        setExecutionStatus({ type: "search-done", message: "Não encontrei resultados atuais." });
        setTimeout(() => { if (mountedRef.current) setExecutionStatus(null); }, 5000);
        return null;
      }

      setExecutionStatus({ type: "search-done", message: "Lendo fontes..." });

      const items = result.results.slice(0, 5);
      let context = "Pesquisei na web e encontrei os seguintes resultados:\n\n";
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        context += `[${i + 1}] ${item.title || "Sem título"}\n`;
        if (item.snippet) context += `   ${item.snippet}\n`;
        if (item.url) context += `   Fonte: ${item.url}\n\n`;
      }
      context += "---\n\n";
      context += `Pergunta original: ${message}\n\n`;
      context += "Com base nos resultados acima, responda de forma natural e completa em português brasileiro. Inclua os links das fontes quando relevante. Se os resultados não forem suficientes, avise educadamente.";
      return context;
    } catch (err) {
      console.error("[SEARCH ERROR]", err);
      return null;
    }
  }, []);

  const sendStreamMessage = useCallback(async (content, options = {}) => {
    if (!mountedRef.current) return { content: "" };
    const msg = (content || "").trim();
    if (!msg) { setLoading(false); return { content: "" }; }
    setLoading(true); setError(null); setStreaming(true); setCurrentStream("");
    const controller = new AbortController();
    abortRef.current = controller;
    const userMsg = { id: `msg_${Date.now()}`, role: "user", content: msg, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    const agent = options.agent || currentAgent;
    const model = options.model || currentModel;
    let fullContent = ""; let resultProvider = "";

    try {
      const searchContext = await detectAndRunSearch(msg);
      const finalMsg = searchContext || msg;

      const stream = router.chatStream(finalMsg, { agent, model: model || undefined, signal: controller.signal, ...options });
      activeStreamRef.current = stream;
      for await (const chunk of stream) {
        if (!mountedRef.current || controller.signal.aborted) break;
        if (!chunk) continue;
        if (chunk.done) { if (chunk.error) break; break; }
        fullContent += (chunk.content || "");
        resultProvider = chunk.provider || resultProvider;
        if (!controller.signal.aborted) setCurrentStream(fullContent);
      }
      activeStreamRef.current = null; abortRef.current = null;
      if (mountedRef.current) { setStreaming(false); setCurrentStream(""); setLoading(false); setExecutionStatus(null); if (fullContent) addAssistantMessage(fullContent, resultProvider, model, agent); }
      return { content: fullContent || "", provider: resultProvider };
    } catch (err) {
      activeStreamRef.current = null; abortRef.current = null;
      if (!mountedRef.current) return { content: "" };
      setStreaming(false); setCurrentStream(""); setLoading(false); setExecutionStatus(null);
      addAssistantMessage("**Erro no chat**\n\n" + (err ? err.message : "Erro desconhecido"), "unknown", model, agent);
      return { content: "", error: err ? err.message : "Stream failed" };
    } finally { activeStreamRef.current = null; abortRef.current = null; }
  }, [router, currentAgent, currentModel, addAssistantMessage, detectAndRunSearch]);

  const clearMessages = useCallback(async () => { setMessages([]); setCurrentStream(""); setError(null); try { await router.clearHistory(); } catch {} }, [router]);

  const loadSession = useCallback(async (sessionId) => {
    if (!sessionId) return;
    try {
      const history = await router.loadSession(sessionId);
      if (history && history.length > 0 && mountedRef.current) {
        if (history[0] && history[0].agent) setCurrentAgent(history[0].agent);
        setMessages(history);
      }
    } catch { }
  }, [router]);

  const newSession = useCallback(() => {
    setMessages([]); setCurrentStream(""); setError(null);
    router.setSession(`session_${Date.now()}`);
  }, [router]);

  return {
    messages, loading, streaming, currentStream, error, executionStatus,
    currentAgent, currentModel,
    sendStreamMessage, clearMessages, loadSession, newSession,
    setCurrentAgent, setCurrentModel, stopGeneration, addAssistantMessage,
    router, memory: aiMemory, getAgent,
  };
}
