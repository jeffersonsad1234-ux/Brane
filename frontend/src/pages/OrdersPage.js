import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Package } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function OrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/orders`, { headers: { Authorization: `Bearer ${token}` }, withCredentials: true })
      .then(res => setOrders(res.data.orders))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F9F8]">
      <div className="w-8 h-8 border-4 border-[#B38B36] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F9F9F8] py-8" data-testid="orders-page">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-2xl font-bold font-['Outfit'] text-[#1A1A1A] mb-6">Meus Pedidos</h1>

        {orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-[#E5E5E5]">
            <Package className="w-12 h-12 text-[#CCC] mx-auto mb-3" />
            <p className="text-[#999]">Nenhum pedido realizado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(o => (
              <div key={o.order_id} className="bg-white rounded-xl border border-[#E5E5E5] p-5" data-testid={`order-${o.order_id}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-[#1A1A1A]">#{o.order_id?.slice(0, 16)}</span>
                  <span className={`status-badge status-${o.status}`}>{o.status}</span>
                </div>
                <div className="space-y-2 mb-3">
                  {o.items?.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-[#666]">{item.title} x{item.quantity}</span>
                      <span className="font-medium">R$ {item.subtotal?.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#E5E5E5]">
                  <span className="text-xs text-[#999]">{new Date(o.created_at).toLocaleDateString('pt-BR')}</span>
                  <span className="text-lg font-bold text-[#B38B36]">R$ {o.total?.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
