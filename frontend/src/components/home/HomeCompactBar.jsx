import { ChevronDown } from 'lucide-react';

export default function HomeCompactBar({ show, onGoProducts }) {
  if (!show) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#E5E7EB] shadow-[0_8px_26px_rgba(17,19,24,0.06)]">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm md:text-base font-black text-[#111318] leading-tight">
            BRANE
          </p>
          <p className="text-[11px] text-[#8A6326] font-bold">
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
