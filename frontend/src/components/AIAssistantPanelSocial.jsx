import { useEffect, useRef, useState } from "react";
import { ImagePlus, Send, Sparkles } from "lucide-react";

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

const buildSmartAd = (rawText) => {
  const text = safe(rawText);
  const lines = text.split("\n").map((item) => item.trim()).filter(Boolean);
  const first = lines[0] || "Produto em ótimo estado";
  const maybePrice = lines.find((line) => /r\$\s*\d|^\d+[.,]?\d*$/.test(line.toLowerCase()));

  return {
    ...defaultAd,
    title: first,
    description: text,
    price: maybePrice ? maybePrice.replace(/^r\$\s*/i, "") : ""
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
      from: "ai",
      text: "Descreva o que vai anunciar (produto, estado, cidade e preco)."
    }
  ]);
  const fileRef = useRef(null);
  const endRef = useRef(null);

  const ad = generatedAd || localAd;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, ad]);

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    await onPhotoUpload(files);
    setMessages((prev) => [
      ...prev,
      { id: prev.length + 1, from: "ai", text: `${files.length} foto(s) anexada(s).` }
    ]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleGenerate = () => {
    const text = safe(input);
    if (!text) return;
    const smartAd = buildSmartAd(text);

    setMessages((prev) => [...prev, { id: prev.length + 1, from: "user", text }]);
    setInput("");
    setLocalAd(smartAd);
    onGenerateAd(smartAd);
    onFillForm(smartAd);
    setMessages((prev) => [
      ...prev,
      { id: prev.length + 1, from: "ai", text: "Anuncio gerado. Revise e publique quando quiser." }
    ]);
  };

  const handleImprove = () => {
    if (!ad) return;
    const improved = {
      ...ad,
      description: safe(ad.description) + " Negociavel e pronto para entrega."
    };
    setLocalAd(improved);
    onImproveAd(improved);
    onFillForm(improved);
  };

  const handleReset = () => {
    setInput("");
    setLocalAd(null);
    onGenerateNew();
    onFillForm(defaultAd);
  };

  return (
    <div className="flex h-full flex-col rounded-[24px] border border-white/10 bg-black/20">
      <div className="border-b border-white/10 p-4">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8C8F9A]">
          Assistente de anuncio
        </p>
        <p className="mt-1 text-sm text-white">
          Gere seu texto rapido e publique no B Livre.
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={
              "rounded-2xl px-3 py-2 text-sm " +
              (message.from === "user"
                ? "ml-auto max-w-[88%] bg-[#D4A24C] text-black"
                : "mr-auto max-w-[88%] bg-white/10 text-white")
            }
          >
            {message.text}
          </div>
        ))}

        {ad && (
          <div className="rounded-2xl border border-[#D4A24C]/30 bg-[#D4A24C]/10 p-3">
            <p className="text-xs font-black text-[#F1D28A]">Rascunho gerado</p>
            <p className="mt-1 text-sm font-black text-white">{ad.title || "Sem titulo"}</p>
            <p className="mt-1 text-xs text-[#C9CBD6] line-clamp-4">{ad.description || "-"}</p>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="space-y-3 border-t border-white/10 p-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="h-10 rounded-xl border border-white/15 bg-white/[0.04] px-3 text-[#F1D28A]"
          >
            <ImagePlus size={16} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleUpload}
          />

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            placeholder="Ex: iPhone 12, usado, Sao Paulo, R$ 2500..."
            className="h-10 flex-1 rounded-xl border border-white/15 bg-black/30 px-3 text-sm text-white outline-none"
          />

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || !safe(input)}
            className="h-10 rounded-xl bg-[#D4A24C] px-3 text-black disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={handleImprove}
            disabled={!ad || isGenerating}
            className="rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
          >
            <Sparkles size={14} className="mx-auto mb-1" />
            Melhorar
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-xs font-bold text-white"
          >
            Novo
          </button>
          <button
            type="button"
            onClick={() => ad && onPublishAd(ad)}
            disabled={!ad || isGenerating}
            className="rounded-xl bg-gradient-to-r from-[#D4A24C] via-[#F1D28A] to-[#B98228] px-3 py-2 text-xs font-black text-black disabled:opacity-50"
          >
            Publicar
          </button>
        </div>
      </div>
    </div>
  );
}
