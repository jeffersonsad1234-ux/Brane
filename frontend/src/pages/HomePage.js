import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

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

const environments = [
  { id: 'eletronicos', name: 'Tecnologia', icon: Smartphone, image: 'linear-gradient(135deg, rgba(31,41,55,0.92), rgba(109,40,217,0.45))' },
  { id: 'roupas', name: 'Moda', icon: Shirt, image: 'linear-gradient(135deg, rgba(55,35,25,0.92), rgba(212,162,76,0.40))' },
  { id: 'casa', name: 'Casa', icon: Sofa, image: 'linear-gradient(135deg, rgba(26,43,33,0.92), rgba(120,180,120,0.35))' },
  { id: 'cosmeticos', name: 'Beleza', icon: Sparkles, image: 'linear-gradient(135deg, rgba(58,28,50,0.92), rgba(255,120,160,0.35))' },
  { id: 'esportes', name: 'Esportes', icon: Dumbbell, image: 'linear-gradient(135deg, rgba(30,35,48,0.92), rgba(80,120,255,0.35))' },
  { id: 'automoveis', name: 'Auto', icon: Car, image: 'linear-gradient(135deg, rgba(20,24,32,0.92), rgba(212,162,76,0.34))' },
  { id: 'games', name: 'Games', icon: Gamepad2, image: 'linear-gradient(135deg, rgba(28,20,48,0.92), rgba(138,44,255,0.40))' }
];

const benefits = [
  { title: 'Frete rápido', text: 'para todo o Brasil', icon: Truck },
  { title: 'Pagamento seguro', text: 'ambiente protegido', icon: ShieldCheck },
  { title: 'Devolução fácil', text: 'até 7 dias', icon: RotateCcw },
  { title: 'Suporte real', text: 'atendimento humano', icon: Headphones }
];

const bottomBanners = [];

export default function HomePage() {
  const { user } = useAuth();
  const productsRef = useRef(null);
  const requestIdRef = useRef(0);

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
    <div className="min-h-screen bg-gradient-to-b from-[#0A0B0F] via-[#0F1117] to-[#0A0B0F] text-[#F7F7FA]" data-testid="home-page">
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

      {bottomBanners.length > 0 && <HomeBanners banners={bottomBanners} onGoProducts={scrollToProducts} />}

      <HomeSellerCTA user={user} />
    </div>
  );
}
