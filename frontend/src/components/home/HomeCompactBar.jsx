import { ChevronDown } from 'lucide-react';

export default function HomeCompactBar({ show, onGoProducts }) {
  if (!show) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-[#0A0B0F] border-b border-[#1E2230] shadow-[0_8px_26px_rgba(0,0,0,0.4)]">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm md:text-base font-black text-white leading-tight">
            BRANE
          </p>
          <p className="text-[11px] text-[#D4A24C] font-bold">
            Produtos em destaque
          </p>
        </div>

        <button
          type="button"
          onClick={onGoProducts}
          className="w-10 h-10 rounded-2xl bg-[#111318] text-white inline-flex items-center justify-center"
          aria-label="Ir para produtos"
        >
          <ChevronDown size={20} className="text-[#D4A24C]" />
        </button>
      </div>
    </div>
  );
}
