import { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../i18n/I18nContext';
import { motion } from 'framer-motion';

import HomeHero from '../components/home/HomeHero';
import HomeCategories from '../components/home/HomeCategories';
import HomeProducts from '../components/home/HomeProducts';
import HomeBanners from '../components/home/HomeBanners';
import HomeSellerCTA from '../components/home/HomeSellerCTA';
import HomeCompactBar from '../components/home/HomeCompactBar';

import {
  Smartphone, Shirt, Dumbbell, Car, Sparkles, Zap, ShieldCheck,
  Truck, Headphones, RotateCcw, Package, Crown, Sofa, Gamepad2, Percent,
  Store, TrendingUp, Clock, Star, ArrowRight, ShoppingBag, Users
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL + '/api';
const CACHE_KEY = 'brane_market_products_cache_v15';

function SkeletonCard() {
  return (
    <div className="rounded-[22px] bg-white border border-[#E5E7EB] overflow-hidden animate-pulse">
      <div className="aspect-square bg-[#F3F4F6]" />
      <div className="p-3 space-y-2">
        <div className="h-3 rounded bg-[#E5E7EB] w-4/5" />
        <div className="h-3 rounded bg-[#E5E7EB] w-2/3" />
        <div className="h-5 rounded bg-[#E5E7EB] w-1/2" />
      </div>
    </div>
  );
}

function SkeletonStoreCard() {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden animate-pulse">
      <div className="h-24 bg-[#F3F4F6]" />
      <div className="pt-10 px-4 pb-4">
        <div className="w-16 h-16 rounded-full bg-[#F3F4F6] mx-auto -mt-14 mb-3" />
        <div className="h-4 bg-[#F3F4F6] w-3/4 mx-auto mb-2 rounded" />
        <div className="h-3 bg-[#F3F4F6] w-1/2 mx-auto rounded" />
      </div>
    </div>
  );
}

export default function HomePage() {
  const { t, lang } = useTranslation();
  const { user } = useAuth();
  const productsRef = useRef(null);
  const requestIdRef = useRef(0);

  const environments = useMemo(() => [
    { id: 'eletronicos', name: t('home.technology'), icon: Smartphone, image: 'linear-gradient(135deg, rgba(31,41,55,0.92), rgba(109,40,217,0.45))' },
    { id: 'roupas', name: t('home.fashion'), icon: Shirt, image: 'linear-gradient(135deg, rgba(55,35,25,0.92), rgba(212,162,76,0.40))' },
    { id: 'casa', name: t('home.home'), icon: Sofa, image: 'linear-gradient(135deg, rgba(26,43,33,0.92), rgba(120,180,120,0.35))' },
    { id: 'cosmeticos', name: t('home.beauty'), icon: Sparkles, image: 'linear-gradient(135deg, rgba(58,28,50,0.92), rgba(255,120,160,0.35))' },
    { id: 'esportes', name: t('home.sports'), icon: Dumbbell, image: 'linear-gradient(135deg, rgba(30,35,48,0.92), rgba(80,120,255,0.35))' },
    { id: 'automoveis', name: t('home.automotive'), icon: Car, image: 'linear-gradient(135deg, rgba(20,24,32,0.92), rgba(212,162,76,0.34))' },
    { id: 'games', name: t('home.games'), icon: Gamepad2, image: 'linear-gradient(135deg, rgba(28,20,48,0.92), rgba(138,44,255,0.40))' }
  ], [lang]);

  const benefits = useMemo(() => [
    { title: t('home.fastShipping'), text: t('home.acrossBrazil'), icon: Truck },
    { title: t('home.securePayment'), text: t('home.protectedEnvironment'), icon: ShieldCheck },
    { title: t('home.easyReturn'), text: t('home.upTo7Days'), icon: RotateCcw },
    { title: t('home.realSupport'), text: t('home.humanService'), icon: Headphones }
  ], [lang]);

  const bottomBanners = useMemo(() => [
    { title: t('home.flashOffers'), text: t('home.endsIn'), value: '02:45:18', icon: Zap, tone: 'from-[#0B0D12] to-[#2B1608]' },
    { title: t('home.sellOnBrane2'), text: t('home.transformUnused'), value: t('home.start'), icon: Package, tone: 'from-[#2B1A08] to-[#A46E24]' },
    { title: t('home.braneClub'), text: t('home.exclusiveCoupons'), value: t('home.becomeMember'), icon: Crown, tone: 'from-[#09090D] to-[#3B2505]' },
    { title: t('home.exclusiveCoupons'), text: t('home.viewCoupons'), value: t('home.viewCoupons'), icon: Percent, tone: 'from-[#1A1025] to-[#6D28D9]' }
  ], [lang]);

  const stats = [
    { label: 'Produtos ativos', value: '12.5k+', icon: Package },
    { label: 'Lojas verificadas', value: '850+', icon: Store },
    { label: 'Usuários', value: '45k+', icon: Users },
    { label: 'Vendas este mês', value: 'R$ 2.3M+', icon: TrendingUp },
  ];

  const [showCompactBar, setShowCompactBar] = useState(false);
  const [compactHero, setCompactHero] = useState(false);

  const [products, setProducts] = useState(() => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [loadingProducts, setLoadingProducts] = useState(products.length === 0);
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  // Featured/highlight products (from same fetch)
  const featuredProducts = useMemo(() => products.slice(0, 4), [products]);
  const recentProducts = useMemo(() => products.slice(0, 8), [products]);

  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY;
      setShowCompactBar(current > 140);
      setCompactHero(current > 260);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToProducts = () => {
    productsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const normalizeProducts = (items) => {
    const seen = new Set();
    const list = [];
    (items || []).forEach((product) => {
      const key = product.product_id || product.id;
      if (key && !seen.has(key)) {
        seen.add(key);
        list.push(product);
      }
    });
    return list;
  };

  useEffect(() => {
    const fetchProducts = async () => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      const cacheKey = CACHE_KEY + '_' + (category || 'all') + '_' + page;

      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const cachedList = JSON.parse(cached);
          if (Array.isArray(cachedList) && cachedList.length > 0) {
            setProducts(cachedList);
            setLoadingProducts(false);
            return;
          }
        }
      } catch {}

      if (products.length === 0) setLoadingProducts(true);

      try {
        let list = [];
        let totalPages = 1;

        if (category) {
          const params = new URLSearchParams();
          params.set('category', category);
          params.set('page', page);
          params.set('limit', 24);
          params.set('status', 'active');
          const res = await axios.get(API + '/products?' + params.toString(), { timeout: 9000 });
          list = res.data.products || [];
          totalPages = res.data.pages || 1;
        } else {
          const params = new URLSearchParams();
          params.set('page', page);
          params.set('limit', 24);
          params.set('status', 'active');
          const directRes = await axios.get(API + '/products?' + params.toString(), { timeout: 9000 }).catch(() => null);
          list = directRes?.data?.products || [];
          totalPages = directRes?.data?.pages || 1;

          if (list.length === 0) {
            const results = await Promise.all(
              environments.map((cat) => {
                const catParams = new URLSearchParams();
                catParams.set('category', cat.id);
                catParams.set('page', 1);
                catParams.set('limit', 24);
                catParams.set('status', 'active');
                return axios.get(API + '/products?' + catParams.toString(), { timeout: 9000 })
                  .then((res) => res.data.products || []).catch(() => []);
              })
            );
            list = results.flat();
            totalPages = 1;
          }
        }

        if (requestId !== requestIdRef.current) return;

        const cleanList = normalizeProducts(list).slice(0, 24);
        setProducts(cleanList);
        setPages(totalPages);

        try {
          if (cleanList.length > 0) {
            sessionStorage.setItem(cacheKey, JSON.stringify(cleanList));
            if (!category && page === 1) sessionStorage.setItem(CACHE_KEY, JSON.stringify(cleanList));
          }
        } catch {}
      } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        if (requestId !== requestIdRef.current) return;
        setPages(1);
        if (products.length === 0) setProducts([]);
      } finally {
        if (requestId === requestIdRef.current) setLoadingProducts(false);
      }
    };

    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, page]);

  const selectCategory = (id) => {
    const nextCategory = id || '';
    if (nextCategory === category && page === 1) {
      scrollToProducts();
      return;
    }
    setCategory(nextCategory);
    setPage(1);
    setTimeout(scrollToProducts, 80);
  };

  return (
    <div className="min-h-screen bg-white text-[#12141A]" data-testid="home-page">
      <HomeCompactBar show={showCompactBar} onGoProducts={scrollToProducts} />

      <HomeHero
        compactHero={compactHero}
        benefits={benefits}
        selectCategory={selectCategory}
        onGoProducts={scrollToProducts}
      />

      {/* Platform Statistics Bar */}
      <section className="bg-[#111318] border-y border-[#1E2230]">
        <div className="max-w-[1400px] mx-auto px-4 py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-default"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#D4A24C]/15 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-[#D4A24C]" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">{s.value}</p>
                    <p className="text-xs text-gray-400">{s.label}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Popular Categories (wider) */}
      <HomeCategories
        environments={environments}
        category={category}
        selectCategory={selectCategory}
      />

      {/* Featured / Trending Products Banner */}
      {!loadingProducts && featuredProducts.length >= 4 && (
        <section className="max-w-[1400px] mx-auto px-4 pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#D4A24C]" />
              <h2 className="text-lg font-bold text-[#111318]">Destaques</h2>
            </div>
            <Link to="/products" className="text-sm text-[#D4A24C] hover:underline flex items-center gap-1">
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {featuredProducts.slice(0, 4).map((p, i) => {
              const img = p.image || p.image_url || p.thumbnail || (p.images?.[0]);
              const imgUrl = img ? (img.startsWith('http') ? img : `${API}/files/${img}`) : null;
              return (
                <Link key={p.product_id || i} to={`/products/${p.product_id}`}
                  className="group relative rounded-2xl overflow-hidden bg-white border border-[#E5E7EB] hover:border-[#D4A24C]/40 transition-all hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="aspect-[4/3] bg-[#F9FAFB]">
                    {imgUrl ? (
                      <img src={imgUrl} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-10 h-10 text-[#E5E7EB]" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-[#D4A24C] text-white text-[10px] font-bold rounded-full">
                      Destaque
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-gray-500 line-clamp-1 mb-1">{p.title}</p>
                    <p className="text-base font-bold text-[#111318]">R$ {Number(p.price || 0).toFixed(2)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Recently Added Products */}
      {!loadingProducts && recentProducts.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-4 pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#D4A24C]" />
              <h2 className="text-lg font-bold text-[#111318]">Recém Adicionados</h2>
            </div>
            <Link to="/products" className="text-sm text-[#D4A24C] hover:underline flex items-center gap-1">
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {recentProducts.slice(0, 6).map((p, i) => {
              const img = p.image || p.image_url || p.thumbnail || (p.images?.[0]);
              const imgUrl = img ? (img.startsWith('http') ? img : `${API}/files/${img}`) : null;
              return (
                <Link key={`recent-${p.product_id || i}`} to={`/products/${p.product_id}`}
                  className="group relative rounded-xl overflow-hidden bg-white border border-[#E5E7EB] hover:border-[#D4A24C]/30 transition-all hover:shadow-md"
                >
                  <div className="aspect-square bg-[#F9FAFB]">
                    {imgUrl ? (
                      <img src={imgUrl} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-[#E5E7EB]" />
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs text-gray-500 line-clamp-1">{p.title}</p>
                    <p className="text-sm font-bold text-[#111318]">R$ {Number(p.price || 0).toFixed(2)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Promotional Banner */}
      <section className="max-w-[1400px] mx-auto px-4 pt-6">
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#111318] via-[#1A1625] to-[#0D0F16] p-6 md:p-8">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4A24C]/15 border border-[#D4A24C]/20 mb-3">
                <Star className="w-3 h-3 text-[#D4A24C]" />
                <span className="text-xs text-[#D4A24C] font-semibold">Ofertas Limitadas</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-1">Produtos Exclusivos com Preços Especiais</h3>
              <p className="text-sm text-gray-400">Aproveite descontos incríveis em produtos selecionados por tempo limitado.</p>
            </div>
            <Link to="/products"
              className="flex-shrink-0 px-6 py-3 bg-gradient-to-r from-[#D4A24C] to-[#B38B36] text-white font-semibold rounded-xl hover:from-[#E8C372] hover:to-[#D4A24C] transition-all shadow-lg shadow-[#D4A24C]/20"
            >
              Ver Ofertas
            </Link>
          </div>
        </div>
      </section>

      {/* Main Products Grid */}
      <HomeProducts
        productsRef={productsRef}
        loadingProducts={loadingProducts}
        products={products}
        pages={pages}
        page={page}
        setPage={setPage}
      />

      {/* Recommended Stores Section */}
      <section className="max-w-[1400px] mx-auto px-4 pt-8 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-[#D4A24C]" />
            <h2 className="text-lg font-bold text-[#111318]">Lojas Recomendadas</h2>
          </div>
          <Link to="/stores" className="text-sm text-[#D4A24C] hover:underline flex items-center gap-1">
            Ver todas <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {loadingProducts ? (
            Array.from({ length: 5 }, (_, i) => <SkeletonStoreCard key={i} />)
          ) : (
            [
              { name: 'TechStore Brasil', cat: 'Eletrônicos', color: 'from-blue-600 to-purple-600' },
              { name: 'Moda & Estilo', cat: 'Roupas e Acessórios', color: 'from-pink-500 to-rose-500' },
              { name: 'Casa Inteligente', cat: 'Casa e Decoração', color: 'from-emerald-500 to-teal-500' },
              { name: 'GameZone', cat: 'Games e Consoles', color: 'from-violet-500 to-indigo-500' },
              { name: 'Beauty Care', cat: 'Cosméticos', color: 'from-amber-400 to-orange-500' },
            ].map((store, i) => (
              <Link key={i} to="/stores"
                className="group bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden hover:border-[#D4A24C]/30 hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <div className={`h-20 bg-gradient-to-br ${store.color} flex items-center justify-center`}>
                  <Store className="w-8 h-8 text-white/60" />
                </div>
                <div className="p-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center mx-auto -mt-10 mb-2 shadow-sm">
                    <Store className="w-5 h-5 text-[#D4A24C]" />
                  </div>
                  <p className="text-sm font-semibold text-[#111318] group-hover:text-[#D4A24C] transition-colors">{store.name}</p>
                  <p className="text-xs text-gray-400">{store.cat}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* Bottom Banners */}
      <HomeBanners banners={bottomBanners} onGoProducts={scrollToProducts} />

      <HomeSellerCTA user={user} />
    </div>
  );
}
