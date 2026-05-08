import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth";
import AdminLogin from "./admin/Login";
import AdminLayout from "./admin/AdminLayout";
import Dashboard from "./admin/Dashboard";
import UsersPage from "./admin/Users";
import ListingsPage from "./admin/Listings";
import MessagesPage from "./admin/Messages";
import ReportsPage from "./admin/Reports";
import SupportPage from "./admin/Support";
import { ShieldCheck, ArrowRight } from "lucide-react";

function ProtectedAdmin({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[var(--text-mute)] text-sm">Carregando...</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/admin/blivre/login" replace />;
  if (user.role !== "admin") return <Navigate to="/admin/blivre/login" replace />;
  return children;
}

function Landing() {
  return (
    <div className="min-h-screen bg-grid flex items-center justify-center p-6" data-testid="landing-page">
      <div className="card-premium p-10 max-w-xl w-full text-center fade-up">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[var(--accent)] flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-5">
          <ShieldCheck size={26} className="text-white" />
        </div>
        <div className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-mute)]">B-Livre</div>
        <h1 className="text-3xl font-bold mt-1">Painel Administrativo</h1>
        <p className="text-sm text-[var(--text-dim)] mt-3 leading-relaxed">
          Gestão de classificados gratuitos · usuários · anúncios · mensagens · denúncias · suporte.
          <br />
          <span className="text-[var(--text-mute)]">Marketplace é tratado em painel separado.</span>
        </p>
        <Link to="/admin/blivre" className="btn btn-primary mt-6 inline-flex" data-testid="enter-admin">
          Entrar no painel <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/admin/blivre/login" element={<AdminLogin />} />
          <Route
            path="/admin/blivre"
            element={
              <ProtectedAdmin>
                <AdminLayout />
              </ProtectedAdmin>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="usuarios" element={<UsersPage />} />
            <Route path="anuncios" element={<ListingsPage />} />
            <Route path="mensagens" element={<MessagesPage />} />
            <Route path="denuncias" element={<ReportsPage />} />
            <Route path="suporte" element={<SupportPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
