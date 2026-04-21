import "@/App.css";
import "@/social.css";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CustomizationProvider } from "./contexts/CustomizationContext";
import AuthCallback from "./components/AuthCallback";
import AnimatedBackground from "./components/AnimatedBackground";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import FloatingSupport from "./components/FloatingSupport";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import DashboardPage from "./pages/DashboardPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import AdminPage from "./pages/AdminPage";
import WalletPage from "./pages/WalletPage";
import OrdersPage from "./pages/OrdersPage";
import NotificationsPage from "./pages/NotificationsPage";
import ProfilePage from "./pages/ProfilePage";
import StaticPage from "./pages/StaticPage";
import StoresPage from "./pages/StoresPage";
import StoreDetailPage from "./pages/StoreDetailPage";
import CreateStorePage from "./pages/CreateStorePage";
import SupportPage from "./pages/SupportPage";
import DesapegaPage from "./pages/DesapegaPage";
import BraneCoinsPage from "./pages/BraneCoinsPage";
import EntryPage from "./pages/EntryPage";
import SocialFeedPage from "./pages/SocialFeedPage";
import SocialProfilePage from "./pages/SocialProfilePage";
import SocialMessagesPage from "./pages/SocialMessagesPage";
import { SocialGroupsPage, SocialGroupDetailPage } from "./pages/SocialGroupsPage";
import SocialNotificationsPage from "./pages/SocialNotificationsPage";
import { Toaster } from "./components/ui/sonner";

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F9F8]">
        <div className="w-8 h-8 border-4 border-[#B38B36] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

// Layout for social pages (no marketplace navbar/footer)
function SocialLayout({ children }) {
  return <>{children}</>;
}

// Layout for marketplace pages
function MarketLayout({ children }) {
  return (
    <>
      <AnimatedBackground />
      <div className="relative z-10">
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <FloatingSupport />
        <div className="brane-watermark">BRANE MARKETPLACE</div>
      </div>
    </>
  );
}

function AppRouter() {
  const location = useLocation();
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  const isSocial = location.pathname.startsWith('/social');
  const isEntry = location.pathname === '/entry';

  return (
    <>
      {isSocial || isEntry ? (
        <Routes>
          <Route path="/entry" element={<EntryPage />} />
          <Route path="/social" element={<ProtectedRoute><SocialFeedPage /></ProtectedRoute>} />
          <Route path="/social/profile/:userId" element={<ProtectedRoute><SocialProfilePage /></ProtectedRoute>} />
          <Route path="/social/messages" element={<ProtectedRoute><SocialMessagesPage /></ProtectedRoute>} />
          <Route path="/social/messages/:userId" element={<ProtectedRoute><SocialMessagesPage /></ProtectedRoute>} />
          <Route path="/social/groups" element={<ProtectedRoute><SocialGroupsPage /></ProtectedRoute>} />
          <Route path="/social/groups/:groupId" element={<ProtectedRoute><SocialGroupDetailPage /></ProtectedRoute>} />
          <Route path="/social/notifications" element={<ProtectedRoute><SocialNotificationsPage /></ProtectedRoute>} />
        </Routes>
      ) : (
        <MarketLayout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/stores" element={<StoresPage />} />
            <Route path="/stores/:slug" element={<StoreDetailPage />} />
            <Route path="/desapega" element={<DesapegaPage />} />
            <Route path="/create-store" element={<ProtectedRoute><CreateStorePage /></ProtectedRoute>} />
            <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/support" element={<ProtectedRoute><SupportPage /></ProtectedRoute>} />
            <Route path="/brane-coins" element={<ProtectedRoute><BraneCoinsPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
            <Route path="/pages/:slug" element={<StaticPage />} />
          </Routes>
        </MarketLayout>
      )}
      <Toaster position="top-right" />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <CustomizationProvider>
            <AppRouter />
          </CustomizationProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
