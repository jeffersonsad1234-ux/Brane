import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Trash2, Minus, Plus, ShoppingCart } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CartPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchCart = async () => {
    try {
      const res = await axios.get(`${API}/cart`, { headers, withCredentials: true });
      setItems(res.data.items);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchCart(); }, []);

  const updateQty = async (itemId, qty) => {
    try {
      await axios.put(`${API}/cart/${itemId}`, { quantity: qty }, { headers, withCredentials: true });
      fetchCart();
    } catch {}
  };

  const removeItem = async (itemId) => {
    try {
      await axios.delete(`${API}/cart/${itemId}`, { headers, withCredentials: true });
      fetchCart();
      toast.success('Item removido');
    } catch {}
  };

  const checkout = async () => {
    setOrdering(true);
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const affiliateCode = urlParams.get('ref') || null;
      await axios.post(`${API}/orders`, { affiliate_code: affiliateCode }, { headers, withCredentials: true });
      toast.success('Pedido realizado com sucesso!');
      navigate('/orders');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao finalizar pedido');
    } finally {
      setOrdering(false);
    }
  };

  const total = items.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F9F8]">
      <div className="w-8 h-8 border-4 border-[#B38B36] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F9F9F8] py-8" data-testid="cart-page">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-2xl font-bold font-['Outfit'] text-[#1A1A1A] mb-6">Carrinho</h1>

        {items.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-[#E5E5E5]">
            <ShoppingCart className="w-12 h-12 text-[#CCC] mx-auto mb-3" />
            <p className="text-[#999]">Carrinho vazio</p>
            <Button className="gold-btn rounded-lg mt-4" onClick={() => navigate('/products')} data-testid="browse-products-btn">
              Ver Produtos
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {items.map(item => {
                const p = item.product;
                const imgUrl = p?.images?.[0]
                  ? (p.images[0].startsWith('http') ? p.images[0] : `${API}/files/${p.images[0]}`)
                  : null;
                return (
                  <div key={item.item_id} className="bg-white rounded-xl border border-[#E5E5E5] p-4 flex items-center gap-4" data-testid={`cart-item-${item.item_id}`}>
                    <div className="w-20 h-20 rounded-lg bg-[#F5F5F5] overflow-hidden shrink-0">
                      {imgUrl ? <img src={imgUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl text-[#CCC]">&#128722;</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{p?.title}</p>
                      <p className="text-sm text-[#B38B36] font-bold">R$ {p?.price?.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="w-8 h-8" onClick={() => updateQty(item.item_id, Math.max(1, item.quantity - 1))} data-testid={`qty-minus-${item.item_id}`}>
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                      <Button variant="outline" size="icon" className="w-8 h-8" onClick={() => updateQty(item.item_id, item.quantity + 1)} data-testid={`qty-plus-${item.item_id}`}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => removeItem(item.item_id)} data-testid={`remove-item-${item.item_id}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>

            <div className="bg-white rounded-xl border border-[#E5E5E5] p-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[#666]">Total</span>
                <span className="text-2xl font-bold text-[#B38B36]" data-testid="cart-total">R$ {total.toFixed(2)}</span>
              </div>
              <Button className="w-full gold-btn rounded-lg py-6 text-base" onClick={checkout} disabled={ordering} data-testid="checkout-btn">
                {ordering ? 'Finalizando...' : 'Finalizar Pedido'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
