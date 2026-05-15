import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function HomeSellerCTA({ user }) {
  return (
    <>
      <section className="max-w-7xl mx-auto px-4 py-5 bg-white">
        <div className="rounded-[26px] bg-[#090B10] text-white border border-white/10 px-5 py-4 grid md:grid-cols-4 gap-4">
          <Info title="Milhares de produtos" text="Novos itens todos os dias" />
          <Info title="As melhores ofertas" text="Preços imbatíveis" />
          <Info title="Compra garantida" text="Proteção do início ao fim" />
          <Info title="Frete para todo o Brasil" text="Com rastreio em tempo real" />
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 pb-10 bg-white">
        <div className="rounded-[30px] bg-white border border-[#E5E7EB] p-6 md:p-7">
          {/* Container dividido verticalmente */}
          <div className="space-y-6">
            
            {/* Parte Superior: Lojas parceiras */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-5">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#B98228] mb-2">
                  Lojas parceiras
                </p>

                <h3 className="text-2xl md:text-3xl font-black text-[#111318]">
                  Venda na BRANE com uma vitrine premium
                </h3>

                <p className="text-[#606875] mt-2 text-sm">
                  Crie sua loja, anuncie produtos e transforme sua marca em experiência.
                </p>
              </div>

              <div className="flex gap-3">
                <Link to={user ? '/add-product' : '/auth?mode=signup'}>
                  <button
                    type="button"
                    className="h-11 px-5 rounded-2xl border border-[#D4A24C]/45 text-[#111318] font-black hover:bg-[#F9FAFB] transition"
                  >
                    Saiba mais
                  </button>
                </Link>

                <Link to={user ? '/add-product' : '/auth?mode=signup'}>
                  <button
                    type="button"
                    className="h-11 px-5 rounded-2xl bg-[#111318] text-white font-black inline-flex items-center gap-2 hover:bg-[#252832] transition"
                  >
                    Começar
                    <ArrowRight size={16} className="text-[#D4A24C]" />
                  </button>
                </Link>
              </div>
            </div>

            {/* Parte Inferior: B Livre */}
            <div className="rounded-[30px] bg-gradient-to-br from-[#090B10] via-[#1A1F2E] to-[#090B10] border border-[#D4A24C]/20 p-6 md:p-7">
              <div className="flex flex-col md:flex-row items-center justify-between gap-5">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#F1D28A] mb-2">
                    B Livre
                  </p>

                  <h3 className="text-2xl md:text-3xl font-black text-white">
                    Compre e venda direto com a comunidade
                  </h3>

                  <p className="text-[#B8BAC6] mt-2 text-sm">
                    Anúncios classificados, chat direto e oportunidades locais.
                  </p>
                </div>

                <Link to="/blivre">
                  <button
                    type="button"
                    className="h-11 px-5 rounded-2xl bg-gradient-to-r from-[#D4A24C] via-[#F1D28A] to-[#B98228] text-white font-black inline-flex items-center gap-2 hover:from-[#B98228] hover:via-[#D4A24C] hover:to-[#8B6914] transition"
                  >
                    Explorar B Livre
                    <ArrowRight size={16} className="text-white" />
                  </button>
                </Link>
              </div>
            </div>
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
