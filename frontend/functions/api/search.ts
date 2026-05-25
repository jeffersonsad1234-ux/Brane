export async function onRequestPost(context) {
  try {
    const { query } = await context.request.json();
    if (!query || typeof query !== "string" || !query.trim()) {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const provider = (context.env && context.env.SEARCH_PROVIDER) || "duckduckgo";
    const apiKey = context.env && context.env.SEARCH_API_KEY;

    let results;
    switch (provider) {
      case "tavily":
        results = await searchTavily(query, apiKey);
        break;
      case "brave":
        results = await searchBrave(query, apiKey);
        break;
      case "bing":
        results = await searchBing(query, apiKey);
        break;
      default:
        results = await searchDuckDuckGo(query);
        break;
    }

    return new Response(JSON.stringify({ query, results }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err.message || "Search failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function searchDuckDuckGo(query) {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "BRANPY/1.0 (compatible; +https://brane.pages.dev)" },
  });
  if (!res.ok) throw new Error(`DuckDuckGo returned HTTP ${res.status}`);
  const html = await res.text();

  const results = [];
  const seen = new Set();

  // Match result links (uddg= redirect URLs)
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

  // Extract snippets from result__snippet
  const snippetRe = /class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
  let si = 0;
  while ((m = snippetRe.exec(html)) !== null && si < results.length) {
    results[si].snippet = m[1].replace(/<[^>]+>/g, "").trim();
    si++;
  }

  return results;
}

async function searchTavily(query, apiKey) {
  if (!apiKey) throw new Error("SEARCH_API_KEY environment variable required for Tavily provider");
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "basic",
      max_results: 10,
      include_answer: false,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Tavily error (${res.status}): ${text}`);
  }
  const data = await res.json();
  return (data.results || []).map((r) => ({
    title: r.title || "",
    url: r.url || "",
    snippet: r.content || "",
    source: "Tavily",
  }));
}

async function searchBrave(query, apiKey) {
  if (!apiKey) throw new Error("SEARCH_API_KEY environment variable required for Brave provider");
  const res = await fetch(
    `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}`,
    {
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": apiKey,
      },
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Brave error (${res.status}): ${text}`);
  }
  const data = await res.json();
  return (data.web && data.web.results || []).map((r) => ({
    title: r.title || "",
    url: r.url || "",
    snippet: r.description || "",
    source: "Brave",
  }));
}

async function searchBing(query, apiKey) {
  if (!apiKey) throw new Error("SEARCH_API_KEY environment variable required for Bing provider");
  const res = await fetch(
    `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}&count=10`,
    { headers: { "Ocp-Apim-Subscription-Key": apiKey } }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Bing error (${res.status}): ${text}`);
  }
  const data = await res.json();
  return (data.webPages && data.webPages.value || []).map((r) => ({
    title: r.name || "",
    url: r.url || "",
    snippet: r.snippet || "",
    source: "Bing",
  }));
}
