import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Package, Zap, CreditCard, DollarSign, Copy, ChevronDown, ChevronUp, CheckCircle, Clock, Truck, MapPin, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TRACKING_STEPS = [
  { key: 'created', label: 'Pedido Criado', icon: ShoppingBag },
  { key: 'awaiting_payment', label: 'Aguardando Pagamento', icon: Clock },
  { key: 'payment_confirmed', label: 'Pagamento Confirmado', icon: CheckCircle },
  { key: 'approved', label: 'Aprovado', icon: CheckCircle },
  { key: 'shipped', label: 'Enviado', icon: Truck },
  { key: 'delivered', label: 'Entregue', icon: MapPin }
];

export default function OrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    axios.get(`${API}/orders`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setOrders(res.data.orders)).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  const copyToClipboard = (text) => navigator.clipboard.writeText(text).then(() => toast.success('Copiado!')).catch(() => {});

  const statusLabels = { 'awaiting_payment': 'Aguardando Pagamento', 'pending': 'Pendente', 'approved': 'Aprovado', 'shipped': 'Enviado', 'delivered': 'Entregue', 'rejected': 'Rejeitado' };
  const statusColors = { 'awaiting_payment': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', 'pending': 'bg-orange-500/20 text-orange-400 border-orange-500/30', 'approved': 'bg-green-500/20 text-green-400 border-green-500/30', 'shipped': 'bg-blue-500/20 text-blue-400 border-blue-500/30', 'delivered': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', 'rejected': 'bg-red-500/20 text-red-400 border-red-500/30' };
  const methodLabels = { pix: 'PIX', ted: 'Transferencia Bancaria', paypal: 'PayPal' };
  const methodIcons = { pix: <Zap className="w-4 h-4" />, ted: <CreditCard className="w-4 h-4" />, paypal: <DollarSign className="w-4 h-4" /> };

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
              const tracking = o.tracking || [];
              const trackingStatuses = tracking.map(t => t.status);

              return (
                <div key={o.order_id} className="dark-card rounded-xl p-5" data-testid={`order-${o.order_id}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-white">#{o.order_id?.slice(0, 16)}</span>
                    <span className={`text-xs px-3 py-1 rounded-full border ${statusColors[o.status] || 'bg-[#333] text-[#888]'}`}>{statusLabels[o.status] || o.status}</span>
                  </div>

                  {/* Tracking Timeline - Shopee Style */}
                  <div className="mb-4 py-3">
                    <div className="flex items-center justify-between relative">
                      {/* Background line */}
                      <div className="absolute top-4 left-6 right-6 h-0.5 bg-[#2A2A2A]" />
                      <div className="absolute top-4 left-6 h-0.5 bg-[#B38B36] transition-all" style={{width: `${Math.max(0, (trackingStatuses.length - 1) / (TRACKING_STEPS.length - 1)) * (100 - 12)}%`}} />
                      {TRACKING_STEPS.map((step, i) => {
                        const isActive = trackingStatuses.includes(step.key);
                        const Icon = step.icon;
                        return (
                          <div key={step.key} className="flex flex-col items-center relative z-10" style={{flex: 1}}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-[#B38B36] text-white' : 'bg-[#2A2A2A] text-[#555]'}`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <span className={`text-[9px] mt-1 text-center leading-tight ${isActive ? 'text-[#B38B36]' : 'text-[#555]'}`}>{step.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

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

                  {/* Payment instructions for awaiting orders */}
                  {(o.status === 'awaiting_payment' || o.status === 'pending') && paymentInfo.method && (
                    <div className="mt-3">
                      <button onClick={() => setExpandedOrder(isExpanded ? null : o.order_id)}
                        className="w-full flex items-center justify-center gap-2 text-sm text-[#B38B36] hover:text-[#D4A842] py-2 transition-colors">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        {isExpanded ? 'Ocultar instrucoes' : 'Ver instrucoes de pagamento'}
                      </button>
                      {isExpanded && (
                        <div className="bg-[#111] rounded-lg p-4 mt-2 border border-[#B38B36]/30 animate-fadeIn">
                          {paymentInfo.method === 'PIX' && (
                            <div className="space-y-2">
                              <p className="text-sm text-[#CCC]">Faca um PIX para:</p>
                              <div className="flex items-center justify-between bg-[#0A0A0A] rounded-lg p-3">
                                <div><p className="text-xs text-[#888]">{paymentInfo.pix_key_type === 'cpf' ? 'CPF/CNPJ' : paymentInfo.pix_key_type === 'email' ? 'E-mail' : 'Chave'}</p><p className="text-white font-mono">{paymentInfo.pix_key}</p></div>
                                <button onClick={() => copyToClipboard(paymentInfo.pix_key)} className="text-[#B38B36] p-2"><Copy className="w-4 h-4" /></button>
                              </div>
                            </div>
                          )}
                          {paymentInfo.method === 'Transferencia Bancaria' && (
                            <div className="space-y-2">
                              <p className="text-sm text-[#CCC]">Dados bancarios:</p>
                              <div className="bg-[#0A0A0A] rounded-lg p-3 space-y-1 text-sm">
                                {[['Banco', paymentInfo.bank_name], ['Titular', paymentInfo.account_name], ['Agencia', paymentInfo.bank_branch], ['Conta', paymentInfo.account_number]].map(([l, v]) => (
                                  <div key={l} className="flex justify-between"><span className="text-[#888]">{l}:</span><span className="text-white">{v}</span></div>
                                ))}
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
                          <p className="text-xs text-yellow-400 mt-3">Valor: R$ {o.total?.toFixed(2)} - Apos o pagamento, o status sera atualizado.</p>
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
