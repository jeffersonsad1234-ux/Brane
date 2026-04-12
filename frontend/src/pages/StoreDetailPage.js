import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Store, Star, Crown, Zap, Package, MapPin, ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '../components/ui/button';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PLAN_BADGES = {
  premium: { label: 'PREMIUM', color: '#B38B36', icon: Crown, bg: 'from-[#B38B36]/20 to-[#B38B36]/5' },
  pro: { label: 'PRO', color: '#3B82F6', icon: Zap, bg: 'from-[#3B82F6]/20 to-[#3B82F6]/5' },
  free: { label: '', color: '#666', icon: Store, bg: 'from-[#666]/20 to-[#666]/5' }
};

function ProductCard({ product }) {
  const imgUrl = product.images?.[0]
    ? (product.images[0].startsWith('http') ? product.images[0] : `${API}/files/${product.images[0]}`)
    : null;
    
  return (
    <Link to={`/products/${product.product_id}`} className="group block">
      <div className="relative bg-transparent border border-[#2A2A2A] rounded-2xl overflow-hidden transition-all duration-500 hover:border-[#B38B36]/50 hover:shadow-xl hover:shadow-[#B38B36]/10 hover:-translate-y-2">
        <div className="aspect-square bg-white relative overflow-hidden">
          {imgUrl ? (
            <img src={imgUrl} alt={product.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <Package className="w-12 h-12 text-gray-300" />
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-sm text-[#8B7355] line-clamp-2 mb-1 group-hover:text-[#B38B36] transition-colors">
            {product.title}
          </h3>
          {product.city && (
            <p className="text-xs text-[#555] mb-2 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#4A7C9B]" />{product.city}
            </p>
          )}
          <p className="text-xl font-bold bg-gradient-to-r from-[#B38B36] to-[#D4A84B] bg-clip-text text-transparent">
            R$ {product.price?.toFixed(2)}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default function StoreDetailPage() {
  const { slug } = useParams();
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/stores/${slug}`)
      .then(res => setStore(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen carbon-bg flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#B38B36] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen carbon-bg flex items-center justify-center">
        <div className="text-center">
          <Store className="w-16 h-16 text-[#333] mx-auto mb-4" />
          <p className="text-[#888] mb-4">Loja não encontrada</p>
          <Link to="/stores">
            <Button className="gold-btn rounded-lg">Ver Lojas</Button>
          </Link>
        </div>
      </div>
    );
  }

  const logoUrl = store.logo 
    ? (store.logo.startsWith('http') ? store.logo : `${API}/files/${store.logo}`)
    : null;
  const bannerUrl = store.banner 
    ? (store.banner.startsWith('http') ? store.banner : `${API}/files/${store.banner}`)
    : null;
  const badge = PLAN_BADGES[store.plan] || PLAN_BADGES.free;

  return (
    <div className="min-h-screen carbon-bg" data-testid="store-detail-page">
      {/* Banner */}
      <div className="relative h-48 md:h-64 bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D]">
        {bannerUrl ? (
          <img src={bannerUrl} alt="" className="w-full h-full object-cover opacity-60" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-[#B38B36]/20 via-[#3B82F6]/10 to-[#B38B36]/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-transparent to-transparent" />
        
        {/* Back Button */}
        <Link 
          to="/stores" 
          className="absolute top-4 left-4 flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-black/30 px-3 py-2 rounded-lg backdrop-blur-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>
      </div>

      {/* Store Info */}
      <div className="max-w-7xl mx-auto px-4 -mt-16 relative z-10">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Logo */}
          <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-[#111] border-4 border-[#0D0D0D] overflow-hidden shadow-2xl shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt={store.name} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${badge.bg}`}>
                <Store className="w-12 h-12" style={{ color: badge.color }} />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 pt-2">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-white">{store.name}</h1>
              {badge.label && (
                <span 
                  className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"
                  style={{ backgroundColor: `${badge.color}20`, color: badge.color, border: `1px solid ${badge.color}40` }}
                >
                  <badge.icon className="w-3 h-3" />
                  {badge.label}
                </span>
              )}
            </div>
            
            {store.description && (
              <p className="text-[#888] mb-4 max-w-2xl">{store.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-6 text-sm">
              <span className="flex items-center gap-2 text-[#666]">
                <Package className="w-4 h-4 text-[#B38B36]" />
                <span className="text-white font-medium">{store.products?.length || 0}</span> produtos
              </span>
              <span className="flex items-center gap-2 text-[#666]">
                <Store className="w-4 h-4 text-[#B38B36]" />
                <span className="text-white font-medium">{store.total_sales || 0}</span> vendas
              </span>
              {store.rating > 0 && (
                <span className="flex items-center gap-2 text-[#666]">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-white font-medium">{store.rating.toFixed(1)}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="mt-12 pb-12">
          <h2 className="text-xl font-bold mb-6">
            <span className="bg-gradient-to-r from-[#8B6914] via-[#B38B36] to-[#4A7C9B] bg-clip-text text-transparent">
              Produtos da Loja
            </span>
          </h2>

          {(!store.products || store.products.length === 0) ? (
            <div className="text-center py-16 rounded-2xl bg-[#1A1A1A]/50 border border-[#2A2A2A]">
              <Package className="w-12 h-12 text-[#333] mx-auto mb-3" />
              <p className="text-[#888]">Esta loja ainda não tem produtos</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {store.products.map(product => (
                <ProductCard key={product.product_id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
