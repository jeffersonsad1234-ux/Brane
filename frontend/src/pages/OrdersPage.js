import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Package, Zap, CreditCard, DollarSign, Copy, ChevronDown, ChevronUp, CheckCircle, Clock, Truck, MapPin, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TRACKING_STEPS = [
  { key: 'created', label: 'Criado', icon: ShoppingBag },
  { key: 'awaiting_payment', label: 'Aguardando', icon: Clock },
  { key: 'payment_confirmed', label: 'Pago', icon: CheckCircle },
  { key: 'approved', label: 'Aprovado', icon: CheckCircle },
  { key: 'shipped', label: 'Enviado', icon: Truck },
  { key: 'delivered', label: 'Entregue', icon: MapPin }
];

export default function OrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [trackingOrder, setTrackingOrder] = useState(null);

  useEffect(() => {
    axios.get(`${API}/orders`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setOrders(res.data.orders)).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  const copyToClipboard = (text) => navigator.clipboard.writeText(text).then(() => toast.success('Copiado!')).catch(() => {});

  const statusLabels = { 'awaiting_payment': 'Aguardando Pagamento', 'pending': 'Pendente', 'approved': 'Aprovado', 'shipped': 'Enviado', 'delivered': 'Entregue', 'rejected': 'Rejeitado' };
  const statusBadges = {
    'awaiting_payment': 'brane-badge-orange',
    'pending': 'brane-badge-orange',
    'approved': 'brane-badge-green',
    'shipped': 'brane-badge-purple',
    'delivered': 'brane-badge-green',
    'rejected': 'brane-badge-red'
  };
  const methodLabels = { pix: 'PIX', ted: 'Transferência Bancária', paypal: 'PayPal' };
  const methodIcons = { pix: <Zap className="w-4 h-4" />, ted: <CreditCard className="w-4 h-4" />, paypal: <DollarSign className="w-4 h-4" /> };

  if (loading) return <div className="brane-page flex items-center justify-center"><div className="w-9 h-9 border-2 border-[#5B1CB5] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="brane-page py-10" data-testid="orders-page">
      <div className="max-w-3xl mx-auto px-4">
        <p className="brane-label mb-2">Conta</p>
        <h1 className="brane-h1 mb-8 font-['Outfit']">Meus Pedidos</h1>

        {orders.length === 0 ? (
          <div className="brane-card text-center py-16">
            <Package className="w-12 h-12 text-[#4F525B] mx-auto mb-3" />
            <p className="text-[#A6A8B3]">Nenhum pedido realizado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(o => {
              const isExpanded = expandedOrder === o.order_id;
              const paymentInfo = o.payment_info || {};
              const tracking = o.tracking || [];
              const trackingStatuses = tracking.map(t => t.status);

              return (
                <div key={o.order_id} className="brane-card p-5" data-testid={`order-${o.order_id}`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-white">#{o.order_id?.slice(0, 16)}</span>
                    <span className={`brane-badge ${statusBadges[o.status] || ''}`}>{statusLabels[o.status] || o.status}</span>
                  </div>

                  {/* Tracking Timeline */}
                  <div className="mb-5 py-2">
                    <div className="flex items-center justify-between relative">
                      <div className="absolute top-4 left-6 right-6 h-0.5 bg-[#1E2230]" />
                      <div className="absolute top-4 left-6 h-0.5 bg-gradient-to-r from-[#D4A24C] to-[#6D28D9] transition-all" style={{width: `${Math.max(0, (trackingStatuses.length - 1) / (TRACKING_STEPS.length - 1)) * (100 - 12)}%`}} />
                      {TRACKING_STEPS.map((step) => {
                        const isActive = trackingStatuses.includes(step.key);
                        const Icon = step.icon;
                        return (
                          <div key={step.key} className="flex flex-col items-center relative z-10" style={{flex: 1}}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-[#D4A24C] text-[#050608]' : 'bg-[#11131A] text-[#4F525B] border border-[#1E2230]'}`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <span className={`text-[9px] mt-1.5 text-center leading-tight font-medium ${isActive ? 'text-[#D4A24C]' : 'text-[#6F7280]'}`}>{step.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {o.payment_method && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="brane-badge brane-badge-purple">
                        {methodIcons[o.payment_method]} {methodLabels[o.payment_method] || o.payment_method}
                      </span>
                    </div>
                  )}

                  <div className="space-y-2 mb-3">
                    {o.items?.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-[#A6A8B3]">{item.title} x{item.quantity}</span>
                        <span className="font-medium text-white">R$ {item.subtotal?.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#1E2230]">
                    <span className="text-xs text-[#6F7280]">{new Date(o.created_at).toLocaleDateString('pt-BR')}</span>
                    <span className="text-lg font-bold text-[#D4A24C]">R$ {o.total?.toFixed(2)}</span>
                  </div>

                  {/* Tracking button — visible when order approved/shipped/delivered */}
                  {['approved', 'shipped', 'delivered', 'payment_confirmed'].includes(o.status) && (
                    <button
                      onClick={() => setTrackingOrder(trackingOrder === o.order_id ? null : o.order_id)}
                      className="mt-3 w-full py-2.5 rounded-xl text-sm font-semibold text-white transition flex items-center justify-center gap-2"
                      style={{ background: 'linear-gradient(135deg, #3B0F80 0%, #5B1CB5 100%)' }}
                      data-testid={`track-order-${o.order_id}`}
                    >
                      <Truck className="w-4 h-4" />
                      {trackingOrder === o.order_id ? 'Ocultar rastreio' : 'Acompanhar Minha Entrega'}
                    </button>
                  )}

                  {trackingOrder === o.order_id && (
                    <div className="bg-[#11131A] rounded-xl p-4 mt-2 border border-[#5B1CB5]/30 brane-fade-in">
                      {o.tracking_code ? (
                        <>
                          <p className="text-xs text-[#A6A8B3] mb-1">Código de rastreio:</p>
                          <div className="flex items-center justify-between bg-[#050608] rounded-lg p-3 border border-[#1E2230] mb-3">
                            <p className="text-white font-mono text-base break-all">{o.tracking_code}</p>
                            <button onClick={() => copyToClipboard(o.tracking_code)} className="text-[#D4A24C] p-2 hover:bg-[#D4A24C]/10 rounded-lg"><Copy className="w-4 h-4" /></button>
                          </div>
                          <p className="text-xs text-[#6F7280]">Acompanhe no site da transportadora com este código.</p>
                        </>
                      ) : (
                        <div className="flex items-start gap-3 text-sm text-[#A6A8B3]">
                          <Clock className="w-5 h-5 text-[#D4A24C] shrink-0 mt-0.5" />
                          <p>Aguardando o vendedor informar o código de rastreio. Assim que disponível, aparecerá aqui.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {(o.status === 'awaiting_payment' || o.status === 'pending') && paymentInfo.method && (
                    <div className="mt-3">
                      <button onClick={() => setExpandedOrder(isExpanded ? null : o.order_id)}
                        className="w-full flex items-center justify-center gap-2 text-sm text-[#D4A24C] hover:text-[#E8C372] py-2 transition-colors font-medium">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        {isExpanded ? 'Ocultar instruções' : 'Ver instruções de pagamento'}
                      </button>
                      {isExpanded && (
                        <div className="bg-[#050608] rounded-xl p-4 mt-2 border border-[#D4A24C]/30 brane-fade-in">
                          {paymentInfo.method === 'PIX' && (
                            <div className="space-y-2">
                              <p className="text-sm text-[#A6A8B3]">Faça um PIX para:</p>
                              <div className="flex items-center justify-between bg-[#11131A] rounded-lg p-3 border border-[#1E2230]">
                                <div>
                                  <p className="text-xs text-[#6F7280]">{paymentInfo.pix_key_type === 'cpf' ? 'CPF/CNPJ' : paymentInfo.pix_key_type === 'email' ? 'E-mail' : 'Chave'}</p>
                                  <p className="text-white font-mono">{paymentInfo.pix_key}</p>
                                </div>
                                <button onClick={() => copyToClipboard(paymentInfo.pix_key)} className="text-[#D4A24C] p-2 hover:bg-[#D4A24C]/10 rounded-lg"><Copy className="w-4 h-4" /></button>
                              </div>
                            </div>
                          )}
                          {paymentInfo.method === 'Transferencia Bancaria' && (
                            <div className="space-y-2">
                              <p className="text-sm text-[#A6A8B3]">Dados bancários:</p>
                              <div className="bg-[#11131A] rounded-lg p-3 space-y-1 text-sm border border-[#1E2230]">
                                {[['Banco', paymentInfo.bank_name], ['Titular', paymentInfo.account_name], ['Agência', paymentInfo.bank_branch], ['Conta', paymentInfo.account_number]].map(([l, v]) => (
                                  <div key={l} className="flex justify-between"><span className="text-[#6F7280]">{l}:</span><span className="text-white">{v}</span></div>
                                ))}
                              </div>
                            </div>
                          )}
                          {paymentInfo.method === 'PayPal' && (
                            <div className="space-y-2">
                              <p className="text-sm text-[#A6A8B3]">Envie para o PayPal:</p>
                              <div className="flex items-center justify-between bg-[#11131A] rounded-lg p-3 border border-[#1E2230]">
                                <p className="text-white">{paymentInfo.paypal_email}</p>
                                <button onClick={() => copyToClipboard(paymentInfo.paypal_email)} className="text-[#D4A24C] p-2 hover:bg-[#D4A24C]/10 rounded-lg"><Copy className="w-4 h-4" /></button>
                              </div>
                            </div>
                          )}
                          <p className="text-xs text-[#D4A24C] mt-3">Valor: R$ {o.total?.toFixed(2)} — Após o pagamento, o status será atualizado.</p>
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
