import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';
import { BarChart3, Users, ShoppingBag, CreditCard, Settings, MessageSquare, FileText, DollarSign, Check, X, Ban, Truck, Store, Megaphone, Crown, Zap, Image, Link as LinkIcon, Eye, MousePointer, Palette, Package, Trash2, Edit, Plus, Save, Wallet, UnlockKeyhole, UserCog, Bell, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function DashboardTab({ token }) {
  const [data, setData] = useState(null);
  useEffect(() => { axios.get(`${API}/admin/dashboard`, { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }).then(r => setData(r.data)).catch(() => {}); }, []);
  if (!data) return <div className="py-8 text-center text-[#888]">Carregando...</div>;
  const stats = [
    { label: 'Usuarios', value: data.total_users, icon: Users, color: '#3B82F6' },
    { label: 'Produtos', value: data.total_products, icon: ShoppingBag, color: '#10B981' },
    { label: 'Pedidos', value: data.total_orders, icon: BarChart3, color: '#B38B36' },
    { label: 'Vendas', value: `R$ ${data.total_sales?.toFixed(2)}`, icon: DollarSign, color: '#8B5CF6' },
    { label: 'Comissoes', value: `R$ ${data.total_commissions?.toFixed(2)}`, icon: CreditCard, color: '#F59E0B' },
    { label: 'Pedidos Pend.', value: data.pending_orders, icon: ShoppingBag, color: '#EF4444' },
    { label: 'Saques Pend.', value: data.pending_withdrawals, icon: CreditCard, color: '#EC4899' },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-testid="admin-dashboard-tab">
      {stats.map((s, i) => { const Icon = s.icon; return (
        <div key={i} className="dark-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2"><Icon className="w-5 h-5" style={{ color: s.color }} /><span className="text-sm text-[#888]">{s.label}</span></div>
          <p className="text-xl font-bold text-white">{s.value}</p>
        </div>
      ); })}
    </div>
  );
}

function OrdersTab({ token }) {
  const [orders, setOrders] = useState([]);
  const h = { Authorization: `Bearer ${token}` };
  const f = () => axios.get(`${API}/admin/orders`, { headers: h, withCredentials: true }).then(r => setOrders(r.data.orders)).catch(() => {});
  useEffect(() => { f(); }, []);
  const approve = async (id) => { await axios.put(`${API}/admin/orders/${id}/approve`, {}, { headers: h, withCredentials: true }); toast.success('Pagamento confirmado!'); f(); };
  const reject = async (id) => { await axios.put(`${API}/admin/orders/${id}/reject`, {}, { headers: h, withCredentials: true }); toast.success('Pedido rejeitado'); f(); };
  const ship = async (id) => { await axios.put(`${API}/admin/orders/${id}/ship`, {}, { headers: h, withCredentials: true }); toast.success('Pedido enviado!'); f(); };
  const deliver = async (id) => { await axios.put(`${API}/admin/orders/${id}/deliver`, {}, { headers: h, withCredentials: true }); toast.success('Pedido entregue!'); f(); };

  const statusLabels = {
    'awaiting_payment': 'Aguardando Pagamento', 'pending': 'Pendente', 'approved': 'Aprovado',
    'shipped': 'Enviado', 'delivered': 'Entregue', 'rejected': 'Rejeitado'
  };
  const statusColors = {
    'awaiting_payment': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'pending': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'approved': 'bg-green-500/20 text-green-400 border-green-500/30',
    'shipped': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'delivered': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'rejected': 'bg-red-500/20 text-red-400 border-red-500/30'
  };
  const methodLabels = { pix: 'PIX', ted: 'Transferencia Bancaria', paypal: 'PayPal' };

  return (
    <div className="space-y-3" data-testid="admin-orders-tab">
      {orders.length === 0 ? <p className="text-[#888] text-center py-8">Nenhum pedido</p> : orders.map(o => (
        <div key={o.order_id} className="dark-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">#{o.order_id?.slice(0, 16)}</span>
            <span className={`text-xs px-3 py-1 rounded-full border ${statusColors[o.status] || 'bg-[#333] text-[#888] border-[#444]'}`}>
              {statusLabels[o.status] || o.status}
            </span>
          </div>
          <p className="text-sm text-[#888]">Comprador: {o.buyer_name}</p>
          <p className="text-lg font-bold text-[#B38B36]">R$ {o.total?.toFixed(2)}</p>
          <div className="flex items-center gap-2 mt-1">
            {o.payment_method && <span className="text-xs px-2 py-0.5 rounded bg-[#1A1A1A] text-[#B38B36] border border-[#B38B36]/30">{methodLabels[o.payment_method] || o.payment_method}</span>}
            <span className="text-xs text-[#666]">{new Date(o.created_at).toLocaleDateString('pt-BR')}</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {(o.status === 'pending' || o.status === 'awaiting_payment') && (
              <>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white rounded-lg" onClick={() => approve(o.order_id)}><Check className="w-4 h-4 mr-1" /> Confirmar Pagamento</Button>
                <Button size="sm" variant="destructive" className="rounded-lg" onClick={() => reject(o.order_id)}><X className="w-4 h-4 mr-1" /> Rejeitar</Button>
              </>
            )}
            {o.status === 'approved' && (
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg" onClick={() => ship(o.order_id)}>
                <Truck className="w-4 h-4 mr-1" /> Marcar como Enviado
              </Button>
            )}
            {o.status === 'shipped' && (
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg" onClick={() => deliver(o.order_id)}>
                <Check className="w-4 h-4 mr-1" /> Marcar como Entregue
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function UsersTab({ token }) {
  const [users, setUsers] = useState([]);
  const h = { Authorization: `Bearer ${token}` };
  const f = () => axios.get(`${API}/admin/users`, { headers: h, withCredentials: true }).then(r => setUsers(r.data.users)).catch(() => {});
  useEffect(() => { f(); }, []);
  const toggleBlock = async (uid) => { await axios.put(`${API}/admin/users/${uid}/block`, {}, { headers: h, withCredentials: true }); toast.success('Status alterado'); f(); };
  const roleLabels = { buyer: 'Comprador', seller: 'Vendedor', affiliate: 'Afiliado', admin: 'Admin' };
  return (
    <div className="space-y-3" data-testid="admin-users-tab">
      {users.map(u => (
        <div key={u.user_id} className="dark-card rounded-xl p-4 flex items-center justify-between">
          <div><p className="font-medium text-sm text-white">{u.name}</p><p className="text-xs text-[#888]">{u.email} - {roleLabels[u.role] || u.role}</p></div>
          <div className="flex items-center gap-2">
            {u.is_blocked && <span className="text-xs text-red-400 font-medium">Bloqueado</span>}
            {u.role !== 'admin' && <Button size="sm" variant={u.is_blocked ? "default" : "destructive"} className="rounded-lg" onClick={() => toggleBlock(u.user_id)} data-testid={`block-user-${u.user_id}`}><Ban className="w-4 h-4 mr-1" /> {u.is_blocked ? 'Desbloquear' : 'Bloquear'}</Button>}
          </div>
        </div>
      ))}
    </div>
  );
}

function WithdrawalsTab({ token }) {
  const [wds, setWds] = useState([]);
  const h = { Authorization: `Bearer ${token}` };
  const f = () => axios.get(`${API}/admin/withdrawals`, { headers: h, withCredentials: true }).then(r => setWds(r.data.withdrawals)).catch(() => {});
  useEffect(() => { f(); }, []);
  const approve = async (id) => { await axios.put(`${API}/admin/withdrawals/${id}/approve`, {}, { headers: h, withCredentials: true }); toast.success('Saque aprovado'); f(); };
  const reject = async (id) => { await axios.put(`${API}/admin/withdrawals/${id}/reject`, {}, { headers: h, withCredentials: true }); toast.success('Saque rejeitado'); f(); };
  return (
    <div className="space-y-3" data-testid="admin-withdrawals-tab">
      {wds.length === 0 ? <p className="text-[#888] text-center py-8">Nenhum saque</p> : wds.map(w => (
        <div key={w.withdrawal_id} className="dark-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-2"><span className="font-medium text-sm text-white">{w.user_name}</span><span className={`status-badge status-${w.status}`}>{w.status}</span></div>
          <p className="text-lg font-bold text-[#B38B36]">R$ {w.amount?.toFixed(2)}</p>
          <p className="text-xs text-[#888]">Metodo: {w.method?.toUpperCase()}</p>
          {w.status === 'pending' && (
            <div className="flex gap-2 mt-2">
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white rounded-lg" onClick={() => approve(w.withdrawal_id)} data-testid={`approve-wd-${w.withdrawal_id}`}><Check className="w-4 h-4 mr-1" /> Aprovar</Button>
              <Button size="sm" variant="destructive" className="rounded-lg" onClick={() => reject(w.withdrawal_id)} data-testid={`reject-wd-${w.withdrawal_id}`}><X className="w-4 h-4 mr-1" /> Rejeitar</Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function CommissionsTab({ token }) {
  const [data, setData] = useState({ platform_commission: 0.09, affiliate_commission: 0.065 });
  const h = { Authorization: `Bearer ${token}` };
  useEffect(() => { axios.get(`${API}/admin/commissions`, { headers: h, withCredentials: true }).then(r => setData(r.data)).catch(() => {}); }, []);
  const save = async () => { await axios.put(`${API}/admin/commissions`, data, { headers: h, withCredentials: true }); toast.success('Comissoes atualizadas'); };
  return (
    <div className="dark-card rounded-xl p-6 max-w-md" data-testid="admin-commissions-tab">
      <h3 className="font-bold mb-4 font-['Outfit'] text-white">Taxas de Comissao</h3>
      <div className="space-y-4">
        <div><Label className="text-[#CCC]">Comissao da Plataforma (%)</Label><Input type="number" step="0.01" value={(data.platform_commission * 100).toFixed(1)} onChange={e => setData({...data, platform_commission: parseFloat(e.target.value) / 100})} className="bg-[#111] border-[#2A2A2A] text-white" data-testid="platform-commission-input" /></div>
        <div><Label className="text-[#CCC]">Comissao do Afiliado (%)</Label><Input type="number" step="0.01" value={(data.affiliate_commission * 100).toFixed(1)} onChange={e => setData({...data, affiliate_commission: parseFloat(e.target.value) / 100})} className="bg-[#111] border-[#2A2A2A] text-white" data-testid="affiliate-commission-input" /></div>
        <Button className="gold-btn rounded-lg" onClick={save} data-testid="save-commissions-btn">Salvar</Button>
      </div>
    </div>
  );
}

function SupportTab({ token }) {
  const [msgs, setMsgs] = useState([]);
  const [reply, setReply] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const h = { Authorization: `Bearer ${token}` };
  const f = () => axios.get(`${API}/admin/support`, { headers: h, withCredentials: true }).then(r => setMsgs(r.data.messages)).catch(() => {});
  useEffect(() => { f(); }, []);
  const sendReply = async (msgId) => { await axios.post(`${API}/admin/support/${msgId}/reply`, { reply }, { headers: h, withCredentials: true }); toast.success('Resposta enviada'); setReply(''); setReplyTo(null); f(); };
  return (
    <div className="space-y-3" data-testid="admin-support-tab">
      {msgs.length === 0 ? <p className="text-[#888] text-center py-8">Nenhuma mensagem</p> : msgs.map(m => (
        <div key={m.message_id} className="dark-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-2"><span className="font-medium text-sm text-white">{m.user_name} ({m.user_email})</span><span className={`status-badge status-${m.status}`}>{m.status}</span></div>
          <p className="font-medium text-sm text-[#CCC] mb-1">{m.subject}</p>
          <p className="text-sm text-[#888] mb-2">{m.message}</p>
          {m.replies?.map((r, i) => (<div key={i} className="bg-[#111] rounded-lg p-3 mb-2 ml-4"><p className="text-xs text-[#B38B36] font-medium">{r.admin_name}</p><p className="text-sm text-[#CCC]">{r.reply}</p></div>))}
          {replyTo === m.message_id ? (
            <div className="flex gap-2 mt-2">
              <Textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="Sua resposta..." className="flex-1 bg-[#111] border-[#2A2A2A] text-white" data-testid={`reply-input-${m.message_id}`} />
              <Button size="sm" className="gold-btn rounded-lg" onClick={() => sendReply(m.message_id)} data-testid={`send-reply-${m.message_id}`}>Enviar</Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" className="mt-2 border-[#2A2A2A] text-[#CCC]" onClick={() => setReplyTo(m.message_id)} data-testid={`reply-btn-${m.message_id}`}>Responder</Button>
          )}
        </div>
      ))}
    </div>
  );
}

function PagesTab({ token }) {
  const [slug, setSlug] = useState('about');
  const [content, setContent] = useState('');
  const h = { Authorization: `Bearer ${token}` };
  const pages = ['about', 'faq', 'contato', 'termos', 'privacidade'];
  useEffect(() => { axios.get(`${API}/admin/pages/${slug}`, { headers: h, withCredentials: true }).then(r => setContent(r.data.content || '')).catch(() => {}); }, [slug]);
  const save = async () => { await axios.put(`${API}/admin/pages/${slug}`, { content }, { headers: h, withCredentials: true }); toast.success('Pagina atualizada'); };
  return (
    <div className="dark-card rounded-xl p-6" data-testid="admin-pages-tab">
      <div className="flex gap-2 mb-4 flex-wrap">
        {pages.map(p => (<Button key={p} size="sm" variant={slug === p ? "default" : "outline"} className={slug === p ? "gold-btn" : "border-[#2A2A2A] text-[#CCC]"} onClick={() => setSlug(p)} data-testid={`page-btn-${p}`}>{p.charAt(0).toUpperCase() + p.slice(1)}</Button>))}
      </div>
      <Textarea value={content} onChange={e => setContent(e.target.value)} rows={10} className="mb-4 bg-[#111] border-[#2A2A2A] text-white" placeholder="Conteudo da pagina..." data-testid="page-content-input" />
      <Button className="gold-btn rounded-lg" onClick={save} data-testid="save-page-btn">Salvar Pagina</Button>
    </div>
  );
}

function FinancialSettingsTab({ token }) {
  const [data, setData] = useState({
    paypal_email: '', paypal_enabled: false,
    bank_name: '', bank_branch: '', bank_account_name: '', bank_account_number: '', ted_enabled: true,
    pix_key: '', pix_key_type: 'cpf', pix_enabled: true
  });
  const [saving, setSaving] = useState(false);
  const h = { Authorization: `Bearer ${token}` };
  useEffect(() => { axios.get(`${API}/admin/financial-settings`, { headers: h, withCredentials: true }).then(r => setData(prev => ({...prev, ...r.data}))).catch(() => {}); }, []);
  const save = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/admin/financial-settings`, data, { headers: h, withCredentials: true });
      toast.success('Configuracoes salvas!');
    } catch { toast.error('Erro ao salvar'); }
    finally { setSaving(false); }
  };

  const PIX_TYPES = [
    { value: 'cpf', label: 'CPF/CNPJ' },
    { value: 'email', label: 'E-mail' },
    { value: 'phone', label: 'Telefone' },
    { value: 'random', label: 'Chave Aleatoria' }
  ];

  return (
    <div className="max-w-2xl space-y-6" data-testid="admin-financial-tab">
      {/* PIX Section */}
      <div className="dark-card rounded-xl p-6 border border-[#2A2A2A]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="font-bold text-white font-['Outfit']">PIX</h3>
              <p className="text-xs text-[#888]">Pagamento instantaneo</p>
            </div>
          </div>
          <Switch checked={data.pix_enabled} onCheckedChange={v => setData({...data, pix_enabled: v})} data-testid="pix-switch" />
        </div>
        {data.pix_enabled && (
          <div className="space-y-4 pt-4 border-t border-[#2A2A2A]">
            <div>
              <Label className="text-[#CCC]">Tipo da Chave PIX</Label>
              <select
                value={data.pix_key_type || 'cpf'}
                onChange={e => setData({...data, pix_key_type: e.target.value})}
                className="w-full h-10 px-3 mt-1 rounded-md bg-[#111] border border-[#2A2A2A] text-white"
              >
                {PIX_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-[#CCC]">Chave PIX</Label>
              <Input
                value={data.pix_key}
                onChange={e => setData({...data, pix_key: e.target.value})}
                className="bg-[#111] border-[#2A2A2A] text-white mt-1"
                placeholder={data.pix_key_type === 'cpf' ? '000.000.000-00' : data.pix_key_type === 'email' ? 'seu@email.com' : data.pix_key_type === 'phone' ? '(00) 00000-0000' : 'Chave aleatoria'}
                data-testid="pix-key-input"
              />
            </div>
          </div>
        )}
      </div>

      {/* Bank Transfer Section */}
      <div className="dark-card rounded-xl p-6 border border-[#2A2A2A]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-white font-['Outfit']">Transferencia Bancaria</h3>
              <p className="text-xs text-[#888]">TED / DOC</p>
            </div>
          </div>
          <Switch checked={data.ted_enabled} onCheckedChange={v => setData({...data, ted_enabled: v})} data-testid="ted-switch" />
        </div>
        {data.ted_enabled && (
          <div className="space-y-4 pt-4 border-t border-[#2A2A2A]">
            <div>
              <Label className="text-[#CCC]">Nome do Banco</Label>
              <Input value={data.bank_name} onChange={e => setData({...data, bank_name: e.target.value})} className="bg-[#111] border-[#2A2A2A] text-white mt-1" placeholder="Ex: Nubank, Bradesco, Itau..." data-testid="bank-name-input" />
            </div>
            <div>
              <Label className="text-[#CCC]">Titular da Conta</Label>
              <Input value={data.bank_account_name} onChange={e => setData({...data, bank_account_name: e.target.value})} className="bg-[#111] border-[#2A2A2A] text-white mt-1" placeholder="Nome completo do titular" data-testid="bank-account-name-input" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#CCC]">Agencia</Label>
                <Input value={data.bank_branch} onChange={e => setData({...data, bank_branch: e.target.value})} className="bg-[#111] border-[#2A2A2A] text-white mt-1" placeholder="0001" data-testid="bank-branch-input" />
              </div>
              <div>
                <Label className="text-[#CCC]">Numero da Conta</Label>
                <Input value={data.bank_account_number} onChange={e => setData({...data, bank_account_number: e.target.value})} className="bg-[#111] border-[#2A2A2A] text-white mt-1" placeholder="00000-0" data-testid="bank-account-number-input" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PayPal Section */}
      <div className="dark-card rounded-xl p-6 border border-[#2A2A2A]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#0070BA]/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-[#0070BA]" />
            </div>
            <div>
              <h3 className="font-bold text-white font-['Outfit']">PayPal</h3>
              <p className="text-xs text-[#888]">Pagamento internacional</p>
            </div>
          </div>
          <Switch checked={data.paypal_enabled} onCheckedChange={v => setData({...data, paypal_enabled: v})} data-testid="paypal-switch" />
        </div>
        {data.paypal_enabled && (
          <div className="space-y-4 pt-4 border-t border-[#2A2A2A]">
            <div>
              <Label className="text-[#CCC]">Email do PayPal</Label>
              <Input value={data.paypal_email} onChange={e => setData({...data, paypal_email: e.target.value})} className="bg-[#111] border-[#2A2A2A] text-white mt-1" placeholder="seu@email.com" data-testid="paypal-email-input" />
            </div>
          </div>
        )}
      </div>

      <Button className="gold-btn rounded-lg w-full py-5 text-base" onClick={save} disabled={saving} data-testid="save-financial-btn">
        {saving ? 'Salvando...' : 'Salvar Configuracoes de Pagamento'}
      </Button>
    </div>
  );
}

function ShippingTab({ token }) {
  const [options, setOptions] = useState([]);
  const h = { Authorization: `Bearer ${token}` };
  
  useEffect(() => { 
    axios.get(`${API}/admin/shipping-settings`, { headers: h, withCredentials: true })
      .then(r => setOptions(r.data.options || []))
      .catch(() => setOptions([
        { name: 'Gratis', price: 0, days: '7-15 dias uteis', enabled: true },
        { name: 'Normal', price: 15.90, days: '5-8 dias uteis', enabled: true },
        { name: 'Expresso', price: 29.90, days: '2-3 dias uteis', enabled: true }
      ])); 
  }, []);

  const updateOption = (index, field, value) => {
    const newOptions = [...options];
    newOptions[index][field] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    setOptions([...options, { name: '', price: 0, days: '', enabled: true }]);
  };

  const removeOption = (index) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const save = async () => { 
    await axios.put(`${API}/admin/shipping-settings`, { options }, { headers: h, withCredentials: true }); 
    toast.success('Opcoes de frete atualizadas'); 
  };

  return (
    <div className="dark-card rounded-xl p-6" data-testid="admin-shipping-tab">
      <h3 className="font-bold mb-4 font-['Outfit'] text-white">Opcoes de Frete</h3>
      <p className="text-sm text-[#888] mb-4">Configure as opcoes de frete disponiveis para os compradores.</p>
      
      <div className="space-y-4 mb-6">
        {options.map((opt, i) => (
          <div key={i} className="bg-[#111] rounded-xl p-4 border border-[#2A2A2A]">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <Label className="text-[#888] text-xs">Nome</Label>
                <Input 
                  value={opt.name} 
                  onChange={e => updateOption(i, 'name', e.target.value)} 
                  placeholder="Ex: Expresso"
                  className="bg-[#1A1A1A] border-[#2A2A2A] text-white"
                />
              </div>
              <div>
                <Label className="text-[#888] text-xs">Preco (R$)</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  value={opt.price} 
                  onChange={e => updateOption(i, 'price', parseFloat(e.target.value) || 0)} 
                  className="bg-[#1A1A1A] border-[#2A2A2A] text-white"
                />
              </div>
              <div>
                <Label className="text-[#888] text-xs">Prazo</Label>
                <Input 
                  value={opt.days} 
                  onChange={e => updateOption(i, 'days', e.target.value)} 
                  placeholder="Ex: 3-5 dias"
                  className="bg-[#1A1A1A] border-[#2A2A2A] text-white"
                />
              </div>
              <div className="flex items-end gap-2">
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={opt.enabled} 
                    onCheckedChange={v => updateOption(i, 'enabled', v)} 
                  />
                  <span className="text-xs text-[#888]">{opt.enabled ? 'Ativo' : 'Inativo'}</span>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-red-400 hover:text-red-300"
                  onClick={() => removeOption(i)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex gap-3">
        <Button variant="outline" className="border-[#2A2A2A] text-[#CCC]" onClick={addOption}>
          + Adicionar Opcao
        </Button>
        <Button className="gold-btn rounded-lg" onClick={save} data-testid="save-shipping-btn">
          Salvar Frete
        </Button>
      </div>
    </div>
  );
}

// ==================== STORES TAB ====================
function StoresTab({ token }) {
  const [stores, setStores] = useState([]);
  const h = { Authorization: `Bearer ${token}` };
  
  const fetchStores = () => {
    axios.get(`${API}/admin/stores`, { headers: h, withCredentials: true })
      .then(r => setStores(r.data.stores))
      .catch(() => {});
  };
  useEffect(() => { fetchStores(); }, [fetchStores])

  const toggleApproval = async (storeId, approved) => {
    try {
      await axios.put(`${API}/admin/stores/${storeId}/approve`, { approved }, { headers: h, withCredentials: true });
      toast.success(approved ? 'Loja aprovada!' : 'Aprovação removida');
      fetchStores();
    } catch { toast.error('Erro ao atualizar loja'); }
  };

  const changePlan = async (storeId, plan) => {
    try {
      await axios.put(`${API}/admin/stores/${storeId}/plan`, { plan }, { headers: h, withCredentials: true });
      toast.success(`Plano alterado para ${plan.toUpperCase()}`);
      fetchStores();
    } catch { toast.error('Erro ao alterar plano'); }
  };

  const PLAN_COLORS = {
    free: 'text-[#666]',
    pro: 'text-blue-400',
    premium: 'text-[#B38B36]'
  };

  return (
    <div data-testid="admin-stores-tab">
      <h3 className="font-bold mb-4 font-['Outfit'] text-white flex items-center gap-2">
        <Store className="w-5 h-5 text-[#B38B36]" /> Gerenciar Lojas
      </h3>
      <p className="text-sm text-[#888] mb-4">
        Aprove lojas PRO/PREMIUM para aparecerem na seção "Lojas" da plataforma.
      </p>
      
      {stores.length === 0 ? (
        <div className="text-center py-12 dark-card rounded-xl">
          <Store className="w-12 h-12 text-[#333] mx-auto mb-3" />
          <p className="text-[#888]">Nenhuma loja cadastrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {stores.map(store => (
            <div key={store.store_id} className="dark-card rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#111] border border-[#2A2A2A] overflow-hidden flex items-center justify-center">
                    {store.logo ? (
                      <img src={store.logo.startsWith('http') ? store.logo : `${API}/files/${store.logo}`} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Store className="w-5 h-5 text-[#555]" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-white">{store.name}</p>
                      <span className={`text-xs font-bold ${PLAN_COLORS[store.plan]}`}>
                        {store.plan.toUpperCase()}
                      </span>
                      {store.is_approved && (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                          Aprovada
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#888]">
                      {store.owner_name} • {store.products_count || 0} produtos • Comissão: {(store.plan_commission * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Select value={store.plan} onValueChange={v => changePlan(store.store_id, v)}>
                    <SelectTrigger className="w-[110px] bg-[#111] border-[#2A2A2A] text-white text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1A] border-[#2A2A2A]">
                      <SelectItem value="free">Grátis (9%)</SelectItem>
                      <SelectItem value="pro">PRO (2%)</SelectItem>
                      <SelectItem value="premium">PREMIUM (1%)</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {store.plan !== 'free' && (
                    <Button
                      size="sm"
                      variant={store.is_approved ? "outline" : "default"}
                      className={store.is_approved ? "border-red-500/50 text-red-400 hover:bg-red-500/10" : "gold-btn"}
                      onClick={() => toggleApproval(store.store_id, !store.is_approved)}
                    >
                      {store.is_approved ? 'Remover' : 'Aprovar'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== ADS TAB ====================
function AdsTab({ token }) {
  const [ads, setAds] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', image: '', link: '', position: 'between_products' });
  const [uploading, setUploading] = useState(false);
  const h = { Authorization: `Bearer ${token}` };
  
  const fetchAds = () => {
    axios.get(`${API}/admin/ads`, { headers: h, withCredentials: true })
      .then(r => setAds(r.data.ads))
      .catch(() => {});
  };
  
  useEffect(() => { fetchAds(); }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await axios.post(`${API}/upload`, fd, { headers: h, withCredentials: true });
      setForm({ ...form, image: res.data.path });
      toast.success('Imagem enviada!');
    } catch { toast.error('Erro ao enviar imagem'); }
    finally { setUploading(false); }
  };

  const createAd = async () => {
    if (!form.title || !form.image || !form.link) {
      toast.error('Preencha todos os campos');
      return;
    }
    try {
      await axios.post(`${API}/ads`, form, { headers: h, withCredentials: true });
      toast.success('Anúncio criado!');
      setShowCreate(false);
      setForm({ title: '', image: '', link: '', position: 'between_products' });
      fetchAds();
    } catch (err) { toast.error(err.response?.data?.detail || 'Erro ao criar anúncio'); }
  };

  const toggleAd = async (adId, active) => {
    try {
      await axios.put(`${API}/admin/ads/${adId}`, { active }, { headers: h, withCredentials: true });
      toast.success(active ? 'Anúncio ativado' : 'Anúncio desativado');
      fetchAds();
    } catch { toast.error('Erro ao atualizar anúncio'); }
  };

  const deleteAd = async (adId) => {
    try {
      await axios.delete(`${API}/admin/ads/${adId}`, { headers: h, withCredentials: true });
      toast.success('Anúncio removido');
      fetchAds();
    } catch { toast.error('Erro ao remover anúncio'); }
  };

  const POSITION_LABELS = {
    top: 'Topo',
    between_products: 'Entre Produtos',
    sidebar: 'Lateral'
  };

  return (
    <div data-testid="admin-ads-tab">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold font-['Outfit'] text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-[#B38B36]" /> Gerenciar Anúncios
          </h3>
          <p className="text-sm text-[#888]">Crie e gerencie anúncios dentro da plataforma.</p>
        </div>
        <Button className="gold-btn rounded-lg" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Cancelar' : '+ Criar Anúncio'}
        </Button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="dark-card rounded-xl p-6 mb-6 animate-fadeIn">
          <h4 className="font-semibold text-white mb-4">Novo Anúncio</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-[#CCC]">Título</Label>
              <Input
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="Ex: Super Promoção"
                className="bg-[#111] border-[#2A2A2A] text-white"
              />
            </div>
            <div>
              <Label className="text-[#CCC]">Link de Destino</Label>
              <Input
                value={form.link}
                onChange={e => setForm({ ...form, link: e.target.value })}
                placeholder="https://..."
                className="bg-[#111] border-[#2A2A2A] text-white"
              />
            </div>
            <div>
              <Label className="text-[#CCC]">Posição</Label>
              <Select value={form.position} onValueChange={v => setForm({ ...form, position: v })}>
                <SelectTrigger className="bg-[#111] border-[#2A2A2A] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-[#2A2A2A]">
                  <SelectItem value="top">Topo da Página</SelectItem>
                  <SelectItem value="between_products">Entre Produtos</SelectItem>
                  <SelectItem value="sidebar">Barra Lateral</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[#CCC]">Imagem do Banner</Label>
              <div className="flex items-center gap-2 mt-1">
                {form.image && (
                  <div className="w-20 h-12 rounded bg-[#111] overflow-hidden">
                    <img src={form.image.startsWith('http') ? form.image : `${API}/files/${form.image}`} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <label className="flex-1">
                  <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-dashed border-[#2A2A2A] hover:border-[#B38B36] cursor-pointer transition-colors">
                    {uploading ? (
                      <div className="w-4 h-4 border-2 border-[#B38B36] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Image className="w-4 h-4 text-[#666]" />
                    )}
                    <span className="text-sm text-[#888]">Enviar imagem</span>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
                </label>
              </div>
            </div>
          </div>
          <Button className="gold-btn rounded-lg mt-4" onClick={createAd}>
            Criar Anúncio
          </Button>
        </div>
      )}

      {/* Ads List */}
      {ads.length === 0 ? (
        <div className="text-center py-12 dark-card rounded-xl">
          <Megaphone className="w-12 h-12 text-[#333] mx-auto mb-3" />
          <p className="text-[#888]">Nenhum anúncio criado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ads.map(ad => (
            <div key={ad.ad_id} className="dark-card rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-24 h-14 rounded-lg bg-[#111] overflow-hidden">
                    {ad.image ? (
                      <img src={ad.image.startsWith('http') ? ad.image : `${API}/files/${ad.image}`} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image className="w-6 h-6 text-[#555]" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-white">{ad.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${ad.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {ad.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <p className="text-xs text-[#888] flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1">
                        <LinkIcon className="w-3 h-3" /> {ad.link?.slice(0, 30)}...
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {ad.views || 0} views
                      </span>
                      <span className="flex items-center gap-1">
                        <MousePointer className="w-3 h-3" /> {ad.clicks || 0} clicks
                      </span>
                    </p>
                    <p className="text-xs text-[#666] mt-1">
                      Posição: {POSITION_LABELS[ad.position] || ad.position}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className={ad.active ? "border-red-500/50 text-red-400" : "border-green-500/50 text-green-400"}
                    onClick={() => toggleAd(ad.ad_id, !ad.active)}
                  >
                    {ad.active ? 'Desativar' : 'Ativar'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-400 hover:text-red-300"
                    onClick={() => deleteAd(ad.ad_id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== THEME CUSTOMIZATION TAB ====================
function ThemeTab({ token }) {
  const { refreshTheme } = useTheme();
  const [t, setT] = useState({});
  const [saving, setSaving] = useState(false);
  const h = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    axios.get(`${API}/admin/theme`, { headers: h, withCredentials: true }).then(r => setT(r.data)).catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/admin/theme`, t, { headers: h, withCredentials: true });
      refreshTheme();
      toast.success('Tema atualizado!');
    } catch { toast.error('Erro ao salvar'); }
    finally { setSaving(false); }
  };

  const ColorInput = ({ label, field }) => (
    <div className="flex items-center gap-3">
      <input type="color" value={t[field] || '#000000'} onChange={e => setT({...t, [field]: e.target.value})} className="w-10 h-10 rounded cursor-pointer border border-[#2A2A2A]" />
      <div className="flex-1">
        <Label className="text-[#CCC] text-xs">{label}</Label>
        <Input value={t[field] || ''} onChange={e => setT({...t, [field]: e.target.value})} className="bg-[#111] border-[#2A2A2A] text-white h-8 text-xs mt-0.5" />
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl space-y-6" data-testid="admin-theme-tab">
      {/* Platform Info */}
      <div className="dark-card rounded-xl p-6 border border-[#2A2A2A]">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Palette className="w-5 h-5 text-[#B38B36]" /> Informacoes da Plataforma</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label className="text-[#CCC]">Nome da Plataforma</Label><Input value={t.platform_name || ''} onChange={e => setT({...t, platform_name: e.target.value})} className="bg-[#111] border-[#2A2A2A] text-white mt-1" /></div>
          <div><Label className="text-[#CCC]">Slogan</Label><Input value={t.platform_slogan || ''} onChange={e => setT({...t, platform_slogan: e.target.value})} className="bg-[#111] border-[#2A2A2A] text-white mt-1" /></div>
        </div>
      </div>

      {/* Main Colors */}
      <div className="dark-card rounded-xl p-6 border border-[#2A2A2A]">
        <h3 className="font-bold text-white mb-4">Cores Principais</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <ColorInput label="Cor Primaria (botoes, destaques)" field="primary_color" />
          <ColorInput label="Cor de Fundo da Navbar" field="navbar_bg" />
          <ColorInput label="Cor do Texto da Navbar" field="navbar_text" />
          <ColorInput label="Cor de Fundo da Pagina" field="page_bg" />
        </div>
      </div>

      {/* Product Card Colors */}
      <div className="dark-card rounded-xl p-6 border border-[#2A2A2A]">
        <h3 className="font-bold text-white mb-4">Cores dos Produtos</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <ColorInput label="Cor do Preco" field="price_color" />
          <ColorInput label="Cor dos Centavos" field="price_cents_color" />
          <ColorInput label="Cor das Estrelas" field="star_color" />
          <ColorInput label="Cor Frete Gratis" field="free_shipping_color" />
          <ColorInput label="Fundo do Card" field="card_bg" />
          <ColorInput label="Borda do Card" field="card_border" />
        </div>
      </div>

      {/* Button Colors */}
      <div className="dark-card rounded-xl p-6 border border-[#2A2A2A]">
        <h3 className="font-bold text-white mb-4">Cores dos Botoes</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <ColorInput label="Botao Adicionar Carrinho" field="button_color" />
          <ColorInput label="Texto do Botao" field="button_text_color" />
          <ColorInput label="Botao Comprar Agora" field="buy_now_color" />
        </div>
      </div>

      {/* Display Options */}
      <div className="dark-card rounded-xl p-6 border border-[#2A2A2A]">
        <h3 className="font-bold text-white mb-4">Opcoes de Exibicao</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-[#CCC]">Mostrar Estrelas nos Produtos</Label>
            <Switch checked={t.show_stars !== false} onCheckedChange={v => setT({...t, show_stars: v})} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-[#CCC]">Mostrar "Frete Gratis"</Label>
            <Switch checked={t.show_free_shipping !== false} onCheckedChange={v => setT({...t, show_free_shipping: v})} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-[#CCC]">Mostrar Parcelamento</Label>
            <Switch checked={t.show_installments !== false} onCheckedChange={v => setT({...t, show_installments: v})} />
          </div>
          {t.show_installments !== false && (
            <div className="flex items-center gap-3">
              <Label className="text-[#CCC]">Parcelas:</Label>
              <select value={t.installment_count || 12} onChange={e => setT({...t, installment_count: Number(e.target.value)})}
                className="h-8 px-3 rounded bg-[#111] border border-[#2A2A2A] text-white text-sm">
                {[3,6,10,12].map(n => <option key={n} value={n}>{n}x</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Preview */}
      <div className="dark-card rounded-xl p-6 border border-[#2A2A2A]">
        <h3 className="font-bold text-white mb-4">Pre-visualizacao</h3>
        <div className="p-4 rounded-lg" style={{ backgroundColor: t.page_bg || '#EAEDED' }}>
          <div className="max-w-[200px] rounded-lg border overflow-hidden" style={{ backgroundColor: t.card_bg || '#FFF', borderColor: t.card_border || '#E0E0E0' }}>
            <div className="aspect-[4/3] bg-gray-50 flex items-center justify-center"><Package className="w-8 h-8 text-gray-300" /></div>
            <div className="p-3">
              <p className="text-sm font-medium" style={{ color: t.price_color || '#0F1111' }}>Produto Exemplo</p>
              {t.show_stars !== false && (
                <div className="flex gap-0.5 my-1">{[1,2,3,4,5].map(i => <span key={i} className="text-sm" style={{ color: i <= 4 ? (t.star_color || '#FFA41C') : '#ddd' }}>★</span>)}</div>
              )}
              <div>
                <span className="text-xs" style={{ color: '#565959' }}>R$ </span>
                <span className="text-xl font-bold" style={{ color: t.price_color || '#0F1111' }}>99</span>
                <span className="text-xs align-super font-bold" style={{ color: t.price_cents_color || '#0F1111' }}>,90</span>
              </div>
              {t.show_free_shipping !== false && <p className="text-xs mt-1">Frete <span className="font-bold" style={{ color: t.free_shipping_color || '#067D62' }}>GRATIS</span></p>}
              <button className="w-full mt-2 py-1.5 rounded-full text-xs font-medium border" style={{ backgroundColor: t.button_color || '#F0C14B', color: t.button_text_color || '#0F1111', borderColor: t.button_color || '#A88734' }}>Adicionar ao Carrinho</button>
            </div>
          </div>
        </div>
      </div>

      <Button className="gold-btn rounded-lg w-full py-5 text-base" onClick={save} disabled={saving}>
        <Save className="w-5 h-5 mr-2" /> {saving ? 'Salvando...' : 'Salvar Personalizacao'}
      </Button>
    </div>
  );
}

// ==================== ADMIN PRODUCTS MANAGEMENT TAB ====================
function AdminProductsTab({ token }) {
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', price: '', category: '', product_type: 'store', condition: 'new', images: [] });
  const [showAdd, setShowAdd] = useState(false);
  const [uploading, setUploading] = useState(false);
  const h = { Authorization: `Bearer ${token}` };

  const f = () => axios.get(`${API}/admin/products`, { headers: h, withCredentials: true }).then(r => setProducts(r.data.products)).catch(() => {});
  useEffect(() => { f(); }, []);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await axios.post(`${API}/upload`, fd, { headers: { ...h, 'Content-Type': 'multipart/form-data' }, withCredentials: true });
      setForm(prev => ({ ...prev, images: [...prev.images, res.data.path] }));
      toast.success('Imagem enviada');
    } catch { toast.error('Erro no upload'); }
    finally { setUploading(false); }
  };

  const saveProduct = async () => {
    const data = { ...form, price: parseFloat(form.price) || 0 };
    try {
      if (editing) {
        await axios.put(`${API}/admin/products/${editing}`, data, { headers: h, withCredentials: true });
        toast.success('Produto atualizado!');
      } else {
        await axios.post(`${API}/admin/products`, data, { headers: h, withCredentials: true });
        toast.success('Produto criado!');
      }
      setEditing(null); setShowAdd(false);
      setForm({ title: '', description: '', price: '', category: '', product_type: 'store', condition: 'new', images: [] });
      f();
    } catch { toast.error('Erro ao salvar'); }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Remover este produto?')) return;
    try {
      await axios.delete(`${API}/admin/products/${id}`, { headers: h, withCredentials: true });
      toast.success('Produto removido!'); f();
    } catch { toast.error('Erro ao remover'); }
  };

  const startEdit = (p) => {
    setEditing(p.product_id);
    setForm({ title: p.title, description: p.description, price: String(p.price), category: p.category, product_type: p.product_type || 'store', condition: p.condition || 'new', images: p.images || [] });
    setShowAdd(true);
  };

  const categories = ['eletronicos','roupas','cosmeticos','casa','acessorios','esportes','arte','imoveis','automoveis'];

  return (
    <div data-testid="admin-products-tab">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white text-lg">{products.length} Produtos</h3>
        <Button className="gold-btn rounded-lg" onClick={() => { setEditing(null); setForm({ title: '', description: '', price: '', category: '', product_type: 'store', condition: 'new', images: [] }); setShowAdd(!showAdd); }}>
          <Plus className="w-4 h-4 mr-1" /> {showAdd ? 'Cancelar' : 'Adicionar Produto'}
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showAdd && (
        <div className="dark-card rounded-xl p-6 mb-4 border border-[#B38B36]/30">
          <h4 className="font-bold text-white mb-4">{editing ? 'Editar Produto' : 'Novo Produto'}</h4>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2"><Label className="text-[#CCC]">Titulo</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="bg-[#111] border-[#2A2A2A] text-white mt-1" /></div>
            <div className="sm:col-span-2"><Label className="text-[#CCC]">Descricao</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="bg-[#111] border-[#2A2A2A] text-white mt-1" rows={3} /></div>
            <div><Label className="text-[#CCC]">Preco (R$)</Label><Input type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="bg-[#111] border-[#2A2A2A] text-white mt-1" /></div>
            <div><Label className="text-[#CCC]">Categoria</Label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full h-10 px-3 mt-1 rounded-md bg-[#111] border border-[#2A2A2A] text-white text-sm">
                <option value="">Selecione</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><Label className="text-[#CCC]">Tipo</Label>
              <select value={form.product_type} onChange={e => setForm({...form, product_type: e.target.value})} className="w-full h-10 px-3 mt-1 rounded-md bg-[#111] border border-[#2A2A2A] text-white text-sm">
                <option value="store">Loja</option><option value="unique">Unico</option><option value="secondhand">Segunda Mao</option>
              </select>
            </div>
            <div><Label className="text-[#CCC]">Condicao</Label>
              <select value={form.condition} onChange={e => setForm({...form, condition: e.target.value})} className="w-full h-10 px-3 mt-1 rounded-md bg-[#111] border border-[#2A2A2A] text-white text-sm">
                <option value="new">Novo</option><option value="like_new">Seminovo</option><option value="good">Bom</option><option value="fair">Usado</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label className="text-[#CCC]">Imagens</Label>
              <div className="flex gap-2 mt-1 flex-wrap">
                {form.images.map((img, i) => (
                  <div key={i} className="relative w-16 h-16 rounded border border-[#2A2A2A] overflow-hidden">
                    <img src={img.startsWith('http') ? img : `${process.env.REACT_APP_BACKEND_URL}/api/files/${img}`} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => setForm({...form, images: form.images.filter((_, j) => j !== i)})} className="absolute top-0 right-0 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center">×</button>
                  </div>
                ))}
                <label className="w-16 h-16 rounded border-2 border-dashed border-[#2A2A2A] flex items-center justify-center cursor-pointer hover:border-[#B38B36]">
                  <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                  {uploading ? <div className="w-4 h-4 border-2 border-[#B38B36] border-t-transparent rounded-full animate-spin" /> : <Plus className="w-5 h-5 text-[#555]" />}
                </label>
              </div>
            </div>
          </div>
          <Button className="gold-btn rounded-lg mt-4" onClick={saveProduct}><Save className="w-4 h-4 mr-1" /> {editing ? 'Atualizar' : 'Criar Produto'}</Button>
        </div>
      )}

      {/* Products List */}
      <div className="space-y-2">
        {products.map(p => {
          const img = p.images?.[0];
          const imgUrl = img ? (img.startsWith('http') ? img : `${process.env.REACT_APP_BACKEND_URL}/api/files/${img}`) : null;
          return (
            <div key={p.product_id} className="dark-card rounded-xl p-3 flex items-center gap-3">
              <div className="w-14 h-14 rounded-lg bg-[#111] overflow-hidden shrink-0">
                {imgUrl ? <img src={imgUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[#333]">📦</div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">{p.title}</p>
                <p className="text-xs text-[#888]">{p.seller_name} | {p.category}</p>
                <p className="text-sm text-[#B38B36] font-bold">R$ {p.price?.toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className={`text-[10px] px-2 py-0.5 rounded ${p.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{p.status}</span>
                <Button size="sm" variant="ghost" onClick={() => startEdit(p)} className="text-[#888] hover:text-white h-8 w-8 p-0"><Edit className="w-4 h-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => deleteProduct(p.product_id)} className="text-red-400 hover:text-red-300 h-8 w-8 p-0"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==================== 1. GESTÃO DE SALDO TAB ====================
function WalletManagementTab({ token }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [amount, setAmount] = useState('');
  const [balanceType, setBalanceType] = useState('available');
  const [loading, setLoading] = useState(false);
  const h = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    axios.get(`${API}/admin/users`, { headers: h, withCredentials: true })
      .then(r => setUsers(r.data.users.filter(u => u.role === 'seller' || u.role === 'affiliate')))
      .catch(() => {});
  }, []);

  const addBalance = async () => {
    if (!selectedUser || !amount || parseFloat(amount) <= 0) {
      toast.error('Selecione um usuario e informe um valor valido');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/admin/wallet/add-balance`, {
        user_id: selectedUser,
        amount: parseFloat(amount),
        balance_type: balanceType
      }, { headers: h, withCredentials: true });
      toast.success('Saldo adicionado com sucesso!');
      setAmount('');
      setSelectedUser(null);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao adicionar saldo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl" data-testid="admin-wallet-tab">
      <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
        <Wallet className="w-5 h-5 text-[#B38B36]" /> Gestão de Saldo Manual
      </h3>
      <p className="text-sm text-[#888] mb-6">
        Adicione saldo manualmente na carteira de vendedores ou afiliados.
      </p>

      <div className="dark-card rounded-xl p-6 space-y-4">
        <div>
          <Label className="text-[#CCC]">Selecionar Usuario (Vendedor/Afiliado)</Label>
          <select 
            value={selectedUser || ''} 
            onChange={e => setSelectedUser(e.target.value)}
            className="w-full h-10 px-3 mt-1 rounded-md bg-[#111] border border-[#2A2A2A] text-white"
          >
            <option value="">Selecione um usuario...</option>
            {users.map(u => (
              <option key={u.user_id} value={u.user_id}>
                {u.name} ({u.email}) - {u.role}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label className="text-[#CCC]">Valor (R$)</Label>
          <Input 
            type="number" 
            step="0.01" 
            value={amount} 
            onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
            className="bg-[#111] border-[#2A2A2A] text-white mt-1"
          />
        </div>

        <div>
          <Label className="text-[#CCC]">Tipo de Saldo</Label>
          <select 
            value={balanceType} 
            onChange={e => setBalanceType(e.target.value)}
            className="w-full h-10 px-3 mt-1 rounded-md bg-[#111] border border-[#2A2A2A] text-white"
          >
            <option value="available">Disponivel (pode sacar)</option>
            <option value="held">Retido (aguardando liberacao)</option>
          </select>
        </div>

        <Button 
          className="gold-btn rounded-lg w-full" 
          onClick={addBalance} 
          disabled={loading}
        >
          {loading ? 'Adicionando...' : 'Adicionar Saldo'}
        </Button>
      </div>
    </div>
  );
}

// ==================== 2. LIBERAÇÃO DE SALDO (ESCROW) TAB ====================
function EscrowTab({ token }) {
  const [users, setUsers] = useState([]);
  const [wallets, setWallets] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [amount, setAmount] = useState('');
  const [releaseAll, setReleaseAll] = useState(true);
  const [loading, setLoading] = useState(false);
  const h = { Authorization: `Bearer ${token}` };

  const fetchUsers = async () => {
    const res = await axios.get(`${API}/admin/users`, { headers: h, withCredentials: true });
    const sellersAffiliates = res.data.users.filter(u => u.role === 'seller' || u.role === 'affiliate');
    setUsers(sellersAffiliates);
    
    // Buscar saldos
    for (const user of sellersAffiliates) {
      try {
        const walletRes = await axios.get(`${API}/wallet`, { 
          headers: { ...h, 'X-User-ID': user.user_id }, 
          withCredentials: true 
        });
        setWallets(prev => ({ ...prev, [user.user_id]: walletRes.data }));
      } catch {}
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const releaseBalance = async () => {
    if (!selectedUser) {
      toast.error('Selecione um usuario');
      return;
    }
    
    const wallet = wallets[selectedUser];
    if (!wallet || wallet.held <= 0) {
      toast.error('Usuario nao tem saldo retido');
      return;
    }

    if (!releaseAll && (!amount || parseFloat(amount) <= 0)) {
      toast.error('Informe um valor valido');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/admin/wallet/release-held`, {
        user_id: selectedUser,
        amount: releaseAll ? null : parseFloat(amount)
      }, { headers: h, withCredentials: true });
      toast.success('Saldo liberado com sucesso!');
      setAmount('');
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao liberar saldo');
    } finally {
      setLoading(false);
    }
  };

  const selectedWallet = selectedUser ? wallets[selectedUser] : null;

  return (
    <div className="max-w-2xl" data-testid="admin-escrow-tab">
      <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
        <UnlockKeyhole className="w-5 h-5 text-[#B38B36]" /> Sistema de Liberacao de Saldo (Escrow)
      </h3>
      <p className="text-sm text-[#888] mb-6">
        Libere saldo retido (held) para disponivel (available) dos vendedores/afiliados.
      </p>

      <div className="dark-card rounded-xl p-6 space-y-4">
        <div>
          <Label className="text-[#CCC]">Selecionar Usuario</Label>
          <select 
            value={selectedUser || ''} 
            onChange={e => setSelectedUser(e.target.value)}
            className="w-full h-10 px-3 mt-1 rounded-md bg-[#111] border border-[#2A2A2A] text-white"
          >
            <option value="">Selecione um usuario...</option>
            {users.map(u => {
              const w = wallets[u.user_id];
              return (
                <option key={u.user_id} value={u.user_id}>
                  {u.name} - Retido: R$ {w?.held?.toFixed(2) || '0.00'}
                </option>
              );
            })}
          </select>
        </div>

        {selectedWallet && (
          <div className="bg-[#111] rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-[#888]">Saldo Retido:</span>
              <span className="text-yellow-400 font-bold">R$ {selectedWallet.held?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#888]">Saldo Disponivel:</span>
              <span className="text-green-400 font-bold">R$ {selectedWallet.available?.toFixed(2)}</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Switch checked={releaseAll} onCheckedChange={setReleaseAll} />
          <Label className="text-[#CCC]">Liberar todo saldo retido</Label>
        </div>

        {!releaseAll && (
          <div>
            <Label className="text-[#CCC]">Valor a Liberar (R$)</Label>
            <Input 
              type="number" 
              step="0.01" 
              value={amount} 
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="bg-[#111] border-[#2A2A2A] text-white mt-1"
              max={selectedWallet?.held || 0}
            />
          </div>
        )}

        <Button 
          className="gold-btn rounded-lg w-full" 
          onClick={releaseBalance} 
          disabled={loading || !selectedUser}
        >
          {loading ? 'Liberando...' : 'Liberar Saldo'}
        </Button>
      </div>
    </div>
  );
}

// ==================== 3. CONTROLE DE AFILIADOS TAB ====================
function AffiliateControlTab({ token }) {
  const [affiliates, setAffiliates] = useState([]);
  const h = { Authorization: `Bearer ${token}` };

  const fetchAffiliates = () => {
    axios.get(`${API}/admin/users`, { headers: h, withCredentials: true })
      .then(r => setAffiliates(r.data.users.filter(u => u.role === 'affiliate')))
      .catch(() => {});
  };

  useEffect(() => { fetchAffiliates(); }, []);

  const toggleEarnings = async (userId, enabled) => {
    try {
      await axios.put(`${API}/admin/users/${userId}/affiliate-settings`, {
        affiliate_earnings_enabled: enabled
      }, { headers: h, withCredentials: true });
      toast.success(enabled ? 'Ganhos ativados' : 'Ganhos desativados');
      fetchAffiliates();
    } catch (err) {
      toast.error('Erro ao atualizar');
    }
  };

  return (
    <div data-testid="admin-affiliate-control-tab">
      <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
        <UserCog className="w-5 h-5 text-[#B38B36]" /> Controle de Afiliados
      </h3>
      <p className="text-sm text-[#888] mb-6">
        Ative ou desative ganhos de comissao para afiliados especificos.
      </p>

      {affiliates.length === 0 ? (
        <div className="dark-card rounded-xl p-12 text-center">
          <UserCog className="w-12 h-12 text-[#333] mx-auto mb-3" />
          <p className="text-[#888]">Nenhum afiliado cadastrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {affiliates.map(aff => (
            <div key={aff.user_id} className="dark-card rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-white">{aff.name}</p>
                <p className="text-xs text-[#888]">{aff.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#888]">
                  Ganhos: {aff.affiliate_earnings_enabled !== false ? (
                    <span className="text-green-400 font-bold">Ativado</span>
                  ) : (
                    <span className="text-red-400 font-bold">Desativado</span>
                  )}
                </span>
                <Switch 
                  checked={aff.affiliate_earnings_enabled !== false} 
                  onCheckedChange={v => toggleEarnings(aff.user_id, v)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== 4. PAINEL DE VENDAS MELHORADO TAB ====================
function SalesDashboardTab({ token }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const h = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    axios.get(`${API}/admin/sales/dashboard`, { headers: h, withCredentials: true })
      .then(r => { setSales(r.data.sales); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const statusColors = {
    'awaiting_payment': 'bg-yellow-500/20 text-yellow-400',
    'pending': 'bg-orange-500/20 text-orange-400',
    'approved': 'bg-green-500/20 text-green-400',
    'shipped': 'bg-blue-500/20 text-blue-400',
    'delivered': 'bg-emerald-500/20 text-emerald-400',
    'rejected': 'bg-red-500/20 text-red-400'
  };

  if (loading) return <div className="text-center py-8 text-[#888]">Carregando...</div>;

  return (
    <div data-testid="admin-sales-dashboard-tab">
      <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-[#B38B36]" /> Painel de Vendas Detalhado
      </h3>
      <p className="text-sm text-[#888] mb-6">
        Visualize todas as vendas com informacoes completas de comprador, vendedor e produto.
      </p>

      {sales.length === 0 ? (
        <div className="dark-card rounded-xl p-12 text-center">
          <ShoppingBag className="w-12 h-12 text-[#333] mx-auto mb-3" />
          <p className="text-[#888]">Nenhuma venda registrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sales.map((sale, idx) => (
            <div key={idx} className="dark-card rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs text-[#666]">#{sale.order_id?.slice(0, 16)}</p>
                  <p className="text-lg font-bold text-[#B38B36]">R$ {sale.value?.toFixed(2)}</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full ${statusColors[sale.status] || 'bg-[#333] text-[#888]'}`}>
                  {sale.status}
                </span>
              </div>

              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="bg-[#111] rounded-lg p-3">
                  <p className="text-[#666] text-xs mb-1">COMPRADOR</p>
                  <p className="text-white font-medium">{sale.buyer?.name}</p>
                  <p className="text-[#888] text-xs">{sale.buyer?.email}</p>
                </div>

                <div className="bg-[#111] rounded-lg p-3">
                  <p className="text-[#666] text-xs mb-1">VENDEDOR</p>
                  <p className="text-white font-medium">{sale.seller?.name}</p>
                  <p className="text-[#888] text-xs">{sale.seller?.email}</p>
                </div>

                <div className="bg-[#111] rounded-lg p-3">
                  <p className="text-[#666] text-xs mb-1">PRODUTO</p>
                  <p className="text-white font-medium truncate">{sale.product?.title}</p>
                  <p className="text-[#888] text-xs">Qtd: {sale.product?.quantity} x R$ {sale.product?.price?.toFixed(2)}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-3 text-xs text-[#666]">
                <span>Pagamento: {sale.payment_method?.toUpperCase()}</span>
                {sale.tracking_code && <span>Rastreio: {sale.tracking_code}</span>}
                <span>{new Date(sale.created_at).toLocaleString('pt-BR')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== 5. NOTIFICAÇÕES ADMIN TAB ====================
function AdminNotificationsTab({ token }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const h = { Authorization: `Bearer ${token}` };

  const fetchNotifications = () => {
    axios.get(`${API}/admin/notifications`, { headers: h, withCredentials: true })
      .then(r => {
        setNotifications(r.data.notifications);
        setUnreadCount(r.data.unread_count);
      })
      .catch(() => {});
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markAsRead = async (notifId) => {
    try {
      await axios.put(`${API}/admin/notifications/${notifId}/read`, {}, { headers: h, withCredentials: true });
      fetchNotifications();
    } catch {}
  };

  return (
    <div data-testid="admin-notifications-tab">
      <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
        <Bell className="w-5 h-5 text-[#B38B36]" /> Notificacoes do Admin
        {unreadCount > 0 && <span className="text-xs px-2 py-1 bg-red-500 text-white rounded-full">{unreadCount}</span>}
      </h3>

      {notifications.length === 0 ? (
        <div className="dark-card rounded-xl p-12 text-center">
          <Bell className="w-12 h-12 text-[#333] mx-auto mb-3" />
          <p className="text-[#888]">Nenhuma notificacao</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(notif => (
            <div 
              key={notif.notification_id} 
              className={`dark-card rounded-xl p-4 cursor-pointer transition-all ${notif.read ? 'opacity-60' : 'border-l-4 border-[#B38B36]'}`}
              onClick={() => !notif.read && markAsRead(notif.notification_id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">{notif.message}</p>
                  {notif.buyer_name && (
                    <p className="text-xs text-[#888] mt-1">
                      Comprador: {notif.buyer_name} | Total: R$ {notif.total?.toFixed(2)}
                    </p>
                  )}
                  <p className="text-xs text-[#666] mt-1">
                    {new Date(notif.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                {!notif.read && (
                  <span className="w-2 h-2 bg-[#B38B36] rounded-full shrink-0"></span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== 6. TRACKING TAB (RASTREAMENTO) ====================
function TrackingTab({ token }) {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingCode, setTrackingCode] = useState('');
  const h = { Authorization: `Bearer ${token}` };

  const fetchOrders = () => {
    axios.get(`${API}/admin/orders`, { headers: h, withCredentials: true })
      .then(r => setOrders(r.data.orders.filter(o => o.status !== 'rejected')))
      .catch(() => {});
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateTracking = async () => {
    if (!selectedOrder || !trackingCode.trim()) {
      toast.error('Selecione um pedido e informe o codigo');
      return;
    }

    try {
      await axios.put(`${API}/admin/orders/${selectedOrder}/tracking`, {
        tracking_code: trackingCode
      }, { headers: h, withCredentials: true });
      toast.success('Codigo de rastreio atualizado!');
      setTrackingCode('');
      setSelectedOrder(null);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao atualizar');
    }
  };

  return (
    <div className="max-w-3xl" data-testid="admin-tracking-tab">
      <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
        <Truck className="w-5 h-5 text-[#B38B36]" /> Rastreamento de Pedidos
      </h3>

      <div className="dark-card rounded-xl p-6 mb-6">
        <Label className="text-[#CCC]">Adicionar/Atualizar Codigo de Rastreio</Label>
        <div className="grid md:grid-cols-2 gap-3 mt-3">
          <select 
            value={selectedOrder || ''} 
            onChange={e => setSelectedOrder(e.target.value)}
            className="h-10 px-3 rounded-md bg-[#111] border border-[#2A2A2A] text-white"
          >
            <option value="">Selecione um pedido...</option>
            {orders.map(o => (
              <option key={o.order_id} value={o.order_id}>
                #{o.order_id?.slice(0, 16)} - {o.buyer_name} - R$ {o.total?.toFixed(2)}
              </option>
            ))}
          </select>
          <Input 
            value={trackingCode} 
            onChange={e => setTrackingCode(e.target.value)}
            placeholder="Codigo de rastreio (ex: BR123456789)"
            className="bg-[#111] border-[#2A2A2A] text-white"
          />
        </div>
        <Button className="gold-btn rounded-lg mt-3" onClick={updateTracking}>
          Atualizar Rastreio
        </Button>
      </div>

      <div className="space-y-3">
        {orders.filter(o => o.tracking_code).map(o => (
          <div key={o.order_id} className="dark-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white">#{o.order_id?.slice(0, 16)}</span>
              <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">{o.status}</span>
            </div>
            <p className="text-sm text-[#888]">{o.buyer_name}</p>
            <div className="bg-[#111] rounded-lg p-3 mt-2">
              <p className="text-xs text-[#666] mb-1">CODIGO DE RASTREIO</p>
              <p className="text-sm text-[#B38B36] font-mono font-bold">{o.tracking_code}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { token } = useAuth();
  const [counts, setCounts] = useState({});

  useEffect(() => {
    if (token) {
      axios.get(`${API}/admin/notification-counts`, { headers: { Authorization: `Bearer ${token}` }, withCredentials: true })
        .then(r => setCounts(r.data))
        .catch(() => {});
    }
  }, [token]);

  const Badge = ({ count }) => count > 0 ? (
    <span className="ml-1 min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full">{count > 99 ? '99+' : count}</span>
  ) : null;

  return (
    <div className="min-h-screen carbon-bg py-8" data-testid="admin-page">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-2xl md:text-3xl font-bold font-['Outfit'] text-white mb-6">Painel Admin (CEO)</h1>
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="flex flex-wrap gap-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-1 mb-6 h-auto">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-[#B38B36] data-[state=active]:text-white text-[#888]" data-testid="admin-tab-dashboard"><BarChart3 className="w-4 h-4 mr-1" /> Dashboard</TabsTrigger>
            <TabsTrigger value="sales" className="data-[state=active]:bg-[#B38B36] data-[state=active]:text-white text-[#888]" data-testid="admin-tab-sales"><TrendingUp className="w-4 h-4 mr-1" /> Vendas</TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-[#B38B36] data-[state=active]:text-white text-[#888]" data-testid="admin-tab-orders"><ShoppingBag className="w-4 h-4 mr-1" /> Pedidos<Badge count={counts.orders} /></TabsTrigger>
            <TabsTrigger value="wallet-manage" className="data-[state=active]:bg-[#B38B36] data-[state=active]:text-white text-[#888]" data-testid="admin-tab-wallet"><Wallet className="w-4 h-4 mr-1" /> Saldo</TabsTrigger>
            <TabsTrigger value="escrow" className="data-[state=active]:bg-[#B38B36] data-[state=active]:text-white text-[#888]" data-testid="admin-tab-escrow"><UnlockKeyhole className="w-4 h-4 mr-1" /> Escrow</TabsTrigger>
            <TabsTrigger value="tracking" className="data-[state=active]:bg-[#B38B36] data-[state=active]:text-white text-[#888]" data-testid="admin-tab-tracking"><Truck className="w-4 h-4 mr-1" /> Rastreio</TabsTrigger>
            <TabsTrigger value="affiliate-control" className="data-[state=active]:bg-[#B38B36] data-[state=active]:text-white text-[#888]" data-testid="admin-tab-affiliate"><UserCog className="w-4 h-4 mr-1" /> Afiliados</TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-[#B38B36] data-[state=active]:text-white text-[#888]" data-testid="admin-tab-notif"><Bell className="w-4 h-4 mr-1" /> Notif</TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-[#B38B36] data-[state=active]:text-white text-[#888]" data-testid="admin-tab-users"><Users className="w-4 h-4 mr-1" /> Usuarios<Badge count={counts.users} /></TabsTrigger>
            <TabsTrigger value="stores" className="data-[state=active]:bg-[#B38B36] data-[state=active]:text-white text-[#888]" data-testid="admin-tab-stores"><Store className="w-4 h-4 mr-1" /> Lojas<Badge count={counts.stores} /></TabsTrigger>
            <TabsTrigger value="admin-products" className="data-[state=active]:bg-[#B38B36] data-[state=active]:text-white text-[#888]" data-testid="admin-tab-products"><Package className="w-4 h-4 mr-1" /> Produtos</TabsTrigger>
            <TabsTrigger value="withdrawals" className="data-[state=active]:bg-[#B38B36] data-[state=active]:text-white text-[#888]" data-testid="admin-tab-withdrawals"><CreditCard className="w-4 h-4 mr-1" /> Saques<Badge count={counts.withdrawals} /></TabsTrigger>
            <TabsTrigger value="commissions" className="data-[state=active]:bg-[#B38B36] data-[state=active]:text-white text-[#888]" data-testid="admin-tab-commissions"><DollarSign className="w-4 h-4 mr-1" /> Comissoes</TabsTrigger>
            <TabsTrigger value="shipping" className="data-[state=active]:bg-[#B38B36] data-[state=active]:text-white text-[#888]" data-testid="admin-tab-shipping"><Truck className="w-4 h-4 mr-1" /> Frete</TabsTrigger>
            <TabsTrigger value="theme" className="data-[state=active]:bg-[#B38B36] data-[state=active]:text-white text-[#888]" data-testid="admin-tab-theme"><Palette className="w-4 h-4 mr-1" /> Personalizar</TabsTrigger>
            <TabsTrigger value="ads" className="data-[state=active]:bg-[#B38B36] data-[state=active]:text-white text-[#888]" data-testid="admin-tab-ads"><Megaphone className="w-4 h-4 mr-1" /> Anuncios</TabsTrigger>
            <TabsTrigger value="support" className="data-[state=active]:bg-[#B38B36] data-[state=active]:text-white text-[#888]" data-testid="admin-tab-support"><MessageSquare className="w-4 h-4 mr-1" /> Suporte<Badge count={counts.support} /></TabsTrigger>
            <TabsTrigger value="pages" className="data-[state=active]:bg-[#B38B36] data-[state=active]:text-white text-[#888]" data-testid="admin-tab-pages"><FileText className="w-4 h-4 mr-1" /> Paginas</TabsTrigger>
            <TabsTrigger value="financial" className="data-[state=active]:bg-[#B38B36] data-[state=active]:text-white text-[#888]" data-testid="admin-tab-financial"><Settings className="w-4 h-4 mr-1" /> Financeiro</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard"><DashboardTab token={token} /></TabsContent>
          <TabsContent value="sales"><SalesDashboardTab token={token} /></TabsContent>
          <TabsContent value="orders"><OrdersTab token={token} /></TabsContent>
          <TabsContent value="wallet-manage"><WalletManagementTab token={token} /></TabsContent>
          <TabsContent value="escrow"><EscrowTab token={token} /></TabsContent>
          <TabsContent value="tracking"><TrackingTab token={token} /></TabsContent>
          <TabsContent value="affiliate-control"><AffiliateControlTab token={token} /></TabsContent>
          <TabsContent value="notifications"><AdminNotificationsTab token={token} /></TabsContent>
          <TabsContent value="users"><UsersTab token={token} /></TabsContent>
          <TabsContent value="stores"><StoresTab token={token} /></TabsContent>
          <TabsContent value="admin-products"><AdminProductsTab token={token} /></TabsContent>
          <TabsContent value="withdrawals"><WithdrawalsTab token={token} /></TabsContent>
          <TabsContent value="commissions"><CommissionsTab token={token} /></TabsContent>
          <TabsContent value="shipping"><ShippingTab token={token} /></TabsContent>
          <TabsContent value="theme"><ThemeTab token={token} /></TabsContent>
          <TabsContent value="ads"><AdsTab token={token} /></TabsContent>
          <TabsContent value="support"><SupportTab token={token} /></TabsContent>
          <TabsContent value="pages"><PagesTab token={token} /></TabsContent>
          <TabsContent value="financial"><FinancialSettingsTab token={token} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
