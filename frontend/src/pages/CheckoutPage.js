import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { ArrowLeft, Truck, Tag, MapPin, User, CreditCard, CheckCircle, Gift, Zap, Package, DollarSign, Copy, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STATES = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

export default function CheckoutPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [step, setStep] = useState(1); // 1=address, 2=shipping, 3=payment
  const [shippingOptions, setShippingOptions] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState('gratis');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState('');
  const [orderComplete, setOrderComplete] = useState(null);
  const [address, setAddress] = useState({
    name: user?.name || '',
    cpf: '',
    phone: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zip_code: ''
  });
  
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    Promise.all([
      axios.get(`${API}/cart`, { headers, withCredentials: true }),
      axios.get(`${API}/shipping/options`),
      axios.get(`${API}/payment-methods`)
    ]).then(([cartRes, shippingRes, paymentRes]) => {
      if (cartRes.data.items.length === 0) {
        toast.error('Carrinho vazio');
        navigate('/cart');
        return;
      }
      setItems(cartRes.data.items);
      setShippingOptions(shippingRes.data.options || []);
      if (shippingRes.data.options?.length > 0) {
        setSelectedShipping(shippingRes.data.options[0].name.toLowerCase().replace(' ', '_'));
      }
      const methods = paymentRes.data.methods || [];
      setPaymentMethods(methods);
      if (methods.length > 0) {
        setSelectedPayment(methods[0].id);
      }
    }).catch(() => toast.error('Erro ao carregar checkout'))
    .finally(() => setLoading(false));
  }, [user]);

  const subtotal = items.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
  const shippingCost = shippingOptions.find(o => o.name.toLowerCase().replace(' ', '_') === selectedShipping)?.price || 0;
  const discount = appliedCoupon ? (appliedCoupon.type === 'percentage' ? subtotal * appliedCoupon.value : Math.min(appliedCoupon.value, subtotal)) : 0;
  const total = subtotal - discount + shippingCost;

  const validateCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const res = await axios.post(`${API}/coupons/validate`, { code: couponCode }, { headers, withCredentials: true });
      setAppliedCoupon(res.data);
      toast.success(`Cupom ${res.data.code} aplicado!`);
    } catch { toast.error('Cupom invalido ou expirado'); }
  };

  const formatCPF = (v) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2').slice(0, 14);
  const formatPhone = (v) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 15);
  const formatCEP = (v) => v.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);

  const handleAddressChange = (field, value) => {
    if (field === 'cpf') value = formatCPF(value);
    if (field === 'phone') value = formatPhone(value);
    if (field === 'zip_code') value = formatCEP(value);
    setAddress(prev => ({ ...prev, [field]: value }));
  };

  const validateAddress = () => {
    const required = ['name', 'cpf', 'phone', 'street', 'number', 'neighborhood', 'city', 'state', 'zip_code'];
    for (const field of required) {
      if (!address[field]?.trim()) {
        toast.error(`Preencha o campo ${field === 'zip_code' ? 'CEP' : field}`);
        return false;
      }
    }
    if (address.cpf.replace(/\D/g, '').length !== 11) {
      toast.error('CPF invalido');
      return false;
    }
    return true;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => toast.success('Copiado!')).catch(() => {});
  };

  const handleCheckout = async () => {
    if (!validateAddress()) return;
    if (!selectedPayment) {
      toast.error('Selecione um metodo de pagamento');
      return;
    }
    setOrdering(true);
    try {
      const urlParams = new URLSearchParams(location.search);
      const res = await axios.post(`${API}/orders`, {
        affiliate_code: urlParams.get('ref') || null,
        shipping_address: address,
        shipping_option: selectedShipping,
        coupon_code: appliedCoupon?.code || null,
        payment_method: selectedPayment
      }, { headers, withCredentials: true });
      setOrderComplete(res.data);
      toast.success('Pedido realizado! Faca o pagamento para confirmar.');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao finalizar pedido');
    } finally { setOrdering(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center carbon-bg"><div className="w-8 h-8 border-4 border-[#B38B36] border-t-transparent rounded-full animate-spin" /></div>;

  // Order complete - show payment instructions
  if (orderComplete) {
    const paymentInfo = orderComplete.payment_info || {};
    return (
      <div className="min-h-screen carbon-bg py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="dark-card rounded-xl p-8 text-center animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-[#B38B36]/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-[#B38B36]" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Pedido Realizado!</h1>
            <p className="text-[#888] mb-6">Pedido #{orderComplete.order_id?.slice(0, 16)}</p>

            {/* Payment Instructions */}
            <div className="bg-[#111] rounded-xl p-6 text-left mb-6 border border-[#B38B36]/30">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-[#B38B36]" />
                <h3 className="font-bold text-[#B38B36]">Instrucoes de Pagamento</h3>
              </div>

              <p className="text-lg font-bold text-white mb-4">
                Total: R$ {orderComplete.total?.toFixed(2)}
              </p>

              {paymentInfo.method === 'PIX' && (
                <div className="space-y-3">
                  <p className="text-[#CCC]">Faca um PIX para a chave abaixo:</p>
                  <div className="bg-[#0A0A0A] rounded-lg p-4 border border-[#2A2A2A]">
                    <p className="text-xs text-[#888] mb-1">Tipo: {paymentInfo.pix_key_type === 'cpf' ? 'CPF/CNPJ' : paymentInfo.pix_key_type === 'email' ? 'E-mail' : paymentInfo.pix_key_type === 'phone' ? 'Telefone' : 'Chave Aleatoria'}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-white font-mono text-lg">{paymentInfo.pix_key}</p>
                      <button onClick={() => copyToClipboard(paymentInfo.pix_key)} className="text-[#B38B36] hover:text-[#D4A842] p-2">
                        <Copy className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {paymentInfo.method === 'Transferencia Bancaria' && (
                <div className="space-y-3">
                  <p className="text-[#CCC]">Faca uma transferencia para a conta abaixo:</p>
                  <div className="bg-[#0A0A0A] rounded-lg p-4 border border-[#2A2A2A] space-y-2">
                    <div className="flex justify-between"><span className="text-[#888] text-sm">Banco:</span><span className="text-white font-medium">{paymentInfo.bank_name}</span></div>
                    <div className="flex justify-between"><span className="text-[#888] text-sm">Titular:</span><span className="text-white font-medium">{paymentInfo.account_name}</span></div>
                    <div className="flex justify-between"><span className="text-[#888] text-sm">Agencia:</span><span className="text-white font-medium">{paymentInfo.bank_branch}</span></div>
                    <div className="flex justify-between"><span className="text-[#888] text-sm">Conta:</span><span className="text-white font-medium">{paymentInfo.account_number}</span></div>
                  </div>
                </div>
              )}

              {paymentInfo.method === 'PayPal' && (
                <div className="space-y-3">
                  <p className="text-[#CCC]">Envie o pagamento para o email PayPal:</p>
                  <div className="bg-[#0A0A0A] rounded-lg p-4 border border-[#2A2A2A]">
                    <div className="flex items-center justify-between">
                      <p className="text-white font-medium">{paymentInfo.paypal_email}</p>
                      <button onClick={() => copyToClipboard(paymentInfo.paypal_email)} className="text-[#B38B36] hover:text-[#D4A842] p-2">
                        <Copy className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-yellow-400 text-sm">
                  Apos realizar o pagamento, seu pedido sera confirmado automaticamente pelo administrador.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => navigate('/orders')} className="flex-1 gold-btn rounded-lg py-5">
                Ver Meus Pedidos
              </Button>
              <Button onClick={() => navigate('/')} variant="outline" className="flex-1 border-[#2A2A2A] text-[#888] hover:text-white rounded-lg py-5">
                Continuar Comprando
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const paymentMethodIcons = {
    pix: <Zap className="w-5 h-5" />,
    ted: <CreditCard className="w-5 h-5" />,
    paypal: <DollarSign className="w-5 h-5" />
  };
  const paymentMethodColors = {
    pix: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500' },
    ted: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500' },
    paypal: { bg: 'bg-[#0070BA]/20', text: 'text-[#0070BA]', border: 'border-[#0070BA]' }
  };

  return (
    <div className="min-h-screen carbon-bg py-8" data-testid="checkout-page">
      <div className="max-w-5xl mx-auto px-4">
        <button onClick={() => navigate('/cart')} className="flex items-center gap-2 text-[#888] hover:text-[#B38B36] mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar ao carrinho
        </button>
        
        <h1 className="text-2xl font-bold font-['Outfit'] text-white mb-6">Finalizar Compra</h1>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[{n:1,icon:MapPin,label:'Endereco'},{n:2,icon:Truck,label:'Frete'},{n:3,icon:CreditCard,label:'Pagamento'}].map((s, i) => (
            <div key={s.n} className="flex items-center">
              <button 
                onClick={() => s.n < step && setStep(s.n)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${step >= s.n ? 'bg-[#B38B36]/20 text-[#B38B36] border border-[#B38B36]/30' : 'bg-[#1A1A1A] text-[#666] border border-[#2A2A2A]'}`}
              >
                <s.icon className="w-4 h-4" />
                <span className="hidden sm:inline text-sm font-medium">{s.label}</span>
              </button>
              {i < 2 && <div className={`w-8 h-0.5 mx-1 ${step > s.n ? 'bg-[#B38B36]' : 'bg-[#2A2A2A]'}`} />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Address */}
            {step === 1 && (
              <div className="dark-card rounded-xl p-6 animate-fadeIn">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-[#B38B36]" /> Dados de Entrega
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label className="text-[#CCC]">Nome Completo *</Label>
                    <Input value={address.name} onChange={e => handleAddressChange('name', e.target.value)}
                      className="bg-[#111] border-[#2A2A2A] text-white" placeholder="Seu nome completo" />
                  </div>
                  <div>
                    <Label className="text-[#CCC]">CPF *</Label>
                    <Input value={address.cpf} onChange={e => handleAddressChange('cpf', e.target.value)}
                      className="bg-[#111] border-[#2A2A2A] text-white" placeholder="000.000.000-00" maxLength={14} />
                  </div>
                  <div>
                    <Label className="text-[#CCC]">Telefone *</Label>
                    <Input value={address.phone} onChange={e => handleAddressChange('phone', e.target.value)}
                      className="bg-[#111] border-[#2A2A2A] text-white" placeholder="(00) 00000-0000" maxLength={15} />
                  </div>
                  <div>
                    <Label className="text-[#CCC]">CEP *</Label>
                    <Input value={address.zip_code} onChange={e => handleAddressChange('zip_code', e.target.value)}
                      className="bg-[#111] border-[#2A2A2A] text-white" placeholder="00000-000" maxLength={9} />
                  </div>
                  <div>
                    <Label className="text-[#CCC]">Estado *</Label>
                    <select value={address.state} onChange={e => handleAddressChange('state', e.target.value)}
                      className="w-full h-10 px-3 rounded-md bg-[#111] border border-[#2A2A2A] text-white">
                      <option value="">Selecione</option>
                      {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-[#CCC]">Rua/Avenida *</Label>
                    <Input value={address.street} onChange={e => handleAddressChange('street', e.target.value)}
                      className="bg-[#111] border-[#2A2A2A] text-white" placeholder="Nome da rua" />
                  </div>
                  <div>
                    <Label className="text-[#CCC]">Numero *</Label>
                    <Input value={address.number} onChange={e => handleAddressChange('number', e.target.value)}
                      className="bg-[#111] border-[#2A2A2A] text-white" placeholder="123" />
                  </div>
                  <div>
                    <Label className="text-[#CCC]">Complemento</Label>
                    <Input value={address.complement} onChange={e => handleAddressChange('complement', e.target.value)}
                      className="bg-[#111] border-[#2A2A2A] text-white" placeholder="Apto, Bloco..." />
                  </div>
                  <div>
                    <Label className="text-[#CCC]">Bairro *</Label>
                    <Input value={address.neighborhood} onChange={e => handleAddressChange('neighborhood', e.target.value)}
                      className="bg-[#111] border-[#2A2A2A] text-white" placeholder="Nome do bairro" />
                  </div>
                  <div>
                    <Label className="text-[#CCC]">Cidade *</Label>
                    <Input value={address.city} onChange={e => handleAddressChange('city', e.target.value)}
                      className="bg-[#111] border-[#2A2A2A] text-white" placeholder="Nome da cidade" />
                  </div>
                </div>
                <Button onClick={() => validateAddress() && setStep(2)} className="w-full gold-btn rounded-lg py-5 mt-6">
                  Continuar para Frete
                </Button>
              </div>
            )}

            {/* Step 2: Shipping */}
            {step === 2 && (
              <div className="dark-card rounded-xl p-6 animate-fadeIn">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[#B38B36]" /> Opcoes de Frete
                </h2>
                <div className="space-y-3">
                  {shippingOptions.map(opt => {
                    const key = opt.name.toLowerCase().replace(' ', '_');
                    const isSelected = selectedShipping === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedShipping(key)}
                        className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${isSelected ? 'border-[#B38B36] bg-[#B38B36]/10' : 'border-[#2A2A2A] hover:border-[#B38B36]/50'}`}
                      >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isSelected ? 'bg-[#B38B36]' : 'bg-[#2A2A2A]'}`}>
                          {opt.price === 0 ? <Gift className="w-5 h-5 text-white" /> : opt.name.includes('Expresso') ? <Zap className="w-5 h-5 text-white" /> : <Package className="w-5 h-5 text-white" />}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-semibold text-white">{opt.name}</p>
                          <p className="text-sm text-[#888]">{opt.days}</p>
                        </div>
                        <div className="text-right">
                          {opt.price === 0 ? (
                            <span className="text-green-400 font-bold">GRATIS</span>
                          ) : (
                            <span className="text-[#B38B36] font-bold">R$ {opt.price.toFixed(2)}</span>
                          )}
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-[#B38B36] bg-[#B38B36]' : 'border-[#555]'}`}>
                          {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1 border-[#2A2A2A] text-[#888] hover:text-white">
                    Voltar
                  </Button>
                  <Button onClick={() => setStep(3)} className="flex-1 gold-btn rounded-lg">
                    Continuar para Pagamento
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {step === 3 && (
              <div className="dark-card rounded-xl p-6 animate-fadeIn">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#B38B36]" /> Pagamento
                </h2>
                
                {/* Coupon */}
                <div className="mb-6">
                  <Label className="text-[#CCC] mb-2 block">Cupom de Desconto</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                      <Input 
                        value={couponCode} 
                        onChange={e => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Digite o codigo" 
                        className="pl-10 bg-[#111] border-[#2A2A2A] text-white uppercase"
                        disabled={!!appliedCoupon}
                      />
                    </div>
                    {appliedCoupon ? (
                      <Button variant="outline" onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="border-red-500/50 text-red-400">
                        Remover
                      </Button>
                    ) : (
                      <Button onClick={validateCoupon} className="gold-btn">Aplicar</Button>
                    )}
                  </div>
                  {appliedCoupon && (
                    <p className="text-green-400 text-sm mt-2 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> Cupom {appliedCoupon.code} aplicado!
                    </p>
                  )}
                </div>

                {/* Payment Method Selection */}
                <div className="mb-6">
                  <Label className="text-[#CCC] mb-3 block text-base font-semibold">Como deseja pagar?</Label>
                  {paymentMethods.length === 0 ? (
                    <div className="bg-[#111] rounded-lg p-4 border border-[#2A2A2A] text-center">
                      <p className="text-[#888]">Nenhum metodo de pagamento disponivel no momento.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {paymentMethods.map(pm => {
                        const isSelected = selectedPayment === pm.id;
                        const colors = paymentMethodColors[pm.id] || { bg: 'bg-[#333]/20', text: 'text-[#B38B36]', border: 'border-[#B38B36]' };
                        return (
                          <button
                            key={pm.id}
                            onClick={() => setSelectedPayment(pm.id)}
                            className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 text-left ${isSelected ? `${colors.border} bg-[#1A1A1A]` : 'border-[#2A2A2A] hover:border-[#444]'}`}
                          >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isSelected ? colors.bg : 'bg-[#2A2A2A]'}`}>
                              <span className={isSelected ? colors.text : 'text-[#888]'}>
                                {paymentMethodIcons[pm.id] || <CreditCard className="w-5 h-5" />}
                              </span>
                            </div>
                            <div className="flex-1">
                              <p className={`font-semibold ${isSelected ? 'text-white' : 'text-[#CCC]'}`}>{pm.name}</p>
                              <p className="text-sm text-[#888]">{pm.description}</p>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? `${colors.border} ${colors.bg}` : 'border-[#555]'}`}>
                              {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Selected Payment Details Preview */}
                {selectedPayment && paymentMethods.find(m => m.id === selectedPayment) && (
                  <div className="bg-[#111] rounded-lg p-4 mb-6 border border-[#2A2A2A]">
                    <p className="text-sm text-[#888] mb-2">Apos confirmar, voce recebera as instrucoes de pagamento via:</p>
                    <p className="text-white font-medium">{paymentMethods.find(m => m.id === selectedPayment)?.name}</p>
                  </div>
                )}

                {/* Address Summary */}
                <div className="bg-[#111] rounded-lg p-4 mb-6 border border-[#2A2A2A]">
                  <p className="text-sm text-[#888] mb-2">Entregar em:</p>
                  <p className="text-white font-medium">{address.name}</p>
                  <p className="text-[#CCC] text-sm">{address.street}, {address.number} {address.complement && `- ${address.complement}`}</p>
                  <p className="text-[#CCC] text-sm">{address.neighborhood}, {address.city} - {address.state}</p>
                  <p className="text-[#CCC] text-sm">CEP: {address.zip_code}</p>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1 border-[#2A2A2A] text-[#888] hover:text-white">
                    Voltar
                  </Button>
                  <Button 
                    onClick={handleCheckout} 
                    disabled={ordering || !selectedPayment || paymentMethods.length === 0} 
                    className="flex-1 gold-btn rounded-lg py-5"
                  >
                    {ordering ? 'Processando...' : `Confirmar Pedido - R$ ${total.toFixed(2)}`}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="dark-card rounded-xl p-6 sticky top-24">
              <h3 className="font-bold text-white mb-4">Resumo do Pedido</h3>
              
              <div className="space-y-3 max-h-[200px] overflow-y-auto mb-4">
                {items.map(item => {
                  const p = item.product;
                  const imgUrl = p?.images?.[0] ? (p.images[0].startsWith('http') ? p.images[0] : `${API}/files/${p.images[0]}`) : null;
                  return (
                    <div key={item.item_id} className="flex gap-3">
                      <div className="w-14 h-14 rounded-lg bg-[#111] overflow-hidden shrink-0">
                        {imgUrl ? <img src={imgUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[#444] text-xl">📦</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{p?.title}</p>
                        <p className="text-xs text-[#888]">Qtd: {item.quantity}</p>
                        <p className="text-sm text-[#B38B36] font-medium">R$ {(p?.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-[#2A2A2A] pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#888]">Subtotal</span>
                  <span className="text-white">R$ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#888]">Frete</span>
                  <span className={shippingCost === 0 ? 'text-green-400' : 'text-white'}>
                    {shippingCost === 0 ? 'GRATIS' : `R$ ${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#888]">Desconto</span>
                    <span className="text-green-400">-R$ {discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-[#2A2A2A]">
                  <span className="text-white">Total</span>
                  <span className="text-[#B38B36]">R$ {total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
