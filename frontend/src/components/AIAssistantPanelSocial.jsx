import { useEffect, useRef, useState, useCallback } from "react";
import { ImagePlus, Send, Sparkles, Check, Camera, Phone, MessageSquare } from "lucide-react";

const CONDITIONS = ["Novo", "Seminovo", "Usado", "Recondicionado"];
const AVAILABILITIES = ["Item único", "Várias unidades", "Sob demanda", "Serviço"];
const CATEGORIES = ["Celulares", "Veículos", "Imóveis", "Casa e móveis", "Moda", "Serviços", "Outros"];

const defaultAd = {
  title: "", price: "", category: "", condition: "", city: "", state: "",
  availability: "", description: "", phone: "", whatsapp: ""
};

const safe = (v) => String(v || "").trim();

/* ─── Improvement data ─── */
const TITLE_PREFIXES = [
  "", "✨ ", "📱 ", "💎 ", "🚀 ", "⭐ ", "🎯 ",
];
const CTAS = [
  "Chame agora e garanta o seu! 🚀",
  "Aproveite antes que acabe! ⚡",
  "Oferta imperdível para hoje! 🎯",
  "Últimas unidades disponíveis! 📦",
  "Produto em excelente estado! ✅",
  "Conservado e pronto para uso! 💎",
  "Não perca essa oportunidade! ⭐",
  "Garanta já o seu produto! 🔥",
  "Super oportunidade pra você! 🛒",
  "Qualidade e melhor preço! 🏆",
];
const DESC_TEMPLATES = [
  (p) => `${p} em ótimo estado de conservação. Produto completo e funcional. ${CTAS[Math.floor(Math.random() * CTAS.length)]}`,
  (p) => `Produto de qualidade: ${p}. Perfeito para quem busca custo-benefício. ${CTAS[Math.floor(Math.random() * CTAS.length)]}`,
  (p) => `${p} — item bem cuidado, funcionando perfeitamente. ${CTAS[Math.floor(Math.random() * CTAS.length)]}`,
  (p) => `Vendo ${p}. Produto original, conservado e pronto para uso imediato. ${CTAS[Math.floor(Math.random() * CTAS.length)]}`,
  (p) => `Oportunidade: ${p}. Entre em contato e confira! ${CTAS[Math.floor(Math.random() * CTAS.length)]}`,
];
const CAT_EMOJIS = {
  "Celulares": "📱", "Veículos": "🚗", "Imóveis": "🏠",
  "Casa e móveis": "🏡", "Moda": "👗", "Serviços": "🔧", "Outros": "📦",
};
const FALLBACK_EMOJI = "📦";

const parseInput = (text) => {
  const parts = text.split(",").map((s) => s.trim()).filter(Boolean);
  const r = { ...defaultAd };
  if (!parts.length) return r;
  r.title = parts[0];

  for (let i = 1; i < parts.length; i++) {
    const raw = parts[i];
    const low = raw.toLowerCase();

    if (!r.price && /^r?\$?\s*[\d.,]+$/.test(low.replace(/\s/g, ""))) {
      r.price = raw.replace(/^r\$\s*/i, "").trim();
      continue;
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

/* ─── Friendlier BRANE character SVG ─── */
function BraneCharacter({ state }) {
  const w = state === "working";
  const p = state === "presenting";
  const s = state === "success";

  return (
    <div className="brane-character-fixed">
      <div className="relative w-28 h-36 mx-auto brane-character-container">
        <svg viewBox="0 0 120 160" className="w-full h-full brane-character-svg">
          <defs>
            <radialGradient id="bgGlow" cx="50%" cy="40%" r="55%">
              <stop offset="0%" stopColor="#D4A24C" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#D4A24C" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f5e6d0" />
              <stop offset="100%" stopColor="#e8cfa8" />
            </linearGradient>
            <linearGradient id="visorGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7EC8E3" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#4A9FD4" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#D4A24C" stopOpacity="0.7" />
            </linearGradient>
            <linearGradient id="dressGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D4A24C" />
              <stop offset="60%" stopColor="#B38B36" />
              <stop offset="100%" stopColor="#8A6A24" />
            </linearGradient>
          </defs>

          <ellipse cx="60" cy="75" rx="48" ry="52" fill="url(#bgGlow)" />

          {/* Body / dress */}
          <path d="M44 80 Q44 68 60 66 Q76 68 76 80 L80 118 Q80 122 76 122 L44 122 Q40 122 40 118 Z" fill="url(#dressGrad)" />
          {/* Collar */}
          <path d="M52 68 Q60 74 68 68" stroke="#F1D28A" strokeWidth="1.5" fill="none" opacity="0.5" />

          {/* Head */}
          <ellipse cx="60" cy="52" rx="20" ry="21" fill="url(#bodyGrad)" />

          {/* Hair - sleek futuristic bob */}
          <path d="M40 50 Q38 28 60 26 Q82 28 80 50 Q82 58 80 65 Q76 62 72 58 Q70 50 68 40 Q64 36 60 35 Q56 36 52 40 Q50 50 48 58 Q44 62 40 65 Q38 58 40 50Z" fill="#2a1535" />
          <path d="M42 48 Q42 32 60 30 Q78 32 78 48" fill="#3d2050" opacity="0.4" />

          {/* Visor / eyes - friendly blue glow */}
          <rect x="48" y="46" width="10" height="6" rx="3" fill="url(#visorGrad)" />
          <rect x="62" y="46" width="10" height="6" rx="3" fill="url(#visorGrad)" />
          {/* Eye light reflections */}
          <circle cx="52" cy="48" r="1.5" fill="white" opacity="0.7" />
          <circle cx="66" cy="48" r="1.5" fill="white" opacity="0.7" />

          {/* Friendly smile */}
          <path d="M54 58 Q60 62 66 58" stroke="#8a6a50" strokeWidth="1.8" fill="none" strokeLinecap="round" />

          {/* Ear accents */}
          <circle cx="39" cy="52" r="4" fill="#D4A24C" opacity="0.3" />
          <circle cx="81" cy="52" r="4" fill="#D4A24C" opacity="0.3" />

          {w ? (
            /* ── WORKING: back view, arms typing ── */
            <>
              <g className="brane-ch-arms">
                <path d="M44 84 Q24 76 16 64" stroke="url(#dressGrad)" strokeWidth="7" strokeLinecap="round" fill="none">
                  <animateTransform attributeName="transform" type="rotate" values="-4 44 84;4 44 84;-4 44 84" dur="1.2s" repeatCount="indefinite" />
                </path>
                <path d="M76 84 Q96 76 104 64" stroke="url(#dressGrad)" strokeWidth="7" strokeLinecap="round" fill="none">
                  <animateTransform attributeName="transform" type="rotate" values="4 76 84;-4 76 84;4 76 84" dur="1.2s" repeatCount="indefinite" />
                </path>
              </g>
              <circle cx="16" cy="64" r="4" fill="url(#bodyGrad)" />
              <circle cx="104" cy="64" r="4" fill="url(#bodyGrad)" />
              {[0, 1, 2].map((i) => (
                <circle key={i} cx={30 + i * 30} cy={30} r={1.5} fill="#D4A24C" className="brane-ch-particle" style={{ animationDelay: `${i * 0.35}s` }} />
              ))}
            </>
          ) : p ? (
            /* ── PRESENTING: front, arms open ── */
            <>
              <path d="M44 84 Q28 78 18 68" stroke="url(#dressGrad)" strokeWidth="7" strokeLinecap="round" fill="none" />
              <path d="M76 84 Q92 78 102 68" stroke="url(#dressGrad)" strokeWidth="7" strokeLinecap="round" fill="none" />
              <circle cx="18" cy="68" r="4" fill="url(#bodyGrad)" />
              <circle cx="102" cy="68" r="4" fill="url(#bodyGrad)" />
              <path d="M38 90 Q60 94 82 90" stroke="#F1D28A" strokeWidth="1" fill="none" opacity="0.4" />
            </>
          ) : s ? (
            /* ── SUCCESS: arms up ── */
            <>
              <g className="brane-ch-arms">
                <path d="M44 84 Q28 60 22 44" stroke="url(#dressGrad)" strokeWidth="7" strokeLinecap="round" fill="none">
                  <animateTransform attributeName="transform" type="rotate" values="-2 44 84;2 44 84;-2 44 84" dur="0.7s" repeatCount="indefinite" />
                </path>
                <path d="M76 84 Q92 60 98 44" stroke="url(#dressGrad)" strokeWidth="7" strokeLinecap="round" fill="none">
                  <animateTransform attributeName="transform" type="rotate" values="2 76 84;-2 76 84;2 76 84" dur="0.7s" repeatCount="indefinite" />
                </path>
              </g>
              <circle cx="22" cy="44" r="4" fill="url(#bodyGrad)" />
              <circle cx="98" cy="44" r="4" fill="url(#bodyGrad)" />
              {[0, 1, 2, 3, 4].map((i) => (
                <circle key={i} cx={15 + i * 22} cy={28} r={2} fill="#D4A24C" className="brane-ch-particle" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </>
          ) : (
            /* ── IDLE: front, hands together ── */
            <>
              <path d="M44 84 Q48 96 56 94" stroke="url(#dressGrad)" strokeWidth="6" strokeLinecap="round" fill="none" />
              <path d="M76 84 Q72 96 64 94" stroke="url(#dressGrad)" strokeWidth="6" strokeLinecap="round" fill="none" />
              <ellipse cx="60" cy="95" rx="6" ry="3" fill="url(#bodyGrad)" opacity="0.6" />
              <path d="M44 102 Q60 106 76 102" stroke="#F1D28A" strokeWidth="1" fill="none" opacity="0.3" />
            </>
          )}
        </svg>
      </div>
    </div>
  );
}

function ClickableCard({ label, selected, onClick, icon }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex items-center gap-3 w-full p-4 rounded-2xl border text-sm font-bold transition-all duration-200 ${
        selected
          ? "border-[#D4A24C] bg-[#D4A24C]/15 text-[#F1D28A] shadow-[0_0_20px_rgba(212,162,76,0.12)]"
          : "border-white/10 bg-white/[0.04] text-[#C9CBD6] hover:bg-white/[0.08] hover:border-white/20"
      }`}
    >
      {icon && <span className="text-base">{icon}</span>}
      <span>{label}</span>
      {selected && <Check size={15} className="ml-auto text-[#D4A24C]" />}
    </button>
  );
}

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
  const [step, setStep] = useState(0); // 0=input 1=review 2=cond 3=avail 4=contact 5=photo 6=preview
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
      setMessages([{
        id: 1, from: "ai",
        text: "Escreva os dados do seu anúncio separados por vírgula.\n\nExemplo:\niPhone 12 Pro, R$1200, Belém Pará, em perfeito estado, celular usado completo com acessórios"
      }]);
    }
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, step]);

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
    setBraneState("presenting");
    setStep(1);
  };

  const handleReviewContinue = () => {
    const needsCondition = !safe(ad.condition);
    const needsAvailability = !safe(ad.availability);
    setBraneState("idle");
    if (needsCondition) { setStep(2); return; }
    if (needsAvailability) { setStep(3); return; }
    setStep(4);
  };

  const handleRetype = () => {
    setStep(0); setLocalAd(defaultAd); setBraneState("idle");
    addMsg("Digite novamente os dados separados por vírgula:");
  };

  const handleSelectCondition = (cond) => {
    setLocalAd((prev) => ({ ...prev, condition: cond }));
    const needsAvail = !safe(ad.availability) && !safe(cond);
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
    } else {
      setStep(7); // sub-step for entering number
    }
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

    const cat = safe(ad.category);
    const catEmoji = CAT_EMOJIS[cat] || FALLBACK_EMOJI;
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
    setBraneState("presenting");
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

  const renderMessages = () => (
    <div className="space-y-2 max-h-[180px] overflow-y-auto scrollbar-thin px-0.5">
      {messages.map((m) => (
        <div key={m.id}
          className={`rounded-2xl px-3 py-2 text-sm ${
            m.from === "user"
              ? "ml-auto max-w-[85%] bg-[#D4A24C] text-black"
              : "mr-auto max-w-[88%] bg-white/10 text-white"
          }`}
        >
          <span className="whitespace-pre-wrap">{m.text}</span>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );

  const renderReview = () => {
    const fields = [
      { label: "Título", value: ad.title, icon: "📌" },
      { label: "Preço", value: ad.price ? `R$ ${ad.price}` : "", icon: "💰" },
      { label: "Categoria", value: ad.category, icon: "📂" },
      { label: "Cidade", value: ad.city, icon: "📍" },
      { label: "Estado", value: ad.state, icon: "🗺️" },
      { label: "Condição", value: ad.condition, icon: "🏷️" },
      { label: "Disponibilidade", value: ad.availability, icon: "📊" },
      { label: "Descrição", value: ad.description, icon: "📝" }
    ].filter((f) => safe(f.value));

    return (
      <div className="rounded-2xl border border-[#D4A24C]/30 p-4 space-y-2 brane-fade-in" style={{ background: "linear-gradient(135deg, rgba(212,162,76,0.12), rgba(212,162,76,0.03))" }}>
        <p className="text-xs font-black brane-gold-text mb-2">✨ Dados identificados</p>
        {fields.length ? fields.map((f) => (
          <div key={f.label} className="flex items-start gap-2">
            <span className="text-[10px] font-bold uppercase text-[#8C8F9A] min-w-[80px] shrink-0 mt-0.5">{f.icon} {f.label}</span>
            <span className="text-sm text-white">{f.value}</span>
          </div>
        )) : (
          <p className="text-sm text-[#A6A8B3]">Não consegui identificar. Tente novamente.</p>
        )}
        <div className="flex gap-2 mt-3">
          <button type="button" onClick={handleReviewContinue} className="flex-1 brane-btn-gold py-2.5 text-xs font-bold">
            ✓ Continuar
          </button>
          <button type="button" onClick={handleRetype} className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-xs font-bold text-[#A6A8B3] hover:bg-white/[0.08]">
            Digitar novamente
          </button>
        </div>
      </div>
    );
  };

  const renderConditionCards = () => (
    <div className="space-y-2 brane-fade-in">
      <p className="text-xs font-black brane-gold-text mb-2">Qual a condição do produto?</p>
      {CONDITIONS.map((c) => (
        <ClickableCard key={c} label={c} selected={localAd.condition === c} onClick={() => handleSelectCondition(c)}
          icon={c === "Novo" ? "🆕" : c === "Seminovo" ? "✨" : c === "Usado" ? "🔄" : "🔧"} />
      ))}
    </div>
  );

  const renderAvailabilityCards = () => (
    <div className="space-y-2 brane-fade-in">
      <p className="text-xs font-black brane-gold-text mb-2">Qual a disponibilidade?</p>
      {AVAILABILITIES.map((a) => (
        <ClickableCard key={a} label={a} selected={localAd.availability === a} onClick={() => handleSelectAvailability(a)}
          icon={a === "Item único" ? "📦" : a === "Várias unidades" ? "📦📦" : a === "Sob demanda" ? "📋" : "🔧"} />
      ))}
    </div>
  );

  const renderContactChoice = () => (
    <div className="space-y-2 brane-fade-in">
      <p className="text-xs font-black brane-gold-text mb-2">Deseja adicionar contato ao anúncio?</p>
      <p className="text-[11px] text-[#8C8F9A] mb-2">O número só aparece após o comprador clicar em "Entrar em contato"</p>
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
        <button type="button" onClick={handleContactDone} className="flex-1 brane-btn-gold py-2.5 text-xs font-bold">
          ✓ Confirmar
        </button>
        <button type="button" onClick={() => handleContactChoice("skip")}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-bold text-[#A6A8B3] hover:bg-white/[0.08]">
          Pular
        </button>
      </div>
    </div>
  );

  const renderPhotoStep = () => (
    <div className="brane-fade-in text-center">
      <p className="text-xs font-black brane-gold-text mb-3">Envie uma foto do seu produto</p>
      <button type="button" onClick={() => fileRef.current?.click()}
        className="w-full aspect-video max-w-xs mx-auto rounded-2xl border-2 border-dashed border-[#D4A24C]/30 flex flex-col items-center justify-center gap-2 text-[#C9CBD6] hover:border-[#D4A24C]/60 hover:bg-[#D4A24C]/5 transition-all cursor-pointer">
        <Camera size={36} className="text-[#D4A24C]/60" />
        <span className="text-sm font-bold">Clique para enviar foto</span>
        <span className="text-[10px] text-[#6F7280]">PNG, JPG até 5MB</span>
      </button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
    </div>
  );

  const renderPreview = () => {
    const p = ad;
    const cover = photoPreviews[0] || p.photos?.[0] || "";

    return (
      <div className="flex flex-col items-center gap-2 py-1 brane-fade-in">
        <div className="w-full max-w-[280px] rounded-2xl border border-[#D4A24C]/30 overflow-hidden brane-card-premium" style={{ background: "linear-gradient(180deg, rgba(212,162,76,0.06), rgba(10,10,15,0.95))" }}>
          <div className="flex">
            {cover ? (
              <img src={cover} alt="" className="w-24 h-24 object-cover shrink-0" />
            ) : (
              <div className="w-24 h-24 bg-[#0B0D12] flex items-center justify-center shrink-0">
                <Camera size={24} className="text-[#6F7280]" />
              </div>
            )}
            <div className="flex-1 p-2.5 min-w-0 space-y-1">
              {p.category && (
                <span className="inline-block px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-[#D4A24C]/15 text-[#D4A24C] border border-[#D4A24C]/30 leading-none">
                  {p.category}
                </span>
              )}
              <h3 className="text-sm font-black text-white leading-tight truncate">{p.title || "Título"}</h3>
              {p.price && (
                <p className="brane-gold-text text-base font-black">R$ {p.price}</p>
              )}
              {(p.city || p.state) && (
                <p className="text-[10px] text-[#8C8F9A] truncate">📍 {[p.city, p.state].filter(Boolean).join(" - ")}</p>
              )}
              <div className="flex flex-wrap gap-1">
                {p.condition && (
                  <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-[#5B1CB5]/20 text-[#7C3AED] border border-[#5B1CB5]/30 leading-none">
                    {p.condition}
                  </span>
                )}
                {p.availability && (
                  <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-[#10A875]/15 text-[#10A875] border border-[#10A875]/30 leading-none">
                    {p.availability}
                  </span>
                )}
              </div>
            </div>
          </div>
          {p.description && (
            <div className="px-2.5 pb-2.5">
              <p className="text-[11px] text-[#A6A8B3] leading-relaxed line-clamp-2">{p.description}</p>
            </div>
          )}
          {(p.phone || p.whatsapp) && (
            <div className="px-2.5 pb-2">
              <p className="text-[8px] text-[#6F7280]">📞 Contato configurado</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const showFooterButtons = step === 6;

  return (
    <div className="flex h-full flex-col rounded-[24px] border border-[#D4A24C]/30 relative overflow-hidden"
      style={{ background: "linear-gradient(180deg, rgba(212,162,76,0.08), rgba(10,10,15,0.95))", boxShadow: "inset 0 0 60px rgba(212,162,76,0.04), 0 0 40px rgba(212,162,76,0.06)" }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% -10%, rgba(212,162,76,0.15), transparent 60%)" }} />

      {/* Header */}
      <div className="border-b border-[#D4A24C]/20 px-5 py-3 relative z-10 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4A24C] to-[#8A6A24] flex items-center justify-center text-black font-black text-sm">B</div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] brane-gold-text" style={{ filter: "drop-shadow(0 0 12px rgba(212,162,76,0.3))" }}>BRANE</p>
              <p className="text-[9px] text-[#6F7280] tracking-wider">ASSISTENTE DE ANÚNCIOS</p>
            </div>
          </div>
          {step > 0 && (
            <button type="button" onClick={handleNew}
              className="text-[10px] text-[#6F7280] hover:text-[#D4A24C] transition-colors font-bold">
              ✨ Novo
            </button>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3 relative z-10 scrollbar-thin">
        <BraneCharacter state={braneState} />
        {renderMessages()}

        {step === 1 && renderReview()}
        {step === 2 && renderConditionCards()}
        {step === 3 && renderAvailabilityCards()}
        {step === 4 && renderContactChoice()}
        {step === 7 && renderContactInput()}
        {step === 5 && renderPhotoStep()}
        {step === 6 && renderPreview()}

        {/* Step 0 input */}
        {step === 0 && (
          <div className="flex gap-2 pt-1">
            <input value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmitInput()}
              placeholder="iPhone 12 Pro, R$1200, Belém Pará, em perfeito estado..."
              className="h-11 flex-1 rounded-xl border border-[#D4A24C]/20 bg-[#050608] px-3.5 text-sm text-white outline-none focus:border-[#D4A24C]/50 focus:shadow-[0_0_12px_rgba(212,162,76,0.12)]" />
            <button type="button" onClick={handleSubmitInput} disabled={!safe(input)}
              className="h-11 brane-btn-gold px-4 text-[13px] disabled:opacity-50">
              <Send size={16} />
            </button>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Footer buttons — always visible outside scroll */}
      {showFooterButtons && (
        <div className="border-t border-[#D4A24C]/20 px-5 py-3 relative z-10 flex-shrink-0">
          <div className="flex gap-2">
            <button type="button" onClick={handleImprove} disabled={!ad || isGenerating}
              className="flex-1 rounded-xl border border-[#D4A24C]/30 bg-[#D4A24C]/10 py-2.5 text-xs font-bold text-[#F1D28A] hover:bg-[#D4A24C]/20 disabled:opacity-50 transition-all">
              <Sparkles size={14} className="inline mr-1" />
              Melhorar anúncio
            </button>
            <button type="button" onClick={handlePublish} disabled={!ad || isGenerating}
              className="flex-1 brane-btn-gold py-2.5 text-xs font-bold disabled:opacity-50">
              Publicar agora
            </button>
            <button type="button" onClick={handleNew}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs font-bold text-[#A6A8B3] hover:bg-white/[0.08]">
              ✨ Novo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
