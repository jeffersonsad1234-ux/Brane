require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const fs = require("fs");
const path = require("path");
const { exec, execSync } = require("child_process");
const crypto = require("crypto");
const initSqlJs = require("sql.js");

const app = express();
const PORT = process.env.PORT || 3200;
const PROJECT_ROOT = process.env.PROJECT_ROOT || path.resolve(__dirname, "..");
const AGENT_PASSWORD = process.env.AGENT_PASSWORD || "admin123";

// ── Provider / Model config ──
const AI_PROVIDER = process.env.AI_PROVIDER || "openrouter";
const AI_MODEL = process.env.AI_MODEL || "deepseek/deepseek-chat";
const LOCAL_MODEL_URL = process.env.LOCAL_MODEL_URL || "http://localhost:11434/api/generate";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const MODEL_DEFS = {
  "deepseek/deepseek-chat":      { provider: "openrouter", label: "DeepSeek Chat",      mode: "cheap",   cost: "barato" },
  "openai/gpt-4o-mini":          { provider: "openrouter", label: "GPT-4o Mini",        mode: "cheap",   cost: "barato" },
  "google/gemini-flash-1.5":     { provider: "openrouter", label: "Gemini Flash 1.5",   mode: "fast",    cost: "barato" },
};

function getModelDef(model) {
  return MODEL_DEFS[model] || { provider: AI_PROVIDER, label: model, mode: "custom", cost: "?" };
}

// ── callAI: unifica OpenRouter / OpenAI / Ollama ──
async function callAI(messages, options = {}) {
  const provider = options.provider || AI_PROVIDER;
  const model = options.model || AI_MODEL;
  const systemMsg = options.system || "You are Brane Agent, a senior software engineer.";
  const jsonMode = options.json || false;
  const maxTokens = options.maxTokens || 8192;

  if (provider === "openrouter") {
    const key = options.apiKey || OPENROUTER_API_KEY;
    if (!key) throw new Error("OPENROUTER_API_KEY not configured");
    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`,
        "HTTP-Referer": "https://branded.page.br",
        "X-Title": "Brane Agent"
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: systemMsg }, ...messages],
        max_tokens: maxTokens,
        ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
      })
    });
    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      throw new Error(`OpenRouter ${resp.status}: ${errText.slice(0, 200)}`);
    }
    const data = await resp.json();
    if (!data.choices?.[0]?.message?.content) throw new Error("OpenRouter: empty response");
    return data.choices[0].message.content;
  }

  if (provider === "openai") {
    const key = options.apiKey || process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY not configured");
    const OpenAI = require("openai");
    const openai = new OpenAI({ apiKey: key });
    const completion = await openai.chat.completions.create({
      model,
      messages: [{ role: "system", content: systemMsg }, ...messages],
      max_tokens: maxTokens,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    });
    if (!completion.choices?.[0]?.message?.content) throw new Error("OpenAI: empty response");
    return completion.choices[0].message.content;
  }

  if (provider === "ollama") {
    const url = options.localUrl || LOCAL_MODEL_URL;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt: `${systemMsg}\n\n${messages.map(m => `${m.role}: ${m.content}`).join("\n")}`,
        stream: false,
        options: { num_predict: maxTokens }
      })
    });
    if (!resp.ok) throw new Error(`Ollama ${resp.status}`);
    const data = await resp.json();
    return data.response || data.content || "(no response)";
  }

  throw new Error(`Unknown provider: ${provider}. Use: openrouter, openai, or ollama`);
}

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: ["http://localhost:3000", "http://localhost:3001", "https://branded.page.br", "https://www.branded.page.br"], credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));
app.use(rateLimit({ windowMs: 60 * 1000, max: 300 }));

// ── Health check ──
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ── Database ──
let db;
async function initDb() {
  try {
    const SQL = await initSqlJs();
    const dbPath = path.join(__dirname, "agent.db");
    let buf;
    if (fs.existsSync(dbPath)) buf = fs.readFileSync(dbPath);
    db = new SQL.Database(buf);
    db.run("CREATE TABLE IF NOT EXISTS conversations (id TEXT PRIMARY KEY, project TEXT, messages TEXT, created_at TEXT, updated_at TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, project TEXT, type TEXT, status TEXT, progress INTEGER, message TEXT, result TEXT, created_at TEXT, updated_at TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, name TEXT, root TEXT, rules TEXT, created_at TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS memory (id TEXT PRIMARY KEY, project TEXT, key TEXT, value TEXT, created_at TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS backups (id TEXT PRIMARY KEY, file_path TEXT, backup_path TEXT, created_at TEXT)");
    if (!buf) saveDb();
    const existing = db.exec("SELECT id FROM projects");
    if (existing.length === 0) {
      const ts = new Date().toISOString();
      db.run("INSERT INTO projects VALUES (?,?,?,?,?)", [crypto.randomUUID(), "Brane (main)", PROJECT_ROOT, "", ts]);
      db.run("INSERT INTO projects VALUES (?,?,?,?,?)", [crypto.randomUUID(), "Jogo Survival", path.join(PROJECT_ROOT, "frontend", "src", "pages", "VirtualShoppingBrane"), "", ts]);
      db.run("INSERT INTO projects VALUES (?,?,?,?,?)", [crypto.randomUUID(), "Brane Agent", __dirname, "", ts]);
      saveDb();
    }
    console.log("Database initialized");
  } catch (e) {
    console.error("DB init error:", e.message);
  }
}
function saveDb() {
  try {
    const data = db.export();
    const buf = Buffer.from(data);
    fs.writeFileSync(path.join(__dirname, "agent.db"), buf);
  } catch (e) { console.error("saveDb error:", e.message); }
}
function q(sql, params) {
  const stmt = db.prepare(sql);
  if (params) stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}
function qr(sql, params) {
  db.run(sql, params);
  saveDb();
}

// ── Auth ──
function auth(req, res, next) {
  if (req.headers["x-agent-password"] !== AGENT_PASSWORD) return res.status(401).json({ error: "Unauthorized" });
  next();
}
function safePath(base, p) {
  const resolved = path.resolve(base, p || "");
  const norm = path.normalize(base);
  if (!resolved.startsWith(norm)) throw new Error("Path outside project");
  return resolved;
}

// ── Stack detection ──
function detectStack(root) {
  const info = { frameworks: [], hasReact: false, hasNode: false, hasThree: false, hasPython: false, port: null, buildCmd: null, startCmd: null };
  const pkgPath = path.join(root, "package.json");
  const reqPath = path.join(root, "requirements.txt");
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      info.hasNode = true;
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps.react || deps["react-dom"]) { info.hasReact = true; info.frameworks.push("React"); }
      if (deps.three) { info.hasThree = true; info.frameworks.push("Three.js"); }
      if (deps.next) info.frameworks.push("Next.js");
      if (deps.express) info.frameworks.push("Express");
      if (deps.vue) info.frameworks.push("Vue");
      if (deps.axios) info.frameworks.push("Axios");
      if (deps.electron) info.frameworks.push("Electron");
      if (pkg.scripts?.build) info.buildCmd = pkg.scripts.build;
      if (pkg.scripts?.start) info.startCmd = pkg.scripts.start;
      info.port = pkg.port || 3000;
    } catch (e) {}
  }
  if (fs.existsSync(reqPath)) { info.hasPython = true; info.frameworks.push("Python"); }
  const frontendPkg = path.join(root, "frontend", "package.json");
  if (fs.existsSync(frontendPkg)) {
    try {
      const fpkg = JSON.parse(fs.readFileSync(frontendPkg, "utf-8"));
      const deps = { ...fpkg.dependencies, ...fpkg.devDependencies };
      if (deps.react || deps["react-dom"]) info.frameworks.push("React (frontend)");
      if (deps.three) info.frameworks.push("Three.js (frontend)");
      if (fpkg.scripts?.build) info.buildCmd = fpkg.scripts.build;
    } catch (e) {}
  }
  return info;
}

// ── Structure summary ──
function summarizeStructure(root, depth = 2) {
  const items = [];
  function scan(p, d) {
    if (d > depth) return;
    let entries;
    try { entries = fs.readdirSync(p); } catch (e) { return; }
    for (const e of entries) {
      if (e.startsWith(".") || e === "node_modules" || e === "__pycache__" || e === ".git") continue;
      const full = path.join(p, e);
      try {
        const stat = fs.statSync(full);
        items.push({ name: e, type: stat.isDirectory() ? "dir" : "file", depth: d });
        if (stat.isDirectory()) scan(full, d + 1);
      } catch (e) {}
    }
  }
  scan(root, 0);
  return items;
}

// ── Search files by content ──
function searchFiles(root, query, maxResults = 20) {
  const exts = [".js",".jsx",".ts",".tsx",".json",".css",".html",".md",".yml",".yaml",".py",".rb",".java",".c",".cpp",".h",".hpp",".env",".txt",".xml",".svg",".sh",".bat",".toml",".cfg",".ini",".vue",".svelte",".php",".sql",".yaml",".mjs",".cjs"];
  const results = [], q = query.toLowerCase();
  function scan(p) {
    if (results.length >= maxResults) return;
    try {
      const stat = fs.statSync(p);
      if (stat.isDirectory()) {
        const n = path.basename(p);
        if (n.startsWith(".") || n === "node_modules" || n === "__pycache__" || n === ".git" || n === "backups") return;
        for (const e of fs.readdirSync(p)) scan(path.join(p, e));
      } else if (stat.isFile()) {
        if (!exts.includes(path.extname(p).toLowerCase())) return;
        const content = fs.readFileSync(p, "utf-8");
        if (content.toLowerCase().includes(q)) {
          results.push({ path: p, size: stat.size, snippet: content.slice(0, 200).replace(/\n/g, " ") });
        }
      }
    } catch (e) {}
  }
  scan(root);
  return results.slice(0, maxResults);
}

// ── Login ──
app.post("/api/login", (req, res) => {
  if (req.body.password === AGENT_PASSWORD) return res.json({ ok: true });
  res.status(401).json({ error: "Invalid password" });
});

// ── Models ──
app.get("/api/models", auth, (req, res) => {
  const grouped = {};
  for (const [id, def] of Object.entries(MODEL_DEFS)) {
    if (!grouped[def.mode]) grouped[def.mode] = [];
    grouped[def.mode].push({ id, ...def });
  }
  res.json({
    current: { provider: AI_PROVIDER, model: AI_MODEL, def: getModelDef(AI_MODEL) },
    available: MODEL_DEFS,
    grouped,
    env: {
      hasOpenRouter: !!OPENROUTER_API_KEY,
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasOllama: true,
    }
  });
});

// ── Projects ──
app.get("/api/projects", auth, (req, res) => {
  res.json(q("SELECT * FROM projects ORDER BY created_at"));
});
app.post("/api/projects", auth, (req, res) => {
  const { name, root, rules } = req.body;
  const id = crypto.randomUUID();
  qr("INSERT INTO projects VALUES (?,?,?,?,?)", [id, name, root, rules || "", new Date().toISOString()]);
  res.json({ id });
});
app.put("/api/projects/:id", auth, (req, res) => {
  const { name, root, rules } = req.body;
  qr("UPDATE projects SET name=?, root=?, rules=? WHERE id=?", [name, root, rules, req.params.id]);
  res.json({ ok: true });
});
app.delete("/api/projects/:id", auth, (req, res) => {
  qr("DELETE FROM projects WHERE id=?", [req.params.id]);
  res.json({ ok: true });
});
app.get("/api/projects/:id/analyze", auth, (req, res) => {
  const proj = q("SELECT * FROM projects WHERE id=?", [req.params.id]);
  if (!proj.length) return res.status(404).json({ error: "Not found" });
  const root = proj[0].root;
  if (!fs.existsSync(root)) return res.json({ error: "Root not found", stack: {}, structure: [] });
  const stack = detectStack(root);
  const structure = summarizeStructure(root, 2);
  res.json({ stack, structure, name: proj[0].name, root });
});

// ── File search ──
app.get("/api/search", auth, (req, res) => {
  const base = req.query.project ? (q("SELECT root FROM projects WHERE id=?", [req.query.project])[0]?.root || PROJECT_ROOT) : PROJECT_ROOT;
  const query = req.query.q || "";
  if (!query) return res.json({ results: [] });
  try {
    const results = searchFiles(base, query, Number(req.query.limit) || 20);
    res.json({ results });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ── Memory ──
app.get("/api/memory", auth, (req, res) => {
  const rows = q("SELECT * FROM memory WHERE project=? ORDER BY created_at DESC LIMIT 50", [req.query.project || ""]);
  res.json(rows);
});
app.post("/api/memory", auth, (req, res) => {
  const { project, key, value } = req.body;
  db.run("DELETE FROM memory WHERE project=? AND key=?", [project, key]);
  qr("INSERT INTO memory VALUES (?,?,?,?,?)", [crypto.randomUUID(), project, key, value, new Date().toISOString()]);
  res.json({ ok: true });
});

// ── Conversations ──
app.get("/api/conversations", auth, (req, res) => {
  const rows = q("SELECT id, project, created_at, updated_at FROM conversations WHERE project=? ORDER BY updated_at DESC LIMIT 20", [req.query.project || ""]);
  res.json(rows);
});
app.get("/api/conversations/:id", auth, (req, res) => {
  const rows = q("SELECT * FROM conversations WHERE id=?", [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: "Not found" });
  res.json({ ...rows[0], messages: JSON.parse(rows[0].messages || "[]") });
});
app.post("/api/conversations", auth, (req, res) => {
  const id = crypto.randomUUID();
  qr("INSERT INTO conversations VALUES (?,?,?,?,?)", [id, req.body.project || "", JSON.stringify(req.body.messages || []), new Date().toISOString(), new Date().toISOString()]);
  res.json({ id });
});
app.put("/api/conversations/:id", auth, (req, res) => {
  qr("UPDATE conversations SET messages=?, updated_at=? WHERE id=?", [JSON.stringify(req.body.messages || []), new Date().toISOString(), req.params.id]);
  res.json({ ok: true });
});
app.delete("/api/conversations/:id", auth, (req, res) => {
  qr("DELETE FROM conversations WHERE id=?", [req.params.id]);
  res.json({ ok: true });
});

// ── Tasks ──
app.get("/api/tasks", auth, (req, res) => {
  const rows = q("SELECT * FROM tasks WHERE project=? ORDER BY created_at DESC LIMIT 50", [req.query.project || ""]);
  res.json(rows);
});
app.post("/api/tasks", auth, (req, res) => {
  const id = crypto.randomUUID();
  const ts = new Date().toISOString();
  qr("INSERT INTO tasks VALUES (?,?,?,?,?,?,?,?,?)", [id, req.body.project || "", req.body.type || "manual", "pending", 0, req.body.message || "", "", ts, ts]);
  res.json({ id });
});
app.put("/api/tasks/:id", auth, (req, res) => {
  qr("UPDATE tasks SET status=?, progress=?, message=?, result=?, updated_at=? WHERE id=?", [
    req.body.status, req.body.progress || 0, req.body.message, req.body.result || "", new Date().toISOString(), req.params.id
  ]);
  saveDb();
  res.json({ ok: true });
});

// ── Auto Context ──
app.post("/api/context", auth, async (req, res) => {
  const { projectId, files } = req.body;
  const proj = q("SELECT * FROM projects WHERE id=?", [projectId]);
  if (!proj.length) return res.status(404).json({ error: "Project not found" });
  const root = proj[0].root;
  const stack = detectStack(root);
  const structure = summarizeStructure(root, files ? 3 : 2);
  const memory = q("SELECT * FROM memory WHERE project=? ORDER BY created_at DESC LIMIT 20", [projectId]);
  const rules = proj[0].rules || "";
  const keyFiles = {};
  const targets = ["package.json", "frontend/package.json", "README.md", "wrangler.toml", "docker-compose.yml", "dockerfile", ".env.example"];
  for (const t of targets) {
    const fp = path.join(root, t);
    if (fs.existsSync(fp)) try { keyFiles[t] = fs.readFileSync(fp, "utf-8").slice(0, 2000); } catch (e) {}
  }
  res.json({ stack, structure, memory, rules, keyFiles, name: proj[0].name, root });
});

// ── Agent Mode: Plan ──
app.post("/api/agent/plan", auth, async (req, res) => {
  const { projectId, instruction, rules, stack, structure, provider, model } = req.body;
  const proj = q("SELECT * FROM projects WHERE id=?", [projectId]);
  const root = proj.length ? proj[0].root : PROJECT_ROOT;
  const stackInfo = stack || detectStack(root);
  const structInfo = structure || summarizeStructure(root, 2);
  const modelDef = getModelDef(model || AI_MODEL);
  const prompt = `You are Brane Agent, an AI coding assistant. Create a detailed execution plan for the following task.

PROJECT CONTEXT:
- Root: ${root}
- Stack: ${JSON.stringify(stackInfo)}
- Structure: ${JSON.stringify(structInfo.slice(0, 30))}

RULES:
${rules || "No specific rules."}

USER INSTRUCTION:
${instruction}

Respond with a JSON array of steps. Each step has: { "action": "edit"|"create"|"delete"|"command"|"done", "file": "relative/path", "description": "what to do", "details": "extra info" }.

Example:
[
  { "action": "edit", "file": "frontend/src/App.js", "description": "Add new route", "details": "Import and add Route element" },
  { "action": "command", "file": "", "description": "Install dependencies", "details": "npm install" },
  { "action": "done", "file": "", "description": "Verify build", "details": "" }
]

Only respond with valid JSON, no other text.`;
  try {
    const text = await callAI(
      [{ role: "user", content: prompt }],
      { system: "You are a senior software engineer. Respond ONLY with valid JSON.", provider, model, json: true, maxTokens: 4096 }
    );
    const plan = JSON.parse(text);
    const steps = plan.steps || plan.plan || (Array.isArray(plan) ? plan : [plan]);
    res.json({ steps: Array.isArray(steps) ? steps : [], raw: text, model: modelDef });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Agent: Execute step ──
app.post("/api/agent/execute", auth, async (req, res) => {
  const { projectId, step, context, rules, provider, model } = req.body;
  if (!step || !step.action) return res.status(400).json({ error: "No step" });
  const proj = q("SELECT * FROM projects WHERE id=?", [projectId]);
  const root = proj.length ? proj[0].root : PROJECT_ROOT;
  const modelDef = getModelDef(model || AI_MODEL);

  if (step.action === "edit" || step.action === "create") {
    try {
      const existing = { content: "" };
      const fp = path.join(root, step.file);
      if (fs.existsSync(fp)) existing.content = fs.readFileSync(fp, "utf-8");
      const fullPrompt = `You are Brane Agent. ${step.action === "create" ? "Create" : "Edit"} the file "${step.file}" in the project "${proj[0]?.name || "project"}".

TASK: ${step.description}
${step.details ? `DETAILS: ${step.details}` : ""}

Current file content:
\`\`\`
${existing.content || "(new file)"}
\`\`\`

Rules:
${rules || "No specific rules."}

Respond with ONLY the complete new file content in a code block. Do not explain.`;
      const result = await callAI(
        [{ role: "user", content: fullPrompt }],
        { system: "You are a senior software engineer. Output only the file content inside a code block.", provider, model, maxTokens: 8192 }
      );
      let code = result;
      const m = code.match(/```[\w]*\n([\s\S]*?)```/);
      if (m) code = m[1];
      res.json({ action: step.action, file: step.file, content: code, model: modelDef });
    } catch (e) { res.status(500).json({ error: e.message }); }
  } else {
    res.json({ action: step.action, file: step.file, content: null });
  }
});

// ── Agent: Auto-fix ──
app.post("/api/agent/autofix", auth, async (req, res) => {
  const { projectId, buildOutput, instruction, rules, context, provider, model } = req.body;
  const proj = q("SELECT * FROM projects WHERE id=?", [projectId]);
  const root = proj.length ? proj[0].root : PROJECT_ROOT;
  try {
    const prompt = `You are Brane Agent. A build failed in the project. Analyze the error and output a JSON object describing what to fix.

Build output (stdout + stderr):
\`\`\`
${(buildOutput || "").slice(0, 4000)}
\`\`\`

Original task: ${instruction || "Fix the build error"}

Respond with valid JSON:
{
  "analysis": "explanation of the error",
  "fixes": [
    { "file": "relative/path/to/file", "description": "what to change", "details": "how to change" }
  ]
}`;
    const text = await callAI(
      [{ role: "user", content: prompt }],
      { system: "You are an expert debugger. Respond ONLY with valid JSON.", provider, model, json: true, maxTokens: 4096 }
    );
    const fix = JSON.parse(text);
    res.json({ ...fix, model: getModelDef(model || AI_MODEL) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── File Operations ──
app.get("/api/files", auth, (req, res) => {
  const base = req.query.project ? (q("SELECT root FROM projects WHERE id=?", [req.query.project])[0]?.root || PROJECT_ROOT) : PROJECT_ROOT;
  const dir = req.query.dir || "";
  const target = safePath(base, dir);
  function readTree(p, maxDepth = 3, depth = 0) {
    if (depth > maxDepth) return null;
    try {
      const stat = fs.statSync(p);
      if (stat.isFile()) {
        const ext = path.extname(p).toLowerCase();
        return { name: path.basename(p), type: "file", ext, isText: [".js",".jsx",".ts",".tsx",".json",".css",".html",".md",".yml",".yaml",".py",".rb",".java",".c",".cpp",".h",".hpp",".env",".txt",".xml",".svg",".sh",".bat",".toml",".cfg",".ini",".vue",".svelte",".php",".sql",".yaml",".mjs",".cjs"].includes(ext), size: stat.size };
      }
      if (stat.isDirectory()) {
        const name = path.basename(p);
        if (name.startsWith(".") || name === "node_modules" || name === "__pycache__" || name === ".git" || name === "backups") return null;
        const entries = fs.readdirSync(p);
        const children = entries.map(e => readTree(path.join(p, e), maxDepth, depth + 1)).filter(Boolean);
        return { name, type: "dir", children };
      }
    } catch (e) {}
    return null;
  }
  try { res.json(readTree(target, Number(req.query.depth) || 3)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

app.get("/api/files/read", auth, (req, res) => {
  const base = req.query.project ? (q("SELECT root FROM projects WHERE id=?", [req.query.project])[0]?.root || PROJECT_ROOT) : PROJECT_ROOT;
  try { const target = safePath(base, req.query.path || ""); res.json({ content: fs.readFileSync(target, "utf-8"), path: req.query.path }); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

app.post("/api/files/write", auth, (req, res) => {
  const base = req.query.project ? (q("SELECT root FROM projects WHERE id=?", [req.query.project])[0]?.root || PROJECT_ROOT) : PROJECT_ROOT;
  try {
    const target = safePath(base, req.body.path);
    if (fs.existsSync(target)) {
      const backupDir = path.join(__dirname, "backups");
      if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
      const bName = path.basename(target).replace(/[<>:"/\\|?*]/g, "_") + "." + Date.now() + ".bak";
      const bPath = path.join(backupDir, bName);
      fs.copyFileSync(target, bPath);
      qr("INSERT INTO backups VALUES (?,?,?,?)", [crypto.randomUUID(), req.body.path, bPath, new Date().toISOString()]);
    }
    fs.writeFileSync(target, req.body.content, "utf-8");
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post("/api/files/create", auth, (req, res) => {
  const base = req.query.project ? (q("SELECT root FROM projects WHERE id=?", [req.query.project])[0]?.root || PROJECT_ROOT) : PROJECT_ROOT;
  try {
    const target = safePath(base, req.body.path);
    if (fs.existsSync(target)) return res.status(400).json({ error: "File exists" });
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, req.body.content || "", "utf-8");
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ── Diff ──
app.get("/api/diff", auth, (req, res) => {
  const base = req.query.project ? (q("SELECT root FROM projects WHERE id=?", [req.query.project])[0]?.root || PROJECT_ROOT) : PROJECT_ROOT;
  try {
    const target = safePath(base, req.query.path || "");
    const rel = path.relative(base, target);
    const diff = execSync(`git diff "${rel}"`, { cwd: base, encoding: "utf-8", timeout: 10000 });
    res.json({ diff: diff || "(no changes)", path: req.query.path });
  } catch (e) { res.json({ diff: e.stdout || e.message || "(no diff)", path: req.query.path }); }
});

// ── Backups / Rollback ──
app.get("/api/backups", auth, (req, res) => {
  const rows = q("SELECT * FROM backups WHERE file_path=? ORDER BY created_at DESC LIMIT 20", [req.query.path || ""]);
  res.json(rows);
});
app.post("/api/restore", auth, (req, res) => {
  try {
    const rows = q("SELECT * FROM backups WHERE id=?", [req.body.backupId]);
    if (!rows.length) return res.status(404).json({ error: "Backup not found" });
    const b = rows[0];
    const base = req.query.project ? (q("SELECT root FROM projects WHERE id=?", [req.query.project])[0]?.root || PROJECT_ROOT) : PROJECT_ROOT;
    const target = safePath(base, b.file_path);
    fs.copyFileSync(b.backup_path, target);
    res.json({ ok: true, file: b.file_path });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ── Terminal ──
app.post("/api/terminal", auth, (req, res) => {
  const cmd = req.body.command;
  if (!cmd) return res.status(400).json({ error: "No command" });
  const dangerous = ["rm -rf", "rmdir /s", "del /f /s", "format ", "mkfs", "dd if=", "> /dev/sda", ":(){ :|:& };:"];
  if (dangerous.some(d => cmd.toLowerCase().includes(d))) return res.status(403).json({ error: "Dangerous command blocked" });
  exec(cmd, { cwd: PROJECT_ROOT, timeout: 120000, maxBuffer: 2 * 1024 * 1024 }, (err, stdout, stderr) => {
    res.json({ stdout: stdout || "", stderr: stderr || "", code: err ? err.code : 0 });
  });
});

// ── Build ──
app.post("/api/build", auth, (req, res) => {
  const projectId = req.body.projectId || req.query.project;
  let cwd = path.join(PROJECT_ROOT, "frontend");
  if (projectId) {
    const proj = q("SELECT root FROM projects WHERE id=?", [projectId]);
    if (proj.length && fs.existsSync(path.join(proj[0].root, "package.json"))) cwd = proj[0].root;
  }
  exec("npm run build", { cwd, timeout: 180000, maxBuffer: 2 * 1024 * 1024 }, (err, stdout, stderr) => {
    res.json({ stdout: stdout || "", stderr: stderr || "", code: err ? err.code : 0, cwd });
  });
});

// ── Commit ──
app.post("/api/commit", auth, (req, res) => {
  const msg = req.body.message || "auto: brane-agent update";
  try {
    execSync("git add -A", { cwd: PROJECT_ROOT, timeout: 15000 });
    execSync(`git commit -m "${msg.replace(/"/g, '\\"')}"`, { cwd: PROJECT_ROOT, timeout: 15000 });
    try { execSync("git push origin main", { cwd: PROJECT_ROOT, timeout: 30000 }); } catch (e) {}
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ── Chat with context ──
app.post("/api/chat", auth, async (req, res) => {
  const { messages, rules, context, provider, model } = req.body;
  const modelDef = getModelDef(model || AI_MODEL);
  const stackStr = context?.stack ? `Stack: ${JSON.stringify(context.stack)}\n` : "";
  const structStr = context?.structure ? `Key structure: ${JSON.stringify(context.structure.slice(0, 15))}\n` : "";
  const rulesStr = rules || context?.rules || "";
  const systemPrompt = `You are Brane Agent, an AI coding assistant for the project at ${context?.root || PROJECT_ROOT}.

${stackStr}
${structStr}
${rulesStr ? `RULES:\n${rulesStr}\n` : ""}
${context?.keyFiles ? `Key files:\n${Object.entries(context.keyFiles).map(([k, v]) => `--- ${k} ---\n${v}`).join("\n")}\n` : ""}

You help write code, analyze projects, suggest improvements, and automate development tasks.
Be concise, technical, and practical. Use Portuguese-BR. When suggesting code changes, be specific about file paths and line numbers.`;
  try {
    const content = await callAI(messages, { system: systemPrompt, provider, model, maxTokens: 8192 });
    res.json({ content, model: modelDef });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Health ──
app.get("/health", (req, res) => res.json({ ok: true, uptime: process.uptime() }));

// ── Status ──
app.get("/api/status", auth, (req, res) => {
  try {
    const gitLog = execSync("git log --oneline -3", { cwd: PROJECT_ROOT, encoding: "utf-8", timeout: 5000 });
    const gitStatus = execSync("git status --short", { cwd: PROJECT_ROOT, encoding: "utf-8", timeout: 5000 });
    const projects = q("SELECT id, name, root FROM projects");
    res.json({
      gitLog: gitLog.trim(), gitStatus: gitStatus.trim(), projects, host: require("os").hostname(),
      provider: AI_PROVIDER, model: AI_MODEL, modelDef: getModelDef(AI_MODEL),
    });
  } catch (e) { res.json({ gitLog: "", gitStatus: "", projects: [], host: require("os").hostname(), provider: AI_PROVIDER, model: AI_MODEL }); }
});

// ── Init ──
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Agent server running on port ${PORT}`);
  initDb().catch(e => console.error("DB init failed:", e.message));
});

process.on("uncaughtException", e => console.error("Uncaught:", e.message));
process.on("unhandledRejection", e => console.error("Unhandled:", e.message));
