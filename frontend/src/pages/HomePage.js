import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Star, Smartphone, Shirt, Sparkles, Home, Watch, Dumbbell, Palette, Building, Car, ArrowRight, Store, Zap, MapPin, TrendingUp, Shield, Users, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const LOGO_URL = 'https://customer-assets.emergentagent.com/job_brane-exchange/artifacts/wiagamwr_IMG_20260412_043249_662.jpg';

const categories = [
  { id: 'eletronicos', name: 'Eletrônicos', icon: Smartphone, color: '#3B82F6' },
  { id: 'roupas', name: 'Roupas', icon: Shirt, color: '#EC4899' },
  { id: 'cosmeticos', name: 'Cosméticos', icon: Sparkles, color: '#F59E0B' },
  { id: 'casa', name: 'Casa', icon: Home, color: '#10B981' },
  { id: 'acessorios', name: 'Acessórios', icon: Watch, color: '#8B5CF6' },
  { id: 'esportes', name: 'Esportes', icon: Dumbbell, color: '#EF4444' },
  { id: 'arte', name: 'Arte', icon: Palette, color: '#F97316' },
  { id: 'imoveis', name: 'Imóveis', icon: Building, color: '#06B6D4' },
  { id: 'automoveis', name: 'Automóveis', icon: Car, color: '#6366F1' },
];

function ProductCard({ product }) {
  const imgUrl = product.images?.[0]
    ? (product.images[0].startsWith('http') ? product.images[0] : `${API}/files/${product.images[0]}`)
    : null;
  return (
    <Link to={`/products/${product.product_id}`} className="group block" data-testid={`product-card-${product.product_id}`}>
      <div className="relative bg-transparent border border-[#2A2A2A] rounded-2xl overflow-hidden transition-all duration-500 hover:border-[#B38B36]/50 hover:shadow-xl hover:shadow-[#B38B36]/10 hover:-translate-y-2">
        <div className="aspect-square bg-white relative overflow-hidden">
          {imgUrl ? (
            <img src={imgUrl} alt={product.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <Store className="w-12 h-12 text-gray-300" />
            </div>
          )}
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
          {/* Quick view button */}
          <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
            <span className="bg-[#B38B36] text-white text-xs font-semibold px-4 py-2 rounded-full flex items-center justify-center gap-1">
              Ver Detalhes <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>
        <div className="p-4 bg-transparent">
          <h3 className="font-semibold text-sm text-[#8B7355] line-clamp-2 mb-1 group-hover:text-[#B38B36] transition-colors">{product.title}</h3>
          {product.city && <p className="text-xs text-[#555] mb-2 flex items-center gap-1"><MapPin className="w-3 h-3 text-[#4A7C9B]" />{product.city}</p>}
          <p className="text-xl font-bold bg-gradient-to-r from-[#B38B36] to-[#D4A84B] bg-clip-text text-transparent">R$ {product.price?.toFixed(2)}</p>
        </div>
      </div>
    </Link>
  );
}

// 3D Animated Background Component
function AnimatedBackground3D() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Floating orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-[#B38B36]/5 rounded-full blur-3xl animate-float-slow" />
      <div className="absolute top-40 right-20 w-96 h-96 bg-[#3B82F6]/5 rounded-full blur-3xl animate-float-medium" />
      <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-[#B38B36]/3 rounded-full blur-3xl animate-float-fast" />
      
      {/* 3D Grid lines */}
      <div className="absolute inset-0" style={{
        backgroundImage: `
          linear-gradient(to right, rgba(179, 139, 54, 0.03) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(179, 139, 54, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        transform: 'perspective(500px) rotateX(60deg)',
        transformOrigin: 'center top',
        maskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)'
      }} />
      
      {/* Animated particles */}
      {[...Array(20)].map((_, i) => (
        <div 
          key={i}
          className="absolute w-1 h-1 bg-[#B38B36]/30 rounded-full animate-particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${5 + Math.random() * 10}s`
          }}
        />
      ))}
      
      {/* Glowing lines */}
      <div className="absolute top-1/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#B38B36]/20 to-transparent animate-pulse-slow" />
      <div className="absolute top-3/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#3B82F6]/10 to-transparent animate-pulse-slow" style={{ animationDelay: '1s' }} />
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('loja');
  const [products, setProducts] = useState([]);
  const [cityFilter, setCityFilter] = useState('');

  useEffect(() => {
    axios.get(`${API}/products?limit=8`).then(r => setProducts(r.data.products)).catch(() => {});
  }, []);

  return (
    <div className="carbon-bg min-h-screen" data-testid="home-page">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden" data-testid="hero-section">
        <AnimatedBackground3D />
        
        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#B38B36]/10 to-[#3B82F6]/10 border border-[#B38B36]/20 mb-8 animate-fadeIn">
            <Star className="w-4 h-4 text-[#B38B36] fill-[#B38B36]" />
            <span className="text-sm text-[#B38B36] font-medium">Marketplace Premium</span>
          </div>

          {/* Main Title - BRANE with gradient */}
          <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold font-['Outfit'] mb-4 tracking-tight animate-fadeIn" 
              style={{ animationDelay: '0.1s' }}>
            <span className="bg-gradient-to-r from-[#8B6914] via-[#B38B36] to-[#4A7C9B] bg-clip-text text-transparent drop-shadow-lg">
              BRANE
            </span>
          </h1>
          
          {/* Slogan */}
          <p className="text-xs sm:text-sm tracking-[0.3em] uppercase font-['Outfit'] mb-8 animate-fadeIn"
             style={{ animationDelay: '0.2s', color: '#6B5B3A' }}>
            Escolhas que constroem o futuro
          </p>

          {/* Description */}
          <p className="text-[#7A7A7A] text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed animate-fadeIn"
             style={{ animationDelay: '0.3s' }}>
            Venda, compre ou ganhe como afiliado. 
            <span className="text-[#B38B36]"> Comissões transparentes </span>
            em todos os produtos.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
            <Link to="/products" data-testid="explore-products-btn">
              <Button className="bg-gradient-to-r from-[#8B6914] via-[#B38B36] to-[#B38B36] hover:from-[#6B5010] hover:via-[#9A752B] hover:to-[#9A752B] text-white rounded-xl px-10 py-6 text-sm font-semibold gap-2 uppercase tracking-wider shadow-lg shadow-[#B38B36]/20 transition-all duration-300 hover:shadow-xl hover:shadow-[#B38B36]/30 hover:-translate-y-1">
                Explorar Produtos <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            {!user && (
              <Link to="/auth" data-testid="create-account-btn">
                <Button variant="outline" className="rounded-xl px-10 py-6 text-sm font-semibold uppercase tracking-wider border-2 border-[#4A7C9B]/50 text-[#4A7C9B] hover:bg-[#4A7C9B]/10 hover:border-[#4A7C9B] transition-all duration-300">
                  Criar Conta
                </Button>
              </Link>
            )}
            {user && (
              <Link to="/dashboard" data-testid="dashboard-btn">
                <Button variant="outline" className="rounded-xl px-10 py-6 text-sm font-semibold uppercase tracking-wider border-2 border-[#4A7C9B]/50 text-[#4A7C9B] hover:bg-[#4A7C9B]/10 hover:border-[#4A7C9B] transition-all duration-300">
                  Meu Painel
                </Button>
              </Link>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto mt-16 animate-fadeIn" style={{ animationDelay: '0.5s' }}>
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#B38B36] to-[#D4A84B] bg-clip-text text-transparent">9%</p>
              <p className="text-xs text-[#666] mt-1">Comissão Plataforma</p>
            </div>
            <div className="text-center border-x border-[#2A2A2A]">
              <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] bg-clip-text text-transparent">6.5%</p>
              <p className="text-xs text-[#666] mt-1">Ganho Afiliado</p>
            </div>
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#8B6914] to-[#B38B36] bg-clip-text text-transparent">24h</p>
              <p className="text-xs text-[#666] mt-1">Suporte</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 border-t border-[#1A1A1A]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="group p-6 rounded-2xl bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] border border-[#2A2A2A] hover:border-[#B38B36]/30 transition-all duration-500">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#B38B36]/20 to-[#B38B36]/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-7 h-7 text-[#B38B36]" />
              </div>
              <h3 className="text-lg font-bold text-[#8B7355] mb-2 group-hover:text-[#B38B36] transition-colors">Venda Fácil</h3>
              <p className="text-sm text-[#666] leading-relaxed">Cadastre seus produtos em minutos e alcance milhares de compradores interessados.</p>
            </div>
            <div className="group p-6 rounded-2xl bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] border border-[#2A2A2A] hover:border-[#3B82F6]/30 transition-all duration-500">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#3B82F6]/20 to-[#3B82F6]/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-7 h-7 text-[#3B82F6]" />
              </div>
              <h3 className="text-lg font-bold text-[#4A7C9B] mb-2 group-hover:text-[#3B82F6] transition-colors">Compra Segura</h3>
              <p className="text-sm text-[#666] leading-relaxed">Proteção garantida em todas as transações. Seu dinheiro só é liberado após confirmação.</p>
            </div>
            <div className="group p-6 rounded-2xl bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] border border-[#2A2A2A] hover:border-[#8B6914]/30 transition-all duration-500">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#8B6914]/20 to-[#8B6914]/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-7 h-7 text-[#8B6914]" />
              </div>
              <h3 className="text-lg font-bold text-[#6B5B3A] mb-2 group-hover:text-[#8B6914] transition-colors">Seja Afiliado</h3>
              <p className="text-sm text-[#666] leading-relaxed">Compartilhe links e ganhe 6.5% de comissão em cada venda realizada.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs Section */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center gap-2 p-1 bg-[#1A1A1A] rounded-xl w-fit mx-auto border border-[#2A2A2A]">
            {['loja', 'imoveis', 'veiculos'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${activeTab === tab ? 'bg-gradient-to-r from-[#8B6914] to-[#B38B36] text-white shadow-lg' : 'text-[#666] hover:text-[#B38B36]'}`}
                data-testid={`tab-${tab}`}
              >
                {tab === 'loja' ? 'Loja' : tab === 'imoveis' ? 'Imóveis' : 'Veículos'}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-xl font-bold font-['Outfit'] mb-6">
            <span className="bg-gradient-to-r from-[#8B6914] to-[#B38B36] bg-clip-text text-transparent">Categorias</span>
          </h2>
          <div className="flex flex-wrap gap-3">
            {categories.map(cat => (
              <Link 
                key={cat.id} 
                to={`/products?category=${cat.id}`}
                className="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] hover:border-[#B38B36]/30 transition-all duration-300 hover:-translate-y-1"
                data-testid={`category-${cat.id}`}
              >
                <cat.icon className="w-4 h-4 transition-colors duration-300" style={{ color: cat.color }} />
                <span className="text-sm text-[#888] group-hover:text-[#B38B36] transition-colors">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* City Filter for Real Estate/Vehicles */}
      {(activeTab === 'imoveis' || activeTab === 'veiculos') && (
        <section className="py-4">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
              <MapPin className="w-5 h-5 text-[#4A7C9B]" />
              <Input 
                placeholder="Filtrar por cidade..." 
                value={cityFilter} 
                onChange={e => setCityFilter(e.target.value)}
                className="flex-1 bg-[#111] border-[#2A2A2A] text-white placeholder:text-[#555]"
                data-testid="city-filter"
              />
            </div>
          </div>
        </section>
      )}

      {/* Products Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold font-['Outfit']">
              <span className="bg-gradient-to-r from-[#8B6914] via-[#B38B36] to-[#4A7C9B] bg-clip-text text-transparent">
                {activeTab === 'loja' ? 'Produtos em Destaque' : activeTab === 'imoveis' ? 'Imóveis Disponíveis' : 'Veículos à Venda'}
              </span>
            </h2>
            <Link to="/products" className="text-sm text-[#4A7C9B] hover:text-[#3B82F6] flex items-center gap-1 transition-colors" data-testid="see-all-products">
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-20 rounded-2xl bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] border border-[#2A2A2A]">
              <Store className="w-16 h-16 text-[#333] mx-auto mb-4" />
              <p className="text-[#666] mb-2">Nenhum produto encontrado</p>
              <p className="text-sm text-[#555]">Seja o primeiro a cadastrar!</p>
              <Link to="/auth">
                <Button className="gold-btn rounded-xl mt-6">Começar a Vender</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6" data-testid="products-grid">
              {products
                .filter(p => {
                  if (activeTab === 'imoveis') return p.category === 'imoveis';
                  if (activeTab === 'veiculos') return p.category === 'automoveis';
                  return true;
                })
                .filter(p => !cityFilter || p.city?.toLowerCase().includes(cityFilter.toLowerCase()))
                .slice(0, 8)
                .map(p => <ProductCard key={p.product_id} product={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="relative rounded-3xl overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#8B6914]/20 via-[#B38B36]/10 to-[#4A7C9B]/20" />
            <div className="absolute inset-0 bg-[#0D0D0D]/80" />
            
            <div className="relative p-8 md:p-12 text-center">
              <h2 className="text-2xl md:text-3xl font-bold font-['Outfit'] mb-4">
                <span className="bg-gradient-to-r from-[#B38B36] via-[#D4A84B] to-[#4A7C9B] bg-clip-text text-transparent">
                  Comece a Vender Hoje
                </span>
              </h2>
              <p className="text-[#888] mb-8 max-w-md mx-auto">
                Cadastre-se gratuitamente e alcance milhares de compradores interessados nos seus produtos.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/create-store">
                  <Button className="bg-gradient-to-r from-[#8B6914] to-[#B38B36] hover:from-[#6B5010] hover:to-[#9A752B] text-white rounded-xl px-8 py-5 font-semibold shadow-lg shadow-[#B38B36]/20">
                    Criar Minha Loja
                  </Button>
                </Link>
                <Link to="/products">
                  <Button variant="outline" className="rounded-xl px-8 py-5 border-[#4A7C9B]/50 text-[#4A7C9B] hover:bg-[#4A7C9B]/10">
                    Explorar Produtos
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
