import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { formatErr } from "../api";
import { Lock, Mail, ShieldCheck, Loader2 } from "lucide-react";

export default function AdminLogin() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("admin@blivre.com");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const u = await login(email, pw);
      if (u.role !== "admin") {
        setErr("Acesso restrito ao administrador.");
        return;
      }
      nav("/admin/blivre", { replace: true });
    } catch (e) {
      setErr(formatErr(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-grid flex items-center justify-center p-6" data-testid="admin-login-page">
      <div className="w-full max-w-md fade-up">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-xl bg-[var(--accent)] flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <ShieldCheck size={22} className="text-white" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-mute)]">B-Livre</div>
            <div className="text-xl font-bold">Painel Administrativo</div>
          </div>
        </div>

        <form onSubmit={submit} className="card-premium p-7 space-y-5" data-testid="admin-login-form">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Bem-vindo de volta</h1>
            <p className="text-sm text-[var(--text-dim)] mt-1">Acesse o painel exclusivo da B-Livre.</p>
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest text-[var(--text-mute)] mb-2 block">E-mail</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-mute)]" />
              <input
                data-testid="admin-login-email"
                className="input-premium pl-10"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest text-[var(--text-mute)] mb-2 block">Senha</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-mute)]" />
              <input
                data-testid="admin-login-password"
                className="input-premium pl-10"
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                required
              />
            </div>
          </div>

          {err && (
            <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 px-3 py-2 rounded-lg" data-testid="admin-login-error">
              {err}
            </div>
          )}

          <button data-testid="admin-login-submit" disabled={busy} className="btn btn-primary w-full justify-center">
            {busy ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
            {busy ? "Entrando..." : "Acessar painel"}
          </button>

          <div className="text-[11px] text-[var(--text-mute)] text-center pt-1">
            Painel B-Livre · Classificados gratuitos · Não é Marketplace
          </div>
        </form>
      </div>
    </div>
  );
}
