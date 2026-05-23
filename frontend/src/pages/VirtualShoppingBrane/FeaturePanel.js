import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import F from "./featureData.js";

function Section({ title, children }) {
  return (
    <div className="bs-fp-section">
      <h4 className="bs-fp-section-title">{title}</h4>
      {children}
    </div>
  );
}

export default function FeaturePanel({ featureKey, onClose }) {
  const data = F[featureKey];
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const panelRef = useRef(null);

  const handleGenerate = () => {
    if (generated) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setGenerated(true);
    }, 1200);
  };

  useEffect(() => {
    if (panelRef.current) panelRef.current.scrollTop = 0;
  }, [activeTab]);

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="bs-fp-overview">
            <p className="bs-fp-desc">{data.description}</p>
            <div className="bs-fp-systems">
              {data.systems.map((s, i) => (
                <span key={i} className="bs-chip">{s}</span>
              ))}
            </div>
          </div>
        );
      case "roadmap":
        return (
          <ul className="bs-fp-list">
            {data.roadmap.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        );
      case "script":
        return (
          <pre className="bs-fp-code"><code>{data.script}</code></pre>
        );
      case "architecture":
        return <p className="bs-fp-text">{data.architecture}</p>;
      case "checklist":
        return (
          <ul className="bs-fp-checklist">
            {data.checklist.map((c, i) => (
              <li key={i} className="bs-fp-check-item">
                <span className="bs-fp-check-box">{c.startsWith("[x]") ? "☑" : "⬜"}</span>
                <span>{c.replace(/^\[.\] /, "")}</span>
              </li>
            ))}
          </ul>
        );
      case "ue5":
        return (
          <ul className="bs-fp-list">
            {data.ue5.map((u, i) => <li key={i}>{u}</li>)}
          </ul>
        );
      case "prompts":
        return (
          <div className="bs-fp-prompts">
            {data.prompts.map((p, i) => (
              <div key={i} className="bs-fp-prompt-item">
                <span className="bs-fp-prompt-num">{i + 1}</span>
                <p>{p}</p>
              </div>
            ))}
          </div>
        );
      case "opencode":
        return (
          <div className="bs-fp-prompts">
            {data.opencode.map((o, i) => (
              <div key={i} className="bs-fp-prompt-item">
                <span className="bs-fp-prompt-num">{i + 1}</span>
                <p>{o}</p>
              </div>
            ))}
          </div>
        );
      default:
        return null;
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
        className="bs-modal bs-modal-detail bs-fp-modal"
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        transition={{ duration: 0.3 }}
      >
        <button className="bs-modal-close" onClick={onClose}>✕</button>

        <div className="bs-detail-header">
          <h2>{data.icon || "⚙️"} {data.name}</h2>
          <div className="bs-detail-meta">
            {data.systems.slice(0, 4).map((s, i) => (
              <span key={i} className="bs-chip">{s}</span>
            ))}
          </div>
        </div>

        <div className="bs-detail-tabs">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`bs-detail-tab ${activeTab === t.id ? "active" : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="bs-detail-content" ref={panelRef}>
          {!generated ? (
            <div className="bs-fp-gen-placeholder">
              <div className="bs-fp-gen-icon">✨</div>
              <h3>Pronto para gerar?</h3>
              <p>Clique abaixo para gerar o conteúdo completo deste sistema com IA.</p>
              <button
                className="bs-btn bs-btn-primary"
                onClick={handleGenerate}
                disabled={loading}
              >
                {loading ? (
                  <><span className="bs-fp-spinner" /> Gerando...</>
                ) : (
                  "⚡ Gerar Conteúdo"
                )}
              </button>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderTabContent()}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
