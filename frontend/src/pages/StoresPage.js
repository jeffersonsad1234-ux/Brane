import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Store, Search, PlusCircle, AlertTriangle } from 'lucide-react';
import { Input } from '../components/ui/input';
import StoreCard from '../components/StoreCard';
import { useAuth } from '../contexts/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function StoresPage() {
  const { user } = useAuth();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    axios.get(`${API}/stores?limit=50`, { timeout: 10000 })
      .then(res => { if (!cancelled) setStores(Array.isArray(res.data?.stores) ? res.data.stores : []); })
      .catch(err => { if (!cancelled) setError(err.message || 'Erro ao carregar lojas'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filteredStores = (stores || []).filter(s => 
    s && s.name && (!search || s.name.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#050608] to-[#0D0510]">
        {/* Skeleton loading */}
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center mb-10">
            <div className="inline-flex mx-auto mb-4 w-32 h-6 rounded-full bg-[#D4A24C]/10 animate-pulse" />
            <div className="w-64 h-10 mx-auto mb-3 rounded-lg bg-gray-800 animate-pulse" />
            <div className="w-80 h-4 mx-auto rounded bg-gray-800 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-[#0E0F14] rounded-2xl overflow-hidden animate-pulse">
                <div className="h-32 bg-gray-800" />
                <div className="pt-12 px-6 pb-4">
                  <div className="w-20 h-20 rounded-full bg-gray-800 mx-auto -mt-16 mb-4" />
                  <div className="w-40 h-5 bg-gray-800 mx-auto mb-2 rounded" />
                  <div className="w-60 h-4 bg-gray-800 mx-auto mb-4 rounded" />
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="aspect-square bg-gray-800 rounded-lg" />
                    <div className="aspect-square bg-gray-800 rounded-lg" />
                    <div className="aspect-square bg-gray-800 rounded-lg" />
                    <div className="aspect-square bg-gray-800 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#050608] to-[#0D0510] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertTriangle className="w-16 h-16 text-[#D4A24C] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Erro ao carregar</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-[#D4A24C] to-[#B38B36] text-white font-semibold rounded-lg hover:from-[#E8C372] hover:to-[#D4A24C] transition-all"
          >Tentar novamente</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050608] to-[#0D0510] py-12" data-testid="stores-page">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#D4A24C]/10 to-[#6D28D9]/10 border border-[#D4A24C]/20 mb-4">
            <Store className="w-4 h-4 text-[#D4A24C]" />
            <span className="text-sm text-[#D4A24C] font-medium">Lojas Verificadas</span>
          </div>
          <h1 className="text-4xl font-bold font-['Outfit'] mb-3">
            <span className="bg-gradient-to-r from-[#E8C372] via-[#D4A24C] to-[#B38B36] bg-clip-text text-transparent">
              Descubra Lojas Incríveis
            </span>
          </h1>
          <p className="text-gray-400 max-w-lg mx-auto mb-6">
            Explore lojas verificadas, conheça produtos exclusivos e converse diretamente com os vendedores.
          </p>

          {/* Botão Criar Loja - apenas para sellers */}
          {user && user.role === 'seller' && (
            <Link
              to="/stores/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#D4A24C] to-[#B38B36] text-white font-semibold rounded-lg hover:from-[#E8C372] hover:to-[#D4A24C] transition-all"
            >
              <PlusCircle className="w-5 h-5" />
              Criar Minha Loja
            </Link>
          )}
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input 
              placeholder="Buscar lojas..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-[#0E0F14] border-gray-700 text-white"
            />
          </div>
        </div>

        {/* Empty State */}
        {filteredStores.length === 0 && (
          <div className="text-center py-20">
            <Store className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">
              {search ? 'Nenhuma loja encontrada' : 'Nenhuma loja disponível ainda'}
            </p>
          </div>
        )}

        {/* Grid de Lojas - Estilo Instagram */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStores.map(store => (
            <StoreCard key={store.store_id} store={store} />
          ))}
        </div>

        {/* Info Box */}
        {user && user.role === 'seller' && (
          <div className="mt-12 max-w-3xl mx-auto p-6 bg-gradient-to-br from-[#0E0F14] to-[#1A1C26] rounded-2xl border border-[#D4A24C]/20">
            <h3 className="text-lg font-semibold text-white mb-3">💡 Quer aparecer aqui?</h3>
            <p className="text-gray-400 mb-4">
              Crie sua loja e comece a vender na BRANE! Sua loja aparecerá nesta seção após aprovação do admin.
            </p>
            <ul className="text-sm text-gray-500 space-y-1 mb-4">
              <li>✅ Cadastro gratuito de loja</li>
              <li>✅ Chat direto com compradores</li>
              <li>✅ Feed de produtos estilo Instagram</li>
              <li>✅ Planos PRO e PREMIUM disponíveis</li>
            </ul>
            <Link
              to="/stores/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4A24C] text-white font-medium rounded-lg hover:bg-[#E8C372] transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              Criar Minha Loja Agora
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
