import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Coins, Gift, Star, Trophy, ArrowLeft, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function BraneCoinsPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({ coins: 0, is_vip: false, history: [], available_rewards: [] });
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState('');

  const fetchData = () => {
    axios.get(`${API}/brane-coins`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { fetchData(); }, [token]);

  const redeem = async (rewardId) => {
    setRedeeming(rewardId);
    try {
      const res = await axios.post(`${API}/brane-coins/redeem`, { reward_id: rewardId }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(res.data.message);
      if (res.data.coupon_code) toast.success(`Seu cupom: ${res.data.coupon_code}`);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.detail || 'Erro'); }
    finally { setRedeeming(''); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center carbon-bg"><div className="w-8 h-8 border-4 border-[#D4A24C] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen carbon-bg py-8" data-testid="brane-coins-page">
      <div className="max-w-3xl mx-auto px-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#A6A8B3] hover:text-[#D4A24C] mb-6"><ArrowLeft className="w-4 h-4" /> Voltar</button>

        {/* Coins Balance */}
        <div className="dark-card rounded-2xl p-8 text-center mb-6 border border-[#D4A24C]/20 bg-gradient-to-b from-[#D4A24C]/5 to-transparent">
          <Coins className="w-12 h-12 text-[#D4A24C] mx-auto mb-3" />
          <p className="text-[#A6A8B3] text-sm mb-1">Seus Brane Coins</p>
          <p className="text-5xl font-bold text-[#D4A24C] mb-2">{data.coins}</p>
          {data.is_vip && (
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#D4A24C]/20 border border-[#D4A24C]/30">
              <Star className="w-4 h-4 text-[#D4A24C]" />
              <span className="text-[#D4A24C] font-bold text-sm">MEMBRO VIP</span>
            </div>
          )}
          <p className="text-[#A6A8B3] text-xs mt-3">Ganhe 1 Brane Coin por cada compra aprovada</p>
        </div>

        {/* Progress to next reward */}
        <div className="dark-card rounded-xl p-6 mb-6">
          <h3 className="text-white font-bold mb-3">Progresso</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[#A6A8B3]">Proximo cupom (5 coins)</span>
                <span className="text-[#D4A24C]">{Math.min(data.coins, 5)}/5</span>
              </div>
              <div className="w-full h-2 bg-[#1E2230] rounded-full"><div className="h-full bg-[#D4A24C] rounded-full transition-all" style={{width: `${Math.min((data.coins / 5) * 100, 100)}%`}} /></div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[#A6A8B3]">Acesso VIP (50 coins)</span>
                <span className="text-[#D4A24C]">{Math.min(data.coins, 50)}/50</span>
              </div>
              <div className="w-full h-2 bg-[#1E2230] rounded-full"><div className="h-full bg-gradient-to-r from-[#D4A24C] to-[#E8C372] rounded-full transition-all" style={{width: `${Math.min((data.coins / 50) * 100, 100)}%`}} /></div>
            </div>
          </div>
        </div>

        {/* Rewards */}
        <div className="dark-card rounded-xl p-6 mb-6">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Gift className="w-5 h-5 text-[#D4A24C]" /> Recompensas Disponiveis</h3>
          {data.available_rewards.length === 0 ? (
            <p className="text-[#A6A8B3] text-center py-4">Continue comprando para desbloquear recompensas!</p>
          ) : (
            <div className="grid gap-3">
              {data.available_rewards.map(r => (
                <div key={r.id} className="flex items-center justify-between p-4 rounded-xl bg-[#11131A] border border-[#1E2230]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#D4A24C]/20 flex items-center justify-center">
                      {r.id === 'vip_access' ? <Trophy className="w-5 h-5 text-[#D4A24C]" /> : <Sparkles className="w-5 h-5 text-[#D4A24C]" />}
                    </div>
                    <div>
                      <p className="text-white font-medium">{r.name}</p>
                      <p className="text-xs text-[#A6A8B3]">{r.description}</p>
                    </div>
                  </div>
                  <Button onClick={() => redeem(r.id)} disabled={redeeming === r.id}
                    className="gold-btn rounded-lg text-sm px-4">
                    {redeeming === r.id ? '...' : `${r.cost} Coins`}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* History */}
        <div className="dark-card rounded-xl p-6">
          <h3 className="text-white font-bold mb-4">Historico</h3>
          {data.history.length === 0 ? (
            <p className="text-[#A6A8B3] text-center py-4">Nenhuma transacao ainda</p>
          ) : (
            <div className="space-y-2">
              {data.history.map(h => (
                <div key={h.tx_id} className="flex items-center justify-between py-2 border-b border-[#1E2230] last:border-0">
                  <div>
                    <p className="text-sm text-white">{h.reason}</p>
                    <p className="text-xs text-[#A6A8B3]">{new Date(h.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <span className={`font-bold ${h.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {h.amount > 0 ? '+' : ''}{h.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
