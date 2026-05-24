const UID = () => Math.random().toString(36).slice(2, 9);

export class AITool {
  constructor(config = {}) {
    this.id = config.id || `tool_${UID()}`;
    this.name = config.name || "Tool";
    this.description = config.description || "";
    this.handler = config.handler || (async () => {});
    this.category = config.category || "general";
    this.icon = config.icon || "🔧";
  }

  async execute(params = {}) {
    try {
      return await this.handler(params);
    } catch (err) {
      return { error: err.message };
    }
  }
}

function createTool(name, description, handler, category, icon) {
  return new AITool({ name, description, handler, category, icon });
}

export const TOOLS = {
  // Memory tools
  remember: createTool(
    "Remember",
    "Salva informações na memória do usuário para uso futuro.",
    async ({ key, value }) => {
      const { aiMemory } = await import("../memory/AIMemory");
      await aiMemory.setMemory(key, value);
      return { success: true, key };
    },
    "memory", "💾"
  ),
  recall: createTool(
    "Recall",
    "Recupera informações salvas na memória do usuário.",
    async ({ key }) => {
      const { aiMemory } = await import("../memory/AIMemory");
      const value = await aiMemory.getMemory(key);
      return { key, value };
    },
    "memory", "🔍"
  ),

  // Browser tools
  search: createTool(
    "Web Search",
    "Pesquisa informações na web usando o BrowserEngine.",
    async ({ query }) => {
      const { browserEngine } = await import("../browser/BrowserEngine");
      const result = await browserEngine.search(query);
      return result;
    },
    "browser", "🌐"
  ),
  fetchPage: createTool(
    "Fetch Page",
    "Obtém o conteúdo de uma página web via BrowserEngine.",
    async ({ url }) => {
      const { browserEngine } = await import("../browser/BrowserEngine");
      return await browserEngine.fetchPage(url);
    },
    "browser", "📄"
  ),

  // Video Studio tools
  getProjectInfo: createTool(
    "Get Project Info",
    "Obtém informações do projeto atual no Video Studio.",
    async ({ projectId }) => {
      return { projectId, name: "Current Project", duration: 30, tracks: 7 };
    },
    "video", "🎬"
  ),
  addClip: createTool(
    "Add Clip",
    "Adiciona um clipe ao timeline do projeto.",
    async ({ projectId, clipName, duration }) => {
      return { success: true, clipName, duration };
    },
    "video", "✂️"
  ),

  // Code tools
  runCode: createTool(
    "Run Code",
    "Executa código JavaScript em sandbox.",
    async ({ code }) => {
      try {
        const result = new Function(code)();
        return { result: String(result) };
      } catch (err) {
        return { error: err.message };
      }
    },
    "code", "▶️"
  ),
  formatCode: createTool(
    "Format Code",
    "Formata e organiza código-fonte.",
    async ({ code, language }) => {
      return { formatted: code, language };
    },
    "code", "✨"
  ),

  // Data tools
  analyzeData: createTool(
    "Analyze Data",
    "Analisa dados e retorna insights.",
    async ({ data }) => {
      return { insights: `Analyzed ${data?.length || 0} data points` };
    },
    "data", "📊"
  ),
  generateReport: createTool(
    "Generate Report",
    "Gera um relatório estruturado.",
    async ({ title, content }) => {
      return { report: { title, generated: Date.now(), content } };
    },
    "data", "📋"
  ),

  // Workflow tools
  createWorkflow: createTool(
    "Create Workflow",
    "Cria um novo workflow de automação.",
    async ({ name, steps }) => {
      return { workflow: { id: UID(), name, steps } };
    },
    "workflow", "⚡"
  ),
  runWorkflow: createTool(
    "Run Workflow",
    "Executa um workflow existente.",
    async ({ workflowId }) => {
      const { workflowEngine } = await import("../workflows/WorkflowEngine");
      return await workflowEngine.execute(workflowId);
    },
    "workflow", "▶️"
  ),
};

export function getTool(name) {
  return TOOLS[name] || null;
}

export function listTools(category = null) {
  const all = Object.values(TOOLS);
  return category ? all.filter((t) => t.category === category) : all;
}

export function listToolCategories() {
  const cats = new Set();
  Object.values(TOOLS).forEach((t) => cats.add(t.category));
  return Array.from(cats);
}

export { executionTools } from "./execution";
