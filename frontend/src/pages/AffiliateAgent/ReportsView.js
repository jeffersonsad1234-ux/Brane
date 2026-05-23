import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "../../hooks/useLocalStorage";

const REPORT_TYPES = ["PDF", "CSV", "HTML"];

const MOCK_REPORTS = [
  { id: 1, name: "Q1 Revenue Summary", type: "PDF", created: "2026-05-20", status: "Ready" },
  { id: 2, name: "Lead Conversion Funnel", type: "PDF", created: "2026-05-19", status: "Ready" },
  { id: 3, name: "Campaign Performance", type: "CSV", created: "2026-05-18", status: "Ready" },
  { id: 4, name: "Monthly Sales Report", type: "PDF", created: "2026-05-17", status: "Processing" },
  { id: 5, name: "Social Media Analytics", type: "HTML", created: "2026-05-16", status: "Ready" },
  { id: 6, name: "Cost Breakdown by Dept", type: "CSV", created: "2026-05-15", status: "Failed" },
  { id: 7, name: "Agent Activity Log", type: "PDF", created: "2026-05-14", status: "Ready" },
  { id: 8, name: "Weekly KPI Dashboard", type: "HTML", created: "2026-05-13", status: "Ready" },
];

const CHART_DATA = [
  { day: "Mon", PDF: 3, CSV: 5, HTML: 2 },
  { day: "Tue", PDF: 4, CSV: 3, HTML: 3 },
  { day: "Wed", PDF: 6, CSV: 4, HTML: 1 },
  { day: "Thu", PDF: 2, CSV: 6, HTML: 4 },
  { day: "Fri", PDF: 5, CSV: 3, HTML: 3 },
  { day: "Sat", PDF: 3, CSV: 2, HTML: 5 },
  { day: "Sun", PDF: 4, CSV: 4, HTML: 2 },
];

const TYPE_COLORS = { PDF: "bg-cyan-500/20 text-cyan-400", CSV: "bg-emerald-500/20 text-emerald-400", HTML: "bg-purple-500/20 text-purple-400" };
const STATUS_STYLES = { Ready: "bg-emerald-500/15 text-emerald-400", Processing: "bg-amber-500/15 text-amber-400", Failed: "bg-red-500/15 text-red-400" };

const cx = "rounded-xl border border-white/[0.06] bg-white/[0.02] p-4";
const lx = "text-[11px] text-white/30 uppercase tracking-wider mb-1";

export default function ReportsView() {
  const [reports, setReports] = useLocalStorage("brane_reports", MOCK_REPORTS);
  const [period, setPeriod] = useState("7D");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", type: "PDF", dateRange: "last-7", format: "PDF" });

  const kpis = useMemo(() => ({
    generated: reports.length,
    avgProcessing: "2.3s",
    activeTemplates: 12,
    errorRate: "0.8%",
  }), [reports]);

  const handleGenerate = () => {
    if (!form.name.trim()) return;
    setReports((prev) => [{ id: Date.now(), name: form.name, type: form.type, created: new Date().toISOString().slice(0, 10), status: "Ready" }, ...prev]);
    setForm({ name: "", type: "PDF", dateRange: "last-7", format: "PDF" });
    setShowModal(false);
  };

  const maxVal = Math.max(...CHART_DATA.flatMap((d) => [d.PDF, d.CSV, d.HTML]), 1);

  return (
    <div className="flex-1 min-h-0 bg-[#0a0a0a] p-4 md:p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white/90 tracking-tight">Reports</h1>
          <button onClick={() => setShowModal(true)}
            className="px-4 py-1.5 text-[11px] font-medium rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/20 transition"
          >+ Generate Report</button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Reports Generated", value: kpis.generated, color: "text-white/80" },
            { label: "Avg Processing", value: kpis.avgProcessing, color: "text-cyan-400" },
            { label: "Active Templates", value: kpis.activeTemplates, color: "text-emerald-400" },
            { label: "Error Rate", value: kpis.errorRate, color: "text-amber-400" },
          ].map((card) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cx}>
              <div className={lx}>{card.label}</div>
              <div className={`text-2xl font-semibold ${card.color}`}>{card.value}</div>
            </motion.div>
          ))}
        </div>

        <div className="flex gap-1 bg-white/[0.03] border border-white/[0.06] rounded-lg p-1 w-fit">
          {["7D", "30D", "90D", "Custom"].map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-[10px] rounded-md font-medium transition ${period === p ? "bg-cyan-500/20 text-cyan-400" : "text-white/30 hover:text-white/60"}`}
            >{p}</button>
          ))}
        </div>

        <div className={cx}>
          <h2 className="text-sm font-medium text-white/70 mb-4">Reports by Type — Last 7 Days</h2>
          <div className="flex items-end gap-3 h-40">
            {CHART_DATA.map((d) => {
              const total = d.PDF + d.CSV + d.HTML;
              return (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <div className="w-full flex flex-col-reverse items-center gap-0.5" style={{ height: `${(total / maxVal) * 100}%` }}>
                    <div className="w-full rounded-t-sm bg-purple-500/60 transition-all" style={{ height: `${(d.HTML / total) * 100}%` }} title={`HTML: ${d.HTML}`} />
                    <div className="w-full rounded-t-sm bg-emerald-500/60 transition-all" style={{ height: `${(d.CSV / total) * 100}%` }} title={`CSV: ${d.CSV}`} />
                    <div className="w-full rounded-t-sm bg-cyan-500/60 transition-all" style={{ height: `${(d.PDF / total) * 100}%` }} title={`PDF: ${d.PDF}`} />
                  </div>
                  <span className="text-[9px] text-white/20 pt-1">{d.day}</span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-3">
            {[{ label: "PDF", cls: "bg-cyan-500/20 text-cyan-400" }, { label: "CSV", cls: "bg-emerald-500/20 text-emerald-400" }, { label: "HTML", cls: "bg-purple-500/20 text-purple-400" }].map((l) => (
              <span key={l.label} className={`text-[10px] px-2 py-0.5 rounded-full ${l.cls}`}>{l.label}</span>
            ))}
          </div>
        </div>

        <div className={cx + " overflow-x-auto"}>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-white/30 text-[10px] uppercase tracking-wider border-b border-white/[0.06]">
                <th className="text-left py-2 pr-2">Name</th>
                <th className="text-left py-2 pr-2">Type</th>
                <th className="text-left py-2 pr-2">Created</th>
                <th className="text-left py-2 pr-2">Status</th>
                <th className="text-right py-2 pr-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition">
                  <td className="py-2.5 pr-2 text-white/70 font-medium">{report.name}</td>
                  <td className="py-2.5 pr-2">
                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[report.type]}`}>{report.type}</span>
                  </td>
                  <td className="py-2.5 pr-2 text-white/40">{new Date(report.created).toLocaleDateString()}</td>
                  <td className="py-2.5 pr-2">
                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[report.status]}`}>{report.status}</span>
                  </td>
                  <td className="py-2.5 text-right">
                    <button onClick={() => {}}
                      className="text-[10px] text-cyan-400/60 hover:text-cyan-400 transition"
                    >Download</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }} onClick={(e) => e.stopPropagation()}
              className="bg-[#0f0f0f] border border-white/[0.06] rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <h3 className="text-base font-semibold text-white/90 mb-4">Generate Report</h3>
              <div className="space-y-3">
                <input placeholder="Report name" value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full bg-white/5 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/20 outline-none focus:border-cyan-500/40 focus:bg-white/[0.08] transition"
                />
                <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className="w-full bg-white/5 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/80 outline-none focus:border-cyan-500/40 transition"
                >
                  {REPORT_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
                </select>
                <select value={form.dateRange} onChange={(e) => setForm((f) => ({ ...f, dateRange: e.target.value }))}
                  className="w-full bg-white/5 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/80 outline-none focus:border-cyan-500/40 transition"
                >
                  <option value="last-7">Last 7 days</option>
                  <option value="last-30">Last 30 days</option>
                  <option value="last-90">Last 90 days</option>
                  <option value="custom">Custom range</option>
                </select>
                <select value={form.format} onChange={(e) => setForm((f) => ({ ...f, format: e.target.value }))}
                  className="w-full bg-white/5 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/80 outline-none focus:border-cyan-500/40 transition"
                >
                  {REPORT_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
                </select>
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 py-2 text-xs rounded-lg border border-white/[0.06] text-white/40 hover:text-white/70 transition"
                >Cancel</button>
                <button onClick={handleGenerate}
                  className="flex-1 py-2 text-xs font-medium rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/20 transition"
                >Generate</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
