import React, { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import "./BranyStudio.css";

// ─── DATA ──────────────────────────────────────────────
const FEATURES = [
  { icon: "🎮", title: "Gerar Gameplay FPS", desc: "Crie jogos FPS completos com física, armas, IA de inimigos e multiplayer." },
  { icon: "🗺️", title: "Mapas Open World", desc: "Gere terrenos, biomas, vilas, rios e masmorras proceduralmente." },
  { icon: "🖥️", title: "Gerar HUD", desc: "Crie HUD profissional com vida, inventário, minimapa e crosshair." },
  { icon: "🧟", title: "Sistemas Survival", desc: "Fome, sede, energia, crafting, construção e ciclo dia/noite." },
  { icon: "🏃", title: "Movimento COD", desc: "Sprint, slide, crouch, jump, wall-run, parkour suave." },
  { icon: "🎬", title: "Gráficos Cinematográficos", desc: "Iluminação dinâmica, sombras PCF, névoa volumétrica, tom de cor." },
  { icon: "🧠", title: "IA de Inimigos", desc: "Patrulha, perseguição, combate, cobertura e comportamento de grupo." },
  { icon: "📦", title: "Sistema de Inventário", desc: "Slots, drag & drop, crafting, loot, raridade e gerenciamento." },
  { icon: "📜", title: "Gerar Quests", desc: "Missões dinâmicas com diálogo, recompensas e progressão." },
  { icon: "🌐", title: "Multiplayer", desc: "Servidor dedicado, matchmaking, lobby, chat e sincronização." },
];

const PROMPT_EXAMPLES = [
  "Quero um jogo survival FPS com zumbis.",
  "Crie um RPG de mundo aberto com multiplayer.",
  "Gerar jogo de corrida estilo arcade.",
  "Quero um jogo de terror com puzzles.",
  "Crie um battle royale para celular.",
];

// ─── PARTICLE CANVAS ────────────────────────────────────
function ParticleField() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    let w = c.width = c.offsetWidth * devicePixelRatio;
    let h = c.height = c.offsetHeight * devicePixelRatio;
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
      r: Math.random() * 2 + 0.5,
    }));
    const onResize = () => { w = c.width = c.offsetWidth * devicePixelRatio; h = c.height = c.offsetHeight * devicePixelRatio; };
    window.addEventListener("resize", onResize);
    let id;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(124, 92, 252, 0.3)";
        ctx.fill();
      }
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(124, 92, 252, ${0.08 * (1 - dist / 120)})`;
            ctx.stroke();
          }
        }
      }
      id = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(id); window.removeEventListener("resize", onResize); };
  }, []);
  return <canvas ref={canvasRef} className="bs-particle-canvas" />;
}

// ─── FEATURE CARD ──────────────────────────────────────
function FeatureCard({ icon, title, desc, i }) {
  return (
    <motion.div
      className="bs-feature-card"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: i * 0.05, duration: 0.5 }}
      whileHover={{ scale: 1.03, borderColor: "#7c5cfc" }}
    >
      <div className="bs-feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </motion.div>
  );
}

// ─── SECTION TITLE ──────────────────────────────────────
function SectionTitle({ children, sub }) {
  return (
    <div className="bs-section-header">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >{children}</motion.h2>
      {sub && <p>{sub}</p>}
    </div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────
export default function BranyStudio() {
  const [prompt, setPrompt] = useState("");
  const [promptResult, setPromptResult] = useState(null);
  const [promptLoading, setPromptLoading] = useState(false);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

  const handlePrompt = () => {
    if (!prompt.trim()) return;
    setPromptLoading(true);
    setTimeout(() => {
      setPromptResult({
        roadmap: ["Análise de requisitos", "Arquitetura do projeto", "Implementação do motor", "Sistemas de gameplay", "Testes e deploy"],
        arquitetura: "ECS-based engine com sistemas separados para render, física, áudio, inputs e networking.",
        prompts: [
          "Crie um sistema de combate FPS com armas, recarga e dano.",
          "Gere IA de zumbis com patrulha e perseguição.",
          "Crie HUD de survival com vida, fome e inventário.",
          "Gere terreno procedural com biomas e clima.",
        ],
        gamepLay: "Jogabilidade FPS survival com sistema de crafting, construção, dia/noite e ondas de inimigos.",
        sistemas: ["Movimento", "Combate", "Inventário", "Crafting", "IA", "Multiplayer", "Save/Load"],
      });
      setPromptLoading(false);
    }, 1500);
  };

  return (
    <div className="bs-root">
      <ParticleField />

      {/* ─── HERO ─── */}
      <motion.section ref={heroRef} className="bs-hero" style={{ opacity: heroOpacity, scale: heroScale }}>
        <div className="bs-hero-bg" />
        <div className="bs-hero-content">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="bs-hero-text"
          >
            <div className="bs-badge">⚡ Brany Game Studio AI</div>
            <h1>
              Crie jogos <span className="bs-gradient-text">AAA</span> com IA.
            </h1>
            <p className="bs-hero-sub">
              Survival, FPS, mundo aberto, multiplayer, gráficos cinematográficos
              e gameplay profissional.<br />Tudo gerado por inteligência artificial.
            </p>
            <div className="bs-hero-actions">
              <Link to="/brany-studio#features" className="bs-btn bs-btn-primary">
                ✨ Criar meu jogo
              </Link>
              <Link to="/virtualshoppingbrane" className="bs-btn bs-btn-secondary">
                ▶ Ver demo
              </Link>
              <Link to="/brany-studio#features" className="bs-btn bs-btn-ghost">
                Explorar recursos
              </Link>
            </div>
          </motion.div>

          <motion.div
            className="bs-hero-preview"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <Link to="/virtualshoppingbrane" className="bs-preview-frame">
              <div className="bs-preview-glow" />
              <div className="bs-preview-content">
                <div className="bs-preview-scene">
                  <div className="bs-preview-terrain" />
                  <div className="bs-preview-tree" />
                  <div className="bs-preview-tree t2" />
                  <div className="bs-preview-player" />
                </div>
              </div>
              <div className="bs-preview-overlay">
                <span>▶ Jogar Demo</span>
              </div>
            </Link>
          </motion.div>
        </div>

        <motion.div
          className="bs-scroll-indicator"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <span>↓</span>
        </motion.div>
      </motion.section>

      {/* ─── DEMO ─── */}
      <section id="demo" className="bs-section bs-demo-section">
        <SectionTitle sub="Este jogo foi criado usando Brany Game Studio AI.">
          🎮 Demo Jogável
        </SectionTitle>
        <motion.div
          className="bs-demo-card"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <div className="bs-demo-banner">
            <div className="bs-demo-bg-preview">
              <div className="bs-demo-scene-elements">
                <div className="d-tree" /><div className="d-tree d2" /><div className="d-tree d3" />
                <div className="d-mtn" /><div className="d-mtn dm2" />
                <div className="d-player" />
              </div>
            </div>
            <div className="bs-demo-info">
              <h3>WildCraft — Survival Open World</h3>
              <div className="bs-demo-tags">
                <span>🌲 Mundo Aberto</span><span>🏃 Movimento COD</span>
                <span>🌙 Dia/Noite</span><span>⚔️ Combate</span><span>🛠️ Construção</span>
              </div>
              <p>Mundo procedural de 200m com biomas, vilas, recursos, animais, clima dinâmico e física realista.</p>
              <Link to="/virtualshoppingbrane" className="bs-btn bs-btn-primary">
                ▶ Jogar Agora
              </Link>
            </div>
          </div>
          <div className="bs-demo-stats">
            {[
              { label: "Árvores", value: "350+" },
              { label: "Recursos", value: "80+" },
              { label: "Biomas", value: "6" },
              { label: "FPS", value: "60" },
              { label: "Área", value: "200m" },
              { label: "IA Agentes", value: "32+" },
            ].map((s, i) => (
              <motion.div key={i} className="bs-demo-stat"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <span className="bs-stat-value">{s.value}</span>
                <span className="bs-stat-label">{s.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="bs-section bs-features-section">
        <SectionTitle sub="Tudo que você precisa para criar jogos profissionais com IA.">
          🚀 Funcionalidades da IA
        </SectionTitle>
        <div className="bs-features-grid">
          {FEATURES.map((f, i) => <FeatureCard key={i} {...f} i={i} />)}
        </div>
      </section>

      {/* ─── PROMPT GENERATOR ─── */}
      <section id="prompt" className="bs-section bs-prompt-section">
        <SectionTitle sub="Descreva seu jogo e a IA gera o projeto completo.">
          🤖 Gerador de Prompts
        </SectionTitle>
        <motion.div
          className="bs-prompt-container"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="bs-prompt-input-area">
            <textarea
              className="bs-prompt-input"
              placeholder="Ex: Quero um jogo survival FPS com zumbis..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
            />
            <div className="bs-prompt-examples">
              {PROMPT_EXAMPLES.map((ex, i) => (
                <button key={i} className="bs-prompt-chip" onClick={() => setPrompt(ex)}>
                  {ex}
                </button>
              ))}
            </div>
            <button className="bs-btn bs-btn-primary" onClick={handlePrompt} disabled={promptLoading}>
              {promptLoading ? "⏳ Gerando..." : "⚡ Gerar Projeto"}
            </button>
          </div>

          <AnimatePresence>
            {promptResult && (
              <motion.div
                className="bs-prompt-result"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="bs-result-grid">
                  <div className="bs-result-card">
                    <h4>📋 Roadmap</h4>
                    <ul>{promptResult.roadmap.map((r, i) => <li key={i}>{r}</li>)}</ul>
                  </div>
                  <div className="bs-result-card">
                    <h4>🏗️ Arquitetura</h4>
                    <p>{promptResult.arquitetura}</p>
                  </div>
                  <div className="bs-result-card">
                    <h4>📝 Prompts Gerados</h4>
                    <ul>{promptResult.prompts.map((r, i) => <li key={i}>{r}</li>)}</ul>
                  </div>
                  <div className="bs-result-card">
                    <h4>🎮 Gameplay</h4>
                    <p>{promptResult.gamepLay}</p>
                  </div>
                  <div className="bs-result-card bs-result-full">
                    <h4>⚙️ Sistemas</h4>
                    <div className="bs-chip-group">
                      {promptResult.sistemas.map((s, i) => <span key={i} className="bs-chip">{s}</span>)}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* ─── DASHBOARD ─── */}
      <section id="dashboard" className="bs-section bs-dash-section">
        <SectionTitle sub="Painel completo de desenvolvimento com IA.">
          📊 Dashboard IA
        </SectionTitle>
        <motion.div
          className="bs-dash-grid"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {[
            { label: "Projetos", value: "12", color: "#7c5cfc" },
            { label: "Prompts", value: "47", color: "#44cc88" },
            { label: "Builds", value: "23", color: "#44aaff" },
            { label: "Assets", value: "1.2k", color: "#ff6644" },
            { label: "Progresso", value: "84%", color: "#ffcc44" },
            { label: "Debug", value: "3", color: "#ee4455" },
          ].map((d, i) => (
            <motion.div key={i} className="bs-dash-card"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="bs-dash-value" style={{ color: d.color }}>{d.value}</div>
              <div className="bs-dash-label">{d.label}</div>
              <div className="bs-dash-bar"><div className="bs-dash-fill" style={{ width: d.value, background: d.color }} /></div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="bs-tech-stack"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h4>Tecnologias</h4>
          <div className="bs-tech-logos">
            {["Three.js", "React", "OpenAI", "WebGL", "Node.js", "Framer Motion", "Tailwind", "WebSocket"].map((t, i) => (
              <motion.span key={i} className="bs-tech-badge"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03 }}
              >{t}</motion.span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ─── CTA ─── */}
      <section className="bs-section bs-cta-section">
        <motion.div
          className="bs-cta-content"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <h2>Pronto para criar seu jogo?</h2>
          <p>Comece agora com Brany Game Studio AI e transforme suas ideias em realidade.</p>
          <div className="bs-hero-actions" style={{ justifyContent: "center" }}>
            <Link to="/virtualshoppingbrane" className="bs-btn bs-btn-primary">
              🎮 Ver Demo
            </Link>
            <a href="#features" className="bs-btn bs-btn-secondary">
              ✨ Começar
            </a>
          </div>
        </motion.div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bs-footer">
        <div className="bs-footer-inner">
          <div className="bs-footer-brand">
            <strong>Brany Game Studio AI</strong>
            <span>Crie jogos incríveis com inteligência artificial.</span>
          </div>
          <div className="bs-footer-links">
            <span>© 2026 Brany Studio</span>
            <a href="#features">Recursos</a>
            <a href="#demo">Demo</a>
            <Link to="/virtualshoppingbrane">Jogar</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
