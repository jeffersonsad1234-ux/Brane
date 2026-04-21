import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Store, Star, Crown, Zap, Search, MapPin, Package } from 'lucide-react';
import { Input } from '../components/ui/input';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PLAN_BADGES = {
  premium: { label: 'PREMIUM', color: '#B38B36', icon: Crown },
  pro: { label: 'PRO', color: '#3B82F6', icon: Zap },
  free: { label: '', color: '#666', icon: Store }
};

function StoreCard({ store }) {
  const logoUrl = store.logo 
    ? (store.logo.startsWith('http') ? store.logo : `${API}/files/${store.logo}`)
    : null;
  const bannerUrl = store.banner 
    ? (store.banner.startsWith('http') ? store.banner : `${API}/files/${store.banner}`)
    : null;
  const badge = PLAN_BADGES[store.plan] || PLAN_BADGES.free;

  return (
    <Link to={`/stores/${store.slug}`} className="group block" data-testid={`store-card-${store.store_id}`}>
      <div className="relative bg-transparent border border-[#2A2A2A] rounded-2xl overflow-hidden transition-all duration-500 hover:border-[#B38B36]/50 hover:shadow-xl hover:shadow-[#B38B36]/10 hover:-translate-y-2">
        {/* Banner */}
        <div className="h-24 bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] relative overflow-hidden">
          {bannerUrl ? (
            <img src={bannerUrl} alt="" className="w-full h-full object-cover opacity-80" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-[#B38B36]/10 via-[#3B82F6]/10 to-[#B38B36]/10" />
          )}
          
          {/* Plan Badge */}
          {badge.label && (
            <div 
              className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1"
              style={{ backgroundColor: `${badge.color}20`, color: badge.color, border: `1px solid ${badge.color}40` }}
            >
              <badge.icon className="w-3 h-3" />
              {badge.label}
            </div>
          )}
        </div>

        {/* Logo */}
        <div className="absolute left-4 top-14 w-16 h-16 rounded-xl bg-[#111] border-4 border-[#0D0D0D] overflow-hidden shadow-lg">
          {logoUrl ? (
            <img src={logoUrl} alt={store.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#B38B36]/20 to-[#B38B36]/5">
              <Store className="w-6 h-6 text-[#B38B36]" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="pt-10 p-4">
          <h3 className="font-bold text-white group-hover:text-[#B38B36] transition-colors truncate">
            {store.name}
          </h3>
          {store.description && (
            <p className="text-xs text-[#666] mt-1 line-clamp-2">{store.description}</p>
          )}
          
          <div className="flex items-center gap-4 mt-3 text-xs text-[#555]">
            <span className="flex items-center gap-1">
              <Package className="w-3 h-3" />
              {store.products_count || 0} produtos
            </span>
            {store.rating > 0 && (
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                {store.rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function StoresPage() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios.get(`${API}/stores?featured_only=true&limit=50`)
      .then(res => setStores(res.data.stores))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredStores = stores.filter(s => 
    !search || s.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen carbon-bg flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#B38B36] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen carbon-bg py-12" data-testid="stores-page">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#B38B36]/10 to-[#3B82F6]/10 border border-[#B38B36]/20 mb-4">
            <Crown className="w-4 h-4 text-[#B38B36]" />
            <span className="text-sm text-[#B38B36] font-medium">Lojas PRO & PREMIUM</span>
          </div>
          <h1 className="text-3xl font-bold font-['Outfit'] mb-3">
            <span className="bg-gradient-to-r from-[#8B6914] via-[#B38B36] to-[#4A7C9B] bg-clip-text text-transparent">
              Lojas em Destaque
            </span>
          </h1>
          <p className="text-[#888] max-w-lg mx-auto">
            Conheça as melhores lojas da plataforma BRANE. Vendedores verificados com produtos de qualidade.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-10">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#555]" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar lojas..."
              className="pl-12 bg-[#1A1A1A] border-[#2A2A2A] text-white rounded-xl py-6"
              data-testid="search-stores"
            />
          </div>
        </div>

        {/* Stores Grid */}
        {filteredStores.length === 0 ? (
          <div className="text-center py-20">
            <Store className="w-16 h-16 text-[#333] mx-auto mb-4" />
            <p className="text-[#888] mb-2">
              {search ? 'Nenhuma loja encontrada' : 'Nenhuma loja em destaque ainda'}
            </p>
            <p className="text-sm text-[#555]">
              {!search && 'Seja o primeiro! Faça upgrade para PRO ou PREMIUM.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="stores-grid">
            {filteredStores.map(store => (
              <StoreCard key={store.store_id} store={store} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
