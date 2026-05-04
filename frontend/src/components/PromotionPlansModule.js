import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit, Check, X, Crown, DollarSign, Clock, Star, TrendingUp, MessageCircle, Package } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const BENEFIT_DEFS = [
  { key: 'home_highlight', label: 'Destaque na home', icon: Star },
  { key: 'footer_banner', label: 'Banner fixo no rodapé', icon: TrendingUp },
  { key: 'search_boost', label: 'Boost em busca', icon: Package },
  { key: 'priority_support', label: 'Suporte prioritário', icon: MessageCircle },
];

export default function PromotionPlansModule({ token }) {
  const [plans, setPlans] = useState([]);
  const [subs, setSubs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [tab, setTab] = useState('plans'); // plans | subs
  const [form, setForm] = useState({
    name: '', price: 29.9, duration_days: 30, description: '',
    benefits: { home_highlight: true, footer_banner: true, search_boost: true, priority_support: false }
  });
  const h = { Authorization: `Bearer ${token}` };

  const load = async () => {
    try {
      const [p, s] = await Promise.all([
        axios.get(`${API}/admin/promotion-plans`, { headers: h }),
        axios.get(`${API}/admin/subscriptions`, { headers: h })
      ]);
      setPlans(p.data.plans || []);
      setSubs(s.data.subscriptions || []);
    } catch { toast.error('Erro ao carregar planos'); }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ name: '', price: 29.9, duration_days: 30, description: '', benefits: { home_highlight: true, footer_banner: true, search_boost: true, priority_support: false } });
    setEditing(null);
    setShowForm(false);
  };

  const save = async () => {
    if (!form.name?.trim()) { toast.error('Nome obrigatório'); return; }
    try {
      if (editing) {
        await axios.put(`${API}/admin/promotion-plans/${editing}`, form, { headers: h });
        toast.success('Plano atualizado!');
      } else {
        await axios.post(`${API}/admin/promotion-plans`, form, { headers: h });
        toast.success('Plano criado!');
      }
      resetForm();
      load();
    } catch (e) { toast.error(e.response?.data?.detail || 'Erro ao salvar'); }
  };

  const remove = async (id) => {
    if (!window.confirm('Remover este plano?')) return;
    await axios.delete(`${API}/admin/promotion-plans/${id}`, { headers: h });
    toast.success('Plano removido');
    load();
  };

  const toggleActive = async (p) => {
    await axios.put(`${API}/admin/promotion-plans/${p.plan_id}`, { active: !p.active }, { headers: h });
    load();
  };

  const edit = (p) => {
    setEditing(p.plan_id);
    setForm({
      name: p.name, price: p.price, duration_days: p.duration_days,
      description: p.description || '', benefits: p.benefits || {}
    });
    setShowForm(true);
  };

  const approveSub = async (id) => {
    await axios.put(`${API}/admin/subscriptions/${id}/approve`, {}, { headers: h });
    toast.success('Assinatura aprovada!');
    load();
  };
  const rejectSub = async (id) => {
    if (!window.confirm('Rejeitar assinatura?')) return;
    await axios.put(`${API}/admin/subscriptions/${id}/reject`, {}, { headers: h });
    toast.success('Assinatura rejeitada');
    load();
  };

  const pendingCount = subs.filter(s => s.status === 'pending').length;

  return (
    <div className="space-y-4" data-testid="promotion-plans-module">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="brane-label mb-1">Monetização</p>
          <h3 className="text-xl font-bold text-white font-['Outfit'] flex items-center gap-2">
            <Crown className="w-5 h-5 text-[#D4A24C]" /> Planos de Promoção para Vendedores
          </h3>
          <p className="text-xs text-[#A6A8B3] mt-1">Crie planos mensais. Vendedores pagam para promover loja/produtos.</p>
        </div>
        {tab === 'plans' && (
          <button onClick={() => { setShowForm(!showForm); setEditing(null); }} className="brane-btn-primary" data-testid="new-plan-btn">
            <Plus className="w-4 h-4" /> {showForm ? 'Cancelar' : 'Novo plano'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#0B0D12] border border-[#1E2230] rounded-full p-1 w-fit">
        <button onClick={() => setTab('plans')} className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${tab === 'plans' ? 'bg-[#D4A24C] text-black' : 'text-[#A6A8B3]'}`} data-testid="tab-plans">Planos ({plans.length})</button>
        <button onClick={() => setTab('subs')} className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${tab === 'subs' ? 'bg-[#D4A24C] text-black' : 'text-[#A6A8B3]'}`} data-testid="tab-subs">
          Assinaturas ({subs.length}){pendingCount > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#FF5C7A] text-white text-[10px]">{pendingCount}</span>}
        </button>
      </div>

      {/* Create/Edit form */}
      {tab === 'plans' && showForm && (
        <div className="brane-card p-5 space-y-3 brane-fade-in">
          <h4 className="text-white font-semibold">{editing ? 'Editar plano' : 'Novo plano'}</h4>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label className="text-[#A6A8B3] text-xs uppercase tracking-wider">Nome</Label>
              <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ex: Plano Pro" className="mt-1.5 bg-[#11131A] border-[#1E2230] text-white" data-testid="plan-name" /></div>
            <div><Label className="text-[#A6A8B3] text-xs uppercase tracking-wider">Preço (R$)</Label>
              <Input type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: parseFloat(e.target.value) || 0})} className="mt-1.5 bg-[#11131A] border-[#1E2230] text-white" data-testid="plan-price" /></div>
            <div><Label className="text-[#A6A8B3] text-xs uppercase tracking-wider">Duração (dias)</Label>
              <Input type="number" value={form.duration_days} onChange={e => setForm({...form, duration_days: parseInt(e.target.value) || 30})} className="mt-1.5 bg-[#11131A] border-[#1E2230] text-white" data-testid="plan-duration" /></div>
            <div className="sm:col-span-2"><Label className="text-[#A6A8B3] text-xs uppercase tracking-wider">Descrição</Label>
              <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="O que o vendedor ganha com esse plano..." className="mt-1.5 bg-[#11131A] border-[#1E2230] text-white" rows={2} /></div>
          </div>
          <div className="pt-2">
            <p className="text-xs text-[#A6A8B3] uppercase tracking-wider mb-2">Benefícios inclusos</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {BENEFIT_DEFS.map(b => (
                <label key={b.key} className="flex items-center gap-3 p-3 rounded-xl bg-[#11131A] border border-[#1E2230]">
                  <Switch checked={!!form.benefits[b.key]} onCheckedChange={v => setForm({...form, benefits: {...form.benefits, [b.key]: v}})} data-testid={`plan-benefit-${b.key}`} />
                  <b.icon className="w-4 h-4 text-[#D4A24C]" />
                  <span className="text-sm text-[#E6E6EA]">{b.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={resetForm} className="brane-btn-dark">Cancelar</button>
            <button onClick={save} className="brane-btn-primary" data-testid="plan-save">{editing ? 'Salvar alterações' : 'Criar plano'}</button>
          </div>
        </div>
      )}

      {/* Plans list */}
      {tab === 'plans' && (plans.length === 0 ? (
        <div className="brane-card p-10 text-center">
          <Crown className="w-10 h-10 text-[#6F7280] mx-auto mb-3" />
          <p className="text-[#A6A8B3]">Nenhum plano criado.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {plans.map(p => (
            <div key={p.plan_id} className="brane-card p-5 relative" data-testid={`plan-card-${p.plan_id}`}>
              {!p.active && <span className="absolute top-3 right-3 brane-badge brane-badge-red">Inativo</span>}
              <h4 className="text-lg font-bold text-white font-['Outfit']">{p.name}</h4>
              <div className="flex items-baseline gap-1 my-2">
                <span className="text-xs text-[#6F7280]">R$</span>
                <span className="text-2xl font-bold text-[#D4A24C]">{p.price.toFixed(2).replace('.',',')}</span>
                <span className="text-xs text-[#A6A8B3]">/ {p.duration_days} dias</span>
              </div>
              {p.description && <p className="text-xs text-[#A6A8B3] mb-3">{p.description}</p>}
              <div className="space-y-1 mb-4">
                {BENEFIT_DEFS.filter(b => p.benefits?.[b.key]).map(b => (
                  <div key={b.key} className="flex items-center gap-2 text-xs text-[#E6E6EA]">
                    <Check className="w-3.5 h-3.5 text-[#10A875]" /> {b.label}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => edit(p)} className="brane-btn-dark flex-1" data-testid={`plan-edit-${p.plan_id}`}><Edit className="w-3.5 h-3.5" /> Editar</button>
                <button onClick={() => toggleActive(p)} className="brane-btn-dark flex-1" data-testid={`plan-toggle-${p.plan_id}`}>{p.active ? 'Desativar' : 'Ativar'}</button>
                <button onClick={() => remove(p.plan_id)} className="brane-btn-dark text-[#FF6F8A]" data-testid={`plan-delete-${p.plan_id}`}><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* Subscriptions table */}
      {tab === 'subs' && (
        <div className="brane-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#11131A] text-[#A6A8B3] text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Vendedor</th>
                  <th className="text-left px-4 py-3">Plano</th>
                  <th className="text-right px-4 py-3">Valor</th>
                  <th className="text-left px-4 py-3">Pagamento</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {subs.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-[#A6A8B3]">Nenhuma assinatura ainda</td></tr>
                ) : subs.map(s => {
                  const statusCls = s.status === 'active' ? 'brane-badge-green' : s.status === 'pending' ? 'brane-badge-orange' : s.status === 'rejected' ? 'brane-badge-red' : '';
                  return (
                    <tr key={s.subscription_id} className="border-t border-[#1E2230]" data-testid={`sub-row-${s.subscription_id}`}>
                      <td className="px-4 py-3">
                        <p className="text-white font-medium">{s.seller_name || '—'}</p>
                        <p className="text-xs text-[#6F7280]">{s.seller_email}</p>
                      </td>
                      <td className="px-4 py-3 text-[#E6E6EA]">{s.plan_name}</td>
                      <td className="px-4 py-3 text-right text-[#D4A24C] font-semibold">R$ {Number(s.plan_price).toFixed(2)}</td>
                      <td className="px-4 py-3 text-[#A6A8B3]">{s.payment_method === 'wallet' ? 'Carteira' : 'PIX'}</td>
                      <td className="px-4 py-3"><span className={`brane-badge ${statusCls}`}>{s.status.toUpperCase()}</span></td>
                      <td className="px-4 py-3 text-right">
                        {s.status === 'pending' ? (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => approveSub(s.subscription_id)} className="brane-btn-primary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.72rem' }} data-testid={`sub-approve-${s.subscription_id}`}><Check className="w-3 h-3" /> Aprovar</button>
                            <button onClick={() => rejectSub(s.subscription_id)} className="brane-btn-dark text-[#FF6F8A]" data-testid={`sub-reject-${s.subscription_id}`}><X className="w-3 h-3" /></button>
                          </div>
                        ) : (
                          <span className="text-xs text-[#6F7280]">{s.paid_at ? new Date(s.paid_at).toLocaleDateString('pt-BR') : '—'}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
