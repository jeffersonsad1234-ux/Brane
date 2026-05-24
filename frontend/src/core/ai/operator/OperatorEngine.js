const UID = () => Math.random().toString(36).slice(2, 9);

export class OperatorEngine {
  constructor(config = {}) {
    this.id = config.id || `op_${UID()}`;
    this.sessions = [];
    this.activeSessionId = null;
    this.actionLog = [];
    this.recording = false;
    this.recordedSteps = [];
  }

  get activeSession() {
    return this.sessions.find((s) => s.id === this.activeSessionId) || null;
  }

  createSession(name = "Nova sessão") {
    const session = {
      id: `sess_${UID()}`, name, created: Date.now(), updated: Date.now(),
      actions: [], status: "idle", result: null, error: null,
    };
    this.sessions.push(session);
    this.activeSessionId = session.id;
    this._saveState();
    return session;
  }

  async execute(action, params = {}) {
    const actionId = `act_${UID()}`;
    const startTime = Date.now();

    this.log("execute", action, params, "running");

    try {
      let result;
      switch (action) {
        case "navigate":
          result = await this._navigate(params.url);
          break;
        case "click":
          result = await this._click(params.selector, params.url);
          break;
        case "type":
          result = await this._type(params.selector, params.text);
          break;
        case "extract":
          result = await this._extract(params.selector, params.url);
          break;
        case "extractAll":
          result = await this._extractAll(params.selector, params.url);
          break;
        case "wait":
          result = await this._wait(params.ms || 1000);
          break;
        case "scroll":
          result = this._scroll(params.x || 0, params.y || 0);
          break;
        case "search":
          result = await this._search(params.query);
          break;
        case "fetch":
          result = await this._fetch(params.url);
          break;
        case "read":
          const { browserEngine } = await import("../browser/BrowserEngine");
          result = await browserEngine.extractContent(params.url || params.selector);
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      const elapsed = Date.now() - startTime;
      this.log(action, params, "success", { result, elapsed });

      if (this.activeSession) {
        this.activeSession.actions.push({ id: actionId, action, params, status: "success", result, elapsed, timestamp: Date.now() });
        this.activeSession.updated = Date.now();
      }

      if (this.recording) this.recordedSteps.push({ action, params, timestamp: Date.now() });

      return { success: true, actionId, result, elapsed };
    } catch (err) {
      const elapsed = Date.now() - startTime;
      this.log(action, params, "error", { error: err.message, elapsed });

      if (this.activeSession) {
        this.activeSession.actions.push({ id: actionId, action, params, status: "error", error: err.message, elapsed, timestamp: Date.now() });
        this.activeSession.updated = Date.now();
        this.activeSession.error = err.message;
      }

      return { success: false, actionId, error: err.message, elapsed };
    } finally {
      this._saveState();
    }
  }

  async executeSequence(sequence) {
    const results = [];
    const session = this.createSession(`Sequência ${Date.now()}`);
    session.status = "running";

    for (const step of sequence) {
      const result = await this.execute(step.action, step.params);
      results.push(result);
      if (!result.success && step.required !== false) break;
    }

    session.status = results.every((r) => r.success) ? "completed" : "failed";
    session.result = results;
    this._saveState();
    return { sessionId: session.id, results };
  }

  startRecording() {
    this.recording = true;
    this.recordedSteps = [];
  }

  stopRecording() {
    this.recording = false;
    const steps = [...this.recordedSteps];
    this.recordedSteps = [];
    return steps;
  }

  async _navigate(url) {
    const { browserEngine } = await import("../browser/BrowserEngine");
    if (!browserEngine.activeTab) browserEngine.createTab();
    const result = await browserEngine.navigate(url);
    return { url, title: result.title, status: "loaded" };
  }

  async _click(selector, url) {
    return { action: "click", selector, status: "simulated" };
  }

  async _type(selector, text) {
    return { action: "type", selector, status: "simulated", chars: text.length };
  }

  async _extract(selector, url) {
    const { browserEngine } = await import("../browser/BrowserEngine");
    const page = url ? await browserEngine.fetchPage(url) : browserEngine.activeTab?.content ? { text: browserEngine.activeTab.content } : null;
    if (!page) throw new Error("No content to extract");
    if (selector === "article" || selector === "content") {
      const paragraphs = page.text.split("\n\n").filter((p) => p.trim().length > 50);
      return { extracted: paragraphs.slice(0, 20).join("\n\n"), count: paragraphs.length };
    }
    if (selector === "links") return browserEngine._extractLinks(page.text || "", url || "");
    if (selector === "images") return browserEngine._extractImages(page.text || "", url || "");
    return { extracted: page.text?.slice(0, 2000) || "", note: "full text" };
  }

  async _extractAll(selector, url) {
    return this._extract(selector, url);
  }

  async _wait(ms) {
    await new Promise((r) => setTimeout(r, ms));
    return { waited: ms };
  }

  _scroll(x, y) {
    return { x, y, status: "scrolled" };
  }

  async _search(query) {
    const { browserEngine } = await import("../browser/BrowserEngine");
    return browserEngine.search(query);
  }

  async _fetch(url) {
    const { browserEngine } = await import("../browser/BrowserEngine");
    return browserEngine.fetchPage(url);
  }

  log(action, params, status, details = {}) {
    this.actionLog.push({ action, params, status, timestamp: Date.now(), ...details });
    if (this.actionLog.length > 500) this.actionLog = this.actionLog.slice(-500);
  }

  getLogs(sessionId) {
    if (sessionId) {
      const session = this.sessions.find((s) => s.id === sessionId);
      return session?.actions || [];
    }
    return this.actionLog;
  }

  clearLogs() {
    this.actionLog = [];
  }

  replay(sequence) {
    return this.executeSequence(sequence);
  }

  _saveState() {
    try {
      localStorage.setItem(`branpy_operator_logs`, JSON.stringify(this.actionLog.slice(-100)));
      localStorage.setItem(`branpy_operator_sessions`, JSON.stringify(this.sessions.slice(-20).map((s) => ({ id: s.id, name: s.name, created: s.created, status: s.status, actionCount: s.actions.length }))));
    } catch {}
  }
}

export const operatorEngine = new OperatorEngine();
