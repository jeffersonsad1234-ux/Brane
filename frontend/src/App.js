import "./App.css";
import { BrowserRouter, Routes, Route, useLocation, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { lazy, Suspense } from "react";
import AuthCallback from "./components/AuthCallback";
import AnimatedBackground from "./components/AnimatedBackground";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import FloatingSupport from "./components/FloatingSupport";
import { BLivreAuthProvider } from "./contexts/BLivreAuthContext";
import BLivreSEO from "./components/BLivreSEO";
import { AdminDataProvider } from "./contexts/AdminDataContext";
import { Toaster } from "./components/ui/sonner";

const HomePage = lazy(() => import("./pages/HomePage"));
const SuppliersPage = lazy(() => import("./pages/SuppliersPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const ProductsPage = lazy(() => import("./pages/ProductsPage"));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const WalletPage = lazy(() => import("./pages/WalletPage"));
const OrdersPage = lazy(() => import("./pages/OrdersPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const StaticPage = lazy(() => import("./pages/StaticPage"));
const StoresPage = lazy(() => import("./pages/StoresPage"));
const StoreDetailPage = lazy(() => import("./pages/StoreDetailPage"));
const StoreChatPage = lazy(() => import("./pages/StoreChatPage"));
const DirectChatPage = lazy(() => import("./pages/DirectChatPage"));
const CreateStorePage = lazy(() => import("./pages/CreateStorePage"));
const SupportPage = lazy(() => import("./pages/SupportPage"));
const DesapegaPage = lazy(() => import("./pages/DesapegaPage"));
const BraneCoinsPage = lazy(() => import("./pages/BraneCoinsPage"));
const AddProductPage = lazy(() => import("./pages/AddProductPage"));
const SocialPage = lazy(() => import("./pages/SocialPage"));
const BLivreAdminPage = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminDenuncias = lazy(() => import("./pages/admin/AdminDenuncias"));
const AdminFinanceiro = lazy(() => import("./pages/admin/AdminFinanceiro"));
const AdminSuporte = lazy(() => import("./pages/admin/AdminSuporte"));
const AdminConfiguracoes = lazy(() => import("./pages/admin/AdminConfiguracoes"));
const AdminPasswordReset = lazy(() => import("./pages/admin/AdminPasswordReset"));
const BLivreAuthPage = lazy(() => import("./pages/BLivreAuthPage"));
const BLivreMessagesPage = lazy(() => import("./pages/BLivreMessagesPage"));
const AddStoreProductPage = lazy(() => import("./pages/AddStoreProductPage"));
const AddDesapegaProductPage = lazy(() => import("./pages/AddDesapegaProductPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const PromotionPlansPage = lazy(() => import("./pages/PromotionPlansPage"));

function BLivreLayout() {
  return (
    <BLivreAuthProvider>
      <BLivreSEO page="home" />
      <Outlet />
    </BLivreAuthProvider>
  );
}

function PageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050608]">
      <div className="w-9 h-9 border-2 border-[#8A2CFF] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

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
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="*" element={<Navigate to="/market" replace />} />
          </Routes>
        </Suspense>

        <Toaster position="top-right" />
      </>
    );
  }

  const isAdmin = path.startsWith("/admin");
  const isSocial = path.startsWith("/social") || path.startsWith("/blivre") || path.startsWith("/market/blivre");

  return (
    <>
      <AnimatedBackground />

      <div className="relative z-10">
        {!isAdmin && !isSocial && <Navbar />}

        <main className="min-h-screen">
          <Suspense fallback={<PageFallback />}>
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

            {/* Admin — completamente separado do BLivreLayout */}
            <Route path="/blivre/admin" element={<AdminDataProvider><BLivreAdminPage /></AdminDataProvider>}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="denuncias" element={<AdminDenuncias />} />
              <Route path="financeiro" element={<AdminFinanceiro />} />
              <Route path="suporte" element={<AdminSuporte />} />
              <Route path="password-reset" element={<AdminPasswordReset />} />
              <Route path="configuracoes" element={<AdminConfiguracoes />} />
            </Route>

            <Route element={<BLivreLayout />}>
              <Route path="/blivre/login" element={<BLivreAuthPage />} />
              <Route path="/blivre/register" element={<BLivreAuthPage />} />
              <Route path="/blivre/messages" element={<BLivreMessagesPage />} />
              <Route path="/blivre" element={<SocialPage />} />
              <Route path="/blivre/*" element={<SocialPage />} />
              <Route path="/social" element={<Navigate to="/blivre" replace />} />
              <Route path="/social/*" element={<Navigate to="/blivre" replace />} />
              <Route path="/market/blivre" element={<Navigate to="/blivre" replace />} />
            </Route>

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
          </Suspense>
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
