import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "../../hooks/useLocalStorage";

const STAGES = [
  { key: "new", label: "New Lead" },
  { key: "contacted", label: "Contacted" },
  { key: "proposal", label: "Proposal" },
  { key: "closed", label: "Closed Won" },
];

const act = (ts, action) => ({ timestamp: ts, action });
const MOCK_LEADS = [
  { id: 1, name: "Lucas Mendes", company: "Nexus Digital", email: "lucas@nexus.com", phone: "(11) 99999-0001", value: 12000, stage: "new", status: "active", date: "2026-05-18", tags: ["tech", "hot"], activity: [act("2026-05-18T10:00", "Lead created")] },
  { id: 2, name: "Julia Costa", company: "BrightPath Media", email: "julia@brightpath.com", phone: "(11) 99999-0002", value: 8500, stage: "new", status: "active", date: "2026-05-17", tags: ["marketing"], activity: [act("2026-05-17T14:30", "Lead created")] },
  { id: 3, name: "Rafael Oliveira", company: "Apex Group", email: "rafael@apex.com", phone: "(11) 99999-0003", value: 24000, stage: "contacted", status: "active", date: "2026-05-16", tags: ["enterprise"], activity: [act("2026-05-16T09:15", "Lead created"), act("2026-05-17T11:00", "Initial contact via email")] },
  { id: 4, name: "Amanda Santos", company: "Synergy Solutions", email: "amanda@synergy.com", phone: "(11) 99999-0004", value: 15000, stage: "contacted", status: "active", date: "2026-05-15", tags: ["tech"], activity: [act("2026-05-15T16:45", "Lead created"), act("2026-05-16T10:30", "Phone call scheduled")] },
  { id: 5, name: "Pedro Alves", company: "Omega Holdings", email: "pedro@omega.com", phone: "(11) 99999-0005", value: 32000, stage: "proposal", status: "active", date: "2026-05-14", tags: ["enterprise", "priority"], activity: [act("2026-05-14T08:00", "Lead created"), act("2026-05-15T13:00", "Proposal sent")] },
  { id: 6, name: "Camila Torres", company: "BlueLine Corp", email: "camila@blueline.com", phone: "(11) 99999-0006", value: 18000, stage: "proposal", status: "active", date: "2026-05-13", tags: ["finance"], activity: [act("2026-05-13T11:20", "Lead created"), act("2026-05-14T15:00", "Demo presented")] },
  { id: 7, name: "Gabriel Silva", company: "Aurora Labs", email: "gabriel@aurora.com", phone: "(11) 99999-0007", value: 28000, stage: "closed", status: "won", date: "2026-05-12", tags: ["tech", "won"], activity: [act("2026-05-12T10:00", "Lead created"), act("2026-05-20T16:00", "Contract signed")] },
  { id: 8, name: "Isabella Rocha", company: "Quantum Partners", email: "isabella@quantum.com", phone: "(11) 99999-0008", value: 22000, stage: "closed", status: "won", date: "2026-05-11", tags: ["finance", "won"], activity: [act("2026-05-11T09:30", "Lead created"), act("2026-05-19T14:00", "Deal closed")] },
];

const cx = "rounded-xl border border-white/[0.06] bg-white/[0.02] p-4";
const lx = "text-[11px] text-white/30 uppercase tracking-wider mb-1";
const ix = "w-full bg-white/5 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/20 outline-none focus:border-cyan-500/40 focus:bg-white/[0.08] transition";

export default function EnhancedCRM() {
  const [leads, setLeads] = useLocalStorage("brane_crm_leads", MOCK_LEADS);
  const [view, setView] = useState("kanban");
  const [selectedLead, setSelectedLead] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [dragId, setDragId] = useState(null);
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [form, setForm] = useState({ name: "", company: "", email: "", phone: "", value: "" });
  const [notes, setNotes] = useState("");

  const stats = useMemo(() => {
    const total = leads.length;
    const won = leads.filter((l) => l.status === "won").length;
    return { total, won, pipelineValue: leads.reduce((s, l) => s + l.value, 0), convRate: total > 0 ? Math.round((won / total) * 100) : 0 };
  }, [leads]);

  const byStage = useMemo(() => {
    const m = {}; STAGES.forEach((s) => (m[s.key] = [])); leads.forEach((l) => { if (m[l.stage]) m[l.stage].push(l); }); return m;
  }, [leads]);

  const sorted = useMemo(() => [...leads].sort((a, b) => {
    let c = 0;
    if (sortKey === "value") c = a.value - b.value;
    else if (sortKey === "date") c = new Date(a.date) - new Date(b.date);
    else c = (a[sortKey] || "").localeCompare(b[sortKey] || "");
    return sortDir === "asc" ? c : -c;
  }), [leads, sortKey, sortDir]);

  const handleSort = useCallback((k) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir("asc"); }
  }, [sortKey]);

  const handleDrop = useCallback((stage) => {
    if (dragId === null) return;
    setLeads((prev) => prev.map((l) => l.id === dragId ? { ...l, stage, status: stage === "closed" ? "won" : "active" } : l));
    setDragId(null);
  }, [dragId, setLeads]);

  const handleAdd = useCallback(() => {
    if (!form.name.trim() || !form.value) return;
    setLeads((prev) => [{ id: Date.now(), ...form, value: parseFloat(form.value), stage: "new", status: "active", date: new Date().toISOString().slice(0, 10), tags: [], notes: "", activity: [{ timestamp: new Date().toISOString(), action: "Lead created" }] }, ...prev]);
    setForm({ name: "", company: "", email: "", phone: "", value: "" });
    setShowModal(false);
  }, [form, setLeads]);

  const update = useCallback((id, patch) => {
    setLeads((prev) => prev.map((l) => {
      if (l.id !== id) return l;
      const activity = patch.stage ? [...(l.activity || []), { timestamp: new Date().toISOString(), action: `Moved to ${STAGES.find((s) => s.key === patch.stage)?.label || patch.stage}` }] : l.activity;
      return { ...l, ...patch, activity };
    }));
    setSelectedLead((p) => (p && p.id === id ? { ...p, ...patch } : p));
  }, [setLeads]);

  const saveNotes = useCallback(() => { if (selectedLead) update(selectedLead.id, { notes }); }, [selectedLead, notes, update]);
  const closePanel = useCallback(() => { saveNotes(); setSelectedLead(null); }, [saveNotes]);

  const fmt = (v) => "R$ " + v.toLocaleString("pt-BR");
  const stageLabel = (k) => STAGES.find((s) => s.key === k)?.label || k;
  const statusCls = (s) => s === "won" ? "bg-emerald-500/15 text-emerald-400" : s === "lost" ? "bg-red-500/15 text-red-400" : "bg-cyan-500/10 text-cyan-400";

  const SortIcon = ({ active, dir }) => (
    <span className={`inline-block ml-1 text-[10px] ${active ? "text-cyan-400" : "text-white/20"}`}>{active ? (dir === "asc" ? "▲" : "▼") : "⇅"}</span>
  );

  return (
    <div className="flex-1 min-h-0 bg-[#0a0a0a] p-4 md:p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white/90 tracking-tight">CRM</h1>
          <button onClick={() => setShowModal(true)}
            className="px-4 py-1.5 text-[11px] font-medium rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/20 transition"
          >+ Add Lead</button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { l: "Total Leads", v: stats.total, c: "text-white/80" },
            { l: "Won", v: stats.won, c: "text-emerald-400" },
            { l: "Pipeline Value", v: fmt(stats.pipelineValue), c: "text-cyan-400" },
            { l: "Conversion Rate", v: `${stats.convRate}%`, c: "text-blue-400" },
          ].map((card) => (
            <motion.div key={card.l} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cx}>
              <div className={lx}>{card.l}</div>
              <div className={`text-2xl font-semibold ${card.c}`}>{card.v}</div>
            </motion.div>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-lg p-1 w-fit">
          {["kanban", "table"].map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`px-4 py-1.5 text-xs rounded-md font-medium transition capitalize ${view === v ? "bg-cyan-500/20 text-cyan-400 shadow-sm" : "text-white/30 hover:text-white/60"}`}
            >{v}</button>
          ))}
        </div>

        {view === "kanban" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {STAGES.map((s) => (
              <div key={s.key} onDragOver={(e) => e.preventDefault()} onDrop={() => handleDrop(s.key)}
                className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-3"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-medium text-white/60 uppercase tracking-wider">{s.label}</h3>
                  <span className="text-[10px] text-white/30 bg-white/[0.04] px-2 py-0.5 rounded-full">{byStage[s.key]?.length || 0}</span>
                </div>
                <div className="space-y-2 min-h-[60px]">
                  <AnimatePresence>
                    {(byStage[s.key] || []).map((lead) => (
                      <motion.div key={lead.id} layout
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                        draggable onDragStart={() => setDragId(lead.id)}
                        onClick={() => { setSelectedLead(lead); setNotes(lead.notes || ""); }}
                        className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3 cursor-grab active:cursor-grabbing hover:border-cyan-500/30 hover:bg-white/[0.05] transition group"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <span className="text-sm font-medium text-white/80 truncate">{lead.name}</span>
                          <span className="text-xs text-cyan-400/80 font-medium ml-2 shrink-0">{fmt(lead.value)}</span>
                        </div>
                        <div className="text-[11px] text-white/40 mb-1.5">{lead.company}</div>
                        <div className="flex flex-wrap gap-1">
                          {lead.tags.map((tag) => (
                            <span key={tag} className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400/70">{tag}</span>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        )}

        {view === "table" && (
          <div className={cx + " overflow-x-auto"}>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-white/30 text-[10px] uppercase tracking-wider border-b border-white/[0.06]">
                  {["name", "company", "value", "stage", "date", "status"].map((col) => (
                    <th key={col} onClick={() => handleSort(col)}
                      className={`text-left py-2 pr-2 cursor-pointer hover:text-white/60 transition select-none ${col === "value" ? "text-right" : ""}`}
                    >{col}<SortIcon active={sortKey === col} dir={sortDir} /></th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((lead) => (
                  <tr key={lead.id} onClick={() => { setSelectedLead(lead); setNotes(lead.notes || ""); }}
                    className="border-b border-white/[0.03] hover:bg-white/[0.02] cursor-pointer transition"
                  >
                    <td className="py-2.5 pr-2 text-white/70 font-medium">{lead.name}</td>
                    <td className="py-2.5 pr-2 text-white/50">{lead.company}</td>
                    <td className="py-2.5 pr-2 text-right text-cyan-400/80">{fmt(lead.value)}</td>
                    <td className="py-2.5 pr-2 text-white/50">{stageLabel(lead.stage)}</td>
                    <td className="py-2.5 pr-2 text-white/30 whitespace-nowrap">{new Date(lead.date).toLocaleDateString()}</td>
                    <td className="py-2.5 pr-2">
                      <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded-full capitalize ${statusCls(lead.status)}`}>{lead.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedLead && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 bg-black/40" onClick={closePanel}
            />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-80 bg-[#0f0f0f] border-l border-white/[0.06] z-40 overflow-y-auto p-5 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-semibold text-white/80">Lead Details</h2>
                <button onClick={closePanel} className="text-white/20 hover:text-white/60 transition text-lg leading-none">✕</button>
              </div>
              <div className="space-y-4">
                {[
                  ["Name", selectedLead.name, "text-white/80"],
                  ["Company", selectedLead.company, "text-white/70"],
                  ["Email", selectedLead.email, "text-white/60"],
                  ["Phone", selectedLead.phone, "text-white/60"],
                ].map(([l, v, c]) => (
                  <div key={l}><div className={lx}>{l}</div><div className={`text-sm ${c}`}>{v}</div></div>
                ))}
                <div><div className={lx}>Value</div><div className="text-sm text-cyan-400 font-medium">{fmt(selectedLead.value)}</div></div>
                <div>
                  <div className={lx}>Stage</div>
                  <select value={selectedLead.stage}
                    onChange={(e) => { const ns = e.target.value; update(selectedLead.id, { stage: ns, status: ns === "closed" ? "won" : "active" }); }}
                    className={ix}
                  >
                    {STAGES.map((s) => (<option key={s.key} value={s.key}>{s.label}</option>))}
                  </select>
                </div>
                <div>
                  <div className={lx}>Notes</div>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={saveNotes}
                    rows={3} placeholder="Add notes..." className={ix + " resize-none"}
                  />
                </div>
                <div>
                  <div className={lx}>Activity</div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {(selectedLead.activity || []).slice().reverse().map((e, i) => (
                      <div key={i} className="text-[11px] border-l-2 border-cyan-500/30 pl-2">
                        <div className="text-white/50">{e.action}</div>
                        <div className="text-white/20">{new Date(e.timestamp).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
              <h3 className="text-base font-semibold text-white/90 mb-4">Add Lead</h3>
              <div className="space-y-3">
                {[
                  ["name", "Name *", "text"],
                  ["company", "Company", "text"],
                  ["email", "Email", "email"],
                  ["phone", "Phone", "text"],
                  ["value", "Value *", "number"],
                ].map(([k, p, t]) => (
                  <input key={k} placeholder={p} type={t} value={form[k]}
                    onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} className={ix}
                  />
                ))}
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 py-2 text-xs rounded-lg border border-white/[0.06] text-white/40 hover:text-white/70 transition"
                >Cancel</button>
                <button onClick={handleAdd}
                  className="flex-1 py-2 text-xs font-medium rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/20 transition"
                >Add</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
