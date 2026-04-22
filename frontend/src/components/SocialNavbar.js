import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Users, Home, Bell, User, LogOut, Store, Settings, ShoppingBag, Menu, X, MessageSquare } from 'lucide-react';

export default function SocialNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (p) => location.pathname === p || location.pathname.startsWith(p + '/');

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getInitials = (name) => name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl" style={{ backgroundColor: 'rgba(10,0,20,0.85)', borderBottom: '1px solid rgba(168,85,247,0.2)' }} data-testid="social-navbar">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/social" className="flex items-center gap-2.5" data-testid="nav-logo">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shadow-lg shadow-pink-500/40"
               style={{ background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)' }}>
            <Users className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-extrabold text-white"
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  background: 'linear-gradient(135deg, #ffffff 0%, #f0abfc 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
            BRANE
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          <NavLink to="/social" label="Feed" icon={Home} active={isActive('/social')} />
          <NavLink to="/market" label="Marketplace" icon={ShoppingBag} active={isActive('/market') || isActive('/products') || isActive('/stores')} variant="market" />
          {user && <NavLink to="/notifications" label="Notificações" icon={Bell} active={isActive('/notifications')} />}
          {user && <NavLink to="/support" label="Suporte" icon={MessageSquare} active={isActive('/support')} />}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-purple-500/10 transition-colors"
                data-testid="nav-user-menu"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                     style={{ background: 'linear-gradient(135deg, #ec4899, #a855f7)' }}>
                  {user.picture ? <img src={user.picture} alt={user.name} className="w-full h-full rounded-full object-cover" /> : getInitials(user.name)}
                </div>
                <span className="text-sm text-purple-100 hidden sm:inline max-w-[120px] truncate">{user.name?.split(' ')[0]}</span>
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-60 rounded-xl border border-purple-900/40 shadow-2xl py-2 z-50"
                       style={{ background: 'linear-gradient(135deg, rgba(26,6,46,0.98), rgba(20,4,38,0.98))' }}
                       data-testid="user-dropdown">
                    <div className="px-4 py-3 border-b border-purple-900/30">
                      <p className="text-white text-sm font-semibold truncate">{user.name}</p>
                      <p className="text-purple-200/50 text-xs truncate">{user.email}</p>
                      <span className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 capitalize">{user.role}</span>
                    </div>
                    <MenuItem to="/profile" icon={User} label="Meu perfil" onClick={() => setMenuOpen(false)} />
                    <MenuItem to="/dashboard" icon={Settings} label="Painel" onClick={() => setMenuOpen(false)} />
                    <MenuItem to="/market" icon={Store} label="Marketplace" onClick={() => setMenuOpen(false)} />
                    <MenuItem to="/support" icon={MessageSquare} label="Suporte" onClick={() => setMenuOpen(false)} />
                    {user.role === 'admin' && <MenuItem to="/admin" icon={Settings} label="Admin" onClick={() => setMenuOpen(false)} />}
                    <div className="border-t border-purple-900/30 mt-1 pt-1">
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-300 hover:bg-red-500/10 flex items-center gap-3" data-testid="logout-btn">
                        <LogOut className="w-4 h-4" /> Sair
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link to="/auth" className="text-sm font-semibold text-white px-5 py-2 rounded-full transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #ec4899, #a855f7)' }}
                  data-testid="nav-login-btn">
              Entrar
            </Link>
          )}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-purple-100" data-testid="mobile-menu-btn">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-purple-900/30 bg-[#0a0014]">
          <div className="px-4 py-3 space-y-1">
            <MobileLink to="/social" label="Feed" icon={Home} onClick={() => setMobileOpen(false)} />
            <MobileLink to="/market" label="Marketplace" icon={ShoppingBag} onClick={() => setMobileOpen(false)} />
            {user && <MobileLink to="/notifications" label="Notificações" icon={Bell} onClick={() => setMobileOpen(false)} />}
            {user && <MobileLink to="/support" label="Suporte" icon={MessageSquare} onClick={() => setMobileOpen(false)} />}
            {user && <MobileLink to="/profile" label="Meu perfil" icon={User} onClick={() => setMobileOpen(false)} />}
          </div>
        </div>
      )}
    </nav>
  );
}

function NavLink({ to, label, icon: Icon, active, variant }) {
  const isMarket = variant === 'market';
  return (
    <Link
      to={to}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all"
      style={{
        color: active ? '#ffffff' : (isMarket ? 'rgba(251,191,36,0.9)' : 'rgba(216,180,254,0.75)'),
        background: active ? (isMarket ? 'rgba(251,191,36,0.15)' : 'rgba(168,85,247,0.15)') : 'transparent'
      }}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </Link>
  );
}

function MenuItem({ to, icon: Icon, label, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 text-sm text-purple-100 hover:bg-purple-500/10 hover:text-pink-300 transition-colors"
    >
      <Icon className="w-4 h-4" /> {label}
    </Link>
  );
}

function MobileLink({ to, label, icon: Icon, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2.5 text-sm text-purple-100 hover:bg-purple-500/10 rounded-lg"
    >
      <Icon className="w-4 h-4" /> {label}
    </Link>
  );
}
