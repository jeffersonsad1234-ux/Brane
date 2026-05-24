import { BaseExecutionTool } from "./BaseExecutionTool";

export class BrowserSearchTool extends BaseExecutionTool {
  constructor() {
    super({ name: "BrowserSearchTool", description: "Pesquisa na web e extrai conteúdo de páginas" });
  }

  async execute(context) {
    const query = context.userMessage.replace(/(pesquisar?|buscar?|procurar?|encontrar?|search?|notícias?\s+(sobre|de|do|da)?)\s*/i, "").trim() || context.userMessage;
    const browser = context.browser;

    try {
      const searchResult = await browser.search(query);
      if (searchResult.results?.length > 0) {
        const topResults = searchResult.results.slice(0, 5);
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
