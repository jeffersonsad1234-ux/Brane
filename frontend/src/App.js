import "./App.css";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import AuthCallback from "./components/AuthCallback";
import AnimatedBackground from "./components/AnimatedBackground";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import FloatingSupport from "./components/FloatingSupport";
import EntryPage from "./pages/EntryPage";
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
import { Toaster } from "./components/ui/sonner";

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a0014, #1a0033)' }}>
        <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/market" replace />;
  return children;
}

function AppRouter() {
  const location = useLocation();
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  const path = location.pathname;
  const isEntry = path === '/' || path === '/entry';
  const isAuth = path === '/auth';

  // Full screen pages (no navbar/footer)
  if (isEntry || isAuth) {
    return (
      <>
        <Routes>
          <Route path="/" element={<EntryPage />} />
          <Route path="/entry" element={<EntryPage />} />
          <Route path="/auth" element={<AuthPage />} />
        </Routes>
        <Toaster position="top-right" />
      </>
    );
  }

  // Admin page has its own chrome (no navbar)
  const isAdmin = path.startsWith('/admin');

  return (
    <>
      <AnimatedBackground />
      <div className="relative z-10">
        {!isAdmin && <Navbar />}

        <main className="min-h-screen">
          <Routes>
            <Route path="/market" element={<HomePage />} />
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
            {/* Legacy /social routes redirect to marketplace */}
            <Route path="/social" element={<Navigate to="/market" replace />} />
            <Route path="/social/*" element={<Navigate to="/market" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <Footer />
        {!isAdmin && <FloatingSupport />}
      </div>
      <Toaster position="top-right" />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
