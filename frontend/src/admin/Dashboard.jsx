import { useEffect, useState } from "react";
import { api, formatErr, API, getToken } from "../api";
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
  const colors = {
    emerald: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
    sky: "text-sky-300 bg-sky-500/10 border-sky-500/20",
    amber: "text-amber-300 bg-amber-500/10 border-amber-500/20",
    rose: "text-rose-300 bg-rose-500/10 border-rose-500/20",
    violet: "text-violet-300 bg-violet-500/10 border-violet-500/20",
    pink: "text-pink-300 bg-pink-500/10 border-pink-500/20",
    blue: "text-blue-300 bg-blue-500/10 border-blue-500/20",
    teal: "text-teal-300 bg-teal-500/10 border-teal-500/20",
  };
  return (
    <div
      data-testid={testid}
      className="card-premium kpi-card p-5 fade-up"
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colors[color]}`}>
          <Icon size={18} />
        </div>
        {sub && <div className="text-xs text-[var(--text-mute)]">{sub}</div>}
      </div>
      <div className="text-3xl font-bold tracking-tight tabular-nums">{fmt(value)}</div>
      <div className="text-sm text-[var(--text-dim)] mt-1">{label}</div>
    </div>
  );
}

const PIE_COLORS = ["#10b981", "#34d399", "#0ea5e9", "#a78bfa", "#f59e0b", "#f472b6"];

function ChartCard({ title, subtitle, children, action }) {
  return (
    <div className="card-premium p-5 fade-up">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          {subtitle && <div className="text-xs text-[var(--text-mute)] mt-0.5">{subtitle}</div>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function RecentRow({ left, right, hint }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[var(--line)] last:border-none">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate">{left}</div>
        {hint && <div className="text-xs text-[var(--text-mute)] truncate mt-0.5">{hint}</div>}
      </div>
      <div className="text-xs text-[var(--text-dim)] ml-3 shrink-0">{right}</div>
    </div>
  );
}

function timeAgo(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return `${s}s atrás`;
  if (s < 3600) return `${Math.floor(s / 60)}m atrás`;
  if (s < 86400) return `${Math.floor(s / 3600)}h atrás`;
  return `${Math.floor(s / 86400)}d atrás`;
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState({ listings: [], messages: [], reports: [], support: [] });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [exporting, setExporting] = useState(false);

  const load = async () => {
    setErr("");
    try {
      const [s, l, m, r, sp] = await Promise.all([
        api.get("/admin/blivre/stats"),
        api.get("/admin/blivre/listings?limit=5"),
        api.get("/admin/blivre/messages?limit=5"),
        api.get("/admin/blivre/reports?limit=5"),
        api.get("/admin/blivre/support?limit=5"),
      ]);
      setStats(s.data);
      setRecent({ listings: l.data, messages: m.data, reports: r.data, support: sp.data });
    } catch (e) {
      setErr(formatErr(e));
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
      const res = await fetch(`${API}/admin/blivre/export/pdf`, {
        headers: { Authorization: `Bearer ${getToken()}` },
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
      <div className="flex items-center justify-center py-20" data-testid="dashboard-loading">
        <RefreshCw className="animate-spin text-[var(--text-mute)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="admin-dashboard">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-mute)]">Visão geral · B-Livre</div>
          <h1 className="text-2xl font-bold mt-1">Dashboard</h1>
          <p className="text-sm text-[var(--text-dim)] mt-1">
            Métricas reais de classificados, mensagens, denúncias e suporte. <span className="text-[var(--text-mute)]">Marketplace está em painel separado.</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost" onClick={load} data-testid="refresh-stats">
            <RefreshCw size={14} /> Atualizar
          </button>
          <button className="btn btn-primary" onClick={handleExport} disabled={exporting} data-testid="export-pdf-btn">
            <FileDown size={14} /> {exporting ? "Gerando..." : "Exportar relatório (PDF)"}
          </button>
        </div>
      </div>

      {err && (
        <div className="card-premium p-4 text-sm text-red-300 border-red-500/30">{err}</div>
      )}

      {/* KPIs row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi icon={Users} label="Usuários B-Livre" value={stats?.users.total} sub={`${fmt(stats?.users.active)} ativos`} color="emerald" testid="kpi-users" />
        <Kpi icon={Activity} label="Usuários online (5min)" value={stats?.users.online} sub="ativos agora" color="teal" testid="kpi-online" />
        <Kpi icon={Megaphone} label="Anúncios ativos" value={stats?.listings.active} sub={`${fmt(stats?.listings.total)} no total`} color="sky" testid="kpi-listings" />
        <Kpi icon={MessagesSquare} label="Mensagens hoje" value={stats?.messages.today} sub={`${fmt(stats?.messages.total)} no total`} color="violet" testid="kpi-messages-today" />
      </div>

      {/* KPIs row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi icon={ShieldAlert} label="Denúncias pendentes" value={stats?.reports.pending} sub={`${fmt(stats?.reports.total)} no total`} color="rose" testid="kpi-reports" />
        <Kpi icon={LifeBuoy} label="Chamados de suporte" value={stats?.support.open} sub={`${fmt(stats?.support.total)} no total`} color="amber" testid="kpi-support" />
        <Kpi icon={Eye} label="Visualizações de anúncios" value={stats?.views.total} sub="acumulado" color="blue" testid="kpi-views" />
        <Kpi icon={Heart} label="Interesses em anúncios" value={stats?.interests.total} sub="acumulado" color="pink" testid="kpi-interests" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ChartCard
            title="Atividade nos últimos 7 dias"
            subtitle="Usuários novos · anúncios · mensagens · visualizações"
            action={<span className="badge badge-green"><TrendingUp size={11} /> ao vivo</span>}
          >
            <div className="h-[300px]" data-testid="chart-activity">
              <ResponsiveContainer>
                <AreaChart data={stats?.series_7d || []}>
                  <defs>
                    <linearGradient id="gUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gListings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gMessages" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#1f2733" strokeDasharray="3 3" />
                  <XAxis dataKey="date" stroke="#5b6473" fontSize={11} />
                  <YAxis stroke="#5b6473" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: "#0b0f15", border: "1px solid #1f2733", borderRadius: 10, fontSize: 12 }}
                    labelStyle={{ color: "#e6ebf2" }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area name="Usuários" type="monotone" dataKey="users" stroke="#10b981" fill="url(#gUsers)" strokeWidth={2} />
                  <Area name="Anúncios" type="monotone" dataKey="listings" stroke="#0ea5e9" fill="url(#gListings)" strokeWidth={2} />
                  <Area name="Mensagens" type="monotone" dataKey="messages" stroke="#a78bfa" fill="url(#gMessages)" strokeWidth={2} />
                  <Area name="Views" type="monotone" dataKey="views" stroke="#f59e0b" fill="url(#gViews)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        <ChartCard title="Categorias de anúncios" subtitle="Distribuição dos ativos">
          <div className="h-[300px]" data-testid="chart-categories">
            {stats?.categories?.length ? (
              <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                <PieChart>
                  <Pie
                    data={stats.categories}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                  >
                    {stats.categories.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="#0b0f15" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#0b0f15", border: "1px solid #1f2733", borderRadius: 10, fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-[var(--text-mute)]">
                Sem dados de categorias ainda.
              </div>
            )}
          </div>
        </ChartCard>
      </div>

      {/* Bar chart - messages per day */}
      <ChartCard title="Mensagens por dia" subtitle="Volume de conversas entre usuários">
        <div className="h-[220px]" data-testid="chart-messages">
          <ResponsiveContainer width="100%" height="100%" minHeight={220}>
            <BarChart data={stats?.series_7d || []}>
              <CartesianGrid stroke="#1f2733" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="#5b6473" fontSize={11} />
              <YAxis stroke="#5b6473" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#0b0f15", border: "1px solid #1f2733", borderRadius: 10, fontSize: 12 }}
              />
              <Bar dataKey="messages" fill="#a78bfa" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Recent panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Anúncios recentes" subtitle="Últimos publicados na B-Livre">
          <div data-testid="recent-listings">
            {recent.listings.length === 0 && (
              <div className="text-sm text-[var(--text-mute)] py-6 text-center">Nenhum anúncio ainda.</div>
            )}
            {recent.listings.map((l) => (
              <RecentRow
                key={l.id}
                left={l.title}
                hint={`${l.category || "geral"} · por ${l.owner_name || "—"}`}
                right={timeAgo(l.created_at)}
              />
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Mensagens recentes" subtitle="Conversas entre anunciantes e interessados">
          <div data-testid="recent-messages">
            {recent.messages.length === 0 && (
              <div className="text-sm text-[var(--text-mute)] py-6 text-center">Nenhuma mensagem ainda.</div>
            )}
            {recent.messages.map((m) => (
              <RecentRow
                key={m.id}
                left={`${m.from_user_name} → ${m.to_user_name}`}
                hint={`"${m.content?.slice(0, 80)}" · ${m.listing_title || ""}`}
                right={timeAgo(m.created_at)}
              />
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Denúncias recentes" subtitle="Reports a moderar">
          <div data-testid="recent-reports">
            {recent.reports.length === 0 && (
              <div className="text-sm text-[var(--text-mute)] py-6 text-center">Sem denúncias.</div>
            )}
            {recent.reports.map((r) => (
              <RecentRow
                key={r.id}
                left={r.reason}
                hint={`${r.target_type} · por ${r.reporter_name} · ${r.status}`}
                right={timeAgo(r.created_at)}
              />
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Suporte recente" subtitle="Chamados abertos pelos usuários">
          <div data-testid="recent-support">
            {recent.support.length === 0 && (
              <div className="text-sm text-[var(--text-mute)] py-6 text-center">Sem chamados.</div>
            )}
            {recent.support.map((s) => (
              <RecentRow
                key={s.id}
                left={s.subject}
                hint={`${s.user_name} · ${s.status}`}
                right={timeAgo(s.created_at)}
              />
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
