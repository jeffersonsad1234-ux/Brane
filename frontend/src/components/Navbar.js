import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Search, ShoppingCart, Bell, User, LogOut, ChevronDown, Menu, X, Wallet, Package, Settings, HelpCircle, Shield, Store, Heart, Star, Gift, Coins, Tag, MessageCircle } from 'lucide-react';
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
    try { await switchRole(role); navigate('/dashboard'); } catch {}
  };

  const roleLabels = { buyer: 'Comprador', seller: 'Vendedor', affiliate: 'Afiliado', admin: 'Admin (CEO)' };
  const roleColors = { buyer: 'text-blue-400', seller: 'text-green-400', affiliate: 'text-purple-400', admin: 'text-[#B38B36]' };
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
              <input type="text" placeholder="Buscar produtos..." value={searchVal} onChange={(e) => setSearchVal(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] text-white text-sm focus:outline-none focus:border-[#B38B36] placeholder:text-[#555]"
                data-testid="search-input" />
            </div>
          </form>

          <div className="flex items-center gap-1">
            <Link to="/products" className="text-sm text-[#888] hover:text-[#B38B36] hidden md:block px-2 py-2" data-testid="nav-products">Produtos</Link>
            <Link to="/stores" className="text-sm text-[#888] hover:text-[#B38B36] hidden md:block px-2 py-2" data-testid="nav-stores">Lojas</Link>
            <Link to="/desapega" className="text-sm text-[#888] hover:text-[#B38B36] hidden lg:block px-2 py-2" data-testid="nav-desapega">Desapega</Link>
            <Link to="/social" className="text-sm bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-semibold hidden md:block px-2 py-2 hover:opacity-80" data-testid="nav-social">BRANE Social</Link>

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
                  <DropdownMenuContent align="end" className="w-72 bg-[#1A1A1A] border-[#2A2A2A]">
                    {/* User Info Header */}
                    <div className="px-3 py-3 border-b border-[#2A2A2A]">
                      <div className="flex items-center gap-3">
                        <div className="profile-avatar-sm shrink-0">
                          {user.picture ? <img src={user.picture} alt={user.name} /> : <span>{getInitials(user.name)}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-white truncate">{user.name}</p>
                          <p className={`text-xs ${roleColors[user.role] || 'text-[#888]'}`}>{roleLabels[user.role] || user.role}</p>
                          {user.is_vip && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#B38B36]/20 text-[#B38B36] font-bold">VIP</span>}
                        </div>
                      </div>
                    </div>
                    
                    {/* Main Navigation */}
                    <div className="py-1">
                      <DropdownMenuItem onClick={() => navigate('/profile')} className="text-[#CCC] hover:text-white focus:text-white focus:bg-[#2A2A2A] py-2.5" data-testid="menu-profile">
                        <User className="w-4 h-4 mr-3 text-[#666]" /> Meu Perfil
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/orders')} className="text-[#CCC] hover:text-white focus:text-white focus:bg-[#2A2A2A] py-2.5" data-testid="menu-orders">
                        <Package className="w-4 h-4 mr-3 text-[#666]" /> Meus Pedidos
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/wallet')} className="text-[#CCC] hover:text-white focus:text-white focus:bg-[#2A2A2A] py-2.5" data-testid="menu-wallet">
                        <Wallet className="w-4 h-4 mr-3 text-[#666]" /> {user.role === 'buyer' ? 'Minha Carteira' : 'Carteira'}
                      </DropdownMenuItem>
                    </div>

                    <DropdownMenuSeparator className="bg-[#2A2A2A]" />

                    {/* Buyer Specific */}
                    <div className="py-1">
                      <DropdownMenuItem onClick={() => navigate('/brane-coins')} className="text-[#CCC] hover:text-white focus:text-white focus:bg-[#2A2A2A] py-2.5" data-testid="menu-coins">
                        <Coins className="w-4 h-4 mr-3 text-yellow-500" /> Brane Coins
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/desapega')} className="text-[#CCC] hover:text-white focus:text-white focus:bg-[#2A2A2A] py-2.5" data-testid="menu-desapega">
                        <Tag className="w-4 h-4 mr-3 text-orange-400" /> Desapega
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/notifications')} className="text-[#CCC] hover:text-white focus:text-white focus:bg-[#2A2A2A] py-2.5" data-testid="menu-notifications">
                        <Bell className="w-4 h-4 mr-3 text-[#666]" /> Notificacoes
                      </DropdownMenuItem>
                    </div>

                    <DropdownMenuSeparator className="bg-[#2A2A2A]" />

                    {/* Dashboard & Store */}
                    <div className="py-1">
                      <DropdownMenuItem onClick={() => navigate('/dashboard')} className="text-[#CCC] hover:text-white focus:text-white focus:bg-[#2A2A2A] py-2.5" data-testid="menu-dashboard">
                        <Settings className="w-4 h-4 mr-3 text-[#666]" /> Painel
                      </DropdownMenuItem>
                      {(user.role === 'seller' || user.role === 'admin') && (
                        <DropdownMenuItem onClick={() => navigate('/stores')} className="text-[#CCC] hover:text-white focus:text-white focus:bg-[#2A2A2A] py-2.5">
                          <Store className="w-4 h-4 mr-3 text-[#666]" /> Minha Loja
                        </DropdownMenuItem>
                      )}
                    </div>

                    {user.role === 'admin' && (
                      <>
                        <DropdownMenuSeparator className="bg-[#2A2A2A]" />
                        <DropdownMenuItem onClick={() => navigate('/admin')} className="text-[#B38B36] hover:text-[#B38B36] focus:text-[#B38B36] focus:bg-[#2A2A2A] py-2.5" data-testid="menu-admin">
                          <Shield className="w-4 h-4 mr-3" /> Painel Admin
                        </DropdownMenuItem>
                      </>
                    )}

                    {/* Role Switching */}
                    {user.role !== 'admin' && (
                      <>
                        <DropdownMenuSeparator className="bg-[#2A2A2A]" />
                        <div className="px-3 py-2">
                          <p className="text-xs text-[#555] mb-2">Trocar para:</p>
                          <div className="flex flex-wrap gap-2">
                            {['buyer', 'seller', 'affiliate'].filter(r => r !== user.role).map(r => (
                              <button key={r} onClick={() => handleRoleSwitch(r)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${r === 'buyer' ? 'border-blue-500/30 text-blue-400 hover:bg-blue-500/10' : r === 'seller' ? 'border-green-500/30 text-green-400 hover:bg-green-500/10' : 'border-purple-500/30 text-purple-400 hover:bg-purple-500/10'}`}
                                data-testid={`switch-role-${r}`}>{roleLabels[r]}</button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Help & Support & Logout */}
                    <DropdownMenuSeparator className="bg-[#2A2A2A]" />
                    <DropdownMenuItem onClick={() => navigate('/support')} className="text-[#888] hover:text-white focus:text-white focus:bg-[#2A2A2A] py-2.5" data-testid="menu-support">
                      <MessageCircle className="w-4 h-4 mr-3" /> Falar com Suporte
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/pages/faq')} className="text-[#888] hover:text-white focus:text-white focus:bg-[#2A2A2A] py-2.5">
                      <HelpCircle className="w-4 h-4 mr-3" /> Central de Ajuda
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={logout} className="text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-[#2A2A2A] py-2.5" data-testid="menu-logout">
                      <LogOut className="w-4 h-4 mr-3" /> Sair
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
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] text-white text-sm placeholder:text-[#555]" />
              </div>
            </form>
            <div className="flex flex-col gap-1 mt-2">
              <Link to="/products" className="px-3 py-2 text-sm text-[#888] hover:text-white rounded" onClick={() => setMobileOpen(false)}>Produtos</Link>
              <Link to="/stores" className="px-3 py-2 text-sm text-[#888] hover:text-white rounded" onClick={() => setMobileOpen(false)}>Lojas</Link>
              <Link to="/desapega" className="px-3 py-2 text-sm text-[#888] hover:text-white rounded" onClick={() => setMobileOpen(false)}>Desapega</Link>
              {user && <Link to="/support" className="px-3 py-2 text-sm text-[#888] hover:text-white rounded" onClick={() => setMobileOpen(false)}>Suporte</Link>}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
