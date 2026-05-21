import React, { useState } from "react";
import { motion } from "framer-motion";

export default function ProjectDetailModal({ project, onClose, onUpdate }) {
  const [tab, setTab] = useState("overview");
  const [copied, setCopied] = useState(false);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  const toggleCheck = (idx) => {
    const newChecklist = [...project.checklist];
    const item = newChecklist[idx];
    if (item.startsWith("[x]")) newChecklist[idx] = item.replace("[x]", "[ ]");
    else newChecklist[idx] = item.replace("[ ]", "[x]");
    const done = newChecklist.filter(i => i.startsWith("[x]")).length;
    const progress = Math.round((done / newChecklist.length) * 100);
    onUpdate({ ...project, checklist: newChecklist, progress });
  };

  return (
    <motion.div
      className="bs-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        className="bs-modal bs-modal-detail"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <button className="bs-modal-close" onClick={onClose}>✕</button>

        <div className="bs-detail-header">
          <h2>{project.name}</h2>
          <div className="bs-detail-meta">
            <span className="bs-chip">{project.genre}</span>
            <span className="bs-chip">{project.style}</span>
            <span className="bs-chip">{project.platform}</span>
            <span className="bs-chip">{new Date(project.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="bs-detail-tabs">
          {[
            { id: "overview", label: "📋 Visão Geral" },
            { id: "checklist", label: "✅ Checklist" },
            { id: "prompts", label: "📝 Prompts" },
            { id: "export", label: "📤 Exportar" },
          ].map(t => (
            <button key={t.id} className={`bs-detail-tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="bs-detail-content">
          {tab === "overview" && (
            <div className="bs-detail-overview">
              <div className="bs-progress-bar">
                <div className="bs-progress-fill" style={{ width: `${project.progress}%` }} />
                <span>{project.progress}% completo</span>
              </div>
              <p className="bs-detail-desc">{project.description}</p>
              <h4>🏗️ Arquitetura</h4>
              <p>{project.architecture}</p>
              <h4>🗺️ Roadmap</h4>
              <ol className="bs-roadmap-list">
                {project.roadmap.map((r, i) => <li key={i}>{r}</li>)}
              </ol>
              <h4>📦 Assets</h4>
              <ul className="bs-asset-list">
                {project.assets.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          )}

          {tab === "checklist" && (
            <div className="bs-detail-checklist">
              {project.checklist.map((item, i) => {
                const done = item.startsWith("[x]");
                return (
                  <div key={i} className={`bs-check-item ${done ? "done" : ""}`} onClick={() => toggleCheck(i)}>
                    <span className="bs-check-box">{done ? "✅" : "⬜"}</span>
                    <span className="bs-check-text">{item.replace(/^\[.\] /, "")}</span>
                  </div>
                );
              })}
              <div className="bs-check-progress">
                {project.checklist.filter(i => i.startsWith("[x]")).length}/{project.checklist.length} concluídos
              </div>
            </div>
          )}

          {tab === "prompts" && (
            <div className="bs-detail-prompts">
              <p className="bs-detail-hint">Use estes prompts com o Brany Agent ou OpenCode para gerar cada sistema.</p>
              {project.prompts.map((p, i) => (
                <div key={i} className="bs-prompt-item">
                  <span className="bs-prompt-num">{i + 1}</span>
                  <p>{p}</p>
                  <button className="bs-copy-btn" onClick={() => handleCopy(p)} title="Copiar prompt">
                    {copied ? "✅" : "📋"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab === "export" && (
            <div className="bs-detail-export">
              <h4>📤 OpenCode Prompt Completo</h4>
              <p className="bs-detail-hint">Copie este prompt e cole no OpenCode para gerar o jogo automaticamente.</p>
              <pre className="bs-code-block">{project.opencodePrompt}</pre>
              <button className="bs-btn bs-btn-primary" onClick={() => handleCopy(project.opencodePrompt)}>
                {copied ? "✅ Copiado!" : "📋 Copiar Prompt Completo"}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
