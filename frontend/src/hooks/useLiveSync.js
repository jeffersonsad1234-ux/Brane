import { useRef, useCallback, useState, useEffect, useMemo } from "react";

const WS_PORT = 3003;
const WS_URL = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.hostname}:${WS_PORT}`;

export default function useLiveSync(role) {
  const wsRef = useRef(null);
  const handlersRef = useRef({});
  const [connected, setConnected] = useState(false);
  const reconnectTimer = useRef(null);

  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === 0 || wsRef.current.readyState === 1)) return;

    let ws;
    try {
      ws = new WebSocket(WS_URL);
    } catch (err) {
      console.error("[LiveSync] Erro ao criar WebSocket:", err.message);
      reconnectTimer.current = setTimeout(connect, 3000);
      return;
    }

    ws.onopen = () => {
      console.log("[LiveSync] Conectado como", role);
      ws.send(JSON.stringify({ type: "identify", role }));
      setConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const handler = handlersRef.current[msg.type];
        if (handler) handler(msg);
      } catch (err) {
        console.error("[LiveSync] Erro ao processar mensagem:", err.message);
      }
    };

    ws.onclose = () => {
      // Only act if this socket is still the active reference.
      // Prevents a stale close from a previous connection (e.g. Strict Mode
      // or rapid reconnect) from corrupting the active WebSocket.
      if (wsRef.current !== ws) return;
      console.log("[LiveSync] Desconectado, reconectando em 3s...");
      setConnected(false);
      wsRef.current = null;
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.onerror = (err) => {
      console.error("[LiveSync] Erro WebSocket:", err.message || "Conexão recusada");
    };

    wsRef.current = ws;
  }, [role]);

  const disconnect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    if (wsRef.current) {
      try { wsRef.current.close(); } catch (e) { /* ignore */ }
      wsRef.current = null;
    }
    setConnected(false);
  }, []);

  const send = useCallback((data) => {
    if (wsRef.current && wsRef.current.readyState === 1) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const sendCommand = useCallback((command, payload = {}) => {
    send({ type: "command", command, ...payload });
  }, [send]);

  const sendStatus = useCallback((payload) => {
    send({ type: "status", ...payload });
  }, [send]);

  const sendVoices = useCallback((voices) => {
    send({ type: "voices", voices });
  }, [send]);

  const sendAudioState = useCallback((active) => {
    send({ type: "audioState", active });
  }, [send]);

  const on = useCallback((type, handler) => {
    handlersRef.current[type] = handler;
  }, []);

  const off = useCallback((type) => {
    delete handlersRef.current[type];
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return useMemo(() => ({
    connected,
    connect,
    disconnect,
    send,
    sendCommand,
    sendStatus,
    sendVoices,
    sendAudioState,
    on,
    off,
  }), [connected, connect, disconnect, send, sendCommand, sendStatus, sendVoices, sendAudioState, on, off]);
}
