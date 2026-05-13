import { useEffect, useRef, useState, useCallback } from "react";
import { Send, Sparkles, Check, Camera, Phone, MessageSquare } from "lucide-react";

const CONDITIONS = ["Novo", "Seminovo", "Usado", "Recondicionado"];
const AVAILABILITIES = ["Item único", "Várias unidades", "Sob demanda", "Serviço"];
const CATEGORIES = ["Celulares", "Veículos", "Imóveis", "Casa e móveis", "Moda", "Serviços", "Outros"];

const defaultAd = {
  title: "", price: "", category: "", condition: "", city: "", state: "",
  availability: "", description: "", phone: "", whatsapp: ""
};

const safe = (v) => String(v || "").trim();

const parseInput = (text) => {
  const parts = text.split(",").map((s) => s.trim()).filter(Boolean);
  const r = { ...defaultAd };
  if (!parts.length) return r;
  r.title = parts[0];
  for (let i = 1; i < parts.length; i++) {
    const raw = parts[i];
    const low = raw.toLowerCase();
    if (!r.price && /^r?\$?\s*[\d.,]+$/.test(low.replace(/\s/g, ""))) {
      r.price = raw.replace(/^r\$\s*/i, "").trim(); continue;
    }
    const cat = CATEGORIES.find((c) => c.toLowerCase().includes(low) || low.includes(c.toLowerCase()));
    if (cat && !r.category) { r.category = cat; continue; }
    const cond = CONDITIONS.find((c) => c.toLowerCase().includes(low) || low.includes(c.toLowerCase()));
    if (cond && !r.condition) { r.condition = cond; continue; }
    const avail = AVAILABILITIES.find((a) => a.toLowerCase().includes(low) || low.includes(a.toLowerCase()));
    if (avail && !r.availability) { r.availability = avail; continue; }
    r.description += (r.description ? ", " : "") + raw;
  }
  const loc = text.match(/([\w\sÀ-ÿ]+)\s*[-–]\s*([\w\sÀ-ÿ]+)/);
  if (loc) { r.city = loc[1].trim(); r.state = loc[2].trim(); }
  return r;
};

/* ─── Improvement data ─── */
const TITLE_PREFIXES = ["", "✨ ", "📱 ", "💎 ", "🚀 ", "⭐ ", "🎯 "];
const CTAS = [
  "Chame agora e garanta o seu! 🚀", "Aproveite antes que acabe! ⚡",
  "Oferta imperdível para hoje! 🎯", "Últimas unidades disponíveis! 📦",
  "Produto em excelente estado! ✅", "Conservado e pronto para uso! 💎",
  "Não perca essa oportunidade! ⭐", "Garanta já o seu produto! 🔥",
  "Super oportunidade pra você! 🛒", "Qualidade e melhor preço! 🏆",
];
const DESC_TEMPLATES = [
  (p) => `${p} em ótimo estado de conservação. Produto completo e funcional. ${CTAS[Math.floor(Math.random() * CTAS.length)]}`,
  (p) => `Produto de qualidade: ${p}. Perfeito para quem busca custo-benefício. ${CTAS[Math.floor(Math.random() * CTAS.length)]}`,
  (p) => `${p} — item bem cuidado, funcionando perfeitamente. ${CTAS[Math.floor(Math.random() * CTAS.length)]}`,
  (p) => `Vendo ${p}. Produto original, conservado e pronto para uso imediato. ${CTAS[Math.floor(Math.random() * CTAS.length)]}`,
  (p) => `Oportunidade: ${p}. Entre em contato e confira! ${CTAS[Math.floor(Math.random() * CTAS.length)]}`,
];

/* ─── SVG Scene: Woman at desk with notebook ─── */
function BraneScene({ state }) {
  const isWorking = state === "working";
  const isSuccess = state === "success";

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Background */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="sceneBg" cx="40%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#1a1425" />
            <stop offset="50%" stopColor="#0d0a15" />
            <stop offset="100%" stopColor="#050308" />
          </radialGradient>
          <radialGradient id="goldGlow" cx="30%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#D4A24C" stopOpacity="0.12" />
            <stop offset="60%" stopColor="#D4A24C" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#D4A24C" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="deskGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a1518" />
            <stop offset="100%" stopColor="#0d080a" />
          </linearGradient>
          <linearGradient id="screenGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D4A24C" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#D4A24C" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        <rect width="400" height="600" fill="url(#sceneBg)" />
        <rect width="400" height="600" fill="url(#goldGlow)" />

        {/* Gold vignette top */}
        <ellipse cx="200" cy="0" rx="250" ry="180" fill="url(#goldGlow)" opacity="0.5" />
      </svg>

      {/* Character scene */}
      <svg className="relative z-10 w-full h-full" viewBox="0 0 400 600" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="skinG" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f0d5b8" />
            <stop offset="100%" stopColor="#e0c0a0" />
          </linearGradient>
          <linearGradient id="hairG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2a1535" />
            <stop offset="100%" stopColor="#1a0a25" />
          </linearGradient>
          <linearGradient id="blazerG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a1025" />
            <stop offset="100%" stopColor="#0f0818" />
          </linearGradient>
          <linearGradient id="deskTopG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2a2025" />
            <stop offset="100%" stopColor="#151015" />
          </linearGradient>
          <linearGradient id="screenG" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7EC8E3" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#D4A24C" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#2a1535" stopOpacity="0.12" />
          </linearGradient>
          <filter id="rimLight">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <linearGradient id="edgeGold" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#D4A24C" stopOpacity="0" />
            <stop offset="50%" stopColor="#D4A24C" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#D4A24C" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* === DESK === */}
        {/* Desk top */}
        <rect x="20" y="420" width="360" height="18" rx="3" fill="url(#deskTopG)" />
        {/* Desk front panel */}
        <rect x="25" y="438" width="350" height="162" rx="2" fill="#0d080a" />
        {/* Desk gold edge highlight */}
        <rect x="20" y="420" width="360" height="2" rx="1" fill="url(#edgeGold)" />
        {/* Desk subtle reflection */}
        <rect x="30" y="422" width="340" height="6" fill="url(#edgeGold)" opacity="0.3" />

        {/* === CHAIR (behind character) === */}
        {/* Chair back */}
        <rect x="115" y="200" width="130" height="180" rx="30" fill="#0d0a10" stroke="#1a1520" strokeWidth="1" />
        {/* Chair base */}
        <rect x="150" y="450" width="60" height="150" rx="4" fill="#0d0a10" />

        {/* === CHARACTER === */}
        <g filter="url(#rimLight)">
          {/* Body / Blazer */}
          <path d="M145 260 Q150 250 160 248 L200 245 L240 248 Q250 250 255 260 L258 420 L142 420 Z" fill="url(#blazerG)" />
          {/* Gold edge light on blazer */}
          <path d="M145 260 Q150 250 160 248 L200 245" stroke="#D4A24C" strokeWidth="0.8" fill="none" opacity="0.2" />

          {/* Collar / Lapel */}
          <path d="M170 248 L185 290 L200 245" fill="#151020" stroke="#1a1525" strokeWidth="0.5" />
          <path d="M200 245 L215 290 L230 248" fill="#151020" stroke="#1a1525" strokeWidth="0.5" />

          {/* Neck */}
          <rect x="185" y="210" width="30" height="40" rx="6" fill="url(#skinG)" />

          {/* Head - facing right (toward chat) */}
          <ellipse cx="210" cy="180" rx="38" ry="42" fill="url(#skinG)" />

          {/* Hair - elegant shoulder-length */}
          <path d="M172 175 Q170 140 180 125 Q195 108 210 105 Q225 108 240 120 Q250 135 248 160 Q250 148 242 140 Q230 132 210 130 Q190 132 178 140 Q172 148 172 160 Z" fill="url(#hairG)" />
          {/* Hair back */}
          <path d="M175 150 Q180 180 178 220 Q182 240 190 250 Q172 235 170 200 Q168 170 175 150" fill="url(#hairG)" />
          {/* Hair front strands */}
          <path d="M172 160 Q176 155 180 158" stroke="#3d2050" strokeWidth="1" fill="none" opacity="0.5" />

          {/* Face features - profile/three-quarter facing right */}
          {/* Nose */}
          <path d="M235 175 Q243 180 244 188 Q238 186 235 185" fill="url(#skinG)" stroke="#d4b898" strokeWidth="0.5" />
          {/* Lips */}
          <path d="M234 200 Q238 202 242 199" stroke="#c4a080" strokeWidth="1" fill="none" strokeLinecap="round" />
          {/* Eye (right side, visible in three-quarter view) */}
          <ellipse cx="232" cy="178" rx="3" ry="2.5" fill="#1a0a25" />
          <circle cx="233" cy="177.5" r="0.8" fill="white" opacity="0.4" />
          {/* Eyebrow */}
          <path d="M227 174 Q232 172 237 174" stroke="#2a1535" strokeWidth="0.8" fill="none" />

          {/* Gold ambient light on face from left */}
          <ellipse cx="200" cy="180" rx="25" ry="30" fill="#D4A24C" opacity="0.04" />

          {/* === RIGHT ARM (typing on notebook) === */}
          {isWorking ? (
            <g className="brane-ch-arms">
              <path d="M250 270 Q275 290 285 310 Q290 320 288 330" stroke="url(#blazerG)" strokeWidth="12" strokeLinecap="round" fill="none">
                <animateTransform attributeName="transform" type="rotate" values="-2 250 270;2 250 270;-2 250 270" dur="1.2s" repeatCount="indefinite" />
              </path>
              {/* Hand */}
              <ellipse cx="286" cy="332" rx="8" ry="5" fill="url(#skinG)">
                <animateTransform attributeName="transform" type="rotate" values="-2 286 332;2 286 332;-2 286 332" dur="1.2s" repeatCount="indefinite" />
              </ellipse>
            </g>
          ) : isSuccess ? (
            <g className="brane-ch-arms">
              <path d="M250 270 Q260 250 255 235" stroke="url(#blazerG)" strokeWidth="12" strokeLinecap="round" fill="none" />
              <ellipse cx="254" cy="233" rx="8" ry="5" fill="url(#skinG)" />
            </g>
          ) : (
            <path d="M250 270 Q270 290 280 310 Q284 320 282 328" stroke="url(#blazerG)" strokeWidth="12" strokeLinecap="round" fill="none" />
          )}

          {/* === LEFT ARM (on desk) === */}
          <path d="M150 270 Q135 295 140 315 Q145 330 160 335" stroke="url(#blazerG)" strokeWidth="12" strokeLinecap="round" fill="none" />
          <ellipse cx="162" cy="336" rx="8" ry="5" fill="url(#skinG)" />
        </g>

        {/* === NOTEBOOK === */}
        {/* Base */}
        <rect x="150" y="370" width="140" height="8" rx="2" fill="#151015" />
        {/* Screen lid (slightly angled) */}
        <path d="M155 370 L155 310 Q155 300 165 298 L275 298 Q285 300 285 310 L285 370 Z" fill="#0a080a" />
        {/* Screen */}
        <path d="M162 368 L162 314 Q162 306 170 304 L270 304 Q278 306 278 314 L278 368 Z" fill="#050308" stroke="#1a1525" strokeWidth="0.5" />
        {/* Screen content glow */}
        <rect x="168" y="310" width="104" height="54" rx="2" fill="url(#screenG)" />
        {/* Screen lines of code/data */}
        <rect x="170" y="314" width="60" height="2" rx="1" fill="#D4A24C" opacity="0.15" />
        <rect x="170" y="320" width="45" height="2" rx="1" fill="#D4A24C" opacity="0.1" />
        <rect x="170" y="326" width="55" height="2" rx="1" fill="#D4A24C" opacity="0.12" />
        <rect x="170" y="332" width="35" height="2" rx="1" fill="#D4A24C" opacity="0.08" />
        <rect x="170" y="338" width="50" height="2" rx="1" fill="#D4A24C" opacity="0.1" />
        <rect x="170" y="344" width="65" height="2" rx="1" fill="#D4A24C" opacity="0.15" />
        {/* Screen blue glow */}
        <ellipse cx="220" cy="340" rx="60" ry="30" fill="#7EC8E3" opacity="0.03" />

        {/* Keyboard area */}
        <rect x="160" y="374" width="120" height="4" rx="1" fill="#1a1520" />

        {/* Notebook gold accent line */}
        <line x1="155" y1="370" x2="285" y2="370" stroke="#D4A24C" strokeWidth="0.5" opacity="0.3" />

        {/* Ambient screen light on character face */}
        <ellipse cx="225" cy="200" rx="35" ry="30" fill="#7EC8E3" opacity="0.02" />

        {/* === SUCCESS PARTICLES === */}
        {isSuccess && [0, 1, 2, 3, 4].map((i) => (
          <circle key={i} cx={170 + i * 25} cy={200} r={2} fill="#D4A24C" className="brane-ch-particle" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </svg>
    </div>
  );
}

/* ─── Sub-components ─── */
function ClickableCard({ label, selected, onClick, icon }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex items-center gap-3 w-full p-3.5 rounded-2xl border text-sm font-bold transition-all duration-200 ${
        selected
          ? "border-[#D4A24C] bg-[#D4A24C]/15 text-[#F1D28A] shadow-[0_0_20px_rgba(212,162,76,0.12)]"
          : "border-white/10 bg-white/[0.04] text-[#C9CBD6] hover:bg-white/[0.08] hover:border-white/20"
      }`}>
      {icon && <span className="text-base">{icon}</span>}
      <span>{label}</span>
      {selected && <Check size={15} className="ml-auto text-[#D4A24C]" />}
    </button>
  );
}

/* ─── Main Component ─── */
export default function AIAssistantPanelSocial({
  onPhotoUpload = () => {},
  onGenerateAd = () => {},
  onImproveAd = () => {},
  onGenerateNew = () => {},
  onFillForm = () => {},
  onPublishAd = () => {},
  generatedAd = null,
  isGenerating = false
}) {
  const [step, setStep] = useState(0);
  const [input, setInput] = useState("");
  const [localAd, setLocalAd] = useState(defaultAd);
  const [braneState, setBraneState] = useState("idle");
  const [messages, setMessages] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [contactPhone, setContactPhone] = useState("");
  const [contactWhatsapp, setContactWhatsapp] = useState("");
  const [improveCount, setImproveCount] = useState(0);

  const fileRef = useRef(null);
  const endRef = useRef(null);
  const initialized = useRef(false);

  const ad = generatedAd || localAd;

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      setMessages([{ id: 1, from: "ai",
        text: "Escreva os dados do seu anúncio separados por vírgula.\n\nExemplo:\niPhone 12 Pro, R$1200, Belém Pará, em perfeito estado, celular usado completo com acessórios"
      }]);
    }
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, step]);

  const addMsg = useCallback((text, from = "ai") => {
    setMessages((prev) => [...prev, { id: Date.now(), from, text }]);
  }, []);

  const handleSubmitInput = async () => {
    const text = safe(input);
    if (!text) return;
    addMsg(text, "user");
    setInput("");
    setBraneState("working");
    await new Promise((r) => setTimeout(r, 1800));
    const parsed = parseInput(text);
    setLocalAd(parsed);
    setBraneState("idle");
    setStep(1);
  };

  const handleReviewContinue = () => {
    const needsCondition = !safe(ad.condition);
    const needsAvailability = !safe(ad.availability);
    if (needsCondition) { setStep(2); return; }
    if (needsAvailability) { setStep(3); return; }
    setStep(4);
  };

  const handleRetype = () => { setStep(0); setLocalAd(defaultAd); addMsg("Digite novamente:"); };

  const handleSelectCondition = (cond) => {
    setLocalAd((prev) => ({ ...prev, condition: cond }));
    const needsAvail = !safe(ad.availability);
    setStep(needsAvail ? 3 : 4);
  };

  const handleSelectAvailability = (avail) => {
    setLocalAd((prev) => ({ ...prev, availability: avail }));
    setStep(4);
  };

  const handleContactChoice = (choice) => {
    if (choice === "skip") {
      setContactPhone(""); setContactWhatsapp("");
      setLocalAd((prev) => ({ ...prev, phone: "", whatsapp: "" }));
      setStep(5);
    } else setStep(7);
  };

  const handleContactDone = () => {
    setLocalAd((prev) => ({ ...prev, phone: safe(contactPhone), whatsapp: safe(contactWhatsapp) }));
    setStep(5);
  };

  const handlePhotoSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    await onPhotoUpload(files);
    const previews = await Promise.all(
      files.slice(0, 5).map((f) => new Promise((resolve) => {
        const r2 = new FileReader();
        r2.onload = () => resolve(r2.result);
        r2.readAsDataURL(f);
      }))
    );
    setPhotoPreviews(previews);
    setStep(6);
  };

  const handleImprove = async () => {
    if (!ad) return;
    setBraneState("working");
    await new Promise((r) => setTimeout(r, 2000));
    const prefixIdx = improveCount % TITLE_PREFIXES.length;
    const prefix = TITLE_PREFIXES[prefixIdx];
    const rawTitle = safe(ad.title).replace(/^vendo\s+/i, "").replace(/^[✨📱💎🚀⭐🎯]\s*/, "");
    const newTitle = prefix ? `${prefix}${rawTitle}` : rawTitle;
    const prodName = rawTitle || "produto";
    const templateIdx = Math.floor(improveCount / TITLE_PREFIXES.length) % DESC_TEMPLATES.length;
    const newDesc = DESC_TEMPLATES[templateIdx](prodName);
    setImproveCount((c) => c + 1);
    const improved = { ...ad, title: newTitle, description: newDesc };
    setLocalAd(improved);
    onImproveAd(improved);
    onFillForm(improved);
    setBraneState("idle");
    addMsg("Anúncio melhorado com nova versão profissional! ✨");
  };

  const handlePublish = async () => {
    setBraneState("success");
    await new Promise((r) => setTimeout(r, 1500));
    onPublishAd({ ...ad, photos: photoPreviews });
  };

  const handleNew = () => {
    setStep(0); setInput(""); setLocalAd(defaultAd);
    setPhotoPreviews([]); setContactPhone(""); setContactWhatsapp("");
    setBraneState("idle"); setMessages([]);
    initialized.current = false;
    onGenerateNew();
  };

  /* ─── Right panel content ─── */
  const renderReview = () => {
    const fields = [
      { label: "Título", value: ad.title, icon: "📌" },
      { label: "Preço", value: ad.price ? `R$ ${ad.price}` : "", icon: "💰" },
      { label: "Categoria", value: ad.category, icon: "📂" },
      { label: "Cidade", value: ad.city, icon: "📍" },
      { label: "Condição", value: ad.condition, icon: "🏷️" },
      { label: "Descrição", value: ad.description, icon: "📝" }
    ].filter((f) => safe(f.value));

    return (
      <div className="rounded-2xl border border-[#D4A24C]/30 p-4 space-y-2 brane-fade-in"
        style={{ background: "linear-gradient(135deg, rgba(212,162,76,0.12), rgba(212,162,76,0.03))" }}>
        <p className="text-xs font-black brane-gold-text mb-2">✨ Dados identificados</p>
        {fields.map((f) => (
          <div key={f.label} className="flex items-start gap-2">
            <span className="text-[10px] font-bold uppercase text-[#8C8F9A] min-w-[70px] shrink-0 mt-0.5">{f.icon}</span>
            <span className="text-sm text-white">{f.value}</span>
          </div>
        ))}
        <div className="flex gap-2 mt-3">
          <button type="button" onClick={handleReviewContinue} className="flex-1 brane-btn-gold py-2.5 text-xs font-bold">✓ Continuar</button>
          <button type="button" onClick={handleRetype} className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-xs font-bold text-[#A6A8B3] hover:bg-white/[0.08]">Redigitar</button>
        </div>
      </div>
    );
  };

  const renderConditionCards = () => (
    <div className="space-y-2 brane-fade-in">
      <p className="text-xs font-black brane-gold-text mb-2">Qual a condição?</p>
      {CONDITIONS.map((c) => (
        <ClickableCard key={c} label={c} selected={localAd.condition === c} onClick={() => handleSelectCondition(c)}
          icon={c === "Novo" ? "🆕" : c === "Seminovo" ? "✨" : c === "Usado" ? "🔄" : "🔧"} />
      ))}
    </div>
  );

  const renderAvailabilityCards = () => (
    <div className="space-y-2 brane-fade-in">
      <p className="text-xs font-black brane-gold-text mb-2">Disponibilidade?</p>
      {AVAILABILITIES.map((a) => (
        <ClickableCard key={a} label={a} selected={localAd.availability === a} onClick={() => handleSelectAvailability(a)}
          icon={a === "Item único" ? "📦" : a === "Várias unidades" ? "📦📦" : a === "Sob demanda" ? "📋" : "🔧"} />
      ))}
    </div>
  );

  const renderContactChoice = () => (
    <div className="space-y-2 brane-fade-in">
      <p className="text-xs font-black brane-gold-text mb-2">Adicionar contato?</p>
      <p className="text-[11px] text-[#8C8F9A] mb-2">Só aparece após "Entrar em contato"</p>
      <ClickableCard label="Telefone" icon="📞" onClick={() => { setStep(7); setContactWhatsapp(""); }} />
      <ClickableCard label="WhatsApp" icon="💬" onClick={() => { setStep(7); setContactPhone(""); }} />
      <ClickableCard label="Telefone e WhatsApp" icon="📱" onClick={() => setStep(7)} />
      <ClickableCard label="Continuar sem contato" icon="⏭️" onClick={() => handleContactChoice("skip")} />
    </div>
  );

  const renderContactInput = () => (
    <div className="space-y-3 brane-fade-in">
      <p className="text-xs font-black brane-gold-text">Digite seu contato</p>
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-3">
        <Phone size={16} className="text-[#D4A24C]" />
        <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)}
          placeholder="Telefone (opcional)" className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#6F7280]" />
      </div>
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-3">
        <MessageSquare size={16} className="text-[#25D366]" />
        <input value={contactWhatsapp} onChange={(e) => setContactWhatsapp(e.target.value)}
          placeholder="WhatsApp (opcional)" className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#6F7280]" />
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={handleContactDone} className="flex-1 brane-btn-gold py-2.5 text-xs font-bold">✓ Confirmar</button>
        <button type="button" onClick={() => handleContactChoice("skip")}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-bold text-[#A6A8B3] hover:bg-white/[0.08]">Pular</button>
      </div>
    </div>
  );

  const renderPhotoStep = () => (
    <div className="brane-fade-in text-center">
      <p className="text-xs font-black brane-gold-text mb-3">Envie uma foto do produto</p>
      <button type="button" onClick={() => fileRef.current?.click()}
        className="w-full max-w-xs mx-auto rounded-2xl border-2 border-dashed border-[#D4A24C]/30 py-12 flex flex-col items-center justify-center gap-2 text-[#C9CBD6] hover:border-[#D4A24C]/60 hover:bg-[#D4A24C]/5 transition-all cursor-pointer">
        <Camera size={32} className="text-[#D4A24C]/60" />
        <span className="text-sm font-bold">Clique para enviar foto</span>
      </button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
    </div>
  );

  const renderPreview = () => {
    const p = ad;
    const cover = photoPreviews[0] || p.photos?.[0] || "";
    return (
      <div className="brane-fade-in">
        <div className="flex gap-3 rounded-2xl border border-[#D4A24C]/30 overflow-hidden brane-card-premium max-w-[420px]"
          style={{ background: "linear-gradient(180deg, rgba(212,162,76,0.06), rgba(10,10,15,0.95))" }}>
          {cover ? (
            <img src={cover} alt="" className="w-28 h-28 object-cover shrink-0" />
          ) : (
            <div className="w-28 h-28 bg-[#0B0D12] flex items-center justify-center shrink-0">
              <Camera size={28} className="text-[#6F7280]" />
            </div>
          )}
          <div className="flex-1 p-3 min-w-0 space-y-1.5">
            {p.category && (
              <span className="inline-block px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-[#D4A24C]/15 text-[#D4A24C] border border-[#D4A24C]/30 leading-none">{p.category}</span>
            )}
            <h3 className="text-sm font-black text-white leading-tight truncate">{p.title || "Título"}</h3>
            <p className="brane-gold-text text-base font-black">{p.price ? `R$ ${p.price}` : ""}</p>
            {(p.city || p.state) && <p className="text-[10px] text-[#8C8F9A] truncate">📍 {[p.city, p.state].filter(Boolean).join(" - ")}</p>}
            <div className="flex flex-wrap gap-1">
              {p.condition && <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-[#5B1CB5]/20 text-[#7C3AED] border border-[#5B1CB5]/30 leading-none">{p.condition}</span>}
              {p.availability && <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-[#10A875]/15 text-[#10A875] border border-[#10A875]/30 leading-none">{p.availability}</span>}
            </div>
          </div>
        </div>
        {p.description && (
          <p className="text-xs text-[#A6A8B3] leading-relaxed mt-2 max-w-[420px] line-clamp-2">{p.description}</p>
        )}
      </div>
    );
  };

  const showSteps = step > 0 && step < 6;

  return (
    <div className="flex h-full w-full rounded-[24px] overflow-hidden"
      style={{ background: "#08060d", boxShadow: "0 0 80px rgba(212,162,76,0.06), inset 0 0 60px rgba(212,162,76,0.02)" }}>
      {/* ═══════ LEFT PANEL: IA SCENE (25%) ═══════ */}
      <div className="w-[25%] min-w-[200px] max-w-[300px] relative flex-shrink-0 hidden md:flex flex-col"
        style={{ background: "linear-gradient(180deg, rgba(212,162,76,0.03), rgba(10,8,15,1))" }}>
        {/* Gold top glow */}
        <div className="absolute top-0 left-0 right-0 h-48 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 30% 0%, rgba(212,162,76,0.08), transparent 60%)" }} />

        {/* Character scene */}
        <div className="flex-1 flex items-end justify-center">
          <div className="w-full h-[85%]">
            <BraneScene state={braneState} />
          </div>
        </div>
      </div>

      {/* ═══════ RIGHT PANEL: CHAT (75%) ═══════ */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Header bar */}
        {step > 0 && (
          <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.04] flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#D4A24C] to-[#8A6A24] flex items-center justify-center text-black font-black text-xs">B</div>
              <span className="text-xs font-bold uppercase tracking-[0.12em] brane-gold-text" style={{ filter: "drop-shadow(0 0 12px rgba(212,162,76,0.2))" }}>BRANE</span>
            </div>
            <button type="button" onClick={handleNew} className="text-[10px] font-bold text-[#6F7280] hover:text-[#D4A24C] transition-colors">✨ Novo</button>
          </div>
        )}
        {step === 0 && (
          <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.04] flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#D4A24C] to-[#8A6A24] flex items-center justify-center text-black font-black text-xs">B</div>
              <span className="text-xs font-bold uppercase tracking-[0.12em] brane-gold-text" style={{ filter: "drop-shadow(0 0 12px rgba(212,162,76,0.2))" }}>BRANE</span>
            </div>
          </div>
        )}

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 scrollbar-thin min-h-0">
          {messages.map((m) => (
            <div key={m.id}
              className={`rounded-2xl px-4 py-2.5 text-sm max-w-[75%] ${
                m.from === "user"
                  ? "ml-auto bg-[#D4A24C] text-black"
                  : "mr-auto bg-white/10 text-white"
              }`}>
              <span className="whitespace-pre-wrap">{m.text}</span>
            </div>
          ))}

          {/* Step cards */}
          {step === 1 && renderReview()}
          {step === 2 && renderConditionCards()}
          {step === 3 && renderAvailabilityCards()}
          {step === 4 && renderContactChoice()}
          {step === 7 && renderContactInput()}
          {step === 5 && renderPhotoStep()}

          {/* Preview + action buttons */}
          {step === 6 && (
            <div className="space-y-4 pt-2">
              {renderPreview()}
              <div className="flex gap-2 max-w-[420px]">
                <button type="button" onClick={handleImprove} disabled={!ad || isGenerating}
                  className="flex-1 rounded-xl border border-[#D4A24C]/30 bg-[#D4A24C]/10 py-3 text-xs font-bold text-[#F1D28A] hover:bg-[#D4A24C]/20 disabled:opacity-50 transition-all">
                  <Sparkles size={14} className="inline mr-1.5" />Melhorar anúncio
                </button>
                <button type="button" onClick={handlePublish} disabled={!ad || isGenerating}
                  className="flex-1 brane-btn-gold py-3 text-xs font-bold disabled:opacity-50">Publicar agora</button>
                <button type="button" onClick={handleNew}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-bold text-[#A6A8B3] hover:bg-white/[0.08]">Novo</button>
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* Fixed input at bottom */}
        {step === 0 && (
          <div className="flex-shrink-0 px-6 py-4 border-t border-white/[0.04]">
            <div className="flex gap-2 max-w-[600px]">
              <input value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmitInput()}
                placeholder="iPhone 12 Pro, R$1200, Belém Pará, em perfeito estado..."
                className="h-11 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none focus:border-[#D4A24C]/40 focus:shadow-[0_0_12px_rgba(212,162,76,0.06)] placeholder:text-[#6F7280]" />
              <button type="button" onClick={handleSubmitInput} disabled={!safe(input)}
                className="h-11 brane-btn-gold px-4 text-[13px] disabled:opacity-50">
                <Send size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Spacer at bottom when not step 0 */}
        {step > 0 && step < 6 && <div className="h-4 flex-shrink-0" />}
      </div>
    </div>
  );
}
