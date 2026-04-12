import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Star, Smartphone, Shirt, Sparkles, Home, Watch, Dumbbell, Palette, Building, Car, ArrowRight, Store, Zap, MapPin, TrendingUp, Shield, Users } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const LOGO_URL = 'https://customer-assets.emergentagent.com/job_brane-exchange/artifacts/wiagamwr_IMG_20260412_043249_662.jpg';

const categories = [
  { id: 'eletronicos', name: 'Eletronicos', icon: Smartphone, color: '#3B82F6' },
  { id: 'roupas', name: 'Roupas', icon: Shirt, color: '#EC4899' },
  { id: 'cosmeticos', name: 'Cosmeticos', icon: Sparkles, color: '#F59E0B' },
  { id: 'casa', name: 'Casa e Decoracao', icon: Home, color: '#10B981' },
  { id: 'acessorios', name: 'Acessorios', icon: Watch, color: '#8B5CF6' },
  { id: 'esportes', name: 'Esportes', icon: Dumbbell, color: '#EF4444' },
  { id: 'arte', name: 'Arte', icon: Palette, color: '#F97316' },
  { id: 'imoveis', name: 'Imoveis', icon: Building, color: '#06B6D4' },
  { id: 'automoveis', name: 'Automoveis', icon: Car, color: '#6366F1' },
];

function ProductCard({ product }) {
  const imgUrl = product.images?.[0]
    ? (product.images[0].startsWith('http') ? product.images[0] : `${API}/files/${product.images[0]}`)
    : null;
  return (
    <Link to={`/products/${product.product_id}`} className="group block" data-testid={`product-card-${product.product_id}`}>
      <div className="relative bg-transparent border border-[#2A2A2A] rounded-xl overflow-hidden transition-all duration-300 hover:border-[#B38B36]/50 hover:shadow-lg hover:shadow-[#B38B36]/10 hover:-translate-y-1">
        <div className="aspect-square bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] relative overflow-hidden">
          {imgUrl ? (
            <img src={imgUrl} alt={product.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#333]">
              <Store className="w-10 h-10" />
            </div>
          )}
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        <div className="p-4 bg-transparent">
          <h3 className="font-semibold text-sm text-white line-clamp-2 mb-1 group-hover:text-[#B38B36] transition-colors">{product.title}</h3>
          {product.city && <p className="text-xs text-[#666] mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" />{product.city}</p>}
          <p className="text-lg font-bold text-[#B38B36]">R$ {product.price?.toFixed(2)}</p>
        </div>
      </div>
    </Link>
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
      <section className="hero-section py-16 md:py-24" data-testid="hero-section">
        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <div className="marketplace-badge mx-auto w-fit mb-6">
            <Star className="w-4 h-4 fill-[#B38B36]" />
            <span>Marketplace Premium</span>
          </div>

          <h1 className="brane-logo-text mb-3" data-testid="hero-title">BRANE</h1>
          <p className="text-xs text-[#B38B36]/60 tracking-[0.3em] uppercase font-['Outfit'] mb-6">Escolhas que constroem o futuro</p>

          <p className="text-[#999] text-base md:text-lg max-w-xl mx-auto mb-8 leading-relaxed">
            Venda, compre ou ganhe como afiliado. Comissoes transparentes em todos os produtos.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link to="/products" data-testid="explore-products-btn">
              <Button className="gold-btn rounded-lg px-8 py-5 text-sm font-semibold gap-2 uppercase tracking-wider">
                Explorar <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            {!user && (
              <Link to="/auth" data-testid="create-account-btn">
                <Button variant="outline" className="gold-btn-outline rounded-lg px-8 py-5 text-sm font-semibold uppercase tracking-wider border-[#B38B36] text-[#B38B36] hover:bg-[#B38B36]/10">
                  Criar Conta
                </Button>
              </Link>
            )}
            {user && (
              <Link to="/dashboard" data-testid="dashboard-btn">
                <Button variant="outline" className="gold-btn-outline rounded-lg px-8 py-5 text-sm font-semibold uppercase tracking-wider border-[#B38B36] text-[#B38B36] hover:bg-[#B38B36]/10">
                  Meu Painel
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Gold line divider */}
      <div className="gold-line" />

      {/* Lojas / Venda Rapida Tabs + City Filter */}
      <section className="py-8" data-testid="store-section">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <button
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'loja' ? 'bg-[#B38B36]/15 text-[#B38B36] border border-[#B38B36]/30' : 'text-[#888] hover:text-white border border-transparent'}`}
                onClick={() => setActiveTab('loja')}
                data-testid="tab-loja"
              >
                <Store className="w-4 h-4" /> Lojas
              </button>
              <button
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'rapida' ? 'bg-[#B38B36]/15 text-[#B38B36] border border-[#B38B36]/30' : 'text-[#888] hover:text-white border border-transparent'}`}
                onClick={() => setActiveTab('rapida')}
                data-testid="tab-venda-rapida"
              >
                <Zap className="w-4 h-4" /> Venda Rapida
              </button>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#888]" />
              <Input
                placeholder="Filtrar por cidade..."
                value={cityFilter}
                onChange={e => setCityFilter(e.target.value)}
                className="w-48 bg-[#1A1A1A] border-[#2A2A2A] text-white text-sm placeholder:text-[#555]"
                data-testid="home-city-filter"
              />
            </div>
          </div>
          <p className="text-sm text-[#666] mb-6">
            {activeTab === 'loja' ? 'Produtos de lojas e vendedores estabelecidos' : 'Anuncios individuais e vendas rapidas'}
          </p>

          {/* Products Grid */}
          {products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
              {products.filter(p => !cityFilter || p.city?.toLowerCase().includes(cityFilter.toLowerCase())).map(p => (
                <ProductCard key={p.product_id} product={p} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 dark-card rounded-xl">
              <Store className="w-10 h-10 text-[#444] mx-auto mb-3" />
              <p className="text-[#666]">Nenhum produto disponivel ainda</p>
              <p className="text-xs text-[#555] mt-1">Torne-se vendedor para ser o primeiro!</p>
            </div>
          )}

          {products.length > 0 && (
            <div className="text-center">
              <Link to="/products" data-testid="view-all-products">
                <Button variant="ghost" className="text-[#B38B36] hover:text-[#9A752B] text-sm">
                  Ver todos os produtos <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="py-12" data-testid="categories-section">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl md:text-2xl font-bold font-['Outfit'] text-white">Categorias</h2>
            <Link to="/products" className="text-sm text-[#B38B36] hover:text-[#9A752B]" data-testid="view-all-categories">
              Ver todas &rsaquo;
            </Link>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3">
            {categories.map(cat => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.id}
                  to={`/products?category=${cat.id}`}
                  className="category-card dark-card rounded-xl p-4 text-center"
                  data-testid={`category-${cat.id}`}
                >
                  <div className="w-10 h-10 mx-auto mb-2 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${cat.color}15` }}>
                    <Icon className="w-5 h-5" style={{ color: cat.color }} />
                  </div>
                  <p className="text-xs font-medium text-[#CCC]">{cat.name}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12" data-testid="cta-section">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="dark-card rounded-xl p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#B38B36]/10 flex items-center justify-center">
                <Store className="w-6 h-6 text-[#B38B36]" />
              </div>
              <h3 className="font-bold text-base mb-2 font-['Outfit'] text-white">Venda seus Produtos</h3>
              <p className="text-xs text-[#888]">Torne-se vendedor e alcance milhares de compradores na plataforma BRANE.</p>
            </div>
            <div className="dark-card rounded-xl p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#B38B36]/10 flex items-center justify-center">
                <Star className="w-6 h-6 text-[#B38B36]" />
              </div>
              <h3 className="font-bold text-base mb-2 font-['Outfit'] text-white">Ganhe como Afiliado</h3>
              <p className="text-xs text-[#888]">Indique produtos e ganhe 6.5% de comissao em cada venda.</p>
            </div>
            <div className="dark-card rounded-xl p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#B38B36]/10 flex items-center justify-center">
                <Building className="w-6 h-6 text-[#B38B36]" />
              </div>
              <h3 className="font-bold text-base mb-2 font-['Outfit'] text-white">Marketplace Completo</h3>
              <p className="text-xs text-[#888]">De eletronicos a imoveis. Tudo em um so lugar com seguranca total.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
