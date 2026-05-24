const TOOL_MAP = {
  news: ["NewsSearchTool", "BrowserSearchTool"],
  search: ["BrowserSearchTool", "NewsSearchTool"],
  browser: ["BrowserSearchTool", "ContentExtractTool"],
  prompt: ["PromptGeneratorTool"],
  script: ["ScriptGeneratorTool"],
  copywriting: ["CopywritingTool"],
  marketing: ["MarketingStrategyTool"],
  seo: ["SEOGeneratorTool"],
  video: ["VideoIdeaTool"],
  automation: ["WorkflowBuilderTool"],
  code: ["CodeGeneratorTool"],
  affiliate: ["AffiliateContentTool"],
  branding: ["MarketingStrategyTool"],
  ecommerce: ["MarketingStrategyTool", "AffiliateContentTool"],
  general: [],
};

const PRIORITY_MAP = {};

export class ToolResolver {
  resolve(intentId, options = {}) {
    const toolNames = TOOL_MAP[intentId] || TOOL_MAP.general;
    return toolNames.map((name, order) => ({
      name,
      order,
      required: order === 0,
      config: options[name] || {},
    }));
  }

  getToolNames() {
    return Object.values(TOOL_MAP).flat().filter((v, i, a) => a.indexOf(v) === i);
  }

  hasTools(intentId) {
    return (TOOL_MAP[intentId] || []).length > 0;
  }
}

export const toolResolver = new ToolResolver();
