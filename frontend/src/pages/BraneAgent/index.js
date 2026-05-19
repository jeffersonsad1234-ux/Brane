import React, { useState, useEffect, useRef } from "react";
import "./BraneAgent.css";

const API = process.env.REACT_APP_AGENT_API || "http://localhost:3200";
let PASSWORD = sessionStorage.getItem("ba_pwd") || "";

function headers() { return { "Content-Type": "application/json", "x-agent-password": PASSWORD }; }
async function api(method, path, body) {
  const opts = { method, headers: headers() };
  if (body) opts.body = JSON.stringify(body);
  let r;
  try {
    r = await fetch(`${API}${path}`, opts);
  } catch (e) {
    throw new Error(`Falha de conexão com o agente: ${e.message}`);
  }
  if (r.status === 401) { sessionStorage.removeItem("ba_pwd"); window.location.reload(); }
  return r.json();
}

const ICONS = { chat: "💬", files: "📁", tasks: "📋", plan: "🎯", settings: "⚙️", user: "👤", brain: "🧠", terminal: "🖥️" };

// ── Markdown ──
function renderMsg(text) {
  const lines = text.split("\n");
  let inCode = false, codeBuf = [], out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("```")) {
      if (inCode) { out.push(<pre key={`c${i}`} className="ba-code"><code>{codeBuf.join("\n")}</code></pre>); codeBuf = []; }
      inCode = !inCode; continue;
    }
    if (inCode) { codeBuf.push(line); continue; }
    if (line.startsWith("## ")) { out.push(<div key={i} className="ba-mh2">{line.slice(3)}</div>); continue; }
    if (line.startsWith("### ")) { out.push(<div key={i} className="ba-mh3">{line.slice(4)}</div>); continue; }
    if (line.startsWith("- ")) { out.push(<div key={i} className="ba-mli">• {line.slice(2)}</div>); continue; }
    if (line.startsWith("**") && line.endsWith("**")) { out.push(<div key={i} className="ba-mb">{line.slice(2, -2)}</div>); continue; }
    if (line.trim()) out.push(<div key={i} className="ba-mp">{line}</div>);
    else out.push(<br key={`b${i}`} />);
  }
  if (inCode) out.push(<pre key="cend" className="ba-code"><code>{codeBuf.join("\n")}</code></pre>);
  return out.length ? out : text;
}

// ── Diff renderer ──
function DiffView({ diff }) {
  if (!diff || diff === "(no changes)" || diff === "(no diff)") return <div className="ba-diff-empty">Sem alterações</div>;
  const lines = diff.split("\n").filter(l => l);
  return <div className="ba-diff">{lines.map((l, i) => {
    let cls = "";
    if (l.startsWith("+")) cls = "add";
    else if (l.startsWith("-")) cls = "rem";
    else if (l.startsWith("@@")) cls = "hdr";
    return <div key={i} className={`ba-dl ${cls}`}><span className="ba-dn">{i + 1}</span><span className="ba-dt">{l}</span></div>;
  })}</div>;
}

// ── Confirm Dialog ──
function ConfirmDialog({ msg, onConfirm, onCancel }) {
  return <div className="ba-overlay" onClick={onCancel}>
    <div className="ba-confirm" onClick={e => e.stopPropagation()}>
      <div className="ba-confirm-icon">⚠️</div>
      <div className="ba-confirm-msg">{msg}</div>
      <div className="ba-confirm-btns">
        <button className="ba-btn" onClick={onCancel}>Cancelar</button>
        <button className="ba-btn primary" style={{ background: "var(--re)", borderColor: "var(--re)", color: "#fff" }} onClick={onConfirm}>Confirmar</button>
      </div>
    </div>
  </div>;
}

// ── Main ──
export default function BraneAgent() {
  const [loggedIn, setLoggedIn] = useState(!!PASSWORD);
  const [loginError, setLoginError] = useState("");
  const [activeTab, setActiveTab] = useState("chat");
  const [projectId, setProjectId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [context, setContext] = useState(null);
  const [chatMsg, setChatMsg] = useState("");
  const [msgs, setMsgs] = useState([]);
  const [convId, setConvId] = useState(null);
  const [sending, setSending] = useState(false);
  const [rules, setRules] = useState("");
  const [rulesDirty, setRulesDirty] = useState(false);
  const [tree, setTree] = useState(null);
  const [currentFile, setCurrentFile] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [fileDirty, setFileDirty] = useState(false);
  const [termOut, setTermOut] = useState(["> Brane Agent terminal ready"]);
  const [termInput, setTermInput] = useState("");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState({});
  const [status, setStatus] = useState({ gitLog: "", projects: [] });
  const [agentPlan, setAgentPlan] = useState(null);
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentInstruction, setAgentInstruction] = useState("");
  const [diffData, setDiffData] = useState(null);
  const [memory, setMemory] = useState([]);
  const [showSide, setShowSide] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [modelData, setModelData] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [apiConnected, setApiConnected] = useState(null);
  const [apiConnectError, setApiConnectError] = useState("");
  const [confirm, setConfirm] = useState(null);

  const chatRef = useRef(null);
  const termRef = useRef(null);

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [msgs]);
  useEffect(() => { if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight; }, [termOut]);

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch(`${API}/health`);
        const data = await res.json();
        if (res.ok && data?.status === "ok") {
          setApiConnected(true);
          setApiConnectError("");
        } else {
          throw new Error(data?.error || "Health check failed");
        }
      } catch (err) {
        setApiConnected(false);
        setApiConnectError(err.message);
      }
    }
    checkHealth();
  }, []);

  // ── Init ──
  useEffect(() => {
    if (!loggedIn) return;
    api("GET", "/api/status").then(d => { setStatus(d); setProjects(d.projects || []); if (d.projects?.length && !projectId) switchProject(d.projects[0].id); });
    api("GET", "/api/models").then(d => {
      setModelData(d);
      if (d?.current?.model) {
        setSelectedModel(d.current.model);
        setSelectedProvider(d.current.provider);
      }
    });
  }, [loggedIn]);

  function switchProject(id) {
    setProjectId(id);
    const p = projects.find(x => x.id === id) || status.projects?.find(x => x.id === id);
    api("GET", `/api/files?project=${id}&depth=2`).then(d => { if (d?.name) setTree(d); });
    api("POST", "/api/context", { projectId: id }).then(ctx => {
      setContext(ctx);
      if (ctx?.rules) setRules(ctx.rules);
      setMemory(ctx?.memory || []);
    });
    api("GET", `/api/tasks?project=${id}`).then(d => setTasks(d || []));
  }

  // ── Model selector ──
  function switchModel(modelId) {
    const def = modelData?.available?.[modelId];
    if (def) { setSelectedModel(modelId); setSelectedProvider(def.provider); }
  }

  function getModelBadge() {
    const def = modelData?.available?.[selectedModel];
    if (!def) return "?";
    const modeLabels = { powerful: "⚡", fast: "🚀", cheap: "💰", local: "💻", custom: "🔧" };
    return `${modeLabels[def.mode] || "?"} ${def.label}`;
  }

  // ── Login ──
  async function doLogin() {
    const pwd = document.getElementById("ba-pwd")?.value;
    if (!pwd) return;
    try {
      const r = await api("POST", "/api/login", { password: pwd });
      if (r.ok) { PASSWORD = pwd; sessionStorage.setItem("ba_pwd", pwd); setLoggedIn(true); }
      else setLoginError("Senha incorreta");
    } catch (e) { setLoginError("Erro de conexão"); }
  }

  // ── Chat ──
  async function sendChat() {
    const txt = chatMsg.trim();
    if (!txt || sending) return;
    setChatMsg(""); setSending(true);
    const newMsgs = [...msgs, { role: "user", content: txt }];
    setMsgs(newMsgs);
    try {
      const r = await api("POST", "/api/chat", { messages: newMsgs, rules, context, provider: selectedProvider, model: selectedModel });
      setMsgs([...newMsgs, { role: "assistant", content: r.content || r.error || "(no response)", _model: r.model }]);
      if (!convId) {
        const c = await api("POST", "/api/conversations", { project: projectId, messages: newMsgs });
        if (c.id) setConvId(c.id);
      } else {
        await api("PUT", `/api/conversations/${convId}`, { messages: [...newMsgs, { role: "assistant", content: r.content }] });
      }
    } catch (e) { setMsgs([...newMsgs, { role: "assistant", content: "Erro: " + e.message }]); }
    setSending(false);
    addTask("Chat: " + txt.slice(0, 60));
  }

  // ── Rules ──
  function saveRules() {
    localStorage.setItem("ba_rules", rules);
    setRulesDirty(false);
    if (projectId) api("PUT", `/api/projects/${projectId}`, { rules });
    addTask("Regras salvas");
  }

  // ── Search ──
  async function doSearch() {
    const q = searchQuery.trim();
    if (!q) return;
    try { const r = await api("GET", `/api/search?project=${projectId}&q=${encodeURIComponent(q)}&limit=20`); setSearchResults(r.results || []); addTask("Busca: " + q.slice(0, 60)); }
    catch (e) {}
  }

  // ── Files ──
  function toggleDir(item, pth) {
    if (item.type !== "dir") return;
    if (item.children) { item.children = null; setTree({ ...tree }); return; }
    api("GET", `/api/files?project=${projectId}&dir=${encodeURIComponent(pth)}&depth=2`).then(d => {
      if (d?.children) { item.children = d.children; setTree({ ...tree }); }
    });
  }

  function buildTree(node, pth) {
    if (!node) return null;
    const full = pth ? `${pth}/${node.name}` : "";
    if (node.type === "file") return (
      <div key={full} className="ba-ti" onClick={() => openFile(full)} style={{ paddingLeft: `${12 + (full.match(/\//g) || []).length * 12}px` }}>
        <span className="ba-ic">📄</span><span className="ba-tn">{node.name}</span>
      </div>
    );
    return (
      <div key={full || "/"}>
        <div className="ba-ti" onClick={() => toggleDir(node, full)} style={{ paddingLeft: `${12 + (pth ? (pth.match(/\//g) || []).length * 12 : 0)}px` }}>
          <span className={`ba-ch ${node.children ? "ba-co" : ""}`}>▶</span>
          <span className="ba-ic">{node.children ? "📁" : "📄"}</span><span className="ba-tn">{node.name}</span>
        </div>
        {node.children && <div>{node.children.map(c => buildTree(c, full))}</div>}
      </div>
    );
  }

  async function openFile(pth) {
    setCurrentFile(pth); setFileDirty(false); setDiffData(null);
    setActiveTab("editor");
    try { const r = await api("GET", `/api/files/read?project=${projectId}&path=${encodeURIComponent(pth)}`); setFileContent(r.content || ""); }
    catch (e) { setFileContent("// Error"); }
  }

  async function saveFile() {
    if (!currentFile) return;
    try { await api("POST", `/api/files/write?project=${projectId}`, { path: currentFile, content: fileContent }); setFileDirty(false); addTask("Salvo: " + currentFile); }
    catch (e) { alert("Erro: " + e.message); }
  }

  async function showDiff() {
    if (!currentFile) return;
    try { const r = await api("GET", `/api/diff?project=${projectId}&path=${encodeURIComponent(currentFile)}`); setDiffData(r.diff); setActiveTab("diff"); }
    catch (e) {}
  }

  // ── Terminal ──
  async function runTerm() {
    const cmd = termInput.trim();
    if (!cmd) return;
    setTermOut(p => [...p, `<span class="ba-prompt">$</span> ${cmd}`]);
    setTermInput("");
    try {
      const r = await api("POST", "/api/terminal", { command: cmd });
      if (r.stdout) setTermOut(p => [...p, ...r.stdout.split("\n")]);
      if (r.stderr) setTermOut(p => [...p, `<span class="ba-err">${r.stderr}</span>`]);
    } catch (e) { setTermOut(p => [...p, `<span class="ba-err">Error: ${e.message}</span>`]); }
    addTask("CMD: " + cmd.slice(0, 60));
  }

  // ── Build ──
  async function doBuild() {
    setLoading(p => ({ ...p, build: true })); addTask("Build iniciado");
    setTermOut(p => [...p, `<span class="ba-prompt">$</span> npm run build`]);
    try { const r = await api("POST", "/api/build", { projectId }); setTermOut(p => [...p, ...(r.stdout || "").split("\n"), ...(r.stderr ? [`<span class="ba-err">${r.stderr}</span>`] : []), r.code === 0 ? "✓ Build OK" : "✗ Build falhou"]); }
    catch (e) { setTermOut(p => [...p, `<span class="ba-err">Error: ${e.message}</span>`]); }
    setLoading(p => ({ ...p, build: false }));
  }

  // ── Commit ──
  async function doCommit() {
    const msg = prompt("Mensagem do commit:");
    if (!msg) return;
    setLoading(p => ({ ...p, commit: true })); addTask("Commit: " + msg.slice(0, 60));
    try { const r = await api("POST", "/api/commit", { message: msg }); setTermOut(p => [...p, r.ok ? "✓ Commit + Push" : `<span class="ba-err">✗ ${r.error}</span>`]); }
    catch (e) { setTermOut(p => [...p, `<span class="ba-err">Error: ${e.message}</span>`]); }
    setLoading(p => ({ ...p, commit: false }));
  }

  // ── Agent Mode ──
  async function runAgent() {
    const instruction = agentInstruction.trim();
    if (!instruction) return;
    setAgentRunning(true); setAgentPlan(null); addTask("Agent: " + instruction.slice(0, 60));
    setActiveTab("plan");
    setTermOut(p => [...p, `<span class="ba-prompt">[Agent]</span> Planejando usando ${getModelBadge()}...`]);
    try {
      const planR = await api("POST", "/api/agent/plan", { projectId, instruction, rules, stack: context?.stack, structure: context?.structure, provider: selectedProvider, model: selectedModel });
      const steps = planR.steps || [];
      setAgentPlan(steps);
      setTermOut(p => [...p, `<span class="ba-prompt">[Agent]</span> Plano: ${steps.length} passos (${planR.model?.label || selectedModel})`]);

      // --- Execute steps (existing flow) ---
      // ... (keeps the same execution logic)
      for (let idx = 0; idx < steps.length; idx++) {
        const step = steps[idx];
        setTermOut(p => [...p, `<span class="ba-prompt">[Agent ${idx + 1}/${steps.length}]</span> ${step.action}: ${step.description}`]);
        if (step.action === "edit" || step.action === "create") {
          try {
            const exeR = await api("POST", "/api/agent/execute", { projectId, step, context, rules, provider: selectedProvider, model: selectedModel });
            if (exeR.content) {
              if (step.action === "create") {
                await api("POST", `/api/files/create?project=${projectId}`, { path: step.file, content: exeR.content });
              } else {
                await api("POST", `/api/files/write?project=${projectId}`, { path: step.file, content: exeR.content });
              }
              setTermOut(p => [...p, `  ✓ ${step.file} ${step.action === "create" ? "criado" : "editado"}`]);
            }
          } catch (e) { setTermOut(p => [...p, `  <span class="ba-err">✗ ${step.file}: ${e.message}</span>`]); }
        } else if (step.action === "command") {
          try {
            const cmdR = await api("POST", "/api/terminal", { command: step.details || step.file });
            setTermOut(p => [...p, `  → ${(cmdR.stdout || "").slice(0, 300)}`]);
            if (cmdR.stderr) setTermOut(p => [...p, `  <span class="ba-err">${(cmdR.stderr || "").slice(0, 300)}</span>`]);
          } catch (e) { setTermOut(p => [...p, `  <span class="ba-err">✗ ${e.message}</span>`]); }
        } else if (step.action === "done") {
          setTermOut(p => [...p, `  ✓ ${step.description}`]);
        }
        await new Promise(r => setTimeout(r, 500));
        setAgentPlan(prev => prev?.map((s, i) => i === idx ? { ...s, _done: true } : s));
      }
      setTermOut(p => [...p, `<span class="ba-prompt">[Agent]</span> Build...`]);
      await autoFixAndBuild();
      setTermOut(p => [...p, `<span class="ba-prompt">[Agent]</span> ✅ Missão completa.`]);
    } catch (e) { setTermOut(p => [...p, `<span class="ba-err">[Agent] Erro: ${e.message}</span>`]); }
    setAgentRunning(false);
  }

  // ── Modo Potente (via /api/agent/run-plan) ──
  async function runPowerfulAgent() {
    const instruction = agentInstruction.trim();
    if (!instruction) return;
    setAgentRunning(true); setAgentPlan(null); addTask("Potente: " + instruction.slice(0, 60));
    setActiveTab("plan");
    setTermOut(p => [...p, `<span class="ba-prompt">[⚡Potente]</span> Executando pipeline completa...`]);
    try {
      const r = await api("POST", "/api/agent/run-plan", { projectId, instruction, rules, provider: selectedProvider, model: selectedModel });
      setAgentPlan(r.tasks?.map(t => ({ _done: t.status === "done", action: t.desc, file: t.file || "", description: t.desc, details: t.status })) || []);
      setTermOut(p => [...p, ...(r.tasks || []).map(t => `  ${t.status === "done" ? "✓" : t.status === "failed" ? "✗" : "→"} ${t.desc}`)]);
      setTermOut(p => [...p, `<span class="ba-prompt">[⚡Potente]</span> ${r.summary || "Concluído"}. Arquivos: ${(r.modifiedFiles || []).join(", ")}`]);
    } catch (e) { setTermOut(p => [...p, `<span class="ba-err">[⚡Potente] Erro: ${e.message}</span>`]); }
    setAgentRunning(false);
  }

  // ── Auto-fix + Build helper ──
  async function autoFixAndBuild() {
    const buildR = await api("POST", "/api/build", { projectId });
    setTermOut(p => [...p, buildR.code === 0 ? "  ✓ Build OK" : `  <span class="ba-err">✗ Build: ${(buildR.stderr || "").slice(0, 500)}</span>`]);
    if (buildR.code === 0) return true;
    for (let attempt = 1; attempt <= 3; attempt++) {
      setTermOut(p => [...p, `  🔧 Auto-fix tentativa ${attempt}/3...`]);
      try {
        const fixR = await api("POST", "/api/agent/autofix", { projectId, buildOutput: (buildR.stderr || "") + "\n" + (buildR.stdout || ""), instruction: agentInstruction, rules, context, provider: selectedProvider, model: selectedModel });
        if (fixR.fixes?.length) {
          for (const fix of fixR.fixes) {
            setTermOut(p => [...p, `  Fix: ${fix.file}`]);
            const existing = await api("GET", `/api/files/read?project=${projectId}&path=${encodeURIComponent(fix.file)}`);
            const fixResp = await api("POST", "/api/chat", { messages: [{ role: "user", content: `Fix "${fix.file}": ${fix.description}\n${fix.details || ""}\n\n\`\`\`\n${existing.content}\n\`\`\`\nOutput ONLY the complete fixed file.` }], rules, context, provider: selectedProvider, model: selectedModel });
            let code = fixResp.content || "";
            const m = code.match(/```[\w]*\n([\s\S]*?)```/);
            if (m) code = m[1];
            if (code) await api("POST", `/api/files/write?project=${projectId}`, { path: fix.file, content: code });
          }
          const retryR = await api("POST", "/api/build", { projectId });
          setTermOut(p => [...p, retryR.code === 0 ? "  ✓ Build OK após fix" : "  ✗ Ainda falhou"]);
          if (retryR.code === 0) return true;
        } else { break; }
      } catch (e) { break; }
    }
    return false;
  }

  // ── Tasks ──
  function addTask(msg) {
    const t = { time: new Date().toLocaleTimeString(), action: msg, status: "done" };
    setTasks(prev => [t, ...prev].slice(0, 50));
  }

  // ── Login Screen ──
  if (apiConnected === null || apiConnected === false) return (
    <div className="ba-root"><div className="ba-login">
      <div className="ba-login-icon">⬡</div>
      <div className="ba-login-title">Conectando ao agente...</div>
      <div className="ba-login-sub">Aguarde enquanto a API do Brane Agent responde.</div>
      {apiConnected === false && <div className="ba-login-err">Erro: {apiConnectError || "Não foi possível conectar"}<br />Verifique se o backend está rodando em {API}</div>}
    </div></div>
  );

  if (!loggedIn) return (
    <div className="ba-root"><div className="ba-login">
      <div className="ba-login-icon">⬡</div>
      <div className="ba-login-title">BRANE AGENT</div>
      <div className="ba-login-sub">Assistente de desenvolvimento privado</div>
      <input id="ba-pwd" className="ba-login-input" type="password" placeholder="Senha" onKeyDown={e => e.key === "Enter" && doLogin()} autoFocus />
      <button className="ba-login-btn" onClick={doLogin}>Acessar</button>
      {loginError && <div className="ba-login-err">{loginError}</div>}
    </div></div>
  );

  // ── Confirmation overlay ──
  if (confirm) return <ConfirmDialog msg={confirm.msg} onConfirm={() => { confirm.onOk(); setConfirm(null); }} onCancel={() => setConfirm(null)} />;

  const curProject = projects.find(x => x.id === projectId) || status?.projects?.find(x => x.id === projectId);

  return (
    <div className="ba-root">
      {/* ═══ Top Bar ═══ */}
      <div className="ba-top">
        <div className="ba-top-brand"><span className="ba-top-icon">⬡</span> BRANE AGENT</div>
        <select className="ba-top-select" value={projectId || ""} onChange={e => switchProject(e.target.value)}>
          {(projects.length ? projects : status.projects || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {/* Model Selector */}
        <select className="ba-top-select ba-model-select" value={selectedModel || ""} onChange={e => switchModel(e.target.value)}>
          {modelData?.grouped && Object.entries(modelData.grouped).map(([mode, models]) => {
            const labels = { powerful: "⚡ Poderoso", fast: "🚀 Rápido", cheap: "💰 Barato", local: "💻 Local" };
            return <optgroup key={mode} label={labels[mode] || mode}>
              {models.map(m => <option key={m.id} value={m.id}>{m.label} {m.cost === "gratis" ? "(grátis)" : ""}</option>)}
            </optgroup>;
          })}
        </select>
        <div className="ba-top-info">
          <span className="ba-top-dot" /> Online
          <span className="ba-model-badge" title={selectedModel}>{getModelBadge()}</span>
          <span className="ba-top-git">{status.gitLog?.split("\n")?.[0] || ""}</span>
          {context?.stack?.frameworks?.length > 0 && <span className="ba-top-stack">{context.stack.frameworks.join(", ")}</span>}
        </div>
      </div>

      <div className="ba-body">
        {/* ═══ Activity Bar ═══ */}
        <div className="ba-abar">
          {["chat", "files", "tasks", "plan"].map(t => (
            <div key={t} className={`ba-abtn ${activeTab === t ? "on" : ""}`} onClick={() => setActiveTab(t)} title={t}>{ICONS[t]}</div>
          ))}
          <div style={{ flex: 1 }} />
          <div className={`ba-abtn ${showSide ? "on" : ""}`} onClick={() => setShowSide(!showSide)} title="painel lateral">◼</div>
        </div>

        {/* ═══ Main Area ═══ */}
        <div className="ba-main">
          {/* ── Chat ── */}
          {activeTab === "chat" && (
            <div className="ba-panel">
              <div className="ba-ph"><span>{ICONS.chat} Chat com Agente</span><span className="ba-ms">{msgs.length} msg · {getModelBadge()}</span></div>
              <div className="ba-pc" ref={chatRef}>
                {msgs.length === 0 && <div className="ba-empty">Converse com o agente. Modelo ativo: {getModelBadge()}</div>}
                {msgs.map((m, i) => (
                  <div key={i} className={`ba-msg ${m.role}`}>
                    {m.role === "assistant" && <div className="ba-mlabel">⬡ Brane Agent {m._model ? <span className="ba-ms">({m._model.label})</span> : ""}</div>}
                    {typeof m.content === "string" ? renderMsg(m.content) : m.content}
                  </div>
                ))}
                {sending && <div className="ba-msg assistant"><div className="ba-mlabel">⬡ Brane Agent ({getModelBadge()})</div><div className="ba-thinking">⏳ <span>pensando</span></div></div>}
              </div>
              <div className="ba-chat-inp">
                <textarea value={chatMsg} onChange={e => setChatMsg(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }} placeholder="Digite..." rows={1} />
                <button onClick={sendChat} disabled={sending || !chatMsg.trim()} className="ba-send">↵</button>
              </div>
            </div>
          )}

          {/* ── Files + Search ── */}
          {activeTab === "files" && (
            <div className="ba-panel">
              <div className="ba-ph">
                <span>{ICONS.files} Explorador</span>
                <div className="ba-ph-actions">
                  <input className="ba-search-inp" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && doSearch()} placeholder="Buscar arquivos..." />
                  <button className="ba-btn sm" onClick={doSearch} disabled={!searchQuery.trim()}>🔍</button>
                </div>
              </div>
              <div className="ba-pc ba-tree">
                {searchResults.length > 0 ? (
                  <div>{searchResults.map((r, i) => (
                    <div key={i} className="ba-ti" onClick={() => { const rel = pathRelative(r.path, curProject?.root); openFile(rel); }} style={{ paddingLeft: "12px" }}>
                      <span className="ba-ic">📄</span>
                      <span className="ba-tn">{r.path}</span>
                      <span className="ba-ms" style={{ marginLeft: "auto", fontSize: ".5rem" }}>{r.size}b</span>
                    </div>
                  ))}</div>
                ) : tree ? buildTree(tree, "") : <div className="ba-empty">Carregando...</div>}
              </div>
            </div>
          )}

          {/* ── Tasks ── */}
          {activeTab === "tasks" && (
            <div className="ba-panel">
              <div className="ba-ph"><span>{ICONS.tasks} Tarefas</span></div>
              <div className="ba-pc ba-tasks-list">
                {tasks.length === 0 && <div className="ba-empty">Nenhuma tarefa</div>}
                {tasks.filter(t => t.id || t.action).map((t, i) => (
                  <div key={t.id || i} className="ba-ti2">
                    <span className="ba-ts">{t.status === "running" ? "⏳" : t.status === "failed" ? "✗" : "✓"}</span>
                    <span className="ba-tt">{t.time || t.created_at?.slice(11, 19)}</span>
                    <span className="ba-ta">{t.message || t.action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Plan / Agent Mode ── */}
          {activeTab === "plan" && (
            <div className="ba-panel">
              <div className="ba-ph"><span>{ICONS.plan} Agente — Plano de Execução</span>{agentRunning && <span className="ba-ms running">⏳ executando...</span>}</div>
              <div className="ba-pc ba-plan">
                {!agentPlan && !agentRunning && (
                  <div className="ba-empty">
                    <div style={{ marginBottom: ".6rem" }}>Digite a tarefa e escolha o modo:</div>
                    <div className="ba-agent-inp-row">
                      <input className="ba-agent-inp" value={agentInstruction} onChange={e => setAgentInstruction(e.target.value)} onKeyDown={e => e.key === "Enter" && runPowerfulAgent()} placeholder="Ex: Adicione um botão de exportar CSV..." />
                      <button className="ba-act" onClick={runAgent} disabled={agentRunning || !agentInstruction.trim()} style={{ fontSize: ".6rem" }}>🤖 Agente</button>
                      <button className="ba-act" style={{ background: "rgba(124,92,252,.2)", color: "var(--ac)", borderColor: "var(--ac)", fontSize: ".6rem" }} onClick={runPowerfulAgent} disabled={agentRunning || !agentInstruction.trim()}>⚡ Potente</button>
                    </div>
                    <div className="ba-ms" style={{ marginTop: ".4rem" }}>Modelo: {getModelBadge()}</div>
                  </div>
                )}
                {agentRunning && !agentPlan && <div className="ba-empty">⏳ Gerando plano de execução...</div>}
                {agentPlan && agentPlan.map((step, i) => (
                  <div key={i} className={`ba-plan-step ${step._done ? "done" : ""}`}>
                    <span className="ba-ps-num">{step._done ? "✓" : i + 1}</span>
                    <div className="ba-ps-body">
                      <span className="ba-ps-action">{step.action}</span>
                      <span className="ba-ps-file">{step.file}</span>
                      <span className="ba-ps-desc">{step.description}</span>
                      {step.details && <span className="ba-ps-det">{step.details}</span>}
                    </div>
                  </div>
                ))}
                {agentPlan && !agentRunning && (
                  <div className="ba-empty" style={{ color: "var(--gr)", border: "1px solid var(--gr)" }}>
                    ✅ Plano executado com sucesso
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Editor ── */}
          {activeTab === "editor" && (
            <div className="ba-panel">
              <div className="ba-ph">
                <span>{currentFile || "Editor"}</span>
                <div className="ba-ph-actions">
                  {currentFile && fileDirty && <span className="ba-dirty">não salvo</span>}
                  {currentFile && <button className="ba-btn sm" onClick={showDiff}>📋 Diff</button>}
                  {currentFile && <button className="ba-btn sm primary" onClick={saveFile} disabled={!fileDirty}>💾 Salvar</button>}
                </div>
              </div>
              <textarea className="ba-editor-ta" value={fileContent} onChange={e => { setFileContent(e.target.value); setFileDirty(true); }} placeholder="Selecione um arquivo no explorador..." spellCheck={false} />
            </div>
          )}

          {/* ── Diff Viewer ── */}
          {activeTab === "diff" && (
            <div className="ba-panel">
              <div className="ba-ph"><span>📋 Diff: {currentFile}</span><button className="ba-btn sm" onClick={() => setActiveTab("editor")}>✕ Fechar</button></div>
              <div className="ba-pc"><DiffView diff={diffData} /></div>
            </div>
          )}
        </div>

        {/* ═══ Side Panel ═══ */}
        {showSide && <div className="ba-side">
          <div className="ba-side-section">
            <div className="ba-side-h">📜 Regras</div>
            <textarea className="ba-side-rules" value={rules} onChange={e => { setRules(e.target.value); setRulesDirty(true); }} placeholder="Regras do agente..." />
            <button className="ba-side-save" onClick={saveRules} disabled={!rulesDirty}>Salvar</button>
          </div>
          <div className="ba-side-section">
            <div className="ba-side-h">🧠 Contexto do Projeto</div>
            <div className="ba-side-ctx">
              <div><span className="ba-ctx-l">Stack:</span> {context?.stack?.frameworks?.join(", ") || "detectando..."}</div>
              <div><span className="ba-ctx-l">Build:</span> {context?.stack?.buildCmd || "n/a"}</div>
              {context?.structure && <div><span className="ba-ctx-l">Arquivos:</span> {context.structure.length} pastas/arquivos</div>}
              <div><span className="ba-ctx-l">Modelo:</span> {getModelBadge()}</div>
            </div>
          </div>
          <div className="ba-side-section">
            <div className="ba-side-h">📋 Memória ({memory.length})</div>
            <div className="ba-side-mem">
              {memory.length === 0 && <div className="ba-empty" style={{ padding: ".3rem", fontSize: ".6rem" }}>Nenhuma memória salva</div>}
              {memory.slice(0, 10).map(m => <div key={m.id} className="ba-mem-item"><span className="ba-mem-key">{m.key}</span></div>)}
            </div>
          </div>
        </div>}
      </div>

      {/* ═══ Terminal ═══ */}
      <div className="ba-term">
        <div className="ba-term-h"><span>{ICONS.terminal} Terminal</span></div>
        <div className="ba-term-out" ref={termRef} dangerouslySetInnerHTML={{ __html: termOut.join("<br>") }} />
        <div className="ba-term-inp">
          <span className="ba-term-pr">$</span>
          <input value={termInput} onChange={e => setTermInput(e.target.value)} onKeyDown={e => e.key === "Enter" && runTerm()} placeholder="Comando..." spellCheck={false} />
        </div>
      </div>

      {/* ═══ Action Bar ═══ */}
      <div className="ba-actions">
        <button className="ba-act primary" onClick={doBuild} disabled={loading.build}>{loading.build ? "⏳" : "🔨"} Build</button>
        <button className="ba-act green" onClick={doCommit} disabled={loading.commit}>{loading.commit ? "⏳" : "⬆"} Commit + Push</button>
        <button className="ba-act agent" onClick={runAgent} disabled={agentRunning || !agentInstruction.trim()}>{agentRunning ? "⏳" : "🤖"} Agente</button>
        <button className="ba-act" style={{ background: "rgba(124,92,252,.2)", color: "var(--ac)", borderColor: "var(--ac)" }} onClick={runPowerfulAgent} disabled={agentRunning || !agentInstruction.trim()}>{agentRunning ? "⏳" : "⚡"} Modo Potente</button>
        <button className="ba-act" onClick={async () => {
          const rows = await api("GET", `/api/backups?path=${currentFile || ""}`);
          if (rows.length && confirm(`Restaurar backup mais recente de ${currentFile}?`)) {
            const r = await api("POST", "/api/restore", { backupId: rows[0].id });
            if (r.ok) { setFileDirty(true); addTask("Backup restaurado: " + currentFile); }
          }
        }} disabled={!currentFile}>↩ Rollback</button>
        {/* Agent instruction inline */}
        <input className="ba-agent-quick" value={agentInstruction} onChange={e => setAgentInstruction(e.target.value)} onKeyDown={e => e.key === "Enter" && runPowerfulAgent()} placeholder="Tarefa do agente..." />
        <div style={{ flex: 1 }} />
        <button className="ba-act" style={{ color: "var(--red)" }} onClick={() => { sessionStorage.removeItem("ba_pwd"); window.location.reload(); }}>Sair</button>
      </div>
    </div>
  );
}

// Helper to compute relative path
function pathRelative(full, root) {
  if (!root) return full;
  const rel = full.replace(root.replace(/\\/g, "/"), "");
  return rel.startsWith("/") ? rel.slice(1) : rel;
}
