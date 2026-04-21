import { Link } from 'react-router-dom';
import { Users, Store, Zap, ArrowRight, Sparkles } from 'lucide-react';

export default function EntryPage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#0a0014] via-[#1a0033] to-[#2d0052]" data-testid="entry-page">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-pink-600/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
        {/* Logo / Title */}
        <div className="text-center mb-12 animate-fadeIn">
          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight mb-4"
              style={{
                fontFamily: "'Outfit', sans-serif",
                background: 'linear-gradient(135deg, #ffffff 0%, #f0abfc 50%, #d946ef 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 40px rgba(217, 70, 239, 0.5))'
              }}>
            BRANE
          </h1>
          <p className="text-sm md:text-base tracking-[0.4em] uppercase text-purple-200/80 font-light">
            Escolha sua experiência
          </p>
        </div>

        {/* Cards */}
        <div className="w-full max-w-5xl grid md:grid-cols-2 gap-6 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          {/* BRANE Social */}
          <Link
            to="/social"
            className="group relative block rounded-2xl p-8 bg-gradient-to-br from-black/60 to-purple-950/40 border border-pink-500/20 hover:border-pink-400/60 transition-all duration-500 overflow-hidden backdrop-blur-sm hover:-translate-y-1"
            data-testid="entry-social-btn"
          >
            {/* NEW badge */}
            <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-pink-500/20 border border-pink-400/40 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-pink-300" />
              <span className="text-[10px] font-bold text-pink-200 tracking-widest">NEW</span>
            </div>

            {/* Glow effect */}
            <div className="absolute -top-20 -left-20 w-60 h-60 bg-pink-500/20 rounded-full blur-3xl group-hover:bg-pink-400/30 transition-all duration-700" />

            <div className="relative">
              <div className="w-16 h-16 rounded-2xl mb-6 flex items-center justify-center shadow-lg shadow-pink-500/30"
                   style={{ background: 'linear-gradient(135deg, #ec4899 0%, #d946ef 100%)' }}>
                <Users className="w-8 h-8 text-white" />
              </div>

              <h2 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
                BRANE
              </h2>
              <p className="text-sm text-purple-100/70 leading-relaxed mb-6">
                Conecte-se, compartilhe momentos e construa sua rede. Feed, grupos e chat privado com experiência premium.
              </p>

              <ul className="space-y-2 mb-8">
                <li className="flex items-center gap-2 text-xs text-purple-200/80">
                  <Zap className="w-3.5 h-3.5 text-pink-400" />
                  Feed em tempo real
                </li>
                <li className="flex items-center gap-2 text-xs text-purple-200/80">
                  <Zap className="w-3.5 h-3.5 text-pink-400" />
                  Mensagens privadas
                </li>
                <li className="flex items-center gap-2 text-xs text-purple-200/80">
                  <Zap className="w-3.5 h-3.5 text-pink-400" />
                  Grupos e comunidades
                </li>
              </ul>

              <div className="inline-flex items-center gap-2 text-sm font-semibold text-white group-hover:gap-3 transition-all">
                Entrar no Social <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          {/* BRANE Market */}
          <Link
            to="/market"
            className="group relative block rounded-2xl p-8 bg-gradient-to-br from-black/60 to-amber-950/40 border border-amber-500/20 hover:border-amber-400/60 transition-all duration-500 overflow-hidden backdrop-blur-sm hover:-translate-y-1"
            data-testid="entry-market-btn"
          >
            {/* PREMIUM badge */}
            <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/40">
              <span className="text-[10px] font-bold text-amber-200 tracking-widest">PREMIUM</span>
            </div>

            {/* Glow effect */}
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-amber-500/20 rounded-full blur-3xl group-hover:bg-amber-400/30 transition-all duration-700" />

            <div className="relative">
              <div className="w-16 h-16 rounded-2xl mb-6 flex items-center justify-center shadow-lg shadow-amber-500/30"
                   style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #eab308 100%)' }}>
                <Store className="w-8 h-8 text-white" />
              </div>

              <h2 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
                BRANE Market
              </h2>
              <p className="text-sm text-amber-100/70 leading-relaxed mb-6">
                Marketplace completo com lojas, produtos únicos e comissões transparentes. Compre, venda ou afilie-se.
              </p>

              <ul className="space-y-2 mb-8">
                <li className="flex items-center gap-2 text-xs text-amber-200/80">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Milhares de produtos
                </li>
                <li className="flex items-center gap-2 text-xs text-amber-200/80">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Sistema de afiliados
                </li>
                <li className="flex items-center gap-2 text-xs text-amber-200/80">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Carteira integrada
                </li>
              </ul>

              <div className="inline-flex items-center gap-2 text-sm font-semibold text-white group-hover:gap-3 transition-all">
                Entrar no Market <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        </div>

        {/* Footer text */}
        <p className="text-center text-xs text-purple-300/50 mt-12 tracking-wide animate-fadeIn" style={{ animationDelay: '0.4s' }}>
          Uma plataforma · Duas experiências · Infinitas possibilidades
        </p>
      </div>
    </div>
  );
}
