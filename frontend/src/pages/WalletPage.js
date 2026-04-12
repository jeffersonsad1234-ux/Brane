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

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/wallet`, { headers, withCredentials: true }),
      axios.get(`${API}/wallet/history`, { headers, withCredentials: true })
    ]).then(([walletRes, txRes]) => {
      setWallet(walletRes.data);
      setTransactions(txRes.data.transactions);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/wallet/withdraw`, { amount: parseFloat(wdAmount), method: wdMethod }, { headers, withCredentials: true });
      toast.success('Solicitacao de saque enviada!');
      setWdAmount('');
      // Refresh
      const [walletRes, txRes] = await Promise.all([
        axios.get(`${API}/wallet`, { headers, withCredentials: true }),
        axios.get(`${API}/wallet/history`, { headers, withCredentials: true })
      ]);
      setWallet(walletRes.data);
      setTransactions(txRes.data.transactions);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao solicitar saque');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F9F8]">
      <div className="w-8 h-8 border-4 border-[#B38B36] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F9F9F8] py-8" data-testid="wallet-page">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-2xl font-bold font-['Outfit'] text-[#1A1A1A] mb-6">Carteira</h1>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-[#E5E5E5] p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                <ArrowDownCircle className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm text-[#666]">Saldo Disponivel</span>
            </div>
            <p className="text-2xl font-bold text-green-600" data-testid="available-balance">R$ {wallet.available?.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#E5E5E5] p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm text-[#666]">Saldo Retido</span>
            </div>
            <p className="text-2xl font-bold text-blue-600" data-testid="held-balance">R$ {wallet.held?.toFixed(2)}</p>
          </div>
        </div>

        {/* Withdrawal Form */}
        <div className="bg-white rounded-xl border border-[#E5E5E5] p-6 mb-8">
          <h2 className="font-bold mb-4 font-['Outfit']">Solicitar Saque</h2>
          <form onSubmit={handleWithdraw} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Label>Valor (R$)</Label>
              <Input type="number" step="0.01" value={wdAmount} onChange={e => setWdAmount(e.target.value)} min="0.01" required data-testid="withdraw-amount" />
            </div>
            <div className="w-full sm:w-40">
              <Label>Metodo</Label>
              <Select value={wdMethod} onValueChange={setWdMethod}>
                <SelectTrigger data-testid="withdraw-method"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">Pix (Instantaneo)</SelectItem>
                  <SelectItem value="ted">TED (ate 2 dias)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="submit" className="gold-btn rounded-lg w-full sm:w-auto" data-testid="withdraw-submit">Solicitar</Button>
            </div>
          </form>
        </div>

        {/* Transaction History */}
        <h2 className="font-bold mb-4 font-['Outfit']">Historico</h2>
        {transactions.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-xl border border-[#E5E5E5]">
            <p className="text-[#999]">Nenhuma transacao</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map(tx => (
              <div key={tx.tx_id} className="bg-white rounded-lg border border-[#E5E5E5] p-4 flex items-center justify-between" data-testid={`tx-${tx.tx_id}`}>
                <div className="flex items-center gap-3">
                  {tx.amount >= 0 ? (
                    <ArrowDownCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <ArrowUpCircle className="w-5 h-5 text-red-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{tx.description}</p>
                    <p className="text-xs text-[#999]">{new Date(tx.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
