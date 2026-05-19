import React, { useState, useEffect, useRef, useCallback } from "react";
import "./BraneAgent.css";

const API = process.env.REACT_APP_AGENT_API || "http://localhost:3200";
let PASSWORD = sessionStorage.getItem("ba_pwd") || "";

function headers() { return { "Content-Type": "application/json", "x-agent-password": PASSWORD }; }

async function api(method, path, body) {
  const opts = { method, headers: headers() };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(`${API}${path}`, opts);
  if (r.status === 401) { sessionStorage.removeItem("ba_pwd"); window.location.reload(); }
  return r.json();
}

// ── Simple markdown renderer ──
function renderMsg(text) {
  const lines = text.split("\n");
  let inCode = false, codeBuf = [], out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("```")) {
      if (inCode) {
        out.push(<pre key={`c${i}`} className="ba-code-block"><code>{codeBuf.join("\n")}</code></pre>);
        codeBuf = [];
      }
      inCode = !inCode;
      continue;
    }
    if (inCode) { codeBuf.push(line); continue; }
    if (line.startsWith("## ")) { out.push(<div key={i} className="ba-md-h2">{line.slice(3)}</div>); continue; }
    if (line.startsWith("### ")) { out.push(<div key={i} className="ba-md-h3">{line.slice(4)}</div>); continue; }
    if (line.startsWith("- ")) { out.push(<div key={i} className="ba-md-li">• {line.slice(2)}</div>); continue; }
    if (line.startsWith("**") && line.endsWith("**")) { out.push(<div key={i} className="ba-md-bold">{line.slice(2, -2)}</div>); continue; }
    if (line.trim()) out.push(<div key={i} className="ba-md-p">{line}</div>);
    else out.push(<div key={i} className="ba-md-spacer" />);
  }
  if (inCode) out.push(<pre key="cend" className="ba-code-block"><code>{codeBuf.join("\n")}</code></pre>);
  return out.length ? out : text;
}

export default function BraneAgent() {
  const [loggedIn, setLoggedIn] = useState(!!PASSWORD);
  const [loginError, setLoginError] = useState("");
  const [chatMsg, setChatMsg] = useState("");
  const [msgs, setMsgs] = useState([]);
  const [rules, setRules] = useState(localStorage.getItem("ba_rules") || "");
  const [rulesDirty, setRulesDirty] = useState(false);
  const [sending, setSending] = useState(false);
  const [tree, setTree] = useState(null);
  const [currentFile, setCurrentFile] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [fileDirty, setFileDirty] = useState(false);
  const [tab, setTab] = useState("explorer");
  const [termOut, setTermOut] = useState(["> Welcome to Brane Agent terminal"]);
  const [termInput, setTermInput] = useState("");
  const [tasks, setTasks] = useState(JSON.parse(localStorage.getItem("ba_tasks") || "[]"));
  const [status, setStatus] = useState({ gitLog: "", gitStatus: "" });
  const [loading, setLoading] = useState({});

  const chatRef = useRef(null);
  const termRef = useRef(null);
  const editorRef = useRef(null);

  // Auto-scroll chat
  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [msgs]);
  useEffect(() => { if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight; }, [termOut]);

  // Load tree on login
  useEffect(() => {
    if (!loggedIn) return;
    api("GET", "/api/files?depth=2").then(d => { if (d?.name) setTree(d); });
    api("GET", "/api/status").then(d => setStatus(d));
  }, [loggedIn]);

  // ── Login ──
  async function doLogin() {
    const pwd = document.getElementById("ba-pwd-input")?.value;
    if (!pwd) return;
    try {
      const r = await api("POST", "/api/login", { password: pwd });
      if (r.ok) { PASSWORD = pwd; sessionStorage.setItem("ba_pwd", pwd); setLoggedIn(true); setLoginError(""); }
      else setLoginError("Senha incorreta");
    } catch (e) { setLoginError("Erro de conexão com o servidor"); }
  }

  // ── Chat ──
  async function sendChat() {
    const txt = chatMsg.trim();
    if (!txt || sending) return;
    setChatMsg("");
    setSending(true);
    const newMsgs = [...msgs, { role: "user", content: txt }];
    setMsgs(newMsgs);
    addTask("Chat enviado: " + txt.slice(0, 60));
    try {
      const r = await api("POST", "/api/chat", { messages: newMsgs.map(m => ({ role: m.role, content: m.content })), rules });
      setMsgs([...newMsgs, { role: "assistant", content: r.content || r.error || "(no response)" }]);
    } catch (e) { setMsgs([...newMsgs, { role: "assistant", content: "Erro: " + e.message }]); }
    setSending(false);
  }

  function handleChatKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); }
  }

  // ── Rules ──
  function saveRules() {
    localStorage.setItem("ba_rules", rules);
    setRulesDirty(false);
    addTask("Regras salvas");
  }

  // ── File tree ──
  async function loadDir(dir, depth) {
    const d = await api("GET", `/api/files?dir=${encodeURIComponent(dir)}&depth=${depth || 2}`);
    return d;
  }

  function toggleDir(item, pth) {
    if (item.type !== "dir") return;
    if (item.children) { item.children = null; setTree({ ...tree }); return; }
    loadDir(pth).then(d => {
      if (d?.children) { item.children = d.children; setTree({ ...tree }); }
    });
  }

  function buildTree(node, pth) {
    if (!node) return null;
    if (node.type === "file") {
      return (
        <div key={pth} className="ba-tree-item" onClick={() => openFile(pth)} style={{ paddingLeft: "1rem" }}>
          <span className="icon">📄</span>
          <span className="name">{node.name}</span>
        </div>
      );
    }
    const full = pth ? `${pth}/${node.name}` : "";
    return (
      <div key={full || "/"}>
        <div className="ba-tree-item" onClick={() => toggleDir(node, full)}>
          {node.type === "dir" && <span className={`chevron ${node.children ? "open" : ""}`}>▶</span>}
          <span className="icon">{node.children ? "📁" : "📄"}</span>
          <span className="name">{node.name}</span>
        </div>
        {node.children && <div className="ba-tree-depth">{node.children.map(c => buildTree(c, full))}</div>}
      </div>
    );
  }

  // ── File editor ──
  async function openFile(pth) {
    setCurrentFile(pth);
    setFileDirty(false);
    try {
      const r = await api("GET", `/api/files/read?path=${encodeURIComponent(pth)}`);
      setFileContent(r.content || "");
    } catch (e) { setFileContent("// Error loading file"); }
  }

  async function saveFile() {
    if (!currentFile) return;
    try {
      await api("POST", "/api/files/write", { path: currentFile, content: fileContent });
      setFileDirty(false);
      addTask("Arquivo salvo: " + currentFile);
    } catch (e) { alert("Erro ao salvar: " + e.message); }
  }

  // ── Terminal ──
  async function runTerm() {
    const cmd = termInput.trim();
    if (!cmd) return;
    setTermOut(p => [...p, `<span class="prompt">$</span> ${cmd}`]);
    setTermInput("");
    try {
      const r = await api("POST", "/api/terminal", { command: cmd });
      if (r.stdout) setTermOut(p => [...p, r.stdout]);
      if (r.stderr) setTermOut(p => [...p, `<span class="error">${r.stderr}</span>`]);
      if (r.code !== 0) setTermOut(p => [...p, `<span class="error">Exit code: ${r.code}</span>`]);
      else setTermOut(p => [...p, `Exit code: ${r.code}`]);
    } catch (e) { setTermOut(p => [...p, `<span class="error">Error: ${e.message}</span>`]); }
    addTask("Comando: " + cmd.slice(0, 60));
  }

  function handleTermKey(e) {
    if (e.key === "Enter") runTerm();
  }

  // ── Build ──
  async function doBuild() {
    setLoading(p => ({ ...p, build: true }));
    setTermOut(p => [...p, `<span class="prompt">$</span> npm run build`]);
    addTask("Build iniciado");
    try {
      const r = await api("POST", "/api/build");
      if (r.stdout) setTermOut(p => [...p, r.stdout]);
      if (r.stderr) setTermOut(p => [...p, `<span class="error">${r.stderr}</span>`]);
      setTermOut(p => [...p, r.code === 0 ? "✓ Build concluído" : "✗ Build falhou"]);
    } catch (e) { setTermOut(p => [...p, `<span class="error">Error: ${e.message}</span>`]); }
    setLoading(p => ({ ...p, build: false }));
  }

  // ── Commit + Push ──
  async function doCommit() {
    const msg = prompt("Mensagem do commit:");
    if (!msg) return;
    setLoading(p => ({ ...p, commit: true }));
    addTask("Commit: " + msg.slice(0, 60));
    try {
      const r = await api("POST", "/api/commit", { message: msg });
      if (r.ok) {
        setTermOut(p => [...p, "✓ Commit + Push realizado"]);
        api("GET", "/api/status").then(d => setStatus(d));
      } else { setTermOut(p => [...p, `<span class="error">✗ ${r.error}</span>`]); }
    } catch (e) { setTermOut(p => [...p, `<span class="error">Error: ${e.message}</span>`]); }
    setLoading(p => ({ ...p, commit: false }));
  }

  // ── Get diff ──
  async function doDiff() {
    if (!currentFile) return;
    setTermOut(p => [...p, `<span class="prompt">$</span> git diff ${currentFile}`]);
    try {
      const r = await api("GET", `/api/diff?path=${encodeURIComponent(currentFile)}`);
      setTermOut(p => [...p, r.diff || "(no changes)"]);
    } catch (e) { setTermOut(p => [...p, `<span class="error">Error: ${e.message}</span>`]); }
  }

  // ── Tasks ──
  function addTask(action) {
    const t = { time: new Date().toLocaleTimeString(), action };
    setTasks(prev => {
      const next = [t, ...prev].slice(0, 50);
      localStorage.setItem("ba_tasks", JSON.stringify(next));
      return next;
    });
  }

  // ── Login screen ──
  if (!loggedIn) {
    return (
      <div className="ba-root">
        <div className="ba-login">
          <div className="ba-login-title">BRANE AGENT</div>
          <div className="ba-login-sub">Acesso restrito — administrador</div>
          <input id="ba-pwd-input" className="ba-login-input" type="password"
            placeholder="Senha de administrador" onKeyDown={e => e.key === "Enter" && doLogin()} autoFocus />
          <button className="ba-login-btn" onClick={doLogin}>Acessar</button>
          {loginError && <div className="ba-login-error">{loginError}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="ba-root">
      <div className="ba-layout">

        {/* Top Bar */}
        <div className="ba-topbar">
          <div className="ba-topbar-brand">⬡ BRANE AGENT</div>
          <div className="ba-topbar-status">
            <span><span className="ba-topbar-dot" /> Online</span>
            <span title={status.gitLog}>{status.gitLog?.split("\n")?.[0] || ""}</span>
          </div>
        </div>

        {/* ── Chat Panel ── */}
        <div className="ba-panel ba-chat">
          <div className="ba-panel-header">
            <span>Chat com Agente</span>
            <span style={{ fontSize: ".55rem", color: "var(--text-muted)" }}>{msgs.length} msgs</span>
          </div>
          <div className="ba-chat-messages" ref={chatRef}>
            {msgs.length === 0 && (
              <div style={{ padding: "1rem", textAlign: "center", color: "var(--text-muted)", fontSize: ".7rem" }}>
                Converse com o agente. Ele segue as regras definidas no painel à direita.
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={`ba-msg ${m.role === "user" ? "user" : "agent"}`}>
                {m.role === "assistant" && <div className="msg-label">Brane Agent</div>}
                {typeof m.content === "string" ? renderMsg(m.content) : m.content}
              </div>
            ))}
            {sending && <div className="ba-msg agent"><div className="msg-label">Brane Agent</div>⏳ pensando...</div>}
          </div>
          <div className="ba-chat-input-area">
            <textarea className="ba-chat-input" value={chatMsg} onChange={e => setChatMsg(e.target.value)}
              onKeyDown={handleChatKey} placeholder="Digite sua mensagem..." rows={1} />
            <button className="ba-chat-send" onClick={sendChat} disabled={sending || !chatMsg.trim()}>↵</button>
          </div>
        </div>

        {/* ── Center: Files + Editor ── */}
        <div className="ba-panel ba-center">
          <div className="ba-center-tabs">
            <div className={`ba-tab ${tab === "explorer" ? "active" : ""}`} onClick={() => setTab("explorer")}>📁 Explorador</div>
            <div className={`ba-tab ${tab === "editor" ? "active" : ""}`} onClick={() => setTab("editor")}>✏️ Editor</div>
          </div>
          {tab === "explorer" ? (
            <div className="ba-tree">
              {tree ? buildTree(tree, "") : <div style={{ padding: "1rem", textAlign: "center", color: "var(--text-muted)", fontSize: ".7rem" }}>Carregando...</div>}
            </div>
          ) : (
            <div className="ba-editor">
              <div className="ba-editor-toolbar">
                <span className="fp">{currentFile || "Nenhum arquivo selecionado"}</span>
                {currentFile && fileDirty && <span style={{ fontSize: ".55rem", color: "var(--yellow)" }}>não salvo</span>}
                {currentFile && <button className="save" onClick={saveFile} disabled={!fileDirty}>💾 Salvar</button>}
                {currentFile && <button onClick={doDiff}>📋 Diff</button>}
              </div>
              <textarea ref={editorRef} value={fileContent} onChange={e => { setFileContent(e.target.value); setFileDirty(true); }}
                placeholder="Selecione um arquivo no explorador para editar..." spellCheck={false} />
            </div>
          )}
        </div>

        {/* ── Right: Rules + History ── */}
        <div className="ba-panel ba-right">
          <div className="ba-panel-header">
            <span>📜 Regras do Agente</span>
            {rulesDirty && <span style={{ fontSize: ".55rem", color: "var(--yellow)" }}>não salvo</span>}
          </div>
          <div className="ba-rules-editor">
            <textarea value={rules} onChange={e => { setRules(e.target.value); setRulesDirty(true); }}
              placeholder="Escreva as regras que o agente deve seguir...

Exemplo:
- Sempre perguntar antes de modificar arquivos
- Usar português brasileiro
- Não alterar arquivos de API
- Manter estilo de código existente" />
            <button className="ba-rules-save" onClick={saveRules} disabled={!rulesDirty}>Salvar Regras</button>
          </div>
          <div className="ba-panel-header" style={{ borderTop: "1px solid var(--border)" }}>
            <span>📋 Histórico</span>
          </div>
          <div className="ba-task-history">
            {tasks.length === 0 && <div style={{ padding: ".5rem", textAlign: "center", color: "var(--text-muted)", fontSize: ".6rem" }}>Nenhuma tarefa ainda</div>}
            {tasks.map((t, i) => (
              <div key={i} className="ba-task-item"><span className="time">{t.time}</span><span className="action">{t.action}</span></div>
            ))}
          </div>
        </div>

        {/* ── Terminal ── */}
        <div className="ba-terminal">
          <div className="ba-panel-header">
            <span>🖥️ Terminal</span>
          </div>
          <div className="ba-terminal-output" ref={termRef} dangerouslySetInnerHTML={{ __html: termOut.join("<br>") }} />
          <div className="ba-terminal-input-area">
            <span className="ba-terminal-prompt">$</span>
            <input className="ba-terminal-input" value={termInput} onChange={e => setTermInput(e.target.value)}
              onKeyDown={handleTermKey} placeholder="Digite um comando..." spellCheck={false} />
          </div>
          <div className="ba-actions">
            <button className="ba-action-btn primary" onClick={doBuild} disabled={loading.build}>
              {loading.build ? "⏳" : "🔨"} Build
            </button>
            <button className="ba-action-btn green" onClick={doCommit} disabled={loading.commit}>
              {loading.commit ? "⏳" : "⬆"} Commit + Push
            </button>
            <button className="ba-action-btn orange" onClick={() => {
              const msg = prompt("Mensagem para o commit:");
              if (msg) api("POST", "/api/commit", { message: msg }).then(r => {
                if (r.ok) { setTermOut(p => [...p, "✓ Commit + Push realizado"]); api("GET", "/api/status").then(d => setStatus(d)); }
                else setTermOut(p => [...p, `<span class="error">✗ ${r.error}</span>`]);
              });
            }}>⬆ Commit Personalizado</button>
            <div style={{ flex: 1 }} />
            <button className="ba-action-btn" onClick={() => {
              sessionStorage.removeItem("ba_pwd");
              window.location.reload();
            }} style={{ color: "var(--red)" }}>Sair</button>
          </div>
        </div>

      </div>
    </div>
  );
}
