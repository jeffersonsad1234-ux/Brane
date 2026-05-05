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

// Produtos mockados realistas para demonstração inicial
const MOCK_PRODUCTS = [
  {
    product_id: 'mock_1',
    title: 'iPhone 15 Pro Max 256GB',
    price: 8999.90,
    image: 'https://images.unsplash.com/photo-1592286927505-1def25115558?w=400&h=400&fit=crop',
    city: 'São Paulo, SP',
    rating: 4.9,
    rating_count: 1240,
    seller_name: 'Tech Store Premium',
    category: 'eletronicos',
    free_shipping: true
  },
  {
    product_id: 'mock_2',
    title: 'Fone de Ouvido Sony WH-1000XM5',
    price: 2499.00,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
    city: 'Rio de Janeiro, RJ',
    rating: 4.8,
    rating_count: 856,
    seller_name: 'Audio Pro',
    category: 'eletronicos',
    free_shipping: true
  },
  {
    product_id: 'mock_3',
    title: 'Samsung Galaxy S24 Ultra',
    price: 7999.00,
    image: 'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=400&h=400&fit=crop',
    city: 'Belo Horizonte, MG',
    rating: 4.9,
    rating_count: 2103,
    seller_name: 'Mobile Center',
    category: 'eletronicos',
    free_shipping: true
  },
  {
    product_id: 'mock_4',
    title: 'Jaqueta de Couro Premium',
    price: 599.90,
    image: 'https://images.unsplash.com/photo-1551028719-00167b16ebc5?w=400&h=400&fit=crop',
    city: 'São Paulo, SP',
    rating: 4.7,
    rating_count: 342,
    seller_name: 'Fashion Elite',
    category: 'roupas',
    free_shipping: true
  },
  {
    product_id: 'mock_5',
    title: 'Tênis Nike Air Max 90',
    price: 449.90,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
    city: 'Curitiba, PR',
    rating: 4.8,
    rating_count: 1567,
    seller_name: 'Sneaker Store',
    category: 'roupas',
    free_shipping: true
  },
  {
    product_id: 'mock_6',
    title: 'Sofá Retrátil 3 Lugares',
    price: 2199.00,
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop',
    city: 'Brasília, DF',
    rating: 4.6,
    rating_count: 523,
    seller_name: 'Móveis Premium',
    category: 'casa',
    free_shipping: false
  },
  {
    product_id: 'mock_7',
    title: 'Notebook Gamer ASUS ROG',
    price: 5999.90,
    image: 'https://images.unsplash.com/photo-1588872657840-790ff3bde08c?w=400&h=400&fit=crop',
    city: 'Salvador, BA',
    rating: 4.9,
    rating_count: 892,
    seller_name: 'Tech Gaming',
    category: 'eletronicos',
    free_shipping: true
  },
  {
    product_id: 'mock_8',
    title: 'Relógio Inteligente Apple Watch Series 9',
    price: 3299.00,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
    city: 'Recife, PE',
    rating: 4.8,
    rating_count: 1203,
    seller_name: 'Apple Authorized',
    category: 'eletronicos',
    free_shipping: true
  },
  {
    product_id: 'mock_9',
    title: 'Mochila Adidas Originals',
    price: 299.90,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop',
    city: 'Fortaleza, CE',
    rating: 4.7,
    rating_count: 645,
    seller_name: 'Sports Outlet',
    category: 'roupas',
    free_shipping: true
  },
  {
    product_id: 'mock_10',
    title: 'Webcam Logitech 4K',
    price: 799.90,
    image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&h=400&fit=crop',
    city: 'Manaus, AM',
    rating: 4.9,
    rating_count: 734,
    seller_name: 'Tech Accessories',
    category: 'eletronicos',
    free_shipping: true
  },
  {
    product_id: 'mock_11',
    title: 'Cadeira Gamer RGB',
    price: 1299.00,
    image: 'https://images.unsplash.com/photo-1572846914382-f3a5ad7b53da?w=400&h=400&fit=crop',
    city: 'Porto Alegre, RS',
    rating: 4.6,
    rating_count: 456,
    seller_name: 'Gaming Furniture',
    category: 'casa',
    free_shipping: false
  },
  {
    product_id: 'mock_12',
    title: 'Monitor LG UltraWide 34\"',
    price: 2899.00,
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=400&fit=crop',
    city: 'Campinas, SP',
    rating: 4.8,
    rating_count: 678,
    seller_name: 'PC Components',
    category: 'eletronicos',
    free_shipping: true
  }
];

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
            
            // Se ainda nao houver produtos, usar mock para demonstracao
            if (list.length === 0) {
              list = MOCK_PRODUCTS;
            }
            
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
