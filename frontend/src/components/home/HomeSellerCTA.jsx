import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function HomeSellerCTA({ user }) {
  return (
    <>
      <section className="max-w-7xl mx-auto px-4 py-5 bg-transparent">
        <div className="rounded-[26px] bg-[#0F1117] text-white border border-[#1E2230] px-5 py-4 grid md:grid-cols-2 gap-4">
          <Info title="Compra garantida" text="Proteção do início ao fim" />
          <Info title="Frete para todo o Brasil" text="Com rastreio em tempo real" />
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 pb-10 bg-transparent">
        <div className="rounded-[30px] bg-[#0F1117] border border-[#1E2230] p-6 md:p-7 flex flex-col md:flex-row items-center justify-between gap-5">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#D4A24C] mb-2">
              Para vendedores
            </p>

            <h3 className="text-2xl md:text-3xl font-black text-white">
              Venda na BRANE com sua loja online
            </h3>

            <p className="text-[#A6A8B3] mt-2 text-sm">
              Crie sua loja, anuncie produtos e transforme sua marca em experiência.
            </p>
          </div>

          <div className="flex gap-3">
            <Link to={user ? '/add-product' : '/auth?mode=signup'}>
              <button
                type="button"
                className="h-11 px-5 rounded-2xl border border-[#D4A24C]/45 text-[#D4A24C] font-black hover:bg-[#D4A24C]/10 transition"
              >
                Saiba mais
              </button>
            </Link>

            <Link to={user ? '/add-product' : '/auth?mode=signup'}>
              <button
                type="button"
                className="h-11 px-5 rounded-2xl bg-[#D4A24C] text-[#0A0B0F] font-black inline-flex items-center gap-2 hover:bg-[#E8C372] transition"
              >
                Começar
                <ArrowRight size={16} className="text-[#0A0B0F]" />
              </button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function Info({ title, text }) {
  return (
    <div>
      <p className="font-black text-sm">{title}</p>
      <p className="text-xs text-white/55">{text}</p>
    </div>
  );
}
