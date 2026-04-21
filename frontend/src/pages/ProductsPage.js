import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Search, Filter, Store } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import ProductCardAmazon from '../components/ProductCardAmazon';
import { useCustomization } from '../contexts/CustomizationContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const categories = [
  { id: '', name: 'Todas' }, { id: 'eletronicos', name: 'Eletronicos' },
  { id: 'roupas', name: 'Roupas' }, { id: 'cosmeticos', name: 'Cosmeticos' },
  { id: 'casa', name: 'Casa e Decoracao' }, { id: 'acessorios', name: 'Acessorios' },
  { id: 'esportes', name: 'Esportes' }, { id: 'arte', name: 'Arte' },
  { id: 'imoveis', name: 'Imoveis' }, { id: 'automoveis', name: 'Automoveis' }
];

export default function ProductsPage() {
  const { custom } = useCustomization();
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
    <div className="min-h-screen bg-[#EAEDED] py-6" data-testid="products-page">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4 border border-[#D5D9D9]">
          <h1 className="text-xl font-bold text-[#0F1111] mb-3">Resultados</h1>
          <div className="flex flex-col md:flex-row gap-3">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888]" />
                <input placeholder="Buscar produtos..." value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-white border border-[#D5D9D9] text-[#0F1111] text-sm focus:outline-none focus:border-[#E77600] focus:shadow-[0_0_0_3px_rgba(228,121,17,0.5)] placeholder:text-[#888]"
                  data-testid="products-search-input" />
              </div>
              <button type="submit" className="px-5 py-2 bg-gradient-to-b from-[#F7DFA5] to-[#F0C14B] hover:from-[#F0C14B] hover:to-[#E7A82E] text-[#0F1111] text-sm font-medium rounded-lg border border-[#A88734] shadow-sm"
                data-testid="products-search-btn">Buscar</button>
            </form>
            <Select value={category} onValueChange={v => { setCategory(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-full md:w-48 bg-white border-[#D5D9D9] text-[#0F1111]" data-testid="category-filter">
                <Filter className="w-4 h-4 mr-2 text-[#888]" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#D5D9D9]">
                <SelectItem value="all">Todas Categorias</SelectItem>
                {categories.filter(c => c.id).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {(category === 'imoveis' || category === 'automoveis') && (
              <input placeholder="Filtrar por cidade..." value={city} onChange={e => { setCity(e.target.value); setPage(1); }}
                className="w-full md:w-48 px-3 py-2 rounded-lg bg-white border border-[#D5D9D9] text-[#0F1111] text-sm placeholder:text-[#888]"
                data-testid="city-filter" />
            )}
          </div>
        </div>

        <p className="text-sm text-[#565959] mb-3">{total} resultado(s)</p>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-4 border-[#F0C14B] border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg border border-[#D5D9D9]">
            <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-[#565959] text-lg">Nenhum produto encontrado</p>
            <p className="text-sm text-[#888] mt-2">Torne-se vendedor para adicionar produtos!</p>
          </div>
        ) : (
          <>
            <div className="marketplace-grid" style={{ '--products-per-row': custom.products_per_row || 4 }}>
              {products.map(p => <ProductCardAmazon key={p.product_id} product={p} />)}
            </div>
            {pages > 1 && (
              <div className="flex justify-center gap-1 mt-6">
                {page > 1 && <button onClick={() => setPage(page-1)} className="px-3 py-1.5 text-sm border border-[#D5D9D9] rounded bg-white text-[#0F1111] hover:bg-[#F7F7F7]">Anterior</button>}
                {Array.from({ length: Math.min(pages, 7) }, (_, i) => (
                  <button key={i+1} onClick={() => setPage(i+1)}
                    className={`px-3 py-1.5 text-sm border rounded ${page === i+1 ? 'border-[#E77600] bg-[#EDFDFF] text-[#C7511F] font-bold' : 'border-[#D5D9D9] bg-white text-[#0F1111] hover:bg-[#F7F7F7]'}`}
                    data-testid={`page-${i+1}`}>{i+1}</button>
                ))}
                {page < pages && <button onClick={() => setPage(page+1)} className="px-3 py-1.5 text-sm border border-[#D5D9D9] rounded bg-white text-[#0F1111] hover:bg-[#F7F7F7]">Proximo</button>}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
