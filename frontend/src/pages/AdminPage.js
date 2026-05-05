import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';
import {
  BarChart3, Users, ShoppingBag, CreditCard, Settings, MessageSquare,
  FileText, DollarSign, Check, X, Ban, Truck, Store, Megaphone, Crown,
  Zap, Image, Link as LinkIcon, Eye, MousePointer, Palette, Package,
  Trash2, Edit, Plus, Save, Wallet, UnlockKeyhole, UserCog, Bell,
  TrendingUp, Mail, Send, Instagram, Facebook, Twitter,
  Globe, Search, ExternalLink, LayoutDashboard, Tag,
  AlertTriangle, Headphones, Gift, Sliders, Layers,
  ArrowUpRight, ArrowDownRight, Activity, RefreshCw,
  Menu, ChevronRight, Calendar, MoreHorizontal,
  CheckCircle, Copy, Download
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import FinanceModule from '../components/FinanceModule';
import PromotionPlansModule from '../components/PromotionPlansModule';
import PersonalizationModule from '../components/PersonalizationModule';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// ==================== BADGE HELPER ====================
function NBadge({ count }) {
  if (!count || count <= 0) return null;
  return (
    <span className="ml-1.5 min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full">
      {count > 99 ? '99+' : count}
    </span>
  );
}

// ==================== STATUS BADGE ====================
function StatusBadge({ status }) {
  const map = {
    awaiting_payment: { label: 'Aguard. Pagto', cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    pending: { label: 'Pendente', cls: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    approved: { label: 'Aprovado', cls: 'bg-green-500/20 text-green-400 border-green-500/30' },
    shipped: { label: 'Enviado', cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    delivered: { label: 'Entregue', cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    rejected: { label: 'Rejeitado', cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
    active: { label: 'Ativo', cls: 'bg-green-500/20 text-green-400 border-green-500/30' },
    inactive: { label: 'Inativo', cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
    open: { label: 'Aberto', cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    closed: { label: 'Fechado', cls: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  };
  const s = map[status] || { label: status, cls: 'bg-[#333] text-[#A6A8B3] border-[#444]' };
  return (
    <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${s.cls}`}>{s.label}</span>
  );
}

// ==================== STAT CARD ====================
function StatCard({ label, value, icon: Icon, color, change, prefix = '' }) {
  const isPositive = !change || change >= 0;
  return (
    <div className="rounded-2xl p-5 border border-[#1E2230] bg-[#11131A] hover:border-[#D4A24C]/30 transition-all duration-200 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-5" style={{ background: color, transform: 'translate(30%, -30%)' }} />
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-[#A6A8B3] font-medium">{label}</p>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-bold text-white mb-1">{prefix}{value ?? '0'}</p>
      {change !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
          {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          <span>{Math.abs(change)}% vs período anterior</span>
        </div>
      )}
    </div>
  );
}

// ==================== SECTION HEADER ====================
function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="text-xl font-bold text-white font-['Outfit']">{title}</h2>
        {subtitle && <p className="text-sm text-[#A6A8B3] mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ==================== DASHBOARD TAB ====================
function DashboardTab({ token, platform }) {
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState('7d');
  const h = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    axios.get(`${API}/admin/dashboard`, { headers: h })
      .then(r => setData(r.data))
      .catch(() => {});
  }, [token]);

  const salesData = [
    { day: '29 Abr', value: 98000 },
    { day: '30 Abr', value: 115000 },
    { day: '01 Mai', value: 132000 },
    { day: '02 Mai', value: 185430 },
    { day: '03 Mai', value: 210000 },
    { day: '04 Mai', value: 195000 },
    { day: '05 Mai', value: 220000 },
  ];

  const categoryData = [
    { name: 'Eletrônicos', value: 28, color: '#D4A24C' },
    { name: 'Moda', value: 22, color: '#8B5CF6' },
    { name: 'Casa e Decoração', value: 18, color: '#3B82F6' },
    { name: 'Beleza e Saúde', value: 14, color: '#10B981' },
    { name: 'Esportes', value: 10, color: '#F59E0B' },
    { name: 'Outros', value: 8, color: '#6B7280' },
  ];

  const accessData = [
    { name: 'Orgânico', value: 48, color: '#D4A24C' },
    { name: 'Direto', value: 25, color: '#8B5CF6' },
    { name: 'Redes Sociais', value: 15, color: '#3B82F6' },
    { name: 'Indicação', value: 7, color: '#10B981' },
    { name: 'Outros', value: 5, color: '#6B7280' },
  ];

  const recentOrders = [
    { id: '#10294', client: 'João Silva', value: 299.90, status: 'approved', date: '05/05/2025 16:45' },
    { id: '#10293', client: 'Maria Santos', value: 159.90, status: 'shipped', date: '05/05/2025 16:30' },
    { id: '#10292', client: 'Pedro Almeida', value: 459.80, status: 'pending', date: '05/05/2025 16:20' },
    { id: '#10291', client: 'Ana Costa', value: 89.90, status: 'approved', date: '05/05/2025 16:10' },
    { id: '#10290', client: 'Lucas Martins', value: 199.90, status: 'rejected', date: '05/05/2025 15:55' },
  ];

  const recentAds = [
    { title: 'iPhone 15 Pro Max 256GB', store: 'João Store', status: 'active', date: '05/05/2025 16:40' },
    { title: 'Tênis Nike Air Max', store: 'Sport Store', status: 'active', date: '05/05/2025 16:35' },
    { title: 'Cadeira Gamer ThunderX3', store: 'Tech Gamer', status: 'pending', date: '05/05/2025 16:30' },
    { title: 'Sony Alpha 7 IV', store: 'Foto Pro', status: 'active', date: '05/05/2025 16:35' },
  ];

  const activities = [
    { type: 'user', label: 'Novo usuário cadastrado', detail: 'Carlos Oliveira se cadastrou na plataforma', time: '2 min atrás', color: '#3B82F6' },
    { type: 'order', label: 'Novo pedido realizado', detail: 'Pedido #10294 foi realizado por João Silva', time: '5 min atrás', color: '#D4A24C' },
    { type: 'ad', label: 'Novo anúncio publicado', detail: 'iPhone 15 Pro Max foi publicado por João Store', time: '12 min atrás', color: '#10B981' },
    { type: 'report', label: 'Denúncia recebida', detail: 'Nova denúncia em anúncio #789456', time: '18 min atrás', color: '#EF4444' },
    { type: 'withdraw', label: 'Saque solicitado', detail: 'Saque de R$ 1.250,00 solicitado por Loja Tech', time: '25 min atrás', color: '#8B5CF6' },
  ];

  const activityIcon = (type) => {
    const map = {
      user: <Users className="w-4 h-4" />,
      order: <ShoppingBag className="w-4 h-4" />,
      ad: <Megaphone className="w-4 h-4" />,
      report: <AlertTriangle className="w-4 h-4" />,
      withdraw: <DollarSign className="w-4 h-4" />,
    };
    return map[type] || <Activity className="w-4 h-4" />;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#11131A] border border-[#D4A24C]/40 rounded-xl px-4 py-3 shadow-xl">
          <p className="text-xs text-[#A6A8B3] mb-1">{label}</p>
          <p className="text-sm font-bold text-[#D4A24C]">
            R$ {(payload[0].value / 1000).toFixed(0)}k
          </p>
        </div>
      );
    }
    return null;
  };

  const isMarketplace = platform === 'marketplace';

  return (
    <div className="space-y-6" data-testid="admin-dashboard-tab">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-['Outfit']">Dashboard</h1>
          <p className="text-sm text-[#A6A8B3] mt-0.5">
            Visão geral da plataforma atual:{' '}
            <span className="text-[#D4A24C] font-semibold">
              {isMarketplace ? 'Marketplace' : 'B Livre'}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#11131A] border border-[#1E2230] rounded-xl px-4 py-2 text-sm text-[#A6A8B3]">
            <Calendar className="w-4 h-4 text-[#D4A24C]" />
            <span>01/05/2025 - 05/05/2025</span>
          </div>
          <Button className="flex items-center gap-2 bg-[#11131A] border border-[#1E2230] hover:border-[#D4A24C]/50 text-[#A6A8B3] hover:text-white rounded-xl px-4 py-2 text-sm transition-all">
            <Download className="w-4 h-4 text-[#D4A24C]" />
            Exportar relatório
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {isMarketplace ? (
          <>
            <StatCard label="Vendas totais" value={data ? `R$ ${(data.total_sales || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'} icon={DollarSign} color="#D4A24C" change={23.5} />
            <StatCard label="Pedidos" value={data?.total_orders ?? 0} icon={ShoppingBag} color="#8B5CF6" change={18.7} />
            <StatCard label="Usuários ativos" value={data?.total_users ?? 0} icon={Users} color="#3B82F6" change={12.3} />
            <StatCard label="Anúncios ativos" value={data?.total_products ?? 0} icon={Tag} color="#10B981" change={15.2} />
            <StatCard label="Denúncias pendentes" value={data?.pending_orders ?? 0} icon={AlertTriangle} color="#EF4444" change={-4.2} />
          </>
        ) : (
          <>
            <StatCard label="Anúncios ativos" value={data?.total_products ?? 0} icon={Megaphone} color="#D4A24C" change={8.3} />
            <StatCard label="Usuários ativos" value={data?.total_users ?? 0} icon={Users} color="#3B82F6" change={12.3} />
            <StatCard label="Denúncias" value={data?.pending_orders ?? 0} icon={AlertTriangle} color="#EF4444" change={-4.2} />
            <StatCard label="Interações sociais" value="3.421" icon={Activity} color="#8B5CF6" change={21.0} />
            <StatCard label="Conversas ativas" value="128" icon={MessageSquare} color="#10B981" change={5.1} />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sales Chart */}
        <div className="lg:col-span-1 bg-[#11131A] border border-[#1E2230] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Vendas</h3>
            <select
              value={period}
              onChange={e => setPeriod(e.target.value)}
              className="text-xs bg-[#0B0D12] border border-[#1E2230] text-[#A6A8B3] rounded-lg px-3 py-1.5"
            >
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={salesData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4A24C" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#D4A24C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2230" />
              <XAxis dataKey="day" tick={{ fill: '#6F7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6F7280', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `R$ ${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="value" stroke="#D4A24C" strokeWidth={2} fill="url(#goldGrad)" dot={{ fill: '#D4A24C', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: '#D4A24C' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Chart */}
        <div className="bg-[#11131A] border border-[#1E2230] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Vendas por categoria</h3>
            <select className="text-xs bg-[#0B0D12] border border-[#1E2230] text-[#A6A8B3] rounded-lg px-3 py-1.5">
              <option>Todos</option>
            </select>
          </div>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={130} height={130}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" strokeWidth={0}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, '']} contentStyle={{ background: '#11131A', border: '1px solid #1E2230', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1.5">
              {categoryData.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                    <span className="text-[#A6A8B3]">{item.name}</span>
                  </div>
                  <span className="text-white font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#1E2230] text-center">
            <p className="text-xs text-[#A6A8B3]">Total</p>
            <p className="text-sm font-bold text-white">R$ {data ? (data.total_sales || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '1.234.567,89'}</p>
          </div>
        </div>

        {/* Access Origin Chart */}
        <div className="bg-[#11131A] border border-[#1E2230] rounded-2xl p-5">
          <h3 className="font-semibold text-white mb-4">Origem dos acessos</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={130} height={130}>
              <PieChart>
                <Pie data={accessData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" strokeWidth={0}>
                  {accessData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, '']} contentStyle={{ background: '#11131A', border: '1px solid #1E2230', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1.5">
              {accessData.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                    <span className="text-[#A6A8B3]">{item.name}</span>
                  </div>
                  <span className="text-white font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#1E2230] text-center">
            <p className="text-xs text-[#A6A8B3]">Total</p>
            <p className="text-sm font-bold text-white">128.456</p>
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Orders */}
        <div className="bg-[#11131A] border border-[#1E2230] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Pedidos recentes</h3>
            <button className="text-xs text-[#D4A24C] hover:underline flex items-center gap-1">Ver todos <ChevronRight className="w-3 h-3" /></button>
          </div>
          <div className="space-y-0">
            <div className="grid grid-cols-4 text-xs text-[#6F7280] uppercase tracking-wider pb-2 border-b border-[#1E2230] mb-2">
              <span>Pedido</span><span>Cliente</span><span>Valor</span><span>Status</span>
            </div>
            {recentOrders.map((o, i) => (
              <div key={i} className="grid grid-cols-4 items-center py-2.5 border-b border-[#1E2230]/50 last:border-0 text-sm">
                <span className="text-[#D4A24C] font-medium">{o.id}</span>
                <span className="text-white truncate">{o.client}</span>
                <span className="text-white">R$ {o.value.toFixed(2)}</span>
                <StatusBadge status={o.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Ads */}
        <div className="bg-[#11131A] border border-[#1E2230] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Anúncios recentes</h3>
            <button className="text-xs text-[#D4A24C] hover:underline flex items-center gap-1">Ver todos <ChevronRight className="w-3 h-3" /></button>
          </div>
          <div className="space-y-3">
            {recentAds.map((ad, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#0B0D12] border border-[#1E2230] flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5 text-[#6F7280]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{ad.title}</p>
                  <p className="text-xs text-[#A6A8B3]">{ad.store}</p>
                </div>
                <StatusBadge status={ad.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-[#11131A] border border-[#1E2230] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Atividades recentes</h3>
            <button className="text-xs text-[#D4A24C] hover:underline flex items-center gap-1">Ver todas <ChevronRight className="w-3 h-3" /></button>
          </div>
          <div className="space-y-3">
            {activities.map((act, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: `${act.color}20`, color: act.color }}>
                  {activityIcon(act.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium">{act.label}</p>
                  <p className="text-xs text-[#A6A8B3] truncate">{act.detail}</p>
                </div>
                <span className="text-xs text-[#6F7280] shrink-0">{act.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Stats Bar */}
      <div className="bg-[#11131A] border border-[#1E2230] rounded-2xl p-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 divide-x divide-[#1E2230]">
          {[
            { label: 'Comissão total (mês)', value: `R$ ${(data?.total_commissions || 123456.78).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: DollarSign },
            { label: 'Lojas ativas', value: '1.254', icon: Store },
            { label: 'Produtos cadastrados', value: data?.total_products?.toLocaleString('pt-BR') || '12.843', icon: Package },
            { label: 'Avaliações', value: data?.total_orders?.toLocaleString('pt-BR') || '8.456', icon: CheckCircle },
            { label: 'Uptime da plataforma', value: '99.98%', icon: Activity },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="px-4 first:pl-0 last:pr-0 flex items-center gap-3">
                <Icon className="w-4 h-4 text-[#D4A24C] shrink-0" />
                <div>
                  <p className="text-xs text-[#6F7280]">{item.label}</p>
                  <p className="text-sm font-bold text-white">{item.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ==================== ORDERS TAB ====================
function OrdersTab({ token }) {
  const [orders, setOrders] = useState([]);
  const h = { Authorization: `Bearer ${token}` };
  const f = () => axios.get(`${API}/admin/orders`, { headers: h }).then(r => setOrders(r.data.orders || [])).catch(() => {});
  useEffect(() => { f(); }, []);
  const approve = async (id) => { await axios.put(`${API}/admin/orders/${id}/approve`, {}, { headers: h }); toast.success('Pagamento confirmado!'); f(); };
  const reject = async (id) => { await axios.put(`${API}/admin/orders/${id}/reject`, {}, { headers: h }); toast.success('Pedido rejeitado'); f(); };
  const ship = async (id) => { await axios.put(`${API}/admin/orders/${id}/ship`, {}, { headers: h }); toast.success('Pedido enviado!'); f(); };
  const deliver = async (id) => { await axios.put(`${API}/admin/orders/${id}/deliver`, {}, { headers: h }); toast.success('Pedido entregue!'); f(); };
  const methodLabels = { pix: 'PIX', ted: 'Transferência Bancária', paypal: 'PayPal' };

  return (
    <div data-testid="admin-orders-tab">
      <SectionHeader title="Gerenciar Pedidos" subtitle="Aprove, rejeite e acompanhe todos os pedidos da plataforma" />
      {orders.length === 0 ? (
        <div className="text-center py-16 bg-[#11131A] rounded-2xl border border-[#1E2230]">
          <ShoppingBag className="w-12 h-12 text-[#6F7280] mx-auto mb-3" />
          <p className="text-[#A6A8B3]">Nenhum pedido encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(o => (
            <div key={o.order_id} className="bg-[#11131A] border border-[#1E2230] rounded-2xl p-4 hover:border-[#D4A24C]/20 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-[#D4A24C]">#{o.order_id?.slice(0, 16)}</span>
                <StatusBadge status={o.status} />
              </div>
              <p className="text-sm text-[#A6A8B3]">Comprador: <span className="text-white">{o.buyer_name}</span></p>
              <p className="text-lg font-bold text-white">R$ {o.total?.toFixed(2) ?? '0.00'}</p>
              <div className="flex items-center gap-2 mt-1">
                {o.payment_method && <span className="text-xs px-2 py-0.5 rounded bg-[#0B0D12] text-[#D4A24C] border border-[#D4A24C]/30">{methodLabels[o.payment_method] || o.payment_method}</span>}
                <span className="text-xs text-[#A6A8B3]">{new Date(o.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {(o.status === 'pending' || o.status === 'awaiting_payment') && (
                  <>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white rounded-lg" onClick={() => approve(o.order_id)}><Check className="w-4 h-4 mr-1" /> Confirmar Pagamento</Button>
                    <Button size="sm" variant="destructive" className="rounded-lg" onClick={() => reject(o.order_id)}><X className="w-4 h-4 mr-1" /> Rejeitar</Button>
                  </>
                )}
                {o.status === 'approved' && <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg" onClick={() => ship(o.order_id)}><Truck className="w-4 h-4 mr-1" /> Marcar como Enviado</Button>}
                {o.status === 'shipped' && <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg" onClick={() => deliver(o.order_id)}><Check className="w-4 h-4 mr-1" /> Marcar como Entregue</Button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== USERS TAB ====================
function UsersTab({ token }) {
  const [users, setUsers] = useState([]);
  const h = { Authorization: `Bearer ${token}` };
  const f = () => axios.get(`${API}/admin/users`, { headers: h }).then(r => setUsers(r.data.users || [])).catch(() => {});
  useEffect(() => { f(); }, []);
  const toggleBlock = async (uid) => { await axios.put(`${API}/admin/users/${uid}/block`, {}, { headers: h }); toast.success('Status alterado'); f(); };
  const roleLabels = { buyer: 'Comprador', seller: 'Vendedor', affiliate: 'Afiliado', admin: 'Admin' };
  return (
    <div data-testid="admin-users-tab">
      <SectionHeader title="Gerenciar Usuários" subtitle="Visualize e controle todos os usuários da plataforma" />
      <div className="space-y-2">
        {users.map(u => (
          <div key={u.user_id} className="bg-[#11131A] border border-[#1E2230] rounded-2xl p-4 flex items-center justify-between hover:border-[#D4A24C]/20 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#D4A24C]/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-[#D4A24C]" />
              </div>
              <div>
                <p className="font-medium text-sm text-white">{u.name}</p>
                <p className="text-xs text-[#A6A8B3]">{u.email} · <span className="text-[#D4A24C]">{roleLabels[u.role] || u.role}</span></p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {u.is_blocked && <span className="text-xs text-red-400 font-medium bg-red-500/10 px-2 py-0.5 rounded-full">Bloqueado</span>}
              {u.role !== 'admin' && <Button size="sm" variant={u.is_blocked ? "default" : "destructive"} className="rounded-lg" onClick={() => toggleBlock(u.user_id)} data-testid={`block-user-${u.user_id}`}><Ban className="w-4 h-4 mr-1" /> {u.is_blocked ? 'Desbloquear' : 'Bloquear'}</Button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== WITHDRAWALS TAB ====================
function WithdrawalsTab({ token }) {
  const [wds, setWds] = useState([]);
  const h = { Authorization: `Bearer ${token}` };
  const f = () => axios.get(`${API}/admin/withdrawals`, { headers: h }).then(r => setWds(r.data.withdrawals || [])).catch(() => {});
  useEffect(() => { f(); }, []);
  const approve = async (id) => { await axios.put(`${API}/admin/withdrawals/${id}/approve`, {}, { headers: h }); toast.success('Saque aprovado'); f(); };
  const reject = async (id) => { await axios.put(`${API}/admin/withdrawals/${id}/reject`, {}, { headers: h }); toast.success('Saque rejeitado'); f(); };
  return (
    <div data-testid="admin-withdrawals-tab">
      <SectionHeader title="Saques" subtitle="Aprove ou rejeite solicitações de saque" />
      {wds.length === 0 ? (
        <div className="text-center py-16 bg-[#11131A] rounded-2xl border border-[#1E2230]">
          <CreditCard className="w-12 h-12 text-[#6F7280] mx-auto mb-3" />
          <p className="text-[#A6A8B3]">Nenhum saque pendente</p>
        </div>
      ) : wds.map(w => (
        <div key={w.withdrawal_id} className="bg-[#11131A] border border-[#1E2230] rounded-2xl p-4 mb-3 hover:border-[#D4A24C]/20 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-sm text-white">{w.user_name}</span>
            <StatusBadge status={w.status} />
          </div>
          <p className="text-lg font-bold text-[#D4A24C]">R$ {w.amount?.toFixed(2) ?? '0.00'}</p>
          <p className="text-xs text-[#A6A8B3]">Método: {w.method?.toUpperCase()}</p>
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

// ==================== COMMISSIONS TAB ====================
function CommissionsTab({ token }) {
  const [data, setData] = useState({ platform_commission: 0.09, affiliate_commission: 0.065 });
  const h = { Authorization: `Bearer ${token}` };
  useEffect(() => { axios.get(`${API}/admin/commissions`, { headers: h }).then(r => setData(r.data)).catch(() => {}); }, []);
  const save = async () => { await axios.put(`${API}/admin/commissions`, data, { headers: h }); toast.success('Comissões atualizadas'); };
  return (
    <div data-testid="admin-commissions-tab">
      <SectionHeader title="Taxas de Comissão" subtitle="Configure as taxas cobradas pela plataforma" />
      <div className="bg-[#11131A] border border-[#1E2230] rounded-2xl p-6 max-w-md space-y-4">
        <div>
          <Label className="text-[#E6E6EA]">Comissão da Plataforma (%)</Label>
          <Input type="number" step="0.01" value={(data.platform_commission * 100).toFixed(1)} onChange={e => setData({...data, platform_commission: parseFloat(e.target.value) / 100})} className="bg-[#0B0D12] border-[#1E2230] text-white mt-1" data-testid="platform-commission-input" />
        </div>
        <div>
          <Label className="text-[#E6E6EA]">Comissão de Afiliados (%)</Label>
          <Input type="number" step="0.01" value={(data.affiliate_commission * 100).toFixed(1)} onChange={e => setData({...data, affiliate_commission: parseFloat(e.target.value) / 100})} className="bg-[#0B0D12] border-[#1E2230] text-white mt-1" data-testid="affiliate-commission-input" />
        </div>
        <Button className="w-full rounded-xl font-semibold" style={{ background: 'linear-gradient(135deg, #D4A24C, #B8882A)', color: '#000' }} onClick={save} data-testid="save-commissions-btn"><Save className="w-4 h-4 mr-2" /> Salvar Comissões</Button>
      </div>
    </div>
  );
}

// ==================== SUPPORT TAB ====================
function SupportTab({ token }) {
  const [msgs, setMsgs] = useState([]);
  const [reply, setReply] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const h = { Authorization: `Bearer ${token}` };
  const f = () => axios.get(`${API}/admin/support`, { headers: h }).then(r => setMsgs(r.data.messages || [])).catch(() => {});
  useEffect(() => { f(); }, []);
  const sendReply = async (msgId) => { await axios.post(`${API}/admin/support/${msgId}/reply`, { reply }, { headers: h }); toast.success('Resposta enviada'); setReply(''); setReplyTo(null); f(); };
  return (
    <div data-testid="admin-support-tab">
      <SectionHeader title="Suporte" subtitle="Responda às mensagens de suporte dos usuários" />
      {msgs.length === 0 ? (
        <div className="text-center py-16 bg-[#11131A] rounded-2xl border border-[#1E2230]">
          <Headphones className="w-12 h-12 text-[#6F7280] mx-auto mb-3" />
          <p className="text-[#A6A8B3]">Nenhuma mensagem de suporte</p>
        </div>
      ) : msgs.map(m => (
        <div key={m.message_id} className="bg-[#11131A] border border-[#1E2230] rounded-2xl p-4 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-sm text-white">{m.user_name} ({m.user_email})</span>
            <StatusBadge status={m.status} />
          </div>
          <p className="font-medium text-sm text-[#E6E6EA] mb-1">{m.subject}</p>
          <p className="text-sm text-[#A6A8B3] mb-2">{m.message}</p>
          {m.replies?.map((r, i) => (<div key={i} className="bg-[#0B0D12] rounded-lg p-3 mb-2 ml-4 border-l-2 border-[#D4A24C]"><p className="text-xs text-[#D4A24C] font-medium">{r.admin_name}</p><p className="text-sm text-[#E6E6EA]">{r.reply}</p></div>))}
          {replyTo === m.message_id ? (
            <div className="flex gap-2 mt-2">
              <Textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="Sua resposta..." className="flex-1 bg-[#0B0D12] border-[#1E2230] text-white" data-testid={`reply-input-${m.message_id}`} />
              <Button size="sm" className="rounded-lg" style={{ background: 'linear-gradient(135deg, #D4A24C, #B8882A)', color: '#000' }} onClick={() => sendReply(m.message_id)} data-testid={`send-reply-${m.message_id}`}>Enviar</Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" className="mt-2 border-[#1E2230] text-[#E6E6EA] hover:border-[#D4A24C]/50" onClick={() => setReplyTo(m.message_id)} data-testid={`reply-btn-${m.message_id}`}>Responder</Button>
          )}
        </div>
      ))}
    </div>
  );
}

// ==================== PAGES TAB ====================
function PagesTab({ token }) {
  const [slug, setSlug] = useState('about');
  const [content, setContent] = useState('');
  const h = { Authorization: `Bearer ${token}` };
  const pages = ['about', 'faq', 'contato', 'termos', 'privacidade'];
  useEffect(() => { axios.get(`${API}/admin/pages/${slug}`, { headers: h }).then(r => setContent(r.data.content || '')).catch(() => {}); }, [slug]);
  const save = async () => { await axios.put(`${API}/admin/pages/${slug}`, { content }, { headers: h }); toast.success('Página atualizada'); };
  return (
    <div data-testid="admin-pages-tab">
      <SectionHeader title="Páginas do Site" subtitle="Edite o conteúdo das páginas estáticas" />
      <div className="bg-[#11131A] border border-[#1E2230] rounded-2xl p-6">
        <div className="flex gap-2 mb-4 flex-wrap">
          {pages.map(p => (<Button key={p} size="sm" onClick={() => setSlug(p)} className={slug === p ? 'rounded-lg font-semibold' : 'rounded-lg border-[#1E2230] text-[#E6E6EA] bg-transparent hover:bg-[#1E2230]'} style={slug === p ? { background: 'linear-gradient(135deg, #D4A24C, #B8882A)', color: '#000' } : {}} data-testid={`page-btn-${p}`}>{p.charAt(0).toUpperCase() + p.slice(1)}</Button>))}
        </div>
        <Textarea value={content} onChange={e => setContent(e.target.value)} rows={10} className="mb-4 bg-[#0B0D12] border-[#1E2230] text-white" placeholder="Conteúdo da página..." data-testid="page-content-input" />
        <Button className="rounded-xl font-semibold" style={{ background: 'linear-gradient(135deg, #D4A24C, #B8882A)', color: '#000' }} onClick={save} data-testid="save-page-btn"><Save className="w-4 h-4 mr-2" /> Salvar Página</Button>
      </div>
    </div>
  );
}

// ==================== FINANCIAL SETTINGS TAB ====================
function FinancialSettingsTab({ token }) {
  const [data, setData] = useState({ paypal_email: '', paypal_enabled: false, bank_name: '', bank_branch: '', bank_account_name: '', bank_account_number: '', ted_enabled: true, pix_key: '', pix_key_type: 'cpf', pix_enabled: true });
  const [saving, setSaving] = useState(false);
  const h = { Authorization: `Bearer ${token}` };
  useEffect(() => { axios.get(`${API}/admin/financial-settings`, { headers: h }).then(r => setData(prev => ({...prev, ...r.data}))).catch(() => {}); }, []);
  const save = async () => { setSaving(true); try { await axios.put(`${API}/admin/financial-settings`, data, { headers: h }); toast.success('Configurações salvas!'); } catch { toast.error('Erro ao salvar'); } finally { setSaving(false); } };
  const PIX_TYPES = [{ value: 'cpf', label: 'CPF/CNPJ' }, { value: 'email', label: 'E-mail' }, { value: 'phone', label: 'Telefone' }, { value: 'random', label: 'Chave Aleatória' }];
  return (
    <div className="max-w-2xl space-y-6" data-testid="admin-financial-tab">
      <SectionHeader title="Configurações de Pagamento" subtitle="Configure os métodos de pagamento aceitos na plataforma" />
      <div className="bg-[#11131A] border border-[#1E2230] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center"><Zap className="w-5 h-5 text-green-400" /></div><div><h3 className="font-bold text-white">PIX</h3><p className="text-xs text-[#A6A8B3]">Pagamento instantâneo</p></div></div>
          <Switch checked={data.pix_enabled} onCheckedChange={v => setData({...data, pix_enabled: v})} data-testid="pix-switch" />
        </div>
        {data.pix_enabled && <div className="space-y-4 pt-4 border-t border-[#1E2230]"><div><Label className="text-[#E6E6EA]">Tipo da Chave PIX</Label><select value={data.pix_key_type || 'cpf'} onChange={e => setData({...data, pix_key_type: e.target.value})} className="w-full h-10 px-3 mt-1 rounded-lg bg-[#0B0D12] border border-[#1E2230] text-white">{PIX_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div><div><Label className="text-[#E6E6EA]">Chave PIX</Label><Input value={data.pix_key} onChange={e => setData({...data, pix_key: e.target.value})} className="bg-[#0B0D12] border-[#1E2230] text-white mt-1" data-testid="pix-key-input" /></div></div>}
      </div>
      <div className="bg-[#11131A] border border-[#1E2230] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center"><CreditCard className="w-5 h-5 text-blue-400" /></div><div><h3 className="font-bold text-white">Transferência Bancária</h3><p className="text-xs text-[#A6A8B3]">TED / DOC</p></div></div>
          <Switch checked={data.ted_enabled} onCheckedChange={v => setData({...data, ted_enabled: v})} data-testid="ted-switch" />
        </div>
        {data.ted_enabled && <div className="space-y-4 pt-4 border-t border-[#1E2230]"><div><Label className="text-[#E6E6EA]">Nome do Banco</Label><Input value={data.bank_name} onChange={e => setData({...data, bank_name: e.target.value})} className="bg-[#0B0D12] border-[#1E2230] text-white mt-1" data-testid="bank-name-input" /></div><div><Label className="text-[#E6E6EA]">Titular da Conta</Label><Input value={data.bank_account_name} onChange={e => setData({...data, bank_account_name: e.target.value})} className="bg-[#0B0D12] border-[#1E2230] text-white mt-1" data-testid="bank-account-name-input" /></div><div className="grid grid-cols-2 gap-4"><div><Label className="text-[#E6E6EA]">Agência</Label><Input value={data.bank_branch} onChange={e => setData({...data, bank_branch: e.target.value})} className="bg-[#0B0D12] border-[#1E2230] text-white mt-1" data-testid="bank-branch-input" /></div><div><Label className="text-[#E6E6EA]">Número da Conta</Label><Input value={data.bank_account_number} onChange={e => setData({...data, bank_account_number: e.target.value})} className="bg-[#0B0D12] border-[#1E2230] text-white mt-1" data-testid="bank-account-number-input" /></div></div></div>}
      </div>
      <Button className="rounded-xl w-full py-5 text-base font-semibold" style={{ background: 'linear-gradient(135deg, #D4A24C, #B8882A)', color: '#000' }} onClick={save} disabled={saving} data-testid="save-financial-btn">{saving ? 'Salvando...' : 'Salvar Configurações de Pagamento'}</Button>
    </div>
  );
}

// ==================== SHIPPING TAB ====================
function ShippingTab({ token }) {
  const [options, setOptions] = useState([]);
  const h = { Authorization: `Bearer ${token}` };
  useEffect(() => { axios.get(`${API}/admin/shipping-settings`, { headers: h }).then(r => setOptions(r.data.options || [])).catch(() => setOptions([{ name: 'Grátis', price: 0, days: '7-15 dias úteis', enabled: true }, { name: 'Normal', price: 15.90, days: '5-8 dias úteis', enabled: true }, { name: 'Expresso', price: 29.90, days: '2-3 dias úteis', enabled: true }])); }, []);
  const updateOption = (index, field, value) => { const n = [...options]; n[index][field] = value; setOptions(n); };
  const addOption = () => setOptions([...options, { name: '', price: 0, days: '', enabled: true }]);
  const removeOption = (index) => setOptions(options.filter((_, i) => i !== index));
  const save = async () => { await axios.put(`${API}/admin/shipping-settings`, { options }, { headers: h }); toast.success('Opções de frete atualizadas'); };
  return (
    <div data-testid="admin-shipping-tab">
      <SectionHeader title="Opções de Frete" subtitle="Configure as opções de frete disponíveis para os compradores" action={<Button className="rounded-xl" style={{ background: 'linear-gradient(135deg, #D4A24C, #B8882A)', color: '#000' }} onClick={addOption}><Plus className="w-4 h-4 mr-1" /> Adicionar</Button>} />
      <div className="bg-[#11131A] border border-[#1E2230] rounded-2xl p-6 space-y-4">
        {options.map((opt, i) => (
          <div key={i} className="grid grid-cols-4 gap-3 items-center p-3 bg-[#0B0D12] rounded-xl border border-[#1E2230]">
            <Input value={opt.name} onChange={e => updateOption(i, 'name', e.target.value)} placeholder="Nome" className="bg-[#11131A] border-[#1E2230] text-white" />
            <Input type="number" step="0.01" value={opt.price} onChange={e => updateOption(i, 'price', parseFloat(e.target.value))} placeholder="Preço" className="bg-[#11131A] border-[#1E2230] text-white" />
            <Input value={opt.days} onChange={e => updateOption(i, 'days', e.target.value)} placeholder="Prazo" className="bg-[#11131A] border-[#1E2230] text-white" />
            <div className="flex items-center gap-2"><Switch checked={opt.enabled} onCheckedChange={v => updateOption(i, 'enabled', v)} /><Button size="sm" variant="ghost" onClick={() => removeOption(i)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></Button></div>
          </div>
        ))}
        <Button className="rounded-xl font-semibold" style={{ background: 'linear-gradient(135deg, #D4A24C, #B8882A)', color: '#000' }} onClick={save}><Save className="w-4 h-4 mr-2" /> Salvar Frete</Button>
      </div>
    </div>
  );
}

// ==================== THEME TAB ====================
function ThemeTab({ token }) {
  const { refreshTheme } = useTheme();
  const [t, setT] = useState({});
  const [saving, setSaving] = useState(false);
  const h = { Authorization: `Bearer ${token}` };
  useEffect(() => { axios.get(`${API}/admin/theme`, { headers: h }).then(r => setT(r.data)).catch(() => {}); }, []);
  const save = async () => { setSaving(true); try { await axios.put(`${API}/admin/theme`, t, { headers: h }); refreshTheme(); toast.success('Tema atualizado!'); } catch { toast.error('Erro ao salvar'); } finally { setSaving(false); } };
  const ColorInput = ({ label, field }) => (
    <div className="flex items-center gap-3">
      <input type="color" value={t[field] || '#000000'} onChange={e => setT({...t, [field]: e.target.value})} className="w-10 h-10 rounded-lg cursor-pointer border border-[#1E2230]" />
      <div className="flex-1"><Label className="text-[#E6E6EA] text-xs">{label}</Label><Input value={t[field] || ''} onChange={e => setT({...t, [field]: e.target.value})} className="bg-[#0B0D12] border-[#1E2230] text-white h-8 text-xs mt-0.5" /></div>
    </div>
  );
  return (
    <div className="max-w-3xl space-y-6" data-testid="admin-theme-tab">
      <SectionHeader title="Personalização Visual" subtitle="Customize a aparência da plataforma" />
      <div className="bg-[#11131A] border border-[#1E2230] rounded-2xl p-6">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Palette className="w-5 h-5 text-[#D4A24C]" /> Informações da Plataforma</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label className="text-[#E6E6EA]">Nome da Plataforma</Label><Input value={t.platform_name || ''} onChange={e => setT({...t, platform_name: e.target.value})} className="bg-[#0B0D12] border-[#1E2230] text-white mt-1" /></div>
          <div><Label className="text-[#E6E6EA]">Slogan</Label><Input value={t.platform_slogan || ''} onChange={e => setT({...t, platform_slogan: e.target.value})} className="bg-[#0B0D12] border-[#1E2230] text-white mt-1" /></div>
        </div>
      </div>
      <div className="bg-[#11131A] border border-[#1E2230] rounded-2xl p-6">
        <h3 className="font-bold text-white mb-4">Cores Principais</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <ColorInput label="Cor Primária" field="primary_color" />
          <ColorInput label="Cor da Navbar" field="navbar_bg" />
          <ColorInput label="Texto da Navbar" field="navbar_text" />
          <ColorInput label="Fundo da Página" field="page_bg" />
        </div>
      </div>
      <Button className="rounded-xl w-full py-4 font-semibold" style={{ background: 'linear-gradient(135deg, #D4A24C, #B8882A)', color: '#000' }} onClick={save} disabled={saving}>{saving ? 'Salvando...' : 'Salvar Tema'}</Button>
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
  const fetchAds = () => { axios.get(`${API}/admin/ads`, { headers: h }).then(r => setAds(r.data.ads || [])).catch(() => {}); };
  useEffect(() => { fetchAds(); }, []);
  const handleUpload = async (e) => { const file = e.target.files[0]; if (!file) return; setUploading(true); try { const fd = new FormData(); fd.append('file', file); const res = await axios.post(`${API}/upload`, fd, { headers: h }); setForm({ ...form, image: res.data.path }); toast.success('Imagem enviada!'); } catch { toast.error('Erro ao enviar imagem'); } finally { setUploading(false); } };
  const createAd = async () => { if (!form.title || !form.image || !form.link) { toast.error('Preencha todos os campos'); return; } try { await axios.post(`${API}/ads`, form, { headers: h }); toast.success('Anúncio criado!'); setShowCreate(false); setForm({ title: '', image: '', link: '', position: 'between_products' }); fetchAds(); } catch (err) { toast.error(err.response?.data?.detail || 'Erro ao criar anúncio'); } };
  const toggleAd = async (adId, active) => { try { await axios.put(`${API}/admin/ads/${adId}`, { active }, { headers: h }); toast.success(active ? 'Anúncio ativado' : 'Anúncio desativado'); fetchAds(); } catch { toast.error('Erro ao atualizar anúncio'); } };
  const deleteAd = async (adId) => { try { await axios.delete(`${API}/admin/ads/${adId}`, { headers: h }); toast.success('Anúncio removido'); fetchAds(); } catch { toast.error('Erro ao remover anúncio'); } };
  const POSITION_LABELS = { top: 'Topo', between_products: 'Entre Produtos', sidebar: 'Lateral', footer: 'Rodapé' };
  return (
    <div data-testid="admin-ads-tab">
      <SectionHeader title="Gerenciar Anúncios" subtitle="Crie e gerencie anúncios dentro da plataforma" action={<Button className="rounded-xl font-semibold" style={{ background: 'linear-gradient(135deg, #D4A24C, #B8882A)', color: '#000' }} onClick={() => setShowCreate(!showCreate)}>{showCreate ? 'Cancelar' : '+ Criar Anúncio'}</Button>} />
      {showCreate && (
        <div className="bg-[#11131A] border border-[#1E2230] rounded-2xl p-6 mb-6">
          <h4 className="font-semibold text-white mb-4">Novo Anúncio</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div><Label className="text-[#E6E6EA]">Título</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex: Super Promoção" className="bg-[#0B0D12] border-[#1E2230] text-white mt-1" /></div>
            <div><Label className="text-[#E6E6EA]">Link de Destino</Label><Input value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} placeholder="https://..." className="bg-[#0B0D12] border-[#1E2230] text-white mt-1" /></div>
            <div><Label className="text-[#E6E6EA]">Posição</Label><select value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} className="w-full h-10 px-3 mt-1 rounded-lg bg-[#0B0D12] border border-[#1E2230] text-white"><option value="top">Topo da Página</option><option value="between_products">Entre Produtos</option><option value="sidebar">Barra Lateral</option><option value="footer">Rodapé</option></select></div>
            <div><Label className="text-[#E6E6EA]">Imagem do Banner</Label><label className="flex items-center gap-2 px-4 py-3 mt-1 rounded-lg border border-dashed border-[#1E2230] hover:border-[#D4A24C] cursor-pointer transition-colors">{uploading ? <div className="w-4 h-4 border-2 border-[#D4A24C] border-t-transparent rounded-full animate-spin" /> : <Image className="w-4 h-4 text-[#6F7280]" />}<span className="text-sm text-[#A6A8B3]">{form.image ? 'Imagem selecionada' : 'Clique para enviar'}</span><input type="file" accept="image/*" className="hidden" onChange={handleUpload} /></label></div>
          </div>
          <Button className="mt-4 rounded-xl font-semibold" style={{ background: 'linear-gradient(135deg, #D4A24C, #B8882A)', color: '#000' }} onClick={createAd}>Criar Anúncio</Button>
        </div>
      )}
      {ads.length === 0 ? (
        <div className="text-center py-16 bg-[#11131A] rounded-2xl border border-[#1E2230]"><Megaphone className="w-12 h-12 text-[#6F7280] mx-auto mb-3" /><p className="text-[#A6A8B3]">Nenhum anúncio criado</p></div>
      ) : (
        <div className="space-y-3">
          {ads.map(ad => (
            <div key={ad.ad_id} className="bg-[#11131A] border border-[#1E2230] rounded-2xl p-4 hover:border-[#D4A24C]/20 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-24 h-14 rounded-xl bg-[#0B0D12] overflow-hidden">{ad.image ? <img src={ad.image.startsWith('http') ? ad.image : `${API}/files/${ad.image}`} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Image className="w-6 h-6 text-[#6F7280]" /></div>}</div>
                  <div>
                    <div className="flex items-center gap-2"><p className="font-medium text-white">{ad.title}</p><StatusBadge status={ad.active ? 'active' : 'inactive'} /></div>
                    <p className="text-xs text-[#A6A8B3] flex items-center gap-3 mt-1"><span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {ad.views || 0} views</span><span className="flex items-center gap-1"><MousePointer className="w-3 h-3" /> {ad.clicks || 0} clicks</span></p>
                    <p className="text-xs text-[#A6A8B3] mt-1">Posição: {POSITION_LABELS[ad.position] || ad.position}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className={ad.active ? "border-red-500/50 text-red-400 rounded-lg" : "border-green-500/50 text-green-400 rounded-lg"} onClick={() => toggleAd(ad.ad_id, !ad.active)}>{ad.active ? 'Desativar' : 'Ativar'}</Button>
                  <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => deleteAd(ad.ad_id)}><X className="w-4 h-4" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== STORES TAB ====================
const PLAN_COLORS = { free: 'text-[#A6A8B3]', pro: 'text-blue-400', premium: 'text-[#D4A24C]' };
function StoresTab({ token }) {
  const [stores, setStores] = useState([]);
  const h = { Authorization: `Bearer ${token}` };
  const fetchStores = () => { axios.get(`${API}/admin/stores`, { headers: h }).then(r => setStores(r.data.stores || [])).catch(() => {}); };
  useEffect(() => { fetchStores(); }, []);
  const toggleApproval = async (storeId, approve) => { await axios.put(`${API}/admin/stores/${storeId}/approve`, { approved: approve }, { headers: h }); toast.success(approve ? 'Loja aprovada!' : 'Aprovação removida'); fetchStores(); };
  const changePlan = async (storeId, plan) => { await axios.put(`${API}/admin/stores/${storeId}/plan`, { plan }, { headers: h }); toast.success('Plano atualizado'); fetchStores(); };
  return (
    <div data-testid="admin-stores-tab">
      <SectionHeader title="Gerenciar Lojas" subtitle="Aprove lojas PRO/PREMIUM para aparecerem na seção Lojas" />
      {stores.length === 0 ? (
        <div className="text-center py-16 bg-[#11131A] rounded-2xl border border-[#1E2230]"><Store className="w-12 h-12 text-[#6F7280] mx-auto mb-3" /><p className="text-[#A6A8B3]">Nenhuma loja cadastrada</p></div>
      ) : (
        <div className="space-y-3">
          {stores.map(store => (
            <div key={store.store_id} className="bg-[#11131A] border border-[#1E2230] rounded-2xl p-4 hover:border-[#D4A24C]/20 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#0B0D12] border border-[#1E2230] overflow-hidden flex items-center justify-center">{store.logo ? <img src={store.logo.startsWith('http') ? store.logo : `${API}/files/${store.logo}`} alt="" className="w-full h-full object-cover" /> : <Store className="w-5 h-5 text-[#6F7280]" />}</div>
                  <div>
                    <div className="flex items-center gap-2"><p className="font-medium text-white">{store.name}</p><span className={`text-xs font-bold ${PLAN_COLORS[store.plan]}`}>{store.plan?.toUpperCase()}</span>{store.is_approved && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Aprovada</span>}</div>
                    <p className="text-xs text-[#A6A8B3]">{store.owner_name} · {store.products_count || 0} produtos · Comissão: {(store.plan_commission * 100).toFixed(0)}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={store.plan} onValueChange={v => changePlan(store.store_id, v)}><SelectTrigger className="w-[110px] bg-[#0B0D12] border-[#1E2230] text-white text-xs rounded-lg"><SelectValue /></SelectTrigger><SelectContent className="bg-[#0B0D12] border-[#1E2230]"><SelectItem value="free">Grátis (9%)</SelectItem><SelectItem value="pro">PRO (2%)</SelectItem><SelectItem value="premium">PREMIUM (1%)</SelectItem></SelectContent></Select>
                  {store.plan !== 'free' && <Button size="sm" variant={store.is_approved ? "outline" : "default"} className={store.is_approved ? "border-red-500/50 text-red-400 hover:bg-red-500/10 rounded-lg" : "rounded-lg font-semibold"} style={!store.is_approved ? { background: 'linear-gradient(135deg, #D4A24C, #B8882A)', color: '#000' } : {}} onClick={() => toggleApproval(store.store_id, !store.is_approved)}>{store.is_approved ? 'Remover' : 'Aprovar'}</Button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== ADMIN PRODUCTS TAB ====================
function AdminProductsTab({ token }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', price: '', category: '', product_type: 'store', condition: 'new', images: [] });
  const [uploading, setUploading] = useState(false);
  const h = { Authorization: `Bearer ${token}` };
  const fetchProducts = () => { axios.get(`${API}/admin/products`, { headers: h }).then(r => setProducts(r.data.products || [])).catch(() => {}); };
  useEffect(() => { fetchProducts(); axios.get(`${API}/categories`).then(r => setCategories(r.data.categories || [])).catch(() => {}); }, []);
  const handleUpload = async (e) => { const file = e.target.files[0]; if (!file) return; setUploading(true); try { const fd = new FormData(); fd.append('file', file); const res = await axios.post(`${API}/upload`, fd, { headers: h }); setForm(f => ({ ...f, images: [...f.images, res.data.path] })); } catch { toast.error('Erro ao enviar imagem'); } finally { setUploading(false); } };
  const saveProduct = async () => { try { if (editing) { await axios.put(`${API}/admin/products/${editing}`, { ...form, price: parseFloat(form.price) }, { headers: h }); toast.success('Produto atualizado!'); } else { await axios.post(`${API}/admin/products`, { ...form, price: parseFloat(form.price) }, { headers: h }); toast.success('Produto criado!'); } setShowAdd(false); setEditing(null); fetchProducts(); } catch (err) { toast.error(err.response?.data?.detail || 'Erro ao salvar produto'); } };
  const deleteProduct = async (id) => { if (!window.confirm('Remover produto?')) return; await axios.delete(`${API}/admin/products/${id}`, { headers: h }); toast.success('Produto removido'); fetchProducts(); };
  const startEdit = (p) => { setEditing(p.product_id); setForm({ title: p.title, description: p.description || '', price: p.price?.toString() || '', category: p.category || '', product_type: p.product_type || 'store', condition: p.condition || 'new', images: p.images || [] }); setShowAdd(true); };
  return (
    <div data-testid="admin-products-tab">
      <SectionHeader title={`Produtos (${products.length})`} subtitle="Gerencie todos os produtos da plataforma" action={<Button className="rounded-xl font-semibold" style={{ background: 'linear-gradient(135deg, #D4A24C, #B8882A)', color: '#000' }} onClick={() => { setEditing(null); setForm({ title: '', description: '', price: '', category: '', product_type: 'store', condition: 'new', images: [] }); setShowAdd(!showAdd); }}><Plus className="w-4 h-4 mr-1" /> {showAdd ? 'Cancelar' : 'Adicionar Produto'}</Button>} />
      {showAdd && (
        <div className="bg-[#11131A] border border-[#D4A24C]/30 rounded-2xl p-6 mb-4">
          <h4 className="font-bold text-white mb-4">{editing ? 'Editar Produto' : 'Novo Produto'}</h4>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2"><Label className="text-[#E6E6EA]">Título</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="bg-[#0B0D12] border-[#1E2230] text-white mt-1" /></div>
            <div className="sm:col-span-2"><Label className="text-[#E6E6EA]">Descrição</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="bg-[#0B0D12] border-[#1E2230] text-white mt-1" rows={3} /></div>
            <div><Label className="text-[#E6E6EA]">Preço (R$)</Label><Input type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="bg-[#0B0D12] border-[#1E2230] text-white mt-1" /></div>
            <div><Label className="text-[#E6E6EA]">Categoria</Label><select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full h-10 px-3 mt-1 rounded-lg bg-[#0B0D12] border border-[#1E2230] text-white text-sm"><option value="">Selecione</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          </div>
          <Button className="mt-4 rounded-xl font-semibold" style={{ background: 'linear-gradient(135deg, #D4A24C, #B8882A)', color: '#000' }} onClick={saveProduct}><Save className="w-4 h-4 mr-1" /> {editing ? 'Atualizar' : 'Criar Produto'}</Button>
        </div>
      )}
      <div className="space-y-2">
        {products.map(p => {
          const img = p.images?.[0];
          const imgUrl = img ? (img.startsWith('http') ? img : `${process.env.REACT_APP_BACKEND_URL}/api/files/${img}`) : null;
          return (
            <div key={p.product_id} className="bg-[#11131A] border border-[#1E2230] rounded-2xl p-3 flex items-center gap-3 hover:border-[#D4A24C]/20 transition-all">
              <div className="w-14 h-14 rounded-xl bg-[#0B0D12] overflow-hidden shrink-0">{imgUrl ? <img src={imgUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[#6F7280]">📦</div>}</div>
              <div className="flex-1 min-w-0"><p className="text-sm text-white font-medium truncate">{p.title}</p><p className="text-xs text-[#A6A8B3]">{p.seller_name} · {p.category}</p><p className="text-sm text-[#D4A24C] font-bold">R$ {p.price?.toFixed(2) ?? '0.00'}</p></div>
              <div className="flex items-center gap-1 shrink-0"><StatusBadge status={p.status} /><Button size="sm" variant="ghost" onClick={() => startEdit(p)} className="text-[#A6A8B3] hover:text-white h-8 w-8 p-0"><Edit className="w-4 h-4" /></Button><Button size="sm" variant="ghost" onClick={() => deleteProduct(p.product_id)} className="text-red-400 hover:text-red-300 h-8 w-8 p-0"><Trash2 className="w-4 h-4" /></Button></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==================== WALLET MANAGEMENT TAB ====================
function WalletManagementTab({ token }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [amount, setAmount] = useState('');
  const [balanceType, setBalanceType] = useState('available');
  const [loading, setLoading] = useState(false);
  const h = { Authorization: `Bearer ${token}` };
  useEffect(() => { axios.get(`${API}/admin/users`, { headers: h }).then(r => setUsers(r.data.users?.filter(u => u.role === 'seller' || u.role === 'affiliate') || [])).catch(() => {}); }, []);
  const addBalance = async () => { if (!selectedUser || !amount || parseFloat(amount) <= 0) { toast.error('Selecione um usuário e informe um valor válido'); return; } setLoading(true); try { await axios.post(`${API}/admin/wallet/add-balance`, { user_id: selectedUser, amount: parseFloat(amount), balance_type: balanceType }, { headers: h }); toast.success('Saldo adicionado com sucesso!'); setAmount(''); setSelectedUser(null); } catch (err) { toast.error(err.response?.data?.detail || 'Erro ao adicionar saldo'); } finally { setLoading(false); } };
  return (
    <div className="max-w-2xl" data-testid="admin-wallet-tab">
      <SectionHeader title="Gestão de Saldo Manual" subtitle="Adicione saldo manualmente na carteira de vendedores ou afiliados" />
      <div className="bg-[#11131A] border border-[#1E2230] rounded-2xl p-6 space-y-4">
        <div><Label className="text-[#E6E6EA]">Selecionar Usuário (Vendedor/Afiliado)</Label><select value={selectedUser || ''} onChange={e => setSelectedUser(e.target.value)} className="w-full h-10 px-3 mt-1 rounded-lg bg-[#0B0D12] border border-[#1E2230] text-white"><option value="">Selecione um usuário...</option>{users.map(u => <option key={u.user_id} value={u.user_id}>{u.name} ({u.email}) - {u.role}</option>)}</select></div>
        <div><Label className="text-[#E6E6EA]">Valor (R$)</Label><Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="bg-[#0B0D12] border-[#1E2230] text-white mt-1" /></div>
        <div><Label className="text-[#E6E6EA]">Tipo de Saldo</Label><select value={balanceType} onChange={e => setBalanceType(e.target.value)} className="w-full h-10 px-3 mt-1 rounded-lg bg-[#0B0D12] border border-[#1E2230] text-white"><option value="available">Disponível (pode sacar)</option><option value="held">Retido (aguardando liberação)</option></select></div>
        <Button className="rounded-xl w-full font-semibold" style={{ background: 'linear-gradient(135deg, #D4A24C, #B8882A)', color: '#000' }} onClick={addBalance} disabled={loading}>{loading ? 'Adicionando...' : 'Adicionar Saldo'}</Button>
      </div>
    </div>
  );
}

// ==================== ESCROW TAB ====================
function EscrowTab({ token }) {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('with_held');
  const [search, setSearch] = useState('');
  const [actionFor, setActionFor] = useState(null);
  const [amount, setAmount] = useState('');
  const [releaseAll, setReleaseAll] = useState(true);
  const [busy, setBusy] = useState(false);
  const h = { Authorization: `Bearer ${token}` };
  const fetchAll = async () => { setLoading(true); try { const res = await axios.get(`${API}/admin/wallets`, { headers: h }); setWallets(res.data.wallets || []); } catch { toast.error('Erro ao carregar carteiras'); } finally { setLoading(false); } };
  useEffect(() => { fetchAll(); }, []);
  const release = async (userId, wallet) => { if (!wallet || wallet.held <= 0) { toast.error('Este usuário não tem saldo retido'); return; } if (!releaseAll && (!amount || parseFloat(amount) <= 0)) { toast.error('Informe um valor válido'); return; } setBusy(true); try { await axios.post(`${API}/admin/wallet/release-held`, { user_id: userId, amount: releaseAll ? null : parseFloat(amount) }, { headers: h }); toast.success('Saldo liberado!'); setActionFor(null); setAmount(''); fetchAll(); } catch (err) { toast.error(err.response?.data?.detail || 'Erro ao liberar saldo'); } finally { setBusy(false); } };
  const filtered = wallets.filter(w => filter === 'all' ? true : w.held > 0).filter(w => !search.trim() || (w.name || '').toLowerCase().includes(search.toLowerCase()) || (w.email || '').toLowerCase().includes(search.toLowerCase()));
  const totals = wallets.reduce((acc, w) => ({ available: acc.available + w.available, held: acc.held + w.held, users_with_held: acc.users_with_held + (w.held > 0 ? 1 : 0) }), { available: 0, held: 0, users_with_held: 0 });
  return (
    <div className="space-y-4" data-testid="admin-escrow-tab">
      <SectionHeader title="Escrow — Carteiras dos Vendedores" subtitle="Visualize todos os vendedores com saldo retido e libere para disponível" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#11131A] border border-[#1E2230] rounded-2xl p-4"><p className="text-xs text-[#6F7280] uppercase tracking-wider mb-1">Disponível Total</p><p className="text-xl font-bold text-emerald-400">R$ {totals.available.toFixed(2)}</p></div>
        <div className="bg-[#11131A] border border-[#1E2230] rounded-2xl p-4"><p className="text-xs text-[#6F7280] uppercase tracking-wider mb-1">Retido Total</p><p className="text-xl font-bold text-[#D4A24C]">R$ {totals.held.toFixed(2)}</p></div>
        <div className="bg-[#11131A] border border-[#1E2230] rounded-2xl p-4"><p className="text-xs text-[#6F7280] uppercase tracking-wider mb-1">Usuários c/ retido</p><p className="text-xl font-bold text-white">{totals.users_with_held}</p></div>
        <div className="bg-[#11131A] border border-[#1E2230] rounded-2xl p-4"><p className="text-xs text-[#6F7280] uppercase tracking-wider mb-1">Total usuários</p><p className="text-xl font-bold text-white">{wallets.length}</p></div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 bg-[#0B0D12] border border-[#1E2230] rounded-full p-1">
          <button onClick={() => setFilter('with_held')} className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${filter === 'with_held' ? 'bg-[#D4A24C] text-black' : 'text-[#A6A8B3]'}`} data-testid="escrow-filter-held">Com retido</button>
          <button onClick={() => setFilter('all')} className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${filter === 'all' ? 'bg-[#D4A24C] text-black' : 'text-[#A6A8B3]'}`} data-testid="escrow-filter-all">Todos</button>
        </div>
        <Input placeholder="Buscar por nome/email..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs bg-[#11131A] border-[#1E2230] text-white text-sm" data-testid="escrow-search" />
        <button onClick={fetchAll} className="ml-auto text-sm text-[#D4A24C] hover:underline flex items-center gap-1" data-testid="escrow-refresh"><RefreshCw className="w-3 h-3" /> Atualizar</button>
      </div>
      <div className="bg-[#11131A] border border-[#1E2230] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-[#0B0D12] text-[#A6A8B3] text-xs uppercase tracking-wider"><th className="text-left px-4 py-3">Usuário</th><th className="text-left px-4 py-3">Papel</th><th className="text-right px-4 py-3">Disponível</th><th className="text-right px-4 py-3">Retido</th><th className="text-right px-4 py-3">Total</th><th className="text-right px-4 py-3">Ação</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="text-center py-8 text-[#A6A8B3]">Carregando carteiras...</td></tr> : filtered.length === 0 ? <tr><td colSpan={6} className="text-center py-8 text-[#A6A8B3]">Nenhum resultado</td></tr> : filtered.map(w => (
                <tr key={w.user_id} className="border-t border-[#1E2230] hover:bg-[#11131A]/70">
                  <td className="px-4 py-3"><p className="text-white font-medium">{w.name || '—'}</p><p className="text-xs text-[#6F7280]">{w.email}</p></td>
                  <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-[#D4A24C]/10 text-[#D4A24C] border border-[#D4A24C]/20">{(w.role || 'user').toUpperCase()}</span></td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-400">R$ {w.available?.toFixed(2) ?? '0.00'}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold" style={{ color: w.held > 0 ? '#D4A24C' : '#6F7280' }}>R$ {w.held?.toFixed(2) ?? '0.00'}</td>
                  <td className="px-4 py-3 text-right font-mono text-white">R$ {w.total?.toFixed(2) ?? '0.00'}</td>
                  <td className="px-4 py-3 text-right">
                    {w.held > 0 ? (
                      actionFor === w.user_id ? (
                        <div className="flex items-center gap-2 justify-end">
                          <div className="flex gap-1 bg-[#0B0D12] border border-[#1E2230] rounded-full p-0.5">
                            <button onClick={() => setReleaseAll(true)} className={`px-2 py-0.5 rounded-full text-xs ${releaseAll ? 'bg-[#D4A24C] text-black' : 'text-[#A6A8B3]'}`}>Tudo</button>
                            <button onClick={() => setReleaseAll(false)} className={`px-2 py-0.5 rounded-full text-xs ${!releaseAll ? 'bg-[#D4A24C] text-black' : 'text-[#A6A8B3]'}`}>Parcial</button>
                          </div>
                          {!releaseAll && <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="R$" className="w-24 h-7 text-xs bg-[#0B0D12] border-[#1E2230] text-white" />}
                          <Button size="sm" className="rounded-lg text-xs" style={{ background: 'linear-gradient(135deg, #D4A24C, #B8882A)', color: '#000' }} onClick={() => release(w.user_id, w)} disabled={busy}>Liberar</Button>
                          <Button size="sm" variant="ghost" className="text-[#A6A8B3] rounded-lg text-xs" onClick={() => setActionFor(null)}>Cancelar</Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" className="border-[#D4A24C]/50 text-[#D4A24C] hover:bg-[#D4A24C]/10 rounded-lg text-xs" onClick={() => setActionFor(w.user_id)}>Liberar Saldo</Button>
                      )
                    ) : <span className="text-xs text-[#6F7280]">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==================== TRACKING TAB ====================
function TrackingTab({ token }) {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingCode, setTrackingCode] = useState('');
  const h = { Authorization: `Bearer ${token}` };
  const fetchOrders = () => { axios.get(`${API}/admin/orders`, { headers: h }).then(r => setOrders((r.data.orders || []).filter(o => o.status !== 'rejected'))).catch(() => {}); };
  useEffect(() => { fetchOrders(); }, []);
  const updateTracking = async () => { if (!selectedOrder || !trackingCode.trim()) { toast.error('Selecione um pedido e informe o código'); return; } try { await axios.put(`${API}/admin/orders/${selectedOrder}/tracking`, { tracking_code: trackingCode }, { headers: h }); toast.success('Código de rastreio atualizado!'); setTrackingCode(''); setSelectedOrder(null); fetchOrders(); } catch (err) { toast.error(err.response?.data?.detail || 'Erro ao atualizar'); } };
  return (
    <div className="max-w-3xl" data-testid="admin-tracking-tab">
      <SectionHeader title="Rastreamento de Pedidos" subtitle="Adicione ou atualize códigos de rastreio dos pedidos" />
      <div className="bg-[#11131A] border border-[#1E2230] rounded-2xl p-6 mb-6">
        <Label className="text-[#E6E6EA]">Adicionar/Atualizar Código de Rastreio</Label>
        <div className="grid md:grid-cols-2 gap-3 mt-3">
          <select value={selectedOrder || ''} onChange={e => setSelectedOrder(e.target.value)} className="h-10 px-3 rounded-lg bg-[#0B0D12] border border-[#1E2230] text-white"><option value="">Selecione um pedido...</option>{orders.map(o => <option key={o.order_id} value={o.order_id}>#{o.order_id?.slice(0, 16)} - {o.buyer_name} - R$ {o.total?.toFixed(2)}</option>)}</select>
          <Input value={trackingCode} onChange={e => setTrackingCode(e.target.value)} placeholder="Código de rastreio (ex: BR123456789)" className="bg-[#0B0D12] border-[#1E2230] text-white" />
        </div>
        <Button className="mt-3 rounded-xl font-semibold" style={{ background: 'linear-gradient(135deg, #D4A24C, #B8882A)', color: '#000' }} onClick={updateTracking}><Truck className="w-4 h-4 mr-2" /> Atualizar Rastreio</Button>
      </div>
      <div className="space-y-2">
        {orders.map(o => (
          <div key={o.order_id} className="bg-[#11131A] border border-[#1E2230] rounded-2xl p-4 flex items-center justify-between">
            <div><p className="text-sm font-medium text-white">#{o.order_id?.slice(0, 16)}</p><p className="text-xs text-[#A6A8B3]">{o.buyer_name} · R$ {o.total?.toFixed(2)}</p></div>
            <div className="flex items-center gap-3"><StatusBadge status={o.status} />{o.tracking_code && <span className="text-xs text-[#D4A24C] font-mono bg-[#D4A24C]/10 px-2 py-0.5 rounded">{o.tracking_code}</span>}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== AFFILIATE CONTROL TAB ====================
function AffiliateControlTab({ token }) {
  const [affiliates, setAffiliates] = useState([]);
  const h = { Authorization: `Bearer ${token}` };
  const fetchAffiliates = () => { axios.get(`${API}/admin/users`, { headers: h }).then(r => setAffiliates((r.data.users || []).filter(u => u.role === 'affiliate'))).catch(() => {}); };
  useEffect(() => { fetchAffiliates(); }, []);
  const toggleEarnings = async (userId, enabled) => { try { await axios.put(`${API}/admin/users/${userId}/affiliate-settings`, { affiliate_earnings_enabled: enabled }, { headers: h }); toast.success(enabled ? 'Ganhos ativados' : 'Ganhos desativados'); fetchAffiliates(); } catch { toast.error('Erro ao atualizar'); } };
  return (
    <div data-testid="admin-affiliate-control-tab">
      <SectionHeader title="Controle de Afiliados" subtitle="Ative ou desative ganhos de comissão para afiliados específicos" />
      {affiliates.length === 0 ? (
        <div className="text-center py-16 bg-[#11131A] rounded-2xl border border-[#1E2230]"><UserCog className="w-12 h-12 text-[#6F7280] mx-auto mb-3" /><p className="text-[#A6A8B3]">Nenhum afiliado cadastrado</p></div>
      ) : (
        <div className="space-y-3">
          {affiliates.map(aff => (
            <div key={aff.user_id} className="bg-[#11131A] border border-[#1E2230] rounded-2xl p-4 flex items-center justify-between hover:border-[#D4A24C]/20 transition-all">
              <div><p className="font-medium text-white">{aff.name}</p><p className="text-xs text-[#A6A8B3]">{aff.email}</p></div>
              <div className="flex items-center gap-3"><span className="text-sm text-[#A6A8B3]">Ganhos: {aff.affiliate_earnings_enabled !== false ? <span className="text-emerald-400 font-bold">Ativado</span> : <span className="text-red-400 font-bold">Desativado</span>}</span><Switch checked={aff.affiliate_earnings_enabled !== false} onCheckedChange={v => toggleEarnings(aff.user_id, v)} /></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== SALES DASHBOARD TAB ====================
function SalesDashboardTab({ token }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const h = { Authorization: `Bearer ${token}` };
  useEffect(() => { axios.get(`${API}/admin/sales/dashboard`, { headers: h }).then(r => { setSales(r.data.sales || []); setLoading(false); }).catch(() => setLoading(false)); }, []);
  if (loading) return <div className="text-center py-8 text-[#A6A8B3]">Carregando...</div>;
  return (
    <div data-testid="admin-sales-dashboard-tab">
      <SectionHeader title="Painel de Vendas Detalhado" subtitle="Visualize todas as vendas com informações completas" />
      {sales.length === 0 ? (
        <div className="text-center py-16 bg-[#11131A] rounded-2xl border border-[#1E2230]"><ShoppingBag className="w-12 h-12 text-[#6F7280] mx-auto mb-3" /><p className="text-[#A6A8B3]">Nenhuma venda registrada</p></div>
      ) : (
        <div className="space-y-3">
          {sales.map((sale, idx) => (
            <div key={idx} className="bg-[#11131A] border border-[#1E2230] rounded-2xl p-4 hover:border-[#D4A24C]/20 transition-all">
              <div className="flex items-start justify-between mb-3"><div><p className="text-xs text-[#A6A8B3]">#{sale.order_id?.slice(0, 16)}</p><p className="text-lg font-bold text-[#D4A24C]">R$ {sale.value?.toFixed(2) ?? '0.00'}</p></div><StatusBadge status={sale.status} /></div>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="bg-[#0B0D12] rounded-xl p-3"><p className="text-[#A6A8B3] text-xs mb-1">COMPRADOR</p><p className="text-white font-medium">{sale.buyer?.name}</p><p className="text-[#A6A8B3] text-xs">{sale.buyer?.email}</p></div>
                <div className="bg-[#0B0D12] rounded-xl p-3"><p className="text-[#A6A8B3] text-xs mb-1">VENDEDOR</p><p className="text-white font-medium">{sale.seller?.name}</p><p className="text-[#A6A8B3] text-xs">{sale.seller?.email}</p></div>
                <div className="bg-[#0B0D12] rounded-xl p-3"><p className="text-[#A6A8B3] text-xs mb-1">PRODUTO</p><p className="text-white font-medium truncate">{sale.product?.title}</p><p className="text-[#A6A8B3] text-xs">Qtd: {sale.product?.quantity} x R$ {sale.product?.price?.toFixed(2)}</p></div>
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-[#A6A8B3]"><span>Pagamento: {sale.payment_method?.toUpperCase()}</span>{sale.tracking_code && <span>Rastreio: {sale.tracking_code}</span>}<span>{new Date(sale.created_at).toLocaleString('pt-BR')}</span></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== NOTIFICATIONS TAB ====================
function AdminNotificationsTab({ token }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const h = { Authorization: `Bearer ${token}` };
  const fetchNotifications = () => { axios.get(`${API}/admin/notifications`, { headers: h }).then(r => { setNotifications(r.data.notifications || []); setUnreadCount(r.data.unread_count || 0); }).catch(() => {}); };
  useEffect(() => { fetchNotifications(); }, []);
  const markAsRead = async (notifId) => { try { await axios.put(`${API}/admin/notifications/${notifId}/read`, {}, { headers: h }); fetchNotifications(); } catch {} };
  return (
    <div data-testid="admin-notifications-tab">
      <SectionHeader title="Notificações do Admin" subtitle={unreadCount > 0 ? `${unreadCount} notificações não lidas` : 'Todas as notificações lidas'} />
      {notifications.length === 0 ? (
        <div className="text-center py-16 bg-[#11131A] rounded-2xl border border-[#1E2230]"><Bell className="w-12 h-12 text-[#6F7280] mx-auto mb-3" /><p className="text-[#A6A8B3]">Nenhuma notificação</p></div>
      ) : (
        <div className="space-y-2">
          {notifications.map(notif => (
            <div key={notif.notification_id} className={`bg-[#11131A] rounded-2xl p-4 cursor-pointer transition-all ${notif.read ? 'opacity-60 border border-[#1E2230]' : 'border-l-4 border-[#D4A24C] border border-[#1E2230]'}`} onClick={() => !notif.read && markAsRead(notif.notification_id)}>
              <div className="flex items-start justify-between"><div className="flex-1"><p className="text-sm text-white font-medium">{notif.message}</p>{notif.buyer_name && <p className="text-xs text-[#A6A8B3] mt-1">Comprador: {notif.buyer_name} | Total: R$ {notif.total?.toFixed(2)}</p>}<p className="text-xs text-[#A6A8B3] mt-1">{new Date(notif.created_at).toLocaleString('pt-BR')}</p></div>{!notif.read && <span className="w-2 h-2 bg-[#D4A24C] rounded-full shrink-0 mt-1"></span>}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== NEWSLETTER TAB ====================
function NewsletterTab({ token }) {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const h = { Authorization: `Bearer ${token}` };
  const fetchSubs = async (q = '') => { setLoading(true); try { const r = await axios.get(`${API}/admin/subscribers${q ? `?search=${encodeURIComponent(q)}` : ''}`, { headers: h }); setSubscribers(r.data.subscribers || []); } catch {} finally { setLoading(false); } };
  useEffect(() => { fetchSubs(); }, []);
  const removeSub = async (id, email) => { if (!window.confirm(`Remover ${email}?`)) return; try { await axios.delete(`${API}/admin/subscribers/${id}`, { headers: h }); toast.success('Inscrito removido'); fetchSubs(search); } catch { toast.error('Erro ao remover'); } };
  const fmtDate = (iso) => { try { return new Date(iso).toLocaleString('pt-BR'); } catch { return iso; } };
  return (
    <div data-testid="admin-newsletter-tab">
      <SectionHeader title="Newsletter" subtitle={`${subscribers.length} inscritos na newsletter`} />
      <form className="flex gap-2 mb-4" onSubmit={e => { e.preventDefault(); fetchSubs(search); }}>
        <Input placeholder="Buscar por email..." value={search} onChange={e => setSearch(e.target.value)} className="bg-[#11131A] border-[#1E2230] text-white" data-testid="search-subscriber-input" />
        <Button type="submit" className="rounded-xl font-semibold" style={{ background: 'linear-gradient(135deg, #D4A24C, #B8882A)', color: '#000' }}>Buscar</Button>
        {search && <Button type="button" onClick={() => { setSearch(''); fetchSubs(''); }} className="bg-[#1E2230] hover:bg-[#2A2C36] text-white rounded-xl">Limpar</Button>}
      </form>
      <div className="bg-[#11131A] border border-[#1E2230] rounded-2xl overflow-hidden">
        {loading ? <div className="py-10 text-center text-[#A6A8B3]">Carregando...</div> : subscribers.length === 0 ? <div className="py-10 text-center text-[#A6A8B3]">Nenhum inscrito {search && 'encontrado'}.</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#0B0D12] text-[#A6A8B3] text-xs uppercase"><tr><th className="text-left px-4 py-3">Email</th><th className="text-left px-4 py-3">Origem</th><th className="text-left px-4 py-3">Data de cadastro</th><th className="text-right px-4 py-3">Ações</th></tr></thead>
              <tbody>{subscribers.map(s => (<tr key={s.subscriber_id} className="border-t border-[#1E2230]"><td className="px-4 py-3 text-white">{s.email}</td><td className="px-4 py-3 text-[#A6A8B3]">{s.source || 'footer'}</td><td className="px-4 py-3 text-[#A6A8B3]">{fmtDate(s.subscribed_at)}</td><td className="px-4 py-3 text-right"><button onClick={() => removeSub(s.subscriber_id, s.email)} className="inline-flex items-center gap-1 text-red-400 hover:text-red-300 text-xs" data-testid={`delete-sub-${s.subscriber_id}`}><Trash2 className="w-3.5 h-3.5" /> Excluir</button></td></tr>))}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== CAMPAIGNS TAB ====================
function CampaignsTab({ token }) {
  const [campaigns, setCampaigns] = useState([]);
  const [form, setForm] = useState({ subject: '', title: '', content: '', button_text: '', button_url: '' });
  const [preview, setPreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const h = { Authorization: `Bearer ${token}` };
  const fetchCampaigns = async () => { setLoading(true); try { const r = await axios.get(`${API}/admin/campaigns`, { headers: h }); setCampaigns(r.data.campaigns || []); } catch {} finally { setLoading(false); } };
  useEffect(() => { fetchCampaigns(); }, []);
  const generatePreview = async () => { if (!form.subject.trim() || !form.title.trim() || !form.content.trim()) { toast.error('Preencha assunto, título e conteúdo'); return; } try { const r = await axios.post(`${API}/admin/campaigns/preview`, form, { headers: h }); setPreview(r.data); setShowPreview(true); } catch (err) { toast.error(err.response?.data?.detail || 'Erro ao gerar preview'); } };
  const sendCampaign = async () => { if (!form.subject.trim() || !form.title.trim() || !form.content.trim()) { toast.error('Preencha assunto, título e conteúdo'); return; } if (!window.confirm('Enviar esta campanha para todos os inscritos?')) return; setSending(true); try { const r = await axios.post(`${API}/admin/campaigns`, form, { headers: h }); toast.success(`Enviado para ${r.data.sent_count} de ${r.data.total_subscribers} inscritos`); setForm({ subject: '', title: '', content: '', button_text: '', button_url: '' }); setShowPreview(false); fetchCampaigns(); } catch (err) { toast.error(err.response?.data?.detail || 'Erro ao enviar'); } finally { setSending(false); } };
  const fmtDate = (iso) => { try { return new Date(iso).toLocaleString('pt-BR'); } catch { return iso; } };
  return (
    <div className="space-y-5" data-testid="admin-campaigns-tab">
      <SectionHeader title="Campanhas de E-mail" subtitle="Crie e envie campanhas de e-mail para todos os inscritos" />
      <div className="bg-[#11131A] border border-[#1E2230] rounded-2xl p-6 space-y-4">
        <h4 className="font-semibold text-white">Nova Campanha</h4>
        <div><Label className="text-[#A6A8B3]">Assunto do e-mail*</Label><Input value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} placeholder="Ex: Ofertas exclusivas só hoje!" className="bg-[#0B0D12] border-[#1E2230] text-white mt-1.5" data-testid="campaign-subject" /></div>
        <div><Label className="text-[#A6A8B3]">Título*</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Ex: Aproveite até 50% OFF" className="bg-[#0B0D12] border-[#1E2230] text-white mt-1.5" data-testid="campaign-title" /></div>
        <div><Label className="text-[#A6A8B3]">Mensagem / Conteúdo*</Label><Textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} placeholder="Escreva a mensagem da campanha..." rows={6} className="bg-[#0B0D12] border-[#1E2230] text-white mt-1.5" data-testid="campaign-content" /></div>
        <div className="grid md:grid-cols-2 gap-3">
          <div><Label className="text-[#A6A8B3]">Texto do botão (opcional)</Label><Input value={form.button_text} onChange={e => setForm({...form, button_text: e.target.value})} placeholder="Ex: Ver ofertas" className="bg-[#0B0D12] border-[#1E2230] text-white mt-1.5" /></div>
          <div><Label className="text-[#A6A8B3]">Link do botão (opcional)</Label><Input value={form.button_url} onChange={e => setForm({...form, button_url: e.target.value})} placeholder="https://..." className="bg-[#0B0D12] border-[#1E2230] text-white mt-1.5" /></div>
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button onClick={generatePreview} className="bg-[#1E2230] hover:bg-[#2A2C36] text-white rounded-xl" data-testid="campaign-preview-btn"><Eye className="w-4 h-4 mr-1" /> Pré-visualizar</Button>
          <Button onClick={sendCampaign} disabled={sending} className="rounded-xl font-semibold" style={{ background: 'linear-gradient(135deg, #D4A24C, #B8882A)', color: '#000' }} data-testid="campaign-send-btn"><Send className="w-4 h-4 mr-1" /> {sending ? 'Enviando...' : 'Enviar para todos os inscritos'}</Button>
        </div>
      </div>
      {showPreview && preview && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowPreview(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-[#0B0D12] px-4 py-3 flex items-center justify-between"><div><p className="text-xs text-[#A6A8B3]">Assunto:</p><p className="text-white font-semibold">{preview.subject}</p></div><button onClick={() => setShowPreview(false)} className="text-white hover:text-[#D4A24C]"><X className="w-5 h-5" /></button></div>
            <div className="overflow-auto max-h-[80vh]"><iframe srcDoc={preview.html} title="preview" className="w-full" style={{ minHeight: '500px', border: 'none' }} /></div>
          </div>
        </div>
      )}
      <div>
        <h4 className="font-semibold text-white mb-3">Histórico de Campanhas</h4>
        {loading ? <div className="py-6 text-center text-[#A6A8B3]">Carregando...</div> : campaigns.length === 0 ? <div className="bg-[#11131A] border border-[#1E2230] rounded-2xl py-8 text-center text-[#A6A8B3]">Nenhuma campanha enviada ainda.</div> : (
          <div className="space-y-2">
            {campaigns.map(c => (
              <div key={c.campaign_id} className="bg-[#11131A] border border-[#1E2230] rounded-2xl p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div className="flex-1 min-w-0"><p className="text-white font-medium truncate">{c.subject}</p><p className="text-xs text-[#6F7280]">{fmtDate(c.created_at)}</p></div>
                  <div className="flex flex-wrap items-center gap-3 text-xs"><span className="px-2 py-1 rounded-lg bg-green-500/20 text-
green-400">✓ {c.sent_count} enviados</span>{c.error_count > 0 && <span className="px-2 py-1 rounded-lg bg-red-500/20 text-red-400">✕ {c.error_count} erros</span>}<span className="text-[#A6A8B3]">{c.total_subscribers} inscritos</span></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== FOOTER CONFIG TAB ====================
function FooterConfigTab({ token }) {
  const [config, setConfig] = useState({ instagram: { url: '', enabled: false }, facebook: { url: '', enabled: false }, twitter: { url: '', enabled: false }, other: { url: '', enabled: false, label: 'Site' } });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const h = { Authorization: `Bearer ${token}` };
  useEffect(() => { axios.get(`${API}/admin/footer-config`, { headers: h }).then(r => { const social = r.data?.social_links || {}; setConfig({ instagram: social.instagram || { url: '', enabled: false }, facebook: social.facebook || { url: '', enabled: false }, twitter: social.twitter || { url: '', enabled: false }, other: social.other || { url: '', enabled: false, label: 'Site' } }); }).catch(() => {}).finally(() => setLoading(false)); }, []);
  const saveConfig = async () => { setSaving(true); try { await axios.put(`${API}/admin/footer-config`, { social_links: config }, { headers: h }); toast.success('Configuração do rodapé salva'); } catch (err) { toast.error(err.response?.data?.detail || 'Erro ao salvar'); } finally { setSaving(false); } };
  if (loading) return <div className="py-8 text-center text-[#A6A8B3]">Carregando...</div>;
  const fields = [{ key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/sua-conta' }, { key: 'facebook', label: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/sua-pagina' }, { key: 'twitter', label: 'Twitter / X', icon: Twitter, placeholder: 'https://twitter.com/sua-conta' }, { key: 'other', label: 'Outro link / Site', icon: Globe, placeholder: 'https://seusite.com' }];
  return (
    <div className="max-w-3xl space-y-5" data-testid="admin-footer-config-tab">
      <SectionHeader title="Configurações do Rodapé" subtitle="Configure os links sociais que aparecem no rodapé da plataforma" />
      <div className="bg-[#11131A] border border-[#1E2230] rounded-2xl p-6 space-y-5">
        {fields.map(f => {
          const Icon = f.icon;
          const v = config[f.key] || { url: '', enabled: false };
          return (
            <div key={f.key} className="border-b border-[#1E2230] last:border-b-0 pb-5 last:pb-0">
              <div className="flex items-center justify-between mb-2"><Label className="text-white flex items-center gap-2"><Icon className="w-4 h-4 text-[#D4A24C]" /> {f.label}</Label><Switch checked={v.enabled} onCheckedChange={(checked) => setConfig({...config, [f.key]: { ...v, enabled: checked }})} data-testid={`switch-${f.key}`} /></div>
              <Input value={v.url || ''} onChange={e => setConfig({...config, [f.key]: { ...v, url: e.target.value }})} placeholder={f.placeholder} className="bg-[#0B0D12] border-[#1E2230] text-white" data-testid={`input-${f.key}`} />
              {f.key === 'other' && <Input value={v.label || ''} onChange={e => setConfig({...config, other: { ...v, label: e.target.value }})} placeholder="Rótulo (ex: Site, Blog, YouTube)" className="bg-[#0B0D12] border-[#1E2230] text-white mt-2" />}
            </div>
          );
        })}
        <Button onClick={saveConfig} disabled={saving} className="rounded-xl font-semibold" style={{ background: 'linear-gradient(135deg, #D4A24C, #B8882A)', color: '#000' }} data-testid="save-footer-btn"><Save className="w-4 h-4 mr-1" /> {saving ? 'Salvando...' : 'Salvar configuração'}</Button>
      </div>
    </div>
  );
}

// ==================== SIDEBAR NAVIGATION ====================
const sidebarItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'Usuários', icon: Users },
  { id: 'admin-products', label: 'Produtos', icon: Package },
  { id: 'ads', label: 'Anúncios', icon: Megaphone },
  { id: 'orders', label: 'Pedidos', icon: ShoppingBag },
  { id: 'stores', label: 'Lojas', icon: Store },
  { id: 'financial', label: 'Financeiro', icon: DollarSign },
  { id: 'commissions', label: 'Comissões', icon: CreditCard },
  { id: 'withdrawals', label: 'Saques', icon: Wallet },
  { id: 'reports', label: 'Denúncias', icon: AlertTriangle },
  { id: 'support', label: 'Suporte', icon: Headphones },
  { id: 'coupons', label: 'Cupons', icon: Gift },
  { id: 'notifications', label: 'Notificações', icon: Bell },
  { id: 'sales', label: 'Relatórios', icon: BarChart3 },
  { id: 'theme', label: 'Configurações', icon: Settings },
  { id: 'finance-pro', label: 'Integrações', icon: Layers },
  // Extra tabs
  { id: 'wallet-manage', label: 'Saldo', icon: Wallet, hidden: true },
  { id: 'escrow', label: 'Escrow', icon: UnlockKeyhole, hidden: true },
  { id: 'tracking', label: 'Rastreio', icon: Truck, hidden: true },
  { id: 'affiliate-control', label: 'Afiliados', icon: UserCog, hidden: true },
  { id: 'shipping', label: 'Frete', icon: Truck, hidden: true },
  { id: 'pages', label: 'Páginas', icon: FileText, hidden: true },
  { id: 'newsletter', label: 'Newsletter', icon: Mail, hidden: true },
  { id: 'campaigns', label: 'Campanhas', icon: Send, hidden: true },
  { id: 'footer-config', label: 'Rodapé', icon: Globe, hidden: true },
  { id: 'plans', label: 'Planos', icon: Crown, hidden: true },
];

// ==================== MAIN ADMIN PAGE ====================
export default function AdminPage() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [platform, setPlatform] = useState('marketplace');
  const [showPlatformMenu, setShowPlatformMenu] = useState(false);
  const [counts, setCounts] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const platformMenuRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    if (token) {
      axios.get(`${API}/admin/notification-counts`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => setCounts(r.data || {}))
        .catch(() => {});
      axios.get(`${API}/admin/notifications`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => { setNotifications((r.data.notifications || []).slice(0, 8)); setUnreadCount(r.data.unread_count || 0); })
        .catch(() => {});
    }
  }, [token]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (platformMenuRef.current && !platformMenuRef.current.contains(e.target)) setShowPlatformMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardTab token={token} platform={platform} />;
      case 'sales': return <SalesDashboardTab token={token} />;
      case 'orders': return <OrdersTab token={token} />;
      case 'wallet-manage': return <WalletManagementTab token={token} />;
      case 'escrow': return <EscrowTab token={token} />;
      case 'tracking': return <TrackingTab token={token} />;
      case 'affiliate-control': return <AffiliateControlTab token={token} />;
      case 'notifications': return <AdminNotificationsTab token={token} />;
      case 'users': return <UsersTab token={token} />;
      case 'stores': return <StoresTab token={token} />;
      case 'admin-products': return <AdminProductsTab token={token} />;
      case 'withdrawals': return <WithdrawalsTab token={token} />;
      case 'commissions': return <CommissionsTab token={token} />;
      case 'shipping': return <ShippingTab token={token} />;
      case 'theme': return <ThemeTab token={token} />;
      case 'ads': return <AdsTab token={token} />;
      case 'support': return <SupportTab token={token} />;
      case 'pages': return <PagesTab token={token} />;
      case 'newsletter': return <NewsletterTab token={token} />;
      case 'campaigns': return <CampaignsTab token={token} />;
      case 'footer-config': return <FooterConfigTab token={token} />;
      case 'financial': return <FinancialSettingsTab token={token} />;
      case 'finance-pro': return <FinanceModule token={token} />;
      case 'plans': return <PromotionPlansModule token={token} />;
      case 'reports': return (
        <div data-testid="admin-reports-tab">
          <SectionHeader title="Denúncias" subtitle="Gerencie as denúncias recebidas na plataforma" />
          <div className="text-center py-16 bg-[#11131A] rounded-2xl border border-[#1E2230]">
            <AlertTriangle className="w-12 h-12 text-[#6F7280] mx-auto mb-3" />
            <p className="text-[#A6A8B3]">Nenhuma denúncia pendente</p>
          </div>
        </div>
      );
      case 'coupons': return (
        <div data-testid="admin-coupons-tab">
          <SectionHeader title="Cupons" subtitle="Gerencie os cupons de desconto da plataforma" />
          <div className="text-center py-16 bg-[#11131A] rounded-2xl border border-[#1E2230]">
            <Gift className="w-12 h-12 text-[#6F7280] mx-auto mb-3" />
            <p className="text-[#A6A8B3]">Nenhum cupom cadastrado</p>
          </div>
        </div>
      );
      default: return <DashboardTab token={token} platform={platform} />;
    }
  };

  const visibleSidebarItems = sidebarItems.filter(item => !item.hidden);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0B0D12' }} data-testid="admin-page">
      {/* SIDEBAR */}
      <aside
        className={`flex flex-col shrink-0 transition-all duration-300 border-r border-[#1E2230] ${sidebarOpen ? 'w-[220px]' : 'w-[64px]'}`}
        style={{ background: '#0D0F16' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-[#1E2230] min-h-[64px]">
          <img src="/brand/logo-3d.png" alt="B Livre" className="w-9 h-9 object-contain shrink-0" />
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white leading-tight font-['Outfit']">B LIVRE</p>
              <p className="text-[10px] text-[#D4A24C] uppercase tracking-widest">Painel Admin</p>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {visibleSidebarItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const badgeCount = counts[item.id] || 0;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative ${
                  isActive
                    ? 'text-black font-semibold'
                    : 'text-[#A6A8B3] hover:text-white hover:bg-[#1E2230]/60'
                }`}
                style={isActive ? { background: 'linear-gradient(135deg, #D4A24C, #B8882A)' } : {}}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
                {sidebarOpen && badgeCount > 0 && (
                  <span className="ml-auto min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
                {!sidebarOpen && badgeCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Ver Site Button */}
        <div className="p-3 border-t border-[#1E2230]">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all border border-[#D4A24C]/40 text-[#D4A24C] hover:bg-[#D4A24C]/10 ${sidebarOpen ? '' : 'justify-center'}`}
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            {sidebarOpen && <span>Ver site</span>}
          </a>
          {sidebarOpen && (
            <div className="flex items-center gap-2 mt-3 px-1">
              <div className="w-7 h-7 rounded-full bg-[#D4A24C]/20 flex items-center justify-center shrink-0">
                <Users className="w-3.5 h-3.5 text-[#D4A24C]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-white truncate">B Livre Marketplace</p>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <p className="text-[10px] text-[#A6A8B3]">Plataforma ativa</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* HEADER */}
        <header className="flex items-center gap-4 px-6 py-3 border-b border-[#1E2230] shrink-0 min-h-[64px]" style={{ background: '#0D0F16' }}>
          {/* Sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#A6A8B3] hover:text-white hover:bg-[#1E2230] transition-all shrink-0"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Platform label */}
          <span className="text-sm text-[#A6A8B3] shrink-0">Plataforma:</span>

          {/* Platform Selector */}
          <div className="relative shrink-0" ref={platformMenuRef}>
            <button
              onClick={() => setShowPlatformMenu(!showPlatformMenu)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all"
              style={{ borderColor: '#D4A24C', color: '#D4A24C', background: 'rgba(212,162,76,0.08)' }}
            >
              {platform === 'marketplace' ? 'Marketplace' : 'B Livre'}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {showPlatformMenu && (
              <div className="absolute top-full left-0 mt-1 w-44 rounded-xl border border-[#1E2230] shadow-2xl z-50 overflow-hidden" style={{ background: '#0D0F16' }}>
                <button onClick={() => { setPlatform('marketplace'); setShowPlatformMenu(false); }} className={`w-full text-left px-4 py-3 text-sm transition-all hover:bg-[#1E2230] ${platform === 'marketplace' ? 'text-[#D4A24C] font-semibold' : 'text-white'}`}>Marketplace</button>
                <button onClick={() => { setPlatform('blivre'); setShowPlatformMenu(false); }} className={`w-full text-left px-4 py-3 text-sm transition-all hover:bg-[#1E2230] ${platform === 'blivre' ? 'text-[#D4A24C] font-semibold' : 'text-white'}`}>B Livre</button>
              </div>
            )}
          </div>

          {/* Search */}
          <div className="flex-1 max-w-sm relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6F7280]" />
            <input
              type="text"
              placeholder="Buscar no painel..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#11131A] border border-[#1E2230] text-white text-sm placeholder-[#6F7280] focus:outline-none focus:border-[#D4A24C]/50 transition-all"
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-[#11131A] border border-[#1E2230] text-[#A6A8B3] hover:text-white hover:border-[#D4A24C]/50 transition-all"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 inline-flex items-center justify-center text-[9px] font-bold bg-red-500 text-white rounded-full">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 rounded-2xl border border-[#1E2230] shadow-2xl z-50 overflow-hidden" style={{ background: '#0D0F16' }}>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#1E2230]">
                    <p className="text-sm font-semibold text-white">Notificações</p>
                    {unreadCount > 0 && <span className="text-xs text-[#D4A24C]">{unreadCount} novas</span>}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-[#A6A8B3] text-sm">Nenhuma notificação</div>
                    ) : notifications.map(n => (
                      <div key={n.notification_id} className={`px-4 py-3 border-b border-[#1E2230]/50 last:border-0 hover:bg-[#1E2230]/40 transition-all ${!n.read ? 'border-l-2 border-l-[#D4A24C]' : ''}`}>
                        <p className="text-xs text-white font-medium">{n.message}</p>
                        <p className="text-[10px] text-[#6F7280] mt-0.5">{new Date(n.created_at).toLocaleString('pt-BR')}</p>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-2 border-t border-[#1E2230]">
                    <button onClick={() => { setActiveTab('notifications'); setNotifOpen(false); }} className="text-xs text-[#D4A24C] hover:underline w-full text-center">Ver todas as notificações</button>
                  </div>
                </div>
              )}
            </div>

            {/* Messages icon */}
            <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#11131A] border border-[#1E2230] text-[#A6A8B3] hover:text-white hover:border-[#D4A24C]/50 transition-all relative">
              <Mail className="w-4 h-4" />
              {(counts.support || 0) > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 inline-flex items-center justify-center text-[9px] font-bold bg-[#D4A24C] text-black rounded-full">
                  {counts.support > 9 ? '9+' : counts.support}
                </span>
              )}
            </button>

            {/* Admin Profile */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#11131A] border border-[#1E2230] cursor-pointer hover:border-[#D4A24C]/50 transition-all">
              <div className="w-7 h-7 rounded-full bg-[#D4A24C]/20 flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-[#D4A24C]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white leading-tight">Admin</p>
                <p className="text-[10px] text-[#A6A8B3]">Super Administrador</p>
              </div>
              <svg className="w-3 h-3 text-[#6F7280] ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto p-6" style={{ background: '#0B0D12' }}>
          {renderTab()}
        </main>
      </div>
    </div>
  );
}
