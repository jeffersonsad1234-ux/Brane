import { Link } from 'react-router-dom';
import { Star, Smartphone, Shirt, Sparkles, Home, Watch, Dumbbell, Palette, Building, Car, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';

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

export default function HomePage() {
  return (
    <div data-testid="home-page">
      {/* Hero Section */}
      <section className="hero-section py-20 md:py-32" data-testid="hero-section">
        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <div className="flex items-center justify-center gap-1 mb-6">
            <span className="text-white text-sm md:text-base font-medium tracking-wider uppercase">Marketplace Premium</span>
            <div className="flex ml-2">
              {[1,2,3,4].map(i => <Star key={i} className="w-4 h-4 fill-[#B38B36] text-[#B38B36]" />)}
            </div>
          </div>

          <img src={LOGO_URL} alt="BRANE" className="w-24 h-24 md:w-32 md:h-32 rounded-2xl mx-auto mb-6 shadow-2xl" data-testid="hero-logo" />

          <h1 className="brane-logo-text mb-4" data-testid="hero-title">BRANE</h1>

          <p className="text-gray-300 text-base md:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            Venda, compre ou ganhe como afiliado. Sistema transparente de comissoes.
          </p>

          <Link to="/products" data-testid="explore-products-btn">
            <Button className="gold-btn rounded-full px-8 py-6 text-base font-semibold gap-2">
              Explorar Produtos <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-[#F9F9F8]" data-testid="categories-section">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-2 font-['Outfit'] text-[#1A1A1A]">Categorias</h2>
          <p className="text-center text-[#666] mb-10">Encontre o que precisa</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map(cat => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.id}
                  to={`/products?category=${cat.id}`}
                  className="category-card bg-white rounded-xl p-6 text-center border border-[#E5E5E5]"
                  data-testid={`category-${cat.id}`}
                >
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${cat.color}15` }}>
                    <Icon className="w-6 h-6" style={{ color: cat.color }} />
                  </div>
                  <p className="text-sm font-medium text-[#1A1A1A]">{cat.name}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white" data-testid="cta-section">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-[#F9F9F8] rounded-xl p-8 border border-[#E5E5E5] text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#B38B36]/10 flex items-center justify-center">
                <Smartphone className="w-7 h-7 text-[#B38B36]" />
              </div>
              <h3 className="font-bold text-lg mb-2 font-['Outfit']">Venda seus Produtos</h3>
              <p className="text-sm text-[#666]">Torne-se vendedor e alcance milhares de compradores na plataforma BRANE.</p>
            </div>
            <div className="bg-[#F9F9F8] rounded-xl p-8 border border-[#E5E5E5] text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#B38B36]/10 flex items-center justify-center">
                <Star className="w-7 h-7 text-[#B38B36]" />
              </div>
              <h3 className="font-bold text-lg mb-2 font-['Outfit']">Ganhe como Afiliado</h3>
              <p className="text-sm text-[#666]">Indique produtos e ganhe 6.5% de comissao em cada venda realizada.</p>
            </div>
            <div className="bg-[#F9F9F8] rounded-xl p-8 border border-[#E5E5E5] text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#B38B36]/10 flex items-center justify-center">
                <Building className="w-7 h-7 text-[#B38B36]" />
              </div>
              <h3 className="font-bold text-lg mb-2 font-['Outfit']">Marketplace Completo</h3>
              <p className="text-sm text-[#666]">De eletronicos a imoveis. Tudo em um so lugar com seguranca total.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
