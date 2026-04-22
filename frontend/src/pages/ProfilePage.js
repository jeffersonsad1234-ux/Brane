import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Camera, Save, Shield, CreditCard, Bell, User, MapPin, Mail, Lock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const LOGO_URL = 'https://customer-assets.emergentagent.com/job_brane-exchange/artifacts/wiagamwr_IMG_20260412_043249_662.jpg';

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function ProfilePage() {
  const { user, token, setUser } = useAuth();
  const navigate = useNavigate();
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
      })
      .catch(() => {})
      .finally(() => setLoading(false));
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
      // Save immediately
      await axios.put(`${API}/users/profile`, { picture: picUrl }, { headers });
      setProfile(prev => ({ ...prev, picture: picUrl }));
      if (setUser) setUser(prev => ({ ...prev, picture: picUrl }));
      toast.success('Foto atualizada!');
    } catch {
      toast.error('Erro ao enviar foto');
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await axios.put(`${API}/users/profile`, { name: form.name }, { headers });
      setProfile(prev => ({ ...prev, ...res.data }));
      if (setUser) setUser(prev => ({ ...prev, name: form.name }));
      toast.success('Perfil atualizado!');
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const saveBankDetails = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/users/bank-details`, bankForm, { headers });
      toast.success('Dados bancarios atualizados!');
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center carbon-bg">
      <div className="w-8 h-8 border-4 border-[#B38B36] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const roleLabels = { buyer: 'Comprador', seller: 'Vendedor', affiliate: 'Afiliado', admin: 'Administrador (CEO)' };
  const roleColors = { buyer: '#3B82F6', seller: '#10B981', affiliate: '#F59E0B', admin: '#B38B36' };

  return (
    <div className="min-h-screen carbon-bg py-8" data-testid="profile-page">
      <div className="max-w-3xl mx-auto px-4">
        {/* Profile Header */}
        <div className="dark-card rounded-2xl p-8 mb-6 text-center relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-4 right-4 text-[#B38B36] text-8xl font-['Outfit'] font-extrabold opacity-20">B</div>
          </div>

          <div className="relative z-10">
            <div className="relative inline-block mb-4">
              <div className="profile-avatar mx-auto" data-testid="profile-avatar">
                {form.picture ? (
                  <img src={form.picture} alt={form.name} />
                ) : (
                  <span>{getInitials(profile?.name)}</span>
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#B38B36] flex items-center justify-center cursor-pointer hover:bg-[#9A752B] transition-colors" data-testid="upload-avatar-btn">
                {uploading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-4 h-4 text-white" />
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleUploadAvatar} disabled={uploading} />
              </label>
            </div>

            <h1 className="text-2xl font-bold font-['Outfit'] text-white mb-1" data-testid="profile-name">
              {profile?.name}
            </h1>
            <p className="text-sm text-[#888] mb-3">{profile?.email}</p>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium" style={{ backgroundColor: `${roleColors[profile?.role]}15`, color: roleColors[profile?.role], border: `1px solid ${roleColors[profile?.role]}30` }}>
              <Shield className="w-4 h-4" />
              {roleLabels[profile?.role] || profile?.role}
            </div>

            {profile?.wallet && (
              <div className="flex items-center justify-center gap-6 mt-6">
                <div>
                  <p className="text-xs text-[#888]">Disponivel</p>
                  <p className="text-lg font-bold text-green-400">R$ {profile.wallet.available?.toFixed(2)}</p>
                </div>
                <div className="w-px h-8 bg-[#2A2A2A]" />
                <div>
                  <p className="text-xs text-[#888]">Retido</p>
                  <p className="text-lg font-bold text-blue-400">R$ {profile.wallet.held?.toFixed(2)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-1 mb-6 h-auto">
            <TabsTrigger value="personal" className="data-[state=active]:bg-[#B38B36] data-[state=active]:text-white text-[#888]" data-testid="tab-personal">
              <User className="w-4 h-4 mr-1" /> Pessoal
            </TabsTrigger>
            <TabsTrigger value="bank" className="data-[state=active]:bg-[#B38B36] data-[state=active]:text-white text-[#888]" data-testid="tab-bank">
              <CreditCard className="w-4 h-4 mr-1" /> Bancario
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-[#B38B36] data-[state=active]:text-white text-[#888]" data-testid="tab-security">
              <Lock className="w-4 h-4 mr-1" /> Seguranca
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <div className="dark-card rounded-xl p-6">
              <h3 className="font-bold mb-4 font-['Outfit'] text-white">Informacoes Pessoais</h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-[#CCC]">Nome Completo</Label>
                  <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    className="bg-[#111] border-[#2A2A2A] text-white" data-testid="profile-name-input" />
                </div>
                <div>
                  <Label className="text-[#CCC]">Email</Label>
                  <Input value={profile?.email || ''} disabled className="bg-[#111] border-[#2A2A2A] text-[#666]" />
                  <p className="text-xs text-[#555] mt-1">Email nao pode ser alterado</p>
                </div>
                <div>
                  <Label className="text-[#CCC]">Papel na Plataforma</Label>
                  <Input value={roleLabels[profile?.role] || profile?.role} disabled className="bg-[#111] border-[#2A2A2A] text-[#666]" />
                  <p className="text-xs text-[#555] mt-1">Troque seu papel pelo menu do usuario no topo</p>
                </div>
                <Button className="gold-btn rounded-lg gap-2" onClick={saveProfile} disabled={saving} data-testid="save-profile-btn">
                  <Save className="w-4 h-4" /> {saving ? 'Salvando...' : 'Salvar Alteracoes'}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="bank">
            <div className="dark-card rounded-xl p-6">
              <h3 className="font-bold mb-4 font-['Outfit'] text-white">Dados Bancarios</h3>
              <p className="text-sm text-[#888] mb-4">Cadastre seus dados para receber saques via Pix ou TED</p>
              <div className="space-y-4">
                <div>
                  <Label className="text-[#CCC]">Nome do Banco</Label>
                  <Input value={bankForm.bank_name || ''} onChange={e => setBankForm({...bankForm, bank_name: e.target.value})}
                    placeholder="Ex: Nubank" className="bg-[#111] border-[#2A2A2A] text-white placeholder:text-[#555]" data-testid="bank-name-input" />
                </div>
                <div>
                  <Label className="text-[#CCC]">Titular da Conta</Label>
                  <Input value={bankForm.account_name || ''} onChange={e => setBankForm({...bankForm, account_name: e.target.value})}
                    className="bg-[#111] border-[#2A2A2A] text-white" data-testid="bank-account-name-input" />
                </div>
                <div>
                  <Label className="text-[#CCC]">Numero da Conta</Label>
                  <Input value={bankForm.account_number || ''} onChange={e => setBankForm({...bankForm, account_number: e.target.value})}
                    className="bg-[#111] border-[#2A2A2A] text-white" data-testid="bank-account-number-input" />
                </div>
                <div>
                  <Label className="text-[#CCC]">Chave PIX</Label>
                  <Input value={bankForm.pix_key || ''} onChange={e => setBankForm({...bankForm, pix_key: e.target.value})}
                    placeholder="CPF, email, telefone ou chave aleatoria" className="bg-[#111] border-[#2A2A2A] text-white placeholder:text-[#555]" data-testid="pix-key-input" />
                </div>
                <Button className="gold-btn rounded-lg gap-2" onClick={saveBankDetails} disabled={saving} data-testid="save-bank-btn">
                  <Save className="w-4 h-4" /> {saving ? 'Salvando...' : 'Salvar Dados Bancarios'}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="security">
            <div className="dark-card rounded-xl p-6">
              <h3 className="font-bold mb-4 font-['Outfit'] text-white">Seguranca</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[#111] rounded-lg border border-[#2A2A2A]">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-[#B38B36]" />
                    <div>
                      <p className="text-sm font-medium text-white">Email Verificado</p>
                      <p className="text-xs text-[#888]">{profile?.email}</p>
                    </div>
                  </div>
                  <span className="text-xs text-green-400 font-medium">Ativo</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-[#111] rounded-lg border border-[#2A2A2A]">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-[#B38B36]" />
                    <div>
                      <p className="text-sm font-medium text-white">Conta</p>
                      <p className="text-xs text-[#888]">Status da sua conta</p>
                    </div>
                  </div>
                  <span className="text-xs text-green-400 font-medium">{profile?.is_blocked ? 'Bloqueada' : 'Ativa'}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-[#111] rounded-lg border border-[#2A2A2A]">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-[#B38B36]" />
                    <div>
                      <p className="text-sm font-medium text-white">Notificacoes</p>
                      <p className="text-xs text-[#888]">Receba alertas de pedidos e saques</p>
                    </div>
                  </div>
                  <span className="text-xs text-green-400 font-medium">Ativo</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* BRANE Branding */}
        <div className="text-center mt-8 opacity-30">
          <img src={LOGO_URL} alt="BRANE" className="w-8 h-8 rounded-md mx-auto mb-1 opacity-50" />
          <p className="text-xs text-[#B38B36] font-['Outfit'] tracking-widest">BRANE</p>
        </div>
      </div>
    </div>
  );
}
