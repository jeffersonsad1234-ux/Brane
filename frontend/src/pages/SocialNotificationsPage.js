import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import SocialNavbar from '../components/SocialNavbar';
import { Bell, Heart, MessageCircle, UserPlus, Mail } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function timeAgo(iso) {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'agora';
  if (s < 3600) return `${Math.floor(s / 60)}min`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return new Date(iso).toLocaleDateString('pt-BR');
}

const ICONS = {
  social_like: { icon: Heart, color: '#EC4899' },
  social_comment: { icon: MessageCircle, color: '#A855F7' },
  social_follow: { icon: UserPlus, color: '#7C3AED' },
  social_message: { icon: Mail, color: '#3B82F6' },
};

export default function SocialNotificationsPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const h = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!user) { navigate('/entry'); return; }
    axios.get(`${API}/social/notifications`, { headers: h, withCredentials: true })
      .then(r => setNotifs(r.data.notifications))
      .catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  return (
    <div className="social-shell" data-testid="social-notifications-page">
      <SocialNavbar />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="social-title text-2xl mb-4 flex items-center gap-2">
          <Bell className="w-6 h-6 text-purple-400" /> Notificações
        </h1>

        {loading ? (
          <div className="text-center py-12"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : notifs.length === 0 ? (
          <div className="social-card p-12 text-center" data-testid="no-notifs">
            <Bell className="w-12 h-12 text-purple-400 mx-auto mb-3" />
            <p className="text-[#C4B5FD]">Nenhuma notificação ainda</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifs.map(n => {
              const meta = ICONS[n.type] || { icon: Bell, color: '#9CA3AF' };
              const Icon = meta.icon;
              return (
                <Link
                  key={n.notification_id}
                  to={n.link || '#'}
                  className={`social-card p-3 flex items-start gap-3 hover:border-purple-500/40 transition-all ${!n.read ? 'border-purple-500/40 bg-purple-500/5' : ''}`}
                  data-testid={`notif-${n.notification_id}`}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: `${meta.color}20`, border: `1px solid ${meta.color}60` }}>
                    <Icon className="w-5 h-5" style={{ color: meta.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#E5E7EB]">{n.message}</p>
                    <p className="text-xs text-[#6B6B7B] mt-0.5">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-pink-500 mt-2 shrink-0" />}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
