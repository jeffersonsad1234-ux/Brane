import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Bell, Check } from 'lucide-react';
import { Button } from '../components/ui/button';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function NotificationsPage() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const headers = { Authorization: `Bearer ${token}` };

  const fetch_ = async () => {
    try { const res = await axios.get(`${API}/notifications`, { headers }); setNotifications(res.data.notifications); }
    catch {} finally { setLoading(false); }
  };
  useEffect(() => { fetch_(); }, []);
  const markRead = async (id) => { await axios.put(`${API}/notifications/${id}/read`, {}, { headers }); fetch_(); };
  const markAllRead = async () => { await axios.put(`${API}/notifications/read-all`, {}, { headers }); fetch_(); };

  if (loading) return <div className="min-h-screen flex items-center justify-center carbon-bg"><div className="w-8 h-8 border-4 border-[#B38B36] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen carbon-bg py-8" data-testid="notifications-page">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold font-['Outfit'] text-white">Notificacoes</h1>
          {notifications.some(n => !n.read) && (
            <Button variant="outline" size="sm" className="border-[#2A2A2A] text-[#CCC]" onClick={markAllRead} data-testid="mark-all-read">
              <Check className="w-4 h-4 mr-1" /> Marcar todas como lidas
            </Button>
          )}
        </div>
        {notifications.length === 0 ? (
          <div className="text-center py-16 dark-card rounded-xl"><Bell className="w-12 h-12 text-[#444] mx-auto mb-3" /><p className="text-[#888]">Nenhuma notificacao</p></div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <div key={n.notification_id} className={`dark-card rounded-lg p-4 flex items-center justify-between ${!n.read ? 'border-[#B38B36]/40 bg-[#B38B36]/5' : ''}`} data-testid={`notification-${n.notification_id}`}>
                <div>
                  <p className={`text-sm ${n.read ? 'text-[#888]' : 'font-medium text-white'}`}>{n.message}</p>
                  <p className="text-xs text-[#666] mt-1">{new Date(n.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
                {!n.read && <Button variant="ghost" size="sm" onClick={() => markRead(n.notification_id)} data-testid={`read-${n.notification_id}`}><Check className="w-4 h-4 text-[#B38B36]" /></Button>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
