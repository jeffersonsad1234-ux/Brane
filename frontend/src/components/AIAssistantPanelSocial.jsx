import { useEffect, useRef, useState } from "react";
import { ImagePlus, Send, RefreshCw, CheckCircle2, Camera } from "lucide-react";

// Variantes de CTA para o botão "Melhorar" — cada clique substitui a versão anterior
// O CTA é contextual ao produto e nunca repete cidade nem frases anteriores
const buildCTA = (ad, index) => {
  const title = (ad.title || "produto").toLowerCase();
  const variants = [
    `Chame no chat e garante o seu ${title} hoje mesmo.`,
    `Entre em contato para combinar a entrega e garantir o melhor preço.`,
    `Interessou? Manda mensagem e fechamos negócio rapidinho.`,
    `Aproveite essa oportunidade — manda mensagem antes que acabe.`
  ];
  return variants[index % variants.length];
};

const OPENER_SETS = [
  ["🌟", "✨", "💫"],
  ["🔥", "⚡", "💥"],
  ["💎", "🏆", "⭐"],
  ["🎯", "🚀", "💡"]
];

let improveIndex = 0;

// Monta descrição enriquecida.
// SEMPRE usa _rawDescription como base para nunca acumular versões anteriores.
const buildRichDescription = (ad, variantIndex) => {
  const emojis = OPENER_SETS[variantIndex % OPENER_SETS.length].join(" ");
  // Usa _rawDescription (descrição pura do cliente) como base
  const rawDesc = (ad._rawDescription || "").trim() || (ad.title || "").trim();
  const cta = buildCTA(ad, variantIndex);
  return `${emojis} ${rawDesc}\n\n${cta}`;
};

const defaultAd = {
  title: "",
  price: "",
  category: "",
  product_condition: "", // Novo, Usado, Seminovo
  city: "",
  state: "",
  availability: "Item único",
  description: "",
  photos: []
};

const safe = (value) => String(value || "").trim();

const detectCategory = (text) => {
  const t = text.toLowerCase();
  if (t.includes("iphone") || t.includes("celular") || t.includes("samsung") || t.includes("xiaomi")) return "Celulares";
  if (t.includes("cadeira") || t.includes("mesa") || t.includes("sofa") || t.includes("armario")) return "Casa e móveis";
  if (t.includes("removedor") || t.includes("limpeza") || t.includes("detergente") || t.includes("sabao")) return "Casa e limpeza";
  if (t.includes("ps5") || t.includes("xbox") || t.includes("game") || t.includes("nintendo")) return "Games";
  if (t.includes("carro") || t.includes("moto") || t.includes("veiculo")) return "Veículos";
  return "Outros";
};

// Detecta preço em qualquer parte do texto.
// Trata o caso em que o split por vírgula quebra "18,99" em ["18", "99"].
const extractPrice = (parts) => {
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i].trim();
    // Padrão completo: R$ 1.500,00 ou R$1500 ou 1500 ou 1.500
    if (/^R?\$?\s*\d{1,3}(?:\.\d{3})*(?:,\d{2})?$/.test(p.replace(/\s/g, "")) ||
        /^R?\$?\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?$/.test(p.replace(/\s/g, ""))) {
      return { price: p, index: i };
    }
    // Detecta quando a vírgula quebrou o preço decimal em duas partes:
    // parte atual é só número (ex: "18" ou "R$ 18") E próxima é exatamente 2 dígitos (ex: "99")
    const pClean = p.replace(/^R?\$?\s*/i, "");
    if (/^\d{1,4}$/.test(pClean) && i + 1 < parts.length && /^\d{2}$/.test(parts[i + 1].trim())) {
      const joined = p + "," + parts[i + 1].trim();
      return { price: joined, index: i, extraIndex: i + 1 };
    }
    // Detecta número inteiro simples como preço (ex: "18" sozinho, sem parte decimal depois)
    if (/^R?\$?\s*\d+$/.test(p.replace(/\s/g, "")) && (i + 1 >= parts.length || !/^\d{2}$/.test(parts[i + 1]?.trim()))) {
      // Só aceita como preço se não for a primeira parte (título) e não for a última (cidade)
      if (i > 0 && i < parts.length - 1) {
        return { price: p, index: i };
      }
    }
  }
  return null;
};

// Detecta estado do produto em qualquer parte
const CONDITION_OPTIONS = ["Novo", "Seminovo", "Usado", "Pouco usado", "Em boas condições", "Com marcas de uso", "Precisa de reparo"];
const CONDITION_MAP = {
  "novo": "Novo",
  "seminovo": "Seminovo",
  "usado": "Usado",
  "pouco usado": "Pouco usado",
  "em boas condições": "Em boas condições",
  "em bom estado": "Em boas condições",
  "com marcas de uso": "Com marcas de uso",
  "com detalhes": "Com marcas de uso",
  "precisa de reparo": "Precisa de reparo",
  "para retirada de peças": "Precisa de reparo"
};

// Detecta disponibilidade no texto livre
const AVAILABILITY_OPTIONS = ["Item único", "Tenho várias unidades", "Sob demanda", "Serviço", "Produto personalizado"];
const AVAILABILITY_MAP = {
  "item único": "Item único",
  "unico": "Item único",
  "único": "Item único",
  "várias unidades": "Tenho várias unidades",
  "varias unidades": "Tenho várias unidades",
  "vários": "Tenho várias unidades",
  "varios": "Tenho várias unidades",
  "sob demanda": "Sob demanda",
  "encomenda": "Sob demanda",
  "serviço": "Serviço",
  "servico": "Serviço",
  "personalizado": "Produto personalizado",
  "produto personalizado": "Produto personalizado"
};

const detectAvailabilityInText = (text) => {
  const t = text.toLowerCase();
  for (const [key, val] of Object.entries(AVAILABILITY_MAP)) {
    if (t.includes(key)) return val;
  }
  return null;
};

const extractCondition = (parts) => {
  // Tenta detectar em partes individuais
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i].trim().toLowerCase();
    if (CONDITION_MAP[p]) {
      return { condition: CONDITION_MAP[p], index: i };
    }
  }
  // Tenta detectar em pares de partes adjacentes (ex: "pouco" + "usado")
  for (let i = 0; i < parts.length - 1; i++) {
    const pair = (parts[i] + " " + parts[i + 1]).trim().toLowerCase();
    if (CONDITION_MAP[pair]) {
      return { condition: CONDITION_MAP[pair], index: i, extraIndex: i + 1 };
    }
  }
  return null;
};

const extractByPosition = (text) => {
  // Pré-processamento: une preços decimais que seriam quebrados pelo split
  // Ex: "18,99" -> "18.99" (usa ponto como separador temporário)
  // Padrão: número seguido de vírgula seguido de exatamente 2 dígitos
  const preprocessed = text.replace(/((?:R\$\s*)?\d{1,4}),(\d{2})(?=[,\s]|$)/gi, "$1.$2");
  const rawParts = preprocessed.split(",").map(p => p.trim()).filter(Boolean);

  // Detecta preço e estado em qualquer posição
  const priceResult = extractPrice(rawParts);
  const conditionResult = extractCondition(rawParts);

  // Índices a remover (preço e estado já identificados)
  const usedIndices = new Set();
  let price = "";
  let product_condition = "";

  if (priceResult) {
    price = priceResult.price;
    usedIndices.add(priceResult.index);
    if (priceResult.extraIndex !== undefined) usedIndices.add(priceResult.extraIndex);
  }
  if (conditionResult) {
    product_condition = conditionResult.condition;
    usedIndices.add(conditionResult.index);
  }

  // Partes restantes (sem preço e sem estado)
  const remaining = rawParts.filter((_, i) => !usedIndices.has(i));

  // Primeira parte sempre é o título
  const title = remaining[0] || "";
  // Última parte restante tende a ser a cidade
  const city = remaining.length > 1 ? remaining[remaining.length - 1] : "";
  // O meio é a descrição (excluindo título e cidade)
  const descParts = remaining.slice(1, remaining.length > 1 ? remaining.length - 1 : 1);
  const description = descParts.join(", ");

  return {
    title,
    product_condition,
    description,
    price,
    city,
    category: detectCategory(text),
    availability: detectAvailabilityInText(text) || ""
  };
};

export default function AIAssistantPanelSocial({
  onPhotoUpload = () => {},
  onGenerateAd = () => {},
  onImproveAd = () => {},
  onGenerateNew = () => {},
  onFillForm = () => {},
  onPublishAd = () => {},
  generatedAd = null,
  isGenerating = false,
  uploadedPhotos = []
}) {
  const [input, setInput] = useState("");
  const [localAd, setLocalAd] = useState(null);
  const [photosCount, setPhotosCount] = useState(0);
  // Controla etapa de seleção guiada: null = nenhuma pendente, 'condition' ou 'availability'
  const [pendingStep, setPendingStep] = useState(null);
  const [messages, setMessages] = useState([
    {
      id: 1,
      from: "system",
      text: "Descreva em uma única mensagem, separando por vírgulas: produto, estado, detalhes, preço, cidade. Depois envie pelo menos 1 foto. Ex: iPhone 12, usado, 128GB bateria 86%, R$1500, Guarulhos-SP."
    }
  ]);
  const fileRef = useRef(null);
  const endRef = useRef(null);

  const ad = generatedAd || localAd;

  // Sincroniza photosCount com o array real de fotos recebido do pai
  useEffect(() => {
    if (uploadedPhotos.length !== photosCount) {
      setPhotosCount(uploadedPhotos.length);
    }
  }, [uploadedPhotos]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, ad, isGenerating]);

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    await onPhotoUpload(files);
    setPhotosCount(prev => prev + files.length);
    setMessages((prev) => [
      ...prev,
      { id: prev.length + 1, from: "system", text: `✅ ${files.length} foto(s) adicionada(s).` }
    ]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleGenerate = () => {
    const text = safe(input);
    if (!text) return;
    
    setMessages((prev) => [...prev, { id: prev.length + 1, from: "user", text }]);
    setInput("");

    const extracted = extractByPosition(text);
    
    // Se o usuário estiver respondendo a uma pergunta específica, mescla com o que já temos
    const currentBase = localAd || defaultAd;
    const merged = {
      ...currentBase,
      title: extracted.title || currentBase.title,
      product_condition: extracted.product_condition || currentBase.product_condition,
      description: extracted.description || currentBase.description,
      price: extracted.price || currentBase.price,
      city: extracted.city || currentBase.city,
      category: extracted.category || currentBase.category,
      availability: extracted.availability || currentBase.availability || ""
    };

    const missing = [];
    if (!merged.title) missing.push("produto");
    if (!merged.description) missing.push("detalhes/descrição");
    if (!merged.price) missing.push("preço");
    if (!merged.city) missing.push("cidade");
    
    if (missing.length > 0) {
      setMessages((prev) => [
        ...prev, 
        { id: prev.length + 1, from: "system", text: `Legal! Agora me informe o ${missing[0]}.` }
      ]);
      setLocalAd(merged);
      return;
    }

    // Verifica campos de seleção guiada (estado e disponibilidade)
    // Não usa chat — exibe painel visual de botões na UI
    if (!merged.product_condition) {
      setLocalAd(merged);
      setPendingStep("condition");
      return;
    }

    if (!merged.availability) {
      setLocalAd(merged);
      setPendingStep("availability");
      return;
    }

    if (photosCount === 0) {
      setMessages((prev) => [
        ...prev, 
        { id: prev.length + 1, from: "system", text: "Agora envie pelo menos 1 foto do produto para eu preparar o anúncio." }
      ]);
      setLocalAd(merged);
      return;
    }

    // Enriquece a descrição já na geração inicial (prévia já vem com emojis)
    improveIndex = 0;
    const enriched = { ...merged, _rawDescription: merged.description };
    enriched.description = buildRichDescription(enriched, improveIndex);
    setLocalAd(enriched);
    onGenerateAd(enriched);
    onFillForm(enriched);
    setMessages((prev) => [
      ...prev,
      { id: prev.length + 1, from: "system", text: "Tudo pronto! Confira a prévia do seu anúncio abaixo." }
    ]);
  };

  useEffect(() => {
    if (photosCount > 0 && localAd && !localAd.ready && localAd.title && localAd.price && localAd.city) {
      // Se ainda falta estado do produto, exibe painel visual (sem mensagem no chat)
      if (!localAd.product_condition) {
        setPendingStep("condition");
        return;
      }
      // Se ainda falta disponibilidade, exibe painel visual (sem mensagem no chat)
      if (!localAd.availability) {
        setPendingStep("availability");
        return;
      }
      // Tudo preenchido: enriquece a descrição e gera prévia
      improveIndex = 0;
      const rawDesc = localAd._rawDescription || localAd.description || localAd.title || "";
      const enriched = { ...localAd, ready: true, _rawDescription: rawDesc };
      enriched.description = buildRichDescription(enriched, improveIndex);
      setLocalAd(enriched);
      onGenerateAd(enriched);
      onFillForm(enriched);
      setMessages((prev) => [
        ...prev,
        { id: prev.length + 1, from: "system", text: "Fotos recebidas! Aqui está a prévia do seu anúncio." }
      ]);
    }
  }, [photosCount]);

  const handleImprove = () => {
    if (!ad) return;
    // Avança para o próximo variant
    improveIndex = (improveIndex + 1) % OPENER_SETS.length;
    // _rawDescription é sempre a descrição pura do cliente — nunca a versão enriquecida
    // Garante que _rawDescription está preservado antes de reescrever
    const rawDesc = (ad._rawDescription || "").trim() || (ad.title || "").trim();
    const adBase = { ...ad, _rawDescription: rawDesc };
    // buildRichDescription usa _rawDescription internamente, nunca description
    const improvedDescription = buildRichDescription(adBase, improveIndex);
    const improved = { ...adBase, description: improvedDescription };
    setLocalAd(improved);
    onImproveAd(improved);
    onFillForm(improved);
  };

  // Trata seleção de opção guiada (estado ou disponibilidade)
  // Não adiciona mensagens no chat — apenas avança o fluxo visualmente
  const handleSelectOption = (field, value) => {
    const updated = { ...(localAd || defaultAd), [field]: value };
    setLocalAd(updated);
    setPendingStep(null);

    // Verifica o próximo passo pendente (sem mensagem no chat)
    if (field === "product_condition" && !updated.availability) {
      setPendingStep("availability");
      return;
    }

    // Ambos preenchidos: verifica fotos
    if (photosCount === 0) {
      setMessages((prev) => [
        ...prev,
        { id: prev.length + 1, from: "system", text: "Agora envie pelo menos 1 foto do produto para eu preparar o anúncio." }
      ]);
      return;
    }

    // Tudo pronto: gera prévia enriquecida
    improveIndex = 0;
    const enriched = { ...updated, _rawDescription: updated.description || updated.title };
    enriched.description = buildRichDescription(enriched, improveIndex);
    const final = { ...enriched, ready: true };
    setLocalAd(final);
    onGenerateAd(final);
    onFillForm(final);
    setMessages((prev) => [
      ...prev,
      { id: prev.length + 1, from: "system", text: "Tudo pronto! Confira a prévia do seu anúncio abaixo." }
    ]);
  };

  const handleReset = () => {
    setInput("");
    setLocalAd(null);
    setPhotosCount(0);
    setPendingStep(null);
    setMessages([{
      id: 1,
      from: "system",
      text: "Descreva em uma única mensagem, separando por vírgulas: produto, estado, detalhes, preço, cidade. Depois envie pelo menos 1 foto. Ex: iPhone 12, usado, 128GB bateria 86%, R$1500, Guarulhos-SP."
    }]);
    onGenerateNew();
    onFillForm(defaultAd);
  };

  return (
    <div className="flex h-full flex-col rounded-[24px] border border-white/10 bg-black/20 overflow-hidden">
      <div className="border-b border-white/10 p-4 bg-white/[0.02]">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8C8F9A]">
          Novo anúncio
        </p>
        <p className="mt-1 text-sm text-white/70">
          Crie seu anúncio de forma simples e rápida.
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4 scrollbar-hide">
        {messages.map((message) => (
          <div
            key={message.id}
            className={
              "rounded-2xl px-4 py-2.5 text-sm leading-relaxed " +
              (message.from === "user"
                ? "ml-auto max-w-[85%] bg-[#D4A24C] text-black font-medium"
                : "mr-auto max-w-[85%] bg-white/10 text-white/90 border border-white/5")
            }
          >
            {message.text}
          </div>
        ))}

        {/* Painel visual de seleção de ESTADO DO PRODUTO */}
        {pendingStep === "condition" && (
          <div className="mx-auto w-full max-w-[95%] rounded-2xl border border-[#D4A24C]/40 bg-gradient-to-b from-[#D4A24C]/10 to-transparent p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <span className="text-base">🏷️</span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#F1D28A]">Estado do produto</p>
                <p className="text-xs text-white/50">Selecione uma opção para continuar</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {CONDITION_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleSelectOption("product_condition", opt)}
                  className="rounded-xl border border-[#D4A24C]/50 bg-black/30 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-[#D4A24C]/20 hover:border-[#D4A24C] hover:text-[#F1D28A] active:scale-95 transition-all"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Painel visual de seleção de DISPONIBILIDADE */}
        {pendingStep === "availability" && (
          <div className="mx-auto w-full max-w-[95%] rounded-2xl border border-[#D4A24C]/40 bg-gradient-to-b from-[#D4A24C]/10 to-transparent p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <span className="text-base">📦</span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#F1D28A]">Disponibilidade</p>
                <p className="text-xs text-white/50">Selecione uma opção para continuar</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {AVAILABILITY_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleSelectOption("availability", opt)}
                  className="rounded-xl border border-[#D4A24C]/50 bg-black/30 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-[#D4A24C]/20 hover:border-[#D4A24C] hover:text-[#F1D28A] active:scale-95 transition-all"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {isGenerating && (
          <div className="mr-auto flex items-center gap-2 rounded-2xl bg-white/5 px-4 py-2.5 text-sm text-white/60 border border-white/5">
            <RefreshCw size={14} className="animate-spin" />
            Gerando seu anúncio...
          </div>
        )}

        {ad && photosCount > 0 && !isGenerating && ad.title && ad.price && ad.city && (
          <div className="mx-auto w-full max-w-[95%] rounded-2xl border border-[#D4A24C]/40 bg-gradient-to-b from-[#D4A24C]/10 to-transparent p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#F1D28A]">Prévia do Anúncio</span>
              <div className="flex items-center gap-1 text-[#D4A24C]">
                <Camera size={12} />
                <span className="text-[10px] font-bold">{photosCount} foto(s)</span>
              </div>
            </div>

            {uploadedPhotos.length > 0 && (
              <div className="space-y-2">
                <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-black/30 border border-white/10">
                  <img
                    src={uploadedPhotos[0]}
                    alt="Foto principal"
                    className="w-full h-full object-cover"
                  />
                </div>
                {uploadedPhotos.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {uploadedPhotos.slice(1).map((src, idx) => (
                      <div
                        key={idx}
                        className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-white/10 bg-black/30"
                      >
                        <img
                          src={src}
                          alt={`Foto ${idx + 2}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-white leading-tight">{ad.title}</h4>
                <p className="text-xl font-black text-[#D4A24C]">{ad.price.startsWith('R$') ? ad.price : `R$ ${ad.price}`}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase font-bold text-white/40">Localização</p>
                  <p className="text-xs text-white/80 font-medium">📍 {ad.city}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase font-bold text-white/40">Estado</p>
                  <p className="text-xs text-white/80 font-medium">🏷️ {ad.product_condition}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase font-bold text-white/40">Categoria</p>
                  <p className="text-xs text-white/80 font-medium">📁 {ad.category}</p>
                </div>
                {ad.availability && (
                  <div className="space-y-0.5">
                    <p className="text-[10px] uppercase font-bold text-white/40">Disponibilidade</p>
                    <p className="text-xs text-white/80 font-medium">📦 {ad.availability}</p>
                  </div>
                )}
              </div>
              
              <div className="pt-2 border-t border-white/5">
                <p className="text-[10px] uppercase font-bold text-white/40 mb-1">Descrição</p>
                <div className="rounded-xl bg-black/20 p-3 border border-white/5">
                  <p className="text-xs text-white/80 leading-relaxed whitespace-pre-wrap">
                    {ad.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="space-y-3 border-t border-white/10 p-4 bg-black/40">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="h-11 w-11 flex items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#F1D28A] hover:bg-white/10 transition-colors relative"
            title="Adicionar fotos"
          >
            <ImagePlus size={18} />
            {photosCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#D4A24C] text-[10px] font-bold text-black">
                {photosCount}
              </span>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleUpload}
          />

          <div className="relative flex-1">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              placeholder="Produto, estado, detalhes, preço, cidade..."
              className="h-11 w-full rounded-xl border border-white/10 bg-black/40 px-4 text-sm text-white outline-none focus:border-[#D4A24C]/50 transition-all"
            />
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || !safe(input)}
            className="h-11 w-11 flex items-center justify-center rounded-xl bg-[#D4A24C] text-black hover:bg-[#F1D28A] disabled:opacity-30 transition-all"
          >
            <Send size={18} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={handleImprove}
            disabled={!ad || isGenerating || photosCount === 0}
            className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 py-2 text-[10px] font-bold text-white/80 hover:bg-white/10 disabled:opacity-30 transition-all"
          >
            <RefreshCw size={14} className="mb-1 text-[#F1D28A]" />
            Melhorar
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 py-2 text-[10px] font-bold text-white/80 hover:bg-white/10 transition-all"
          >
            <RefreshCw size={14} className="mb-1" />
            Novo
          </button>
          <button
            type="button"
            onClick={() => ad && onPublishAd(ad)}
            disabled={!ad || isGenerating || photosCount === 0 || !ad.title || !ad.price}
            className="flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-[#D4A24C] to-[#B98228] py-2 text-[10px] font-black text-black hover:brightness-110 disabled:opacity-30 transition-all shadow-lg shadow-[#D4A24C]/10"
          >
            <CheckCircle2 size={14} className="mb-1" />
            Publicar
          </button>
        </div>
      </div>
    </div>
  );
}
