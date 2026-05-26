const http = require("http");
const fs = require("fs");
const path = require("path");

const OLLAMA_HOST = "127.0.0.1";
const OLLAMA_PORT = 11434;
const PORT = 3001;
const BUILD_DIR = path.join(__dirname, "build");

const MIME = {
  ".html": "text/html;charset=utf-8",
  ".js": "application/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".map": "application/json",
};

function readFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

function proxyRequest(reqPath, method, headers, body) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: OLLAMA_HOST,
      port: OLLAMA_PORT,
      path: reqPath,
      method,
      headers: { ...headers, host: `${OLLAMA_HOST}:${OLLAMA_PORT}`, connection: "close" },
    };
    const req = http.request(opts, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () =>
        resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) })
      );
    });
    req.on("error", reject);
    if (body && body.length > 0) req.write(body);
    req.end();
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    // Collect body for all requests
    const body = await new Promise((resolve) => {
      const chunks = [];
      req.on("data", (c) => chunks.push(c));
      req.on("end", () => resolve(Buffer.concat(chunks)));
    });

    // ---- SEARCH API: handle POST /api/search locally ----
    if (url.pathname === "/api/search" && req.method === "POST") {
      try {
        const { query } = JSON.parse(body.toString() || "{}");
        if (!query || typeof query !== "string" || !query.trim()) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Query is required" }));
        }
        const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
        const searchRes = await fetch(searchUrl, {
          headers: { "User-Agent": "BRANPY/1.0 (compatible; +https://brane.pages.dev)" },
        });
        if (!searchRes.ok) throw new Error(`DuckDuckGo HTTP ${searchRes.status}`);
        const html = await searchRes.text();

        const results = [];
        const seen = new Set();
        const linkRe = /<a[^>]+href="([^"]*uddg=[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
        let m;
        while ((m = linkRe.exec(html)) !== null && results.length < 10) {
          const uddgMatch = m[1].match(/uddg=([^&]+)/);
          const url = uddgMatch ? decodeURIComponent(uddgMatch[1]) : m[1];
          const title = m[2].replace(/<[^>]+>/g, "").trim();
          if (url && title && url.startsWith("http") && !seen.has(url)) {
            seen.add(url);
            results.push({ title, url, snippet: "", source: "DuckDuckGo" });
          }
        }
        const snippetRe = /class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
        let si = 0;
        while ((m = snippetRe.exec(html)) !== null && si < results.length) {
          results[si].snippet = m[1].replace(/<[^>]+>/g, "").trim();
          si++;
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ query, results }));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: err.message || "Search failed" }));
      }
    }

    // ---- API PROXY: forward /api/* to Ollama ----
    if (url.pathname.startsWith("/api/")) {
      let upstream;
      try {
        upstream = await proxyRequest(url.pathname + url.search, req.method, req.headers, body);
      } catch (err) {
        console.error("[serve] Ollama proxy error:", err.message);
        res.writeHead(502, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            error: `Ollama não está rodando em http://${OLLAMA_HOST}:${OLLAMA_PORT}. Execute: ollama serve`,
            detail: err.message,
          })
        );
      }
      const h = {
        "Content-Type": upstream.headers["content-type"] || "application/json",
      };
      if (upstream.headers["content-length"]) h["Content-Length"] = upstream.headers["content-length"];
      res.writeHead(upstream.status, h);
      return res.end(upstream.body);
    }

    // ---- STATIC FILES: serve built frontend ----
    const ENGINE_DIR = path.join(BUILD_DIR, "engine");
    const isEnginePath = url.pathname.startsWith("/engine");
    let filePath;
    if (isEnginePath) {
      const subPath = url.pathname.replace("/engine", "") || "/";
      filePath = path.join(ENGINE_DIR, subPath === "/" ? "index.html" : subPath);
      if (!fs.existsSync(filePath)) filePath = path.join(ENGINE_DIR, "index.html");
    } else {
      filePath = path.join(BUILD_DIR, url.pathname === "/" ? "index.html" : url.pathname);
      if (!fs.existsSync(filePath)) filePath = path.join(BUILD_DIR, "index.html");
    }
    const data = await readFile(filePath);
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  } catch (err) {
    // Fallback: try to serve index.html (SPA)
    if (err.code === "ENOENT") {
      try {
        const data = await readFile(path.join(BUILD_DIR, "index.html"));
        res.writeHead(200, { "Content-Type": "text/html;charset=utf-8" });
        return res.end(data);
      } catch (_) {}
    }
    console.error("[serve] Error:", err.message);
    res.writeHead(err.code === "ECONNREFUSED" ? 502 : 500, {
      "Content-Type": "application/json",
    });
    res.end(JSON.stringify({ error: err.message }));
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`\n  B Livre server rodando em http://127.0.0.1:${PORT}`);
  console.log(`  API /api/* -> http://${OLLAMA_HOST}:${OLLAMA_PORT}`);
  console.log(`  Ollama precisa estar rodando: ollama serve`);
  console.log(`  Pressione Ctrl+C para parar\n`);
});
