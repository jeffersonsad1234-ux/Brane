const { WebSocketServer } = require("ws");

const PORT = 3002;
let liveClient = null;
let adminClient = null;

const server = new WebSocketServer({ port: PORT, host: "0.0.0.0" });

server.on("connection", (ws) => {
  let role = null;

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      if (msg.type === "identify") {
        role = msg.role;
        if (role === "live") {
          liveClient = ws;
          console.log("[WS] Live conectado");
          if (adminClient && adminClient.readyState === 1) {
            adminClient.send(JSON.stringify({ type: "liveConnected", connected: true }));
          }
        } else if (role === "admin") {
          adminClient = ws;
          console.log("[WS] Admin conectado");
          adminClient.send(JSON.stringify({ type: "liveConnected", connected: !!liveClient }));
          if (liveClient && liveClient.readyState === 1) {
            liveClient.send(JSON.stringify({ type: "adminConnected", connected: true }));
          }
        }
        return;
      }

      if (msg.type === "status" || msg.type === "voices" || msg.type === "audioState") {
        if (adminClient && adminClient.readyState === 1) {
          adminClient.send(JSON.stringify(msg));
        }
        return;
      }

      if (msg.type === "command") {
        if (liveClient && liveClient.readyState === 1) {
          liveClient.send(JSON.stringify(msg));
        }
        return;
      }

      if (msg.type === "SET_QUIZ_LIBRARY") {
        console.log("[WS] Admin -> Live SET_QUIZ_LIBRARY:", JSON.stringify(msg).slice(0, 200));
        if (liveClient && liveClient.readyState === 1) {
          liveClient.send(JSON.stringify(msg));
          console.log("[WS] SET_QUIZ_LIBRARY enviado ao live");
        } else {
          console.log("[WS] ERRO: liveClient indisponivel ao encaminhar SET_QUIZ_LIBRARY");
        }
        return;
      }
    } catch (err) {
      console.error("[WS] Erro:", err.message);
    }
  });

  ws.on("close", () => {
    if (role === "live") {
      // Only clear liveClient if this socket IS the current liveClient.
      // Prevents a stale close from a previous connection (e.g. Strict Mode
      // double-mount or rapid reconnect) from erasing a newly connected client.
      if (liveClient === ws) {
        liveClient = null;
        console.log("[WS] Live desconectado");
        if (adminClient && adminClient.readyState === 1) {
          adminClient.send(JSON.stringify({ type: "liveConnected", connected: false }));
        }
      }
    } else if (role === "admin") {
      if (adminClient === ws) {
        adminClient = null;
        console.log("[WS] Admin desconectado");
        if (liveClient && liveClient.readyState === 1) {
          liveClient.send(JSON.stringify({ type: "adminConnected", connected: false }));
        }
      }
    }
  });

  ws.on("error", (err) => {
    console.error("[WS] Erro de conexao:", err.message);
  });
});

console.log(`[WS] Servidor WebSocket rodando em ws://0.0.0.0:${PORT}`);
