import { useEffect, useRef, useState } from "react";
import { ImagePlus, Send, Sparkles, RefreshCw, CheckCircle2 } from "lucide-react";

const defaultAd = {
  title: "",
  price: "",
  category: "",
  condition: "",
  city: "",
  state: "",
  availability: "Item único",
  description: ""
};

const safe = (value) => String(value || "").trim();

// Categorias automáticas baseadas em palavras-chave
const detectCategory = (text) => {
  const t = text.toLowerCase();
  if (t.includes("iphone") || t.includes("celular") || t.includes("samsung") || t.includes("xiaomi")) return "Celulares";
  if (t.includes("cadeira") || t.includes("mesa") || t.includes("sofa") || t.includes("armario")) return "Casa e móveis";
  if (t.includes("ps5") || t.includes("xbox") || t.includes("game") || t.includes("nintendo")) return "Games";
  if (t.includes("carro") || t.includes("moto") || t.includes("veiculo")) return "Veículos";
  return "Outros";
};

const buildSmartAd = (rawText) => {
  const text = safe(rawText);
  const lines = text.split("\n").map((item) => item.trim()).filter(Boolean);
  
  // Extração básica de preço
  const priceMatch = text.match(/r\$\s*(\d+[.,]?\d*)/i) || text.match(/(\d+[.,]?\d*)\s*reais/i) || text.match(/(?:^|\s)(\d+[.,]?\d*)(?:\s|$)/);
  const price = priceMatch ? priceMatch[1] : "";

  // Extração básica de cidade (procurando por padrões comuns ou após vírgula)
  const cityMatch = text.match(/,\s*([^,]+)$/) || text.match(/em\s+([^,.]+)/i);
  const city = cityMatch ? cityMatch[1].trim() : "";

  return {
    ...defaultAd,
    title: lines[0] || "Novo anúncio",
    description: text,
    price: price,
    city: city,
    category: detectCategory(text)
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
  isGenerating = false
}) {
  const [input, setInput] = useState("");
  const [localAd, setLocalAd] = useState(null);
  const [messages, setMessages] = useState([
    {
      id: 1,
      from: "system",
      text: "Descreva seu produto em uma única mensagem. Ex: iPhone 12, usado, 128GB, Guarulhos, R$1500"
    }
  ]);
  const fileRef = useRef(null);
  const endRef = useRef(null);

  const ad = generatedAd || localAd;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, ad, isGenerating]);

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    await onPhotoUpload(files);
    setMessages((prev) => [
      ...prev,
      { id: prev.length + 1, from: "system", text: `${files.length} foto(s) anexada(s).` }
    ]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleGenerate = () => {
    const text = safe(input);
    if (!text) return;
    
    setMessages((prev) => [...prev, { id: prev.length + 1, from: "user", text }]);
    setInput("");

    // Simulação de verificação de dados faltantes
    const smartAd = buildSmartAd(text);
    const missing = [];
    if (!smartAd.price) missing.push("preço");
    if (!smartAd.city) missing.push("cidade");

    if (missing.length > 0 && !text.includes("?")) {
       setMessages((prev) => [
        ...prev, 
        { id: prev.length + 1, from: "system", text: `Legal! Poderia me informar também o ${missing.join(" e ")}?` }
      ]);
      return;
    }

    setLocalAd(smartAd);
    onGenerateAd(smartAd);
    onFillForm(smartAd);
    setMessages((prev) => [
      ...prev,
      { id: prev.length + 1, from: "system", text: "Anúncio preparado! Confira a prévia abaixo." }
    ]);
  };

  const handleImprove = () => {
    if (!ad) return;
    // Reescreve completamente sem concatenar
    const improvedDescription = `Oportunidade: ${ad.title}. Produto em excelente estado de conservação, ideal para quem busca qualidade e bom preço. Disponível para retirada em ${ad.city || 'sua região'}. Entre em contato para mais detalhes e garanta já o seu!`;
    
    const improved = {
      ...ad,
      description: improvedDescription
    };
    setLocalAd(improved);
    onImproveAd(improved);
    onFillForm(improved);
  };

  const handleReset = () => {
    setInput("");
    setLocalAd(null);
    setMessages([{
      id: 1,
      from: "system",
      text: "Descreva seu produto em uma única mensagem. Ex: iPhone 12, usado, 128GB, Guarulhos, R$1500"
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

        {isGenerating && (
          <div className="mr-auto flex items-center gap-2 rounded-2xl bg-white/5 px-4 py-2.5 text-sm text-white/60 border border-white/5">
            <RefreshCw size={14} className="animate-spin" />
            Gerando seu anúncio...
          </div>
        )}

        {ad && !isGenerating && (
          <div className="mx-auto w-full max-w-[95%] rounded-2xl border border-[#D4A24C]/40 bg-gradient-to-b from-[#D4A24C]/10 to-transparent p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#F1D28A]">Prévia do Anúncio</span>
              <CheckCircle2 size={14} className="text-[#D4A24C]" />
            </div>
            
            <div className="space-y-3">
              <div>
                <h4 className="text-lg font-bold text-white leading-tight">{ad.title || "Sem título"}</h4>
                <div className="mt-1 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#D4A24C] px-2 py-0.5 text-[10px] font-bold text-black">R$ {ad.price || "---"}</span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/70">{ad.category || "Outros"}</span>
                  {ad.city && <span className="text-[10px] text-white/50">📍 {ad.city}</span>}
                </div>
              </div>
              
              <div className="rounded-xl bg-black/20 p-3 border border-white/5">
                <p className="text-xs text-white/80 leading-relaxed whitespace-pre-wrap">
                  {ad.description || "Nenhuma descrição gerada."}
                </p>
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
            className="h-11 w-11 flex items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#F1D28A] hover:bg-white/10 transition-colors"
            title="Adicionar fotos"
          >
            <ImagePlus size={18} />
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
              placeholder="Descreva seu produto..."
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
            disabled={!ad || isGenerating}
            className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 py-2 text-[10px] font-bold text-white/80 hover:bg-white/10 disabled:opacity-30 transition-all"
          >
            <Sparkles size={14} className="mb-1 text-[#F1D28A]" />
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
            disabled={!ad || isGenerating}
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
