const UID = () => Math.random().toString(36).slice(2, 9);

export class BrowserEngine {
  constructor(config = {}) {
    this.id = config.id || `br_${UID()}`;
    this.tabs = [];
    this.activeTabId = null;
    this.history = [];
    this.bookmarks = [];
    this.cache = new Map();
    this.maxCacheSize = config.maxCacheSize ?? 50;
    this.settings = {
      userAgent: "Mozilla/5.0 BRANPY-AI/1.0",
      timeout: 10000,
      maxResults: config.maxResults ?? 10,
      ...config.settings,
    };
    this._loadState();
  }

  get activeTab() {
    return this.tabs.find((t) => t.id === this.activeTabId) || null;
  }

  createTab(url = "about:blank") {
    const tab = { id: `tab_${UID()}`, url, title: "Nova aba", loading: false, history: [url], position: this.tabs.length };
    this.tabs.push(tab);
    this.activeTabId = tab.id;
    this._saveState();
    return tab;
  }

  closeTab(tabId) {
    this.tabs = this.tabs.filter((t) => t.id !== tabId);
    if (this.activeTabId === tabId) {
      this.activeTabId = this.tabs.length > 0 ? this.tabs[this.tabs.length - 1].id : null;
    }
    this._saveState();
  }

  switchTab(tabId) {
    if (this.tabs.find((t) => t.id === tabId)) {
      this.activeTabId = tabId;
    }
  }

  async navigate(url, tabId) {
    const tab = this.tabs.find((t) => t.id === (tabId || this.activeTabId));
    if (!tab) throw new Error("Tab not found");

    tab.loading = true;
    tab.url = url;
    this._saveState();

    try {
      const result = await this.fetchPage(url);
      tab.title = result.title || url;
      tab.content = result.text;
      tab.loading = false;
      if (tab.history[tab.history.length - 1] !== url) tab.history.push(url);
      this.recordHistory({ type: "navigation", url, title: tab.title, timestamp: Date.now() });
      this._saveState();
      return result;
    } catch (err) {
      tab.loading = false;
      tab.error = err.message;
      this._saveState();
      throw err;
    }
  }

  async fetchPage(url) {
    const cached = this.cache.get(url);
    if (cached && Date.now() - cached.timestamp < 60000) return cached.data;

    try {
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(this.settings.timeout) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const html = data.contents || "";

      const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() || "";
      const text = this._extractText(html);
      const links = this._extractLinks(html, url);
      const images = this._extractImages(html, url);
      const meta = this._extractMeta(html);

      const result = { url, title, text: text.slice(0, 8000), links, images, meta, length: text.length, timestamp: Date.now() };

      this.cache.set(url, { data: result, timestamp: Date.now() });
      if (this.cache.size > this.maxCacheSize) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }

      return result;
    } catch (err) {
      return { url, title: "", text: "", links: [], images: [], meta: {}, error: err.message };
    }
  }

  _decodeDdgUrl(rawUrl) {
    const match = rawUrl.match(/uddg=([^&]+)/);
    if (match) {
      try { return decodeURIComponent(match[1]); } catch { return match[1]; }
    }
    if (rawUrl.startsWith("//")) return "https:" + rawUrl;
    if (rawUrl.startsWith("http")) return rawUrl;
    return rawUrl;
  }

  async search(query) {
    try {
      const results = [];
      const seen = new Set();

      // Primary: DuckDuckGo HTML search
      try {
        const htmlRes = await fetch(
          `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
          { signal: AbortSignal.timeout(8000) }
        );
        if (htmlRes.ok) {
          const html = await htmlRes.text();
          // Match all result links (contain uddg= redirect)
          const linkRe = /<a[^>]+href="([^"]*uddg=[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
          let m;
          while ((m = linkRe.exec(html)) !== null && results.length < this.settings.maxResults) {
            const url = this._decodeDdgUrl(m[1]);
            const title = m[2].replace(/<[^>]+>/g, "").trim();
            if (url && title && url.startsWith("http") && !seen.has(url)) {
              seen.add(url);
              results.push({ title, url, snippet: "", source: "Web" });
            }
          }
          // Extract snippets from result__snippet spans
          const snippetRe = /class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
          let si = 0;
          while ((m = snippetRe.exec(html)) !== null && si < results.length) {
            results[si].snippet = m[1].replace(/<[^>]+>/g, "").trim();
            si++;
          }
        }
      } catch { /* DDG HTML search failed */ }

      // Fallback: DuckDuckGo Lite search (simpler HTML table)
      if (results.length === 0) {
        try {
          const liteRes = await fetch(
            `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`,
            { signal: AbortSignal.timeout(8000) }
          );
          if (liteRes.ok) {
            const html = await liteRes.text();
            const rowRe = /<tr[^>]*class="result"[^>]*>([\s\S]*?)<\/tr>/gi;
            let rm;
            while ((rm = rowRe.exec(html)) !== null && results.length < this.settings.maxResults) {
              const linkM = rm[1].match(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
              const snippetM = rm[1].match(/<span[^>]*>([\s\S]*?)<\/span>/i);
              if (linkM) {
                let url = linkM[1];
                if (url.startsWith("//")) url = "https:" + url;
                const title = linkM[2].replace(/<[^>]+>/g, "").trim();
                const snippet = snippetM ? snippetM[1].replace(/<[^>]+>/g, "").trim() : "";
                if (url && title && url.startsWith("http") && !seen.has(url)) {
                  seen.add(url);
                  results.push({ title, url, snippet, source: "Web" });
                }
              }
            }
          }
        } catch { /* DDG Lite search failed */ }
      }

      // Fallback: try direct URL encoding approach — query known news/pages
      if (results.length === 0 && /(notíci|news|jornal|última)/i.test(query)) {
        try {
          const feedRes = await fetch(
            `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent("últimas notícias " + query)}`,
            { signal: AbortSignal.timeout(6000) }
          );
          if (feedRes.ok) {
            const html = await feedRes.text();
            const rowRe = /<tr[^>]*class="result"[^>]*>([\s\S]*?)<\/tr>/gi;
            let rm;
            while ((rm = rowRe.exec(html)) !== null && results.length < this.settings.maxResults) {
              const linkM = rm[1].match(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
              const snippetM = rm[1].match(/<span[^>]*>([\s\S]*?)<\/span>/i);
              if (linkM) {
                let url = linkM[1];
                if (url.startsWith("//")) url = "https:" + url;
                const title = linkM[2].replace(/<[^>]+>/g, "").trim();
                const snippet = snippetM ? snippetM[1].replace(/<[^>]+>/g, "").trim() : "";
                if (url && title && url.startsWith("http") && !seen.has(url)) {
                  seen.add(url);
                  results.push({ title, url, snippet, source: "Web" });
                }
              }
            }
          }
        } catch { /* news fallback failed */ }
      }

      this.recordHistory({ type: "search", query, results: results.length, timestamp: Date.now() });
      return { query, results: results.slice(0, this.settings.maxResults) };
    } catch (err) {
      return { query, results: [], error: err.message };
    }
  }

  async extractContent(url) {
    const page = await this.fetchPage(url);
    if (page.error) return page;

    const sentences = page.text.match(/[^.!?\n]+[.!?\n]+/g) || [];
    return {
      url,
      title: page.title,
      summary: sentences.slice(0, 5).join(" ").trim(),
      wordCount: page.text.split(/\s+/).length,
      links: page.links,
      images: page.images,
      meta: page.meta,
    };
  }

  async extractProducts(url) {
    const page = await this.fetchPage(url);
    if (page.error) return page;

    const products = [];
    const priceRegex = /R?\$?\s*[\d.,]+/g;
    const nameRegex = /(?:product|item|title|name)["']?\s*[:=]\s*["']([^"']+)["']/gi;
    let m;
    while ((m = nameRegex.exec(page.text)) !== null) {
      products.push({ name: m[1], price: null });
    }
    const prices = page.text.match(priceRegex) || [];
    products.forEach((p, i) => { if (prices[i]) p.price = prices[i]; });

    return { url, products: products.slice(0, 20), count: Math.min(products.length, 20) };
  }

  async extractArticles(url) {
    const page = await this.fetchPage(url);
    if (page.error) return page;
    const paragraphs = page.text.split("\n\n").filter((p) => p.trim().length > 50);
    return { url, title: page.title, paragraphs: paragraphs.slice(0, 30), estimatedReadTime: Math.ceil(paragraphs.join(" ").split(/\s+/).length / 200) + "min" };
  }

  async multiSearch(queries) {
    const results = {};
    for (const q of queries) {
      results[q] = await this.search(q);
    }
    return results;
  }

  addBookmark(url, title) {
    if (!this.bookmarks.find((b) => b.url === url)) {
      this.bookmarks.push({ url, title, added: Date.now() });
      this._saveState();
    }
  }

  removeBookmark(url) {
    this.bookmarks = this.bookmarks.filter((b) => b.url !== url);
    this._saveState();
  }

  recordHistory(entry) {
    this.history.push(entry);
    if (this.history.length > 200) this.history = this.history.slice(-200);
    this._saveState();
  }

  _extractText(html) {
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
      .replace(/<[^>]+>/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/&[a-z]+;/g, " ")
      .trim();
  }

  _extractLinks(html, baseUrl) {
    const links = [];
    const regex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let m;
    while ((m = regex.exec(html)) !== null && links.length < 50) {
      let url = m[1];
      const text = m[2].replace(/<[^>]+>/g, "").trim();
      if (url.startsWith("http") || url.startsWith("//")) {
        if (url.startsWith("//")) url = "https:" + url;
        links.push({ url, text: text.slice(0, 100) });
      }
    }
    return links;
  }

  _extractImages(html, baseUrl) {
    const images = [];
    const regex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let m;
    while ((m = regex.exec(html)) !== null && images.length < 30) {
      const src = m[1].startsWith("http") ? m[1] : m[1].startsWith("//") ? "https:" + m[1] : null;
      if (src) images.push(src);
    }
    return images;
  }

  _extractMeta(html) {
    const meta = {};
    const desc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
    if (desc) meta.description = desc[1];
    const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
    if (og) meta.ogImage = og[1];
    return meta;
  }

  _saveState() {
    try {
      localStorage.setItem(`branpy_browser_tabs`, JSON.stringify(this.tabs.map((t) => ({ id: t.id, url: t.url, title: t.title, position: t.position, history: t.history.slice(-20) }))));
      localStorage.setItem(`branpy_browser_active`, this.activeTabId || "");
      localStorage.setItem(`branpy_browser_bookmarks`, JSON.stringify(this.bookmarks));
    } catch {}
  }

  _loadState() {
    try {
      const saved = localStorage.getItem(`branpy_browser_tabs`);
      if (saved) {
        this.tabs = JSON.parse(saved).map((t) => ({ ...t, loading: false, content: "" }));
        this.activeTabId = localStorage.getItem(`branpy_browser_active`) || this.tabs[0]?.id || null;
      }
      const bm = localStorage.getItem(`branpy_browser_bookmarks`);
      if (bm) this.bookmarks = JSON.parse(bm);
    } catch {}
  }
}

export const browserEngine = new BrowserEngine();
