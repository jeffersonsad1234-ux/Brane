import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Crown, Check, Zap, CreditCard, Wallet, Clock, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const BENEFIT_LABELS = {
  home_highlight: 'Destaque na home',
  footer_banner: 'Banner fixo no rodapé',
  search_boost: 'Boost em busca',
  priority_support: 'Suporte prioritário',
};

export default function PromotionPlansPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [mySubs, setMySubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(null);

  const h = { Authorization: `Bearer ${token}` };

  const load = async () => {
    setLoading(true);
    try {
      const reqs = [axios.get(`${API}/promotion-plans`)];
      if (token) reqs.push(axios.get(`${API}/seller/subscriptions`, { headers: h }));
      const res = await Promise.all(reqs);
      setPlans(res[0].data.plans || []);
      setMySubs(res[1]?.data.subscriptions || []);
    } catch { toast.error('Erro ao carregar planos'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const subscribe = async (planId, method) => {
    if (!user) { navigate('/auth'); return; }
    setSubscribing(planId + method);
    try {
      const res = await axios.post(`${API}/seller/subscribe-plan`, { plan_id: planId, payment_method: method }, { headers: h });
      if (method === 'wallet' && res.data.status === 'active') {
        toast.success('Plano ativado! Descontado da sua carteira.');
      } else {
        toast.success('Assinatura criada. Aguarde aprovação do admin.');
      }
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao assinar');
    } finally { setSubscribing(null); }
  };

  const activeSub = mySubs.find(s => s.status === 'active');

  return (
    <div className="brane-page py-10" data-testid="promotion-plans-page">
      <div className="max-w-6xl mx-auto px-4">
        <p className="brane-label mb-2">Para vendedores</p>
        <h1 className="brane-h1 mb-3 flex items-center gap-3">
          <Crown className="w-8 h-8 text-[#D4A24C]" /> Promover minha loja
        </h1>
        <p className="text-[#A6A8B3] max-w-2xl mb-8">
          Escolha um plano de promoção para destacar sua loja e produtos, ganhar visibilidade e vender mais.
        </p>

        {/* Active subscription */}
        {activeSub && (
          <div className="brane-card-premium p-5 mb-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="brane-icon-wrap-gold"><CheckCircle className="w-5 h-5" /></div>
              <div>
                <p className="text-xs text-[#A6A8B3] uppercase tracking-wider">Plano ativo</p>
                <p className="text-xl font-bold text-white">{activeSub.plan_name}</p>
                <p className="text-xs text-[#6F7280]">Expira em {activeSub.expires_at ? new Date(activeSub.expires_at).toLocaleDateString('pt-BR') : '—'}</p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20"><div className="w-9 h-9 border-2 border-[#5B1CB5] border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : plans.length === 0 ? (
          <div className="brane-card p-12 text-center">
            <Crown className="w-12 h-12 text-[#6F7280] mx-auto mb-3" />
            <p className="text-[#A6A8B3]">Nenhum plano disponível no momento.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {plans.map((p, idx) => {
              const isFeatured = idx === 1; // middle plan highlighted
              return (
                <div key={p.plan_id} className={`p-6 rounded-2xl border relative ${isFeatured ? 'brane-card-premium' : 'brane-card'}`} data-testid={`public-plan-${p.plan_id}`}>
                  {isFeatured && <span className="absolute -top-3 left-6 brane-badge brane-badge-gold" style={{ background: 'linear-gradient(135deg, #E8C372, #D4A24C)', color: '#2A1A00' }}>MAIS POPULAR</span>}
                  <h3 className="text-2xl font-bold text-white font-['Outfit']">{p.name}</h3>
                  <div className="flex items-baseline gap-1 my-4">
                    <span className="text-sm text-[#A6A8B3]">R$</span>
                    <span className="text-4xl font-black text-[#D4A24C]">{p.price.toFixed(2).replace('.',',').split(',')[0]}</span>
                    <span className="text-xl font-bold text-[#D4A24C]">,{p.price.toFixed(2).split('.')[1] || '00'}</span>
                    <span className="text-xs text-[#A6A8B3] ml-2">/ {p.duration_days} dias</span>
                  </div>
                  {p.description && <p className="text-sm text-[#A6A8B3] mb-4">{p.description}</p>}
                  <div className="space-y-2 mb-5">
                    {Object.entries(p.benefits || {}).filter(([,v]) => v).map(([k]) => (
                      <div key={k} className="flex items-center gap-2 text-sm text-[#E6E6EA]">
                        <Check className="w-4 h-4 text-[#10A875]" /> {BENEFIT_LABELS[k] || k}
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => subscribe(p.plan_id, 'wallet')}
                      disabled={subscribing === p.plan_id + 'wallet'}
                      className="brane-btn-primary w-full justify-center disabled:opacity-50"
                      data-testid={`subscribe-wallet-${p.plan_id}`}
                    >
                      <Wallet className="w-4 h-4" /> {subscribing === p.plan_id + 'wallet' ? 'Processando...' : 'Pagar com carteira'}
                    </button>
                    <button
                      onClick={() => subscribe(p.plan_id, 'pix')}
                      disabled={subscribing === p.plan_id + 'pix'}
                      className="brane-btn-gold-outline w-full justify-center disabled:opacity-50"
                      data-testid={`subscribe-pix-${p.plan_id}`}
                    >
                      <Zap className="w-4 h-4" /> Pagar com PIX
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* My subscriptions history */}
        {mySubs.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-bold text-white font-['Outfit'] mb-4">Meu histórico de assinaturas</h2>
            <div className="brane-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#11131A] text-[#A6A8B3] text-xs uppercase tracking-wider">
                    <th className="text-left px-4 py-3">Plano</th>
                    <th className="text-right px-4 py-3">Valor</th>
                    <th className="text-left px-4 py-3">Pagamento</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Expira em</th>
                  </tr>
                </thead>
                <tbody>
                  {mySubs.map(s => {
                    const cls = s.status === 'active' ? 'brane-badge-green' : s.status === 'pending' ? 'brane-badge-orange' : s.status === 'rejected' ? 'brane-badge-red' : '';
                    return (
                      <tr key={s.subscription_id} className="border-t border-[#1E2230]">
                        <td className="px-4 py-3 text-white">{s.plan_name}</td>
                        <td className="px-4 py-3 text-right text-[#D4A24C]">R$ {Number(s.plan_price).toFixed(2)}</td>
                        <td className="px-4 py-3 text-[#A6A8B3]">{s.payment_method === 'wallet' ? 'Carteira' : 'PIX'}</td>
                        <td className="px-4 py-3"><span className={`brane-badge ${cls}`}>{s.status.toUpperCase()}</span></td>
                        <td className="px-4 py-3 text-[#A6A8B3]">{s.expires_at ? new Date(s.expires_at).toLocaleDateString('pt-BR') : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
