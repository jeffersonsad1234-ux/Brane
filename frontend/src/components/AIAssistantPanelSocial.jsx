import { useEffect, useRef, useState, useCallback } from "react";
import { ImagePlus, Send, Sparkles, X, Camera, ArrowLeft, Phone, MessageSquare, Check } from "lucide-react";

const CONDITIONS = ["Novo", "Usado", "Seminovo", "Recondicionado"];
const AVAILABILITIES = ["Item único", "Várias unidades", "Sob demanda", "Serviço"];
const CATEGORIES = ["Celulares", "Veículos", "Imóveis", "Casa e móveis", "Moda", "Serviços", "Outros"];

const defaultAd = {
  title: "",
  price: "",
  category: "",
  condition: "",
  city: "",
  state: "",
  availability: "Item único",
  description: "",
  phone: "",
  whatsapp: ""
};

const safe = (value) => String(value || "").trim();

const parseInput = (text) => {
  const parts = text.split(",").map((s) => s.trim()).filter(Boolean);
  const result = { ...defaultAd };

  if (parts.length === 0) return result;
  result.title = parts[0] || "";

  for (let i = 1; i < parts.length; i++) {
    const p = parts[i].toLowerCase();

    if (!result.price && /^r?\$?\s*[\d.,]+$/.test(p.replace(/\s/g, ""))) {
      result.price = parts[i].replace(/^r\$\s*/i, "").trim();
      continue;
    }

    const catMatch = CATEGORIES.find((c) => c.toLowerCase().includes(p) || p.includes(c.toLowerCase()));
    if (catMatch && !result.category) {
      result.category = catMatch;
      continue;
    }

    const condMatch = CONDITIONS.find((c) => c.toLowerCase().includes(p) || p.includes(c.toLowerCase()));
    if (condMatch && !result.condition) {
      result.condition = condMatch;
      continue;
    }

    result.description += (result.description ? ", " : "") + parts[i];
  }

  const locMatch = text.match(/([\w\sÀ-ÿ]+)\s*[-–]\s*([\w\sÀ-ÿ]+)/);
  if (locMatch) {
    result.city = locMatch[1].trim();
    result.state = locMatch[2].trim();
  }

  return result;
};

function BraneCharacter({ state }) {
  const isWorking = state === "working";
  const isPresenting = state === "presenting";
  const isSuccess = state === "success";

  return (
    <div className="relative w-32 h-40 mx-auto mb-2 brane-character-container">
      <svg viewBox="0 0 120 160" className="w-full h-full brane-character-svg">
        <defs>
          <radialGradient id="chGlow" cx="50%" cy="30%" r="60%">
            <stop offset="0%" stopColor="#D4A24C" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#D4A24C" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="chHair" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a0a2e" />
            <stop offset="100%" stopColor="#0d0015" />
          </linearGradient>
          <linearGradient id="chOutfit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D4A24C" />
            <stop offset="100%" stopColor="#8A6A24" />
          </linearGradient>
          <linearGradient id="chSkin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f0d5b0" />
            <stop offset="100%" stopColor="#d4a574" />
          </linearGradient>
        </defs>

        <ellipse cx="60" cy="75" rx="50" ry="55" fill="url(#chGlow)" className="brane-ch-glow" />

        {isWorking ? (
          <>
            <ellipse cx="60" cy="100" rx="20" ry="28" fill="#0d0015" />
            <circle cx="60" cy="55" r="20" fill="url(#chHair)" />
            <path d="M40 55 Q42 70 48 75" stroke="#1a0a2e" strokeWidth="3" fill="none" />
            <path d="M80 55 Q78 70 72 75" stroke="#1a0a2e" strokeWidth="3" fill="none" />
            <g className="brane-ch-arms">
              <path d="M40 88 Q28 72 18 60" stroke="url(#chOutfit)" strokeWidth="6" strokeLinecap="round" fill="none" />
              <path d="M80 88 Q92 72 102 60" stroke="url(#chOutfit)" strokeWidth="6" strokeLinecap="round" fill="none" />
            </g>
            {[0, 1, 2].map((i) => (
              <circle key={i} cx={25 + i * 35} cy={55} r={1.5 + i * 0.5} fill="#D4A24C" className="brane-ch-particle" style={{ animationDelay: `${i * 0.4}s` }} />
            ))}
          </>
        ) : isPresenting ? (
          <>
            <rect x="42" y="72" width="36" height="40" rx="8" fill="url(#chOutfit)" />
            <rect x="55" y="65" width="10" height="10" rx="3" fill="url(#chSkin)" />
            <circle cx="60" cy="48" r="20" fill="url(#chSkin)" />
            <path d="M40 48 Q40 25 60 22 Q80 25 80 48" fill="url(#chHair)" />
            <path d="M40 48 Q38 60 42 68" fill="url(#chHair)" />
            <path d="M80 48 Q82 60 78 68" fill="url(#chHair)" />
            <ellipse cx="52" cy="46" rx="3" ry="3.5" fill="#0d0015" />
            <ellipse cx="68" cy="46" rx="3" ry="3.5" fill="#0d0015" />
            <circle cx="53" cy="45" r="1" fill="white" opacity="0.6" />
            <circle cx="69" cy="45" r="1" fill="white" opacity="0.6" />
            <path d="M54 55 Q60 59 66 55" stroke="#0d0015" strokeWidth="1.5" fill="none" />
            <path d="M42 82 Q26 74 18 62" stroke="url(#chOutfit)" strokeWidth="6" strokeLinecap="round" fill="none" />
            <path d="M78 82 Q94 74 102 62" stroke="url(#chOutfit)" strokeWidth="6" strokeLinecap="round" fill="none" />
            <circle cx="18" cy="62" r="4" fill="url(#chSkin)" />
            <circle cx="102" cy="62" r="4" fill="url(#chSkin)" />
            <path d="M30 86 Q40 82 60 84 Q80 82 90 86" stroke="#D4A24C" strokeWidth="1" fill="none" opacity="0.5" />
          </>
        ) : isSuccess ? (
          <>
            <rect x="42" y="72" width="36" height="40" rx="8" fill="url(#chOutfit)" />
            <rect x="55" y="65" width="10" height="10" rx="3" fill="url(#chSkin)" />
            <circle cx="60" cy="48" r="20" fill="url(#chSkin)" />
            <path d="M40 48 Q40 25 60 22 Q80 25 80 48" fill="url(#chHair)" />
            <path d="M40 48 Q38 60 42 68" fill="url(#chHair)" />
            <path d="M80 48 Q82 60 78 68" fill="url(#chHair)" />
            <path d="M49 46 Q52 42 55 46" stroke="#0d0015" strokeWidth="2" fill="none" />
            <path d="M65 46 Q68 42 71 46" stroke="#0d0015" strokeWidth="2" fill="none" />
            <path d="M52 55 Q60 61 68 55" stroke="#0d0015" strokeWidth="2" fill="none" />
            <g className="brane-ch-arms">
              <path d="M42 82 Q30 58 24 42" stroke="url(#chOutfit)" strokeWidth="6" strokeLinecap="round" fill="none" />
              <path d="M78 82 Q90 58 96 42" stroke="url(#chOutfit)" strokeWidth="6" strokeLinecap="round" fill="none" />
            </g>
            <circle cx="24" cy="42" r="4" fill="url(#chSkin)" />
            <circle cx="96" cy="42" r="4" fill="url(#chSkin)" />
            {[0, 1, 2, 3, 4].map((i) => (
              <circle key={i} cx={20 + i * 20} cy={30} r={2} fill="#D4A24C" className="brane-ch-particle" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </>
        ) : (
          <>
            <rect x="42" y="72" width="36" height="40" rx="8" fill="url(#chOutfit)" />
            <rect x="55" y="65" width="10" height="10" rx="3" fill="url(#chSkin)" />
            <circle cx="60" cy="48" r="20" fill="url(#chSkin)" />
            <path d="M40 48 Q40 25 60 22 Q80 25 80 48" fill="url(#chHair)" />
            <path d="M40 48 Q38 60 42 68" fill="url(#chHair)" />
            <path d="M80 48 Q82 60 78 68" fill="url(#chHair)" />
            <ellipse cx="52" cy="46" rx="3" ry="3.5" fill="#0d0015" />
            <ellipse cx="68" cy="46" rx="3" ry="3.5" fill="#0d0015" />
            <circle cx="53" cy="45" r="1" fill="white" opacity="0.6" />
            <circle cx="69" cy="45" r="1" fill="white" opacity="0.6" />
            <path d="M55 54 Q60 56 65 54" stroke="#0d0015" strokeWidth="1.5" fill="none" />
            <path d="M42 82 Q32 90 30 100" stroke="url(#chOutfit)" strokeWidth="6" strokeLinecap="round" fill="none" />
            <path d="M78 82 Q88 90 90 100" stroke="url(#chOutfit)" strokeWidth="6" strokeLinecap="round" fill="none" />
            <path d="M45 90 Q60 95 75 90" stroke="#F1D28A" strokeWidth="1" fill="none" opacity="0.3" />
          </>
        )}
      </svg>
    </div>
  );
}

function ClickableCard({ label, selected, onClick, icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 w-full p-4 rounded-2xl border text-sm font-bold transition-all duration-200 ${
        selected
          ? "border-[#D4A24C] bg-[#D4A24C]/15 text-[#F1D28A] shadow-[0_0_20px_rgba(212,162,76,0.12)]"
          : "border-white/10 bg-white/[0.04] text-[#C9CBD6] hover:bg-white/[0.08] hover:border-white/20"
      }`}
    >
      {icon && <span className="text-lg">{icon}</span>}
      <span>{label}</span>
      {selected && <Check size={16} className="ml-auto text-[#D4A24C]" />}
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
  const [step, setStep] = useState(0);
  const [input, setInput] = useState("");
  const [localAd, setLocalAd] = useState(defaultAd);
  const [braneState, setBraneState] = useState("idle");
  const [messages, setMessages] = useState([
    {
      id: 1,
      from: "ai",
      text: "Olá! Eu sou a BRANE, sua assistente inteligente. ✨\n\nEscreva os dados do seu anúncio separados por vírgula.\n\nExemplo:\nvendo iPhone 12, R$ 2500, São Paulo - SP, Celulares, Novo, 6 meses de uso, completo com acessórios"
    }
  ]);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [contactPhone, setContactPhone] = useState("");
  const [contactWhatsapp, setContactWhatsapp] = useState("");

  const fileRef = useRef(null);
  const endRef = useRef(null);
  const previewTimerRef = useRef(null);

  const ad = generatedAd || localAd;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, step, ad]);

  const addMessage = useCallback((text, from = "ai") => {
    setMessages((prev) => [...prev, { id: prev.length + 1, from, text }]);
  }, []);

  const simulateWork = useCallback((duration = 2000) => {
    setBraneState("working");
    return new Promise((resolve) => {
      setTimeout(() => {
        setBraneState("presenting");
        resolve();
      }, duration);
    });
  }, []);

  const handleSubmitInput = async () => {
    const text = safe(input);
    if (!text) return;

    addMessage(text, "user");
    setInput("");
    setBraneState("working");

    await new Promise((r) => setTimeout(r, 2000));

    const parsed = parseInput(text);
    setLocalAd(parsed);
    setBraneState("presenting");

    setStep(1);
    addMessage("Perfeito! Identifiquei as informações do seu anúncio. Veja abaixo: ✓");
  };

  const handleConfirmParsed = () => {
    setBraneState("idle");
    setStep(2);
    addMessage("Qual a condição do produto?");
  };

  const handleRetype = () => {
    setBraneState("idle");
    setStep(0);
    setLocalAd(defaultAd);
    addMessage("Ok, digite novamente os dados separados por vírgula:", "ai");
  };

  const handleSelectCondition = (cond) => {
    setLocalAd((prev) => ({ ...prev, condition: cond }));
    setBraneState("idle");
    setStep(3);
    addMessage(`Condição: "${cond}". Agora me diga, qual a disponibilidade?`);
  };

  const handleSelectAvailability = (avail) => {
    setLocalAd((prev) => ({ ...prev, availability: avail }));
    setBraneState("idle");
    setStep(4);
    addMessage("Quer adicionar telefone ou WhatsApp para contato? (opcional)");
  };

  const handleContactNext = () => {
    setLocalAd((prev) => ({
      ...prev,
      phone: safe(contactPhone),
      whatsapp: safe(contactWhatsapp)
    }));
    setBraneState("idle");
    setStep(5);
    addMessage("Agora envie uma foto do seu produto:");
  };

  const handleSkipContact = () => {
    setContactPhone("");
    setContactWhatsapp("");
    setLocalAd((prev) => ({ ...prev, phone: "", whatsapp: "" }));
    setBraneState("idle");
    setStep(5);
    addMessage("Agora envie uma foto do seu produto:");
  };

  const handlePhotoSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setPhotoFiles(files);
    const previews = await Promise.all(
      files.slice(0, 5).map((f) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(f);
        });
      })
    );
    setPhotoPreviews(previews);
  };

  const handlePhotoConfirm = async () => {
    setBraneState("working");
    await new Promise((r) => setTimeout(r, 1500));

    const completeAd = {
      ...localAd,
      photos: photoPreviews
    };
    setLocalAd(completeAd);
    onPhotoUpload(photoFiles);
    onFillForm(completeAd);

    setBraneState("presenting");
    setStep(6);
    addMessage("Pronto! Aqui está a prévia do seu anúncio. ✨");
  };

  const handleImprove = async () => {
    if (!ad) return;

    setBraneState("working");
    await new Promise((r) => setTimeout(r, 2000));

    const improved = {
      ...ad,
      title: ad.title && !ad.title.toLowerCase().includes("vendo")
        ? `🔥 ${ad.title}`
        : ad.title,
      description: ad.description
        ? ad.description.replace(/\.$/, "") + "!\n\n🔥 Chame agora e garanta antes que acabe!"
        : "Produto de qualidade! 🔥 Chame agora e garanta antes que acabe!",
      _improved: true
    };

    setLocalAd(improved);
    onImproveAd(improved);
    onFillForm(improved);
    setBraneState("presenting");

    addMessage("Anúncio melhorado! Adicionei um toque profissional com emojis e uma chamada irresistível. ✨");
  };

  const handlePublish = async () => {
    setBraneState("success");
    await new Promise((r) => setTimeout(r, 1500));
    onPublishAd({
      ...ad,
      photos: photoPreviews
    });
  };

  const handleNew = () => {
    setStep(0);
    setInput("");
    setLocalAd(defaultAd);
    setPhotoFiles([]);
    setPhotoPreviews([]);
    setContactPhone("");
    setContactWhatsapp("");
    setBraneState("idle");
    onGenerateNew();
  };

  const renderParsedInfo = () => {
    const fields = [
      { label: "Título", value: ad.title },
      { label: "Preço", value: ad.price ? `R$ ${ad.price}` : "" },
      { label: "Categoria", value: ad.category },
      { label: "Cidade", value: ad.city },
      { label: "Estado", value: ad.state },
      { label: "Descrição", value: ad.description }
    ];
    const hasInfo = fields.some((f) => safe(f.value));

    return (
      <div className="rounded-2xl border border-[#D4A24C]/30 p-4 space-y-2" style={{ background: "linear-gradient(135deg, rgba(212,162,76,0.12), rgba(212,162,76,0.03))" }}>
        <p className="text-xs font-black brane-gold-text mb-2">📋 Dados identificados</p>
        {hasInfo ? fields.filter((f) => safe(f.value)).map((f) => (
          <div key={f.label} className="flex items-start gap-2">
            <span className="text-[10px] font-bold uppercase text-[#8C8F9A] min-w-[80px] mt-0.5">{f.label}</span>
            <span className="text-sm text-white">{f.value}</span>
          </div>
        )) : (
          <p className="text-sm text-[#A6A8B3]">Não consegui identificar os campos. Tente novamente com mais detalhes.</p>
        )}
        <div className="flex gap-2 mt-3">
          <button type="button" onClick={handleConfirmParsed} className="flex-1 brane-btn-gold py-2 text-xs font-bold">
            ✓ Confirmar
          </button>
          <button type="button" onClick={handleRetype} className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] py-2 text-xs font-bold text-[#A6A8B3] hover:bg-white/[0.08]">
            Digitar novamente
          </button>
        </div>
      </div>
    );
  };

  const renderConditionCards = () => (
    <div className="space-y-2">
      <p className="text-xs font-black brane-gold-text mb-2">Selecione a condição:</p>
      {CONDITIONS.map((cond) => (
        <ClickableCard
          key={cond}
          label={cond}
          selected={localAd.condition === cond}
          onClick={() => handleSelectCondition(cond)}
          icon={cond === "Novo" ? "🆕" : cond === "Usado" ? "🔄" : cond === "Seminovo" ? "✨" : "🔧"}
        />
      ))}
    </div>
  );

  const renderAvailabilityCards = () => (
    <div className="space-y-2">
      <p className="text-xs font-black brane-gold-text mb-2">Selecione a disponibilidade:</p>
      {AVAILABILITIES.map((avail) => (
        <ClickableCard
          key={avail}
          label={avail}
          selected={localAd.availability === avail}
          onClick={() => handleSelectAvailability(avail)}
          icon={avail === "Item único" ? "📦" : avail === "Várias unidades" ? "📦📦" : avail === "Sob demanda" ? "📋" : "🔧"}
        />
      ))}
    </div>
  );

  const renderContactForm = () => (
    <div className="space-y-3">
      <p className="text-xs font-black brane-gold-text">Contato (opcional)</p>
      <p className="text-xs text-[#8C8F9A]">O número só aparece após o comprador clicar em "Entrar em contato".</p>
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-3">
        <Phone size={16} className="text-[#D4A24C]" />
        <input
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
          placeholder="Telefone (opcional)"
          className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#6F7280]"
        />
      </div>
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-3">
        <MessageSquare size={16} className="text-[#25D366]" />
        <input
          value={contactWhatsapp}
          onChange={(e) => setContactWhatsapp(e.target.value)}
          placeholder="WhatsApp (opcional)"
          className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#6F7280]"
        />
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={handleContactNext} className="flex-1 brane-btn-gold py-2 text-xs font-bold">
          Continuar
        </button>
        <button type="button" onClick={handleSkipContact} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-[#A6A8B3] hover:bg-white/[0.08]">
          Pular
        </button>
      </div>
    </div>
  );

  const renderPhotoStep = () => (
    <div className="space-y-3">
      <p className="text-xs font-black brane-gold-text">Foto do anúncio</p>
      {photoPreviews.length > 0 ? (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {photoPreviews.map((p, i) => (
              <img key={i} src={p} alt="" className="w-full aspect-square rounded-xl object-cover border border-white/10" />
            ))}
          </div>
          <button type="button" onClick={() => fileRef.current?.click()} className="w-full rounded-xl border border-[#D4A24C]/30 bg-[#D4A24C]/10 py-2 text-xs font-bold text-[#F1D28A] hover:bg-[#D4A24C]/20 transition-colors">
            Trocar foto
          </button>
          <button type="button" onClick={handlePhotoConfirm} className="w-full brane-btn-gold py-2 text-xs font-bold">
            ✓ Confirmar foto
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-full aspect-video rounded-2xl border-2 border-dashed border-[#D4A24C]/30 flex flex-col items-center justify-center gap-2 text-[#C9CBD6] hover:border-[#D4A24C]/60 hover:bg-[#D4A24C]/5 transition-all"
        >
          <Camera size={32} className="text-[#D4A24C]/60" />
          <span className="text-sm font-bold">Clique para enviar foto</span>
          <span className="text-[10px] text-[#6F7280]">PNG, JPG até 5MB</span>
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
    </div>
  );

  const renderPreview = () => {
    const p = ad;
    const cover = photoPreviews[0] || p.photos?.[0] || "";

    return (
      <div className="flex flex-col items-center gap-4 py-2">
        <div className="w-full max-w-sm rounded-3xl border border-[#D4A24C]/30 overflow-hidden" style={{ background: "linear-gradient(180deg, rgba(212,162,76,0.06), rgba(10,10,15,0.95))" }}>
          {cover ? (
            <img src={cover} alt="" className="w-full aspect-square object-cover" />
          ) : (
            <div className="w-full aspect-square bg-[#0B0D12] flex items-center justify-center">
              <Camera size={48} className="text-[#6F7280]" />
            </div>
          )}
          <div className="p-5 space-y-3">
            {p.category && (
              <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#D4A24C]/15 text-[#D4A24C] border border-[#D4A24C]/30">
                {p.category}
              </span>
            )}
            <h3 className="text-xl font-black text-white">{p.title || "Título do anúncio"}</h3>
            {p.price && (
              <p className="brane-gold-text text-3xl font-black">R$ {p.price}</p>
            )}
            {(p.city || p.state) && (
              <p className="text-sm text-[#8C8F9A]">📍 {[p.city, p.state].filter(Boolean).join(" - ")}</p>
            )}
            {p.condition && (
              <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold bg-[#5B1CB5]/20 text-[#7C3AED] border border-[#5B1CB5]/30">
                {p.condition}
              </span>
            )}
            {p.availability && (
              <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold bg-[#10A875]/15 text-[#10A875] border border-[#10A875]/30 ml-2">
                {p.availability}
              </span>
            )}
            {p.description && (
              <p className="text-sm text-[#A6A8B3] leading-relaxed whitespace-pre-wrap">{p.description}</p>
            )}
            {(p.phone || p.whatsapp) && (
              <p className="text-[10px] text-[#6F7280] border-t border-white/10 pt-3 mt-3">
                📞 Contato disponível (aparece após clicar em "Entrar em contato")
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2 w-full max-w-sm">
          <button type="button" onClick={handleImprove} disabled={!ad || isGenerating} className="flex-1 rounded-xl border border-[#D4A24C]/30 bg-[#D4A24C]/10 py-3 text-xs font-bold text-[#F1D28A] hover:bg-[#D4A24C]/20 disabled:opacity-50 transition-all">
            <Sparkles size={14} className="inline mr-1" />
            Melhorar
          </button>
          <button type="button" onClick={handlePublish} disabled={!ad || isGenerating} className="flex-1 brane-btn-gold py-3 text-xs font-bold disabled:opacity-50">
            Publicar
          </button>
        </div>

        <button type="button" onClick={handleNew} className="text-xs text-[#6F7280] hover:text-[#A6A8B3] underline underline-offset-2 transition-colors">
          Criar novo anúncio
        </button>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col rounded-[24px] border border-[#D4A24C]/30 relative overflow-hidden" style={{ background: "linear-gradient(180deg, rgba(212,162,76,0.08), rgba(10,10,15,0.95))", boxShadow: "inset 0 0 60px rgba(212,162,76,0.04), 0 0 40px rgba(212,162,76,0.06)" }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% -10%, rgba(212,162,76,0.15), transparent 60%)" }}></div>

      <div className="border-b border-[#D4A24C]/20 px-5 py-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm" role="img" aria-label="BRANE">🤖</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] brane-gold-text" style={{ filter: "drop-shadow(0 0 12px rgba(212,162,76,0.3))" }}>
                BRANE
              </p>
              <p className="text-[10px] text-[#6F7280]">Assistente inteligente</p>
            </div>
          </div>
          {step > 0 && (
            <button type="button" onClick={handleNew} className="text-[10px] text-[#6F7280] hover:text-white transition-colors">
              Novo ✨
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 relative z-10 scrollbar-thin">
        <BraneCharacter state={braneState} />

        {step === 0 && (
          <div className="space-y-3">
            {messages.filter((m) => m.id > 1 || step === 0).map((message) => (
              <div
                key={message.id}
                className={`rounded-2xl px-3 py-2 text-sm ${
                  message.from === "user"
                    ? "ml-auto max-w-[88%] bg-[#D4A24C] text-black"
                    : "mr-auto max-w-[88%] bg-white/10 text-white"
                }`}
              >
                <span className="whitespace-pre-wrap">{message.text}</span>
              </div>
            ))}
            <div className="flex gap-2">
              <button type="button" onClick={() => fileRef.current?.click()} className="h-10 rounded-xl border border-[#D4A24C]/30 bg-[#D4A24C]/10 px-3 text-[#F1D28A] hover:bg-[#D4A24C]/20 transition-colors">
                <ImagePlus size={16} />
              </button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmitInput()}
                placeholder='Ex: iPhone 12, R$ 2500, São Paulo - SP, Celulares, Novo, 6 meses de uso...'
                className="h-10 flex-1 rounded-xl border border-[#D4A24C]/20 bg-[#050608] px-3 text-sm text-white outline-none focus:border-[#D4A24C]/50 focus:shadow-[0_0_12px_rgba(212,162,76,0.12)]"
              />
              <button type="button" onClick={handleSubmitInput} disabled={!safe(input)} className="h-10 brane-btn-gold px-3 text-[13px] disabled:opacity-50">
                <Send size={16} />
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
          </div>
        )}

        {step === 1 && renderParsedInfo()}

        {step === 2 && renderConditionCards()}

        {step === 3 && renderAvailabilityCards()}

        {step === 4 && renderContactForm()}

        {step === 5 && renderPhotoStep()}

        {step === 6 && renderPreview()}

        <div ref={endRef} />
      </div>
    </div>
  );
}
