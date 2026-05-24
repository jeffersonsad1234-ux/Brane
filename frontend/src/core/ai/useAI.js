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

  useEffect(() => {
    loadSessions();
    updateProviderStatus();
    // Wire tool execution status handler
    router.setToolStatusHandler((status) => {
      setExecutionStatus(status);
      if (status.type === "done" || status.type === "tool-error") {
        setTimeout(() => setExecutionStatus(null), 2000);
      }
    });
  }, [router]);

  const stopGeneration = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    if (activeStreamRef.current) {
      try { activeStreamRef.current.return?.(); } catch {}
      activeStreamRef.current = null;
    }
    setStreaming(false);
    setLoading(false);
    if (currentStream) {
      const msg = {
        id: `msg_${Date.now()}`,
        role: "assistant",
        content: currentStream + "\n\n*(geração interrompida)*",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, msg]);
      setCurrentStream("");
    }
  }, [currentStream]);

  const loadSessions = useCallback(async () => {
    try {
      const list = await router.getSessions();
      setSessions(list);
    } catch { }
  }, [router]);

  const updateProviderStatus = useCallback(() => {
    setProviderStatus(router.getProviderStatus());
  }, [router]);

  const sendMessage = useCallback(async (content, options = {}) => {
    setLoading(true);
    setError(null);
    setStreaming(false);

    const userMsg = { id: `msg_${Date.now()}`, role: "user", content, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);

    const agent = options.agent || currentAgent;
    const model = options.model || currentModel;
    const provider = options.provider || currentProvider;

    try {
      const result = await router.chat(content, {
        agent,
        model: model || undefined,
        provider,
        ...options,
      });

      const assistantMsg = {
        id: `msg_${Date.now() + 1}`,
        role: "assistant",
        content: result.content,
        provider: result.provider,
        model: result.model,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setLoading(false);
      loadSessions();
      return result;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, [router, currentAgent, currentModel, currentProvider, loadSessions]);

  const sendStreamMessage = useCallback(async (content, options = {}) => {
    setLoading(true);
    setError(null);
    setStreaming(true);
    setCurrentStream("");

    const controller = new AbortController();
    abortRef.current = controller;

    const userMsg = { id: `msg_${Date.now()}`, role: "user", content, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);

    const agent = options.agent || currentAgent;
    const model = options.model || currentModel;
    const provider = options.provider || currentProvider;

    let fullContent = "";
    let resultProvider = "";

    try {
      const stream = router.chatStream(content, {
        agent,
        model: model || undefined,
        provider,
        signal: controller.signal,
        ...options,
      });
      activeStreamRef.current = stream;

      for await (const chunk of stream) {
        if (controller.signal.aborted) break;
        if (chunk.done) {
          if (chunk.error) {
            throw new Error(chunk.error);
          }
          if (!controller.signal.aborted) break;
        }
        fullContent += chunk.content;
        resultProvider = chunk.provider || resultProvider;
        if (!controller.signal.aborted) {
          setCurrentStream(fullContent);
        }
      }

      activeStreamRef.current = null;

      if (!fullContent && !controller.signal.aborted) {
        throw new Error("Stream retornou vazio");
      }

      if (controller.signal.aborted && fullContent) {
        const msg = {
          id: `msg_${Date.now() + 1}`,
          role: "assistant",
          content: fullContent,
          provider: resultProvider,
          model: model || (agent ? agent.defaultModel : ""),
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, msg]);
        setCurrentStream("");
        setLoading(false);
        setStreaming(false);
        return { content: fullContent, provider: resultProvider, aborted: true };
      }
    } catch (err) {
      setStreaming(false);
      setCurrentStream("");
      abortRef.current = null;
      activeStreamRef.current = null;
      try {
        const result = await sendMessage(content, options);
        setLoading(false);
        return result;
      } catch (fallbackErr) {
        try {
          const demo = getProvider("branpy-demo");
          if (demo && demo.isAvailable()) {
            const text = await demo.sendMessage([userMsg], options);
            const msg = { id: `msg_${Date.now() + 1}`, role: "assistant", content: text, provider: "branpy-demo", timestamp: Date.now() };
            setMessages((prev) => [...prev, msg]);
            setLoading(false);
            return { content: text, provider: "branpy-demo" };
          }
        } catch {}
        setLoading(false);
        return { content: "", error: fallbackErr.message };
      }
    }

    if (!controller.signal.aborted && fullContent) {
      const assistantMsg = {
        id: `msg_${Date.now() + 1}`,
        role: "assistant",
        content: fullContent,
        provider: resultProvider,
        model: model || (agent ? agent.defaultModel : ""),
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    }
    setCurrentStream("");
    setLoading(false);
    setStreaming(false);
    abortRef.current = null;
    loadSessions();
    return { content: fullContent, provider: resultProvider };
  }, [router, currentAgent, currentModel, currentProvider, loadSessions, sendMessage]);

  const clearMessages = useCallback(async () => {
    setMessages([]);
    setCurrentStream("");
    setError(null);
    await router.clearHistory();
    loadSessions();
  }, [router, loadSessions]);

  const loadSession = useCallback(async (sessionId) => {
    router.setSession(sessionId);
    const history = await router.getHistory(sessionId);
    setMessages(history.map((m) => ({
      id: m.id || `msg_${m.timestamp || Date.now()}`,
      role: m.role,
      content: m.content,
      provider: m.provider,
      model: m.model,
      timestamp: m.timestamp,
    })));
  }, [router]);

  const newSession = useCallback(() => {
    router.setSession(`session_${Date.now()}`);
    setMessages([]);
    setCurrentStream("");
    setError(null);
    loadSessions();
  }, [router, loadSessions]);

  return {
    messages, loading, streaming, currentStream, error, executionStatus,
    currentAgent, currentModel, currentProvider, sessions, providerStatus,

    sendMessage, sendStreamMessage, clearMessages, loadSession, newSession,
    setCurrentAgent, setCurrentModel, setCurrentProvider, stopGeneration,

    loadSessions, updateProviderStatus,
    router, memory: aiMemory,
    getProviderStatus: providerStatus,
    getAgent,
  };
}
