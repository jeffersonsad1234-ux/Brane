import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Zap, Heart, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function EntryPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#0a0014] via-[#1a0033] to-[#2d0052]" data-testid="entry-page">
      {/* Animated background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-purple-600/25 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-fuchsia-600/10 rounded-full blur-3xl" />
      </div>

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }}
      />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
        {/* Logo + title */}
        <div className="text-center mb-14 animate-fadeIn">
          {/* Decorative top line */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-pink-400/60" />
            <Sparkles className="w-4 h-4 text-pink-400" />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-pink-400/60" />
          </div>

          <h1
            className="text-7xl md:text-9xl font-extrabold tracking-tight mb-5"
            style={{
              fontFamily: "'Outfit', sans-serif",
              background: 'linear-gradient(135deg, #ffffff 0%, #f0abfc 45%, #d946ef 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 50px rgba(217, 70, 239, 0.6))',
              letterSpacing: '-0.02em'
            }}
          >
            BRANE
          </h1>

          <p className="text-xs md:text-sm tracking-[0.5em] uppercase text-purple-200/70 font-light mb-3">
            Sua nova experiência social
          </p>
          <p className="text-purple-100/50 max-w-md mx-auto text-sm leading-relaxed">
            Conecte-se, compartilhe e descubra. Uma plataforma pensada para você se expressar.
          </p>
        </div>

        {/* Main CTA button */}
        <div className="flex flex-col items-center gap-5 animate-fadeIn" style={{ animationDelay: '0.25s' }}>
          <Link
            to={user ? '/social' : '/auth'}
            className="group relative inline-flex items-center gap-3 px-12 py-5 rounded-full text-white font-semibold text-base tracking-wide overflow-hidden transition-all duration-300 hover:scale-[1.03]"
            style={{
              background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 50%, #8b5cf6 100%)',
              boxShadow: '0 10px 40px -10px rgba(217, 70, 239, 0.8), 0 0 60px -10px rgba(168, 85, 247, 0.5)'
            }}
            data-testid="entry-enter-btn"
          >
            {/* Shine effect */}
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <span className="relative">{user ? 'Entrar na Plataforma' : 'Entrar'}</span>
            <ArrowRight className="relative w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>

          {!user && (
            <Link
              to="/auth"
              className="text-xs text-purple-200/60 hover:text-pink-300 transition-colors tracking-wide"
              data-testid="entry-signup-link"
            >
              Ainda não tem conta? <span className="underline underline-offset-4">Criar conta</span>
            </Link>
          )}
        </div>

        {/* Features strip */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-6 md:gap-10 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center gap-2 text-xs text-purple-200/50">
            <Users className="w-4 h-4 text-pink-400" /> Comunidade viva
          </div>
          <div className="flex items-center gap-2 text-xs text-purple-200/50">
            <Zap className="w-4 h-4 text-pink-400" /> Feed em tempo real
          </div>
          <div className="flex items-center gap-2 text-xs text-purple-200/50">
            <Heart className="w-4 h-4 text-pink-400" /> Feito com cuidado
          </div>
        </div>

        {/* Footer tagline */}
        <p className="text-center text-[10px] text-purple-300/40 mt-16 tracking-[0.3em] uppercase animate-fadeIn" style={{ animationDelay: '0.55s' }}>
          BRANE © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
