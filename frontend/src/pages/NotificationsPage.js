import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Bell, Check, MessageCircle } from 'lucide-react';
import { Button } from '../components/ui/button';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function NotificationsPage() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const headers = { Authorization: 'Bearer ' + token };

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(API + '/notifications', { headers });
      setNotifications(res.data.notifications || []);
    } catch (error) {
      console.error(error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markRead = async (id) => {
    try {
      await axios.put(API + '/notifications/' + id + '/read', {}, { headers });
    } catch (error) {
      console.error(error);
    }
  };

  const markAllRead = async () => {
    try {
      await axios.put(API + '/notifications/read-all', {}, { headers });
      fetchNotifications();
    } catch (error) {
      console.error(error);
    }
  };

  const openNotification = async (n) => {
    if (!n) return;

    if (!n.read) {
      await markRead(n.notification_id);
    }

    const data = n.data || {};

    const chatUrl = data.open_chat_url || data.openChatUrl || null;

    if (chatUrl) {
      window.location.href = chatUrl;
      return;
    }

    if (n.type === 'direct_chat') {
      const userId = data.sender_id || data.from_user_id || data.user_id;

      if (userId) {
        window.location.href = '/chat/' + userId;
        return;
      }
    }

    if (n.type === 'store_chat') {
      const storeId = data.store_id || data.slug;

      if (storeId) {
        window.location.href = '/stores/' + storeId + '/chat';
        return;
      }
    }

    console.log('Notificação sem dados de chat:', n);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center carbon-bg">
        <div className="w-8 h-8 border-4 border-[#D4A24C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen carbon-bg py-8" data-testid="notifications-page">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold font-['Outfit'] text-white">
            Notificações
          </h1>

          {notifications.some((n) => !n.read) && (
            <Button
              variant="outline"
              size="sm"
              className="border-[#1E2230] text-[#E6E6EA]"
              onClick={markAllRead}
              data-testid="mark-all-read"
            >
              <Check className="w-4 h-4 mr-1" />
              Marcar todas como lidas
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-16 dark-card rounded-xl">
            <Bell className="w-12 h-12 text-[#6F7280] mx-auto mb-3" />
            <p className="text-[#A6A8B3]">Nenhuma notificação</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => {
              const isChat =
                n.type === 'store_chat' ||
                n.type === 'direct_chat' ||
                n.type === 'message';

              return (
                <button
                  key={n.notification_id}
                  type="button"
                  onClick={() => openNotification(n)}
                  className="w-full text-left dark-card rounded-lg p-4 cursor-pointer hover:border-[#D4A24C]/40 transition flex items-start justify-between gap-3"
                >
                  <div className="flex gap-3">
                    <div className="mt-1">
                      {isChat ? (
                        <MessageCircle className="w-5 h-5 text-[#D4A24C]" />
                      ) : (
                        <Bell className="w-5 h-5 text-[#D4A24C]" />
                      )}
                    </div>

                    <div>
                      <p className={'text-sm ' + (n.read ? 'text-[#A6A8B3]' : 'font-medium text-white')}>
                        {n.message}
                      </p>

                      <p className="text-xs text-[#A6A8B3] mt-1">
                        {new Date(n.created_at).toLocaleDateString('pt-BR')}
                      </p>

                      {isChat && (
                        <p className="text-xs text-[#D4A24C] mt-2">
                          Clique para abrir o chat e responder
                        </p>
                      )}
                    </div>
                  </div>

                  {!n.read && (
                    <Check className="w-4 h-4 text-[#D4A24C] mt-1" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
