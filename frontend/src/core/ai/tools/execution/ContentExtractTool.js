import { BaseExecutionTool } from "./BaseExecutionTool";

export class ContentExtractTool extends BaseExecutionTool {
  constructor() {
    super({ name: "ContentExtractTool", description: "Extrai e resume conteúdo de páginas web" });
  }

  async execute(context) {
    const browser = context.browser;
    const urlMatch = context.userMessage.match(/(https?:\/\/[^\s]+)/g);
    const url = urlMatch ? urlMatch[0] : null;

    if (url) {
      try {
        const content = await browser.extractContent(url);
        return {
          url,
          title: content.title || "",
          summary: content.summary || "",
          wordCount: content.wordCount || 0,
          links: (content.links || []).slice(0, 10),
        };
      } catch (err) {
        return { url, error: err.message };
      }
    }

    // Try searching for the content first
    try {
      const searchResult = await browser.search(context.userMessage);
      if (searchResult.results?.length > 0) {
        const firstUrl = searchResult.results[0].url;
        try {
          const content = await browser.extractContent(firstUrl);
          return {
            url: firstUrl,
            title: content.title || "",
            summary: content.summary || "",
            wordCount: content.wordCount || 0,
            links: (content.links || []).slice(0, 10),
          };
        } catch {}
        return {
          url: firstUrl,
          results: searchResult.results.slice(0, 5),
        };
      }
    } catch {}

    return { url: null, error: "Could not find content" };
  }
}
