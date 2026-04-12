import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Wallet, ArrowDownCircle, ArrowUpCircle, Clock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function WalletPage() {
  const { token } = useAuth();
  const [wallet, setWallet] = useState({ available: 0, held: 0 });
  const [transactions, setTransactions] = useState([]);
  const [wdAmount, setWdAmount] = useState('');
  const [wdMethod, setWdMethod] = useState('pix');
  const [loading, setLoading] = useState(true);
  const headers = { Authorization: `Bearer ${token}` };

  const refresh = () => Promise.all([
    axios.get(`${API}/wallet`, { headers, withCredentials: true }),
    axios.get(`${API}/wallet/history`, { headers, withCredentials: true })
  ]).then(([w, t]) => { setWallet(w.data); setTransactions(t.data.transactions); });

  useEffect(() => { refresh().finally(() => setLoading(false)); }, []);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/wallet/withdraw`, { amount: parseFloat(wdAmount), method: wdMethod }, { headers, withCredentials: true });
      toast.success('Solicitacao de saque enviada!');
      setWdAmount('');
      refresh();
    } catch (err) { toast.error(err.response?.data?.detail || 'Erro ao solicitar saque'); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center carbon-bg"><div className="w-8 h-8 border-4 border-[#B38B36] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen carbon-bg py-8" data-testid="wallet-page">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-2xl font-bold font-['Outfit'] text-white mb-6">Carteira</h1>
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="dark-card rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-green-900/30 flex items-center justify-center"><ArrowDownCircle className="w-5 h-5 text-green-400" /></div>
              <span className="text-sm text-[#888]">Saldo Disponivel</span>
            </div>
            <p className="text-2xl font-bold text-green-400" data-testid="available-balance">R$ {wallet.available?.toFixed(2)}</p>
          </div>
          <div className="dark-card rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-blue-900/30 flex items-center justify-center"><Clock className="w-5 h-5 text-blue-400" /></div>
              <span className="text-sm text-[#888]">Saldo Retido</span>
            </div>
            <p className="text-2xl font-bold text-blue-400" data-testid="held-balance">R$ {wallet.held?.toFixed(2)}</p>
          </div>
        </div>
        <div className="dark-card rounded-xl p-6 mb-8">
          <h2 className="font-bold mb-4 font-['Outfit'] text-white">Solicitar Saque</h2>
          <form onSubmit={handleWithdraw} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Label className="text-[#CCC]">Valor (R$)</Label>
              <Input type="number" step="0.01" value={wdAmount} onChange={e => setWdAmount(e.target.value)} min="0.01" required
                className="bg-[#111] border-[#2A2A2A] text-white" data-testid="withdraw-amount" />
            </div>
            <div className="w-full sm:w-40">
              <Label className="text-[#CCC]">Metodo</Label>
              <Select value={wdMethod} onValueChange={setWdMethod}>
                <SelectTrigger className="bg-[#111] border-[#2A2A2A] text-white" data-testid="withdraw-method"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-[#2A2A2A]">
                  <SelectItem value="pix">Pix (Instantaneo)</SelectItem>
                  <SelectItem value="ted">TED (ate 2 dias)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end"><Button type="submit" className="gold-btn rounded-lg w-full sm:w-auto" data-testid="withdraw-submit">Solicitar</Button></div>
          </form>
        </div>
        <h2 className="font-bold mb-4 font-['Outfit'] text-white">Historico</h2>
        {transactions.length === 0 ? (
          <div className="text-center py-8 dark-card rounded-xl"><p className="text-[#888]">Nenhuma transacao</p></div>
        ) : (
          <div className="space-y-2">
            {transactions.map(tx => (
              <div key={tx.tx_id} className="dark-card rounded-lg p-4 flex items-center justify-between" data-testid={`tx-${tx.tx_id}`}>
                <div className="flex items-center gap-3">
                  {tx.amount >= 0 ? <ArrowDownCircle className="w-5 h-5 text-green-400" /> : <ArrowUpCircle className="w-5 h-5 text-red-400" />}
                  <div>
                    <p className="text-sm font-medium text-white">{tx.description}</p>
                    <p className="text-xs text-[#888]">{new Date(tx.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm ${tx.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.amount >= 0 ? '+' : ''}R$ {Math.abs(tx.amount).toFixed(2)}
                  </p>
                  <span className={`status-badge status-${tx.status}`}>{tx.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
