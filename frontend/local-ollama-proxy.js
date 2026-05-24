const http = require("http");

const OLLAMA_HOST = "127.0.0.1";
const OLLAMA_PORT = 11434;
const PROXY_PORT = 8787;

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:8787",
  "https://brane.pages.dev",
];

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

function proxyRequest(path, method, headers, body) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: OLLAMA_HOST,
      port: OLLAMA_PORT,
      path,
      method,
      headers: { ...headers, host: `${OLLAMA_HOST}:${OLLAMA_PORT}` },
    };
    const req = http.request(opts, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks),
        });
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || ALLOWED_ORIGINS[0];
  const cors = corsHeaders(origin);

  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, cors);
    return res.end();
  }

  const path = req.url;
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const body = Buffer.concat(chunks);

  try {
    const upstream = await proxyRequest(path, req.method, req.headers, body);
    const responseHeaders = {
      ...cors,
      "Content-Type": upstream.headers["content-type"] || "application/json",
    };
    res.writeHead(upstream.statusCode, responseHeaders);
    res.end(upstream.body);
  } catch (err) {
    console.error("[Proxy Error]", err.message);
    res.writeHead(502, {
      ...cors,
      "Content-Type": "application/json",
    });
    res.end(JSON.stringify({ error: `Proxy error: ${err.message}` }));
  }
});

server.listen(PROXY_PORT, "127.0.0.1", () => {
  console.log(`✓ Ollama proxy rodando em http://127.0.0.1:${PROXY_PORT}`);
  console.log(`  → encaminhando para http://${OLLAMA_HOST}:${OLLAMA_PORT}`);
});
