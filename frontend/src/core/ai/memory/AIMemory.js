const UID = () => Math.random().toString(36).slice(2, 9);
const MEMORY_KEY = "branpy_ai_memory";
const CONVERSATIONS_KEY = "branpy_ai_conversations";
const PREFERENCES_KEY = "branpy_ai_preferences";

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch { }
}

export class AIMemory {
  constructor(config = {}) {
    this.id = config.id || `mem_${UID()}`;
    this.maxMessagesPerSession = config.maxMessagesPerSession ?? 200;
    this.maxSessions = config.maxSessions ?? 50;
  }

  async addMessage(sessionId, message) {
    const conversations = loadJSON(CONVERSATIONS_KEY, {});
    if (!conversations[sessionId]) {
      conversations[sessionId] = {
        id: sessionId,
        created: Date.now(),
        updated: Date.now(),
        messages: [],
      };
    }

    const session = conversations[sessionId];
    session.updated = Date.now();
    session.messages.push({
      id: `msg_${UID()}`,
      timestamp: Date.now(),
      ...message,
    });

    if (session.messages.length > this.maxMessagesPerSession) {
      session.messages = session.messages.slice(-this.maxMessagesPerSession);
    }

    // Trim old sessions
    const sessionIds = Object.keys(conversations);
    if (sessionIds.length > this.maxSessions) {
      const sorted = sessionIds
        .map((id) => ({ id, updated: conversations[id].updated }))
        .sort((a, b) => b.updated - a.updated);
      const toRemove = sorted.slice(this.maxSessions);
      for (const r of toRemove) delete conversations[r.id];
    }

    saveJSON(CONVERSATIONS_KEY, conversations);
  }

  async getConversation(sessionId) {
    const conversations = loadJSON(CONVERSATIONS_KEY, {});
    return conversations[sessionId]?.messages || [];
  }

  async clearConversation(sessionId) {
    const conversations = loadJSON(CONVERSATIONS_KEY, {});
    delete conversations[sessionId];
    saveJSON(CONVERSATIONS_KEY, conversations);
  }

  async listSessions() {
    const conversations = loadJSON(CONVERSATIONS_KEY, {});
    return Object.values(conversations)
      .map((s) => ({
        id: s.id,
        created: s.created,
        updated: s.updated,
        messageCount: s.messages.length,
        preview: s.messages[s.messages.length - 1]?.content?.slice(0, 100) || "",
      }))
      .sort((a, b) => b.updated - a.updated);
  }

  async getAgentContext(agentId, sessionId) {
    const conversations = loadJSON(CONVERSATIONS_KEY, {});
    const session = conversations[sessionId];
    if (!session) return [];
    return session.messages
      .filter((m) => m.agent === agentId)
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));
  }

  async setPreference(key, value) {
    const prefs = loadJSON(PREFERENCES_KEY, {});
    prefs[key] = { value, updated: Date.now() };
    saveJSON(PREFERENCES_KEY, prefs);
  }

  async getPreference(key) {
    const prefs = loadJSON(PREFERENCES_KEY, {});
    return prefs[key]?.value;
  }

  async getAllPreferences() {
    return loadJSON(PREFERENCES_KEY, {});
  }

  async setMemory(key, data) {
    const memory = loadJSON(MEMORY_KEY, {});
    memory[key] = { data, updated: Date.now() };
    saveJSON(MEMORY_KEY, memory);
  }

  async getMemory(key) {
    const memory = loadJSON(MEMORY_KEY, {});
    return memory[key]?.data;
  }

  async getAllMemories() {
    return loadJSON(MEMORY_KEY, {});
  }

  async clearMemory(key) {
    const memory = loadJSON(MEMORY_KEY, {});
    delete memory[key];
    saveJSON(MEMORY_KEY, memory);
  }

  async clearAll() {
    localStorage.removeItem(MEMORY_KEY);
    localStorage.removeItem(CONVERSATIONS_KEY);
    localStorage.removeItem(PREFERENCES_KEY);
  }

  async getStats() {
    const conversations = loadJSON(CONVERSATIONS_KEY, {});
    const sessionCount = Object.keys(conversations).length;
    const totalMessages = Object.values(conversations).reduce(
      (acc, s) => acc + s.messages.length, 0
    );
    return { sessionCount, totalMessages };
  }
}

export const aiMemory = new AIMemory();
