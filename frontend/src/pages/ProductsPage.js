import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Search, Filter, Store } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const categories = [
  { id: '', name: 'Todas' }, { id: 'eletronicos', name: 'Eletronicos' },
  { id: 'roupas', name: 'Roupas' }, { id: 'cosmeticos', name: 'Cosmeticos' },
  { id: 'casa', name: 'Casa e Decoracao' }, { id: 'acessorios', name: 'Acessorios' },
  { id: 'esportes', name: 'Esportes' }, { id: 'arte', name: 'Arte' },
  { id: 'imoveis', name: 'Imoveis' }, { id: 'automoveis', name: 'Automoveis' }
];

function ProductCard({ product }) {
  const img = product.images?.[0];

const imgUrl = img
  ? (img.startsWith('http')
      ? img
      : ${API}/files/${img})
  : null;
  return (
    <Link to={`/products/${product.product_id}`} className="card-hover dark-card rounded-xl overflow-hidden block" data-testid={`product-card-${product.product_id}`}>
      <div className="aspect-square bg-[#1A1A1A] relative overflow-hidden">
        {imgUrl ? (
          <img src={imgUrl} alt={product.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#444]"><Store className="w-10 h-10" /></div>
        )}
        {product.category && (
          <span className="absolute top-2 left-2 bg-black/70 text-xs px-2 py-1 rounded-full font-medium text-[#CCC]">
            {categories.find(c => c.id === product.category)?.name || product.category}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-sm text-white line-clamp-2 mb-1">{product.title}</h3>
        {product.city && <p className="text-xs text-[#888] mb-2">{product.city}</p>}
        <p className="text-lg font-bold text-[#B38B36]">R$ {product.price?.toFixed(2)}</p>
        <p className="text-xs text-[#666] mt-1">por {product.seller_name}</p>
      </div>
    </Link>
  );
}

export default function ProductsPage() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      if (city) params.set('city', city);
      params.set('page', page);
      const res = await axios.get(`${API}/products?${params.toString()}`);
      setProducts(res.data.products);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch { setProducts([]); } finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, [category, city, page]);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); fetchProducts(); };

  return (
    <div className="min-h-screen carbon-bg py-8" data-testid="products-page">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-2xl md:text-3xl font-bold font-['Outfit'] text-white mb-6">Produtos</h1>

        <div className="dark-card rounded-xl p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)}
                  className="pl-10 bg-[#111] border-[#2A2A2A] text-white placeholder:text-[#555]" data-testid="products-search-input" />
              </div>
              <Button type="submit" className="gold-btn rounded-lg" data-testid="products-search-btn">Buscar</Button>
            </form>
            <Select value={category} onValueChange={v => { setCategory(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-full md:w-48 bg-[#111] border-[#2A2A2A] text-white" data-testid="category-filter">
                <Filter className="w-4 h-4 mr-2 text-[#888]" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A1A] border-[#2A2A2A]">
                <SelectItem value="all">Todas Categorias</SelectItem>
                {categories.filter(c => c.id).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {(category === 'imoveis' || category === 'automoveis') && (
              <Input placeholder="Filtrar por cidade..." value={city} onChange={e => { setCity(e.target.value); setPage(1); }}
                className="w-full md:w-48 bg-[#111] border-[#2A2A2A] text-white placeholder:text-[#555]" data-testid="city-filter" />
            )}
          </div>
        </div>

        <p className="text-sm text-[#888] mb-4">{total} produto(s) encontrado(s)</p>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-4 border-[#B38B36] border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 dark-card rounded-xl">
            <Store className="w-12 h-12 text-[#444] mx-auto mb-3" />
            <p className="text-[#888] text-lg">Nenhum produto encontrado</p>
            <p className="text-sm text-[#555] mt-2">Torne-se vendedor para adicionar produtos!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map(p => <ProductCard key={p.product_id} product={p} />)}
            </div>
            {pages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                {Array.from({ length: pages }, (_, i) => (
                  <Button key={i+1} variant={page === i+1 ? "default" : "outline"}
                    className={page === i+1 ? "gold-btn" : "border-[#2A2A2A] text-[#888]"} size="sm"
                    onClick={() => setPage(i+1)} data-testid={`page-${i+1}`}>{i+1}</Button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
