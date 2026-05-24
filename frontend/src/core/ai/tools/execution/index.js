const toolLoaders = {
  PromptGeneratorTool: () => import("./PromptGeneratorTool").then((m) => m.PromptGeneratorTool),
  ScriptGeneratorTool: () => import("./ScriptGeneratorTool").then((m) => m.ScriptGeneratorTool),
  CopywritingTool: () => import("./CopywritingTool").then((m) => m.CopywritingTool),
  MarketingStrategyTool: () => import("./MarketingStrategyTool").then((m) => m.MarketingStrategyTool),
  SEOGeneratorTool: () => import("./SEOGeneratorTool").then((m) => m.SEOGeneratorTool),
  VideoIdeaTool: () => import("./VideoIdeaTool").then((m) => m.VideoIdeaTool),
  WorkflowBuilderTool: () => import("./WorkflowBuilderTool").then((m) => m.WorkflowBuilderTool),
  CodeGeneratorTool: () => import("./CodeGeneratorTool").then((m) => m.CodeGeneratorTool),
  AffiliateContentTool: () => import("./AffiliateContentTool").then((m) => m.AffiliateContentTool),
  BrowserSearchTool: () => import("./BrowserSearchTool").then((m) => m.BrowserSearchTool),
  NewsSearchTool: () => import("./NewsSearchTool").then((m) => m.NewsSearchTool),
  ContentExtractTool: () => import("./ContentExtractTool").then((m) => m.ContentExtractTool),
};

export async function getExecutionTool(name) {
  const loader = toolLoaders[name];
  if (!loader) return null;
  return loader();
}

export const executionToolNames = Object.keys(toolLoaders);
