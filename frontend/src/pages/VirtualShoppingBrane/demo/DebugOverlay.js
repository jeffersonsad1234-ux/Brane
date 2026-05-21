export default class DebugOverlay {
  constructor() {
    this.el = document.createElement("div");
    this.el.style.cssText = `
      position: fixed; top: 8px; left: 8px; z-index: 99999;
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 11px; line-height: 1.6;
      color: #88ff88; background: rgba(0,0,0,0.7);
      padding: 8px 12px; border-radius: 8px;
      pointer-events: none; min-width: 180px;
      border: 1px solid rgba(136,255,136,0.15);
    `;
    document.body.appendChild(this.el);
    this.frames = 0;
    this.lastFpsTime = 0;
    this.fps = 0;
    this.lines = {};
  }

  set(key, value) {
    this.lines[key] = value;
  }

  update(now) {
    this.frames++;
    if (now - this.lastFpsTime >= 1000) {
      this.fps = this.frames;
      this.frames = 0;
      this.lastFpsTime = now;
    }
    this.lines["FPS"] = this.fps;
    let html = "";
    for (const [k, v] of Object.entries(this.lines)) {
      html += `<span style="color:#88ff88">${k}</span> ${v}\n`;
    }
    this.el.innerHTML = html;
  }

  dispose() {
    if (this.el.parentNode) this.el.parentNode.removeChild(this.el);
  }
}
