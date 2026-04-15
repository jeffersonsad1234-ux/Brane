import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Package, Zap, CreditCard, DollarSign, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function OrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    axios.get(`${API}/orders`, { headers: { Authorization: `Bearer ${token}` }, withCredentials: true })
      .then(res => setOrders(res.data.orders)).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => toast.success('Copiado!')).catch(() => {});
  };

  const statusLabels = {
    'awaiting_payment': 'Aguardando Pagamento',
    'pending': 'Pendente',
    'approved': 'Aprovado',
    'rejected': 'Rejeitado'
  };
  const statusColors = {
    'awaiting_payment': 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    'pending': 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
    'approved': 'bg-green-500/20 text-green-400 border border-green-500/30',
    'rejected': 'bg-red-500/20 text-red-400 border border-red-500/30'
  };
  const methodLabels = { pix: 'PIX', ted: 'Transferencia Bancaria', paypal: 'PayPal' };
  const methodIcons = {
    pix: <Zap className="w-4 h-4" />,
    ted: <CreditCard className="w-4 h-4" />,
    paypal: <DollarSign className="w-4 h-4" />
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center carbon-bg"><div className="w-8 h-8 border-4 border-[#B38B36] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen carbon-bg py-8" data-testid="orders-page">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-2xl font-bold font-['Outfit'] text-white mb-6">Meus Pedidos</h1>
        {orders.length === 0 ? (
          <div className="text-center py-16 dark-card rounded-xl"><Package className="w-12 h-12 text-[#444] mx-auto mb-3" /><p className="text-[#888]">Nenhum pedido realizado</p></div>
        ) : (
          <div className="space-y-4">
            {orders.map(o => {
              const isExpanded = expandedOrder === o.order_id;
              const paymentInfo = o.payment_info || {};
              return (
                <div key={o.order_id} className="dark-card rounded-xl p-5" data-testid={`order-${o.order_id}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-white">#{o.order_id?.slice(0, 16)}</span>
                    <span className={`text-xs px-3 py-1 rounded-full ${statusColors[o.status] || 'bg-[#333] text-[#888]'}`}>
                      {statusLabels[o.status] || o.status}
                    </span>
                  </div>

                  {/* Payment method badge */}
                  {o.payment_method && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs px-2 py-0.5 rounded bg-[#1A1A1A] text-[#B38B36] border border-[#B38B36]/30 flex items-center gap-1">
                        {methodIcons[o.payment_method]} {methodLabels[o.payment_method] || o.payment_method}
                      </span>
                    </div>
                  )}

                  <div className="space-y-2 mb-3">
                    {o.items?.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-[#888]">{item.title} x{item.quantity}</span>
                        <span className="font-medium text-white">R$ {item.subtotal?.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#2A2A2A]">
                    <span className="text-xs text-[#888]">{new Date(o.created_at).toLocaleDateString('pt-BR')}</span>
                    <span className="text-lg font-bold text-[#B38B36]">R$ {o.total?.toFixed(2)}</span>
                  </div>

                  {/* Show payment instructions for awaiting_payment */}
                  {(o.status === 'awaiting_payment' || o.status === 'pending') && paymentInfo.method && (
                    <div className="mt-3">
                      <button
                        onClick={() => setExpandedOrder(isExpanded ? null : o.order_id)}
                        className="w-full flex items-center justify-center gap-2 text-sm text-[#B38B36] hover:text-[#D4A842] py-2 transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        {isExpanded ? 'Ocultar instrucoes' : 'Ver instrucoes de pagamento'}
                      </button>

                      {isExpanded && (
                        <div className="bg-[#111] rounded-lg p-4 mt-2 border border-[#B38B36]/30 animate-fadeIn">
                          {paymentInfo.method === 'PIX' && (
                            <div className="space-y-2">
                              <p className="text-sm text-[#CCC]">Faca um PIX para:</p>
                              <div className="flex items-center justify-between bg-[#0A0A0A] rounded-lg p-3">
                                <div>
                                  <p className="text-xs text-[#888]">{paymentInfo.pix_key_type === 'cpf' ? 'CPF/CNPJ' : paymentInfo.pix_key_type === 'email' ? 'E-mail' : paymentInfo.pix_key_type === 'phone' ? 'Telefone' : 'Chave'}</p>
                                  <p className="text-white font-mono">{paymentInfo.pix_key}</p>
                                </div>
                                <button onClick={() => copyToClipboard(paymentInfo.pix_key)} className="text-[#B38B36] p-2"><Copy className="w-4 h-4" /></button>
                              </div>
                            </div>
                          )}
                          {paymentInfo.method === 'Transferencia Bancaria' && (
                            <div className="space-y-2">
                              <p className="text-sm text-[#CCC]">Dados bancarios:</p>
                              <div className="bg-[#0A0A0A] rounded-lg p-3 space-y-1 text-sm">
                                <div className="flex justify-between"><span className="text-[#888]">Banco:</span><span className="text-white">{paymentInfo.bank_name}</span></div>
                                <div className="flex justify-between"><span className="text-[#888]">Titular:</span><span className="text-white">{paymentInfo.account_name}</span></div>
                                <div className="flex justify-between"><span className="text-[#888]">Agencia:</span><span className="text-white">{paymentInfo.bank_branch}</span></div>
                                <div className="flex justify-between"><span className="text-[#888]">Conta:</span><span className="text-white">{paymentInfo.account_number}</span></div>
                              </div>
                            </div>
                          )}
                          {paymentInfo.method === 'PayPal' && (
                            <div className="space-y-2">
                              <p className="text-sm text-[#CCC]">Envie para o PayPal:</p>
                              <div className="flex items-center justify-between bg-[#0A0A0A] rounded-lg p-3">
                                <p className="text-white">{paymentInfo.paypal_email}</p>
                                <button onClick={() => copyToClipboard(paymentInfo.paypal_email)} className="text-[#B38B36] p-2"><Copy className="w-4 h-4" /></button>
                              </div>
                            </div>
                          )}
                          <p className="text-xs text-yellow-400 mt-3">Valor: R$ {o.total?.toFixed(2)} - O pagamento sera confirmado pelo administrador.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
