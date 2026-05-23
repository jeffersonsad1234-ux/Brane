import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const THEME = {
  bg: "#0a0a0a",
  surface: "#0c0c0c",
  surface2: "#111111",
  sidebar: "#0e0e0e",
  activity: "#0c0c0c",
  tab: "#1a1a1a",
  tabActive: "#0a0a0a",
  status: "#007acc",
  border: "rgba(255,255,255,0.06)",
  text: "rgba(255,255,255,0.7)",
  textDim: "rgba(255,255,255,0.35)",
  textMuted: "rgba(255,255,255,0.2)",
  accent: "rgba(59,130,246,0.6)",
  accentBg: "rgba(59,130,246,0.1)",
  green: "rgba(16,185,129,0.7)",
  greenBg: "rgba(16,185,129,0.12)",
};

const FILES = {
  "src/App.js": `import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import "./styles.css";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  );
}`,
  "src/index.js": `import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

const root = ReactDOM.createRoot(
  document.getElementById("root")
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
  "src/styles.css": `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont,
    "Segoe UI", Roboto, sans-serif;
  background: #0a0a0a;
  color: #e0e0e0;
  line-height: 1.6;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}`,
  "package.json": `{
  "name": "branpy-app",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "framer-motion": "^11.0.0"
  }
}`,
  "README.md": `# BRANPY App

Welcome to the BRANPY ecosystem.
A next-gen development platform for
building AI-powered applications.

## Getting Started

\`\`\`bash
npm install
npm start
\`\`\`

## Features

- AI-powered code generation
- Real-time collaboration
- Built-in analytics
- One-click deployment

## License

MIT`,
};

const FILE_TREE = {
  src: {
    "App.js": null,
    "index.js": null,
    "styles.css": null,
  },
  "package.json": null,
  "README.md": null,
};

const FILE_ICONS = {
  "App.js": "⚛️",
  "index.js": "📄",
  "styles.css": "🎨",
  "package.json": "📦",
  "README.md": "📝",
};

function TreeItem({ name, children, depth }) {
  const [open, setOpen] = useState(true);
  const isDir = !!children;
  return (
    <div>
      <div
        onClick={() => isDir && setOpen(!open)}
        style={{
          paddingLeft: 8 + depth * 16,
          height: 26,
          display: "flex",
          alignItems: "center",
          gap: 4,
          cursor: isDir ? "pointer" : "default",
          fontSize: 12,
          color: THEME.textDim,
          userSelect: "none",
        }}
        className="cs-hover-item"
      >
        {isDir ? (
          <span style={{ fontSize: 8, width: 12, color: THEME.textMuted, transform: `rotate(${open ? 90 : 0}deg)`, transition: "transform 0.15s" }}>
            ▶
          </span>
        ) : (
          <span style={{ width: 12, fontSize: 10, textAlign: "center" }}>
            📄
          </span>
        )}
        {isDir && (
          <span style={{ fontSize: 11, marginRight: 2 }}>{open ? "📂" : "📁"}</span>
        )}
        <span style={{ fontSize: 12, color: isDir ? THEME.text : THEME.textDim, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {name}
        </span>
      </div>
      <AnimatePresence>
        {isDir && open && children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: "hidden" }}
          >
            {Object.entries(children).map(([childName, child]) => (
              <TreeItem key={childName} name={childName} children={child} depth={depth + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Sidebar({ activeFile, onFileClick, sidebarView, onSidebarView }) {
  const views = [
    { id: "files", icon: "📁", label: "Explorer" },
    { id: "search", icon: "🔍", label: "Search" },
    { id: "git", icon: "🔀", label: "Source Control" },
    { id: "extensions", icon: "🧩", label: "Extensions" },
  ];

  const renderContent = () => {
    switch (sidebarView) {
      case "files":
        return (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div style={{ height: 32, display: "flex", alignItems: "center", padding: "0 16px", borderBottom: `1px solid ${THEME.border}`, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: THEME.textMuted }}>
              Explorer
            </div>
            <div style={{ flex: 1, overflow: "auto", padding: "4px 0" }}>
              {Object.entries(FILE_TREE).map(([name, children]) => {
                if (children === null) {
                  return (
                    <div
                      key={name}
                      onClick={() => onFileClick(name)}
                      style={{
                        paddingLeft: 16,
                        height: 26,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        cursor: "pointer",
                        fontSize: 12,
                        color: activeFile === name ? THEME.text : THEME.textDim,
                        background: activeFile === name ? "rgba(255,255,255,0.04)" : "transparent",
                      }}
                      className="cs-hover-item"
                    >
                      <span style={{ fontSize: 12 }}>{FILE_ICONS[name] || "📄"}</span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
                    </div>
                  );
                }
                return <TreeItem key={name} name={name} children={children} depth={0} />;
              })}
            </div>
          </div>
        );
      case "search":
        return (
          <div style={{ padding: 12, color: THEME.textDim, fontSize: 12 }}>
            <div style={{ padding: "6px 10px", background: THEME.surface2, borderRadius: 4, border: `1px solid ${THEME.border}`, color: THEME.textMuted, marginBottom: 12 }}>
              Search files...
            </div>
            <div style={{ textAlign: "center", marginTop: 24, color: THEME.textMuted }}>
              No results
            </div>
          </div>
        );
      case "git":
        return (
          <div style={{ padding: 12, color: THEME.textDim, fontSize: 12 }}>
            <div style={{ textAlign: "center", marginTop: 24, color: THEME.textMuted }}>
              No changes yet
            </div>
          </div>
        );
      case "extensions":
        return (
          <div style={{ padding: 12, color: THEME.textDim, fontSize: 12 }}>
            <div style={{ textAlign: "center", marginTop: 24, color: THEME.textMuted }}>
              Browse extensions
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ width: 48, background: THEME.activity, borderRight: `1px solid ${THEME.border}`, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 4, flexShrink: 0 }}>
      {views.map((v) => (
        <div
          key={v.id}
          onClick={() => { onSidebarView(v.id); }}
          title={v.label}
          style={{
            width: 44,
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: 18,
            borderRadius: 6,
            marginBottom: 2,
            background: sidebarView === v.id ? "rgba(255,255,255,0.06)" : "transparent",
            color: sidebarView === v.id ? THEME.text : THEME.textMuted,
            position: "relative",
          }}
          className="cs-hover-activity"
        >
          {v.icon}
          {sidebarView === v.id && (
            <div style={{ position: "absolute", left: 0, top: 8, bottom: 8, width: 2, background: THEME.accent, borderRadius: 1 }} />
          )}
        </div>
      ))}
      <div style={{ flex: 1 }} />
      <div
        title="Settings"
        style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 18, color: THEME.textMuted, borderRadius: 6 }}
        className="cs-hover-activity"
      >
        ⚙️
      </div>
    </div>
  );
}

function EditorTab({ file, active, onSelect, onClose }) {
  return (
    <motion.div
      layout
      onClick={onSelect}
      style={{
        height: 34,
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "0 12px",
        fontSize: 12,
        borderRight: `1px solid ${THEME.border}`,
        background: active ? THEME.bg : THEME.tab,
        color: active ? THEME.text : THEME.textDim,
        cursor: "pointer",
        flexShrink: 0,
        borderBottom: active ? `2px solid ${THEME.accent}` : "2px solid transparent",
      }}
      className="cs-hover-tab"
    >
      <span style={{ fontSize: 11 }}>{FILE_ICONS[file] || "📄"}</span>
      <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file}</span>
      <span
        onClick={(e) => { e.stopPropagation(); onClose(file); }}
        style={{
          width: 18,
          height: 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 4,
          fontSize: 9,
          color: THEME.textMuted,
          opacity: 0,
          cursor: "pointer",
          transition: "all 0.12s",
        }}
        className="cs-tab-close"
      >
        ✕
      </span>
    </motion.div>
  );
}

function TerminalPanel({ collapsed, onToggle, tab, onTabChange }) {
  const [lines, setLines] = useState([
    { text: "BRANPY Code Studio v1.0.0", color: THEME.green },
    { text: "Node.js v20.11.0 — Ready", color: "rgba(96,165,250,0.5)" },
    { text: "$ npm start", color: THEME.textDim },
  ]);
  const [input, setInput] = useState("");
  const terminalRef = useRef(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  const handleCommand = useCallback((cmd) => {
    const cmds = {
      help: "Available: start, build, test, lint, clear, help",
      start: "Starting dev server on port 3000...\n> Ready at http://localhost:3000",
      build: "Building for production...\n> Compiled successfully in 3.2s",
      test: "Running test suite...\n> PASS  src/App.test.js (0.8s)\n> 1 test passed",
      lint: "Running linter...\n> No issues found (0 warnings)",
      clear: "__clear__",
    };
    const reply = cmds[cmd.trim().toLowerCase()] || `zsh: command not found: ${cmd}`;
    setLines((prev) => {
      const next = [...prev, { text: `$ ${cmd}`, color: "rgba(255,255,255,0.4)" }];
      if (reply === "__clear__") return [];
      return [...next, ...reply.split("\n").map((l) => ({
        text: l,
        color: l.startsWith(">") ? THEME.green : THEME.textDim,
      }))];
    });
  }, []);

  const bottomTabs = [
    { id: "terminal", label: "Terminal" },
    { id: "problems", label: "Problems" },
    { id: "output", label: "Output" },
    { id: "debug", label: "Debug Console" },
  ];

  return (
    <motion.div
      animate={{ height: collapsed ? 28 : 200 }}
      style={{
        flexShrink: 0,
        borderTop: `1px solid ${THEME.border}`,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: THEME.surface,
      }}
    >
      <div style={{ height: 28, display: "flex", alignItems: "center", borderBottom: `1px solid ${THEME.border}`, flexShrink: 0, paddingLeft: 0 }}>
        {bottomTabs.map((t) => (
          <div
            key={t.id}
            onClick={() => onTabChange(t.id)}
            style={{
              height: 28,
              display: "flex",
              alignItems: "center",
              padding: "0 14px",
              fontSize: 11,
              cursor: "pointer",
              color: tab === t.id ? THEME.text : THEME.textDim,
              background: tab === t.id ? THEME.bg : "transparent",
              borderBottom: tab === t.id ? `2px solid ${THEME.accent}` : "2px solid transparent",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
            className="cs-hover-tab"
          >
            {t.label}
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <div
          onClick={onToggle}
          style={{ padding: "0 12px", cursor: "pointer", fontSize: 10, color: THEME.textMuted }}
          className="cs-hover-item"
        >
          {collapsed ? "▲" : "▼"}
        </div>
      </div>
      {!collapsed && (
        <div
          ref={terminalRef}
          style={{
            flex: 1,
            overflow: "auto",
            padding: "8px 12px",
            fontFamily: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', Consolas, monospace",
            fontSize: 12,
            lineHeight: 1.6,
            background: "#080808",
          }}
        >
          {lines.map((l, i) => (
            <div key={i} style={{ color: l.color, whiteSpace: "pre-wrap" }}>{l.text}</div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
            <span style={{ color: THEME.green, fontSize: 12 }}>$</span>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { handleCommand(input); setInput(""); }
              }}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: THEME.textDim,
                fontSize: 12,
                fontFamily: "inherit",
              }}
              placeholder="Type a command..."
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}

function StatusBar({ activeTab, openTabs }) {
  const gitBranch = "main";
  const cursorPos = { line: 1, col: 1 };
  const encoding = "UTF-8";
  const language = activeTab ? activeTab.split(".").pop().toUpperCase() : "Plain Text";

  return (
    <div
      style={{
        height: 22,
        background: THEME.status,
        display: "flex",
        alignItems: "center",
        padding: "0 10px",
        fontSize: 11,
        color: "#fff",
        flexShrink: 0,
        gap: 16,
        userSelect: "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }} className="cs-hover-status">
        <span style={{ fontSize: 10 }}>🔀</span>
        <span>{gitBranch}</span>
      </div>
      <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
        <span style={{ opacity: 0.7 }}>✕</span>
        <span style={{ opacity: 0.7 }}>0</span>
        <span style={{ opacity: 0.5, margin: "0 1px" }}>⚠</span>
        <span style={{ opacity: 0.7 }}>0</span>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ opacity: 0.8, cursor: "pointer" }} className="cs-hover-status">
          {activeTab ? `Ln ${cursorPos.line}, Col ${cursorPos.col}` : "--"}
        </span>
        <span style={{ opacity: 0.6 }}>{encoding}</span>
        <span style={{ opacity: 0.8, cursor: "pointer" }} className="cs-hover-status">
          {language}
        </span>
        <span style={{ opacity: 0.5, fontSize: 10 }}>☰</span>
      </div>
    </div>
  );
}

export default function CodeStudio() {
  const [openTabs, setOpenTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [terminalOpen, setTerminalOpen] = useState(true);
  const [running, setRunning] = useState(false);
  const [sidebarView, setSidebarView] = useState("files");
  const [bottomTab, setBottomTab] = useState("terminal");

  const handleFileClick = useCallback((file) => {
    setOpenTabs((prev) => {
      if (prev.includes(file)) return prev;
      return [...prev, file];
    });
    setActiveTab(file);
  }, []);

  const handleTabClose = useCallback((file) => {
    setOpenTabs((prev) => {
      const next = prev.filter((t) => t !== file);
      if (activeTab === file) {
        const idx = prev.indexOf(file);
        setActiveTab(next[Math.min(idx, next.length - 1)] || null);
      }
      return next;
    });
  }, [activeTab]);

  const handleRun = useCallback(async () => {
    setRunning(true);
    if (!terminalOpen) setTerminalOpen(true);
    if (bottomTab !== "terminal") setBottomTab("terminal");
    await new Promise((r) => setTimeout(r, 1800));
    setRunning(false);
  }, [terminalOpen, bottomTab]);

  const content = activeTab ? FILES[activeTab] || "// File not found" : "";
  const lines = content ? content.split("\n") : [];
  const lineDigits = String(lines.length).length;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: THEME.bg, color: THEME.text, fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}>
      {/* Menu bar */}
      <div style={{ height: 28, display: "flex", alignItems: "center", padding: "0 12px", background: THEME.surface, borderBottom: `1px solid ${THEME.border}`, flexShrink: 0, gap: 6, fontSize: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 11, color: THEME.textDim, marginRight: 12, letterSpacing: "0.05em" }}>BRANPY</span>
        {["File", "Edit", "Selection", "View", "Go", "Run", "Terminal", "Help"].map((m) => (
          <span
            key={m}
            style={{ padding: "2px 8px", cursor: "pointer", color: THEME.textDim, borderRadius: 4, fontSize: 12 }}
            className="cs-hover-menuitem"
          >
            {m}
          </span>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleRun}
            disabled={running}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "2px 10px",
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 500,
              cursor: running ? "not-allowed" : "pointer",
              background: running ? "transparent" : THEME.greenBg,
              color: running ? THEME.textMuted : THEME.green,
              border: running ? `1px solid ${THEME.border}` : "none",
              fontFamily: "inherit",
            }}
          >
            {running ? (
              <>
                <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ fontSize: 11 }}>◌</motion.span>
                Running...
              </>
            ) : (
              <>
                <span style={{ fontSize: 11 }}>▶</span>
                Run
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {/* Activity bar + Sidebar */}
        <Sidebar
          activeFile={activeTab}
          onFileClick={handleFileClick}
          sidebarView={sidebarView}
          onSidebarView={setSidebarView}
        />

        {/* Tab bar + Editor */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Tabs bar */}
          <div style={{ height: 34, display: "flex", alignItems: "stretch", overflowX: "auto", background: THEME.tab, borderBottom: `1px solid ${THEME.border}`, flexShrink: 0 }} className="cs-scrollbar">
            <AnimatePresence mode="popLayout">
              {openTabs.map((file) => (
                <EditorTab key={file} file={file} active={file === activeTab} onSelect={() => setActiveTab(file)} onClose={handleTabClose} />
              ))}
            </AnimatePresence>
            {openTabs.length === 0 && (
              <div style={{ display: "flex", alignItems: "center", padding: "0 14px", fontSize: 12, color: THEME.textMuted }}>
                Select a file from the explorer
              </div>
            )}
          </div>

          {/* Code area */}
          <div style={{ flex: 1, overflow: "auto", background: THEME.bg, position: "relative", fontFamily: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', Consolas, monospace" }} className="cs-scrollbar">
            {activeTab && content ? (
              <div style={{ display: "flex", minHeight: "100%" }}>
                {/* Line numbers */}
                <div
                  style={{
                    flexShrink: 0,
                    textAlign: "right",
                    userSelect: "none",
                    padding: "12px 0",
                    minWidth: 12 + lineDigits * 10,
                    borderRight: `1px solid ${THEME.border}`,
                    background: THEME.surface,
                  }}
                >
                  {lines.map((_, i) => (
                    <div key={i} style={{ padding: "0 10px", fontSize: 11, lineHeight: 1.6, color: THEME.textMuted }}>
                      {String(i + 1).padStart(lineDigits, " ")}
                    </div>
                  ))}
                </div>
                {/* Code */}
                <div style={{ flex: 1, padding: "12px 16px" }}>
                  {lines.map((line, i) => (
                    <div key={i} style={{ whiteSpace: "pre", fontSize: 12, lineHeight: 1.6, color: activeTab?.endsWith(".js") ? "rgba(255,255,255,0.55)" : THEME.textDim }}>
                      {line || "\u00A0"}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: THEME.textMuted }}>
                <div style={{ fontSize: 32, opacity: 0.3 }}>{"</>"}</div>
                <div style={{ fontSize: 12 }}>Open a file from the explorer to start editing</div>
                <div style={{ fontSize: 11, color: THEME.textMuted, opacity: 0.5 }}>BRANPY Code Studio v1.0.0</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom panel */}
      <TerminalPanel
        collapsed={!terminalOpen}
        onToggle={() => setTerminalOpen((t) => !t)}
        tab={bottomTab}
        onTabChange={setBottomTab}
      />

      {/* Status Bar */}
      <StatusBar activeTab={activeTab} openTabs={openTabs} />

      {/* Styles */}
      <style>{`
        .cs-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .cs-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .cs-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 4px; }
        .cs-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
        .cs-hover-item:hover { background: rgba(255,255,255,0.03); }
        .cs-hover-activity:hover { background: rgba(255,255,255,0.04); }
        .cs-hover-tab:hover { background: rgba(255,255,255,0.02); }
        .cs-hover-menuitem:hover { background: rgba(255,255,255,0.06); }
        .cs-hover-status:hover { background: rgba(0,0,0,0.15); }
        .cs-tab-close { opacity: 0 !important; }
        .cs-hover-tab:hover .cs-tab-close { opacity: 1 !important; }
        input::placeholder { color: rgba(255,255,255,0.12); }
      `}</style>
    </div>
  );
}
