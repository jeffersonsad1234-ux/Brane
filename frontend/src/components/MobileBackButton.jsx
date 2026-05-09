import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

/**
 * Botão "voltar" exclusivo para mobile.
 * Discreto, premium, dourado. Esconde em desktop/tablet automaticamente.
 *
 * Props:
 *  - to?: string (rota; se omitido faz navigate(-1))
 *  - label?: string (default "Voltar")
 *  - className?: string
 */
export default function MobileBackButton({ to, label = "Voltar", className = "" }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={
        "md:hidden inline-flex items-center gap-1.5 text-xs text-[#A6A8B3] " +
        "hover:text-[#D4A24C] transition-colors mb-3 " +
        className
      }
      data-testid="mobile-back-btn"
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </button>
  );
}
