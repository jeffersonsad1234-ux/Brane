const UID = () => Math.random().toString(36).slice(2, 9);
const MEMORY_KEY = "branpy_ai_memory";
const CONVERSATIONS_KEY = "branpy_ai_conversations";
const PREFERENCES_KEY = "branpy_ai_preferences";
const PROFILE_KEY = "branpy_user_profile";
const PROJECTS_KEY = "branpy_projects";

function loadJSON(key, fallback) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}
function saveJSON(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {} }

export class AIMemory {
  constructor(config = {}) {
    this.id = config.id || `mem_${UID()}`;
    this.maxMessagesPerSession = config.maxMessagesPerSession ?? 200;
    this.maxSessions = config.maxSessions ?? 50;
  }

  // --- Conversation Memory ---
  async addMessage(sessionId, message) {
    const conversations = loadJSON(CONVERSATIONS_KEY, {});
    if (!conversations[sessionId]) {
      conversations[sessionId] = { id: sessionId, created: Date.now(), updated: Date.now(), messages: [], metadata: {} };
    }
    const session = conversations[sessionId];
    session.updated = Date.now();
    session.messages.push({ id: `msg_${UID()}`, timestamp: Date.now(), ...message });
    if (session.messages.length > this.maxMessagesPerSession) session.messages = session.messages.slice(-this.maxMessagesPerSession);

    const sessionIds = Object.keys(conversations);
    if (sessionIds.length > this.maxSessions) {
      const sorted = sessionIds.map((id) => ({ id, updated: conversations[id].updated })).sort((a, b) => b.updated - a.updated);
      for (const r of sorted.slice(this.maxSessions)) delete conversations[r.id];
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
    return Object.values(conversations).map((s) => ({
      id: s.id, created: s.created, updated: s.updated, messageCount: s.messages.length,
      preview: s.messages[s.messages.length - 1]?.content?.slice(0, 100) || "",
      metadata: s.metadata || {},
    })).sort((a, b) => b.updated - a.updated);
  }

  async updateSessionMetadata(sessionId, metadata) {
    const conversations = loadJSON(CONVERSATIONS_KEY, {});
    if (conversations[sessionId]) {
      conversations[sessionId].metadata = { ...conversations[sessionId].metadata, ...metadata };
      saveJSON(CONVERSATIONS_KEY, conversations);
    }
  }

  async searchConversations(query) {
    const q = query.toLowerCase();
    const conversations = loadJSON(CONVERSATIONS_KEY, {});
    const results = [];
    for (const [id, session] of Object.entries(conversations)) {
      for (const msg of session.messages) {
        if (msg.content?.toLowerCase().includes(q)) {
          results.push({ sessionId: id, messageId: msg.id, content: msg.content.slice(0, 200), role: msg.role, timestamp: msg.timestamp });
        }
      }
    }
    return results.slice(0, 50);
  }

  async getAgentContext(agentId, sessionId) {
    const conversations = loadJSON(CONVERSATIONS_KEY, {});
    const session = conversations[sessionId];
    if (!session) return [];
    return session.messages.filter((m) => m.agent === agentId).slice(-10).map((m) => ({ role: m.role, content: m.content }));
  }

  // --- User Profile ---
  async getProfile() {
    return loadJSON(PROFILE_KEY, { name: "", email: "", niche: "", skills: [], goals: [], preferences: { language: "pt-BR", tone: "professional", responseStyle: "detailed" } });
  }

  async updateProfile(updates) {
    const profile = await this.getProfile();
    Object.assign(profile, updates);
    saveJSON(PROFILE_KEY, profile);
    return profile;
  }

  // --- Projects ---
  async listProjects() {
    return loadJSON(PROJECTS_KEY, []);
  }

  async getProject(projectId) {
    const projects = await this.listProjects();
    return projects.find((p) => p.id === projectId) || null;
  }

  async saveProject(project) {
    const projects = await this.listProjects();
    const idx = projects.findIndex((p) => p.id === project.id);
    if (idx >= 0) projects[idx] = { ...projects[idx], ...project, updated: Date.now() };
    else projects.push({ id: `proj_${UID()}`, created: Date.now(), updated: Date.now(), ...project });
    saveJSON(PROJECTS_KEY, projects);
    return project;
  }

  async deleteProject(projectId) {
    const projects = await this.listProjects();
    saveJSON(PROJECTS_KEY, projects.filter((p) => p.id !== projectId));
  }

  // --- Key-Value Memory ---
  async setMemory(key, data) {
    const memory = loadJSON(MEMORY_KEY, {});
    memory[key] = { data, updated: Date.now() };
    saveJSON(MEMORY_KEY, memory);
  }

  async getMemory(key) {
    const memory = loadJSON(MEMORY_KEY, {});
    return memory[key]?.data;
  }

  async getAllMemories() { return loadJSON(MEMORY_KEY, {}); }
  async clearMemory(key) {
    const memory = loadJSON(MEMORY_KEY, {});
    delete memory[key];
    saveJSON(MEMORY_KEY, memory);
  }

  // --- Preferences ---
  async setPreference(key, value) {
    const prefs = loadJSON(PREFERENCES_KEY, {});
    prefs[key] = { value, updated: Date.now() };
    saveJSON(PREFERENCES_KEY, prefs);
  }

  async getPreference(key) {
    const prefs = loadJSON(PREFERENCES_KEY, {});
    return prefs[key]?.value;
  }

  async getAllPreferences() { return loadJSON(PREFERENCES_KEY, {}); }

  // --- Utility ---
  async getStats() {
    const conversations = loadJSON(CONVERSATIONS_KEY, {});
    return {
      sessionCount: Object.keys(conversations).length,
      totalMessages: Object.values(conversations).reduce((acc, s) => acc + s.messages.length, 0),
      projectCount: (await this.listProjects()).length,
    };
  }

  async clearAll() {
    [MEMORY_KEY, CONVERSATIONS_KEY, PREFERENCES_KEY, PROFILE_KEY, PROJECTS_KEY].forEach((k) => localStorage.removeItem(k));
  }
}

export const aiMemory = new AIMemory();
