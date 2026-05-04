import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, ShieldCheck, Zap, Users, Package, Store as StoreIcon, Truck, Headphones } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { BRANE_LOGO_URL } from '../components/Navbar';

export default function EntryPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#050608] text-white" data-testid="entry-page">
      {/* Ambient gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[620px] h-[620px] bg-[#5B1CB5]/18 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 -right-40 w-[620px] h-[620px] bg-[#D4A24C]/12 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 left-1/2 w-[900px] h-[900px] -translate-x-1/2 -translate-y-1/2 bg-[#6D28D9]/6 rounded-full blur-[200px]" />
      </div>
      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '64px 64px'
        }} />

      {/* Top bar */}
      <header className="relative z-10 max-w-[1400px] mx-auto px-6 h-[76px] flex items-center justify-between">
        <Link to="/" className="flex items-center" data-testid="entry-logo">
          <div className="w-11 h-11 rounded-xl overflow-hidden ring-1 ring-[#D4A24C]/35">
            <img src={BRANE_LOGO_URL} alt="BRANE" className="w-full h-full object-cover" />
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/auth" data-testid="entry-login-btn">
            <button className="brane-btn-outline">Entrar</button>
          </Link>
          <Link to="/auth?mode=signup" data-testid="entry-signup-btn">
            <button className="brane-btn-primary">Cadastre-se</button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-[1400px] mx-auto px-6 pt-14 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div>
            <div className="brane-badge mb-7">
              <Sparkles className="w-3 h-3" /> Marketplace Premium
            </div>
            <h1
              className="font-black tracking-tight leading-[0.95] mb-6 brane-gold-text"
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 'clamp(4rem, 10vw, 6rem)',
                letterSpacing: '-0.04em',
              }}
            >
              BRANE
            </h1>
            <p className="text-[11px] sm:text-sm tracking-[0.45em] uppercase text-white/75 font-semibold mb-6">
              Sua nova experiência
            </p>
            <p className="text-[#A6A8B3] text-lg leading-relaxed mb-10 max-w-md">
              Venda, compre e anuncie com segurança.<br />
              Produtos únicos, pessoas reais.
            </p>

            <div className="flex flex-wrap items-center gap-4 mb-14">
              <Link to={user ? '/market' : '/auth'} data-testid="explore-products-btn">
                <button className="brane-btn-primary" style={{ padding: '1rem 2.2rem', fontSize: '0.95rem' }}>
                  Explorar produtos <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <Link to={user ? '/add-product' : '/auth?mode=signup'} data-testid="sell-btn">
                <button className="brane-btn-gold-outline" style={{ padding: '0.95rem 2.1rem', fontSize: '0.95rem' }}>
                  Quero vender
                </button>
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-xs text-[#A6A8B3]">
              <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#D4A24C]" /> 100% Seguro</span>
              <span className="flex items-center gap-2"><Truck className="w-4 h-4 text-[#6D28D9]" /> Entrega Garantida</span>
              <span className="flex items-center gap-2"><Headphones className="w-4 h-4 text-[#D4A24C]" /> Suporte</span>
              <span className="flex items-center gap-2"><StoreIcon className="w-4 h-4 text-[#6D28D9]" /> Lojas e Desapega</span>
            </div>
          </div>

          {/* Right — 3D object */}
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_50%,rgba(109,40,217,0.18),transparent_60%)] blur-2xl" />
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="absolute w-[3px] h-[3px] rounded-full brane-pulse-glow"
                  style={{
                    left: `${15 + Math.random() * 70}%`,
                    top: `${10 + Math.random() * 75}%`,
                    background: i % 2 ? '#D4A24C' : '#6D28D9',
                    boxShadow: `0 0 10px 2px ${i % 2 ? 'rgba(179,139,54,0.7)' : 'rgba(109,40,217,0.7)'}`,
                    animationDelay: `${Math.random() * 2}s`,
                  }} />
              ))}
            </div>
            <img
              src="/brand/hero_cube.png?v=6"
              alt="BRANE 3D"
              className="relative w-full max-w-[520px] h-auto brane-hero-cube"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-[1400px] mx-auto px-6 pb-16">
        <div className="grid md:grid-cols-3 gap-4">
          <FeatureCard
            iconWrap="brane-icon-wrap-gold"
            icon={<ShieldCheck className="w-5 h-5" />}
            title="Marketplace Seguro"
            desc="Compre e venda com tranquilidade e proteção em cada transação."
          />
          <FeatureCard
            iconWrap="brane-icon-wrap-purple"
            icon={<Zap className="w-5 h-5" />}
            title="Transações Ágeis"
            desc="Pagamentos e saques integrados com entregas rápidas."
          />
          <FeatureCard
            iconWrap="brane-icon-wrap-gold"
            icon={<Users className="w-5 h-5" />}
            title="Comunidade Verificada"
            desc="Pessoas reais, lojas aprovadas e vendedores confiáveis."
          />
        </div>
      </section>

      {/* Categorias populares */}
      <section className="relative z-10 max-w-[1400px] mx-auto px-6 pb-16">
        <div className="text-center mb-8">
          <p className="brane-label mb-3">Explorar</p>
          <h2 className="brane-h2">Categorias populares</h2>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { id: 'eletronicos', name: 'Eletrônicos' },
            { id: 'roupas', name: 'Moda' },
            { id: 'casa', name: 'Casa' },
            { id: 'esportes', name: 'Esportes' },
            { id: 'colecionaveis', name: 'Colecionáveis' },
            { id: 'automoveis', name: 'Veículos' },
          ].map(c => (
            <Link key={c.id} to={`/products?category=${c.id}`} className="brane-card p-5 text-center group" data-testid={`entry-cat-${c.id}`}>
              <Package className="w-6 h-6 mx-auto mb-2 text-[#D4A24C] group-hover:text-[#6D28D9] transition" strokeWidth={1.5} />
              <p className="text-xs md:text-sm text-[#A6A8B3] group-hover:text-white">{c.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="relative z-10 max-w-[1400px] mx-auto px-6 pb-24">
        <div className="brane-card-hero p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <p className="brane-label mb-3">Junte-se a nós</p>
            <h3 className="text-3xl md:text-4xl font-bold mb-3 font-['Outfit'] text-white tracking-tight">
              Pronto para <span className="text-[#6D28D9]">começar</span>?
            </h3>
            <p className="text-[#A6A8B3] text-base">Crie sua conta e faça parte da nova experiência BRANE.</p>
          </div>
          <Link to={user ? '/market' : '/auth?mode=signup'} data-testid="entry-cta-create">
            <button className="brane-btn-primary">
              {user ? 'Ir para o marketplace' : 'Criar conta'} <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </section>

      {/* Footer simple */}
      <div className="relative z-10 border-t border-[#14171F] py-8">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6F7280]">
          <p>&copy; {new Date().getFullYear()} Brane Marketplace. Todos os direitos reservados.</p>
          <p className="tracking-[0.3em] uppercase">BRANE EM VOCÊ</p>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ iconWrap, icon, title, desc }) {
  return (
    <div className="brane-card p-7">
      <div className={iconWrap + ' mb-5'}>{icon}</div>
      <h3 className="text-white font-semibold mb-2 text-base">{title}</h3>
      <p className="text-[#A6A8B3] text-sm leading-relaxed">{desc}</p>
    </div>
  );
}
