const { createProxyMiddleware } = require("http-proxy-middleware");

// DuckDuckGo HTML search parser (shared between dev and prod)
async function searchDuckDuckGo(query) {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "BRANPY/1.0 (compatible; +https://brane.pages.dev)" },
  });
  if (!res.ok) throw new Error(`DuckDuckGo HTTP ${res.status}`);
  const html = await res.text();

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
  return results;
}

module.exports = function (app) {
  // Search endpoint: handle POST /api/search locally in dev (before Ollama proxy)
  app.post("/api/search", async (req, res) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const { query } = JSON.parse(body || "{}");
        if (!query || typeof query !== "string" || !query.trim()) {
          return res.status(400).json({ error: "Query is required" });
        }
        const results = await searchDuckDuckGo(query.trim());
        return res.json({ query, results });
      } catch (err) {
        return res.status(500).json({ error: err.message || "Search failed" });
      }
    });
  });

  // All other /api/* requests go to Ollama
  app.use(
    "/api",
    createProxyMiddleware({
      target: "http://127.0.0.1:11434",
      changeOrigin: true,
    })
  );
};
