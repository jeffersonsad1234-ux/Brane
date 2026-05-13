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
];
const DESC_TEMPLATES = [
  (p) => `${p} em ótimo estado de conservação. Produto completo e funcional. ${CTAS[Math.floor(Math.random() * CTAS.length)]}`,
  (p) => `Produto de qualidade: ${p}. Perfeito para quem busca custo-benefício. ${CTAS[Math.floor(Math.random() * CTAS.length)]}`,
  (p) => `${p} — item bem cuidado, funcionando perfeitamente. ${CTAS[Math.floor(Math.random() * CTAS.length)]}`,
  (p) => `Vendo ${p}. Produto original, conservado e pronto para uso imediato. ${CTAS[Math.floor(Math.random() * CTAS.length)]}`,
  (p) => `Oportunidade: ${p}. Entre em contato e confira! ${CTAS[Math.floor(Math.random() * CTAS.length)]}`,
];

/* ─── Premium Character Illustration ─── */
function BraneScene({ state }) {
  const isWorking = state === "working";
  const isSuccess = state === "success";

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <svg className="w-full h-full" viewBox="0 0 360 520" preserveAspectRatio="xMidYMid meet">
        <defs>
          {/* Background gradients */}
          <radialGradient id="sBg" cx="40%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#1a1225" />
            <stop offset="60%" stopColor="#0d0815" />
            <stop offset="100%" stopColor="#050208" />
          </radialGradient>
          <radialGradient id="sGoldGlow" cx="35%" cy="45%" r="65%">
            <stop offset="0%" stopColor="#D4A24C" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#D4A24C" stopOpacity="0.03" />
            <stop offset="100%" stopColor="#D4A24C" stopOpacity="0" />
          </radialGradient>
          {/* Skin with warm tone */}
          <linearGradient id="sSkin" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f5e0c8" />
            <stop offset="100%" stopColor="#e8c8a8" />
          </linearGradient>
          {/* Hair - dark brown with subtle warm highlights */}
          <linearGradient id="sHair" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3a2045" />
            <stop offset="40%" stopColor="#2a1535" />
            <stop offset="100%" stopColor="#1a0a25" />
          </linearGradient>
          {/* Blazer - dark elegant */}
          <linearGradient id="sBlazer" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e1530" />
            <stop offset="100%" stopColor="#100820" />
          </linearGradient>
          {/* Desk */}
          <linearGradient id="sDesk" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2a2028" />
            <stop offset="100%" stopColor="#151015" />
          </linearGradient>
          {/* Screen glow */}
          <linearGradient id="sScreen" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#D4A24C" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#7EC8E3" stopOpacity="0.03" />
          </linearGradient>
          {/* Gold rim light */}
          <linearGradient id="sRim" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#D4A24C" stopOpacity="0.18" />
            <stop offset="30%" stopColor="#D4A24C" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#D4A24C" stopOpacity="0" />
          </linearGradient>
        </defs>

        <rect width="360" height="520" fill="url(#sBg)" />
        <rect width="360" height="520" fill="url(#sGoldGlow)" />

        {/* Top ambient gold light */}
        <ellipse cx="140" cy="0" rx="200" ry="160" fill="#D4A24C" opacity="0.05" />

        {/* === DESK === */}
        <rect x="10" y="370" width="340" height="14" rx="4" fill="url(#sDesk)" />
        <rect x="10" y="370" width="340" height="2" fill="url(#sRim)" />
        <rect x="15" y="384" width="330" height="136" rx="2" fill="#0d0810" />

        {/* === CHAIR BACK === */}
        <rect x="130" y="175" width="100" height="195" rx="35" fill="#0d0a12" stroke="#1a1525" strokeWidth="0.5" />

        {/* === CHARACTER (side profile facing right) === */}
        <g>
          {/* Blazer / Body */}
          <path d="M160 232 Q165 222 175 220 L195 218 L215 220 Q225 222 230 232 L234 370 L156 370 Z" fill="url(#sBlazer)" />
          {/* Blazer lapel */}
          <path d="M185 220 L195 260 L205 220" fill="#151025" stroke="#1a1530" strokeWidth="0.5" />
          {/* Blazer gold edge */}
          <path d="M160 232 Q165 222 175 220" stroke="#D4A24C" strokeWidth="0.6" fill="none" opacity="0.25" />

          {/* Neck */}
          <rect x="185" y="185" width="20" height="40" rx="5" fill="url(#sSkin)" />

          {/* Head - elegant side profile facing right */}
          <ellipse cx="200" cy="158" rx="32" ry="36" fill="url(#sSkin)" />

          {/* Hair - elegant shoulder-length, side profile */}
          <path d="M168 150 Q167 126 178 114 Q190 104 205 102 Q220 104 228 114 Q232 122 230 132 L228 140 Q226 136 222 130 Q215 124 205 122 Q195 124 188 130 Q182 136 178 144 Q176 150 175 158 Q174 168 176 180 Q178 195 180 210 L178 215 Q172 200 170 185 Q168 170 168 150 Z" fill="url(#sHair)" />
          {/* Hair flowing back */}
          <path d="M168 152 Q163 165 165 185 Q167 205 170 220 Q160 195 158 170 Q157 155 162 142 Q165 135 168 130 Z" fill="url(#sHair)" />
          {/* Hair shine */}
          <path d="M178 118 Q190 108 205 107 Q215 108 222 114" stroke="#4a2a55" strokeWidth="1.5" fill="none" opacity="0.3" />

          {/* Face features - side profile facing right */}
          {/* Forehead to nose bridge */}
          <path d="M218 130 Q225 136 228 145 Q230 150 230 155" stroke="#e0c0a0" strokeWidth="0.5" fill="none" />
          {/* Nose */}
          <path d="M230 155 Q234 160 236 168 Q232 166 228 165" fill="url(#sSkin)" stroke="#d4b898" strokeWidth="0.5" />
          {/* Upper lip */}
          <path d="M228 176 Q232 178 234 176" stroke="#c4a080" strokeWidth="0.8" fill="none" strokeLinecap="round" />
          {/* Lower lip / chin */}
          <path d="M228 182 Q232 184 230 188 Q228 192 225 194" fill="url(#sSkin)" stroke="#d4b898" strokeWidth="0.4" fill="none" />
          {/* Jawline */}
          <path d="M225 194 Q220 200 212 204 Q205 206 200 206" stroke="#d4b898" strokeWidth="0.4" fill="none" />

          {/* Eye */}
          <ellipse cx="222" cy="155" rx="2.5" ry="2" fill="#1a0a25" />
          <circle cx="223" cy="154.5" r="0.7" fill="white" opacity="0.35" />
          {/* Eyebrow */}
          <path d="M218 151 Q222 149 226 151" stroke="#2a1535" strokeWidth="0.7" fill="none" />

          {/* Eyelashes */}
          <path d="M224 156 Q225 157 224 158" stroke="#1a0a25" strokeWidth="0.4" fill="none" />

          {/* Ear */}
          <path d="M204 155 Q202 152 202 156 Q202 160 204 158" stroke="#d4b898" strokeWidth="0.5" fill="url(#sSkin)" />

          {/* Earring */}
          <circle cx="202" cy="163" r="1.5" fill="#D4A24C" opacity="0.6" />

          {/* Warm gold light on face */}
          <ellipse cx="215" cy="160" rx="20" ry="30" fill="#D4A24C" opacity="0.04" />

          {/* === RIGHT ARM (typing) === */}
          {isWorking ? (
            <g className="brane-ch-arms">
              <path d="M230 240 Q252 258 258 275 Q260 282 256 290" stroke="url(#sBlazer)" strokeWidth="10" strokeLinecap="round" fill="none">
                <animateTransform attributeName="transform" type="rotate" values="-1.5 230 240;1.5 230 240;-1.5 230 240" dur="1s" repeatCount="indefinite" />
              </path>
              <ellipse cx="255" cy="292" rx="7" ry="4.5" fill="url(#sSkin)">
                <animateTransform attributeName="transform" type="rotate" values="-1.5 255 292;1.5 255 292;-1.5 255 292" dur="1s" repeatCount="indefinite" />
              </ellipse>
            </g>
          ) : isSuccess ? (
            <g>
              <path d="M230 240 Q238 220 234 206" stroke="url(#sBlazer)" strokeWidth="10" strokeLinecap="round" fill="none" />
              <ellipse cx="233" cy="204" rx="7" ry="4.5" fill="url(#sSkin)" />
            </g>
          ) : (
            <path d="M230 240 Q248 258 254 270 Q256 276 254 282" stroke="url(#sBlazer)" strokeWidth="10" strokeLinecap="round" fill="none" />
          )}

          {/* === LEFT ARM (resting on desk) === */}
          <path d="M170 238 Q156 260 158 278 Q160 292 172 298" stroke="url(#sBlazer)" strokeWidth="10" strokeLinecap="round" fill="none" />
          <ellipse cx="174" cy="300" rx="7" ry="4.5" fill="url(#sSkin)" />
        </g>

        {/* === NOTEBOOK === */}
        {/* Base */}
        <rect x="162" y="340" width="110" height="8" rx="2" fill="#121015" />
        {/* Screen lid */}
        <path d="M168 340 L168 282 Q168 274 176 272 L258 272 Q266 274 266 282 L266 340 Z" fill="#0a0810" />
        {/* Screen bezel */}
        <rect x="174" y="278" width="86" height="58" rx="1" fill="#050408" stroke="#1a1525" strokeWidth="0.5" />
        {/* Screen content */}
        <rect x="178" y="282" width="78" height="50" rx="1" fill="url(#sScreen)" />
        {/* Code lines */}
        <rect x="180" y="286" width="50" height="1.5" rx="0.5" fill="#D4A24C" opacity="0.12" />
        <rect x="180" y="292" width="38" height="1.5" rx="0.5" fill="#D4A24C" opacity="0.08" />
        <rect x="180" y="298" width="44" height="1.5" rx="0.5" fill="#D4A24C" opacity="0.1" />
        <rect x="180" y="304" width="28" height="1.5" rx="0.5" fill="#D4A24C" opacity="0.06" />
        <rect x="180" y="310" width="42" height="1.5" rx="0.5" fill="#D4A24C" opacity="0.1" />
        <rect x="180" y="316" width="52" height="1.5" rx="0.5" fill="#D4A24C" opacity="0.12" />

        {/* Keyboard */}
        <rect x="170" y="346" width="94" height="3" rx="1" fill="#1a1525" />
        {/* Screen light on face */}
        <ellipse cx="220" cy="190" rx="30" ry="25" fill="#7EC8E3" opacity="0.015" />

        {/* Gold detail line on notebook */}
        <line x1="168" y1="340" x2="266" y2="340" stroke="#D4A24C" strokeWidth="0.4" opacity="0.2" />

        {/* === Success particles === */}
        {isSuccess && [0, 1, 2, 3, 4].map((i) => (
          <circle key={i} cx={160 + i * 22} cy={170} r={2} fill="#D4A24C" className="brane-ch-particle" style={{ animationDelay: `${i * 0.12}s` }} />
        ))}
      </svg>
    </div>
  );
}

/* ─── Clickable Card ─── */
function ClickableCard({ label, selected, onClick, icon }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex items-center gap-3 w-full p-3 rounded-2xl border text-sm font-bold transition-all duration-200 ${
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

/* ─── Feed-style Preview Card ─── */
function PreviewCard({ ad, images }) {
  const cover = images?.[0] || ad.photos?.[0] || "";
  const p = ad;

  return (
    <div className="brane-card-premium overflow-hidden rounded-2xl border border-[#D4A24C]/25"
      style={{ background: "linear-gradient(180deg, rgba(212,162,76,0.06), rgba(10,10,15,0.92))" }}>
      {cover ? (
        <img src={cover} alt="" className="w-full aspect-square object-cover" />
      ) : (
        <div className="w-full aspect-square bg-[#0B0D12] flex items-center justify-center">
          <Camera size={36} className="text-[#6F7280]" />
        </div>
      )}
      <div className="p-3.5 space-y-2">
        {p.category && (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#D4A24C]/15 text-[#D4A24C] border border-[#D4A24C]/30 leading-none">
            {p.category}
          </span>
        )}
        <h3 className="text-sm font-black text-white leading-tight">{p.title || "Título do anúncio"}</h3>
        {p.price && <p className="brane-gold-text text-lg font-black">R$ {p.price}</p>}
        {(p.city || p.state) && (
          <p className="text-[11px] text-[#8C8F9A]">📍 {[p.city, p.state].filter(Boolean).join(" - ")}</p>
        )}
        <div className="flex flex-wrap gap-1">
          {p.condition && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#5B1CB5]/20 text-[#7C3AED] border border-[#5B1CB5]/30 leading-none">{p.condition}</span>
          )}
          {p.availability && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#10A875]/15 text-[#10A875] border border-[#10A875]/30 leading-none">{p.availability}</span>
          )}
        </div>
        {p.description && (
          <p className="text-[11px] text-[#A6A8B3] leading-relaxed line-clamp-3">{p.description}</p>
        )}
      </div>
    </div>
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
  const hasAd = safe(ad.title) || safe(ad.price);

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
    const needsAvail = !safe(ad.availability) || !safe(ad.availability);
    setLocalAd((prev) => ({ ...prev, condition: cond }));
    setStep(!safe(ad.availability) && !safe(cond) ? 3 : 4);
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
    await new Promise((r) => setTimeout(r, 1800));
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
    // No addMsg — only update preview silently
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

  /* ─── CENTER: Render step content ─── */
  const renderStepContent = () => {
    switch (step) {
      case 0: return null;
      case 1:
        return (
          <div className="rounded-2xl border border-[#D4A24C]/30 p-3.5 space-y-2 brane-fade-in"
            style={{ background: "linear-gradient(135deg, rgba(212,162,76,0.12), rgba(212,162,76,0.03))" }}>
            <p className="text-xs font-black brane-gold-text mb-1">✨ Dados identificados</p>
            {[{ label: "📌", value: ad.title }, { label: "💰", value: ad.price ? `R$ ${ad.price}` : "" }, { label: "📂", value: ad.category }, { label: "📍", value: ad.city }, { label: "🏷️", value: ad.condition }, { label: "📝", value: ad.description }]
              .filter((f) => safe(f.value))
              .map((f) => (
                <div key={f.label} className="flex items-start gap-2">
                  <span className="text-[10px] text-[#8C8F9A] min-w-[24px]">{f.label}</span>
                  <span className="text-sm text-white">{f.value}</span>
                </div>
              ))}
            <div className="flex gap-2 mt-2">
              <button type="button" onClick={handleReviewContinue} className="flex-1 brane-btn-gold py-2 text-xs font-bold">✓ Continuar</button>
              <button type="button" onClick={handleRetype} className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] py-2 text-xs font-bold text-[#A6A8B3] hover:bg-white/[0.08]">Redigitar</button>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-1.5 brane-fade-in">
            <p className="text-xs font-black brane-gold-text mb-1">Qual a condição?</p>
            {CONDITIONS.map((c) => (
              <ClickableCard key={c} label={c} selected={localAd.condition === c} onClick={() => handleSelectCondition(c)}
                icon={c === "Novo" ? "🆕" : c === "Seminovo" ? "✨" : c === "Usado" ? "🔄" : "🔧"} />
            ))}
          </div>
        );
      case 3:
        return (
          <div className="space-y-1.5 brane-fade-in">
            <p className="text-xs font-black brane-gold-text mb-1">Disponibilidade?</p>
            {AVAILABILITIES.map((a) => (
              <ClickableCard key={a} label={a} selected={localAd.availability === a} onClick={() => handleSelectAvailability(a)}
                icon={a === "Item único" ? "📦" : a === "Várias unidades" ? "📦📦" : a === "Sob demanda" ? "📋" : "🔧"} />
            ))}
          </div>
        );
      case 4:
        return (
          <div className="space-y-1.5 brane-fade-in">
            <p className="text-xs font-black brane-gold-text mb-1">Adicionar contato?</p>
            <p className="text-[10px] text-[#8C8F9A] mb-1">Só aparece após "Entrar em contato"</p>
            <ClickableCard label="Telefone" icon="📞" onClick={() => { setStep(7); setContactWhatsapp(""); }} />
            <ClickableCard label="WhatsApp" icon="💬" onClick={() => { setStep(7); setContactPhone(""); }} />
            <ClickableCard label="Telefone e WhatsApp" icon="📱" onClick={() => setStep(7)} />
            <ClickableCard label="Continuar sem contato" icon="⏭️" onClick={() => handleContactChoice("skip")} />
          </div>
        );
      case 7:
        return (
          <div className="space-y-2 brane-fade-in">
            <p className="text-xs font-black brane-gold-text">Digite seu contato</p>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 p-2.5">
              <Phone size={14} className="text-[#D4A24C]" />
              <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)}
                placeholder="Telefone" className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#6F7280]" />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 p-2.5">
              <MessageSquare size={14} className="text-[#25D366]" />
              <input value={contactWhatsapp} onChange={(e) => setContactWhatsapp(e.target.value)}
                placeholder="WhatsApp" className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#6F7280]" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={handleContactDone} className="flex-1 brane-btn-gold py-2 text-xs font-bold">✓ Confirmar</button>
              <button type="button" onClick={() => handleContactChoice("skip")}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-[#A6A8B3] hover:bg-white/[0.08]">Pular</button>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="brane-fade-in text-center">
            <p className="text-xs font-black brane-gold-text mb-2">Envie uma foto</p>
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-full max-w-[220px] mx-auto rounded-2xl border-2 border-dashed border-[#D4A24C]/30 py-10 flex flex-col items-center justify-center gap-2 text-[#C9CBD6] hover:border-[#D4A24C]/60 hover:bg-[#D4A24C]/5 transition-all cursor-pointer">
              <Camera size={28} className="text-[#D4A24C]/60" />
              <span className="text-sm font-bold">Clique para enviar</span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="flex h-full w-full rounded-[24px] overflow-hidden bg-[#08060d]"
      style={{ boxShadow: "0 0 80px rgba(212,162,76,0.05), inset 0 0 60px rgba(212,162,76,0.02)" }}>
      {/* ═══ LEFT: Character (25%) ═══ */}
      <div className="w-[25%] min-w-[180px] max-w-[280px] relative hidden md:flex flex-col flex-shrink-0"
        style={{ background: "linear-gradient(180deg, rgba(212,162,76,0.02), rgba(10,8,15,1))" }}>
        <div className="absolute top-0 left-0 right-0 h-48 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 30% 0%, rgba(212,162,76,0.06), transparent 60%)" }} />
        <div className="flex-1 flex items-end justify-center">
          <div className="w-full h-[82%]">
            <BraneScene state={braneState} />
          </div>
        </div>
      </div>

      {/* ═══ CENTER: Chat (flex, ~50%) ═══ */}
      <div className="flex-1 flex flex-col min-w-0 max-w-[55%] border-r border-white/[0.03]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-white/[0.04] flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#D4A24C] to-[#8A6A24] flex items-center justify-center text-black font-black text-[10px]">B</div>
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] brane-gold-text">BRANE</span>
          </div>
          {step > 0 && (
            <button type="button" onClick={handleNew} className="text-[9px] font-bold text-[#6F7280] hover:text-[#D4A24C] transition-colors">✨ Novo</button>
          )}
        </div>

        {/* Messages + step cards */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2.5 scrollbar-thin min-h-0">
          {messages.map((m) => (
            <div key={m.id}
              className={`rounded-2xl px-3.5 py-2 text-sm max-w-[80%] ${
                m.from === "user"
                  ? "ml-auto bg-[#D4A24C] text-black"
                  : "mr-auto bg-white/10 text-white"
              }`}>
              <span className="whitespace-pre-wrap">{m.text}</span>
            </div>
          ))}
          {renderStepContent()}
          <div ref={endRef} />
        </div>

        {/* Fixed input */}
        {step === 0 && (
          <div className="flex-shrink-0 px-5 py-3 border-t border-white/[0.04]">
            <div className="flex gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmitInput()}
                placeholder="iPhone 12 Pro, R$1200, Belém Pará, em perfeito estado..."
                className="h-10 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-sm text-white outline-none focus:border-[#D4A24C]/40 focus:shadow-[0_0_12px_rgba(212,162,76,0.06)] placeholder:text-[#6F7280]" />
              <button type="button" onClick={handleSubmitInput} disabled={!safe(input)}
                className="h-10 brane-btn-gold px-3.5 text-[12px] disabled:opacity-50">
                <Send size={15} />
              </button>
            </div>
          </div>
        )}
        {step > 0 && <div className="h-3 flex-shrink-0" />}
      </div>

      {/* ═══ RIGHT: Preview + Actions (25%) ═══ */}
      <div className="w-[25%] min-w-[180px] max-w-[300px] flex-shrink-0 hidden md:flex flex-col p-4"
        style={{ background: "linear-gradient(180deg, rgba(212,162,76,0.02), rgba(10,8,15,1))" }}>
        <div className="flex-shrink-0 mb-3">
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#6F7280]">Prévia do anúncio</p>
        </div>

        {hasAd ? (
          <div className="flex-1 overflow-y-auto scrollbar-thin space-y-3">
            <PreviewCard ad={ad} images={photoPreviews} />

            {/* Action buttons */}
            {step === 6 && (
              <div className="space-y-2 pt-1">
                <button type="button" onClick={handleImprove} disabled={!ad || isGenerating}
                  className="w-full rounded-xl border border-[#D4A24C]/30 bg-[#D4A24C]/10 py-2.5 text-xs font-bold text-[#F1D28A] hover:bg-[#D4A24C]/20 disabled:opacity-50 transition-all">
                  <Sparkles size={13} className="inline mr-1.5" />Melhorar anúncio
                </button>
                <button type="button" onClick={handlePublish} disabled={!ad || isGenerating}
                  className="w-full brane-btn-gold py-2.5 text-xs font-bold disabled:opacity-50">
                  Publicar agora
                </button>
                <button type="button" onClick={handleNew}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-xs font-bold text-[#A6A8B3] hover:bg-white/[0.08]">
                  ✨ Novo anúncio
                </button>
              </div>
            )}

            {/* Mini step progress */}
            {step > 0 && step < 6 && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${step > 0 ? 'bg-[#D4A24C]' : 'bg-[#3a3a45]'}`} />
                  <div className={`w-1.5 h-1.5 rounded-full ${step > 1 ? 'bg-[#D4A24C]' : 'bg-[#3a3a45]'}`} />
                  <div className={`w-1.5 h-1.5 rounded-full ${step > 2 ? 'bg-[#D4A24C]' : 'bg-[#3a3a45]'}`} />
                  <div className={`w-1.5 h-1.5 rounded-full ${step > 3 ? 'bg-[#D4A24C]' : 'bg-[#3a3a45]'}`} />
                  <div className={`w-1.5 h-1.5 rounded-full ${step > 4 ? 'bg-[#D4A24C]' : 'bg-[#3a3a45]'}`} />
                  <div className={`w-1.5 h-1.5 rounded-full ${step > 5 ? 'bg-[#D4A24C]' : 'bg-[#3a3a45]'}`} />
                </div>
                <p className="text-[9px] text-[#6F7280]">Preenchendo dados...</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Camera size={32} className="mx-auto text-[#3a3a45] mb-2" />
              <p className="text-[11px] text-[#6F7280]">Digite os dados no chat<br />para ver a prévia</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
