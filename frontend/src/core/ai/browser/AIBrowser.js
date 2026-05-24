const UID = () => Math.random().toString(36).slice(2, 9);

export class AIBrowser {
  constructor(config = {}) {
    this.id = config.id || `browser_${UID()}`;
    this.history = [];
    this.maxHistory = config.maxHistory ?? 50;
    this.tabs = [];
    this.activeTab = null;
  }

  async fetchPage(url) {
    try {
      const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`, {
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const html = data.contents || "";

      const text = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 5000);

      this.addToHistory({ type: "fetch", url, timestamp: Date.now() });
      return { url, text, length: text.length };
    } catch (err) {
      this.addToHistory({ type: "error", url, error: err.message, timestamp: Date.now() });
      return { url, text: "", error: err.message };
    }
  }

  async search(query) {
    try {
      const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error(`Search failed: ${res.status}`);

      const data = await res.json();
      const results = (data.RelatedTopics || [])
        .filter((r) => r.Text)
        .slice(0, 8)
        .map((r) => ({ title: r.Text, url: r.FirstURL }));

      this.addToHistory({ type: "search", query, results: results.length, timestamp: Date.now() });
      return { query, results };
    } catch (err) {
      this.addToHistory({ type: "error", query, error: err.message, timestamp: Date.now() });
      return { query, results: [], error: err.message };
    }
  }

  async extractLinks(url) {
    const result = await this.fetchPage(url);
    if (result.error) return result;

    const linkRegex = /href=["'](https?:\/\/[^"']+)["']/gi;
    const linksSet = new Set();
    let match;
    while ((match = linkRegex.exec(result.text)) !== null) {
      linksSet.add(match[1]);
    }

    const links = Array.from(linksSet).slice(0, 20);
    return { url, links, count: links.length };
  }

  async summarize(url) {
    const result = await this.fetchPage(url);
    if (result.error) return result;

    const sentences = result.text.match(/[^.!?]+[.!?]+/g) || [];
    const summary = sentences.slice(0, 5).join(" ");
    return { url, summary, originalLength: result.length };
  }

  addToHistory(entry) {
    this.history.push(entry);
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-this.maxHistory);
    }
  }

  getHistory() {
    return this.history;
  }

  clearHistory() {
    this.history = [];
  }
}

export const aiBrowser = new AIBrowser();
