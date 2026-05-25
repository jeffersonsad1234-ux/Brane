import { BaseExecutionTool } from "./BaseExecutionTool";

const SEARCH_TIMEOUT = 10000;
const MAX_RESULTS = 5;

export class BrowserSearchTool extends BaseExecutionTool {
  constructor() {
    super({ name: "BrowserSearchTool", description: "Pesquisa na web e extrai conteúdo de páginas" });
  }

  async execute(context) {
    try {
      const rawMsg = context.userMessage || "";
      const query = rawMsg.replace(/^(pesquis[ae]r?|buscar?|procurar?|encontrar?|search|notícias?\s+(sobre|de|do|da)?)\s*/i, "").trim() || rawMsg;
      const browser = context.browser;
      if (!browser || typeof browser.search !== "function") {
        return { query, results: [], totalResults: 0, error: "Browser engine not available" };
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), SEARCH_TIMEOUT);

      const searchResult = await Promise.race([
        browser.search(query),
        new Promise((_, reject) => {
          controller.signal.addEventListener("abort", () => reject(new Error("Search timed out")));
        }),
      ]);
      clearTimeout(timer);

      if (!searchResult) {
        return { query, results: [], totalResults: 0 };
      }

      const results = (searchResult.results || []).slice(0, MAX_RESULTS);
      return {
        query,
        results: results.map((r) => ({
          title: r.title || "",
          url: r.url || "",
          snippet: r.snippet || "",
          source: r.source || "Web",
        })),
        totalResults: searchResult.results ? searchResult.results.length : 0,
      };
    } catch {
      return { query: context.userMessage || "", results: [], totalResults: 0, error: "Search failed" };
    }
  }
}
