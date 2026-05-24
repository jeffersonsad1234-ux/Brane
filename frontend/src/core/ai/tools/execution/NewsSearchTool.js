import { BaseExecutionTool } from "./BaseExecutionTool";

export class NewsSearchTool extends BaseExecutionTool {
  constructor() {
    super({ name: "NewsSearchTool", description: "Busca notícias atuais na web" });
  }

  async execute(context) {
    const query = context.userMessage.replace(/(notícias?\s+(do|da|de|sobre)?|últimas\s+)?/i, "").trim() || "últimas notícias";
    const browser = context.browser;

    try {
      const searchResult = await browser.search(`últimas notícias ${query}`);
      if (searchResult.results?.length > 0) {
        const topResults = searchResult.results.slice(0, 8);
        return {
          query,
          results: topResults.map((r) => ({
            title: r.title,
            url: r.url,
            snippet: r.snippet || "",
            source: r.source || "Web",
          })),
          totalResults: searchResult.results.length,
        };
      }
    } catch {}

    return { query, results: [], totalResults: 0 };
  }
}
