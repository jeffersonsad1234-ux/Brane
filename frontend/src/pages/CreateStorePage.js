import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
Store,
Upload,
Image,
Check,
ArrowRight,
Crown,
Zap,
Phone,
Mail,
MapPin,
Globe,
Instagram
} from 'lucide-react';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const PLANS = [
  {
    id: 'free',
    name: 'FREE',
    price: 0,
    priceText: 'R$ 0,00',
    commission: '9%',
    description: 'Plano gratuito para criar sua loja e vender na BRANE.',
    features: [
      'Criar loja gratuitamente',
      'Adicionar produtos dentro da loja',
      'Copiar link da loja para divulgar fora da BRANE',
      'Publicar produtos no feed da BRANE',
      'Taxa BRANE de 9% por venda'
    ],
    terms: 'No plano FREE, a loja é gratuita. A BRANE cobra 9% sobre cada venda realizada pela plataforma.',
    color: '#6F7280',
    icon: Store
  },
  {
    id: 'gold',
    name: 'GOLD',
    price: 25,
    priceText: 'R$ 25,00/mês',
    commission: '9% até 20 vendas, depois 7%',
    description: 'Plano com mais visibilidade dentro da BRANE.',
    features: [
      'Tudo do plano FREE',
      'Loja pode aparecer em anúncios no topo, meio ou rodapé da BRANE',
      'Mais destaque dentro da plataforma',
      'Taxa BRANE de 9%',
      'Após mais de 20 vendas, taxa reduzida para 7%'
    ],
    terms: 'No plano GOLD, será cobrado R$ 25,00 mensais no cartão de crédito. A taxa por venda começa em 9% e cai para 7% após mais de 20 vendas realizadas na plataforma.',
    color: '#D4A24C',
    icon: Crown
  },
  {
  id: 'premium',
  name: 'PREMIUM',
  price: 60,
  priceText: 'R$ 60,00/mês',
  commission: '0%',
  description: 'Plano máximo para divulgação e crescimento da loja.',
  features: [
    'Tudo do plano GOLD',
    'Loja aparece no feed da BRANE',
    'BRANE divulga a loja no Desapega',
    'BRANE divulga sua loja fora da BRANE',
    'Sem taxa BRANE por venda'
  ],
  terms: 'No plano PREMIUM, será cobrado R$ 60,00 mensais no cartão de crédito. A BRANE não cobra taxa sobre vendas realizadas pela loja neste plano.',
  color: '#8B5CF6',
  icon: Zap
}
];
const STATES = [
  {
    id: 'SP',
    name: 'São Paulo',
    cities: ['São Paulo', 'Campinas', 'Guarulhos', 'Santos', 'Ribeirão Preto']
  },
  {
    id: 'RJ',
    name: 'Rio de Janeiro',
    cities: ['Rio de Janeiro', 'Niterói', 'Duque de Caxias', 'Nova Iguaçu']
  },
  {
    id: 'MG',
    name: 'Minas Gerais',
    cities: ['Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora']
  },
  {
    id: 'BA',
    name: 'Bahia',
    cities: ['Salvador', 'Feira de Santana', 'Vitória da Conquista']
  },
  {
    id: 'PR',
    name: 'Paraná',
    cities: ['Curitiba', 'Londrina', 'Maringá']
  },
  {
    id: 'RS',
    name: 'Rio Grande do Sul',
    cities: ['Porto Alegre', 'Caxias do Sul', 'Pelotas']
  },
  {
    id: 'PE',
    name: 'Pernambuco',
    cities: ['Recife', 'Olinda', 'Caruaru']
  },
  {
    id: 'CE',
    name: 'Ceará',
    cities: ['Fortaleza', 'Caucaia', 'Juazeiro do Norte']
  },
  {
    id: 'PA',
    name: 'Pará',
    cities: ['Belém', 'Ananindeua', 'Santarém', 'Marabá']
  },
  {
    id: 'SC',
    name: 'Santa Catarina',
    cities: ['Florianópolis', 'Joinville', 'Blumenau']
  }
];

export default function CreateStorePage() {
const { user, token } = useAuth();
const navigate = useNavigate();

const [step, setStep] = useState(1);
const [loading, setLoading] = useState(false);
const [checkingStore, setCheckingStore] = useState(true);
const [existingStore, setExistingStore] = useState(null);
const [uploading, setUploading] = useState(false);
const [selectedPlan, setSelectedPlan] = useState('free');

const [form, setForm] = useState({
  name: '',
  description: '',
  logo: '',
  banner: '',
  category: '',
  phone: '',
  whatsapp: '',
  email: '',
  state: '',
  city: '',
  address: '',
  website: '',
  instagram: '',
  business_hours: '',
  acceptedTerms: false
});

const headers = {
Authorization: 'Bearer ' + token
};

useEffect(() => {
if (!user) {
navigate('/auth');
return;
}

axios.get(API + '/stores/my', { headers: headers })  
  .then(function(res) {  
    if (res.data && res.data.store) {  
      setExistingStore(res.data.store);  
    }  
  })  
  .catch(function() {})  
  .finally(function() {  
    setCheckingStore(false);  
  });

}, [user, token]);

const imageUrl = function(path) {
if (!path) return '';
if (path.startsWith('http') || path.startsWith('data:image')) return path;
return API + '/files/' + path;
};

const handleUpload = async function(e, field) {
const file = e.target.files[0];
if (!file) return;

setUploading(true);  

try {  
  const fd = new FormData();  
  fd.append('file', file);  

  const res = await axios.post(API + '/upload', fd, { headers: headers });  

  setForm(function(prev) {  
    return {  
      ...prev,  
      [field]: res.data.path  
    };  
  });  

  toast.success('Imagem enviada!');  
} catch {  
  toast.error('Erro ao enviar imagem');  
} finally {  
  setUploading(false);  
}

};

const validateStepOne = function() {
if (!form.name.trim()) {
toast.error('Digite o nome da loja');
return false;
}

if (!form.description.trim()) {  
  toast.error('Digite uma descrição para a loja');  
  return false;  
}  

if (!form.phone.trim() && !form.whatsapp.trim() && !form.email.trim()) {  
  toast.error('Informe pelo menos um contato: telefone, WhatsApp ou e-mail');  
  return false;  
}  

return true;

};

const goNext = function() {
if (!validateStepOne()) return;
setStep(2);
};
  const handleSubmit = async function() {
  if (!form.acceptedTerms) {
    toast.error('Você precisa aceitar os termos do plano para continuar');
    return;
  }

if (!validateStepOne()) return;

setLoading(true);  

try {  
  const payload = {  
    name: form.name,  
    description: form.description,  
    logo: form.logo,  
    banner: form.banner,  
    category: form.category,
    acceptedTerms: form.acceptedTerms,
    phone: form.phone,  
    whatsapp: form.whatsapp,  
    email: form.email,  
    city: form.city,
    state: form.state,
    address: form.address,  
    website: form.website,  
    instagram: form.instagram,  
    business_hours: form.business_hours,  
    plan: selectedPlan  
  };  

  const res = await axios.post(API + '/stores', payload, { headers: headers });  

  toast.success('Loja criada com sucesso!');  

  if (res.data && res.data.slug) {  
    navigate('/stores/' + res.data.slug);  
  } else if (res.data && res.data.store && res.data.store.slug) {  
    navigate('/stores/' + res.data.store.slug);  
  } else {  
    navigate('/stores');  
  }  
} catch (err) {  
  toast.error((err.response && err.response.data && err.response.data.detail) || 'Erro ao criar loja');  
} finally {  
  setLoading(false);  
}

};
  if (checkingStore) {
  return (
    <div className="min-h-screen carbon-bg flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#D4A24C] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

if (existingStore) {
  return (
    <div className="min-h-screen carbon-bg py-12">
      <div className="max-w-xl mx-auto px-4">
        <div className="dark-card rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-400" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">
            Você já possui uma loja
          </h1>

          <p className="text-[#A6A8B3] mb-6">
            Sua loja já está ativa dentro da BRANE.
          </p>

          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => navigate('/stores')}
              className="gold-btn rounded-lg"
            >
              Ver Minha Loja
            </Button>

            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
              className="border-[#1E2230] text-[#A6A8B3]"
            >
              Painel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
  return (
  <div className="min-h-screen carbon-bg py-12">
    <div className="max-w-5xl mx-auto px-4">
      <h1 className="text-3xl font-bold text-white mb-8">Criar Minha Loja</h1>

      <div className="dark-card rounded-2xl p-8">
        <div className="grid md:grid-cols-2 gap-5">
    <div className="md:col-span-2 grid md:grid-cols-2 gap-5 mb-4">
  <div>
    <Label className="text-white">Foto / Logo da Loja</Label>
    <div className="mt-2 flex items-center gap-4">
      <div className="w-24 h-24 rounded-xl bg-[#11131A] border border-[#1E2230] overflow-hidden flex items-center justify-center">
        {form.logo ? (
          <img src={imageUrl(form.logo)} alt="Logo da loja" className="w-full h-full object-cover" />
        ) : (
          <Store className="w-8 h-8 text-[#6F7280]" />
        )}
      </div>

      <label className="cursor-pointer">
        <div className="px-4 py-3 rounded-lg border border-dashed border-[#1E2230] text-[#A6A8B3] hover:border-[#D4A24C]">
          Enviar logo
        </div>
        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, 'logo')} />
      </label>
    </div>
  </div>

  <div>
    <Label className="text-white">Capa / Banner da Loja</Label>
    <div className="mt-2">
      <div className="w-full h-24 rounded-xl bg-[#11131A] border border-[#1E2230] overflow-hidden flex items-center justify-center">
        {form.banner ? (
          <img src={imageUrl(form.banner)} alt="Capa da loja" className="w-full h-full object-cover" />
        ) : (
          <Image className="w-8 h-8 text-[#6F7280]" />
        )}
      </div>

      <label className="cursor-pointer block mt-2">
        <div className="px-4 py-3 rounded-lg border border-dashed border-[#1E2230] text-[#A6A8B3] hover:border-[#D4A24C]">
          Enviar capa
        </div>
        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, 'banner')} />
      </label>
    </div>
  </div>
</div>
          <div>
            <Label className="text-white">Nome da Loja *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-[#11131A] border-[#1E2230] text-white mt-2" />
          </div>

          <div>
            <Label className="text-white">Categoria</Label>
            <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="bg-[#11131A] border-[#1E2230] text-white mt-2" />
          </div>

          <div className="md:col-span-2">
            <Label className="text-white">Descrição *</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-[#11131A] border-[#1E2230] text-white mt-2" />
          </div>

          <div>
            <Label className="text-white">Telefone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bg-[#11131A] border-[#1E2230] text-white mt-2" />
          </div>

          <div>
            <Label className="text-white">WhatsApp</Label>
            <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className="bg-[#11131A] border-[#1E2230] text-white mt-2" />
          </div>

          <div>
            <Label className="text-white">E-mail</Label>
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-[#11131A] border-[#1E2230] text-white mt-2" />
          </div>

          <div>
  <Label className="text-white">Estado</Label>
  <select
    value={form.state}
    onChange={(e) =>
      setForm({
        ...form,
        state: e.target.value,
        city: ''
      })
    }
    className="w-full mt-2 bg-[#11131A] border border-[#1E2230] text-white rounded-lg px-3 py-2"
  >
    <option value="">Selecione o Estado</option>
   {STATES.map((state) => (
  <option key={state.id} value={state.name}>
        {state.name}
      </option>
    ))}
  </select>
</div>

<div>
  <Label className="text-white">Cidade</Label>
  <select
    value={form.city}
    onChange={(e) =>
      setForm({
        ...form,
        city: e.target.value
      })
    }
    className="w-full mt-2 bg-[#11131A] border border-[#1E2230] text-white rounded-lg px-3 py-2"
    disabled={!form.state}
  >
    <option value="">Selecione a Cidade</option>
    {STATES
      .find((state) => state.name === form.state)
      ?.cities.map((city) => (
        <option key={city} value={city}>
          {city}
        </option>
      ))}
  </select>
</div>
    <div className="mt-10">
  <h2 className="text-2xl font-bold text-white mb-6">
    Escolha seu Plano
  </h2>

  <div className="grid md:grid-cols-3 gap-6">
    {PLANS.map((plan) => (
      <div
        key={plan.id}
        onClick={() => setSelectedPlan(plan.id)}
        className={`rounded-2xl p-6 cursor-pointer border transition-all ${
          selectedPlan === plan.id
            ? 'border-[#D4A24C] bg-[#151821]'
            : 'border-[#1E2230] bg-[#0F1117]'
        }`}
      >
        <h3 className="text-xl font-bold text-white mb-2">
          {plan.name}
        </h3>

        <p className="text-[#D4A24C] font-bold text-lg mb-3">
          {plan.priceText}
        </p>

        <p className="text-[#A6A8B3] text-sm mb-4">
          {plan.description}
        </p>

        <ul className="space-y-2">
          {plan.features.map((item, index) => (
            <li
              key={index}
              className="text-sm text-white flex gap-2"
            >
              <Check className="w-4 h-4 text-[#D4A24C]" />
              {item}
            </li>
          ))}
        </ul>

        <div className="mt-5 p-3 rounded-lg bg-[#11131A] text-xs text-[#A6A8B3]">
          {plan.terms}
        </div>
      </div>
    ))}
  </div>
</div>

<div className="mt-8">
  <label className="flex items-start gap-3 cursor-pointer">
    <input
      type="checkbox"
      checked={form.acceptedTerms}
      onChange={(e) =>
        setForm({
          ...form,
          acceptedTerms: e.target.checked
        })
      }
      className="mt-1"
    />

    <span className="text-sm text-[#A6A8B3]">
      Li e aceito os termos do plano selecionado, as taxas da BRANE
      e as condições de assinatura mensal.
    </span>
  </label>
</div>

        <Button onClick={handleSubmit} disabled={loading} className="gold-btn rounded-xl mt-8">
          {loading ? 'Criando...' : 'Criar Minha Loja'}
  </Button>
</div>
</div>
</div>
</div>
);
}
 

