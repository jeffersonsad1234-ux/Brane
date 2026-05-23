import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { TopBar, Btn, ScrollArea } from "./BRANPYModules";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const SOURCES = [
  { label: "Organic", pct: 45, color: "#06b6d4" },
  { label: "Direct", pct: 25, color: "#3b82f6" },
  { label: "Social", pct: 18, color: "#8b5cf6" },
  { label: "Referral", pct: 8, color: "#f59e0b" },
  { label: "Email", pct: 4, color: "#10b981" },
];
const TOP_PAGES = [
  { page: "/products/headphones", views: 12450, avgTime: "4m 12s", bounce: "28%" },
  { page: "/blog/best-laptops", views: 8920, avgTime: "3m 45s", bounce: "34%" },
  { page: "/deals/today", views: 7650, avgTime: "2m 30s", bounce: "22%" },
  { page: "/category/gaming", views: 5430, avgTime: "5m 10s", bounce: "19%" },
  { page: "/reviews/smartphones", views: 4890, avgTime: "6m 02s", bounce: "31%" },
  { page: "/affiliate/tools", views: 3210, avgTime: "3m 20s", bounce: "26%" },
];

function KpiCard({ label, value, change, up, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 hover:bg-white/[0.04] hover:border-cyan-500/20 transition-all"
    >
      <div className="text-[10px] text-white/30 uppercase tracking-wider">{label}</div>
      <div className="text-xl font-semibold text-white/90 mt-1 tracking-tight">{value}</div>
      <div className={`flex items-center gap-1 mt-1 text-xs ${up ? "text-emerald-400" : "text-red-400"}`}>
        <span className={`inline-block text-sm ${up ? "text-emerald-400" : "text-red-400"}`}>
          {up ? "\u2191" : "\u2193"}
        </span>
        <span>{change}</span>
        <span className="text-white/20 text-[10px] ml-1">vs last period</span>
      </div>
    </motion.div>
  );
}

function AnimatedCounter({ target, duration = 2000 }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const iv = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(iv); }
      else setCount(start);
    }, 16);
    return () => clearInterval(iv);
  }, [target, duration]);
  return <span>{count.toLocaleString()}</span>;
}

export default function EnhancedAnalytics() {
  const [period, setPeriod] = useLocalStorage("branpy_enhanced_analytics_period", "7d");
  const [realtime, setRealtime] = useState(128430);
  const periods = ["7d", "30d", "90d"];

  useEffect(() => {
    const iv = setInterval(() => {
      setRealtime((p) => p + Math.floor(Math.random() * 5) + 1);
    }, 3000);
    return () => clearInterval(iv);
  }, []);

  const data = useMemo(() => {
    const multipliers = { "7d": 0.25, "30d": 1, "90d": 3.5 };
    const m = multipliers[period] || 1;
    return {
      visitors: Math.round(128430 * m),
      pageViews: Math.round(384210 * m),
      bounceRate: (32.1 - (m > 1 ? 1.5 : 0.3)).toFixed(1),
      avgSession: `${Math.floor(4 + m * 0.3)}m ${Math.floor(32 + m * 5)}s`,
      visitorsChange: `+${(12.5 * m * 0.4).toFixed(1)}%`,
      pageViewsChange: `+${(8.3 * m * 0.5).toFixed(1)}%`,
      bounceChange: `-${(2.1 * m * 0.3).toFixed(1)}%`,
      avgSessionChange: `+${(5.7 * m * 0.4).toFixed(1)}%`,
      monthlyVisitors: [85, 92, 78, 105, 98, 112, 120, 135, 128, 142, 150, 165].map(
        (v) => Math.round(v * (0.7 + m * 0.15))
      ),
      monthlyPageViews: [120, 135, 110, 148, 140, 158, 170, 190, 180, 200, 215, 240].map(
        (v) => Math.round(v * (0.7 + m * 0.15))
      ),
    };
  }, [period]);

  const maxBar = Math.max(...data.monthlyVisitors);
  const maxLine = Math.max(...data.monthlyPageViews);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <TopBar title="Analytics">
        {periods.map((p) => (
          <Btn key={p} active={period === p} onClick={() => setPeriod(p)}>
            {p}
          </Btn>
        ))}
        <div className="w-px h-4 bg-white/10 mx-1" />
        <Btn primary>Export Report</Btn>
      </TopBar>

      <ScrollArea className="p-6">
        <div className="max-w-6xl mx-auto space-y-5">
          {/* Realtime counter */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl bg-gradient-to-r from-cyan-500/[0.07] to-blue-500/[0.07] border border-cyan-500/20 p-4 flex items-center justify-between"
          >
            <div>
              <div className="text-[10px] text-white/30 uppercase tracking-wider">Live Visitors</div>
              <motion.div
                key={realtime}
                initial={{ scale: 1.1, opacity: 0.6 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-2xl font-bold text-cyan-400 mt-1 tabular-nums"
              >
                <AnimatedCounter target={realtime} />
              </motion.div>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-[10px] text-emerald-400">Live</span>
            </div>
          </motion.div>

          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-3">
            <KpiCard label="Total Visitors" value={data.visitors.toLocaleString()} change={data.visitorsChange} up index={0} />
            <KpiCard label="Page Views" value={data.pageViews.toLocaleString()} change={data.pageViewsChange} up index={1} />
            <KpiCard label="Bounce Rate" value={`${data.bounceRate}%`} change={data.bounceChange} up={false} index={2} />
            <KpiCard label="Avg Session" value={data.avgSession} change={data.avgSessionChange} up index={3} />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 gap-4">
            {/* Bar chart + line overlay */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs font-medium text-white/50">Monthly Visitors</div>
                  <div className="text-[10px] text-white/20 mt-0.5">12-month overview</div>
                </div>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="flex items-center gap-1.5 text-white/40">
                    <span className="w-2.5 h-0.5 rounded bg-cyan-400" /> Visitors
                  </span>
                  <span className="flex items-center gap-1.5 text-white/40">
                    <span className="w-2.5 h-0.5 rounded bg-blue-400" /> Page Views
                  </span>
                </div>
              </div>
              <div className="relative h-48">
                {/* Y axis lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="border-t border-white/[0.04] w-full" />
                  ))}
                </div>
                {/* Bars + line dots */}
                <div className="absolute inset-0 flex items-end gap-1.5 px-2">
                  {data.monthlyVisitors.map((v, i) => {
                    const barH = (v / maxBar) * 100;
                    const lineY = ((maxLine - data.monthlyPageViews[i]) / maxLine) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center justify-end h-full relative group">
                        {/* Hover tooltip */}
                        <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 bg-black/80 text-white text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap">
                          {v.toLocaleString()} visitors
                        </div>
                        {/* Bar */}
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${barH}%` }}
                          transition={{ delay: i * 0.04, duration: 0.5, ease: "easeOut" }}
                          className="w-full rounded-t cursor-pointer"
                          style={{
                            background: `linear-gradient(180deg, #06b6d4, #1d4ed8)`,
                            opacity: 0.7,
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.7"; }}
                        />
                        {/* Line dot overlay */}
                        <div
                          className="absolute w-1.5 h-1.5 rounded-full bg-blue-400 border border-blue-300 z-10"
                          style={{ bottom: `${lineY}%` }}
                        />
                        {/* Month label */}
                        <span className="text-[8px] text-white/20 mt-1.5">{MONTHS[i]}</span>
                      </div>
                    );
                  })}
                </div>
                {/* Line connecting dots */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ paddingBottom: 18 }}>
                  <polyline
                    fill="none"
                    stroke="rgba(96,165,250,0.4)"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    points={data.monthlyPageViews
                      .map((v, i) => {
                        const x = ((i + 0.5) / data.monthlyPageViews.length) * 100;
                        const y = ((maxLine - v) / maxLine) * 100;
                        return `${x}% ${y}%`;
                      })
                      .join(" ")}
                  />
                </svg>
              </div>
            </motion.div>
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Traffic Sources */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-5"
            >
              <div className="text-xs font-medium text-white/50 mb-4">Traffic Sources</div>
              <div className="space-y-3">
                {SOURCES.map((s) => (
                  <div key={s.label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-white/60">{s.label}</span>
                      <span className="text-white/40">{s.pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${s.pct}%` }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: s.color, boxShadow: `0 0 6px ${s.color}40` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Top Pages */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-5"
            >
              <div className="text-xs font-medium text-white/50 mb-4">Top Pages</div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[10px] text-white/20 uppercase tracking-wider border-b border-white/[0.06]">
                      <th className="text-left pb-2 font-medium">Page</th>
                      <th className="text-right pb-2 font-medium">Views</th>
                      <th className="text-right pb-2 font-medium">Avg Time</th>
                      <th className="text-right pb-2 font-medium">Bounce</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TOP_PAGES.map((p, i) => (
                      <motion.tr
                        key={p.page}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.05 }}
                        className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-2.5 text-white/70">
                          <span className="text-cyan-400/50 mr-1.5">/</span>
                          {p.page.split("/").slice(2).join("/") || p.page.slice(1)}
                        </td>
                        <td className="py-2.5 text-right text-white/60">{p.views.toLocaleString()}</td>
                        <td className="py-2.5 text-right text-white/40">{p.avgTime}</td>
                        <td className="py-2.5 text-right text-white/40">{p.bounce}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
