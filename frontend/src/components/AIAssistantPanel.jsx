import { useState, useRef, useEffect } from "react";
import { Send, Plus, Sparkles } from "lucide-react";
import BraneAIAvatar from "./BraneAIAvatar";

export default function AIAssistantPanel({
  onGenerateAd = () => {},
  onImproveAd = () => {},
  onGenerateNew = () => {},
  generatedAd = null,
  isGenerating = false
}) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "avatar",
      text: "Olá! Eu sou a Assistente da B-Livre. Vou ajudar você a criar um anúncio incrível!",
      timestamp: new Date()
    }
  ]);
  const [userInput, setUserInput] = useState("");
  const [currentStep, setCurrentStep] = useState("initial"); // initial, collecting, review
  const [collectedData, setCollectedData] = useState({
    photos: [],
    productName: "",
    details: "",
    contact: ""
  });
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!userInput.trim()) return;

    const newUserMessage = {
      id: messages.length + 1,
      type: "user",
      text: userInput,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, newUserMessage]);

    if (currentStep === "initial") {
      setCollectedData((prev) => ({ ...prev, productName: userInput }));
      setCurrentStep("collecting");

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            type: "avatar",
            text: "Ótimo! Agora me conte mais detalhes sobre o produto. Qual é o estado, categoria, preço aproximado?",
            timestamp: new Date()
          }
        ]);
      }, 800);
    } else if (currentStep === "collecting") {
      if (userInput.toLowerCase().includes("pronto") || userInput.toLowerCase().includes("fim")) {
        setCurrentStep("review");
        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            type: "avatar",
            text: "Perfeito! Vou gerar seu anúncio agora...",
            timestamp: new Date()
          }
        ]);

        setCollectedData((prev) => ({ ...prev, details: userInput }));
        onGenerateAd(collectedData);
      } else {
        setCollectedData((prev) => ({
          ...prev,
          details: prev.details ? prev.details + " " + userInput : userInput
        }));

        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: prev.length + 1,
              type: "avatar",
              text: "Anotei! Tem mais alguma informação importante?",
              timestamp: new Date()
            }
          ]);
        }, 600);
      }
    }

    setUserInput("");
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#0F0C16] to-[#050608] rounded-[24px] border border-white/5 overflow-hidden">
      {/* Avatar Section */}
      <div className="flex-shrink-0 h-[320px] bg-gradient-to-b from-[#1A1620] to-[#0F0C16] border-b border-white/5 flex items-center justify-center">
        <BraneAIAvatar
          state={isGenerating ? "working" : currentStep === "collecting" ? "speaking" : "idle"}
          isListening={currentStep === "collecting"}
        />
      </div>

      {/* Messages Section */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                msg.type === "user"
                  ? "bg-[#A97CFF] text-white rounded-br-none"
                  : "bg-white/10 text-white border border-white/10 rounded-bl-none"
              }`}
            >
              <p className="text-sm leading-relaxed">{msg.text}</p>
              <p className="text-xs opacity-60 mt-1">
                {msg.timestamp.toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Generated Ad Review */}
      {generatedAd && currentStep === "review" && (
        <div className="flex-shrink-0 px-4 py-4 border-t border-white/5 bg-white/[0.02]">
          <div className="bg-white/[0.05] border border-white/10 rounded-xl p-3 mb-3">
            <p className="text-xs text-white/60 mb-2 font-bold">ANÚNCIO GERADO</p>
            <h3 className="text-sm font-bold text-white mb-1">{generatedAd.title}</h3>
            <p className="text-xs text-white/70 mb-2">{generatedAd.description}</p>
            <p className="text-xs font-bold text-[#D4A24C]">{generatedAd.price}</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onGenerateNew}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition"
            >
              <Sparkles size={14} />
              Gerar novo
            </button>

            <button
              onClick={onImproveAd}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#A97CFF]/20 hover:bg-[#A97CFF]/30 text-[#A97CFF] text-xs font-bold transition"
            >
              <Plus size={14} />
              Melhorar
            </button>
          </div>
        </div>
      )}

      {/* Input Section */}
      {!isGenerating && currentStep !== "review" && (
        <div className="flex-shrink-0 px-4 py-4 border-t border-white/5">
          <div className="flex gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder={
                currentStep === "initial"
                  ? "Qual é o nome do produto?"
                  : "Digite mais detalhes..."
              }
              className="flex-1 bg-white/10 border border-white/10 rounded-2xl px-4 py-2.5 text-white placeholder-white/40 outline-none focus:border-[#A97CFF]/60 transition text-sm"
            />

            <button
              onClick={handleSendMessage}
              disabled={!userInput.trim()}
              className="flex-shrink-0 w-10 h-10 rounded-full bg-[#A97CFF] hover:bg-[#A97CFF]/90 disabled:opacity-40 text-white flex items-center justify-center transition"
            >
              <Send size={16} />
            </button>
          </div>

          {currentStep === "collecting" && (
            <p className="text-xs text-white/50 mt-2 px-2">
              💡 Digite "pronto" quando terminar de descrever
            </p>
          )}
        </div>
      )}

      {isGenerating && (
        <div className="flex-shrink-0 px-4 py-4 border-t border-white/5 text-center">
          <div className="flex items-center justify-center gap-2 text-[#A97CFF] text-sm font-bold">
            <div className="w-2 h-2 rounded-full bg-[#A97CFF] animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-[#A97CFF] animate-pulse delay-100" />
            <div className="w-2 h-2 rounded-full bg-[#A97CFF] animate-pulse delay-200" />
          </div>
        </div>
      )}
    </div>
  );
}
