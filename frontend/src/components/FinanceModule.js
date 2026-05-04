import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Building2, Landmark, KeyRound, Plug, Percent, Banknote, FileText, Shield,
  BarChart3, RefreshCw, Save, Plus, Trash2, Star, CheckCircle, XCircle, Lock,
  DollarSign, TrendingUp, Clock, AlertCircle
} from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SECTIONS = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'company', label: 'Empresa', icon: Building2 },
  { id: 'bank', label: 'Banco', icon: Landmark },
  { id: 'pix', label: 'Chaves PIX', icon: KeyRound },
  { id: 'gateways', label: 'Gateways', icon: Plug },
  { id: 'payout', label: 'Repasse', icon: Percent },
  { id: 'withdrawals', label: 'Saques', icon: Banknote },
  { id: 'receipts', label: 'Comprovantes', icon: FileText },
  { id: 'security', label: 'Segurança', icon: Shield },
];

const GATEWAYS = [
  { id: 'mercadopago', name: 'Mercado Pago', color: '#00B1EA' },
  { id: 'pagseguro', name: 'PagSeguro', color: '#FDB913' },
  { id: 'stripe', name: 'Stripe', color: '#635BFF' },
  { id: 'asaas', name: 'Asaas', color: '#0097E0' },
  { id: 'pagarme', name: 'Pagar.me', color: '#65A300' },
  { id: 'paypal', name: 'PayPal', color: '#003087' },
];

const PIX_TYPES = [
  { v: 'cpf', l: 'CPF' }, { v: 'cnpj', l: 'CNPJ' }, { v: 'email', l: 'E-mail' },
  { v: 'phone', l: 'Telefone' }, { v: 'random', l: 'Aleatória' }
];

const BRAZIL_STATES = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

export default function FinanceModule({ token }) {
  const [settings, setSettings] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [section, setSection] = useState('dashboard');

  const headers = { Authorization: `Bearer ${token}` };

  const load = async () => {
    setLoading(true);
    try {
      const [s, d] = await Promise.all([
        axios.get(`${API}/admin/finance/settings`, { headers }),
        axios.get(`${API}/admin/finance/dashboard`, { headers })
      ]);
      setSettings(s.data);
      setDashboard(d.data);
    } catch (e) {
      toast.error('Erro ao carregar configurações financeiras');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const saveSection = async (sectionKey, payload) => {
    setSaving(true);
    try {
      const res = await axios.put(`${API}/admin/finance/settings`, { [sectionKey]: payload }, { headers });
      setSettings(res.data.settings);
      toast.success('Configurações salvas!');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Erro ao salvar');
    } finally { setSaving(false); }
  };

  if (loading || !settings) {
    return <div className="py-10 text-center text-[#A6A8B3]">Carregando módulo financeiro...</div>;
  }

  const locked = settings.security?.lock_sensitive_edit;

  return (
    <div className="space-y-5" data-testid="finance-module">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="brane-label mb-1">Gestão Financeira</p>
          <h2 className="text-2xl font-bold text-white font-['Outfit']">Configuração de Pagamentos</h2>
          <p className="text-xs text-[#6F7280] mt-1">Preparado para operação com CPF ou CNPJ, migração sem quebrar integrações.</p>
        </div>
        <button onClick={load} className="brane-btn-dark" data-testid="finance-refresh">
          <RefreshCw className="w-4 h-4" /> Atualizar
        </button>
      </div>

      {locked && (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-[#FF5C7A]/40 bg-[#FF5C7A]/10">
          <Lock className="w-4 h-4 text-[#FF5C7A]" />
          <p className="text-sm text-[#FF8FA3]">Edição de dados sensíveis bloqueada. Desative em <strong>Segurança</strong> para editar.</p>
        </div>
      )}

      <Tabs value={section} onValueChange={setSection} className="w-full">
        <TabsList className="flex flex-wrap gap-1 bg-[#0B0D12] border border-[#1E2230] rounded-xl p-1 mb-4 h-auto">
          {SECTIONS.map(s => {
            const Icon = s.icon;
            return (
              <TabsTrigger
                key={s.id}
                value={s.id}
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#5B1CB5] data-[state=active]:to-[#6D28D9] data-[state=active]:text-white text-[#A6A8B3]"
                data-testid={`finance-tab-${s.id}`}
              >
                <Icon className="w-4 h-4 mr-1" /> {s.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="dashboard"><FinDashboard d={dashboard} /></TabsContent>
        <TabsContent value="company"><CompanySection data={settings.company} save={d => saveSection('company', d)} saving={saving} locked={locked} /></TabsContent>
        <TabsContent value="bank"><BankSection data={settings.bank} save={d => saveSection('bank', d)} saving={saving} locked={locked} /></TabsContent>
        <TabsContent value="pix"><PixSection keys={settings.pix_keys || []} token={token} reload={load} /></TabsContent>
        <TabsContent value="gateways"><GatewaysSection data={settings.gateways} save={d => saveSection('gateways', d)} saving={saving} /></TabsContent>
        <TabsContent value="payout"><PayoutSection data={settings.payout} save={d => saveSection('payout', d)} saving={saving} /></TabsContent>
        <TabsContent value="withdrawals"><WithdrawalsCfg data={settings.withdrawals_config} save={d => saveSection('withdrawals_config', d)} saving={saving} /></TabsContent>
        <TabsContent value="receipts"><ReceiptsSection data={settings.receipts} save={d => saveSection('receipts', d)} saving={saving} /></TabsContent>
        <TabsContent value="security"><SecuritySection data={settings.security} save={d => saveSection('security', d)} saving={saving} token={token} /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ================= DASHBOARD ================= */
function FinDashboard({ d }) {
  if (!d) return <div className="py-6 text-[#A6A8B3]">Carregando dashboard...</div>;
  const brl = (v) => `R$ ${Number(v || 0).toFixed(2)}`;
  const cards = [
    { label: 'Saldo total', value: brl(d.balance_total), icon: DollarSign, color: '#D4A24C' },
    { label: 'Saldo disponível', value: brl(d.balance_available), icon: TrendingUp, color: '#10A875' },
    { label: 'Saldo retido', value: brl(d.balance_held), icon: Clock, color: '#F5B642' },
    { label: 'Vendas hoje', value: brl(d.sales_today?.amount), sub: `${d.sales_today?.count} pedidos`, icon: TrendingUp, color: '#6D28D9' },
    { label: 'Vendas do mês', value: brl(d.sales_month?.amount), sub: `${d.sales_month?.count} pedidos`, icon: BarChart3, color: '#5B1CB5' },
    { label: 'Pendentes', value: brl(d.pending?.amount), sub: `${d.pending?.count} aguardando`, icon: AlertCircle, color: '#D4A24C' },
    { label: 'Canceladas', value: brl(d.cancelled?.amount), sub: `${d.cancelled?.count} pedidos`, icon: XCircle, color: '#FF5C7A' },
    { label: 'Saques pendentes', value: d.withdrawals_pending, icon: Clock, color: '#D4A24C' },
    { label: 'Saques concluídos', value: d.withdrawals_completed, icon: CheckCircle, color: '#10A875' },
    { label: 'Comissões geradas', value: d.commissions_count, icon: Percent, color: '#6D28D9' },
    { label: 'Reembolsos', value: d.refunds_count, icon: RefreshCw, color: '#A6A8B3' },
    { label: 'Chargebacks', value: d.chargebacks_count, icon: AlertCircle, color: '#FF5C7A' },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div key={i} className="brane-card p-4" data-testid={`fin-stat-${i}`}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-4 h-4" style={{ color: c.color }} />
              <span className="text-xs text-[#A6A8B3]">{c.label}</span>
            </div>
            <p className="text-xl font-bold text-white">{c.value}</p>
            {c.sub && <p className="text-[11px] text-[#6F7280] mt-1">{c.sub}</p>}
          </div>
        );
      })}
    </div>
  );
}

/* ================= COMPANY ================= */
function CompanySection({ data, save, saving, locked }) {
  const [f, setF] = useState(data || {});
  useEffect(() => setF(data || {}), [data]);
  const on = (k, v) => !locked && setF(prev => ({ ...prev, [k]: v }));
  const isCNPJ = f.document_type === 'cnpj';
  return (
    <div className="brane-card p-6 space-y-4">
      <SectionHeader title="Dados da Empresa" subtitle="Estrutura pronta para CPF ou CNPJ. Você pode começar como Pessoa Física e migrar para PJ sem refazer nada." />
      <div className="flex items-center gap-3 p-3 rounded-xl bg-[#11131A] border border-[#1E2230]">
        <span className="text-sm text-[#A6A8B3]">Tipo de operação:</span>
        <div className="flex gap-2">
          <button onClick={() => on('document_type', 'cpf')} disabled={locked} className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${!isCNPJ ? 'bg-[#D4A24C] text-black' : 'bg-[#11131A] text-[#A6A8B3] border border-[#1E2230]'}`} data-testid="docType-cpf">CPF</button>
          <button onClick={() => on('document_type', 'cnpj')} disabled={locked} className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${isCNPJ ? 'bg-[#D4A24C] text-black' : 'bg-[#11131A] text-[#A6A8B3] border border-[#1E2230]'}`} data-testid="docType-cnpj">CNPJ</button>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Nome da empresa" value={f.name} onChange={v => on('name', v)} testId="company-name" />
        <Field label="Nome fantasia" value={f.trade_name} onChange={v => on('trade_name', v)} testId="company-trade" />
        {isCNPJ ? (
          <>
            <Field label="Razão social" value={f.legal_name} onChange={v => on('legal_name', v)} testId="company-legal" />
            <Field label="CNPJ" value={f.cnpj} onChange={v => on('cnpj', v)} placeholder="00.000.000/0000-00" testId="company-cnpj" />
            <Field label="Inscrição estadual (opcional)" value={f.ie} onChange={v => on('ie', v)} testId="company-ie" />
            <Field label="Inscrição municipal (opcional)" value={f.im} onChange={v => on('im', v)} testId="company-im" />
          </>
        ) : (
          <Field label="CPF" value={f.cpf} onChange={v => on('cpf', v)} placeholder="000.000.000-00" testId="company-cpf" />
        )}
        <Field label="E-mail financeiro" type="email" value={f.email} onChange={v => on('email', v)} testId="company-email" />
        <Field label="Telefone financeiro" value={f.phone} onChange={v => on('phone', v)} placeholder="(11) 99999-9999" testId="company-phone" />
        <Field label="Endereço completo" value={f.address} onChange={v => on('address', v)} className="sm:col-span-2" testId="company-address" />
        <Field label="CEP" value={f.zip_code} onChange={v => on('zip_code', v)} testId="company-zip" />
        <Field label="Cidade" value={f.city} onChange={v => on('city', v)} testId="company-city" />
        <div>
          <Label className="text-[#A6A8B3] text-xs uppercase tracking-wider">Estado</Label>
          <select value={f.state || ''} onChange={e => on('state', e.target.value)} disabled={locked} className="w-full h-10 mt-1.5 px-3 rounded-md bg-[#11131A] border border-[#1E2230] text-white text-sm" data-testid="company-state">
            <option value="">Selecione</option>
            {BRAZIL_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <Field label="País" value={f.country} onChange={v => on('country', v)} testId="company-country" />
      </div>
      <SaveBtn onClick={() => save(f)} saving={saving} locked={locked} testId="save-company" />
    </div>
  );
}

/* ================= BANK ================= */
function BankSection({ data, save, saving, locked }) {
  const [f, setF] = useState(data || {});
  useEffect(() => setF(data || {}), [data]);
  const on = (k, v) => !locked && setF(prev => ({ ...prev, [k]: v }));
  return (
    <div className="brane-card p-6 space-y-4">
      <SectionHeader title="Dados Bancários" subtitle="Conta principal onde a plataforma recebe os repasses." />
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Banco" value={f.bank_name} onChange={v => on('bank_name', v)} placeholder="Ex: Itaú" testId="bank-name" />
        <Field label="Código do banco" value={f.bank_code} onChange={v => on('bank_code', v)} placeholder="Ex: 341" testId="bank-code" />
        <div>
          <Label className="text-[#A6A8B3] text-xs uppercase tracking-wider">Tipo de conta</Label>
          <select value={f.account_type || 'corrente'} onChange={e => on('account_type', e.target.value)} disabled={locked} className="w-full h-10 mt-1.5 px-3 rounded-md bg-[#11131A] border border-[#1E2230] text-white text-sm" data-testid="bank-account-type">
            <option value="corrente">Corrente</option>
            <option value="poupanca">Poupança</option>
            <option value="pj">PJ</option>
          </select>
        </div>
        <Field label="Agência" value={f.agency} onChange={v => on('agency', v)} testId="bank-agency" />
        <Field label="Conta" value={f.account} onChange={v => on('account', v)} testId="bank-account" />
        <Field label="Dígito" value={f.account_digit} onChange={v => on('account_digit', v)} testId="bank-digit" />
        <Field label="Nome do titular" value={f.holder_name} onChange={v => on('holder_name', v)} className="sm:col-span-2" testId="bank-holder-name" />
        <Field label="Documento do titular (CPF/CNPJ)" value={f.holder_document} onChange={v => on('holder_document', v)} testId="bank-holder-doc" />
        <div>
          <Label className="text-[#A6A8B3] text-xs uppercase tracking-wider">Tipo de titular</Label>
          <select value={f.holder_type || 'pf'} onChange={e => on('holder_type', e.target.value)} disabled={locked} className="w-full h-10 mt-1.5 px-3 rounded-md bg-[#11131A] border border-[#1E2230] text-white text-sm" data-testid="bank-holder-type">
            <option value="pf">Pessoa Física</option>
            <option value="pj">Pessoa Jurídica</option>
          </select>
        </div>
      </div>
      <SaveBtn onClick={() => save(f)} saving={saving} locked={locked} testId="save-bank" />
    </div>
  );
}

/* ================= PIX KEYS ================= */
function PixSection({ keys, token, reload }) {
  const [showForm, setShowForm] = useState(false);
  const [newKey, setNewKey] = useState({ key_type: 'cpf', key: '', display_name: '', bank_linked: '', notes: '', active: true, primary: false });
  const [busy, setBusy] = useState(false);
  const headers = { Authorization: `Bearer ${token}` };

  const add = async () => {
    if (!newKey.key.trim()) { toast.error('Informe a chave PIX'); return; }
    setBusy(true);
    try {
      await axios.post(`${API}/admin/finance/pix-keys`, newKey, { headers });
      toast.success('Chave PIX adicionada!');
      setNewKey({ key_type: 'cpf', key: '', display_name: '', bank_linked: '', notes: '', active: true, primary: false });
      setShowForm(false);
      reload();
    } catch (e) { toast.error('Erro ao adicionar'); }
    finally { setBusy(false); }
  };
  const setPrimary = async (id) => {
    await axios.put(`${API}/admin/finance/pix-keys/${id}`, { primary: true }, { headers });
    toast.success('Chave principal definida');
    reload();
  };
  const toggle = async (id, active) => {
    await axios.put(`${API}/admin/finance/pix-keys/${id}`, { active: !active }, { headers });
    reload();
  };
  const remove = async (id) => {
    if (!window.confirm('Remover esta chave PIX?')) return;
    await axios.delete(`${API}/admin/finance/pix-keys/${id}`, { headers });
    toast.success('Chave removida');
    reload();
  };

  return (
    <div className="brane-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <SectionHeader title="Chaves PIX" subtitle="Adicione múltiplas chaves, ative/desative e defina a principal." />
        <button onClick={() => setShowForm(!showForm)} className="brane-btn-primary" data-testid="pix-add-toggle">
          <Plus className="w-4 h-4" /> {showForm ? 'Cancelar' : 'Nova chave'}
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-[#5B1CB5]/40 bg-[#5B1CB5]/5 p-4 space-y-3 brane-fade-in">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-[#A6A8B3] text-xs uppercase tracking-wider">Tipo</Label>
              <select value={newKey.key_type} onChange={e => setNewKey({ ...newKey, key_type: e.target.value })} className="w-full h-10 mt-1.5 px-3 rounded-md bg-[#11131A] border border-[#1E2230] text-white text-sm">
                {PIX_TYPES.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
              </select>
            </div>
            <Field label="Chave PIX" value={newKey.key} onChange={v => setNewKey({ ...newKey, key: v })} testId="pix-new-key" />
            <Field label="Nome exibido no pagamento" value={newKey.display_name} onChange={v => setNewKey({ ...newKey, display_name: v })} testId="pix-new-name" />
            <Field label="Banco vinculado" value={newKey.bank_linked} onChange={v => setNewKey({ ...newKey, bank_linked: v })} testId="pix-new-bank" />
            <div className="sm:col-span-2">
              <Label className="text-[#A6A8B3] text-xs uppercase tracking-wider">Observação interna</Label>
              <Textarea value={newKey.notes} onChange={e => setNewKey({ ...newKey, notes: e.target.value })} className="mt-1.5 bg-[#11131A] border-[#1E2230] text-white text-sm" rows={2} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-[#E6E6EA]">
              <Switch checked={newKey.primary} onCheckedChange={v => setNewKey({ ...newKey, primary: v })} /> Definir como principal
            </label>
            <button onClick={add} disabled={busy} className="brane-btn-primary" data-testid="pix-save-new">
              <Save className="w-4 h-4" /> {busy ? 'Salvando...' : 'Salvar chave'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {keys.length === 0 ? (
          <p className="text-sm text-[#6F7280] py-6 text-center">Nenhuma chave PIX cadastrada.</p>
        ) : keys.map(k => (
          <div key={k.id} className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-[#1E2230] bg-[#11131A]" data-testid={`pix-row-${k.id}`}>
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs uppercase tracking-wider text-[#D4A24C]">{k.key_type}</span>
                {k.primary && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D4A24C]/20 text-[#D4A24C] border border-[#D4A24C]/40">PRINCIPAL</span>}
                {!k.active && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#6F7280]/20 text-[#A6A8B3]">INATIVA</span>}
              </div>
              <p className="text-white font-mono text-sm break-all">{k.key}</p>
              {k.display_name && <p className="text-xs text-[#A6A8B3]">{k.display_name}{k.bank_linked ? ` — ${k.bank_linked}` : ''}</p>}
            </div>
            <div className="flex items-center gap-2">
              {!k.primary && (
                <button onClick={() => setPrimary(k.id)} className="brane-btn-dark" title="Tornar principal" data-testid={`pix-primary-${k.id}`}>
                  <Star className="w-3.5 h-3.5" /> Principal
                </button>
              )}
              <button onClick={() => toggle(k.id, k.active)} className="brane-btn-dark" title={k.active ? 'Desativar' : 'Ativar'} data-testid={`pix-toggle-${k.id}`}>
                {k.active ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                {k.active ? 'Desativar' : 'Ativar'}
              </button>
              <button onClick={() => remove(k.id)} className="brane-btn-dark text-[#FF6F8A]" title="Remover" data-testid={`pix-del-${k.id}`}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= GATEWAYS ================= */
function GatewaysSection({ data = {}, save, saving }) {
  const [f, setF] = useState(data);
  useEffect(() => setF(data || {}), [data]);
  const upd = (gw, k, v) => setF(prev => ({ ...prev, [gw]: { ...(prev[gw] || {}), [k]: v } }));

  return (
    <div className="space-y-4">
      {GATEWAYS.map(gw => {
        const cfg = f[gw.id] || {};
        return (
          <div key={gw.id} className="brane-card p-5" data-testid={`gateway-${gw.id}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white text-sm" style={{ backgroundColor: gw.color + '33', color: gw.color, border: `1px solid ${gw.color}66` }}>
                  {gw.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-white font-semibold">{gw.name}</h4>
                  <p className="text-xs text-[#6F7280]">Status: <span className={cfg.active ? 'text-[#10A875]' : 'text-[#A6A8B3]'}>{cfg.active ? 'Ativo' : 'Inativo'}</span></p>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-[#E6E6EA]">
                Ativar <Switch checked={!!cfg.active} onCheckedChange={v => upd(gw.id, 'active', v)} />
              </label>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-[#A6A8B3] text-xs uppercase tracking-wider">Ambiente</Label>
                <select value={cfg.environment || 'sandbox'} onChange={e => upd(gw.id, 'environment', e.target.value)} className="w-full h-10 mt-1.5 px-3 rounded-md bg-[#11131A] border border-[#1E2230] text-white text-sm">
                  <option value="sandbox">Sandbox</option>
                  <option value="production">Produção</option>
                </select>
              </div>
              <Field label="Webhook URL" value={cfg.webhook_url} onChange={v => upd(gw.id, 'webhook_url', v)} placeholder={`https://.../webhooks/${gw.id}`} testId={`gw-${gw.id}-webhook`} />
              <Field label="Public Key" value={cfg.public_key} onChange={v => upd(gw.id, 'public_key', v)} testId={`gw-${gw.id}-public`} />
              <Field label="Secret Key" value={cfg.secret_key} onChange={v => upd(gw.id, 'secret_key', v)} type="password" testId={`gw-${gw.id}-secret`} />
              <Field label="Access Token" value={cfg.access_token} onChange={v => upd(gw.id, 'access_token', v)} type="password" className="sm:col-span-2" testId={`gw-${gw.id}-token`} />
            </div>
          </div>
        );
      })}
      <SaveBtn onClick={() => save(f)} saving={saving} testId="save-gateways" />
    </div>
  );
}

/* ================= PAYOUT ================= */
function PayoutSection({ data, save, saving }) {
  const [f, setF] = useState(data || {});
  useEffect(() => setF(data || {}), [data]);
  const on = (k, v) => setF(prev => ({ ...prev, [k]: v }));
  return (
    <div className="brane-card p-6 space-y-4">
      <SectionHeader title="Repasse para Vendedores" subtitle="Defina comissões, taxas e prazos de liberação." />
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Comissão da plataforma (%)" type="number" value={f.commission_percent} onChange={v => on('commission_percent', parseFloat(v) || 0)} testId="payout-commission" />
        <Field label="Taxa fixa por venda (R$)" type="number" value={f.fixed_fee} onChange={v => on('fixed_fee', parseFloat(v) || 0)} testId="payout-fixed" />
        <Field label="Prazo de liberação (dias)" type="number" value={f.release_days} onChange={v => on('release_days', parseInt(v) || 0)} testId="payout-release" />
        <Field label="Retenção de segurança (%)" type="number" value={f.security_hold_percent} onChange={v => on('security_hold_percent', parseFloat(v) || 0)} testId="payout-hold" />
      </div>
      <div className="flex flex-col gap-3 pt-2">
        <label className="flex items-center justify-between p-3 rounded-xl bg-[#11131A] border border-[#1E2230]">
          <div>
            <p className="text-sm text-white font-medium">Split automático</p>
            <p className="text-xs text-[#6F7280]">Divide automaticamente valor entre vendedor e plataforma.</p>
          </div>
          <Switch checked={!!f.auto_split} onCheckedChange={v => on('auto_split', v)} data-testid="payout-auto-split" />
        </label>
        <label className="flex items-center justify-between p-3 rounded-xl bg-[#11131A] border border-[#1E2230]">
          <div>
            <p className="text-sm text-white font-medium">Aprovação automática</p>
            <p className="text-xs text-[#6F7280]">Se desativado, cada repasse precisa de aprovação manual.</p>
          </div>
          <Switch checked={!!f.auto_approve} onCheckedChange={v => on('auto_approve', v)} data-testid="payout-auto-approve" />
        </label>
      </div>
      <SaveBtn onClick={() => save(f)} saving={saving} testId="save-payout" />
    </div>
  );
}

/* ================= WITHDRAWALS ================= */
function WithdrawalsCfg({ data, save, saving }) {
  const [f, setF] = useState(data || {});
  useEffect(() => setF(data || {}), [data]);
  const on = (k, v) => setF(prev => ({ ...prev, [k]: v }));
  return (
    <div className="brane-card p-6 space-y-4">
      <SectionHeader title="Controle de Saques" subtitle="Políticas para solicitações de saque dos vendedores." />
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Valor mínimo de saque (R$)" type="number" value={f.min_amount} onChange={v => on('min_amount', parseFloat(v) || 0)} testId="wd-min" />
        <Field label="Prazo de pagamento (dias úteis)" type="number" value={f.payout_days} onChange={v => on('payout_days', parseInt(v) || 0)} testId="wd-days" />
      </div>
      <p className="text-xs text-[#6F7280]">O histórico detalhado e aprovações individuais ficam na aba <strong className="text-[#D4A24C]">Saques</strong> do painel principal.</p>
      <SaveBtn onClick={() => save(f)} saving={saving} testId="save-withdrawals" />
    </div>
  );
}

/* ================= RECEIPTS ================= */
function ReceiptsSection({ data, save, saving }) {
  const [f, setF] = useState(data || {});
  useEffect(() => setF(data || {}), [data]);
  const on = (k, v) => setF(prev => ({ ...prev, [k]: v }));
  return (
    <div className="brane-card p-6 space-y-4">
      <SectionHeader title="Comprovantes e Recibos" subtitle="Personalize o que aparece para o cliente." />
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Nome exibido no comprovante" value={f.display_name} onChange={v => on('display_name', v)} testId="rc-display" />
        <Field label="Nome da empresa para o cliente" value={f.company_on_receipt} onChange={v => on('company_on_receipt', v)} testId="rc-company" />
        <Field label="URL do logo" value={f.logo_url} onChange={v => on('logo_url', v)} className="sm:col-span-2" placeholder="https://..." testId="rc-logo" />
      </div>
      {f.logo_url && <img src={f.logo_url} alt="preview" className="h-16 rounded-lg border border-[#1E2230]" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
      <div className="flex flex-col gap-3 pt-2">
        <label className="flex items-center justify-between p-3 rounded-xl bg-[#11131A] border border-[#1E2230]">
          <div>
            <p className="text-sm text-white font-medium">E-mail automático pós pagamento</p>
            <p className="text-xs text-[#6F7280]">Envia confirmação por e-mail ao comprador.</p>
          </div>
          <Switch checked={!!f.auto_email} onCheckedChange={v => on('auto_email', v)} />
        </label>
        <label className="flex items-center justify-between p-3 rounded-xl bg-[#11131A] border border-[#1E2230]">
          <div>
            <p className="text-sm text-white font-medium">Recibo automático</p>
            <p className="text-xs text-[#6F7280]">Gera recibo PDF/link para cada pedido pago.</p>
          </div>
          <Switch checked={!!f.auto_receipt} onCheckedChange={v => on('auto_receipt', v)} />
        </label>
      </div>
      <SaveBtn onClick={() => save(f)} saving={saving} testId="save-receipts" />
    </div>
  );
}

/* ================= SECURITY ================= */
function SecuritySection({ data, save, saving, token }) {
  const [f, setF] = useState(data || {});
  const [logs, setLogs] = useState([]);
  useEffect(() => setF(data || {}), [data]);
  const on = (k, v) => setF(prev => ({ ...prev, [k]: v }));

  useEffect(() => {
    axios.get(`${API}/admin/finance/logs`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setLogs(r.data.logs || []))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-4">
      <div className="brane-card p-6 space-y-4">
        <SectionHeader title="Segurança" subtitle="Protege suas configurações mais sensíveis." />
        <label className="flex items-center justify-between p-3 rounded-xl bg-[#11131A] border border-[#1E2230]">
          <div>
            <p className="text-sm text-white font-medium">Autenticação em 2 fatores (2FA)</p>
            <p className="text-xs text-[#6F7280]">Habilite para exigir 2FA em operações financeiras.</p>
          </div>
          <Switch checked={!!f.twofa_enabled} onCheckedChange={v => on('twofa_enabled', v)} data-testid="sec-2fa" />
        </label>
        <label className="flex items-center justify-between p-3 rounded-xl bg-[#11131A] border border-[#1E2230]">
          <div>
            <p className="text-sm text-white font-medium">Bloqueio de edição de dados sensíveis</p>
            <p className="text-xs text-[#6F7280]">Previne edição acidental de dados da empresa e bancários.</p>
          </div>
          <Switch checked={!!f.lock_sensitive_edit} onCheckedChange={v => on('lock_sensitive_edit', v)} data-testid="sec-lock" />
        </label>
        <SaveBtn onClick={() => save(f)} saving={saving} testId="save-security" />
      </div>

      <div className="brane-card p-6">
        <SectionHeader title="Histórico de Alterações" subtitle="Quem alterou o quê e quando." />
        {logs.length === 0 ? (
          <p className="text-sm text-[#6F7280] py-4">Nenhuma alteração registrada ainda.</p>
        ) : (
          <div className="space-y-2 mt-3 max-h-80 overflow-y-auto">
            {logs.map(l => (
              <div key={l.log_id} className="flex items-center justify-between p-3 rounded-lg bg-[#11131A] border border-[#1E2230]">
                <div>
                  <p className="text-sm text-white">{l.admin_email}</p>
                  <p className="text-xs text-[#6F7280]">Seções: {(l.sections || []).join(', ') || '—'}</p>
                </div>
                <span className="text-xs text-[#A6A8B3]">{new Date(l.created_at).toLocaleString('pt-BR')}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= Small helpers ================= */
function SectionHeader({ title, subtitle }) {
  return (
    <div className="mb-3">
      <h3 className="text-lg font-semibold text-white font-['Outfit']">{title}</h3>
      {subtitle && <p className="text-xs text-[#A6A8B3] mt-1">{subtitle}</p>}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder, className = '', testId }) {
  return (
    <div className={className}>
      <Label className="text-[#A6A8B3] text-xs uppercase tracking-wider">{label}</Label>
      <Input
        type={type}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 bg-[#11131A] border-[#1E2230] text-white text-sm"
        data-testid={testId}
      />
    </div>
  );
}

function SaveBtn({ onClick, saving, locked, testId }) {
  return (
    <div className="pt-2 flex justify-end">
      <button
        onClick={onClick}
        disabled={saving || locked}
        className="brane-btn-primary disabled:opacity-50"
        data-testid={testId}
      >
        <Save className="w-4 h-4" /> {saving ? 'Salvando...' : 'Salvar'}
      </button>
    </div>
  );
}
