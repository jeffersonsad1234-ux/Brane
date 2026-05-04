import "./App.css";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import AuthCallback from "./components/AuthCallback";
import AnimatedBackground from "./components/AnimatedBackground";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import FloatingSupport from "./components/FloatingSupport";

import HomePage from "./pages/HomePage";
import SuppliersPage from "./pages/SuppliersPage";
import AuthPage from "./pages/AuthPage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import DashboardPage from "./pages/DashboardPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import WalletPage from "./pages/WalletPage";
import OrdersPage from "./pages/OrdersPage";
import NotificationsPage from "./pages/NotificationsPage";
import ProfilePage from "./pages/ProfilePage";
import StaticPage from "./pages/StaticPage";
import StoresPage from "./pages/StoresPage";
import StoreDetailPage from "./pages/StoreDetailPage";
import StoreChatPage from "./pages/StoreChatPage";
import DirectChatPage from "./pages/DirectChatPage";
import CreateStorePage from "./pages/CreateStorePage";
import SupportPage from "./pages/SupportPage";
import DesapegaPage from "./pages/DesapegaPage";
import BraneCoinsPage from "./pages/BraneCoinsPage";
import AddProductPage from "./pages/AddProductPage";
import SocialPage from "./pages/SocialPage";
import { Toaster } from "./components/ui/sonner";
import AddStoreProductPage from "./pages/AddStoreProductPage";
import AddDesapegaProductPage from "./pages/AddDesapegaProductPage";
import AdminPage from "./pages/AdminPage";
import PromotionPlansPage from "./pages/PromotionPlansPage";

function ProtectedRoute({ children, adminOnly = false, sellerOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050608]">
        <div className="w-9 h-9 border-2 border-[#8A2CFF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/market" replace />;
  }

  if (
    sellerOnly &&
    user.role !== "seller" &&
    user.role !== "admin"
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AppRouter() {
  const location = useLocation();

  if (location.hash && location.hash.includes("session_id=")) {
    return <AuthCallback />;
  }

  const path = location.pathname;
  const isAuth = path === "/auth";

  if (isAuth) {
    return (
      <>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="*" element={<Navigate to="/market" replace />} />
        </Routes>

        <Toaster position="top-right" />
      </>
    );
  }

  const isAdmin = path.startsWith("/admin");
  const isSocial = path.startsWith("/social");

  return (
    <>
      <AnimatedBackground />

      <div className="relative z-10">
        {!isAdmin && !isSocial && <Navbar />}

        <main className="min-h-screen">
          <Routes>
            <Route path="/" element={<Navigate to="/market" replace />} />
            <Route path="/market" element={<HomePage />} />

            <Route path="/fornecedores" element={<SuppliersPage />} />

            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />

            <Route path="/stores" element={<StoresPage />} />

            <Route
              path="/stores/create"
              element={
                <ProtectedRoute>
                  <CreateStorePage />
                </ProtectedRoute>
              }
            />

            <Route path="/stores/:slug" element={<StoreDetailPage />} />

            <Route
              path="/stores/:slug/chat"
              element={
                <ProtectedRoute>
                  <StoreChatPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/chat/:userId"
              element={
                <ProtectedRoute>
                  <DirectChatPage />
                </ProtectedRoute>
              }
            />

            <Route path="/desapega" element={<DesapegaPage />} />

            <Route path="/social" element={<SocialPage />} />
            <Route path="/social/*" element={<SocialPage />} />

            <Route
              path="/add-product"
              element={
                <ProtectedRoute sellerOnly>
                  <AddProductPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/add-product/feed"
              element={
                <ProtectedRoute sellerOnly>
                  <AddStoreProductPage mode="feed" />
                </ProtectedRoute>
              }
            />

            <Route
              path="/add-product/store"
              element={
                <ProtectedRoute sellerOnly>
                  <AddStoreProductPage mode="store" />
                </ProtectedRoute>
              }
            />

            <Route
              path="/add-product/desapega"
              element={
                <ProtectedRoute sellerOnly>
                  <AddDesapegaProductPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/cart"
              element={
                <ProtectedRoute>
                  <CartPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/wallet"
              element={
                <ProtectedRoute>
                  <WalletPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <OrdersPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/support"
              element={
                <ProtectedRoute>
                  <SupportPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/brane-coins"
              element={
                <ProtectedRoute>
                  <BraneCoinsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly>
                  <AdminPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/*"
              element={
                <ProtectedRoute adminOnly>
                  <AdminPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/promote"
              element={
                <ProtectedRoute>
                  <PromotionPlansPage />
                </ProtectedRoute>
              }
            />

            <Route path="/pages/:slug" element={<StaticPage />} />

            <Route path="*" element={<Navigate to="/market" replace />} />
          </Routes>
        </main>

        {!isAdmin && !isSocial && <Footer />}
        {!isAdmin && !isSocial && <FloatingSupport />}
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
