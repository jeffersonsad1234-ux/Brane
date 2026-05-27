import { AGENTS } from "./AgentRegistry";

const UID = () => Math.random().toString(36).slice(2, 9);

export class AgentCoordinator {
  constructor(config = {}) {
    this.id = config.id || `coord_${UID()}`;
    this.tasks = [];
    this.workflows = new Map();
    this.agentMemory = new Map();
    this.maxHistoryPerAgent = config.maxHistoryPerAgent ?? 50;
  }

  async delegateTask(task, options = {}) {
    const taskId = `task_${UID()}`;
    const taskRecord = { id: taskId, description: task, status: "pending", createdAt: Date.now(), subtasks: [], results: [], ...options };
    this.tasks.push(taskRecord);

    const plan = this.createPlan(task, options.targetAgent);
    taskRecord.plan = plan;

    for (const step of plan) {
      const agent = AGENTS[step.agentId];
      if (!agent) {
        taskRecord.subtasks.push({ ...step, status: "failed", error: `Agent ${step.agentId} not found` });
        continue;
      }

      const stepResult = await this._executeStep(step, agent, taskRecord);
      taskRecord.subtasks.push(stepResult);
      taskRecord.results.push(stepResult);

      if (!stepResult.success && step.required !== false) {
        taskRecord.status = "failed";
        taskRecord.error = `Step '${step.action}' failed: ${stepResult.error}`;
        return taskRecord;
      }
    }

    taskRecord.status = taskRecord.subtasks.every((s) => s.success) ? "completed" : "partial";
    taskRecord.completedAt = Date.now();
    return taskRecord;
  }

  createPlan(task, preferredAgent) {
    const t = task.toLowerCase();
    const steps = [];

    const agentMap = {
      marketing: { agentId: "marketing-agent", keywords: ["marketing", "estratégia", "campanha", "funil", "anúncio", "ads", "tráfego", "crescimento"] },
      copy: { agentId: "marketing-agent", keywords: ["copy", "texto", "legenda", "descrição", "persuasivo", "headline", "cta"] },
      seo: { agentId: "seo-agent", keywords: ["seo", "palavra", "keyword", "rank", "otimização", "orgânico"] },
      video: { agentId: "video-agent", keywords: ["vídeo", "roteiro", "youtube", "tiktok", "reels", "script", "storytelling"] },
      code: { agentId: "dev-agent", keywords: ["código", "programa", "app", "site", "api", "desenvolvimento", "software"] },
      social: { agentId: "social-media-agent", keywords: ["social", "instagram", "facebook", "post", "rede social", "engajamento"] },
      design: { agentId: "design-agent", keywords: ["design", "logo", "paleta", "cor", "identidade", "visual"] },
      branding: { agentId: "branding-agent", keywords: ["brand", "marca", "posicionamento"] },
      automation: { agentId: "automation-agent", keywords: ["automação", "workflow", "fluxo", "integração", "pipelin"] },
      research: { agentId: "research-agent", keywords: ["pesquisa", "análise", "dados", "tendência", "concorrente", "mercado"] },
      core: { agentId: "branpy-core", keywords: [] },
    };

    if (preferredAgent && AGENTS[preferredAgent]) {
      steps.push({ agentId: preferredAgent, action: "execute", input: task, description: `Executar com ${AGENTS[preferredAgent].name}`, required: true });
      return steps;
    }

    // Find matching agents
    const matched = [];
    for (const [key, val] of Object.entries(agentMap)) {
      for (const kw of val.keywords) {
        if (t.includes(kw)) {
          matched.push(val.agentId);
          break;
        }
      }
    }

    const uniqueAgents = [...new Set(matched)];

    if (uniqueAgents.length === 0) {
      steps.push({ agentId: "branpy-core", action: "execute", input: task, description: "Análise geral", required: true });
    } else {
      for (const agentId of uniqueAgents) {
        steps.push({ agentId, action: "execute", input: task, description: `Executar com ${AGENTS[agentId]?.name || agentId}`, required: true });
      }
    }

    // Add summary step
    if (steps.length > 1) {
      steps.push({
        agentId: "branpy-core",
        action: "synthesize",
        input: `Sintetize os resultados dos agentes em uma resposta coesa para:\n\n${task}`,
        description: "Sintetizar respostas",
        required: false,
      });
    }

    return steps;
  }

  async _executeStep(step, agent, parentTask) {
    try {
      const agentContext = this.agentMemory.get(agent.id) || [];
      agentContext.push({ role: "system", content: agent.systemPrompt });
      agentContext.push({ role: "user", content: step.action === "synthesize" ? step.input : `Tarefa: ${step.input}\n\nContexto: ${parentTask.results.map((r) => r.content || "").filter(Boolean).join("\n\n")}` });

      const router = (await import("../router/AIRouter")).aiRouter;
      const result = await router.chat(step.input, { agent });

      agentContext.push({ role: "assistant", content: result.content });
      if (agentContext.length > this.maxHistoryPerAgent) {
        this.agentMemory.set(agent.id, agentContext.slice(-this.maxHistoryPerAgent));
      } else {
        this.agentMemory.set(agent.id, agentContext);
      }

      return {
        agentId: agent.id,
        action: step.action,
        success: true,
        content: result.content,
        provider: result.provider,
        model: result.model,
        duration: 0,
      };
    } catch (err) {
      return { agentId: agent.id, action: step.action, success: false, error: err.message };
    }
  }

  getTasks(status = null) {
    return status ? this.tasks.filter((t) => t.status === status) : this.tasks;
  }

  getTask(taskId) {
    return this.tasks.find((t) => t.id === taskId) || null;
  }

  getAgentMemory(agentId) {
    return this.agentMemory.get(agentId) || [];
  }

  clearAgentMemory(agentId) {
    if (agentId) this.agentMemory.delete(agentId);
    else this.agentMemory.clear();
  }
}

export const agentCoordinator = new AgentCoordinator();
