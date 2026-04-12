import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Search, ShoppingCart, Bell, User, LogOut, ChevronDown, Menu, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from '../components/ui/dropdown-menu';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_brane-exchange/artifacts/wiagamwr_IMG_20260412_043249_662.jpg';

export default function Navbar({ onSearch }) {
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();
  const [searchVal, setSearchVal] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(searchVal);
    else navigate(`/products?search=${encodeURIComponent(searchVal)}`);
  };

  const handleRoleSwitch = async (role) => {
    try {
      await switchRole(role);
      navigate('/dashboard');
    } catch {}
  };

  const roleLabels = { buyer: 'Comprador', seller: 'Vendedor', affiliate: 'Afiliado', admin: 'Admin (CEO)' };

  const getInitials = (name) => name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';

  return (
    <nav className="nav-dark sticky top-0 z-50 border-b border-[#2A2A2A]" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0" data-testid="logo-link">
            <img src={LOGO_URL} alt="BRANE" className="w-9 h-9 rounded-lg object-cover" />
            <span className="brane-logo-text-dark text-lg hidden sm:block">BRANE</span>
          </Link>

          <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden md:flex" data-testid="search-form">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
              <input
                type="text" placeholder="Buscar produtos..."
                value={searchVal} onChange={(e) => setSearchVal(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] text-white text-sm focus:outline-none focus:border-[#B38B36] placeholder:text-[#555]"
                data-testid="search-input"
              />
            </div>
          </form>

          <div className="flex items-center gap-2">
            <Link to="/products" className="text-sm text-[#888] hover:text-[#B38B36] hidden md:block px-3 py-2" data-testid="nav-products">
              Produtos
            </Link>

            {user ? (
              <>
                <Link to="/cart" className="relative p-2 hover:bg-[#1A1A1A] rounded-lg" data-testid="cart-link">
                  <ShoppingCart className="w-5 h-5 text-[#888]" />
                </Link>
                <Link to="/notifications" className="relative p-2 hover:bg-[#1A1A1A] rounded-lg hidden sm:block" data-testid="notifications-link">
                  <Bell className="w-5 h-5 text-[#888]" />
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 px-2 text-[#CCC] hover:text-white hover:bg-[#1A1A1A]" data-testid="user-menu-trigger">
                      <div className="profile-avatar-sm">
                        {user.picture ? <img src={user.picture} alt={user.name} /> : <span>{getInitials(user.name)}</span>}
                      </div>
                      <span className="hidden sm:inline text-sm">{user.name?.split(' ')[0]}</span>
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-[#1A1A1A] border-[#2A2A2A]">
                    <div className="px-3 py-2 border-b border-[#2A2A2A] flex items-center gap-3">
                      <div className="profile-avatar-sm shrink-0">
                        {user.picture ? <img src={user.picture} alt={user.name} /> : <span>{getInitials(user.name)}</span>}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-white">{user.name}</p>
                        <p className="text-xs text-[#888]">{roleLabels[user.role] || user.role}</p>
                      </div>
                    </div>
                    <DropdownMenuItem onClick={() => navigate('/profile')} className="text-[#CCC] hover:text-white focus:text-white focus:bg-[#2A2A2A]" data-testid="menu-profile">
                      Meu Perfil
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/dashboard')} className="text-[#CCC] hover:text-white focus:text-white focus:bg-[#2A2A2A]" data-testid="menu-dashboard">
                      Painel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/wallet')} className="text-[#CCC] hover:text-white focus:text-white focus:bg-[#2A2A2A]" data-testid="menu-wallet">
                      Carteira
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/orders')} className="text-[#CCC] hover:text-white focus:text-white focus:bg-[#2A2A2A]" data-testid="menu-orders">
                      Meus Pedidos
                    </DropdownMenuItem>
                    {user.role === 'admin' && (
                      <DropdownMenuItem onClick={() => navigate('/admin')} className="text-[#CCC] hover:text-white focus:text-white focus:bg-[#2A2A2A]" data-testid="menu-admin">
                        Painel Admin
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="bg-[#2A2A2A]" />
                    {user.role !== 'admin' && (
                      <div className="px-2 py-1.5">
                        <p className="text-xs text-[#666] mb-1 px-2">Trocar papel:</p>
                        {['buyer', 'seller', 'affiliate'].filter(r => r !== user.role).map(r => (
                          <DropdownMenuItem key={r} onClick={() => handleRoleSwitch(r)} className="text-[#B38B36] hover:text-[#B38B36] focus:text-[#B38B36] focus:bg-[#2A2A2A]" data-testid={`switch-role-${r}`}>
                            {roleLabels[r]}
                          </DropdownMenuItem>
                        ))}
                      </div>
                    )}
                    <DropdownMenuSeparator className="bg-[#2A2A2A]" />
                    <DropdownMenuItem onClick={logout} className="text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-[#2A2A2A]" data-testid="menu-logout">
                      <LogOut className="w-4 h-4 mr-2" /> Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link to="/auth" data-testid="login-link">
                <Button className="gold-btn rounded-lg px-6 text-sm font-semibold uppercase tracking-wider">Entrar</Button>
              </Link>
            )}

            <button className="md:hidden p-2 text-[#888]" onClick={() => setMobileOpen(!mobileOpen)} data-testid="mobile-menu-toggle">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden mt-3 pb-2">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                <input type="text" placeholder="Buscar produtos..." value={searchVal} onChange={(e) => setSearchVal(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] text-white text-sm placeholder:text-[#555]"
                  data-testid="mobile-search-input" />
              </div>
            </form>
            <div className="flex flex-col gap-1 mt-2">
              <Link to="/products" className="px-3 py-2 text-sm text-[#888] hover:text-white rounded" onClick={() => setMobileOpen(false)}>Produtos</Link>
              {user && <Link to="/notifications" className="px-3 py-2 text-sm text-[#888] hover:text-white rounded" onClick={() => setMobileOpen(false)}>Notificacoes</Link>}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
