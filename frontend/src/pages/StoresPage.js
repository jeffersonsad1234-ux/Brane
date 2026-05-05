import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Store, Search, PlusCircle } from 'lucide-react';
import { Input } from '../components/ui/input';
import StoreCard from '../components/StoreCard';
import { useAuth } from '../contexts/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function StoresPage() {
  const { user } = useAuth();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios.get(`${API}/stores?limit=50`)
      .then(res => setStores(res.data.stores))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredStores = stores.filter(s => 
    !search || s.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E1016] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#D4A24C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1C202B] py-12 text-white" data-testid="stores-page">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D4A24C]/10 border border-[#D4A24C]/20 mb-4">
            <Store className="w-4 h-4 text-[#B98228]" />
            <span className="text-sm text-[#B98228] font-medium">Lojas Verificadas</span>
          </div>
          <h1 className="text-4xl font-black font-['Outfit'] mb-3 text-white">
            Descubra Lojas Incríveis
          </h1>
          <p className="text-[#A6A8B3] max-w-lg mx-auto mb-6">
            Explore lojas verificadas, conheça produtos exclusivos e converse diretamente com os vendedores.
          </p>

          {/* Botão Criar Loja - apenas para sellers */}
          {user && user.role === 'seller' && (
            <Link
              to="/stores/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#111318] text-white font-semibold rounded-[14px] hover:bg-[#252832] transition-all"
            >
              <PlusCircle className="w-5 h-5" />
              Criar Minha Loja
            </Link>
          )}
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8C8F9A]" />
            <Input 
              placeholder="Buscar lojas..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-[#1C202B] border-[#1E2230] text-white"
            />
          </div>
        </div>

        {/* Empty State */}
        {filteredStores.length === 0 && (
          <div className="text-center py-20">
            <Store className="w-16 h-16 text-[#B7A88D] mx-auto mb-4" />
            <p className="text-[#6F6659] text-lg">
              {search ? 'Nenhuma loja encontrada' : 'Nenhuma loja disponível ainda'}
            </p>
          </div>
        )}

        {/* Grid de Lojas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStores.map(store => (
            <StoreCard key={store.store_id} store={store} />
          ))}
        </div>

        {/* Info Box */}
        {user && user.role === 'seller' && (
          <div className="mt-12 max-w-3xl mx-auto p-6 bg-[#1C202B] rounded-[20px] border border-[#1E2230] shadow-[0_10px_22px_rgba(0,0,0,0.4)]">
            <h3 className="text-lg font-semibold text-white mb-3">💡 Quer aparecer aqui?</h3>
            <p className="text-[#A6A8B3] mb-4">
              Crie sua loja e comece a vender na BRANE! Sua loja aparecerá nesta seção após aprovação do admin.
            </p>
            <ul className="text-sm text-[#8A6326] space-y-1 mb-4">
              <li>✅ Cadastro gratuito de loja</li>
              <li>✅ Chat direto com compradores</li>
              <li>✅ Feed de produtos estilo Instagram</li>
              <li>✅ Planos PRO e PREMIUM disponíveis</li>
            </ul>
            <Link
              to="/stores/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#111318] text-white font-medium rounded-[12px] hover:bg-[#252832] transition-all"
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
