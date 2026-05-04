import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { ArrowLeft, Truck, Tag, MapPin, User, CreditCard, CheckCircle, Gift, Zap, Package, DollarSign, Copy, AlertCircle, QrCode } from 'lucide-react';
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
  const [step, setStep] = useState(1);
  const [shippingOptions, setShippingOptions] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState('gratis');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState('');
  const [orderComplete, setOrderComplete] = useState(null);
  const [address, setAddress] = useState({
    name: user?.name || '', cpf: '', phone: '', street: '', number: '',
    complement: '', neighborhood: '', city: '', state: '', zip_code: ''
  });
  const [hasSavedAddress, setHasSavedAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    Promise.all([
      axios.get(`${API}/cart`, { headers }),
      axios.get(`${API}/shipping/options`),
      axios.get(`${API}/payment-methods`),
      axios.get(`${API}/users/saved-address`, { headers }).catch(() => ({ data: { address: null } }))
    ]).then(([cartRes, shippingRes, paymentRes, savedRes]) => {
      if (cartRes.data.items.length === 0) { toast.error('Carrinho vazio'); navigate('/cart'); return; }
      setItems(cartRes.data.items);
      setShippingOptions(shippingRes.data.options || []);
      if (shippingRes.data.options?.length > 0) setSelectedShipping(shippingRes.data.options[0].name.toLowerCase().replace(' ', '_'));
      const methods = paymentRes.data.methods || [];
      setPaymentMethods(methods);
      if (methods.length > 0) setSelectedPayment(methods[0].id);
      const saved = savedRes.data?.address;
      if (saved && saved.zip_code) {
        setAddress(prev => ({ ...prev, ...saved }));
        setHasSavedAddress(true);
      }
    }).catch(() => toast.error('Erro ao carregar checkout')).finally(() => setLoading(false));
  }, [user]);

  const subtotal = items.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
  const shippingCost = shippingOptions.find(o => o.name.toLowerCase().replace(' ', '_') === selectedShipping)?.price || 0;
  const discount = appliedCoupon ? (appliedCoupon.type === 'percentage' ? subtotal * appliedCoupon.value : Math.min(appliedCoupon.value, subtotal)) : 0;
  const total = subtotal - discount + shippingCost;

  const validateCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const res = await axios.post(`${API}/coupons/validate`, { code: couponCode }, { headers });
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
      if (!address[field]?.trim()) { toast.error(`Preencha o campo ${field === 'zip_code' ? 'CEP' : field}`); return false; }
    }
    if (address.cpf.replace(/\D/g, '').length !== 11) { toast.error('CPF invalido'); return false; }
    return true;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => toast.success('Copiado!')).catch(() => {});
  };

  const handleCheckout = async () => {
    if (!validateAddress()) return;
    if (!selectedPayment) { toast.error('Selecione um metodo de pagamento'); return; }
    setOrdering(true);
    try {
      const urlParams = new URLSearchParams(location.search);
      const res = await axios.post(`${API}/orders`, {
        affiliate_code: urlParams.get('ref') || null,
        shipping_address: address,
        shipping_option: selectedShipping,
        coupon_code: appliedCoupon?.code || null,
        payment_method: selectedPayment
      }, { headers });
      // Save address to user profile for future purchases (silent)
      axios.put(`${API}/users/saved-address`, address, { headers }).catch(() => {});
      setOrderComplete(res.data);
      toast.success('Pedido confirmado! Realize o pagamento.');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao finalizar pedido');
    } finally { setOrdering(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center carbon-bg"><div className="w-8 h-8 border-4 border-[#D4A24C] border-t-transparent rounded-full animate-spin" /></div>;

  // ===== ORDER COMPLETE - SHOW PAYMENT INSTRUCTIONS =====
  if (orderComplete) {
    const pi = orderComplete.payment_info || {};
    return (
      <div className="min-h-screen carbon-bg py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="dark-card rounded-xl p-8 text-center animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-yellow-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Aguardando Pagamento</h1>
            <p className="text-[#A6A8B3] mb-2">Pedido #{orderComplete.order_id?.slice(0, 16)}</p>
            <p className="text-2xl font-bold text-[#D4A24C] mb-6">R$ {orderComplete.total?.toFixed(2)}</p>

            <div className="bg-[#11131A] rounded-xl p-6 text-left mb-6 border border-yellow-500/30">
              <h3 className="font-bold text-yellow-400 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" /> Realize o pagamento abaixo
              </h3>

              {pi.method === 'PIX' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">Pagamento via PIX</p>
                      <p className="text-xs text-[#A6A8B3]">Copie a chave e pague pelo seu banco</p>
                    </div>
                  </div>
                  <div className="bg-[#050608] rounded-lg p-4 border border-[#1E2230]">
                    <p className="text-xs text-[#A6A8B3] mb-1">Chave PIX ({pi.pix_key_type === 'cpf' ? 'CPF/CNPJ' : pi.pix_key_type === 'email' ? 'E-mail' : pi.pix_key_type === 'phone' ? 'Telefone' : 'Aleatoria'})</p>
                    <div className="flex items-center justify-between">
                      <p className="text-white font-mono text-lg break-all">{pi.pix_key}</p>
                      <button onClick={() => copyToClipboard(pi.pix_key)} className="text-[#D4A24C] hover:text-[#E8C372] p-2 shrink-0">
                        <Copy className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-[#A6A8B3]">Valor: <span className="text-white font-bold">R$ {orderComplete.total?.toFixed(2)}</span></p>
                </div>
              )}

              {pi.method === 'Transferencia Bancaria' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">Transferencia Bancaria</p>
                      <p className="text-xs text-[#A6A8B3]">Transfira para a conta abaixo</p>
                    </div>
                  </div>
                  <div className="bg-[#050608] rounded-lg p-4 border border-[#1E2230] space-y-3">
                    {[
                      ['Banco', pi.bank_name],
                      ['Titular', pi.account_name],
                      ['Agencia', pi.bank_branch],
                      ['Conta', pi.account_number]
                    ].map(([label, val]) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-[#A6A8B3] text-sm">{label}:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{val}</span>
                          <button onClick={() => copyToClipboard(val)} className="text-[#D4A24C] hover:text-[#E8C372]">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-[#A6A8B3]">Valor: <span className="text-white font-bold">R$ {orderComplete.total?.toFixed(2)}</span></p>
                </div>
              )}

              {pi.method === 'PayPal' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-[#0070BA]/20 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-[#0070BA]" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">Pagamento via PayPal</p>
                      <p className="text-xs text-[#A6A8B3]">Envie para o email abaixo</p>
                    </div>
                  </div>
                  <div className="bg-[#050608] rounded-lg p-4 border border-[#1E2230]">
                    <div className="flex items-center justify-between">
                      <p className="text-white font-medium">{pi.paypal_email}</p>
                      <button onClick={() => copyToClipboard(pi.paypal_email)} className="text-[#D4A24C] hover:text-[#E8C372] p-2">
                        <Copy className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-[#A6A8B3]">Valor: <span className="text-white font-bold">R$ {orderComplete.total?.toFixed(2)}</span></p>
                </div>
              )}

              <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-yellow-400 text-sm font-medium">
                  Apos realizar o pagamento, o status sera atualizado automaticamente quando o administrador confirmar o recebimento.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => navigate('/orders')} className="flex-1 gold-btn rounded-lg py-5">Ver Meus Pedidos</Button>
              <Button onClick={() => navigate('/')} variant="outline" className="flex-1 border-[#1E2230] text-[#A6A8B3] hover:text-white rounded-lg py-5">Continuar Comprando</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== SELECTED PAYMENT METHOD DATA =====
  const selectedMethodData = paymentMethods.find(m => m.id === selectedPayment);

  const methodIcons = { pix: <Zap className="w-5 h-5" />, ted: <CreditCard className="w-5 h-5" />, paypal: <DollarSign className="w-5 h-5" /> };
  const methodColors = {
    pix: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500', activeBg: 'bg-green-500/10' },
    ted: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500', activeBg: 'bg-blue-500/10' },
    paypal: { bg: 'bg-[#0070BA]/20', text: 'text-[#0070BA]', border: 'border-[#0070BA]', activeBg: 'bg-[#0070BA]/10' }
  };

  return (
    <div className="min-h-screen carbon-bg py-8" data-testid="checkout-page">
      <div className="max-w-5xl mx-auto px-4">
        <button onClick={() => navigate('/cart')} className="flex items-center gap-2 text-[#A6A8B3] hover:text-[#D4A24C] mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar ao carrinho
        </button>
        <h1 className="text-2xl font-bold font-['Outfit'] text-white mb-6">Finalizar Compra</h1>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[{n:1,icon:MapPin,label:'Endereco'},{n:2,icon:Truck,label:'Frete'},{n:3,icon:CreditCard,label:'Pagamento'}].map((s, i) => (
            <div key={s.n} className="flex items-center">
              <button onClick={() => s.n < step && setStep(s.n)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${step >= s.n ? 'bg-[#D4A24C]/20 text-[#D4A24C] border border-[#D4A24C]/30' : 'bg-[#0B0D12] text-[#A6A8B3] border border-[#1E2230]'}`}>
                <s.icon className="w-4 h-4" />
                <span className="hidden sm:inline text-sm font-medium">{s.label}</span>
              </button>
              {i < 2 && <div className={`w-8 h-0.5 mx-1 ${step > s.n ? 'bg-[#D4A24C]' : 'bg-[#1E2230]'}`} />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">

            {/* ===== STEP 1: ADDRESS ===== */}
            {step === 1 && (
              <div className="dark-card rounded-xl p-6 animate-fadeIn">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-[#D4A24C]" /> Dados de Entrega
                </h2>
                {hasSavedAddress && !editingAddress ? (
                  <div className="bg-[#11131A] rounded-xl p-5 border border-[#1E2230] mb-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                        <span className="text-sm text-emerald-400 font-semibold">Endereço salvo</span>
                      </div>
                      <button onClick={() => setEditingAddress(true)} className="text-xs text-[#D4A24C] hover:text-[#E8C372] underline" data-testid="edit-address-btn">
                        Alterar endereço
                      </button>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="text-white font-semibold">{address.name}</p>
                      <p className="text-[#A6A8B3]">CPF: {address.cpf} • Tel: {address.phone}</p>
                      <p className="text-[#E6E6EA]">{address.street}, {address.number}{address.complement ? ' - ' + address.complement : ''}</p>
                      <p className="text-[#A6A8B3]">{address.neighborhood}, {address.city} - {address.state} | CEP: {address.zip_code}</p>
                    </div>
                    <Button onClick={() => setStep(2)} className="w-full gold-btn rounded-lg py-5 mt-5" data-testid="continue-shipping-btn">Continuar para Frete</Button>
                  </div>
                ) : (
                  <>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2"><Label className="text-[#E6E6EA]">Nome Completo *</Label><Input value={address.name} onChange={e => handleAddressChange('name', e.target.value)} className="bg-[#11131A] border-[#1E2230] text-white" placeholder="Seu nome completo" data-testid="checkout-name" /></div>
                      <div><Label className="text-[#E6E6EA]">CPF *</Label><Input value={address.cpf} onChange={e => handleAddressChange('cpf', e.target.value)} className="bg-[#11131A] border-[#1E2230] text-white" placeholder="000.000.000-00" maxLength={14} data-testid="checkout-cpf" /></div>
                      <div><Label className="text-[#E6E6EA]">Telefone *</Label><Input value={address.phone} onChange={e => handleAddressChange('phone', e.target.value)} className="bg-[#11131A] border-[#1E2230] text-white" placeholder="(00) 00000-0000" maxLength={15} data-testid="checkout-phone" /></div>
                      <div><Label className="text-[#E6E6EA]">CEP *</Label><Input value={address.zip_code} onChange={e => handleAddressChange('zip_code', e.target.value)} className="bg-[#11131A] border-[#1E2230] text-white" placeholder="00000-000" maxLength={9} data-testid="checkout-zip" /></div>
                      <div><Label className="text-[#E6E6EA]">Estado *</Label>
                        <select value={address.state} onChange={e => handleAddressChange('state', e.target.value)} className="w-full h-10 px-3 rounded-md bg-[#11131A] border border-[#1E2230] text-white">
                          <option value="">Selecione</option>{STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="sm:col-span-2"><Label className="text-[#E6E6EA]">Rua/Avenida *</Label><Input value={address.street} onChange={e => handleAddressChange('street', e.target.value)} className="bg-[#11131A] border-[#1E2230] text-white" placeholder="Nome da rua" /></div>
                      <div><Label className="text-[#E6E6EA]">Numero *</Label><Input value={address.number} onChange={e => handleAddressChange('number', e.target.value)} className="bg-[#11131A] border-[#1E2230] text-white" placeholder="123" /></div>
                      <div><Label className="text-[#E6E6EA]">Complemento</Label><Input value={address.complement} onChange={e => handleAddressChange('complement', e.target.value)} className="bg-[#11131A] border-[#1E2230] text-white" placeholder="Apto, Bloco..." /></div>
                      <div><Label className="text-[#E6E6EA]">Bairro *</Label><Input value={address.neighborhood} onChange={e => handleAddressChange('neighborhood', e.target.value)} className="bg-[#11131A] border-[#1E2230] text-white" placeholder="Nome do bairro" /></div>
                      <div><Label className="text-[#E6E6EA]">Cidade *</Label><Input value={address.city} onChange={e => handleAddressChange('city', e.target.value)} className="bg-[#11131A] border-[#1E2230] text-white" placeholder="Nome da cidade" /></div>
                    </div>
                    {hasSavedAddress && (
                      <button onClick={() => setEditingAddress(false)} className="text-xs text-[#A6A8B3] hover:text-[#D4A24C] mt-4 inline-block underline">
                        Voltar para endereço salvo
                      </button>
                    )}
                    <Button onClick={() => { if (validateAddress()) { setEditingAddress(false); setStep(2); } }} className="w-full gold-btn rounded-lg py-5 mt-6" data-testid="continue-shipping-btn">Continuar para Frete</Button>
                  </>
                )}
              </div>
            )}

            {/* ===== STEP 2: SHIPPING ===== */}
            {step === 2 && (
              <div className="dark-card rounded-xl p-6 animate-fadeIn">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[#D4A24C]" /> Opcoes de Frete
                </h2>
                <div className="space-y-3">
                  {shippingOptions.map(opt => {
                    const key = opt.name.toLowerCase().replace(' ', '_');
                    const isSelected = selectedShipping === key;
                    return (
                      <button key={key} onClick={() => setSelectedShipping(key)}
                        className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${isSelected ? 'border-[#D4A24C] bg-[#D4A24C]/10' : 'border-[#1E2230] hover:border-[#D4A24C]/50'}`}>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isSelected ? 'bg-[#D4A24C]' : 'bg-[#1E2230]'}`}>
                          {opt.price === 0 ? <Gift className="w-5 h-5 text-white" /> : opt.name.includes('Expresso') ? <Zap className="w-5 h-5 text-white" /> : <Package className="w-5 h-5 text-white" />}
                        </div>
                        <div className="flex-1 text-left"><p className="font-semibold text-white">{opt.name}</p><p className="text-sm text-[#A6A8B3]">{opt.days}</p></div>
                        <div className="text-right">{opt.price === 0 ? <span className="text-green-400 font-bold">GRATIS</span> : <span className="text-[#D4A24C] font-bold">R$ {opt.price.toFixed(2)}</span>}</div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-[#D4A24C] bg-[#D4A24C]' : 'border-[#555]'}`}>{isSelected && <CheckCircle className="w-3 h-3 text-white" />}</div>
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1 border-[#1E2230] text-[#A6A8B3] hover:text-white">Voltar</Button>
                  <Button onClick={() => setStep(3)} className="flex-1 gold-btn rounded-lg">Continuar para Pagamento</Button>
                </div>
              </div>
            )}

            {/* ===== STEP 3: PAYMENT ===== */}
            {step === 3 && (
              <div className="space-y-6 animate-fadeIn">
                {/* Coupon */}
                <div className="dark-card rounded-xl p-6">
                  <Label className="text-[#E6E6EA] mb-2 block">Cupom de Desconto</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6F7280]" />
                      <Input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="Digite o codigo" className="pl-10 bg-[#11131A] border-[#1E2230] text-white uppercase" disabled={!!appliedCoupon} />
                    </div>
                    {appliedCoupon ? (
                      <Button variant="outline" onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="border-red-500/50 text-red-400">Remover</Button>
                    ) : (
                      <Button onClick={validateCoupon} className="gold-btn">Aplicar</Button>
                    )}
                  </div>
                  {appliedCoupon && <p className="text-green-400 text-sm mt-2 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Cupom {appliedCoupon.code} aplicado!</p>}
                </div>

                {/* PAYMENT METHOD SELECTION */}
                <div className="dark-card rounded-xl p-6">
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-[#D4A24C]" /> Como deseja pagar?
                  </h2>

                  {paymentMethods.length === 0 ? (
                    <div className="bg-[#11131A] rounded-lg p-6 border border-[#1E2230] text-center">
                      <AlertCircle className="w-8 h-8 text-[#A6A8B3] mx-auto mb-2" />
                      <p className="text-[#A6A8B3]">Nenhum metodo de pagamento configurado pelo administrador.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {paymentMethods.map(pm => {
                        const isSelected = selectedPayment === pm.id;
                        const colors = methodColors[pm.id] || methodColors.pix;
                        return (
                          <button key={pm.id} onClick={() => setSelectedPayment(pm.id)}
                            className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 text-left ${isSelected ? `${colors.border} ${colors.activeBg}` : 'border-[#1E2230] hover:border-[#444]'}`}>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isSelected ? colors.bg : 'bg-[#1E2230]'}`}>
                              <span className={isSelected ? colors.text : 'text-[#A6A8B3]'}>{methodIcons[pm.id] || <CreditCard className="w-5 h-5" />}</span>
                            </div>
                            <div className="flex-1">
                              <p className={`font-semibold ${isSelected ? 'text-white' : 'text-[#E6E6EA]'}`}>{pm.name}</p>
                              <p className="text-sm text-[#A6A8B3]">{pm.description}</p>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? `${colors.border} ${colors.bg}` : 'border-[#555]'}`}>
                              {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* PAYMENT DETAILS - Show BEFORE confirmation */}
                {selectedMethodData && selectedMethodData.configured && (
                  <div className="dark-card rounded-xl p-6 border border-[#D4A24C]/30">
                    <h3 className="font-bold text-[#D4A24C] mb-4 flex items-center gap-2">
                      <QrCode className="w-5 h-5" /> Dados para Pagamento
                    </h3>

                    {selectedPayment === 'pix' && selectedMethodData.details?.pix_key && (
                      <div className="space-y-3">
                        <p className="text-[#E6E6EA] text-sm">Apos confirmar, faca um PIX para a chave abaixo:</p>
                        <div className="bg-[#050608] rounded-lg p-4 border border-[#1E2230]">
                          <p className="text-xs text-[#A6A8B3] mb-1">Chave PIX ({selectedMethodData.details.pix_key_type === 'cpf' ? 'CPF/CNPJ' : selectedMethodData.details.pix_key_type === 'email' ? 'E-mail' : selectedMethodData.details.pix_key_type === 'phone' ? 'Telefone' : 'Aleatoria'})</p>
                          <div className="flex items-center justify-between">
                            <p className="text-white font-mono text-lg break-all">{selectedMethodData.details.pix_key}</p>
                            <button onClick={() => copyToClipboard(selectedMethodData.details.pix_key)} className="text-[#D4A24C] hover:text-[#E8C372] p-2 shrink-0"><Copy className="w-5 h-5" /></button>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedPayment === 'ted' && selectedMethodData.details?.bank_name && (
                      <div className="space-y-3">
                        <p className="text-[#E6E6EA] text-sm">Apos confirmar, transfira para a conta abaixo:</p>
                        <div className="bg-[#050608] rounded-lg p-4 border border-[#1E2230] space-y-2">
                          {[['Banco', selectedMethodData.details.bank_name], ['Titular', selectedMethodData.details.account_name], ['Agencia', selectedMethodData.details.bank_branch], ['Conta', selectedMethodData.details.account_number]].map(([label, val]) => (
                            <div key={label} className="flex items-center justify-between">
                              <span className="text-[#A6A8B3] text-sm">{label}:</span>
                              <div className="flex items-center gap-2">
                                <span className="text-white font-medium">{val}</span>
                                {val && <button onClick={() => copyToClipboard(val)} className="text-[#D4A24C]"><Copy className="w-3.5 h-3.5" /></button>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedPayment === 'paypal' && selectedMethodData.details?.paypal_email && (
                      <div className="space-y-3">
                        <p className="text-[#E6E6EA] text-sm">Apos confirmar, envie o pagamento para:</p>
                        <div className="bg-[#050608] rounded-lg p-4 border border-[#1E2230]">
                          <div className="flex items-center justify-between">
                            <p className="text-white font-medium">{selectedMethodData.details.paypal_email}</p>
                            <button onClick={() => copyToClipboard(selectedMethodData.details.paypal_email)} className="text-[#D4A24C] p-2"><Copy className="w-5 h-5" /></button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-3 p-3 rounded-lg bg-[#D4A24C]/10 border border-[#D4A24C]/20">
                      <p className="text-[#D4A24C] text-sm">Valor total a pagar: <span className="font-bold text-lg">R$ {total.toFixed(2)}</span></p>
                    </div>
                  </div>
                )}

                {/* Address Summary */}
                <div className="dark-card rounded-xl p-4">
                  <p className="text-sm text-[#A6A8B3] mb-2">Entregar em:</p>
                  <p className="text-white font-medium">{address.name}</p>
                  <p className="text-[#E6E6EA] text-sm">{address.street}, {address.number} {address.complement && `- ${address.complement}`}</p>
                  <p className="text-[#E6E6EA] text-sm">{address.neighborhood}, {address.city} - {address.state} | CEP: {address.zip_code}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1 border-[#1E2230] text-[#A6A8B3] hover:text-white">Voltar</Button>
                  <Button onClick={handleCheckout} disabled={ordering || !selectedPayment || paymentMethods.length === 0}
                    className="flex-1 gold-btn rounded-lg py-5 text-base">
                    {ordering ? 'Processando...' : `Confirmar Pedido - R$ ${total.toFixed(2)}`}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* ORDER SUMMARY SIDEBAR */}
          <div className="lg:col-span-1">
            <div className="dark-card rounded-xl p-6 sticky top-24">
              <h3 className="font-bold text-white mb-4">Resumo do Pedido</h3>
              <div className="space-y-3 max-h-[200px] overflow-y-auto mb-4">
                {items.map(item => {
                  const p = item.product;
                  const imgUrl = p?.images?.[0] ? (p.images[0].startsWith('http') ? p.images[0] : `${API}/files/${p.images[0]}`) : null;
                  return (
                    <div key={item.item_id} className="flex gap-3">
                      <div className="w-14 h-14 rounded-lg bg-[#11131A] overflow-hidden shrink-0">
                        {imgUrl ? <img src={imgUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[#6F7280] text-xl">📦</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{p?.title}</p>
                        <p className="text-xs text-[#A6A8B3]">Qtd: {item.quantity}</p>
                        <p className="text-sm text-[#D4A24C] font-medium">R$ {(p?.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-[#1E2230] pt-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-[#A6A8B3]">Subtotal</span><span className="text-white">R$ {subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-[#A6A8B3]">Frete</span><span className={shippingCost === 0 ? 'text-green-400' : 'text-white'}>{shippingCost === 0 ? 'GRATIS' : `R$ ${shippingCost.toFixed(2)}`}</span></div>
                {discount > 0 && <div className="flex justify-between text-sm"><span className="text-[#A6A8B3]">Desconto</span><span className="text-green-400">-R$ {discount.toFixed(2)}</span></div>}
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-[#1E2230]"><span className="text-white">Total</span><span className="text-[#D4A24C]">R$ {total.toFixed(2)}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
