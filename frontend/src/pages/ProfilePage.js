import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Camera, Save, Shield, CreditCard, Bell, User, Mail, Lock } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function ProfilePage() {
  const { user, token, setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', picture: '' });
  const [bankForm, setBankForm] = useState({ bank_name: '', account_name: '', account_number: '', pix_key: '' });
  const [uploading, setUploading] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    axios.get(`${API}/users/profile`, { headers })
      .then(res => {
        setProfile(res.data);
        setForm({ name: res.data.name || '', picture: res.data.picture || '' });
        setBankForm(res.data.bank_details || { bank_name: '', account_name: '', account_number: '', pix_key: '' });
      }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleUploadAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await axios.post(`${API}/upload`, fd, { headers });
      const picUrl = `${API}/files/${res.data.path}`;
      setForm(prev => ({ ...prev, picture: picUrl }));
      await axios.put(`${API}/users/profile`, { picture: picUrl }, { headers });
      setProfile(prev => ({ ...prev, picture: picUrl }));
      if (setUser) setUser(prev => ({ ...prev, picture: picUrl }));
      toast.success('Foto atualizada!');
    } catch { toast.error('Erro ao enviar foto'); }
    finally { setUploading(false); }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await axios.put(`${API}/users/profile`, { name: form.name }, { headers });
      setProfile(prev => ({ ...prev, ...res.data }));
      if (setUser) setUser(prev => ({ ...prev, name: form.name }));
      toast.success('Perfil atualizado!');
    } catch { toast.error('Erro ao salvar'); }
    finally { setSaving(false); }
  };

  const saveBankDetails = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/users/bank-details`, bankForm, { headers });
      toast.success('Dados bancários atualizados!');
    } catch { toast.error('Erro ao salvar'); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="brane-page flex items-center justify-center">
      <div className="w-9 h-9 border-2 border-[#5B1CB5] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const roleLabels = { buyer: 'Comprador', seller: 'Vendedor', affiliate: 'Afiliado', admin: 'Admin (CEO)' };

  // Sellers, affiliates, admins, and store owners have wallet/financial features
  const hasWallet = profile?.role && ['seller', 'affiliate', 'admin'].includes(profile.role);
  const isBuyer = profile?.role === 'buyer';

  return (
    <div className="brane-page py-10" data-testid="profile-page">
      <div className="max-w-4xl mx-auto px-4">
        <p className="brane-label mb-2">Conta</p>
        <h1 className="brane-h1 mb-8">Meu Perfil</h1>

        {/* Header card */}
        <div className="brane-card-premium p-8 md:p-10 mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-7">
            <div className="relative shrink-0">
              <div className="brane-avatar-gradient" style={{ width: 120, height: 120 }}>
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white overflow-hidden">
                  {form.picture ? (
                    <img src={form.picture} alt={form.name} className="w-full h-full object-cover" />
                  ) : getInitials(profile?.name)}
                </div>
              </div>
              <label className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-[#D4A24C] text-[#0A0A0F] flex items-center justify-center cursor-pointer hover:bg-[#E8C372] transition shadow-lg" data-testid="upload-avatar-btn">
                {uploading ? (
                  <div className="w-4 h-4 border-2 border-[#0A0A0F] border-t-transparent rounded-full animate-spin" />
                ) : <Camera className="w-4 h-4" />}
                <input type="file" accept="image/*" className="hidden" onChange={handleUploadAvatar} disabled={uploading} />
              </label>
            </div>

            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold text-white font-['Outfit'] mb-1" data-testid="profile-name">{profile?.name}</h2>
              <p className="text-sm text-[#A6A8B3] mb-3">{profile?.email}</p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="brane-badge brane-badge-gold">
                  <Shield className="w-3 h-3" /> {roleLabels[profile?.role] || profile?.role}
                </span>
                {profile?.is_blocked ? (
                  <span className="brane-badge brane-badge-red">Conta Bloqueada</span>
                ) : (
                  <span className="brane-badge brane-badge-green">Ativa</span>
                )}
              </div>

              {profile?.wallet && hasWallet && (
                <div className="grid grid-cols-2 gap-3 mt-5">
                  <div className="brane-card-soft px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#6F7280] mb-1">Disponível</p>
                    <p className="text-xl font-bold text-[#2bd394]">R$ {profile.wallet.available?.toFixed(2)}</p>
                  </div>
                  <div className="brane-card-soft px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#6F7280] mb-1">Retido</p>
                    <p className="text-xl font-bold text-[#D4A24C]">R$ {profile.wallet.held?.toFixed(2)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className={`grid w-full ${hasWallet ? 'grid-cols-3' : 'grid-cols-3'} brane-tabs-list mb-6 h-auto`}>
            <TabsTrigger value="personal" className="data-[state=active]:bg-[#5B1CB5] data-[state=active]:text-white text-[#A6A8B3] rounded-xl" data-testid="tab-personal">
              <User className="w-4 h-4 mr-1.5" /> Pessoal
            </TabsTrigger>
            <TabsTrigger value="bank" className="data-[state=active]:bg-[#5B1CB5] data-[state=active]:text-white text-[#A6A8B3] rounded-xl" data-testid="tab-bank">
              <CreditCard className="w-4 h-4 mr-1.5" /> {hasWallet ? 'Bancário' : 'Pagamento'}
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-[#5B1CB5] data-[state=active]:text-white text-[#A6A8B3] rounded-xl" data-testid="tab-security">
              <Lock className="w-4 h-4 mr-1.5" /> Segurança
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <div className="brane-card-soft p-7">
              <h3 className="text-lg font-semibold text-white mb-1 font-['Outfit']">Informações Pessoais</h3>
              <p className="text-sm text-[#A6A8B3] mb-6">Atualize suas informações de perfil.</p>
              <div className="space-y-5">
                <div>
                  <Label className="text-[#A6A8B3] text-xs uppercase tracking-wider">Nome Completo</Label>
                  <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="brane-input mt-1.5" data-testid="profile-name-input" />
                </div>
                <div>
                  <Label className="text-[#A6A8B3] text-xs uppercase tracking-wider">Email</Label>
                  <Input value={profile?.email || ''} disabled className="brane-input mt-1.5 opacity-50" />
                  <p className="text-xs text-[#6F7280] mt-1.5">O email não pode ser alterado.</p>
                </div>
                <div>
                  <Label className="text-[#A6A8B3] text-xs uppercase tracking-wider">Papel na Plataforma</Label>
                  <Input value={roleLabels[profile?.role] || profile?.role} disabled className="brane-input mt-1.5 opacity-50" />
                  <p className="text-xs text-[#6F7280] mt-1.5">Troque seu papel pelo menu do usuário no topo.</p>
                </div>
                <button onClick={saveProfile} disabled={saving} className="brane-btn-primary" data-testid="save-profile-btn">
                  <Save className="w-4 h-4" /> {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="bank">
            <div className="brane-card-soft p-7">
              <h3 className="text-lg font-semibold text-white mb-1 font-['Outfit']">
                {hasWallet ? 'Dados Bancários' : 'Dados de Pagamento'}
              </h3>
              <p className="text-sm text-[#A6A8B3] mb-6">
                {hasWallet
                  ? 'Cadastre seus dados para receber saques via Pix ou TED.'
                  : 'Cadastre seu Pix e dados básicos para facilitar seus pagamentos. Compradores não recebem saques na BRANE.'}
              </p>
              <div className="space-y-5">
                <div>
                  <Label className="text-[#A6A8B3] text-xs uppercase tracking-wider">Chave PIX</Label>
                  <Input value={bankForm.pix_key || ''} onChange={e => setBankForm({...bankForm, pix_key: e.target.value})} placeholder="CPF, email, telefone ou chave aleatória" className="brane-input mt-1.5" data-testid="pix-key-input" />
                </div>
                {hasWallet && (
                  <>
                    <div>
                      <Label className="text-[#A6A8B3] text-xs uppercase tracking-wider">Nome do Banco</Label>
                      <Input value={bankForm.bank_name || ''} onChange={e => setBankForm({...bankForm, bank_name: e.target.value})} placeholder="Ex: Nubank" className="brane-input mt-1.5" data-testid="bank-name-input" />
                    </div>
                    <div>
                      <Label className="text-[#A6A8B3] text-xs uppercase tracking-wider">Titular da Conta</Label>
                      <Input value={bankForm.account_name || ''} onChange={e => setBankForm({...bankForm, account_name: e.target.value})} className="brane-input mt-1.5" data-testid="bank-account-name-input" />
                    </div>
                    <div>
                      <Label className="text-[#A6A8B3] text-xs uppercase tracking-wider">Número da Conta</Label>
                      <Input value={bankForm.account_number || ''} onChange={e => setBankForm({...bankForm, account_number: e.target.value})} className="brane-input mt-1.5" data-testid="bank-account-number-input" />
                    </div>
                  </>
                )}
                <button onClick={saveBankDetails} disabled={saving} className="brane-btn-primary" data-testid="save-bank-btn">
                  <Save className="w-4 h-4" /> {saving ? 'Salvando...' : 'Salvar Dados'}
                </button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="security">
            <div className="brane-card-soft p-7">
              <h3 className="text-lg font-semibold text-white mb-1 font-['Outfit']">Segurança</h3>
              <p className="text-sm text-[#A6A8B3] mb-6">Status da sua conta e configurações de segurança.</p>
              <div className="space-y-3">
                <SecurityRow icon={<Mail className="w-5 h-5" />} title="Email Verificado" desc={profile?.email} status="ativo" />
                <SecurityRow icon={<Shield className="w-5 h-5" />} title="Conta" desc="Status da sua conta" status={profile?.is_blocked ? 'bloqueada' : 'ativa'} />
                <SecurityRow icon={<Bell className="w-5 h-5" />} title="Notificações" desc="Alertas de pedidos e saques" status="ativo" />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function SecurityRow({ icon, title, desc, status }) {
  const statusClass = status === 'bloqueada' ? 'brane-badge-red' : 'brane-badge-green';
  const statusText = status === 'bloqueada' ? 'Bloqueada' : status === 'ativo' ? 'Ativo' : 'Ativa';
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-[#11131A] border border-[#1E2230]">
      <div className="flex items-center gap-3">
        <div className="brane-icon-wrap-gold">{icon}</div>
        <div>
          <p className="text-sm font-medium text-white">{title}</p>
          <p className="text-xs text-[#6F7280]">{desc}</p>
        </div>
      </div>
      <span className={`brane-badge ${statusClass}`}>{statusText}</span>
    </div>
  );
}
