import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import UnrealExportModal from "./UnrealExportModal.js";

export default function ProjectDetailModal({ project, onClose, onUpdate }) {
  const [tab, setTab] = useState("overview");
  const [copied, setCopied] = useState(false);
  const [showUE5, setShowUE5] = useState(false);

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
            { id: "ue5", label: "🔷 UE5" },
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

          {tab === "ue5" && (
            <div className="bs-detail-ue5">
              <div className="ue-tab-intro">
                <div className="ue-tab-icon">🔷</div>
                <h3>Exportar para Unreal Engine 5</h3>
                <p>
                  Gere documentos profissionais para implementar <strong>{project.name}</strong> na Unreal Engine 5.
                  Inclui README, Game Design Document, lista de assets (Quixel/Fab) e Blueprint steps.
                </p>
              </div>

              <div className="ue-notice">
                <strong>⚠️ A versão web é apenas uma prévia conceitual.</strong>
                O jogo real deve ser desenvolvido na Unreal Engine 5. A Brany Game Studio AI gera o planejamento
                e a documentação — a implementação é feita no motor profissional da Epic Games.
              </div>

              <button className="bs-btn bs-btn-primary ue-export-btn" onClick={() => setShowUE5(true)}>
                🔷 Gerar Documentação UE5
              </button>

              <div className="ue-tab-features">
                <div className="ue-tab-feature">
                  <span>📖</span>
                  <div>
                    <strong>README_UE5.md</strong>
                    <p>Setup, requisitos, plugins, estrutura de pastas, build</p>
                  </div>
                </div>
                <div className="ue-tab-feature">
                  <span>🎮</span>
                  <div>
                    <strong>GAME_DESIGN.md</strong>
                    <p>Conceito, mecânicas, ambientação, progressão, stack</p>
                  </div>
                </div>
                <div className="ue-tab-feature">
                  <span>📦</span>
                  <div>
                    <strong>ASSETS_LIST.md</strong>
                    <p>Lista completa de assets Quixel Megascans e Fab</p>
                  </div>
                </div>
                <div className="ue-tab-feature">
                  <span>🔧</span>
                  <div>
                    <strong>BLUEPRINT_STEPS.md</strong>
                    <p>10 fases de implementação com Blueprint passo a passo</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {showUE5 && <UnrealExportModal project={project} onClose={() => setShowUE5(false)} />}
      </AnimatePresence>
    </motion.div>
  );
}
