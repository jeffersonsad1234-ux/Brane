import { BaseExecutionTool } from "./BaseExecutionTool";

const SEARCH_TIMEOUT = 10000;
const MAX_RESULTS = 8;

export class NewsSearchTool extends BaseExecutionTool {
  constructor() {
    super({ name: "NewsSearchTool", description: "Busca notícias atuais na web" });
  }

  async execute(context) {
    try {
      const rawQuery = (context.userMessage || "").replace(/(notícias?\s+(do|da|de|sobre)?|últimas\s+)?/i, "").trim();
      const query = rawQuery || "últimas notícias";
      const browser = context.browser;
      if (!browser || typeof browser.search !== "function") {
        return { query, results: [], totalResults: 0, error: "Browser engine not available" };
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), SEARCH_TIMEOUT);

      const searchResult = await Promise.race([
        browser.search(`últimas notícias ${query}`),
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
      return { query: "últimas notícias", results: [], totalResults: 0, error: "Search failed" };
    }
  }
}
