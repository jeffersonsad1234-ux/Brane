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
    try {
      const res = await axios.get(`${API}/notifications`, { headers, withCredentials: true });
      setNotifications(res.data.notifications);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetch_(); }, []);

  const markRead = async (id) => {
    await axios.put(`${API}/notifications/${id}/read`, {}, { headers, withCredentials: true });
    fetch_();
  };

  const markAllRead = async () => {
    await axios.put(`${API}/notifications/read-all`, {}, { headers, withCredentials: true });
    fetch_();
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F9F8]">
      <div className="w-8 h-8 border-4 border-[#B38B36] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F9F9F8] py-8" data-testid="notifications-page">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold font-['Outfit'] text-[#1A1A1A]">Notificacoes</h1>
          {notifications.some(n => !n.read) && (
            <Button variant="outline" size="sm" onClick={markAllRead} data-testid="mark-all-read">
              <Check className="w-4 h-4 mr-1" /> Marcar todas como lidas
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-[#E5E5E5]">
            <Bell className="w-12 h-12 text-[#CCC] mx-auto mb-3" />
            <p className="text-[#999]">Nenhuma notificacao</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <div
                key={n.notification_id}
                className={`bg-white rounded-lg border p-4 flex items-center justify-between ${n.read ? 'border-[#E5E5E5]' : 'border-[#B38B36] bg-[#FDFAF3]'}`}
                data-testid={`notification-${n.notification_id}`}
              >
                <div>
                  <p className={`text-sm ${n.read ? 'text-[#666]' : 'font-medium text-[#1A1A1A]'}`}>{n.message}</p>
                  <p className="text-xs text-[#999] mt-1">{new Date(n.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
                {!n.read && (
                  <Button variant="ghost" size="sm" onClick={() => markRead(n.notification_id)} data-testid={`read-${n.notification_id}`}>
                    <Check className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
