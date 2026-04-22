import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Wallet, ArrowDownCircle, ArrowUpCircle, Clock, CreditCard, Building, Key, Check, AlertCircle, Banknote, Edit3, Save } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function WalletPage() {
  const { token, user } = useAuth();
  const [wallet, setWallet] = useState({ available: 0, held: 0 });
  const [transactions, setTransactions] = useState([]);
  const [wdAmount, setWdAmount] = useState('');
  const [wdMethod, setWdMethod] = useState('pix');
  const [loading, setLoading] = useState(true);
  const [bankDetails, setBankDetails] = useState({
    bank_name: '',
    account_name: '',
    account_number: '',
    pix_key: ''
  });
  const [editingBank, setEditingBank] = useState(false);
  const [savingBank, setSavingBank] = useState(false);
  const headers = { Authorization: `Bearer ${token}` };

  const refresh = async () => {
    try {
      const [walletRes, historyRes, profileRes] = await Promise.all([
        axios.get(`${API}/wallet`, { headers }),
        axios.get(`${API}/wallet/history`, { headers }),
        axios.get(`${API}/users/profile`, { headers })
      ]);
      setWallet(walletRes.data);
      setTransactions(historyRes.data.transactions);
      if (profileRes.data.bank_details) {
        setBankDetails(profileRes.data.bank_details);
      }
    } catch {}
  };

  useEffect(() => { refresh().finally(() => setLoading(false)); }, []);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!bankDetails.pix_key && wdMethod === 'pix') {
      toast.error('Cadastre sua chave PIX primeiro!');
      return;
    }
    if (!bankDetails.account_number && wdMethod === 'ted') {
      toast.error('Cadastre seus dados bancários primeiro!');
      return;
    }
    try {
      await axios.post(`${API}/wallet/withdraw`, { amount: parseFloat(wdAmount), method: wdMethod }, { headers });
      toast.success('Solicitação de saque enviada! Aguarde aprovação do admin.');
      setWdAmount('');
      refresh();
    } catch (err) { toast.error(err.response?.data?.detail || 'Erro ao solicitar saque'); }
  };

  const saveBankDetails = async () => {
    setSavingBank(true);
    try {
      await axios.put(`${API}/users/bank-details`, bankDetails, { headers });
      toast.success('Dados bancários salvos!');
      setEditingBank(false);
    } catch { toast.error('Erro ao salvar dados bancários'); }
    finally { setSavingBank(false); }
  };

  const hasBankData = bankDetails.pix_key || bankDetails.account_number;

  if (loading) return <div className="min-h-screen flex items-center justify-center carbon-bg"><div className="w-8 h-8 border-4 border-[#B38B36] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen carbon-bg py-8" data-testid="wallet-page">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold font-['Outfit'] text-white mb-6 flex items-center gap-3">
          <Wallet className="w-7 h-7 text-[#B38B36]" /> Minha Carteira
        </h1>

        {/* Balance Cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="dark-card rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full -mr-8 -mt-8" />
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-green-900/30 flex items-center justify-center">
                <ArrowDownCircle className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-sm text-[#888]">Disponível para Saque</span>
            </div>
            <p className="text-3xl font-bold text-green-400" data-testid="available-balance">
              R$ {wallet.available?.toFixed(2)}
            </p>
            {wallet.available > 0 && (
              <p className="text-xs text-green-400/60 mt-1">✓ Pronto para sacar</p>
            )}
          </div>
          
          <div className="dark-card rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-8 -mt-8" />
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-blue-900/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-sm text-[#888]">Saldo Retido</span>
            </div>
            <p className="text-3xl font-bold text-blue-400" data-testid="held-balance">
              R$ {wallet.held?.toFixed(2)}
            </p>
            <p className="text-xs text-blue-400/60 mt-1">Aguardando liberação</p>
          </div>

          <div className="dark-card rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#B38B36]/5 rounded-full -mr-8 -mt-8" />
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-[#B38B36]/20 flex items-center justify-center">
                <Banknote className="w-5 h-5 text-[#B38B36]" />
              </div>
              <span className="text-sm text-[#888]">Total</span>
            </div>
            <p className="text-3xl font-bold text-[#B38B36]">
              R$ {(wallet.available + wallet.held).toFixed(2)}
            </p>
            <p className="text-xs text-[#B38B36]/60 mt-1">Disponível + Retido</p>
          </div>
        </div>

        <Tabs defaultValue="withdraw" className="w-full">
          <TabsList className="grid grid-cols-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-1 mb-6">
            <TabsTrigger value="withdraw" className="data-[state=active]:bg-[#B38B36] data-[state=active]:text-white text-[#888] rounded-lg">
              <Banknote className="w-4 h-4 mr-2" /> Sacar
            </TabsTrigger>
            <TabsTrigger value="bank" className="data-[state=active]:bg-[#B38B36] data-[state=active]:text-white text-[#888] rounded-lg">
              <Building className="w-4 h-4 mr-2" /> Dados Bancários
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-[#B38B36] data-[state=active]:text-white text-[#888] rounded-lg">
              <Clock className="w-4 h-4 mr-2" /> Histórico
            </TabsTrigger>
          </TabsList>

          {/* Withdraw Tab */}
          <TabsContent value="withdraw">
            <div className="dark-card rounded-xl p-6">
              <h2 className="font-bold mb-4 font-['Outfit'] text-white flex items-center gap-2">
                <Banknote className="w-5 h-5 text-[#B38B36]" /> Solicitar Saque
              </h2>

              {!hasBankData && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-yellow-400 font-medium text-sm">Cadastre seus dados bancários</p>
                    <p className="text-yellow-400/70 text-xs mt-1">Para solicitar saques, você precisa cadastrar sua chave PIX ou dados bancários na aba "Dados Bancários".</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleWithdraw} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[#CCC]">Valor do Saque (R$)</Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      value={wdAmount} 
                      onChange={e => setWdAmount(e.target.value)} 
                      min="0.01" 
                      max={wallet.available}
                      required
                      placeholder="0,00"
                      className="bg-[#111] border-[#2A2A2A] text-white text-lg" 
                      data-testid="withdraw-amount" 
                    />
                    <p className="text-xs text-[#666] mt-1">Máximo disponível: R$ {wallet.available?.toFixed(2)}</p>
                  </div>
                  <div>
                    <Label className="text-[#CCC]">Método de Saque</Label>
                    <Select value={wdMethod} onValueChange={setWdMethod}>
                      <SelectTrigger className="bg-[#111] border-[#2A2A2A] text-white" data-testid="withdraw-method">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1A1A1A] border-[#2A2A2A]">
                        <SelectItem value="pix">
                          <div className="flex items-center gap-2">
                            <Key className="w-4 h-4 text-green-400" />
                            PIX (Instantâneo)
                          </div>
                        </SelectItem>
                        <SelectItem value="ted">
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-blue-400" />
                            TED (até 2 dias úteis)
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {wdMethod === 'pix' && bankDetails.pix_key && (
                  <div className="bg-[#111] rounded-lg p-3 border border-[#2A2A2A]">
                    <p className="text-xs text-[#888]">Chave PIX cadastrada:</p>
                    <p className="text-sm text-green-400 font-medium">{bankDetails.pix_key}</p>
                  </div>
                )}

                {wdMethod === 'ted' && bankDetails.account_number && (
                  <div className="bg-[#111] rounded-lg p-3 border border-[#2A2A2A]">
                    <p className="text-xs text-[#888]">Conta cadastrada:</p>
                    <p className="text-sm text-blue-400 font-medium">{bankDetails.bank_name} - Ag {bankDetails.account_number}</p>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full gold-btn rounded-lg py-5 text-base font-semibold" 
                  disabled={wallet.available <= 0 || !hasBankData}
                  data-testid="withdraw-submit"
                >
                  <Banknote className="w-5 h-5 mr-2" />
                  {wallet.available <= 0 ? 'Sem saldo disponível' : 'Solicitar Saque'}
                </Button>

                <p className="text-xs text-[#666] text-center">
                  Após solicitar, o administrador irá analisar e aprovar seu saque.
                </p>
              </form>
            </div>
          </TabsContent>

          {/* Bank Details Tab */}
          <TabsContent value="bank">
            <div className="dark-card rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold font-['Outfit'] text-white flex items-center gap-2">
                  <Building className="w-5 h-5 text-[#B38B36]" /> Dados Bancários
                </h2>
                {!editingBank && (
                  <Button variant="outline" size="sm" onClick={() => setEditingBank(true)} className="border-[#B38B36] text-[#B38B36]">
                    <Edit3 className="w-4 h-4 mr-1" /> Editar
                  </Button>
                )}
              </div>

              <div className="space-y-6">
                {/* PIX Section */}
                <div className="border border-[#2A2A2A] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Key className="w-5 h-5 text-green-400" />
                    <h3 className="font-semibold text-white">Chave PIX</h3>
                    {bankDetails.pix_key && <Check className="w-4 h-4 text-green-400" />}
                  </div>
                  {editingBank ? (
                    <Input 
                      value={bankDetails.pix_key || ''} 
                      onChange={e => setBankDetails({...bankDetails, pix_key: e.target.value})}
                      placeholder="CPF, E-mail, Telefone ou Chave Aleatória"
                      className="bg-[#111] border-[#2A2A2A] text-white"
                    />
                  ) : (
                    <p className={`text-sm ${bankDetails.pix_key ? 'text-green-400' : 'text-[#666]'}`}>
                      {bankDetails.pix_key || 'Não cadastrado'}
                    </p>
                  )}
                </div>

                {/* Bank Account Section */}
                <div className="border border-[#2A2A2A] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard className="w-5 h-5 text-blue-400" />
                    <h3 className="font-semibold text-white">Conta Bancária (TED)</h3>
                    {bankDetails.account_number && <Check className="w-4 h-4 text-green-400" />}
                  </div>
                  
                  {editingBank ? (
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[#888] text-xs">Nome do Banco</Label>
                        <Input 
                          value={bankDetails.bank_name || ''} 
                          onChange={e => setBankDetails({...bankDetails, bank_name: e.target.value})}
                          placeholder="Ex: Nubank, Itaú, Bradesco"
                          className="bg-[#111] border-[#2A2A2A] text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-[#888] text-xs">Nome do Titular</Label>
                        <Input 
                          value={bankDetails.account_name || ''} 
                          onChange={e => setBankDetails({...bankDetails, account_name: e.target.value})}
                          placeholder="Nome completo"
                          className="bg-[#111] border-[#2A2A2A] text-white"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Label className="text-[#888] text-xs">Agência e Conta</Label>
                        <Input 
                          value={bankDetails.account_number || ''} 
                          onChange={e => setBankDetails({...bankDetails, account_number: e.target.value})}
                          placeholder="Ex: 0001 / 12345-6"
                          className="bg-[#111] border-[#2A2A2A] text-white"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {bankDetails.bank_name ? (
                        <>
                          <p className="text-sm text-white">{bankDetails.bank_name}</p>
                          <p className="text-sm text-[#888]">Titular: {bankDetails.account_name || '-'}</p>
                          <p className="text-sm text-[#888]">Conta: {bankDetails.account_number || '-'}</p>
                        </>
                      ) : (
                        <p className="text-sm text-[#666]">Não cadastrado</p>
                      )}
                    </div>
                  )}
                </div>

                {editingBank && (
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setEditingBank(false)} className="flex-1 border-[#2A2A2A] text-[#888]">
                      Cancelar
                    </Button>
                    <Button onClick={saveBankDetails} disabled={savingBank} className="flex-1 gold-btn rounded-lg">
                      <Save className="w-4 h-4 mr-2" />
                      {savingBank ? 'Salvando...' : 'Salvar Dados'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <div className="dark-card rounded-xl p-6">
              <h2 className="font-bold mb-4 font-['Outfit'] text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#B38B36]" /> Histórico de Transações
              </h2>
              
              {transactions.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-[#333] mx-auto mb-3" />
                  <p className="text-[#888]">Nenhuma transação ainda</p>
                  <p className="text-xs text-[#666] mt-1">Suas vendas e saques aparecerão aqui</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map(tx => (
                    <div key={tx.tx_id} className="bg-[#111] rounded-lg p-4 flex items-center justify-between border border-[#1A1A1A] hover:border-[#2A2A2A] transition-colors" data-testid={`tx-${tx.tx_id}`}>
                      <div className="flex items-center gap-3">
                        {tx.amount >= 0 ? (
                          <div className="w-10 h-10 rounded-full bg-green-900/30 flex items-center justify-center">
                            <ArrowDownCircle className="w-5 h-5 text-green-400" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-red-900/30 flex items-center justify-center">
                            <ArrowUpCircle className="w-5 h-5 text-red-400" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-white">{tx.description}</p>
                          <p className="text-xs text-[#666]">{new Date(tx.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${tx.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {tx.amount >= 0 ? '+' : ''}R$ {Math.abs(tx.amount).toFixed(2)}
                        </p>
                        <span className={`status-badge status-${tx.status}`}>{tx.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
