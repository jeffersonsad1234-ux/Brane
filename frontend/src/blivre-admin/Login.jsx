import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { blApi, blFmtErr } from "./api";
import { Lock, Mail, ShieldCheck, Loader2 } from "lucide-react";
import "./blivre-admin.css";

export default function BLivreLogin() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const { data } = await blApi.post("/auth/login", { email, password: pw });
      const role = data?.user?.role;
      if (role !== "admin") {
        setErr("Acesso restrito ao administrador.");
        setBusy(false);
        return;
      }
      localStorage.setItem("brane_token", data.token);
      try { localStorage.setItem("brane_user", JSON.stringify(data.user)); } catch {}
      nav("/admin/blivre", { replace: true });
    } catch (e2) {
      setErr(blFmtErr(e2));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bl-admin" data-testid="bl-login-page">
      <div className="bg-grid" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ width: "100%", maxWidth: 440 }} className="fade-up">
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--bl-accent)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px -8px rgba(16,185,129,.5)" }}>
              <ShieldCheck size={22} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--bl-text-mute)" }}>B-Livre</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>Painel Administrativo</div>
            </div>
          </div>

          <form onSubmit={submit} className="card-premium" data-testid="bl-login-form" style={{ padding: 28 }}>
            <div style={{ marginBottom: 20 }}>
              <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", margin: 0 }}>Bem-vindo de volta</h1>
              <p style={{ fontSize: 14, color: "var(--bl-text-dim)", marginTop: 4, margin: "4px 0 0" }}>Acesse o painel exclusivo da B-Livre.</p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--bl-text-mute)", marginBottom: 6, display: "block" }}>E-mail</label>
              <div style={{ position: "relative" }}>
                <Mail size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--bl-text-mute)" }} />
                <input
                  data-testid="bl-login-email"
                  className="input-premium"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ paddingLeft: 40 }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--bl-text-mute)", marginBottom: 6, display: "block" }}>Senha</label>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--bl-text-mute)" }} />
                <input
                  data-testid="bl-login-password"
                  className="input-premium"
                  type="password"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  required
                  style={{ paddingLeft: 40 }}
                />
              </div>
            </div>

            {err && (
              <div data-testid="bl-login-error" style={{ fontSize: 13, color: "#fca5a5", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", padding: "8px 12px", borderRadius: 8, marginBottom: 14 }}>
                {err}
              </div>
            )}

            <button data-testid="bl-login-submit" disabled={busy} className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
              {busy ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
              {busy ? "Entrando..." : "Acessar painel"}
            </button>

            <div style={{ fontSize: 11, color: "var(--bl-text-mute)", textAlign: "center", paddingTop: 12 }}>
              Painel B-Livre · Classificados gratuitos · Não é Marketplace
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
