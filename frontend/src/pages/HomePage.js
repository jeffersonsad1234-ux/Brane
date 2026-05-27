import { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../i18n/I18nContext';

import HomeHero from '../components/home/HomeHero';
import HomeCategories from '../components/home/HomeCategories';
import HomeProducts from '../components/home/HomeProducts';
import HomeBanners from '../components/home/HomeBanners';
import HomeSellerCTA from '../components/home/HomeSellerCTA';
import HomeCompactBar from '../components/home/HomeCompactBar';

import {
  Smartphone,
  Shirt,
  Dumbbell,
  Car,
  Sparkles,
  Zap,
  ShieldCheck,
  Truck,
  Headphones,
  RotateCcw,
  Package,
  Crown,
  Sofa,
  Gamepad2,
  Percent
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL + '/api';
const CACHE_KEY = 'brane_market_products_cache_v15';

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

      if (products.length === 0) {
        setLoadingProducts(true);
      }

      try {
        let list = [];
        let totalPages = 1;

        if (category) {
          const params = new URLSearchParams();
          params.set('category', category);
          params.set('page', page);
          params.set('limit', 24);
          params.set('status', 'active');

          const res = await axios.get(API + '/products?' + params.toString(), {
            timeout: 9000
          });

          list = res.data.products || [];
          totalPages = res.data.pages || 1;
        } else {
          const params = new URLSearchParams();
          params.set('page', page);
          params.set('limit', 24);
          params.set('status', 'active');

          const directRes = await axios
            .get(API + '/products?' + params.toString(), { timeout: 9000 })
            .catch(() => null);

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

                return axios
                  .get(API + '/products?' + catParams.toString(), { timeout: 9000 })
                  .then((res) => res.data.products || [])
                  .catch(() => []);
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

            if (!category && page === 1) {
              sessionStorage.setItem(CACHE_KEY, JSON.stringify(cleanList));
            }
          }
        } catch {}
      } catch (error) {
        console.error('Erro ao buscar produtos:', error);

        if (requestId !== requestIdRef.current) return;

        setPages(1);

        if (products.length === 0) {
          setProducts([]);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setLoadingProducts(false);
        }
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

      <HomeCategories
        environments={environments}
        category={category}
        selectCategory={selectCategory}
      />

      <HomeProducts
        productsRef={productsRef}
        loadingProducts={loadingProducts}
        products={products}
        pages={pages}
        page={page}
        setPage={setPage}
      />

      <HomeBanners banners={bottomBanners} onGoProducts={scrollToProducts} />

      <HomeSellerCTA user={user} />
    </div>
  );
}
