const UID = () => Math.random().toString(36).slice(2, 9);
const WF_KEY = "branpy_workflows";

export class WorkflowEngine {
  constructor(config = {}) {
    this.id = config.id || `wf_${UID()}`;
    this.workflows = [];
    this.running = new Map();
    this._load();
  }

  // --- Node types ---
  static NODE_TYPES = {
    CHAT: { label: "Chat", icon: "💬", color: "#3b82f6", inputs: 1, outputs: 1 },
    PROMPT: { label: "Prompt", icon: "📝", color: "#8b5cf6", inputs: 1, outputs: 1 },
    BROWSER: { label: "Browser", icon: "🌐", color: "#22c55e", inputs: 1, outputs: 1 },
    OPERATOR: { label: "Operator", icon: "⚙️", color: "#f97316", inputs: 1, outputs: 1 },
    MEMORY: { label: "Memory", icon: "🧠", color: "#ec4899", inputs: 1, outputs: 1 },
    CONDITION: { label: "Condition", icon: "🔀", color: "#f59e0b", inputs: 1, outputs: 2 },
    DELAY: { label: "Delay", icon: "⏱️", color: "#06b6d4", inputs: 1, outputs: 1 },
    HTTP: { label: "HTTP Request", icon: "📡", color: "#6366f1", inputs: 1, outputs: 1 },
    LOGIC: { label: "Logic", icon: "🧩", color: "#14b8a6", inputs: 2, outputs: 1 },
    OUTPUT: { label: "Output", icon: "📤", color: "#10b981", inputs: 1, outputs: 0 },
  };

  createWorkflow(name = "Novo workflow") {
    const wf = {
      id: `wf_${UID()}`, name, description: "", created: Date.now(), updated: Date.now(),
      nodes: [], connections: [], variables: {}, status: "draft", runCount: 0,
    };
    this.workflows.push(wf);
    this._save();
    return wf;
  }

  addNode(workflowId, nodeType, position = { x: 100, y: 100 }, config = {}) {
    const wf = this.workflows.find((w) => w.id === workflowId);
    if (!wf) throw new Error("Workflow not found");
    const node = {
      id: `node_${UID()}`, type: nodeType, position, config,
      label: WorkflowEngine.NODE_TYPES[nodeType]?.label || nodeType,
      ...config,
    };
    wf.nodes.push(node);
    wf.updated = Date.now();
    this._save();
    return node;
  }

  removeNode(workflowId, nodeId) {
    const wf = this.workflows.find((w) => w.id === workflowId);
    if (!wf) return;
    wf.nodes = wf.nodes.filter((n) => n.id !== nodeId);
    wf.connections = wf.connections.filter((c) => c.from !== nodeId && c.to !== nodeId);
    wf.updated = Date.now();
    this._save();
  }

  connectNodes(workflowId, fromNode, fromPort, toNode, toPort) {
    const wf = this.workflows.find((w) => w.id === workflowId);
    if (!wf) throw new Error("Workflow not found");
    wf.connections.push({ id: `conn_${UID()}`, from: fromNode, fromPort: fromPort || 0, to: toNode, toPort: toPort || 0 });
    wf.updated = Date.now();
    this._save();
  }

  removeConnection(workflowId, connId) {
    const wf = this.workflows.find((w) => w.id === workflowId);
    if (!wf) return;
    wf.connections = wf.connections.filter((c) => c.id !== connId);
    wf.updated = Date.now();
    this._save();
  }

  updateNodeConfig(workflowId, nodeId, config) {
    const wf = this.workflows.find((w) => w.id === workflowId);
    if (!wf) return;
    const node = wf.nodes.find((n) => n.id === nodeId);
    if (node) Object.assign(node.config, config);
    wf.updated = Date.now();
    this._save();
  }

  // --- Execution ---
  async execute(workflowId, inputs = {}) {
    const wf = this.workflows.find((w) => w.id === workflowId);
    if (!wf) throw new Error("Workflow not found");

    const runId = `run_${UID()}`;
    wf.status = "running";
    wf.runCount++;
    this.running.set(runId, { workflowId, startTime: Date.now(), nodeResults: {}, aborted: false, inputs });
    this._save();

    try {
      const result = await this._executeNodes(wf, runId, inputs);
      wf.status = "completed";
      this.running.set(runId, { ...this.running.get(runId), status: "completed", result, endTime: Date.now() });
      this._save();
      return result;
    } catch (err) {
      wf.status = "failed";
      this.running.set(runId, { ...this.running.get(runId), status: "failed", error: err.message, endTime: Date.now() });
      this._save();
      throw err;
    }
  }

  async _executeNodes(wf, runId, inputs) {
    const run = this.running.get(runId);
    if (!run || run.aborted) throw new Error("Aborted");

    const startNodes = wf.nodes.filter((n) => !wf.connections.some((c) => c.to === n.id));
    const results = {};

    for (const node of startNodes) {
      results[node.id] = await this._executeNode(wf, node, runId, inputs, results);
    }

    return results;
  }

  async _executeNode(wf, node, runId, inputs, results) {
    const run = this.running.get(runId);
    if (!run || run.aborted) throw new Error("Aborted");

    const nodeInput = { ...inputs, ...run.nodeResults };
    let output;

    switch (node.type) {
      case "CHAT": {
        const prompt = this._interpolate(node.config.prompt || "", nodeInput);
        const { aiRouter } = await import("../router/AIRouter");
        const res = await aiRouter.chat(prompt, { providerPriority: ["branpy-demo"] });
        output = res.content;
        break;
      }
      case "PROMPT": {
        output = this._interpolate(node.config.template || "", nodeInput);
        break;
      }
      case "BROWSER": {
        const { browserEngine } = await import("../browser/BrowserEngine");
        if (node.config.action === "search") output = await browserEngine.search(node.config.query || "");
        else output = await browserEngine.fetchPage(node.config.url || "");
        break;
      }
      case "OPERATOR": {
        const { operatorEngine } = await import("../operator/OperatorEngine");
        output = await operatorEngine.execute(node.config.action || "navigate", node.config.params || {});
        break;
      }
      case "MEMORY": {
        const { aiMemory } = await import("../memory/AIMemory");
        if (node.config.action === "get") output = await aiMemory.getMemory(node.config.key || "");
        else if (node.config.action === "set") { await aiMemory.setMemory(node.config.key || "", node.config.value || ""); output = "saved"; }
        else output = await aiMemory.searchConversations(node.config.query || "");
        break;
      }
      case "CONDITION": {
        const value = this._interpolate(node.config.value || "", nodeInput);
        const condition = node.config.condition || "equals";
        const compare = node.config.compare || "";
        output = condition === "equals" ? value === compare : condition === "contains" ? value.includes(compare) : condition === "exists" ? !!value : false;
        break;
      }
      case "DELAY":
        await new Promise((r) => setTimeout(r, node.config.ms || 1000));
        output = `delayed ${node.config.ms || 1000}ms`;
        break;
      case "HTTP": {
        try {
          const res = await fetch(node.config.url || "", {
            method: node.config.method || "GET",
            headers: { "Content-Type": "application/json", ...(node.config.headers || {}) },
            body: node.config.body ? JSON.stringify(node.config.body) : undefined,
            signal: AbortSignal.timeout(10000),
          });
          output = await res.text();
        } catch (e) { output = `HTTP error: ${e.message}`; }
        break;
      }
      case "LOGIC":
        output = nodeInput;
        break;
      case "OUTPUT":
        output = this._interpolate(node.config.template || "{{input}}", nodeInput);
        break;
      default:
        output = `Unknown node type: ${node.type}`;
    }

    run.nodeResults[node.id] = output;
    this.running.set(runId, run);

    // Execute connected nodes
    const outputs = wf.connections.filter((c) => c.from === node.id);
    for (const conn of outputs) {
      // For condition nodes, check the output
      if (node.type === "CONDITION") {
        if (conn.fromPort === 0 && !output) continue;
        if (conn.fromPort === 1 && output) continue;
      }
      const nextNode = wf.nodes.find((n) => n.id === conn.to);
      if (nextNode && !run.nodeResults[nextNode.id]) {
        await this._executeNode(wf, nextNode, runId, inputs, results);
      }
    }

    return output;
  }

  abort(runId) {
    const run = this.running.get(runId);
    if (run) {
      run.aborted = true;
      this.running.set(runId, run);
    }
  }

  getWorkflow(workflowId) {
    return this.workflows.find((w) => w.id === workflowId) || null;
  }

  listWorkflows() {
    return this.workflows.map((w) => ({
      id: w.id, name: w.name, description: w.description, created: w.created, updated: w.updated,
      nodeCount: w.nodes.length, status: w.status, runCount: w.runCount,
    }));
  }

  deleteWorkflow(workflowId) {
    this.workflows = this.workflows.filter((w) => w.id !== workflowId);
    this._save();
  }

  getRunStatus(runId) {
    return this.running.get(runId) || null;
  }

  _interpolate(template, variables) {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      const val = variables[key];
      return val !== undefined ? String(val) : `{{${key}}}`;
    });
  }

  _save() {
    try { localStorage.setItem(WF_KEY, JSON.stringify(this.workflows)); } catch {}
  }

  _load() {
    try { const d = localStorage.getItem(WF_KEY); if (d) this.workflows = JSON.parse(d); } catch {}
  }
}

export const workflowEngine = new WorkflowEngine();
