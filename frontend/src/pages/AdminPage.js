import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { BarChart3, Users, ShoppingBag, CreditCard, Settings, MessageSquare, FileText, DollarSign, Check, X, Ban } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Switch } from '../components/ui/switch';
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
  const approve = async (id) => { await axios.put(`${API}/admin/orders/${id}/approve`, {}, { headers: h, withCredentials: true }); toast.success('Pedido aprovado'); f(); };
  const reject = async (id) => { await axios.put(`${API}/admin/orders/${id}/reject`, {}, { headers: h, withCredentials: true }); toast.success('Pedido rejeitado'); f(); };
  return (
    <div className="space-y-3" data-testid="admin-orders-tab">
      {orders.length === 0 ? <p className="text-[#888] text-center py-8">Nenhum pedido</p> : orders.map(o => (
        <div key={o.order_id} className="dark-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">#{o.order_id?.slice(0, 16)}</span>
            <span className={`status-badge status-${o.status}`}>{o.status}</span>
          </div>
          <p className="text-sm text-[#888]">Comprador: {o.buyer_name}</p>
          <p className="text-lg font-bold text-[#B38B36]">R$ {o.total?.toFixed(2)}</p>
          <p className="text-xs text-[#666] mb-2">{new Date(o.created_at).toLocaleDateString('pt-BR')}</p>
          {o.status === 'pending' && (
            <div className="flex gap-2">
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white rounded-lg" onClick={() => approve(o.order_id)} data-testid={`approve-order-${o.order_id}`}><Check className="w-4 h-4 mr-1" /> Aprovar</Button>
              <Button size="sm" variant="destructive" className="rounded-lg" onClick={() => reject(o.order_id)} data-testid={`reject-order-${o.order_id}`}><X className="w-4 h-4 mr-1" /> Rejeitar</Button>
            </div>
          )}
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
  const [data, setData] = useState({ paypal_email: '', bank_name: '', bank_account_name: '', bank_account_number: '', pix_key: '', paypal_enabled: false, pix_enabled: true, ted_enabled: true });
  const h = { Authorization: `Bearer ${token}` };
  useEffect(() => { axios.get(`${API}/admin/financial-settings`, { headers: h, withCredentials: true }).then(r => setData(r.data)).catch(() => {}); }, []);
  const save = async () => { await axios.put(`${API}/admin/financial-settings`, data, { headers: h, withCredentials: true }); toast.success('Configuracoes salvas'); };
  return (
    <div className="dark-card rounded-xl p-6 max-w-lg" data-testid="admin-financial-tab">
      <h3 className="font-bold mb-4 font-['Outfit'] text-white">Configuracoes Financeiras</h3>
      <div className="space-y-4">
        <div><Label className="text-[#CCC]">Email PayPal</Label><Input value={data.paypal_email} onChange={e => setData({...data, paypal_email: e.target.value})} className="bg-[#111] border-[#2A2A2A] text-white" data-testid="paypal-email-input" /></div>
        <div><Label className="text-[#CCC]">Nome do Banco</Label><Input value={data.bank_name} onChange={e => setData({...data, bank_name: e.target.value})} className="bg-[#111] border-[#2A2A2A] text-white" data-testid="bank-name-input" /></div>
        <div><Label className="text-[#CCC]">Titular da Conta</Label><Input value={data.bank_account_name} onChange={e => setData({...data, bank_account_name: e.target.value})} className="bg-[#111] border-[#2A2A2A] text-white" data-testid="bank-account-name-input" /></div>
        <div><Label className="text-[#CCC]">Numero da Conta</Label><Input value={data.bank_account_number} onChange={e => setData({...data, bank_account_number: e.target.value})} className="bg-[#111] border-[#2A2A2A] text-white" data-testid="bank-account-number-input" /></div>
        <div><Label className="text-[#CCC]">Chave PIX</Label><Input value={data.pix_key} onChange={e => setData({...data, pix_key: e.target.value})} className="bg-[#111] border-[#2A2A2A] text-white" data-testid="pix-key-input" /></div>
        <div className="space-y-3 pt-2 border-t border-[#2A2A2A]">
          <div className="flex items-center justify-between"><Label className="text-[#CCC]">PayPal Ativo</Label><Switch checked={data.paypal_enabled} onCheckedChange={v => setData({...data, paypal_enabled: v})} data-testid="paypal-switch" /></div>
          <div className="flex items-center justify-between"><Label className="text-[#CCC]">Pix Ativo</Label><Switch checked={data.pix_enabled} onCheckedChange={v => setData({...data, pix_enabled: v})} data-testid="pix-switch" /></div>
          <div className="flex items-center justify-between"><Label className="text-[#CCC]">TED Ativo</Label><Switch checked={data.ted_enabled} onCheckedChange={v => setData({...data, ted_enabled: v})} data-testid="ted-switch" /></div>
        </div>
        <Button className="gold-btn rounded-lg" onClick={save} data-testid="save-financial-btn">Salvar</Button>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { token } = useAuth();
  return (
    <div className="min-h-screen carbon-bg py-8" data-testid="admin-page">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-2xl md:text-3xl font-bold font-['Outfit'] text-white mb-6">Painel Admin (CEO)</h1>
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="flex flex-wrap gap-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-1 mb-6 h-auto">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-[#B38B36] data-[state=active]:text-white text-[#888]" data-testid="admin-tab-dashboard"><BarChart3 className="w-4 h-4 mr-1" /> Dashboard</TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-[#B38B36] data-[state=active]:text-white text-[#888]" data-testid="admin-tab-orders"><ShoppingBag className="w-4 h-4 mr-1" /> Pedidos</TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-[#B38B36] data-[state=active]:text-white text-[#888]" data-testid="admin-tab-users"><Users className="w-4 h-4 mr-1" /> Usuarios</TabsTrigger>
            <TabsTrigger value="withdrawals" className="data-[state=active]:bg-[#B38B36] data-[state=active]:text-white text-[#888]" data-testid="admin-tab-withdrawals"><CreditCard className="w-4 h-4 mr-1" /> Saques</TabsTrigger>
            <TabsTrigger value="commissions" className="data-[state=active]:bg-[#B38B36] data-[state=active]:text-white text-[#888]" data-testid="admin-tab-commissions"><DollarSign className="w-4 h-4 mr-1" /> Comissoes</TabsTrigger>
            <TabsTrigger value="support" className="data-[state=active]:bg-[#B38B36] data-[state=active]:text-white text-[#888]" data-testid="admin-tab-support"><MessageSquare className="w-4 h-4 mr-1" /> Suporte</TabsTrigger>
            <TabsTrigger value="pages" className="data-[state=active]:bg-[#B38B36] data-[state=active]:text-white text-[#888]" data-testid="admin-tab-pages"><FileText className="w-4 h-4 mr-1" /> Paginas</TabsTrigger>
            <TabsTrigger value="financial" className="data-[state=active]:bg-[#B38B36] data-[state=active]:text-white text-[#888]" data-testid="admin-tab-financial"><Settings className="w-4 h-4 mr-1" /> Financeiro</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard"><DashboardTab token={token} /></TabsContent>
          <TabsContent value="orders"><OrdersTab token={token} /></TabsContent>
          <TabsContent value="users"><UsersTab token={token} /></TabsContent>
          <TabsContent value="withdrawals"><WithdrawalsTab token={token} /></TabsContent>
          <TabsContent value="commissions"><CommissionsTab token={token} /></TabsContent>
          <TabsContent value="support"><SupportTab token={token} /></TabsContent>
          <TabsContent value="pages"><PagesTab token={token} /></TabsContent>
          <TabsContent value="financial"><FinancialSettingsTab token={token} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
