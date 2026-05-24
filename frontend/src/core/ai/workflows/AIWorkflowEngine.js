const UID = () => Math.random().toString(36).slice(2, 9);

export class AIWorkflowEngine {
  constructor(config = {}) {
    this.id = config.id || `wf_${UID()}`;
    this.workflows = new Map();
    this.running = new Map();
    this.history = [];
  }

  define(workflow) {
    const id = workflow.id || `wf_${UID()}`;
    const wf = {
      id,
      name: workflow.name || "Workflow",
      description: workflow.description || "",
      steps: workflow.steps || [],
      created: Date.now(),
      updated: Date.now(),
    };
    this.workflows.set(id, wf);
    return id;
  }

  get(id) {
    return this.workflows.get(id) || null;
  }

  list() {
    return Array.from(this.workflows.values());
  }

  remove(id) {
    return this.workflows.delete(id);
  }

  async execute(id, context = {}) {
    const wf = this.workflows.get(id);
    if (!wf) throw new Error(`Workflow not found: ${id}`);

    const executionId = `exec_${UID()}`;
    this.running.set(executionId, { id: executionId, workflowId: id, status: "running", startedAt: Date.now(), context });

    const results = [];
    let currentContext = { ...context };

    try {
      for (let i = 0; i < wf.steps.length; i++) {
        const step = wf.steps[i];
        const stepResult = await this.executeStep(step, currentContext, executionId);
        results.push({ step: i, action: step.action, result: stepResult });
        currentContext = { ...currentContext, ...stepResult };
      }

      this.running.set(executionId, { ...this.running.get(executionId), status: "success", completedAt: Date.now(), results });
      this.history.push({ executionId, workflowId: id, status: "success", steps: wf.steps.length });
      return { executionId, status: "success", results };
    } catch (err) {
      this.running.set(executionId, { ...this.running.get(executionId), status: "error", error: err.message, results });
      this.history.push({ executionId, workflowId: id, status: "error", error: err.message });
      return { executionId, status: "error", error: err.message, results };
    }
  }

  async executeStep(step, context, executionId) {
    switch (step.type) {
      case "agent":
        return this.executeAgentStep(step, context);
      case "tool":
        return this.executeToolStep(step, context);
      case "condition":
        return this.executeConditionStep(step, context);
      case "delay":
        return this.executeDelayStep(step);
      case "code":
        return this.executeCodeStep(step, context);
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  async executeAgentStep(step, context) {
    const { aiRouter } = await import("../router/AIRouter");
    const result = await aiRouter.chat(step.prompt || "", {
      agent: step.agentId ? (await import("../agents/AgentRegistry")).getAgent(step.agentId) : undefined,
    });
    return { response: result.content };
  }

  async executeToolStep(step, context) {
    const { getTool } = await import("../tools/index");
    const tool = getTool(step.tool);
    if (!tool) throw new Error(`Tool not found: ${step.tool}`);
    return await tool.execute({ ...step.params, ...context });
  }

  async executeConditionStep(step, context) {
    const { condition, ifTrue, ifFalse } = step;
    const result = !!context[condition];
    return { condition, result, branch: result ? "ifTrue" : "ifFalse" };
  }

  async executeDelayStep(step) {
    await new Promise((r) => setTimeout(r, step.ms || 1000));
    return { delayed: step.ms || 1000 };
  }

  async executeCodeStep(step, context) {
    try {
      const fn = new Function("context", step.code);
      return fn(context);
    } catch (err) {
      throw new Error(`Code step failed: ${err.message}`);
    }
  }

  getExecution(id) {
    return this.running.get(id) || null;
  }

  getHistory() {
    return this.history;
  }
}

export const aiWorkflowEngine = new AIWorkflowEngine();
