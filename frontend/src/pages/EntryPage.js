import { Link } from 'react-router-dom';
import { Sparkles, ShoppingBag, Users, ArrowRight, Zap } from 'lucide-react';
import { useCustomization } from '../contexts/CustomizationContext';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_brane-exchange/artifacts/wiagamwr_IMG_20260412_043249_662.jpg';

export default function EntryPage() {
  const { custom } = useCustomization();
  return (
    <div className="min-h-screen entry-gradient flex items-center justify-center p-4 sm:p-8 overflow-hidden" data-testid="entry-page">
      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: i % 2 === 0 ? 'rgba(168, 85, 247, 0.6)' : 'rgba(236, 72, 153, 0.6)',
              animation: `float ${8 + Math.random() * 12}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      <div className="max-w-6xl w-full relative z-10">
        {/* Header */}
        <div className="text-center mb-12 animate-fadeIn">
          <div className="inline-flex items-center justify-center gap-3 mb-6">
            <img src={LOGO_URL} alt="BRANE" className="w-14 h-14 rounded-2xl shadow-[0_0_40px_rgba(168,85,247,0.4)]" />
          </div>
          <h1 className="text-5xl sm:text-7xl font-black font-['Outfit'] tracking-tight mb-4">
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #FFFFFF 0%, #A855F7 50%, #EC4899 100%)' }}
            >
              BRANE
            </span>
          </h1>
          <p className="text-[#C4B5FD] text-sm sm:text-base tracking-[0.3em] uppercase font-medium">
            Escolha sua experiência
          </p>
        </div>

        {/* Two option cards */}
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto" data-testid="entry-options">
          {/* Social */}
          <Link
            to="/social"
            data-testid="enter-social-btn"
            className="entry-card entry-card-social rounded-3xl p-8 sm:p-10 group relative overflow-hidden block"
          >
            <div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-full border border-purple-400/30">
              <span className="text-xs font-bold text-purple-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> NEW
              </span>
            </div>
            <div className="w-20 h-20 rounded-2xl mb-6 flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-300">
              <Users className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold font-['Outfit'] mb-3 text-white">BRANE Social</h2>
            <p className="text-[#C4B5FD] text-sm mb-6 leading-relaxed">
              Conecte-se, compartilhe momentos e construa sua rede.
              Feed, stories, grupos e chat privado com experiência premium.
            </p>
            <div className="space-y-2 mb-8">
              {['Feed e stories', 'Mensagens privadas', 'Grupos e comunidades'].map(f => (
                <div key={f} className="flex items-center gap-2 text-sm text-[#A78BFA]">
                  <Zap className="w-3.5 h-3.5" /> {f}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-white font-semibold group-hover:gap-4 transition-all">
              Entrar no Social <ArrowRight className="w-5 h-5" />
            </div>
          </Link>

          {/* Market */}
          <Link
            to="/"
            data-testid="enter-market-btn"
            className="entry-card entry-card-market rounded-3xl p-8 sm:p-10 group relative overflow-hidden block"
            style={{ borderColor: 'rgba(179, 139, 54, 0.3)' }}
          >
            <div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-full border border-amber-400/30">
              <span className="text-xs font-bold text-amber-300">PREMIUM</span>
            </div>
            <div className="w-20 h-20 rounded-2xl mb-6 flex items-center justify-center bg-gradient-to-br from-amber-600 to-yellow-500 shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform duration-300">
              <ShoppingBag className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold font-['Outfit'] mb-3 text-white">BRANE Market</h2>
            <p className="text-[#FDE68A] text-sm mb-6 leading-relaxed">
              Marketplace completo com lojas, produtos únicos e comissões
              transparentes. Compre, venda ou afilie-se.
            </p>
            <div className="space-y-2 mb-8">
              {['Milhares de produtos', 'Sistema de afiliados', 'Carteira integrada'].map(f => (
                <div key={f} className="flex items-center gap-2 text-sm text-[#FCD34D]">
                  <Zap className="w-3.5 h-3.5" /> {f}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-white font-semibold group-hover:gap-4 transition-all">
              Entrar no Market <ArrowRight className="w-5 h-5" />
            </div>
          </Link>
        </div>

        <p className="text-center text-[#6B6B7B] text-xs mt-10">
          Uma plataforma, duas experiências. Sua conta funciona nos dois ambientes.
        </p>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.4; }
          50% { transform: translateY(-30px) translateX(10px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
