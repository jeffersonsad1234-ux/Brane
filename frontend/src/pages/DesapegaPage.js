import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Tag, MapPin, Star, Search } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const conditionLabels = { new: 'Novo', like_new: 'Seminovo', good: 'Bom Estado', fair: 'Usado' };
const conditionColors = { new: 'bg-green-500/20 text-green-400', like_new: 'bg-blue-500/20 text-blue-400', good: 'bg-yellow-500/20 text-yellow-400', fair: 'bg-orange-500/20 text-orange-400' };

export default function DesapegaPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios.get(`${API}/desapega`).then(r => setProducts(r.data.products)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = products.filter(p => !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="min-h-screen flex items-center justify-center carbon-bg"><div className="w-8 h-8 border-4 border-[#B38B36] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen carbon-bg py-8" data-testid="desapega-page">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/30 mb-4">
            <Tag className="w-4 h-4 text-orange-400" />
            <span className="text-orange-400 font-medium text-sm">Desapega BRANE</span>
          </div>
          <h1 className="text-3xl font-bold text-white font-['Outfit'] mb-2">Produtos Unicos & Seminovos</h1>
          <p className="text-[#888]">Encontre produtos unicos, de segunda mao e ofertas especiais</p>
        </div>

        <div className="relative max-w-lg mx-auto mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
          <input type="text" placeholder="Buscar no Desapega..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] text-white placeholder:text-[#555] focus:outline-none focus:border-orange-500" />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 dark-card rounded-xl">
            <Tag className="w-12 h-12 text-[#333] mx-auto mb-3" />
            <p className="text-[#888] text-lg">Nenhum produto no Desapega ainda</p>
            <p className="text-[#666] text-sm mt-1">Seja o primeiro a vender algo unico!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map(p => {
              const img = p.images?.[0];
              const imgUrl = img ? (img.startsWith('http') ? img : `${API}/files/${img}`) : null;
              return (
                <Link to={`/products/${p.product_id}`} key={p.product_id} className="dark-card rounded-xl overflow-hidden hover:border-orange-500/50 border border-[#2A2A2A] transition-all hover:-translate-y-1">
                  <div className="aspect-square bg-[#111] relative">
                    {imgUrl ? <img src={imgUrl} alt={p.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[#333] text-4xl">📦</div>}
                    <div className="absolute top-2 left-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${conditionColors[p.condition] || conditionColors.good}`}>
                        {conditionLabels[p.condition] || 'Usado'}
                      </span>
                    </div>
                    {p.product_type === 'unique' && <div className="absolute top-2 right-2"><span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-medium">Unico</span></div>}
                  </div>
                  <div className="p-3">
                    <h3 className="text-white text-sm font-medium truncate">{p.title}</h3>
                    <p className="text-[#888] text-xs truncate mt-0.5">{p.seller_name}</p>
                    {p.city && <p className="text-[#666] text-xs flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" />{p.city}</p>}
                    <p className="text-[#B38B36] font-bold mt-2">R$ {p.price?.toFixed(2)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
