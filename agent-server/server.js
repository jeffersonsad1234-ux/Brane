require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const fs = require("fs");
const path = require("path");
const { exec, execSync } = require("child_process");

const app = express();
const PORT = process.env.PORT || 3200;
const PROJECT_ROOT = process.env.PROJECT_ROOT || path.resolve(__dirname, "..");
const AGENT_PASSWORD = process.env.AGENT_PASSWORD || "admin123";

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

const limiter = rateLimit({ windowMs: 60 * 1000, max: 200 });
app.use(limiter);

// ── Auth Middleware ──
function auth(req, res, next) {
  const pwd = req.headers["x-agent-password"];
  if (pwd !== AGENT_PASSWORD) return res.status(401).json({ error: "Unauthorized" });
  next();
}

// ── Ensure path is inside project ──
function safePath(p) {
  const resolved = path.resolve(PROJECT_ROOT, p);
  if (!resolved.startsWith(PROJECT_ROOT.replace(/\\/g, "/").replace(/\//g, "\\").startsWith ? PROJECT_ROOT : path.resolve(PROJECT_ROOT))) {
    const norm = path.normalize(PROJECT_ROOT);
    if (!resolved.startsWith(norm)) throw new Error("Path outside project");
  }
  return resolved;
}

// ── POST /api/login ──
app.post("/api/login", (req, res) => {
  const { password } = req.body;
  if (password === AGENT_PASSWORD) return res.json({ ok: true });
  res.status(401).json({ error: "Invalid password" });
});

// ── GET /api/files ── tree structure ──
app.get("/api/files", auth, (req, res) => {
  const dir = req.query.dir || "";
  const target = safePath(dir);
  function readTree(p, maxDepth = 3, depth = 0) {
    if (depth > maxDepth) return null;
    const stat = fs.statSync(p, { throwIfNoEntry: false });
    if (!stat) return null;
    if (stat.isFile()) {
      const ext = path.extname(p).toLowerCase();
      const isText = [".js",".jsx",".ts",".tsx",".json",".css",".html",".md",".yml",".yaml",
        ".py",".rb",".java",".c",".cpp",".h",".hpp",".env",".txt",".xml",".svg",".sh",".bat",
        ".toml",".cfg",".ini",".vue",".svelte",".php",".sql",".yaml"].includes(ext);
      return { name: path.basename(p), type: "file", ext, isText, size: stat.size };
    }
    if (stat.isDirectory()) {
      const name = path.basename(p);
      if (name.startsWith(".") || name === "node_modules" || name === "__pycache__" || name === ".git") return null;
      const entries = fs.readdirSync(p);
      const children = entries.map(e => readTree(path.join(p, e), maxDepth, depth + 1)).filter(Boolean);
      return { name, type: "dir", children };
    }
    return null;
  }
  try {
    const tree = readTree(target, Number(req.query.depth) || 3);
    res.json(tree);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ── GET /api/files/read ──
app.get("/api/files/read", auth, (req, res) => {
  try {
    const target = safePath(req.query.path || "");
    const content = fs.readFileSync(target, "utf-8");
    res.json({ content, path: req.query.path });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ── POST /api/files/write ──
app.post("/api/files/write", auth, (req, res) => {
  try {
    const target = safePath(req.body.path);
    // Backup
    if (fs.existsSync(target)) {
      const backupDir = path.join(PROJECT_ROOT, "agent-server", "backups");
      if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
      const backupName = path.basename(target) + "." + Date.now() + ".bak";
      fs.copyFileSync(target, path.join(backupDir, backupName));
    }
    fs.writeFileSync(target, req.body.content, "utf-8");
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ── POST /api/files/create ──
app.post("/api/files/create", auth, (req, res) => {
  try {
    const target = safePath(req.body.path);
    if (fs.existsSync(target)) return res.status(400).json({ error: "File exists" });
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, req.body.content || "", "utf-8");
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ── GET /api/diff ──
app.get("/api/diff", auth, (req, res) => {
  try {
    const target = safePath(req.query.path || "");
    const execPath = PROJECT_ROOT;
    const rel = path.relative(PROJECT_ROOT, target);
    const diff = execSync(`git diff "${rel}"`, { cwd: execPath, encoding: "utf-8", timeout: 10000 });
    res.json({ diff: diff || "(no changes)" });
  } catch (e) {
    res.json({ diff: e.stdout || e.message || "(no diff)" });
  }
});

// ── POST /api/terminal ──
app.post("/api/terminal", auth, (req, res) => {
  const cmd = req.body.command;
  if (!cmd) return res.status(400).json({ error: "No command" });
  const allowed = (process.env.ALLOWED_COMMANDS || "").split(",").map(s => s.trim()).filter(Boolean);
  if (allowed.length > 0 && !allowed.some(a => cmd.startsWith(a))) {
    return res.status(403).json({ error: `Command not allowed: ${cmd}` });
  }
  const dangerous = ["rm -rf", "rmdir /s", "del /f /s", "format ", "mkfs", "dd if=", "> /dev/sda"];
  if (dangerous.some(d => cmd.toLowerCase().includes(d))) {
    return res.status(403).json({ error: "Dangerous command blocked" });
  }
  exec(cmd, { cwd: PROJECT_ROOT, timeout: 120000, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
    res.json({ stdout: stdout || "", stderr: stderr || "", code: err ? err.code : 0 });
  });
});

// ── POST /api/build ──
app.post("/api/build", auth, (req, res) => {
  exec("npm run build", { cwd: path.join(PROJECT_ROOT, "frontend"), timeout: 180000, maxBuffer: 2 * 1024 * 1024 }, (err, stdout, stderr) => {
    res.json({ stdout: stdout || "", stderr: stderr || "", code: err ? err.code : 0 });
  });
});

// ── POST /api/commit ──
app.post("/api/commit", auth, (req, res) => {
  const msg = req.body.message || "auto: brane-agent update";
  try {
    execSync("git add -A", { cwd: PROJECT_ROOT, timeout: 15000 });
    execSync(`git commit -m "${msg.replace(/"/g, '\\"')}"`, { cwd: PROJECT_ROOT, timeout: 15000 });
    try { execSync("git push origin main", { cwd: PROJECT_ROOT, timeout: 30000 }); } catch (e) {}
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ── POST /api/commit-message ──
app.get("/api/commit-message", auth, (req, res) => {
  try {
    const diff = execSync("git diff --cached --stat", { cwd: PROJECT_ROOT, encoding: "utf-8", timeout: 10000 });
    const log = execSync("git log --oneline -3", { cwd: PROJECT_ROOT, encoding: "utf-8", timeout: 10000 });
    res.json({ diff, log });
  } catch (e) {
    res.json({ diff: "", log: "" });
  }
});

// ── POST /api/chat ──
app.post("/api/chat", auth, async (req, res) => {
  const { messages, rules } = req.body;
  const provider = process.env.AI_PROVIDER || "openai";
  try {
    if (provider === "openai") {
      const OpenAI = require("openai");
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const systemMsg = rules
        ? { role: "system", content: `You are Brane Agent, an AI coding assistant. Follow these rules:\n\n${rules}\n\nYou can analyze code, suggest changes, and help build this project. Be concise and technical.` }
        : { role: "system", content: "You are Brane Agent, an AI coding assistant. Be concise and technical." };
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [systemMsg, ...messages],
        max_tokens: 4096,
      });
      res.json({ content: completion.choices[0].message.content });
    } else {
      const response = await fetch(process.env.LOCAL_MODEL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: messages.map(m => m.content).join("\n"), stream: false }),
      });
      const data = await response.json();
      res.json({ content: data.response || data.content || "(no response)" });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/status ──
app.get("/api/status", auth, (req, res) => {
  try {
    const gitLog = execSync("git log --oneline -3", { cwd: PROJECT_ROOT, encoding: "utf-8", timeout: 5000 });
    const gitStatus = execSync("git status --short", { cwd: PROJECT_ROOT, encoding: "utf-8", timeout: 5000 });
    const disk = process.cwd();
    res.json({ gitLog: gitLog.trim(), gitStatus: gitStatus.trim(), disk, host: require("os").hostname() });
  } catch (e) {
    res.json({ gitLog: "", gitStatus: "", disk: PROJECT_ROOT, host: require("os").hostname() });
  }
});

app.listen(PORT, () => console.log(`Brane Agent API running on http://localhost:${PORT}`));
