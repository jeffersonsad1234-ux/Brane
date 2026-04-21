import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, Bell, Search, MessageCircle, Users, User, ShoppingBag, LogOut, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const LOGO_URL = 'https://customer-assets.emergentagent.com/job_brane-exchange/artifacts/wiagamwr_IMG_20260412_043249_662.jpg';

export default function SocialNavbar({ onSearch }) {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const [msgUnread, setMsgUnread] = useState(0);
  const [q, setQ] = useState('');

  useEffect(() => {
    if (!user || !token) return;
    const h = { Authorization: `Bearer ${token}` };
    axios.get(`${API}/social/notifications`, { headers: h, withCredentials: true })
      .then(r => setUnread(r.data.unread || 0)).catch(() => {});
    axios.get(`${API}/social/messages/threads`, { headers: h, withCredentials: true })
      .then(r => setMsgUnread(r.data.threads.reduce((s, t) => s + (t.unread_count || 0), 0)))
      .catch(() => {});
  }, [user, token, location.pathname]);

  const getInitials = (name) => name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';

  const NavIcon = ({ to, icon: Icon, label, badge, testId }) => {
    const active = location.pathname === to || (to === '/social' && location.pathname === '/social');
    return (
      <Link
        to={to}
        data-testid={testId}
        className="relative flex flex-col items-center justify-center px-3 py-2 group"
      >
        <div className={`p-2 rounded-xl transition-all ${active ? 'bg-purple-500/20' : 'hover:bg-purple-500/10'}`}>
          <Icon className={`w-5 h-5 ${active ? 'text-purple-300' : 'text-[#9CA3AF] group-hover:text-purple-300'}`} />
        </div>
        <span className={`text-[10px] mt-0.5 ${active ? 'text-purple-300 font-semibold' : 'text-[#6B6B7B]'}`}>{label}</span>
        {badge > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 inline-flex items-center justify-center text-[9px] font-bold bg-pink-500 text-white rounded-full">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <nav
      className="sticky top-0 z-40 border-b backdrop-blur-md"
      style={{
        background: 'rgba(10, 10, 15, 0.85)',
        borderColor: 'rgba(124, 58, 237, 0.2)',
      }}
      data-testid="social-navbar"
    >
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-4">
        <Link to="/social" className="flex items-center gap-2 shrink-0" data-testid="social-logo">
          <img src={LOGO_URL} alt="BRANE" className="w-9 h-9 rounded-lg object-cover" />
          <div className="hidden sm:block">
            <span className="font-bold font-['Outfit'] bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">BRANE</span>
            <span className="text-[10px] text-[#C4B5FD] ml-1 tracking-widest">SOCIAL</span>
          </div>
        </Link>

        <div className="hidden md:flex flex-1 max-w-xs relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B7B]" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onSearch && onSearch(q)}
            placeholder="Buscar pessoas, grupos..."
            className="w-full pl-10 pr-4 py-2 rounded-full bg-[#14141F] border border-purple-900/30 text-sm text-white placeholder:text-[#6B6B7B] focus:outline-none focus:border-purple-500"
            data-testid="social-search-input"
          />
        </div>

        <div className="flex-1 flex items-center justify-end gap-1">
          {user ? (
            <>
              <NavIcon to="/social" icon={Home} label="Feed" testId="nav-feed" />
              <NavIcon to="/social/groups" icon={Users} label="Grupos" testId="nav-groups" />
              <NavIcon to="/social/messages" icon={MessageCircle} label="Chat" badge={msgUnread} testId="nav-messages" />
              <NavIcon to="/social/notifications" icon={Bell} label="Alertas" badge={unread} testId="nav-social-notifications" />
              <NavIcon to={`/social/profile/${user.user_id}`} icon={User} label="Perfil" testId="nav-social-profile" />

              <div className="hidden sm:flex items-center ml-2 gap-2">
                <Link
                  to="/"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs hover:bg-amber-500/20 transition-all"
                  data-testid="go-to-market"
                >
                  <ShoppingBag className="w-3.5 h-3.5" /> Market
                </Link>
                <button
                  onClick={() => { logout(); navigate('/entry'); }}
                  className="p-2 rounded-full hover:bg-red-500/10 text-[#9CA3AF] hover:text-red-400 transition-all"
                  title="Sair"
                  data-testid="social-logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-purple-500/50 bg-purple-500/20 flex items-center justify-center text-purple-300 font-bold text-sm ml-1">
                {user.picture ? <img src={user.picture} alt="" className="w-full h-full object-cover" /> : getInitials(user.name)}
              </div>
            </>
          ) : (
            <Link to="/auth" data-testid="social-login-link" className="social-btn px-5 py-2 text-sm">
              Entrar
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
