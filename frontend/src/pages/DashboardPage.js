import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Plus,
  Trash2,
  Package,
  Image,
  Store,
  FileCheck,
  AlertTriangle
} from 'lucide-react';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../components/ui/select';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '../components/ui/dialog';

import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const categories = [
  { id: 'eletronicos', name: 'Eletronicos' },
  { id: 'roupas', name: 'Roupas' },
  { id: 'cosmeticos', name: 'Cosmeticos' },
  { id: 'casa', name: 'Casa e Decoracao' },
  { id: 'acessorios', name: 'Acessorios' },
  { id: 'esportes', name: 'Esportes' },
  { id: 'arte', name: 'Arte' },
  { id: 'imoveis', name: 'Imoveis' },
  { id: 'automoveis', name: 'Automoveis' }
];

function getImageUrl(img) {
  if (!img) return null;

  if (img.startsWith('http') || img.startsWith('data:image')) {
    return img;
  }

  return API + '/files/' + img;
}

function SellerTermsModal({ open, onAccept, onClose }) {
  const [accepted, setAccepted] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-[#0B0D12] border-[#1E2230]">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-[#D4A24C]" />
            Termos do Vendedor
          </DialogTitle>

          <DialogDescription className="text-[#A6A8B3]">
            Leia e aceite os termos antes de criar seu primeiro anúncio
          </DialogDescription>
        </DialogHeader>

        <div className="bg-[#11131A] rounded-xl p-4 border border-[#1E2230] max-h-[300px] overflow-y-auto">
          <h4 className="text-[#D4A24C] font-semibold mb-3">
            Política de Saldo Retido
          </h4>

          <div className="space-y-3 text-sm text-[#E6E6EA]">
            <p>
              Após cada venda realizada, o saldo ficará visível porém retido
              até confirmação da entrega.
            </p>

            <p>
              A liberação ocorre após aprovação administrativa da entrega.
            </p>

            <p>
              Isso protege comprador e vendedor durante toda a transação.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
          />

          <label className="text-sm text-white">
            Li e aceito os termos
          </label>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancelar
          </Button>

          <Button
            onClick={onAccept}
            disabled={!accepted}
            className="flex-1 gold-btn"
          >
            Aceitar e Continuar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SellerDashboard({ token }) {
  const [products, setProducts] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [hasProducts, setHasProducts] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    city: '',
    location: '',
    images: [],
    product_type: 'store',
    condition: 'new'
  });

  const headers = {
    Authorization: 'Bearer ' + token
  };

  const fetchProducts = async () => {
    try {
     const res = await axios.get(
  API + '/products/seller/mine',
  { headers }
);

console.log('MEUS PRODUTOS:', res.data);

const list = res.data.products || res.data || [];

const cleanProducts = list.filter((p) => {
        if (!p) return false;
    
      
        return true;
      });

      setProducts(cleanProducts);
    } catch {
      setProducts([]);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (pid) => {
    if (!window.confirm('Remover este produto?')) return;

    try {
      await axios.delete(
        API + '/products/' + pid,
        { headers }
      );

      toast.success('Produto removido');

      setProducts((prev) =>
        prev.filter((p) => p.product_id !== pid)
      );

      fetchProducts();
    } catch {
      toast.error('Erro ao remover');
    }
  };
const handleAddClick = () => {
    if (!hasProducts && !termsAccepted) {
      setShowTerms(true);
    } else {
      setShowAdd(true);
    }
  };

  const handleTermsAccept = async () => {
    try {
      await axios.post(API + '/seller/accept-terms', {}, { headers });
      setTermsAccepted(true);
      setShowTerms(false);
      setShowAdd(true);
      toast.success('Termos aceitos!');
    } catch {
      toast.error('Erro ao aceitar termos');
    }
  };

  return (
    <div>
      <h2 className="text-white text-xl font-bold mb-4">Meus Produtos</h2>
      <Button
  onClick={() => window.location.href = '/add-product'}
  className="gold-btn mb-4"
>
        <Plus className="w-4 h-4" /> Adicionar Produto
      </Button>

      {products.map((p) => (
  <div
    key={p.product_id}
    className="dark-card p-4 mb-4 rounded-xl border border-[#1E2230]"
  >
    <div className="flex gap-4 items-start">
      
      <img
        src={getImageUrl(p.image || p.images?.[0]) || 'https://via.placeholder.com/120'}
        alt={p.title}
        className="w-28 h-28 rounded-lg object-cover"
      />

      <div className="flex-1">
        <h3 className="text-white font-bold text-lg">
          {p.title}
        </h3>

        <p className="text-[#D4A24C] font-semibold text-base mt-1">
          R$ {p.price}
        </p>

        <p className="text-gray-400 text-sm mt-2">
          {p.category} • {p.city}
        </p>

        <p className="text-gray-500 text-sm mt-2 line-clamp-2">
          {p.description}
        </p>
      </div>

      <button
        onClick={() => handleDelete(p.product_id)}
        aria-label="Remover"
        className="mt-1"
      >
        <Trash2 className="w-5 h-5 text-red-400" />
      </button>

    </div>
  </div>
))}
    </div>
  );
}

export default function DashboardPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <div className="min-h-screen carbon-bg py-8">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-white mb-6">Painel</h1>

        {user.role === 'seller' && <SellerDashboard token={token} />}

        {user.role === 'admin' && (
          <Button onClick={() => navigate('/admin')} className="gold-btn">
            Painel Admin
          </Button>
        )}
      </div>
    </div>
  );
}
