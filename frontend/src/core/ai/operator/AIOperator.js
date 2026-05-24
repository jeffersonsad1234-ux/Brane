const UID = () => Math.random().toString(36).slice(2, 9);

export class AIOperator {
  constructor(config = {}) {
    this.id = config.id || `op_${UID()}`;
    this.actions = [];
    this.history = [];
    this.running = false;
  }

  async execute(action, params = {}) {
    const actionId = `act_${UID()}`;
    const startTime = Date.now();

    this.running = true;
    this.record({ id: actionId, action, params, status: "running", timestamp: startTime });

    try {
      const result = await this.runAction(action, params);
      const elapsed = Date.now() - startTime;
      this.record({ id: actionId, action, params, status: "success", result, elapsed });
      return { success: true, actionId, result, elapsed };
    } catch (err) {
      const elapsed = Date.now() - startTime;
      this.record({ id: actionId, action, params, status: "error", error: err.message, elapsed });
      return { success: false, actionId, error: err.message, elapsed };
    } finally {
      this.running = false;
    }
  }

  async runAction(action, params) {
    switch (action) {
      case "navigate":
        return this.navigate(params.url);
      case "click":
        return this.click(params.selector);
      case "type":
        return this.type(params.selector, params.text);
      case "extract":
        return this.extract(params.selector);
      case "wait":
        return this.wait(params.ms || 1000);
      case "scroll":
        return this.scroll(params.x || 0, params.y || 0);
      case "evaluate":
        return this.evaluate(params.code);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  async navigate(url) {
    return { action: "navigate", url, status: "simulated" };
  }

  async click(selector) {
    return { action: "click", selector, status: "simulated" };
  }

  async type(selector, text) {
    return { action: "type", selector, text, status: "simulated" };
  }

  async extract(selector) {
    return { action: "extract", selector, status: "simulated", data: [] };
  }

  async wait(ms) {
    await new Promise((r) => setTimeout(r, ms));
    return { action: "wait", ms, status: "completed" };
  }

  async scroll(x, y) {
    return { action: "scroll", x, y, status: "simulated" };
  }

  async evaluate(code) {
    return { action: "evaluate", result: "[sandboxed]", status: "simulated" };
  }

  record(entry) {
    this.history.push(entry);
    if (this.history.length > 100) this.history = this.history.slice(-100);
  }

  getHistory() {
    return this.history;
  }

  getStatus() {
    return { running: this.running, totalActions: this.history.length };
  }
}

export const aiOperator = new AIOperator();
