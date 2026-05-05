import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';
import {
  Search, ShoppingCart, Bell, User, LogOut, ChevronDown, Menu, X,
  Wallet, Package, Settings, HelpCircle, Shield, Store, MessageCircle,
  MessageSquare, Heart, PlusCircle, Crown
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '../components/ui/dropdown-menu';

export const BRANE_LOGO_URL = '/brand/logo-3d.png';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function Navbar({ onSearch }) {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();

  const [searchVal, setSearchVal] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [notifCount, setNotifCount] = useState(0);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (!user || !token) {
      setCartCount(0);
      setNotifCount(0);
      return;
    }

    const headers = { Authorization: 'Bearer ' + token };

    const loadCart = () => {
      axios.get(API + '/cart', { headers })
        .then((r) => setCartCount((r.data.items || []).length))
        .catch(() => {});
    };

    const loadNotifs = () => {
      axios.get(API + '/notifications', { headers })
        .then((r) => setNotifCount((r.data && r.data.unread) || 0))
        .catch(() => {});
    };

    loadCart();
    loadNotifs();

    const interval = setInterval(loadNotifs, 45000);
    return () => clearInterval(interval);
  }, [user, token]);

  const canAnnounceProduct = user && (user.role === 'seller' || user.role === 'admin');

  const roleLabels = {
    buyer: 'Comprador',
    seller: 'Vendedor',
    affiliate: 'Afiliado',
    admin: 'Admin (CEO)'
  };

  const handleSearch = (e) => {
    e.preventDefault();

    if (onSearch) {
      onSearch(searchVal);
    } else {
      navigate('/market?search=' + encodeURIComponent(searchVal));
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const openAuth = () => {
    setMobileOpen(false);
    setAuthOpen(true);
  };

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-[#1E2230] backdrop-blur-xl theme-aware-navbar" data-testid="navbar">
        <div className="max-w-[1400px] mx-auto px-5" style={{ height: 76 }}>
          <div className="h-full flex items-center gap-5">
            <Link to="/market" className="flex items-center shrink-0 group" data-testid="navbar-logo">
              <div className="relative w-11 h-11 rounded-xl overflow-hidden ring-1 ring-[#D4A24C]/30 group-hover:ring-[#D4A24C]/70 transition">
                <img src={BRANE_LOGO_URL} alt="BRANE" className="w-full h-full object-cover" />
              </div>
            </Link>

            <form onSubmit={handleSearch} className="flex-1 hidden md:flex justify-center" data-testid="search-form">
              <div className="relative w-full" style={{ maxWidth: 560 }}>
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#8C8F9A]" />
                <input
                  type="text"
                  placeholder="Buscar produtos, marcas e mais..."
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  className="brane-search"
                  data-testid="search-input"
                />
              </div>
            </form>

            <div className="flex items-center gap-1.5 ml-auto">
              {user ? (
                <>
                  <Link to="/support" className="brane-nav-icon-btn hidden sm:inline-flex" title="Mensagens" data-testid="nav-messages">
                    <MessageSquare className="w-[20px] h-[20px]" />
                  </Link>

                  <Link to="/cart" className="brane-nav-icon-btn" data-testid="cart-link" title="Carrinho">
                    <ShoppingCart className="w-[20px] h-[20px]" />
                    {cartCount > 0 && <span className="badge">{cartCount}</span>}
                  </Link>

                  <Link to="/market?favorites=1" className="brane-nav-icon-btn hidden sm:inline-flex" title="Favoritos" data-testid="nav-favorites">
                    <Heart className="w-[20px] h-[20px]" />
                  </Link>

                  <Link to="/notifications" className="brane-nav-icon-btn hidden sm:inline-flex" data-testid="notifications-link" title="Notificações">
                    <Bell className="w-[20px] h-[20px]" />
                    {notifCount > 0 && <span className="badge red">{notifCount}</span>}
                  </Link>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full border border-[#1E2230] hover:border-[#D4A24C]/45 transition ml-1" data-testid="user-menu-trigger">
                        <div className="brane-avatar-gradient" style={{ width: 38, height: 38 }}>
                          <div className="w-full h-full flex items-center justify-center overflow-hidden">
                            {user.picture ? (
                              <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[#D4A24C] font-bold text-xs">{getInitials(user.name)}</span>
                            )}
                          </div>
                        </div>

                        <div className="hidden sm:block text-left leading-tight">
                          <div className="text-[13px] text-white font-semibold">
                            {user.name ? user.name.split(' ').slice(0, 2).join(' ') : ''}
                          </div>
                          <div className="text-[10px] text-[#D4A24C]">
                            {roleLabels[user.role] || user.role}
                          </div>
                        </div>

                        <ChevronDown className="w-4 h-4 text-[#A6A8B3]" />
                      </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" sideOffset={12} className="brane-dropdown" style={{ width: 420 }}>
                      <div className="flex items-center gap-4 px-3 py-3 mb-1">
                        <div className="brane-avatar-gradient" style={{ width: 68, height: 68, borderRadius: 20, padding: 3 }}>
                          <div className="w-full h-full flex items-center justify-center overflow-hidden" style={{ borderRadius: 16 }}>
                            {user.picture ? (
                              <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[#D4A24C] font-bold text-xl">{getInitials(user.name)}</span>
                            )}
                          </div>
                        </div>

                        <div className="min-w-0">
                          <p className="font-semibold text-[17px] text-white truncate leading-tight">{user.name}</p>
                          <p className="text-sm text-[#D4A24C] mt-1">{roleLabels[user.role] || user.role}</p>
                        </div>
                      </div>

                      <div className="brane-dropdown-sep" />

                      <DropdownMenuItem onClick={() => navigate('/profile')} className="brane-dropdown-item focus:bg-transparent" data-testid="menu-profile">
                        <User className="w-[18px] h-[18px] icon" /> <span>Meu Perfil</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => navigate('/orders')} className="brane-dropdown-item focus:bg-transparent" data-testid="menu-orders">
                        <Package className="w-[18px] h-[18px] icon" /> <span>Meus Pedidos</span>
                      </DropdownMenuItem>

                      {user.role !== 'buyer' && (
                        <DropdownMenuItem onClick={() => navigate('/wallet')} className="brane-dropdown-item focus:bg-transparent" data-testid="menu-wallet">
                          <Wallet className="w-[18px] h-[18px] icon" /> <span>Carteira</span>
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuItem onClick={() => navigate('/dashboard')} className="brane-dropdown-item focus:bg-transparent" data-testid="menu-dashboard">
                        <Settings className="w-[18px] h-[18px] icon" /> <span>Painel</span>
                      </DropdownMenuItem>

                      <div className="brane-dropdown-sep" />

                      {user.role !== 'buyer' && (
                        <>
                          <DropdownMenuItem onClick={() => navigate('/stores/my')} className="brane-dropdown-item focus:bg-transparent" data-testid="menu-store">
                            <Store className="w-[18px] h-[18px] icon" /> <span>Minha Loja</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => navigate('/dashboard')} className="brane-dropdown-item focus:bg-transparent" data-testid="menu-my-products">
                            <Package className="w-[18px] h-[18px] icon" /> <span>Meus Produtos</span>
                          </DropdownMenuItem>

                          {canAnnounceProduct && (
                            <DropdownMenuItem onClick={() => navigate('/add-product')} className="brane-dropdown-item focus:bg-transparent" data-testid="menu-add-product">
                              <PlusCircle className="w-[18px] h-[18px] icon" /> <span>Adicionar Produto</span>
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem onClick={() => navigate('/promote')} className="brane-dropdown-item focus:bg-transparent" data-testid="menu-promote">
                            <Crown className="w-[18px] h-[18px] icon" /> <span>Promover minha loja</span>
                          </DropdownMenuItem>
                        </>
                      )}

                      {user.role === 'admin' && (
                        <DropdownMenuItem onClick={() => navigate('/admin')} className="brane-dropdown-item focus:bg-transparent" data-testid="menu-admin">
                          <Shield className="w-[18px] h-[18px] icon" /> <span>Painel Admin</span>
                        </DropdownMenuItem>
                      )}

                      <div className="brane-dropdown-sep" />

                      <DropdownMenuItem onClick={() => navigate('/support')} className="brane-dropdown-item focus:bg-transparent" data-testid="menu-support">
                        <MessageCircle className="w-[18px] h-[18px] icon" /> <span>Falar com Suporte</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => navigate('/pages/faq')} className="brane-dropdown-item focus:bg-transparent" data-testid="menu-help">
                        <HelpCircle className="w-[18px] h-[18px] icon" /> <span>Central de Ajuda</span>
                      </DropdownMenuItem>

                      <div className="px-2 pt-3">
                        <button onClick={logout} className="brane-dropdown-logout" data-testid="menu-logout">
                          <LogOut className="w-[18px] h-[18px]" /> Sair da Conta
                        </button>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={openAuth}
                    data-testid="login-link"
                    className="text-sm text-[#A6A8B3] hover:text-[#D4A24C] transition font-medium hidden sm:inline-block"
                  >
                    Entrar
                  </button>

                  <button
                    type="button"
                    onClick={openAuth}
                    data-testid="signup-link"
                    className="brane-btn-primary"
                  >
                    Cadastre-se
                  </button>
                </div>
              )}

              <button className="md:hidden p-2 text-[#A6A8B3] ml-1" onClick={() => setMobileOpen(!mobileOpen)} data-testid="mobile-menu-toggle">
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {mobileOpen && (
            <div className="md:hidden pb-4 -mt-2">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#8C8F9A]" />
                  <input
                    type="text"
                    placeholder="Buscar produtos..."
                    value={searchVal}
                    onChange={(e) => setSearchVal(e.target.value)}
                    className="brane-search"
                  />
                </div>
              </form>

              <div className="flex flex-col gap-1 mt-3">
                <Link to="/market" className="px-3 py-2.5 text-sm text-gray-200 hover:text-[#D4A24C] rounded-lg hover:bg-[#11131A]" onClick={() => setMobileOpen(false)}>
                  Produtos
                </Link>

                <Link to="/stores" className="px-3 py-2.5 text-sm text-gray-200 hover:text-[#D4A24C] rounded-lg hover:bg-[#11131A]" onClick={() => setMobileOpen(false)}>
                  Lojas
                </Link>

                <Link to="/market" className="px-3 py-2.5 text-sm text-gray-200 hover:text-[#D4A24C] rounded-lg hover:bg-[#11131A]" onClick={() => setMobileOpen(false)}>
                  Categorias
                </Link>

                {!user && (
                  <>
                    <button
                      type="button"
                      onClick={openAuth}
                      className="text-left px-3 py-2.5 text-sm text-gray-200 hover:text-[#D4A24C] rounded-lg hover:bg-[#11131A]"
                    >
                      Entrar
                    </button>

                    <button
                      type="button"
                      onClick={openAuth}
                      className="text-left px-3 py-2.5 text-sm text-[#D4A24C] rounded-lg hover:bg-[#11131A] font-bold"
                    >
                      Cadastre-se
                    </button>
                  </>
                )}

                {user && user.role !== 'buyer' && (
                  <Link to="/dashboard" className="px-3 py-2.5 text-sm text-gray-200 hover:text-[#D4A24C] rounded-lg hover:bg-[#11131A]" onClick={() => setMobileOpen(false)}>
                    Dashboard
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {user && (
        <div className="bg-[#080A0F] border-b border-[#14171F]">
          <div className="max-w-[1400px] mx-auto px-5 h-[52px] flex items-center justify-between gap-5">
            <div className="flex items-center gap-6 text-[13px] overflow-x-auto scrollbar-hide">
              <Link to="/market?sort=offers" className="theme-aware-nav-link transition font-medium whitespace-nowrap" data-testid="nav-offers">Ofertas</Link>
              <Link to="/market" className="theme-aware-nav-link transition font-medium whitespace-nowrap" data-testid="nav-categories">Categorias</Link>
              <Link to="/market?sort=bestsellers" className="theme-aware-nav-link transition font-medium whitespace-nowrap" data-testid="nav-bestsellers">Mais vendidos</Link>
              <Link to="/market?sort=new" className="theme-aware-nav-link transition font-medium whitespace-nowrap" data-testid="nav-new">Novidades</Link>
              <Link to="/stores" className="theme-aware-nav-link transition font-medium whitespace-nowrap" data-testid="nav-stores">Lojas</Link>
            </div>

            <Link to="/add-product" data-testid="nav-announce-product" className={canAnnounceProduct ? '' : 'hidden'}>
              <button className="brane-btn-primary" style={{ padding: '0.5rem 1.2rem', fontSize: '0.78rem' }}>
                <PlusCircle className="w-4 h-4" /> Anunciar produto
              </button>
            </Link>
          </div>
        </div>
      )}

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
      />
    </>
  );
}
