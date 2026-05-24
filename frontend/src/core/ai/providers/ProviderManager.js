import { PROVIDER_PRIORITY, PROVIDER_REGISTRY, getProvider, resetProviders } from "./ProviderFactory";

const STORAGE_KEY = "branpy_provider_keys";

function loadKeys() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveKeys(keys) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(keys)); } catch {}
}

export class ProviderManager {
  constructor() {
    this.healthCache = {};
    this.retryCounts = {};
    this.timeouts = {};
    this.listeners = [];
    this._loadFromStorage();
  }

  _loadFromStorage() {
    const keys = loadKeys();
    for (const [id, cfg] of Object.entries(keys)) {
      try {
        const p = getProvider(id);
        if (cfg.apiKey) p.apiKey = cfg.apiKey;
        if (cfg.baseUrl) p.baseUrl = cfg.baseUrl;
      } catch {}
    }
  }

  getProvider(id) {
    try { return getProvider(id); } catch { return null; }
  }

  configureProvider(id, config = {}) {
    const p = this.getProvider(id);
    if (!p) return false;
    if (config.apiKey !== undefined) p.apiKey = config.apiKey;
    if (config.baseUrl !== undefined) p.baseUrl = config.baseUrl;
    const keys = loadKeys();
    keys[id] = { apiKey: p.apiKey || "", baseUrl: p.baseUrl || "" };
    saveKeys(keys);
    this._notify();
    return true;
  }

  async checkHealth(id) {
    const p = this.getProvider(id);
    if (!p) return false;
    try {
      const ok = await p.healthCheck();
      this.healthCache[id] = { ok, time: Date.now() };
      return ok;
    } catch {
      this.healthCache[id] = { ok: false, time: Date.now() };
      return false;
    }
  }

  isAvailable(id) {
    const p = this.getProvider(id);
    if (!p) return false;
    return p.isAvailable();
  }

  async checkAllHealth() {
    const results = {};
    for (const id of PROVIDER_PRIORITY) {
      results[id] = await this.checkHealth(id);
    }
    return results;
  }

  getPriority() {
    return [...PROVIDER_PRIORITY];
  }

  getRegisteredProviders() {
    return PROVIDER_PRIORITY.map((id) => {
      const p = this.getProvider(id);
      const health = this.healthCache[id];
      return {
        id,
        name: p?.getName?.() || id,
        available: p?.isAvailable?.() || false,
        healthy: health?.ok ?? null,
        lastHealthCheck: health?.time || null,
        hasKey: !!(p?.apiKey),
        requiresKey: p?.requiresKey !== false,
      };
    });
  }

  onChange(fn) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  _notify() {
    for (const fn of this.listeners) fn(this.getRegisteredProviders());
  }
}

export const providerManager = new ProviderManager();
