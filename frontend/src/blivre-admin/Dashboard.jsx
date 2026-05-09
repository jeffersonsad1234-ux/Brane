import { useEffect, useState } from "react";
import { blApi, blFmtErr, API } from "./api";
import {
  Users, Megaphone, MessagesSquare, ShieldAlert, LifeBuoy, Eye, Heart,
  Activity, FileDown, RefreshCw, TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";

const fmt = (n) => new Intl.NumberFormat("pt-BR").format(n ?? 0);

function Kpi({ icon: Icon, label, value, sub, color = "emerald", testid }) {
  const cmap = {
    emerald: { c: "#6ee7b7", bg: "rgba(16,185,129,0.10)", bd: "rgba(16,185,129,0.25)" },
    sky: { c: "#7dd3fc", bg: "rgba(56,189,248,0.10)", bd: "rgba(56,189,248,0.25)" },
    amber: { c: "#fcd34d", bg: "rgba(245,158,11,0.10)", bd: "rgba(245,158,11,0.25)" },
    rose: { c: "#fda4af", bg: "rgba(244,63,94,0.10)", bd: "rgba(244,63,94,0.25)" },
    violet: { c: "#c4b5fd", bg: "rgba(167,139,250,0.10)", bd: "rgba(167,139,250,0.25)" },
    pink: { c: "#f9a8d4", bg: "rgba(244,114,182,0.10)", bd: "rgba(244,114,182,0.25)" },
    teal: { c: "#5eead4", bg: "rgba(20,184,166,0.10)", bd: "rgba(20,184,166,0.25)" },
  };
  const s = cmap[color] || cmap.emerald;
  return (
    <div
      data-testid={testid}
      className="card-premium kpi-card fade-up"
      style={{ padding: 20 }}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: s.c, background: s.bg, border: `1px solid ${s.bd}` }}>
          <Icon size={18} />
        </div>
        {sub && <div style={{ fontSize: 12, color: "var(--bl-text-mute)" }}>{sub}</div>}
      </div>
      <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{fmt(value)}</div>
      <div style={{ fontSize: 14, color: "var(--bl-text-dim)", marginTop: 4 }}>{label}</div>
    </div>
  );
}

function ChartCard({ title, subtitle, children, action }) {
  return (
    <div className="card-premium fade-up" style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: "var(--bl-text-mute)", marginTop: 2 }}>{subtitle}</div>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function timeAgo(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (Number.isNaN(s)) return "—";
  if (s < 60) return `${Math.max(1, s)}s atrás`;
  if (s < 3600) return `${Math.floor(s / 60)}m atrás`;
  if (s < 86400) return `${Math.floor(s / 3600)}h atrás`;
  return `${Math.floor(s / 86400)}d atrás`;
}

function RecentRow({ left, right, hint }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--bl-line)" }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{left}</div>
        {hint && <div style={{ fontSize: 12, color: "var(--bl-text-mute)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>{hint}</div>}
      </div>
      <div style={{ fontSize: 12, color: "var(--bl-text-dim)", marginLeft: 12, flexShrink: 0 }}>{right}</div>
    </div>
  );
}

const PIE_COLORS = ["#10b981", "#34d399", "#0ea5e9", "#a78bfa", "#f59e0b", "#f472b6"];

export default function BLivreDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [exporting, setExporting] = useState(false);

  const load = async () => {
    setErr("");
    try {
      const { data } = await blApi.get("/admin/dashboard");
      setStats(data);
    } catch (e) {
      setErr(blFmtErr(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const t = localStorage.getItem("brane_token");
      const res = await fetch(`${API}/admin/blivre/export/pdf`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok) throw new Error("Falha ao gerar PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-blivre-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Erro ao exportar PDF: " + e.message);
    } finally {
      setExporting(false);
    }
  };

  if (loading && !stats) {
    return (
      <div data-testid="bl-dash-loading" style={{ display: "flex", justifyContent: "center", padding: 80 }}>
        <RefreshCw className="animate-spin" color="var(--bl-text-mute)" />
      </div>
    );
  }

  return (
    <div data-testid="bl-dashboard" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.22em", color: "var(--bl-text-mute)" }}>Visão geral · B-Livre</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginTop: 4, margin: "4px 0 4px" }}>Dashboard</h1>
          <p style={{ fontSize: 14, color: "var(--bl-text-dim)", margin: 0 }}>
            Métricas reais de classificados, mensagens, denúncias e suporte. <span style={{ color: "var(--bl-text-mute)" }}>Marketplace está em painel separado.</span>
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost" onClick={load} data-testid="bl-refresh-stats">
            <RefreshCw size={14} /> Atualizar
          </button>
          <button className="btn btn-primary" onClick={handleExport} disabled={exporting} data-testid="bl-export-pdf-btn">
            <FileDown size={14} /> {exporting ? "Gerando..." : "Exportar relatório (PDF)"}
          </button>
        </div>
      </div>

      {err && <div className="card-premium" style={{ padding: 14, fontSize: 13, color: "#fca5a5" }}>{err}</div>}

      {/* KPIs row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <Kpi icon={Users} label="Usuários B-Livre" value={stats?.total_users} sub="cadastrados" color="emerald" testid="bl-kpi-users" />
        <Kpi icon={Activity} label="Usuários online (5min)" value={stats?.users_online} sub="ativos agora" color="teal" testid="bl-kpi-online" />
        <Kpi icon={Megaphone} label="Anúncios ativos" value={stats?.active_ads} sub={`${fmt(stats?.total_social_posts)} no total`} color="sky" testid="bl-kpi-ads" />
        <Kpi icon={MessagesSquare} label="Mensagens hoje" value={stats?.messages_today} sub="conversas" color="violet" testid="bl-kpi-messages-today" />
      </div>

      {/* KPIs row 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <Kpi icon={ShieldAlert} label="Denúncias pendentes" value={stats?.pending_reports} sub="a moderar" color="rose" testid="bl-kpi-reports" />
        <Kpi icon={LifeBuoy} label="Chamados de suporte" value={stats?.open_support} sub="em aberto" color="amber" testid="bl-kpi-support" />
        <Kpi icon={Eye} label="Visualizações" value={stats?.total_views_blivre} sub="acumulado" color="sky" testid="bl-kpi-views" />
        <Kpi icon={Heart} label="Interesses" value={stats?.total_interests_blivre} sub="acumulado" color="pink" testid="bl-kpi-interests" />
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <ChartCard
          title="Atividade nos últimos 7 dias"
          subtitle="Usuários novos · anúncios · mensagens"
          action={<span className="badge badge-green"><TrendingUp size={11} /> ao vivo</span>}
        >
          <div style={{ height: 280 }} data-testid="bl-chart-activity">
            <ResponsiveContainer width="100%" height="100%" minHeight={280}>
              <AreaChart data={stats?.series_7d_blivre || []}>
                <defs>
                  <linearGradient id="bgUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="bgListings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="bgMessages" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1f2733" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="#5b6473" fontSize={11} />
                <YAxis stroke="#5b6473" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#0b0f15", border: "1px solid #1f2733", borderRadius: 10, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area name="Usuários" type="monotone" dataKey="users" stroke="#10b981" fill="url(#bgUsers)" strokeWidth={2} />
                <Area name="Anúncios" type="monotone" dataKey="listings" stroke="#0ea5e9" fill="url(#bgListings)" strokeWidth={2} />
                <Area name="Mensagens" type="monotone" dataKey="messages" stroke="#a78bfa" fill="url(#bgMessages)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Categorias de anúncios" subtitle="Distribuição dos ativos">
          <div style={{ height: 280 }} data-testid="bl-chart-categories">
            {(stats?.blivre_categories || []).length ? (
              <ResponsiveContainer width="100%" height="100%" minHeight={280}>
                <PieChart>
                  <Pie data={stats.blivre_categories} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                    {stats.blivre_categories.map((_, i) => (
                      <Cell key={`bc-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="#0b0f15" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#0b0f15", border: "1px solid #1f2733", borderRadius: 10, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "var(--bl-text-mute)" }}>
                Sem dados de categorias ainda.
              </div>
            )}
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Mensagens por dia" subtitle="Volume de conversas entre usuários">
        <div style={{ height: 200 }} data-testid="bl-chart-messages">
          <ResponsiveContainer width="100%" height="100%" minHeight={200}>
            <BarChart data={stats?.series_7d_blivre || []}>
              <CartesianGrid stroke="#1f2733" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="#5b6473" fontSize={11} />
              <YAxis stroke="#5b6473" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#0b0f15", border: "1px solid #1f2733", borderRadius: 10, fontSize: 12 }} />
              <Bar dataKey="messages" fill="#a78bfa" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Recent panels */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: 16 }}>
        <ChartCard title="Anúncios recentes" subtitle="Últimos publicados na B-Livre">
          <div data-testid="bl-recent-ads">
            {(stats?.recent_social_posts || []).length === 0 && (
              <div style={{ padding: 24, textAlign: "center", color: "var(--bl-text-mute)", fontSize: 13 }}>Nenhum anúncio ainda.</div>
            )}
            {(stats?.recent_social_posts || []).map((a) => (
              <RecentRow
                key={a.post_id || a.id}
                left={a.title || a.content?.slice(0, 50) || "Sem título"}
                hint={`${a.user_name || "—"} · ${a.city || ""}`}
                right={timeAgo(a.created_at)}
              />
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Mensagens recentes" subtitle="Conversas reais entre usuários">
          <div data-testid="bl-recent-messages">
            {(stats?.recent_messages_blivre || []).length === 0 && (
              <div style={{ padding: 24, textAlign: "center", color: "var(--bl-text-mute)", fontSize: 13 }}>Nenhuma mensagem ainda.</div>
            )}
            {(stats?.recent_messages_blivre || []).map((m) => (
              <RecentRow
                key={m.id}
                left={`${m.from_name || "—"} → ${m.to_name || "—"}`}
                hint={`"${(m.content || "").slice(0, 80)}"`}
                right={timeAgo(m.created_at)}
              />
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Denúncias recentes" subtitle="Reports a moderar">
          <div data-testid="bl-recent-reports">
            {(stats?.recent_reports_blivre || []).length === 0 && (
              <div style={{ padding: 24, textAlign: "center", color: "var(--bl-text-mute)", fontSize: 13 }}>Sem denúncias.</div>
            )}
            {(stats?.recent_reports_blivre || []).map((r) => (
              <RecentRow
                key={r.report_id || r.id}
                left={r.reason || "—"}
                hint={`${r.target_type || "—"} · por ${r.reporter_name || "—"} · ${r.status || ""}`}
                right={timeAgo(r.created_at)}
              />
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Suporte recente" subtitle="Chamados abertos pelos usuários">
          <div data-testid="bl-recent-support">
            {(stats?.recent_support_blivre || []).length === 0 && (
              <div style={{ padding: 24, textAlign: "center", color: "var(--bl-text-mute)", fontSize: 13 }}>Sem chamados.</div>
            )}
            {(stats?.recent_support_blivre || []).map((s) => (
              <RecentRow
                key={s.message_id || s.id}
                left={s.subject || "—"}
                hint={`${s.user_name || s.user_email || "—"} · ${s.status || ""}`}
                right={timeAgo(s.created_at)}
              />
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
