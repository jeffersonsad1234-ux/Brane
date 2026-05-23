import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

const TreeItem = ({ name, children, depth }) => {
  const [open, setOpen] = useState(false);
  const isDir = !!children;
  return (
    <div>
      <button
        onClick={() => isDir && setOpen(!open)}
        className="w-full flex items-center gap-2 px-2 py-1 text-left transition-colors cursor-pointer"
        style={{ paddingLeft: 12 + depth * 14, color: "rgba(255,255,255,0.35)" }}
        onMouseEnter={(e) => { if (!isDir) e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}
        onMouseLeave={(e) => { if (!isDir) e.currentTarget.style.color = "rgba(255,255,255,0.35)"; }}
      >
        {isDir && (
          <motion.span animate={{ rotate: open ? 90 : 0 }} className="text-[8px] flex-shrink-0" style={{ color: "rgba(255,255,255,0.15)" }}>
            ▶
          </motion.span>
        )}
        {!isDir && <span className="text-[10px] w-3 flex-shrink-0" style={{ color: "rgba(59,130,246,0.5)" }}>📄</span>}
        {isDir && <span className="text-[10px] w-3 flex-shrink-0">{open ? "📂" : "📁"}</span>}
        <span className="text-[11px] truncate">{name}</span>
      </button>
      <AnimatePresence>
        {isDir && open && children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {Object.entries(children).map(([childName, child]) => (
              <TreeItem key={childName} name={childName} children={child} depth={depth + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
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

function FileExplorer({ onFileClick, activeFile }) {
  const renderTree = (tree, depth = 0) => {
    return Object.entries(tree).map(([name, children]) => {
      if (children === null) {
        const fullPath = name;
        return (
          <button
            key={name}
            onClick={() => onFileClick(fullPath)}
            className="w-full flex items-center gap-2 px-2 py-1 text-left transition-colors cursor-pointer"
            style={{
              paddingLeft: 12 + depth * 14,
              color: activeFile === fullPath ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.35)",
              background: activeFile === fullPath ? "rgba(255,255,255,0.06)" : "transparent",
            }}
            onMouseEnter={(e) => { if (activeFile !== name) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
            onMouseLeave={(e) => { if (activeFile !== name) e.currentTarget.style.background = "transparent"; }}
          >
            <span className="text-[10px] w-3 flex-shrink-0" style={{ color: "rgba(59,130,246,0.5)" }}>📄</span>
            <span className="text-[11px] truncate">{name}</span>
          </button>
        );
      }
      return <TreeItem key={name} name={name} children={children} depth={depth} />;
    });
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "#0c0c0c" }}>
      <div className="h-9 flex items-center px-3 border-b border-white/[0.06] flex-shrink-0">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: "rgba(255,255,255,0.2)" }}>Explorer</span>
      </div>
      <div className="flex-1 overflow-y-auto py-1 scrollbar-thin">
        {renderTree(FILE_TREE)}
      </div>
    </div>
  );
}

function EditorTab({ file, active, onSelect, onClose }) {
  return (
    <motion.button
      layout
      onClick={onSelect}
      className="flex items-center gap-2 h-9 px-3 text-[11px] border-r border-white/[0.06] transition-colors group cursor-pointer flex-shrink-0"
      style={{
        background: active ? "rgba(255,255,255,0.04)" : "transparent",
        color: active ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)",
        borderBottom: active ? "2px solid rgba(59,130,246,0.6)" : "2px solid transparent",
      }}
    >
      <span>📄</span>
      <span className="truncate max-w-[120px]">{file}</span>
      <span
        onClick={(e) => { e.stopPropagation(); onClose(file); }}
        className="ml-1 w-4 h-4 flex items-center justify-center rounded text-[9px] opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all cursor-pointer"
        style={{ color: "rgba(255,255,255,0.25)" }}
      >
        ✕
      </span>
    </motion.button>
  );
}

function TerminalPanel({ collapsed, onToggle }) {
  const [lines, setLines] = useState([
    { text: "BRANPY Code Studio v1.0.0", color: "rgba(16,185,129,0.6)" },
    { text: "Node.js v20.11.0 — Ready", color: "rgba(96,165,250,0.5)" },
    { text: "$ npm start", color: "rgba(255,255,255,0.3)" },
  ]);
  const [input, setInput] = useState("");

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
      return [...next, ...reply.split("\n").map((l) => ({ text: l, color: l.startsWith(">") ? "rgba(16,185,129,0.5)" : "rgba(255,255,255,0.3)" }))];
    });
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleCommand(input);
      setInput("");
    }
  };

  return (
    <motion.div
      animate={{ height: collapsed ? 32 : 180 }}
      className="flex-shrink-0 border-t border-white/[0.06] flex flex-col overflow-hidden"
      style={{ background: "#0a0a0a" }}
    >
      <div className="h-8 flex items-center px-3 gap-2 border-b border-white/[0.06] flex-shrink-0">
        <button
          onClick={onToggle}
          className="text-[9px] transition-colors cursor-pointer"
          style={{ color: "rgba(255,255,255,0.2)", background: "none", border: "none" }}
        >
          {collapsed ? "▲ Terminal" : "▼ Terminal"}
        </button>
        <div className="flex-1" />
        <span className="text-[8px]" style={{ color: "rgba(255,255,255,0.08)" }}>bash</span>
      </div>
      {!collapsed && (
        <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px] leading-relaxed scrollbar-thin" style={{ background: "#080808" }}>
          {lines.map((l, i) => (
            <div key={i} style={{ color: l.color }}>{l.text}</div>
          ))}
          <div className="flex items-center gap-1 mt-1">
            <span style={{ color: "rgba(16,185,129,0.6)" }}>$</span>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent outline-none text-[11px]"
              style={{ color: "rgba(255,255,255,0.4)" }}
              placeholder="Type a command (help, start, build, test, lint)..."
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function CodeStudio() {
  const [openTabs, setOpenTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [terminalOpen, setTerminalOpen] = useState(true);
  const [running, setRunning] = useState(false);

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
    await new Promise((r) => setTimeout(r, 1800));
    setRunning(false);
  }, []);

  const content = activeTab ? FILES[activeTab] || "// File not found" : "";
  const lines = content ? content.split("\n") : [];
  const lineDigits = String(lines.length).length;

  return (
    <div className="h-full flex flex-col" style={{ background: "#0a0a0a", color: "white" }}>
      {/* Top bar */}
      <div className="h-10 flex items-center px-4 border-b border-white/[0.06] flex-shrink-0" style={{ background: "#0c0c0c" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded flex items-center justify-center text-[10px]" style={{ background: "rgba(59,130,246,0.15)", color: "rgba(59,130,246,0.7)" }}>
            {"</>"}
          </div>
          <span className="text-[11px] font-bold tracking-tight" style={{ color: "rgba(255,255,255,0.4)" }}>Code Studio</span>
        </div>
        <div className="flex-1" />
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleRun}
          disabled={running}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all cursor-pointer"
          style={{
            background: running ? "rgba(16,185,129,0.08)" : "rgba(16,185,129,0.12)",
            color: running ? "rgba(16,185,129,0.4)" : "rgba(16,185,129,0.7)",
            border: "none",
          }}
        >
          {running ? (
            <>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="text-[11px]"
              >
                ◌
              </motion.span>
              Running...
            </>
          ) : (
            <>
              <span className="text-[11px]">▶</span>
              Run
            </>
          )}
        </motion.button>
      </div>

      {/* Main area */}
      <div className="flex-1 flex min-h-0">
        {/* File explorer */}
        <div className="w-[200px] flex-shrink-0 border-r border-white/[0.06]" style={{ background: "#0c0c0c" }}>
          <FileExplorer onFileClick={handleFileClick} activeFile={activeTab} />
        </div>

        {/* Editor area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Tabs */}
          <div className="h-9 flex items-stretch overflow-x-auto border-b border-white/[0.06] flex-shrink-0 scrollbar-thin" style={{ background: "#0c0c0c" }}>
            <AnimatePresence mode="popLayout">
              {openTabs.map((file) => (
                <EditorTab key={file} file={file} active={file === activeTab} onSelect={() => setActiveTab(file)} onClose={handleTabClose} />
              ))}
            </AnimatePresence>
            {openTabs.length === 0 && (
              <div className="flex items-center px-3 text-[11px]" style={{ color: "rgba(255,255,255,0.12)" }}>
                Select a file from the explorer
              </div>
            )}
          </div>

          {/* Code area */}
          <div className="flex-1 overflow-auto font-mono text-[12px] leading-[1.7] scrollbar-thin relative" style={{ background: "#080808" }}>
            {activeTab && content ? (
              <div className="flex min-h-full">
                {/* Line numbers */}
                <div className="flex-shrink-0 text-right select-none py-3" style={{ minWidth: 12 + lineDigits * 10, color: "rgba(255,255,255,0.12)", borderRight: "1px solid rgba(255,255,255,0.03)" }}>
                  {lines.map((_, i) => (
                    <div key={i} className="px-2 text-[10px] leading-[1.7]" style={{ color: "rgba(255,255,255,0.1)" }}>
                      {String(i + 1).padStart(lineDigits, " ")}
                    </div>
                  ))}
                </div>
                {/* Code */}
                <div className="flex-1 py-3 px-4" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {lines.map((line, i) => (
                    <div key={i} className="whitespace-pre leading-[1.7] text-[12px]">
                      {line || "\u00A0"}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-3" style={{ color: "rgba(255,255,255,0.08)" }}>
                <div className="text-3xl opacity-30">{"</>"}</div>
                <div className="text-[11px]">Open a file from the explorer to start editing</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Terminal */}
      <TerminalPanel collapsed={!terminalOpen} onToggle={() => setTerminalOpen((t) => !t)} />
    </div>
  );
}
