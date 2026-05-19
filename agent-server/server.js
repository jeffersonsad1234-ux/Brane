require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const fs = require("fs");
const path = require("path");
const { exec, execSync } = require("child_process");
const initSqlJs = require("sql.js");
const { v4: uuid } = require("uuid");

const app = express();
const PORT = process.env.PORT || 3200;
const PROJECT_ROOT = process.env.PROJECT_ROOT || path.resolve(__dirname, "..");
const AGENT_PASSWORD = process.env.AGENT_PASSWORD || "admin123";

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: ["http://localhost:3000", "http://localhost:3001", "https://branded.page.br", "https://www.branded.page.br"], credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));
app.use(rateLimit({ windowMs: 60 * 1000, max: 300 }));

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
      db.run("INSERT INTO projects VALUES (?,?,?,?,?)", [uuid(), "Brane (main)", PROJECT_ROOT, "", ts]);
      db.run("INSERT INTO projects VALUES (?,?,?,?,?)", [uuid(), "Jogo Survival", path.join(PROJECT_ROOT, "frontend", "src", "pages", "VirtualShoppingBrane"), "", ts]);
      db.run("INSERT INTO projects VALUES (?,?,?,?,?)", [uuid(), "Brane Agent", __dirname, "", ts]);
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

// ── Structure summary for context ──
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

// ── Login ──
app.post("/api/login", (req, res) => {
  if (req.body.password === AGENT_PASSWORD) return res.json({ ok: true });
  res.status(401).json({ error: "Invalid password" });
});

// ── Projects ──
app.get("/api/projects", auth, (req, res) => {
  res.json(q("SELECT * FROM projects ORDER BY created_at"));
});
app.post("/api/projects", auth, (req, res) => {
  const { name, root, rules } = req.body;
  const id = uuid();
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

// ── Memory ──
app.get("/api/memory", auth, (req, res) => {
  const rows = q("SELECT * FROM memory WHERE project=? ORDER BY created_at DESC LIMIT 50", [req.query.project || ""]);
  res.json(rows);
});
app.post("/api/memory", auth, (req, res) => {
  const { project, key, value } = req.body;
  db.run("DELETE FROM memory WHERE project=? AND key=?", [project, key]);
  qr("INSERT INTO memory VALUES (?,?,?,?,?)", [uuid(), project, key, value, new Date().toISOString()]);
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
  const id = uuid();
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
  const id = uuid();
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

// ── Auto Context (before chat) ──
app.post("/api/context", auth, async (req, res) => {
  const { projectId, files } = req.body;
  const proj = q("SELECT * FROM projects WHERE id=?", [projectId]);
  if (!proj.length) return res.status(404).json({ error: "Project not found" });
  const root = proj[0].root;
  const stack = detectStack(root);
  const structure = summarizeStructure(root, files ? 3 : 2);
  const memory = q("SELECT * FROM memory WHERE project=? ORDER BY created_at DESC LIMIT 20", [projectId]);
  const rules = proj[0].rules || "";
  // Read key files for deeper context
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
  const { projectId, instruction, rules, stack, structure } = req.body;
  const proj = q("SELECT * FROM projects WHERE id=?", [projectId]);
  const root = proj.length ? proj[0].root : PROJECT_ROOT;
  const stackInfo = stack || detectStack(root);
  const structInfo = structure || summarizeStructure(root, 2);
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
  { "action": "edit", "file": "frontend/src/App.js", "description": "Add new route for /brane-agent", "details": "Import and add Route element" },
  { "action": "command", "file": "", "description": "Install dependencies", "details": "npm install" },
  { "action": "done", "file": "", "description": "Verify build", "details": "" }
]

Only respond with valid JSON, no other text.`;
  try {
    if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: "OPENAI_API_KEY not configured" });
    const OpenAI = require("openai");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: "You are a senior software engineer. Respond ONLY with valid JSON." }, { role: "user", content: prompt }],
      max_tokens: 4096, response_format: { type: "json_object" }
    });
    const text = completion.choices[0].message.content;
    const plan = JSON.parse(text);
    const steps = plan.steps || plan.plan || (Array.isArray(plan) ? plan : [plan]);
    res.json({ steps: Array.isArray(steps) ? steps : [], raw: text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── File Operations (existing enhanced) ──
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
      qr("INSERT INTO backups VALUES (?,?,?,?)", [uuid(), req.body.path, bPath, new Date().toISOString()]);
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
  const { messages, rules, context } = req.body;
  const provider = process.env.AI_PROVIDER || "openai";
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
    if (provider === "openai") {
      if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: "OPENAI_API_KEY not configured" });
      const OpenAI = require("openai");
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        max_tokens: 8192,
      });
      return res.json({ content: completion.choices[0].message.content });
    } else {
      const resp = await fetch(process.env.LOCAL_MODEL_URL, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: `${systemPrompt}\n\n${messages.map(m => m.content).join("\n")}`, stream: false }),
      });
      const data = await resp.json();
      return res.json({ content: data.response || data.content || "(no response)" });
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Health (public, no auth — for Railway) ──
app.get("/health", (req, res) => res.json({ ok: true, uptime: process.uptime() }));

// ── Status ──
app.get("/api/status", auth, (req, res) => {
  try {
    const gitLog = execSync("git log --oneline -3", { cwd: PROJECT_ROOT, encoding: "utf-8", timeout: 5000 });
    const gitStatus = execSync("git status --short", { cwd: PROJECT_ROOT, encoding: "utf-8", timeout: 5000 });
    const projects = q("SELECT id, name, root FROM projects");
    res.json({ gitLog: gitLog.trim(), gitStatus: gitStatus.trim(), projects, host: require("os").hostname() });
  } catch (e) { res.json({ gitLog: "", gitStatus: "", projects: [], host: require("os").hostname() }); }
});

// ── Init ──
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Agent server running on port ${PORT}`);
  initDb().catch(e => console.error("DB init failed:", e.message));
});

process.on("uncaughtException", e => console.error("Uncaught:", e.message));
process.on("unhandledRejection", e => console.error("Unhandled:", e.message));
