import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Store, Upload, Image, Check, ArrowRight, Crown, Star, Zap } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PLANS = [
  {
    id: 'free',
    name: 'Grátis',
    price: 0,
    commission: '9%',
    features: ['Criar loja', 'Publicar produtos', 'Receber pagamentos'],
    notIncluded: ['Destaque na seção Lojas', 'Anúncios na plataforma'],
    color: '#666',
    icon: Store
  },
  {
    id: 'pro',
    name: 'PRO',
    price: 99,
    commission: '2%',
    features: ['Tudo do Grátis', 'Destaque na seção Lojas', '2 anúncios por dia', 'Badge PRO'],
    popular: true,
    color: '#3B82F6',
    icon: Zap
  },
  {
    id: 'premium',
    name: 'PREMIUM',
    price: 199,
    commission: '1%',
    features: ['Tudo do PRO', 'Menor comissão', 'Prioridade no suporte', 'Badge PREMIUM'],
    color: '#B38B36',
    icon: Crown
  }
];

export default function CreateStorePage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=info, 2=plan
  const [loading, setLoading] = useState(false);
  const [existingStore, setExistingStore] = useState(null);
  const [checkingStore, setCheckingStore] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('free');
  const [form, setForm] = useState({
    name: '',
    description: '',
    logo: '',
    banner: '',
    category: ''
  });
  
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    // Check if user already has a store
    axios.get(`${API}/stores/my`, { headers, withCredentials: true })
      .then(res => {
        if (res.data.store) {
          setExistingStore(res.data.store);
        }
      })
      .catch(() => {})
      .finally(() => setCheckingStore(false));
  }, [user]);

  const handleUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await axios.post(`${API}/upload`, fd, { headers, withCredentials: true });
      setForm(prev => ({ ...prev, [field]: res.data.path }));
      toast.success('Imagem enviada!');
    } catch {
      toast.error('Erro ao enviar imagem');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('Digite o nome da sua loja');
      return;
    }
    
    setLoading(true);
    try {
      // Create store
      const res = await axios.post(`${API}/stores`, form, { headers, withCredentials: true });
      
      // If not free plan, upgrade
      if (selectedPlan !== 'free') {
        await axios.post(`${API}/stores/upgrade`, { plan: selectedPlan }, { headers, withCredentials: true });
      }
      
      toast.success('Loja criada com sucesso!');
      navigate(`/stores/${res.data.slug}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao criar loja');
    } finally {
      setLoading(false);
    }
  };

  if (checkingStore) {
    return (
      <div className="min-h-screen carbon-bg flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#B38B36] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If user already has a store, redirect to it
  if (existingStore) {
    return (
      <div className="min-h-screen carbon-bg py-12">
        <div className="max-w-lg mx-auto px-4">
          <div className="dark-card rounded-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Você já tem uma loja!</h1>
            <p className="text-[#888] mb-6">Sua loja "{existingStore.name}" já está ativa.</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate(`/stores/${existingStore.slug}`)} className="gold-btn rounded-lg">
                Ver Minha Loja
              </Button>
              <Button onClick={() => navigate('/dashboard')} variant="outline" className="border-[#2A2A2A] text-[#888]">
                Painel
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen carbon-bg py-12" data-testid="create-store-page">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#B38B36]/20 to-[#B38B36]/5 flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-[#B38B36]" />
          </div>
          <h1 className="text-3xl font-bold font-['Outfit'] mb-2">
            <span className="bg-gradient-to-r from-[#8B6914] via-[#B38B36] to-[#4A7C9B] bg-clip-text text-transparent">
              Criar Minha Loja
            </span>
          </h1>
          <p className="text-[#888]">Configure sua loja e comece a vender na BRANE</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-10">
          {[{ n: 1, label: 'Informações' }, { n: 2, label: 'Plano' }].map((s, i) => (
            <div key={s.n} className="flex items-center">
              <button
                onClick={() => step > s.n && setStep(s.n)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all ${
                  step >= s.n 
                    ? 'bg-gradient-to-r from-[#B38B36]/20 to-[#B38B36]/10 text-[#B38B36] border border-[#B38B36]/30' 
                    : 'bg-[#1A1A1A] text-[#555] border border-[#2A2A2A]'
                }`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step >= s.n ? 'bg-[#B38B36] text-white' : 'bg-[#2A2A2A] text-[#555]'
                }`}>{s.n}</span>
                <span className="font-medium">{s.label}</span>
              </button>
              {i < 1 && <div className={`w-12 h-0.5 mx-2 ${step > s.n ? 'bg-[#B38B36]' : 'bg-[#2A2A2A]'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Store Info */}
        {step === 1 && (
          <div className="max-w-xl mx-auto animate-fadeIn">
            <div className="dark-card rounded-2xl p-8">
              <h2 className="text-xl font-bold text-white mb-6">Informações da Loja</h2>
              
              <div className="space-y-5">
                <div>
                  <Label className="text-[#CCC]">Nome da Loja *</Label>
                  <Input
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Ex: Minha Loja Premium"
                    className="bg-[#111] border-[#2A2A2A] text-white mt-1"
                    data-testid="store-name-input"
                  />
                </div>

                <div>
                  <Label className="text-[#CCC]">Descrição</Label>
                  <Textarea
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Conte um pouco sobre sua loja..."
                    className="bg-[#111] border-[#2A2A2A] text-white mt-1 min-h-[100px]"
                    data-testid="store-description-input"
                  />
                </div>

                {/* Logo Upload */}
                <div>
                  <Label className="text-[#CCC]">Logo da Loja</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="w-20 h-20 rounded-xl bg-[#111] border border-[#2A2A2A] overflow-hidden flex items-center justify-center">
                      {form.logo ? (
                        <img 
                          src={form.logo.startsWith('http') ? form.logo : `${API}/files/${form.logo}`} 
                          alt="Logo" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <Store className="w-8 h-8 text-[#333]" />
                      )}
                    </div>
                    <label className="flex-1">
                      <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-dashed border-[#2A2A2A] hover:border-[#B38B36] cursor-pointer transition-colors">
                        {uploading ? (
                          <div className="w-5 h-5 border-2 border-[#B38B36] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Upload className="w-5 h-5 text-[#666]" />
                        )}
                        <span className="text-sm text-[#888]">Enviar logo</span>
                      </div>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={e => handleUpload(e, 'logo')} 
                        disabled={uploading}
                      />
                    </label>
                  </div>
                </div>

                {/* Banner Upload */}
                <div>
                  <Label className="text-[#CCC]">Banner da Loja</Label>
                  <div className="mt-2">
                    <div className="w-full h-32 rounded-xl bg-[#111] border border-[#2A2A2A] overflow-hidden mb-2">
                      {form.banner ? (
                        <img 
                          src={form.banner.startsWith('http') ? form.banner : `${API}/files/${form.banner}`} 
                          alt="Banner" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image className="w-10 h-10 text-[#333]" />
                        </div>
                      )}
                    </div>
                    <label>
                      <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-dashed border-[#2A2A2A] hover:border-[#B38B36] cursor-pointer transition-colors">
                        {uploading ? (
                          <div className="w-5 h-5 border-2 border-[#B38B36] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Upload className="w-5 h-5 text-[#666]" />
                        )}
                        <span className="text-sm text-[#888]">Enviar banner (1200x300 recomendado)</span>
                      </div>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={e => handleUpload(e, 'banner')} 
                        disabled={uploading}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => form.name.trim() ? setStep(2) : toast.error('Digite o nome da loja')}
                className="w-full gold-btn rounded-xl py-6 mt-8"
                data-testid="next-step-btn"
              >
                Próximo: Escolher Plano <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Choose Plan */}
        {step === 2 && (
          <div className="animate-fadeIn">
            <h2 className="text-xl font-bold text-white mb-6 text-center">Escolha seu Plano</h2>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {PLANS.map(plan => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative rounded-2xl p-6 cursor-pointer transition-all duration-300 ${
                    selectedPlan === plan.id
                      ? 'bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] border-2 border-[#B38B36] shadow-lg shadow-[#B38B36]/20 -translate-y-1'
                      : 'bg-[#1A1A1A] border border-[#2A2A2A] hover:border-[#B38B36]/50'
                  }`}
                  data-testid={`plan-${plan.id}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] text-white text-xs font-bold rounded-full">
                      MAIS POPULAR
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center`} style={{ backgroundColor: `${plan.color}20` }}>
                      <plan.icon className="w-6 h-6" style={{ color: plan.color }} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{plan.name}</h3>
                      <p className="text-xs text-[#888]">{plan.commission} de comissão</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    {plan.price === 0 ? (
                      <p className="text-2xl font-bold text-white">Grátis</p>
                    ) : (
                      <p className="text-2xl font-bold text-white">
                        R$ {plan.price}<span className="text-sm text-[#666] font-normal">/mês</span>
                      </p>
                    )}
                  </div>

                  <ul className="space-y-2">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-[#CCC]">
                        <Check className="w-4 h-4 text-green-400 shrink-0" />
                        {f}
                      </li>
                    ))}
                    {plan.notIncluded?.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-[#555] line-through">
                        <span className="w-4 h-4 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {selectedPlan === plan.id && (
                    <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#B38B36] flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => setStep(1)}
                variant="outline"
                className="border-[#2A2A2A] text-[#888] px-8"
              >
                Voltar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="gold-btn rounded-xl px-8 py-6"
                data-testid="create-store-submit"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Criando...
                  </>
                ) : (
                  <>
                    Criar Minha Loja <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </div>

            {selectedPlan !== 'free' && (
              <p className="text-center text-xs text-[#666] mt-4">
                * O pagamento do plano será processado após a criação da loja
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
