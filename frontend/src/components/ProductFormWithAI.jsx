import { useState } from "react";
import AIAssistantPanel from "./AIAssistantPanel";

export default function ProductFormWithAI({
  children,
  onAIGeneratedData = () => {}
}) {
  const [generatedAd, setGeneratedAd] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateAd = async (collectedData) => {
    setIsGenerating(true);

    // Simular chamada à API de geração de anúncio
    setTimeout(() => {
      const mockGeneratedAd = {
        title: `${collectedData.productName} - Ótimo Estado`,
        description: `${collectedData.productName}. ${collectedData.details || "Produto em perfeitas condições."}. Entre em contato para mais informações.`,
        price: "R$ 1.299,00"
      };

      setGeneratedAd(mockGeneratedAd);
      onAIGeneratedData(mockGeneratedAd);
      setIsGenerating(false);
    }, 2000);
  };

  const handleImproveAd = () => {
    setIsGenerating(true);

    setTimeout(() => {
      const improvedAd = {
        ...generatedAd,
        description: generatedAd.description + " Aceito negociação. Entrega disponível em São Paulo."
      };

      setGeneratedAd(improvedAd);
      onAIGeneratedData(improvedAd);
      setIsGenerating(false);
    }, 1500);
  };

  const handleGenerateNew = () => {
    setGeneratedAd(null);
  };

  return (
    <div className="grid lg:grid-cols-[1fr_420px] gap-6 h-full">
      {/* Form Side */}
      <div className="overflow-y-auto">{children}</div>

      {/* AI Assistant Side */}
      <div className="hidden lg:flex flex-col h-[calc(100vh-120px)] sticky top-0">
        <AIAssistantPanel
          onGenerateAd={handleGenerateAd}
          onImproveAd={handleImproveAd}
          onGenerateNew={handleGenerateNew}
          generatedAd={generatedAd}
          isGenerating={isGenerating}
        />
      </div>
    </div>
  );
}
