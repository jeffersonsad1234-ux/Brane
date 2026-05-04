import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import {
  Smartphone,
  Shirt,
  Home,
  Dumbbell,
  Car,
  Sparkles,
  Store as StoreIcon,
  ArrowRight,
  ChevronRight,
  Zap,
  ShieldCheck,
  Truck,
  Headphones,
  RotateCcw,
  Package,
  Crown,
  Grid3X3,
  Star,
  ShoppingCart,
  Laptop,
  Sofa,
  Gamepad2,
  Gift,
  Percent,
  Search,
  Filter
} from 'lucide-react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import Product3DCard from '../components/Product3DCard';

const API = process.env.REACT_APP_BACKEND_URL + '/api';
const CACHE_KEY = 'brane_market_products_cache_v1';

const categories = [
  { id: '', name: 'Todas' },
  { id: 'eletronicos', name: 'Eletrônicos', icon: Smartphone },
  { id: 'roupas', name: 'Moda', icon: Shirt },
  { id: 'cosmeticos', name: 'Cosméticos', icon: Sparkles },
  { id: 'casa', name: 'Casa & Decoração', icon: Sofa },
  { id: 'acessorios', name: 'Acessórios', icon: Crown },
  { id: 'esportes', name: 'Esportes', icon: Dumbbell },
  { id: 'arte', name: 'Arte', icon: Sparkles },
  { id: 'imoveis', name: 'Imóveis', icon: Home },
  { id: 'automoveis', name: 'Automóveis', icon: Car },
  { id: 'games', name: 'Games', icon: Gamepad2 }
];

const environments = [
  { id: 'eletronicos', name: 'Tecnologia', icon: Smartphone, image: 'linear-gradient(135deg, rgba(31,41,55,0.92), rgba(109,40,217,0.45))' },
  { id: 'roupas', name: 'Moda', icon: Shirt, image: 'linear-gradient(135deg, rgba(55,35,25,0.92), rgba(212,162,76,0.40))' },
  { id: 'casa', name: 'Casa & Decoração', icon: Sofa, image: 'linear-gradient(135deg, rgba(26,43,33,0.92), rgba(120,180,120,0.35))' },
  { id: 'cosmeticos', name: 'Beleza & Saúde', icon: Sparkles, image: 'linear-gradient(135deg, rgba(58,28,50,0.92), rgba(255,120,160,0.35))' },
  { id: 'esportes', name: 'Esportes', icon: Dumbbell, image: 'linear-gradient(135deg, rgba(30,35,48,0.92), rgba(80,120,255,0.35))' },
  { id: 'automoveis', name: 'Automotivo', icon: Car, image: 'linear-gradient(135deg, rgba(20,24,32,0.92), rgba(212,162,76,0.34))' },
  { id: 'games', name: 'Games', icon: Gamepad2, image: 'linear-gradient(135deg, rgba(28,20,48,0.92), rgba(138,44,255,0.40))' }
];

const benefits = [
  { title: 'Frete rápido', text: 'para todo o Brasil', icon: Truck },
  { title: 'Pagamento seguro', text: 'ambiente 100% protegido', icon: ShieldCheck },
  { title: 'Devolução facilitada', text: 'até 7 dias para devolver', icon: RotateCcw },
  { title: 'Suporte humano', text: 'atendimento de verdade', icon: Headphones }
];

const bottomBanners = [
  { title: 'Ofertas relâmpago', text: 'Termina em', value: '02:45:18', icon: Zap, tone: 'from-[#0B0D12] to-[#2B1608]' },
  { title: 'Venda na BRANE', text: 'Transforme o que você não usa em dinheiro.', value: 'Começar agora', icon: Package, tone: 'from-[#2B1A08] to-[#A46E24]' },
  { title: 'Clube BRANE', text: 'Ofertas exclusivas, frete grátis e muito mais.', value: 'Seja membro', icon: Crown, tone: 'from-[#09090D] to-[#3B2505]' },
  { title: 'Cupons exclusivos', text: 'Descontos selecionados para você.', value: 'Ver cupons', icon: Percent, tone: 'from-[#1A1025] to-[#6D28D9]' }
];

export default function HomePage() {
  const { user } = useAuth();
  const productsRef = useRef(null);

  const [products, setProducts] = useState(() => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [loadingProducts, setLoadingProducts] = useState(products.length === 0);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const scrollToProducts = () => {
    productsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);

    try {
      const params = new URLSearchParams();

      if (search) params.set('search', search);
      if (category) params.set('category', category);
      if (city) params.set('city', city);

      params.set('page', page);
      params.set('limit', 24);
      params.set('status', 'active');

      const res = await axios.get(API + '/products?' + params.toString(), {
        timeout: 9000
      });

      const list = res.data.products || [];

      setProducts(list);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);

      try {
        if (!search && !category && !city && page === 1) {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(list));
        }
      } catch {}
    } catch (error) {
      console.error(error);
      if (products.length === 0) setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [category, city, page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
    setTimeout(scrollToProducts, 100);
  };

  const selectCategory = (id) => {
    setCategory(id);
    setPage(1);
    setTimeout(scrollToProducts, 100);
  };

  return (
    <div className="min-h-screen bg-[#F7F3EA] text-[#12141A]" data-testid="home-page">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(212,162,76,0.22),transparent_26%),radial-gradient(circle_at_78%_18%,rgba(109,40,217,0.14),transparent_28%),linear-gradient(180deg,#FFF9EE_0%,#F7F3EA_58%,#EFE8DC_100%)]" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 pt-6 pb-8">
          <div className="grid lg:grid-cols-[1.05fr_1.6fr_0.72fr] gap-5 items-stretch">
            <div className="rounded-[34px] p-7 md:p-8 flex flex-col justify-center">
              <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-[#B98228] mb-5">
                <Sparkles size={15} />
                Marketplace do futuro
              </p>

              <h1 className="text-4xl md:text-5xl font-black leading-[0.98] tracking-tight text-[#111318]">
                O futuro das
                <br />
                compras é agora.
                <span className="block text-[#C4892F]">
                  Bem-vindo à BRANE.
                </span>
              </h1>

              <p className="mt-5 text-base md:text-lg text-[#3F4652] max-w-md leading-relaxed">
                Tecnologia, segurança e milhares de produtos em uma única vitrine premium.
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-7">
                <button
                  type="button"
                  onClick={scrollToProducts}
                  className="h-12 px-6 rounded-2xl bg-[#111318] text-white font-bold inline-flex items-center gap-3 shadow-[0_16px_35px_rgba(17,19,24,0.18)] hover:-translate-y-0.5 transition"
                >
                  Ver produtos
                  <ArrowRight size={18} className="text-[#D4A24C]" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCategory('');
                    setSearch('');
                    setPage(1);
                    setTimeout(scrollToProducts, 100);
                  }}
                  className="h-12 px-6 rounded-2xl bg-white/70 border border-[#D4A24C]/35 text-[#111318] font-bold inline-flex items-center gap-3 hover:bg-white transition"
                >
                  Ver ofertas
                  <Zap size={17} className="text-[#C4892F]" />
                </button>
              </div>
            </div>

            <div className="relative rounded-[34px] overflow-hidden min-h-[330px] bg-[#16121C] shadow-[0_28px_90px_rgba(17,19,24,0.20)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_44%,rgba(255,180,90,0.34),transparent_32%),radial-gradient(circle_at_36%_54%,rgba(109,40,217,0.45),transparent_38%),linear-gradient(135deg,#2B1A2E_0%,#11121A_62%,#4A2A14_100%)]" />

              <div className="relative z-10 h-full grid md:grid-cols-[0.95fr_1.05fr] gap-3 p-7 items-center">
                <div>
                  <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#F1D28A] mb-4">
                    <Star size={14} />
                    Em destaque
                  </p>

                  <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">
                    Tecnologia que transforma o seu dia
                  </h2>

                  <p className="mt-4 text-sm text-white/70">
                    Produtos de qualidade com até
                  </p>

                  <p className="text-4xl font-black text-white mt-1">
                    70% OFF
                  </p>

                  <button
                    type="button"
                    onClick={() => selectCategory('eletronicos')}
                    className="mt-6 h-12 px-6 rounded-2xl bg-white text-[#111318] font-black inline-flex items-center gap-3 hover:bg-[#F1D28A] transition"
                  >
                    Aproveitar ofertas
                    <ArrowRight size={17} />
                  </button>
                </div>

                <div className="relative flex items-center justify-center">
                  <div className="absolute w-[270px] h-[270px] rounded-full bg-[#D4A24C]/18 blur-2xl" />
                  <div className="relative w-[270px] h-[210px] rounded-[50%] bg-[radial-gradient(circle,rgba(255,255,255,0.22),rgba(255,255,255,0.04)_48%,transparent_68%)] border border-white/10" />
                  <Laptop className="absolute w-24 h-24 text-white/90 -translate-x-10 -translate-y-4" />
                  <Smartphone className="absolute w-16 h-16 text-[#F1D28A] -translate-x-28 translate-y-2" />
                  <Headphones className="absolute w-20 h-20 text-white/80 translate-x-24 translate-y-10" />
                </div>
              </div>
            </div>

            <div className="hidden lg:flex flex-col gap-5">
              <button type="button" onClick={() => selectCategory('casa')} className="relative flex-1 rounded-[30px] overflow-hidden bg-[#1A1715] p-6 group text-left">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_55%,rgba(212,162,76,0.25),transparent_38%),linear-gradient(135deg,#24201D,#0E0F14)]" />
                <div className="relative z-10">
                  <h3 className="text-white text-xl font-black leading-tight">
                    Casa & Decoração
                    <br />
                    que combina com você
                  </h3>
                  <span className="mt-6 inline-flex px-4 py-2 rounded-full border border-white/25 text-white text-xs font-bold group-hover:border-[#D4A24C] transition">
                    Ver coleção
                  </span>
                </div>
                <Home className="absolute right-6 bottom-6 w-20 h-20 text-[#D4A24C]/60" />
              </button>

              <button type="button" onClick={scrollToProducts} className="relative flex-1 rounded-[30px] overflow-hidden bg-[#111318] p-6 group text-left">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_55%,rgba(109,40,217,0.23),transparent_38%),linear-gradient(135deg,#111318,#090A0E)]" />
                <div className="relative z-10">
                  <h3 className="text-white text-xl font-black leading-tight">
                    Mais vendidos
                    <br />
                    da semana
                  </h3>
                  <span className="mt-6 inline-flex px-4 py-2 rounded-full border border-white/25 text-white text-xs font-bold group-hover:border-[#D4A24C] transition">
                    Ver lista
                  </span>
                </div>
                <ShoppingCart className="absolute right-6 bottom-6 w-20 h-20 text-[#D4A24C]/60" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 -mt-2 relative z-20">
        <div className="rounded-[28px] bg-white/72 border border-[#E6DAC6] shadow-[0_18px_60px_rgba(70,50,25,0.08)] px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {benefits.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.title} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FFF4DC] flex items-center justify-center text-[#C4892F] shrink-0">
                  <Icon size={20} />
                </div>
                <div>
                  <p className="text-sm font-black text-[#111318]">{item.title}</p>
                  <p className="text-xs text-[#636B76]">{item.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 pt-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl md:text-2xl font-black text-[#111318] flex items-center gap-2">
            <Sparkles className="text-[#C4892F]" size={20} />
            Navegue por ambientes
          </h2>

          <button type="button" onClick={() => selectCategory('')} className="text-sm font-bold text-[#8A6326] hover:text-[#111318] inline-flex items-center gap-1">
            Ver todas
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {environments.map((cat) => {
            const Icon = cat.icon;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => selectCategory(cat.id)}
                className="group text-left relative min-h-[118px] rounded-[28px] overflow-hidden border border-white bg-white shadow-[0_18px_35px_rgba(70,50,25,0.08)] hover:-translate-y-1 transition"
              >
                <div className="absolute inset-0" style={{ background: cat.image }} />
                <div className="absolute inset-x-4 bottom-0 h-[2px] bg-[#D4A24C] shadow-[0_0_18px_rgba(212,162,76,0.85)]" />
                <div className="relative h-full p-4 flex flex-col justify-end text-white">
                  <Icon size={28} className="mb-3 text-[#F1D28A]" />
                  <p className="text-sm font-black leading-tight">{cat.name}</p>
                  <p className="text-xs text-white/75">Ver mais</p>
                </div>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => selectCategory('')}
            className="group relative min-h-[118px] rounded-[28px] overflow-hidden border border-[#D4A24C]/50 bg-white shadow-[0_18px_35px_rgba(70,50,25,0.08)] hover:-translate-y-1 transition"
          >
            <div className="relative h-full p-4 flex flex-col items-center justify-center text-[#111318]">
              <Grid3X3 size={31} className="mb-3 text-[#111318]" />
              <p className="text-sm font-black">Ver todas</p>
            </div>
          </button>
        </div>
      </section>

      <section ref={productsRef} className="max-w-7xl mx-auto px-4 pt-8 scroll-mt-24">
        <div className="rounded-[32px] bg-[#090B10] text-white border border-white/10 shadow-[0_24px_80px_rgba(17,19,24,0.18)] p-4 md:p-6">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-5">
            <div>
              <h2 className="text-2xl font-black">Todos os produtos BRANE</h2>
              <p className="text-sm text-white/50">
                {total} resultado(s) disponíveis na plataforma
              </p>
            </div>

            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3 lg:min-w-[620px]">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  placeholder="Buscar produtos, marcas e oportunidades..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-12 rounded-2xl bg-white/[0.06] border border-white/10 pl-11 pr-4 outline-none text-white placeholder:text-white/35 focus:border-[#D4A24C]/60"
                />
              </div>

              <Select
                value={category || 'all'}
                onValueChange={(v) => {
                  setCategory(v === 'all' ? '' : v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full md:w-52 h-12 rounded-2xl bg-white/[0.06] border-white/10 text-white">
                  <Filter className="w-4 h-4 mr-2 text-white/45" />
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>

                <SelectContent className="bg-[#0B0D12] border-[#1E2230] text-white">
                  <SelectItem value="all">Todas Categorias</SelectItem>
                  {categories.filter((c) => c.id).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <button type="submit" className="h-12 px-6 rounded-2xl bg-[#D4A24C] text-black font-black">
                Buscar
              </button>
            </form>
          </div>

          {(category === 'imoveis' || category === 'automoveis') && (
            <input
              placeholder="Filtrar por cidade..."
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setPage(1);
              }}
              className="mb-5 w-full md:w-72 h-12 rounded-2xl bg-white/[0.06] border border-white/10 px-4 outline-none text-white placeholder:text-white/35 focus:border-[#D4A24C]/60"
            />
          )}

          {loadingProducts && products.length === 0 ? (
            <div className="theme-product-grid">
              {Array.from({ length: 12 }, (_, i) => (
                <div key={i} className="rounded-[24px] bg-white/[0.04] overflow-hidden animate-pulse">
                  <div className="aspect-square bg-white/[0.05]" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 rounded bg-white/10 w-4/5" />
                    <div className="h-3 rounded bg-white/10 w-2/3" />
                    <div className="h-5 rounded bg-white/10 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="theme-product-grid">
                {products.map((product, index) => (
                  <Product3DCard
                    key={product.product_id}
                    product={product}
                    index={index}
                  />
                ))}
              </div>

              {pages > 1 && (
                <div className="flex justify-center gap-2 mt-8 flex-wrap">
                  {page > 1 && (
                    <button onClick={() => setPage(page - 1)} className="px-5 py-3 rounded-2xl bg-white/[0.06] border border-white/10 text-white font-bold">
                      Anterior
                    </button>
                  )}

                  {Array.from({ length: Math.min(pages, 7) }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setPage(i + 1)}
                      className={
                        page === i + 1
                          ? 'px-5 py-3 rounded-2xl bg-[#D4A24C] text-black font-black'
                          : 'px-5 py-3 rounded-2xl bg-white/[0.06] border border-white/10 text-white font-bold'
                      }
                    >
                      {i + 1}
                    </button>
                  ))}

                  {page < pages && (
                    <button onClick={() => setPage(page + 1)} className="px-5 py-3 rounded-2xl bg-white/[0.06] border border-white/10 text-white font-bold">
                      Próximo
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="rounded-[28px] bg-white/[0.04] p-10 text-center">
              <StoreIcon className="w-10 h-10 text-white/30 mx-auto mb-3" />
              <p className="text-white/60">Nenhum produto encontrado.</p>
            </div>
          )}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 pt-5">
        <div className="grid md:grid-cols-4 gap-4">
          {bottomBanners.map((banner) => {
            const Icon = banner.icon;

            return (
              <button
                key={banner.title}
                type="button"
                onClick={scrollToProducts}
                className={'text-left rounded-[28px] p-6 min-h-[132px] bg-gradient-to-br ' + banner.tone + ' text-white border border-white/10 shadow-[0_18px_45px_rgba(17,19,24,0.13)] relative overflow-hidden group'}
              >
                <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-[#D4A24C]/18 blur-2xl" />
                <div className="relative z-10">
                  <Icon size={28} className="text-[#F1D28A] mb-3" />
                  <h3 className="font-black text-lg">{banner.title}</h3>
                  <p className="text-sm text-white/70 mt-1">{banner.text}</p>
                  <p className="text-[#F1D28A] font-black mt-3">{banner.value}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-5">
        <div className="rounded-[28px] bg-[#090B10] text-white border border-white/10 px-6 py-5 grid md:grid-cols-4 gap-5">
          <div className="flex items-center gap-3">
            <Gift className="text-[#D4A24C]" size={26} />
            <div>
              <p className="font-black">Milhares de produtos</p>
              <p className="text-sm text-white/55">Novos itens todos os dias</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Zap className="text-[#D4A24C]" size={26} />
            <div>
              <p className="font-black">As melhores ofertas</p>
              <p className="text-sm text-white/55">Preços imbatíveis</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ShieldCheck className="text-[#D4A24C]" size={26} />
            <div>
              <p className="font-black">Compra garantida</p>
              <p className="text-sm text-white/55">Proteção do início ao fim</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Truck className="text-[#D4A24C]" size={26} />
            <div>
              <p className="font-black">Frete para todo o Brasil</p>
              <p className="text-sm text-white/55">Com rastreio em tempo real</p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 pb-12">
        <div className="rounded-[32px] bg-white border border-[#E8DDC9] p-7 md:p-9 flex flex-col md:flex-row items-center justify-between gap-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#B98228] mb-2">
              Para vendedores
            </p>
            <h3 className="text-2xl md:text-3xl font-black text-[#111318]">
              Venda na BRANE com uma vitrine premium
            </h3>
            <p className="text-[#606875] mt-2">
              Crie sua loja, anuncie produtos e transforme sua marca em experiência.
            </p>
          </div>

          <div className="flex gap-3">
            <Link to={user ? '/add-product' : '/auth?mode=signup'}>
              <button className="h-12 px-6 rounded-2xl border border-[#D4A24C]/45 text-[#111318] font-black hover:bg-[#FFF4DC] transition">
                Saiba mais
              </button>
            </Link>

            <Link to={user ? '/add-product' : '/auth?mode=signup'}>
              <button className="h-12 px-6 rounded-2xl bg-[#111318] text-white font-black inline-flex items-center gap-2 hover:bg-[#252832] transition">
                Começar agora
                <ArrowRight size={17} className="text-[#D4A24C]" />
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
