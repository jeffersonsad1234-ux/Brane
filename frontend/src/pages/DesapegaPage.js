import { useState, useEffect } from 'react';
import axios from 'axios';
import { Tag, Search } from 'lucide-react';
import Product3DCard from '../components/Product3DCard';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function DesapegaPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios
      .get(API + '/desapega')
      .then((res) => {
        setProducts(res.data.products || []);
      })
      .catch(() => {
        setProducts([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const filtered = products.filter((product) => {
    const title = product.title || '';
    const description = product.description || '';

    return (
      !search ||
      title.toLowerCase().includes(search.toLowerCase()) ||
      description.toLowerCase().includes(search.toLowerCase())
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center carbon-bg">
        <div className="w-8 h-8 border-4 border-[#D4A24C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen carbon-bg py-8" data-testid="desapega-page">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/30 mb-4">
            <Tag className="w-4 h-4 text-orange-400" />
            <span className="text-orange-400 font-medium text-sm">Desapega BRANE</span>
          </div>

          <h1 className="text-3xl font-bold text-white font-['Outfit'] mb-2">
            Produtos Unicos & Seminovos
          </h1>

          <p className="text-[#A6A8B3]">
            Encontre produtos unicos, de segunda mao e ofertas especiais
          </p>
        </div>

        <div className="relative max-w-lg mx-auto mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6F7280]" />

          <input
            type="text"
            placeholder="Buscar no Desapega..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0B0D12] border border-[#1E2230] text-white placeholder:text-[#6F7280] focus:outline-none focus:border-orange-500"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 dark-card rounded-xl">
            <Tag className="w-12 h-12 text-[#6F7280] mx-auto mb-3" />
            <p className="text-[#A6A8B3] text-lg">Nenhum produto no Desapega ainda</p>
            <p className="text-[#A6A8B3] text-sm mt-1">
              Seja o primeiro a vender algo unico!
            </p>
          </div>
        ) : (
          <div className="theme-product-grid">
            {filtered.map((product, index) => (
              <Product3DCard
                key={product.product_id}
                product={{
                  ...product,
                  images: product.images && product.images.length > 0
                    ? product.images
                    : product.image
                      ? [product.image]
                      : []
                }}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
