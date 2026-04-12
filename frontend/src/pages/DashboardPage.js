import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Trash2, Package, Image, Store, FileCheck, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../components/ui/dialog';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const categories = [
  { id: 'eletronicos', name: 'Eletronicos' }, { id: 'roupas', name: 'Roupas' },
  { id: 'cosmeticos', name: 'Cosmeticos' }, { id: 'casa', name: 'Casa e Decoracao' },
  { id: 'acessorios', name: 'Acessorios' }, { id: 'esportes', name: 'Esportes' },
  { id: 'arte', name: 'Arte' }, { id: 'imoveis', name: 'Imoveis' },
  { id: 'automoveis', name: 'Automoveis' }
];

function SellerTermsModal({ open, onAccept, onClose }) {
  const [accepted, setAccepted] = useState(false);
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-[#1A1A1A] border-[#2A2A2A]">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-[#B38B36]" />
            Termos do Vendedor
          </DialogTitle>
          <DialogDescription className="text-[#888]">
            Leia e aceite os termos antes de criar seu primeiro anúncio
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-[#111] rounded-xl p-4 border border-[#2A2A2A] max-h-[300px] overflow-y-auto">
          <h4 className="text-[#B38B36] font-semibold mb-3">Política de Saldo Retido</h4>
          <div className="space-y-3 text-sm text-[#CCC]">
            <p>
              <strong className="text-white">1. Saldo Retido:</strong> Após cada venda realizada na plataforma BRANE, 
              o valor correspondente à sua comissão ficará <span className="text-[#B38B36]">visível mas retido</span> em sua carteira.
            </p>
            <p>
              <strong className="text-white">2. Liberação do Saldo:</strong> O saldo será liberado para saque somente após 
              a <span className="text-[#B38B36]">confirmação de entrega</span> do produto pelo administrador da plataforma.
            </p>
            <p>
              <strong className="text-white">3. Proteção ao Comprador:</strong> Esta política existe para garantir a 
              segurança das transações e proteger os compradores da plataforma.
            </p>
            <p>
              <strong className="text-white">4. Prazos:</strong> A liberação do saldo geralmente ocorre em até 7 dias 
              úteis após a confirmação de entrega pelo administrador.
            </p>
            <p>
              <strong className="text-white">5. Disputas:</strong> Em caso de disputas ou problemas com a entrega, 
              o saldo permanecerá retido até a resolução pelo suporte.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-[#B38B36]/10 rounded-lg border border-[#B38B36]/30">
          <AlertTriangle className="w-5 h-5 text-[#B38B36] shrink-0 mt-0.5" />
          <p className="text-sm text-[#CCC]">
            Ao aceitar estes termos, você concorda com a política de saldo retido da plataforma BRANE.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input 
            type="checkbox" 
            id="accept-terms" 
            checked={accepted} 
            onChange={e => setAccepted(e.target.checked)}
            className="w-4 h-4 rounded border-[#B38B36] text-[#B38B36] focus:ring-[#B38B36]"
          />
          <label htmlFor="accept-terms" className="text-sm text-[#CCC]">
            Li e aceito os termos do vendedor
          </label>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 border-[#2A2A2A] text-[#888]">
            Cancelar
          </Button>
          <Button 
            onClick={onAccept} 
            disabled={!accepted} 
            className="flex-1 gold-btn rounded-lg"
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
  const [form, setForm] = useState({ title: '', description: '', price: '', category: '', city: '', location: '', images: [] });
  const [uploading, setUploading] = useState(false);
  const headers = { Authorization: `Bearer ${token}` };

  const fetchProducts = async () => {
    try { const res = await axios.get(`${API}/products/seller/mine`, { headers, withCredentials: true }); setProducts(res.data.products); } catch {}
  };
  
  const checkTermsStatus = async () => {
    try {
      const [termsRes, productsRes] = await Promise.all([
        axios.get(`${API}/seller/terms-status`, { headers, withCredentials: true }),
        axios.get(`${API}/seller/has-products`, { headers, withCredentials: true })
      ]);
      setTermsAccepted(termsRes.data.accepted);
      setHasProducts(productsRes.data.has_products);
    } catch {}
  };

  useEffect(() => { fetchProducts(); checkTermsStatus(); }, []);

  const handleAddClick = () => {
    // If no products and terms not accepted, show terms first
    if (!hasProducts && !termsAccepted) {
      setShowTerms(true);
    } else {
      setShowAdd(true);
    }
  };

  const handleTermsAccept = async () => {
    try {
      await axios.post(`${API}/seller/accept-terms`, {}, { headers, withCredentials: true });
      setTermsAccepted(true);
      setShowTerms(false);
      setShowAdd(true);
      toast.success('Termos aceitos! Agora você pode criar seu primeiro produto.');
    } catch {
      toast.error('Erro ao aceitar termos');
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await axios.post(`${API}/upload`, fd, { headers, withCredentials: true });
      setForm(prev => ({ ...prev, images: [...prev.images, res.data.path] }));
      toast.success('Imagem enviada!');
    } catch { toast.error('Erro ao enviar imagem'); }
    finally { setUploading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/products`, { ...form, price: parseFloat(form.price) }, { headers, withCredentials: true });
      toast.success('Produto criado!');
      setShowAdd(false);
      setForm({ title: '', description: '', price: '', category: '', city: '', location: '', images: [] });
      fetchProducts();
      setHasProducts(true);
    } catch (err) { toast.error(err.response?.data?.detail || 'Erro ao criar produto'); }
  };

  const handleDelete = async (pid) => {
    try { await axios.delete(`${API}/products/${pid}`, { headers, withCredentials: true }); toast.success('Produto removido'); fetchProducts(); }
    catch { toast.error('Erro ao remover'); }
  };

  const needsCity = form.category === 'imoveis' || form.category === 'automoveis';

  return (
    <div data-testid="seller-dashboard">
      <SellerTermsModal 
        open={showTerms} 
        onAccept={handleTermsAccept} 
        onClose={() => setShowTerms(false)} 
      />
      
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold font-['Outfit'] text-white">Meus Produtos</h2>
        <Button className="gold-btn rounded-lg gap-2" onClick={handleAddClick} data-testid="add-product-btn">
          <Plus className="w-4 h-4" /> Adicionar Produto
        </Button>
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-[#1A1A1A] border-[#2A2A2A]">
          <DialogHeader><DialogTitle className="text-white">Novo Produto</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label className="text-[#CCC]">Titulo</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required className="bg-[#111] border-[#2A2A2A] text-white" data-testid="product-title-input" /></div>
            <div><Label className="text-[#CCC]">Descricao</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} required className="bg-[#111] border-[#2A2A2A] text-white" data-testid="product-description-input" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-[#CCC]">Preco (R$)</Label><Input type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required className="bg-[#111] border-[#2A2A2A] text-white" data-testid="product-price-input" /></div>
              <div><Label className="text-[#CCC]">Categoria</Label>
                <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                  <SelectTrigger className="bg-[#111] border-[#2A2A2A] text-white" data-testid="product-category-select"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent className="bg-[#1A1A1A] border-[#2A2A2A]">{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            {needsCity && (
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-[#CCC]">Cidade *</Label><Input value={form.city} onChange={e => setForm({...form, city: e.target.value})} required className="bg-[#111] border-[#2A2A2A] text-white" data-testid="product-city-input" /></div>
                <div><Label className="text-[#CCC]">Localizacao</Label><Input value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="bg-[#111] border-[#2A2A2A] text-white" data-testid="product-location-input" /></div>
              </div>
            )}
            {!needsCity && <div><Label className="text-[#CCC]">Cidade (opcional)</Label><Input value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="bg-[#111] border-[#2A2A2A] text-white" data-testid="product-city-input" /></div>}
            <div>
              <Label className="text-[#CCC]">Imagens</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {form.images.map((img, i) => (
                  <div key={i} className="w-16 h-16 rounded-lg border border-[#2A2A2A] overflow-hidden bg-[#111] relative">
                    <img src={img.startsWith('http') ? img : `${API}/files/${img}`} alt="" className="w-full h-full object-cover" />
                    <button type="button" className="absolute top-0 right-0 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-bl"
                      onClick={() => setForm(prev => ({...prev, images: prev.images.filter((_, j) => j !== i)}))}>x</button>
                  </div>
                ))}
                <label className="w-16 h-16 rounded-lg border-2 border-dashed border-[#444] flex items-center justify-center cursor-pointer hover:border-[#B38B36]">
                  {uploading ? <div className="w-4 h-4 border-2 border-[#B38B36] border-t-transparent rounded-full animate-spin" /> : <Image className="w-5 h-5 text-[#666]" />}
                  <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} data-testid="product-image-upload" />
                </label>
              </div>
            </div>
            <Button type="submit" className="w-full gold-btn rounded-lg" data-testid="submit-product-btn">Criar Produto</Button>
          </form>
        </DialogContent>
      </Dialog>

      {products.length === 0 ? (
        <div className="text-center py-12 dark-card rounded-xl">
          <Package className="w-12 h-12 text-[#444] mx-auto mb-3" />
          <p className="text-[#888]">Nenhum produto cadastrado</p>
          <p className="text-sm text-[#555]">Clique em "Adicionar Produto" para comecar</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {products.map(p => (
            <div key={p.product_id} className="dark-card rounded-xl p-4 flex items-center gap-4" data-testid={`seller-product-${p.product_id}`}>
              <div className="w-16 h-16 rounded-lg bg-[#111] overflow-hidden shrink-0">
                {p.images?.[0] ? <img src={p.images[0].startsWith('http') ? p.images[0] : `${API}/files/${p.images[0]}`} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[#444]"><Store className="w-6 h-6" /></div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-white truncate">{p.title}</p>
                <p className="text-sm text-[#B38B36] font-bold">R$ {p.price?.toFixed(2)}</p>
                <p className="text-xs text-[#888]">{p.category} {p.city ? `- ${p.city}` : ''}</p>
              </div>
              <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300" onClick={() => handleDelete(p.product_id)} data-testid={`delete-product-${p.product_id}`}><Trash2 className="w-4 h-4" /></Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BuyerDashboard({ token }) {
  const [orders, setOrders] = useState([]);
  useEffect(() => {
    axios.get(`${API}/orders`, { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }).then(res => setOrders(res.data.orders)).catch(() => {});
  }, [token]);
  return (
    <div data-testid="buyer-dashboard">
      <h2 className="text-xl font-bold font-['Outfit'] text-white mb-6">Meus Pedidos</h2>
      {orders.length === 0 ? (
        <div className="text-center py-12 dark-card rounded-xl"><Package className="w-12 h-12 text-[#444] mx-auto mb-3" /><p className="text-[#888]">Nenhum pedido realizado</p></div>
      ) : (
        <div className="space-y-3">
          {orders.map(o => (
            <div key={o.order_id} className="dark-card rounded-xl p-4" data-testid={`order-${o.order_id}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">#{o.order_id?.slice(0, 16)}</span>
                <span className={`status-badge status-${o.status}`}>{o.status}</span>
              </div>
              <p className="text-lg font-bold text-[#B38B36]">R$ {o.total?.toFixed(2)}</p>
              <p className="text-xs text-[#888]">{new Date(o.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AffiliateDashboard({ token }) {
  const [data, setData] = useState({ links: [], transactions: [], total_earnings: 0 });
  useEffect(() => {
    axios.get(`${API}/affiliates/earnings`, { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }).then(res => setData(res.data)).catch(() => {});
  }, [token]);
  return (
    <div data-testid="affiliate-dashboard">
      <h2 className="text-xl font-bold font-['Outfit'] text-white mb-6">Painel do Afiliado</h2>
      <div className="dark-card rounded-xl p-6 mb-6">
        <p className="text-sm text-[#888]">Total de Ganhos</p>
        <p className="text-3xl font-bold text-[#B38B36]">R$ {data.total_earnings?.toFixed(2)}</p>
      </div>
      <h3 className="font-bold mb-3 text-white">Meus Links ({data.links.length})</h3>
      {data.links.length === 0 ? (
        <p className="text-sm text-[#888]">Visite produtos e gere links de afiliado!</p>
      ) : (
        <div className="space-y-2">
          {data.links.map(l => (
            <div key={l.link_id} className="dark-card rounded-lg p-3 flex items-center justify-between">
              <div><code className="text-xs text-[#B38B36]">{l.code}</code><p className="text-xs text-[#888]">{l.conversions} conversoes</p></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;
  const roleTitles = { buyer: 'Comprador', seller: 'Vendedor', affiliate: 'Afiliado', admin: 'Administrador' };

  return (
    <div className="min-h-screen carbon-bg py-8" data-testid="dashboard-page">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold font-['Outfit'] text-white">Painel</h1>
            <p className="text-sm text-[#888]">{user.name} - {roleTitles[user.role]}</p>
          </div>
          {user.role === 'admin' && <Button className="gold-btn rounded-lg" onClick={() => navigate('/admin')} data-testid="go-admin-btn">Painel Admin</Button>}
        </div>
        {user.role === 'seller' && <SellerDashboard token={token} />}
        {user.role === 'buyer' && <BuyerDashboard token={token} />}
        {user.role === 'affiliate' && <AffiliateDashboard token={token} />}
        {user.role === 'admin' && <BuyerDashboard token={token} />}
      </div>
    </div>
  );
}
