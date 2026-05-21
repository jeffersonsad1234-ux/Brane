import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { generateUE5Export } from "./ue5Generator.js";

const FILE_NAMES = {
  README_UE5: "📖 README_UE5.md — Visão Geral do Projeto",
  GAME_DESIGN: "🎮 GAME_DESIGN.md — Documento de Game Design",
  ASSETS_LIST: "📦 ASSETS_LIST.md — Lista de Assets (Quixel/Fab)",
  BLUEPRINT_STEPS: "🔧 BLUEPRINT_STEPS.md — Implementação Passo a Passo",
};

export default function UnrealExportModal({ project, onClose }) {
  const [activeFile, setActiveFile] = useState("README_UE5");
  const [copied, setCopied] = useState(false);

  const files = useMemo(() => {
    try {
      return generateUE5Export(project);
    } catch {
      return null;
    }
  }, [project]);

  if (!files) {
    return (
      <motion.div className="bs-modal-overlay"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div className="bs-modal bs-modal-detail"
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        >
          <button className="bs-modal-close" onClick={onClose}>✕</button>
          <div className="bs-modal-gen">
            <div style={{ fontSize: "3rem" }}>⚠️</div>
            <h3>Erro ao gerar exportação</h3>
            <p>Não foi possível gerar os documentos UE5 para este projeto.</p>
            <button className="bs-btn bs-btn-secondary" onClick={onClose}>Fechar</button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  const currentContent = files[activeFile] || "";

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    const blob = new Blob([currentContent], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeFile}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    for (const [key, content] of Object.entries(files)) {
      const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.name || "Projeto"}_${key}.md`;
      a.click();
      URL.revokeObjectURL(url);
    }
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
        className="bs-modal ue-modal"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3 }}
      >
        <button className="bs-modal-close" onClick={onClose}>✕</button>

        <div className="ue-header">
          <div className="ue-header-icon">
            <svg width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="none" stroke="#7c5cfc" strokeWidth="2"/><text x="16" y="21" textAnchor="middle" fill="#7c5cfc" fontSize="16" fontWeight="bold">U</text></svg>
          </div>
          <h2>Exportar para Unreal Engine 5</h2>
          <p className="ue-header-sub">
            Documentação profissional gerada por IA para implementar <strong>{project.name}</strong> na UE5.
          </p>
          <div className="ue-header-badge">
            <span>🎯 {project.genre}</span>
            <span>🎨 {project.style}</span>
            <span>💻 {project.platform}</span>
          </div>
        </div>

        <div className="ue-notice">
          <strong>⚠️ A versão web é apenas uma prévia conceitual.</strong>
          O jogo real deve ser desenvolvido na Unreal Engine 5 utilizando os documentos abaixo.
          O Brane Studio gera a documentação e o planejamento — o desenvolvimento é feito no motor profissional da Epic Games.
        </div>

        <div className="ue-tabs">
          {Object.entries(FILE_NAMES).map(([key, label]) => (
            <button
              key={key}
              className={`ue-tab ${activeFile === key ? "active" : ""}`}
              onClick={() => setActiveFile(key)}
            >
              {label.split("—")[0]}
              <span className="ue-tab-sub">{label.split("—")[1]}</span>
            </button>
          ))}
        </div>

        <div className="ue-actions">
          <button className="bs-btn bs-btn-primary" onClick={handleCopy}>
            {copied ? "✅ Copiado!" : "📋 Copiar"}
          </button>
          <button className="bs-btn bs-btn-secondary" onClick={handleDownload}>
            ⬇️ Download .md
          </button>
          <button className="bs-btn bs-btn-ghost" onClick={handleDownloadAll}>
            📦 Download Tudo
          </button>
        </div>

        <div className="ue-preview">
          <pre className="ue-code">{currentContent}</pre>
        </div>

        <div className="ue-footer">
          <p>Gerado por Brane Studio • {new Date().toLocaleDateString()}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
