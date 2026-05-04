import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Trash2, Minus, Plus, ShoppingCart, ArrowRight, Shield } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CartPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const headers = { Authorization: `Bearer ${token}` };

  const fetchCart = async () => {
    try { const res = await axios.get(`${API}/cart`, { headers }); setItems(res.data.items); }
    catch {} finally { setLoading(false); }
  };
  useEffect(() => { fetchCart(); }, []);

  const updateQty = async (itemId, qty) => {
    try { await axios.put(`${API}/cart/${itemId}`, { quantity: qty }, { headers }); fetchCart(); } catch {}
  };
  const removeItem = async (itemId) => {
    try { await axios.delete(`${API}/cart/${itemId}`, { headers }); fetchCart(); toast.success('Item removido'); } catch {}
  };

  const total = items.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);

  if (loading) return <div className="min-h-screen flex items-center justify-center carbon-bg"><div className="w-8 h-8 border-4 border-[#D4A24C] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen carbon-bg py-8" data-testid="cart-page">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-2xl font-bold font-['Outfit'] text-white mb-6">Carrinho</h1>
        {items.length === 0 ? (
          <div className="text-center py-16 dark-card rounded-xl">
            <ShoppingCart className="w-12 h-12 text-[#6F7280] mx-auto mb-3" />
            <p className="text-[#A6A8B3]">Carrinho vazio</p>
            <Button className="gold-btn rounded-lg mt-4" onClick={() => navigate('/products')} data-testid="browse-products-btn">Ver Produtos</Button>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {items.map(item => {
                const p = item.product;
                const imgUrl = p?.images?.[0] ? (p.images[0].startsWith('http') ? p.images[0] : `${API}/files/${p.images[0]}`) : null;
                return (
                  <div key={item.item_id} className="bg-transparent border border-[#1E2230] rounded-xl p-4 flex items-center gap-4 hover:border-[#D4A24C]/30 transition-colors" data-testid={`cart-item-${item.item_id}`}>
                    <div className="w-20 h-20 rounded-lg bg-[#11131A] overflow-hidden shrink-0">
                      {imgUrl ? <img src={imgUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[#6F7280]">📦</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-white truncate">{p?.title}</p>
                      <p className="text-sm text-[#D4A24C] font-bold">R$ {p?.price?.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="w-8 h-8 border-[#1E2230] text-white hover:border-[#D4A24C]" onClick={() => updateQty(item.item_id, Math.max(1, item.quantity - 1))} data-testid={`qty-minus-${item.item_id}`}><Minus className="w-3 h-3" /></Button>
                      <span className="text-sm font-medium w-6 text-center text-white">{item.quantity}</span>
                      <Button variant="outline" size="icon" className="w-8 h-8 border-[#1E2230] text-white hover:border-[#D4A24C]" onClick={() => updateQty(item.item_id, item.quantity + 1)} data-testid={`qty-plus-${item.item_id}`}><Plus className="w-3 h-3" /></Button>
                    </div>
                    <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-300" onClick={() => removeItem(item.item_id)} data-testid={`remove-item-${item.item_id}`}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                );
              })}
            </div>
            <div className="dark-card rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[#A6A8B3]">Subtotal ({items.length} {items.length === 1 ? 'item' : 'itens'})</span>
                <span className="text-2xl font-bold text-[#D4A24C]" data-testid="cart-total">R$ {total.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#A6A8B3] mb-4">
                <Shield className="w-4 h-4" />
                <span>Compra segura com proteção ao comprador</span>
              </div>
              <Button 
                className="w-full bg-gradient-to-r from-[#D4A24C] to-[#D4A84B] hover:from-[#9A752B] hover:to-[#D4A24C] text-white rounded-lg py-6 text-base font-semibold shadow-lg shadow-[#D4A24C]/20" 
                onClick={() => navigate('/checkout')} 
                data-testid="checkout-btn"
              >
                Continuar para Pagamento <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                variant="ghost" 
                className="w-full mt-3 text-[#A6A8B3] hover:text-white"
                onClick={() => navigate('/products')}
              >
                Continuar Comprando
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
