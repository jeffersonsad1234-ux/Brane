import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ChevronDown,
  Zap,
  Star,
  ArrowRight,
  Laptop,
  Smartphone,
  Headphones,
  Home
} from 'lucide-react';

export default function HomeHero({
  compactHero,
  benefits,
  selectCategory,
  onGoProducts
}) {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden border-b border-[#1E2230] bg-gradient-to-b from-[#0F1117] to-[#0A0B0F]">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0F1117] to-[#0A0B0F]" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4A24C]/5 to-transparent" />

      <div
        className={
          compactHero
            ? 'relative z-10 max-w-7xl mx-auto px-4 pt-2 pb-3'
            : 'relative z-10 max-w-7xl mx-auto px-4 pt-3 pb-4'
        }
      >
        <div
          className={
            compactHero
              ? 'grid gap-3 items-stretch lg:grid-cols-[0.82fr_1.75fr_0.58fr]'
              : 'grid gap-4 items-stretch lg:grid-cols-[0.92fr_1.65fr_0.62fr]'
          }
        >
          {/* COLUNA ESQUERDA */}
          <div
            className={
              compactHero
                ? 'rounded-[24px] p-3 md:p-4 flex flex-col justify-center'
                : 'rounded-[26px] p-4 md:p-5 flex flex-col justify-center'
            }
          >
            <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#D4A24C] mb-2">
              <Sparkles size={13} />
              Marketplace premium
            </p>

            <h1
              className={
                compactHero
                  ? 'text-xl md:text-2xl font-black leading-[1.02] tracking-tight text-white'
                  : 'text-2xl md:text-3xl font-black leading-[1.02] tracking-tight text-white'
              }
            >
              O futuro das compras
              <span className="block text-[#D4A24C]">é BRANE.</span>
            </h1>

            {!compactHero && (
              <p className="mt-3 text-sm text-[#A6A8B3] max-w-md leading-relaxed">
                Tecnologia, segurança e milhares de produtos em uma vitrine premium.
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 mt-3">
              <button
                type="button"
                onClick={onGoProducts}
                className="w-10 h-10 rounded-2xl bg-[#111318] text-white flex items-center justify-center"
              >
                <ChevronDown size={19} className="text-[#D4A24C]" />
              </button>

              <button
                type="button"
                onClick={() => selectCategory('')}
                className="h-10 px-4 rounded-2xl bg-white border border-[#D4A24C]/35 text-[#111318] font-bold flex items-center gap-2"
              >
                Ofertas
                <Zap size={15} className="text-[#C4892F]" />
              </button>
            </div>

            {!compactHero && (
              <div className="grid grid-cols-2 gap-2 mt-5">
                {benefits.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.title} className="flex items-start gap-2">
                      <div className="w-7 h-7 rounded-xl bg-[#D4A24C]/12 flex items-center justify-center text-[#B98228]">
                        <Icon size={14} />
                      </div>

                      <div>
                        <p className="text-[10px] font-black text-[#111318]">
                          {item.title}
                        </p>
                        <p className="text-[10px] text-[#606875]">
                          {item.text}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* HERO CENTRAL */}
          <div className="relative rounded-[28px] overflow-hidden min-h-[235px] bg-[#16121C]">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,#2B1A2E,#11121A,#4A2A14)]" />

            <div className="relative z-10 h-full grid md:grid-cols-2 gap-3 p-5 items-center">
              <div>
                <p className="text-[10px] text-[#F1D28A] mb-2">
                  <Star size={13} /> Fornecedores globais
                </p>

                <h2 className="text-2xl font-black text-white">
                  Compre direto de fábricas e distribuidoras
                </h2>

                <p className="text-white/70 text-xs mt-2">
                  Conecte sua loja a fábricas e distribuidoras.
                </p>

                <button
                  onClick={() => navigate('/fornecedores')}
                  className="mt-3 bg-white text-black px-4 py-2 rounded-xl"
                >
                  Explorar
                </button>
              </div>

              <div className="flex items-center justify-center">
                <Laptop className="text-white" />
                <Smartphone className="text-[#F1D28A]" />
                <Headphones className="text-white" />
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA (SEM DESAPEGA) */}
          <div className="hidden lg:flex flex-col gap-3">
            <button
              type="button"
              onClick={() => navigate('/stores')}
              className="relative flex-1 rounded-[24px] bg-[#1A1715] p-4 text-left"
            >
              <h3 className="text-white font-black">
                Lojas parceiras
              </h3>

              <span className="text-xs text-white/70">
                Ver lojas
              </span>

              <Home className="absolute right-5 bottom-5 text-[#D4A24C]" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
