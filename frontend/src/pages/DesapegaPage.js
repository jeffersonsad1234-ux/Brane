import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Tag, MapPin, Star, Search } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const conditionLabels = { new: 'Novo', like_new: 'Seminovo', good: 'Bom Estado', fair: 'Usado' };
const conditionColors = { new: 'bg-green-100 text-green-700', like_new: 'bg-blue-100 text-blue-700', good: 'bg-yellow-100 text-yellow-700', fair: 'bg-orange-100 text-orange-700' };

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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filtered.map(p => {
              const img = p.images?.[0];
              const imgUrl = img ? (img.startsWith('http') ? img : `${API}/files/${img}`) : null;
              const priceWhole = Math.floor(p.price || 0);
              const priceCents = Math.round(((p.price || 0) - priceWhole) * 100).toString().padStart(2, '0');
              return (
                <Link to={`/products/${p.product_id}`} key={p.product_id} className="group block bg-white rounded-lg border border-[#E0E0E0] hover:shadow-lg transition-all overflow-hidden">
                  <div className="aspect-[4/3] bg-white relative overflow-hidden flex items-center justify-center p-3">
                    {imgUrl ? <img src={imgUrl} alt={p.title} className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform" /> : <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">📦</div>}
                    <div className="absolute top-2 left-2 flex gap-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold text-white ${p.product_type === 'unique' ? 'bg-purple-600' : 'bg-orange-500'}`}>
                        {p.product_type === 'unique' ? 'UNICO' : 'USADO'}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${conditionColors[p.condition] || 'bg-gray-100 text-gray-600'}`}>
                        {conditionLabels[p.condition] || 'Usado'}
                      </span>
                    </div>
                  </div>
                  <div className="px-3 pb-3 pt-1">
                    <h3 className="text-[13px] text-[#0F1111] leading-tight line-clamp-2 mb-1 group-hover:text-[#C7511F]">{p.title}</h3>
                    <p className="text-[10px] text-[#565959] mb-1">{p.seller_name}</p>
                    {p.city && <p className="text-[10px] text-[#565959] flex items-center gap-1 mb-1"><MapPin className="w-3 h-3" />{p.city}</p>}
                    <div>
                      <span className="text-[11px] text-[#565959]">R$ </span>
                      <span className="text-[22px] font-bold text-[#0F1111] leading-none">{priceWhole}</span>
                      <span className="text-[12px] text-[#0F1111] align-super font-bold">,{priceCents}</span>
                    </div>
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
