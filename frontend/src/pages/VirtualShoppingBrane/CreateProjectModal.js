import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateProject } from "./promptGen.js";

const GENRES = ["FPS", "Survival", "RPG", "Mundo Aberto", "Terror", "Corrida", "Plataforma", "Estratégia", "Battle Royale", "MMO"];
const STYLES = ["Realista", "Pixel Art", "Low Poly", "Cartoon", "Dark/Neon", "Anime"];
const PLATFORMS = ["PC", "Mobile", "Console", "Web"];

export default function CreateProjectModal({ onClose, onSave }) {
  const [name, setName] = useState("");
  const [genre, setGenre] = useState("");
  const [style, setStyle] = useState("");
  const [platform, setPlatform] = useState("");
  const [description, setDescription] = useState("");
  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);

  const handleCreate = () => {
    if (!name.trim()) return;
    setGenerating(true);
    // Generate project structure
    const gen = generateProject(description || name);
    const project = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: name.trim(),
      genre: genre || gen.type,
      style: style || gen.style,
      platform: platform || gen.platform,
      description: description || gen.description,
      createdAt: Date.now(),
      roadmap: gen.roadmap,
      architecture: gen.architecture,
      checklist: gen.checklist,
      assets: gen.assets,
      prompts: gen.prompts,
      systems: gen.features,
      opencodePrompt: gen.opencodePrompt,
      progress: 0,
      status: "draft",
    };
    setTimeout(() => {
      onSave(project);
      setGenerating(false);
      onClose();
    }, 800);
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
        className="bs-modal bs-modal-create"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
      >
        <button className="bs-modal-close" onClick={onClose}>✕</button>

        {generating ? (
          <div className="bs-modal-gen">
            <div className="bs-demo-spinner" />
            <h3>Gerando projeto...</h3>
            <p>A IA está criando a estrutura do seu jogo.</p>
          </div>
        ) : (
          <>
            <h2 className="bs-modal-title">Criar Novo Projeto</h2>
            <p className="bs-modal-sub">Defina as características do seu jogo.</p>

            {step === 0 && (
              <div className="bs-modal-form">
                <div className="bs-field">
                  <label>Nome do Jogo *</label>
                  <input placeholder="Ex: WildCraft, FireStrike..." value={name} onChange={(e) => setName(e.target.value)} autoFocus />
                </div>
                <div className="bs-field">
                  <label>Gênero</label>
                  <div className="bs-chip-group">
                    {GENRES.map(g => (
                      <button key={g} className={`bs-chip ${genre === g ? "bs-chip-active" : ""}`} onClick={() => setGenre(genre === g ? "" : g)}>{g}</button>
                    ))}
                  </div>
                </div>
                <div className="bs-field">
                  <label>Estilo Visual</label>
                  <div className="bs-chip-group">
                    {STYLES.map(s => (
                      <button key={s} className={`bs-chip ${style === s ? "bs-chip-active" : ""}`} onClick={() => setStyle(style === s ? "" : s)}>{s}</button>
                    ))}
                  </div>
                </div>
                <div className="bs-field">
                  <label>Plataforma</label>
                  <div className="bs-chip-group">
                    {PLATFORMS.map(p => (
                      <button key={p} className={`bs-chip ${platform === p ? "bs-chip-active" : ""}`} onClick={() => setPlatform(platform === p ? "" : p)}>{p}</button>
                    ))}
                  </div>
                </div>
                <div className="bs-field">
                  <label>Descrição / Ideia</label>
                  <textarea placeholder="Descreva seu jogo em detalhes... (ex: Quero um survival FPS com zumbis em mundo aberto)" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
                </div>
                <button className="bs-btn bs-btn-primary" onClick={handleCreate} disabled={!name.trim()}>
                  ✨ Criar Projeto
                </button>
              </div>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
