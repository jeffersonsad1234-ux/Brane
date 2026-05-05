import { useEffect, useRef, useState } from "react";
import { ImagePlus, Send, RefreshCw, CheckCircle2, Camera } from "lucide-react";

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

const extractByPosition = (text) => {
  const parts = text.split(",").map(p => p.trim());
  
  return {
    title: parts[0] || "",
    product_condition: parts[1] || "",
    description: parts[2] || "",
    price: parts[3] || "",
    city: parts[4] || "",
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
  isGenerating = false,
  uploadedPhotos = []
}) {
  const [input, setInput] = useState("");
  const [localAd, setLocalAd] = useState(null);
  const [photosCount, setPhotosCount] = useState(0);
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
      category: extracted.category || currentBase.category
    };

    const missing = [];
    if (!merged.title) missing.push("produto");
    if (!merged.product_condition) missing.push("estado (novo, usado ou seminovo)");
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

    if (photosCount === 0) {
      setMessages((prev) => [
        ...prev, 
        { id: prev.length + 1, from: "system", text: "Agora envie pelo menos 1 foto do produto para eu preparar o anúncio." }
      ]);
      setLocalAd(merged);
      return;
    }

    setLocalAd(merged);
    onGenerateAd(merged);
    onFillForm(merged);
    setMessages((prev) => [
      ...prev,
      { id: prev.length + 1, from: "system", text: "Tudo pronto! Confira a prévia do seu anúncio abaixo." }
    ]);
  };

  useEffect(() => {
    if (photosCount > 0 && localAd && !localAd.ready && localAd.title && localAd.price && localAd.city && localAd.product_condition) {
      const finalAd = { ...localAd, ready: true };
      setLocalAd(finalAd);
      onGenerateAd(finalAd);
      onFillForm(finalAd);
      setMessages((prev) => [
        ...prev,
        { id: prev.length + 1, from: "system", text: "Fotos recebidas! Aqui está a prévia do seu anúncio." }
      ]);
    }
  }, [photosCount]);

  const handleImprove = () => {
    if (!ad) return;
    const improvedDescription = `✨ Oportunidade: ${ad.title}\n\nProduto em estado ${ad.product_condition?.toLowerCase() || 'excelente'}. ${ad.description}\n\n📍 Localização: ${ad.city}\n💰 Preço: ${ad.price}\n📁 Categoria: ${ad.category}\n\nEntre em contato para fechar negócio!`;
    
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
    setPhotosCount(0);
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
