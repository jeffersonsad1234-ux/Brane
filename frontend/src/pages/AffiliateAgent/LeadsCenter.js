import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "../../hooks/useLocalStorage";

const SOURCES = ["Google", "Referral", "Direct", "Social"];
const STATUSES = ["New", "Contacted", "Qualified", "Lost"];

const MOCK_LEADS = [
  { id: 1, name: "Alice Martins", company: "Nexus Digital", email: "alice@nexus.com", phone: "(11) 99999-0101", score: 85, source: "Google", status: "Qualified", tags: ["tech", "hot"], notes: "", activity: ["2026-05-20: Initial contact via LinkedIn", "2026-05-18: Lead created"] },
  { id: 2, name: "Bruno Costa", company: "BrightPath Media", email: "bruno@brightpath.com", phone: "(11) 99999-0102", score: 72, source: "Referral", status: "Contacted", tags: ["marketing"], notes: "", activity: ["2026-05-19: Sent follow-up email", "2026-05-17: Lead created"] },
  { id: 3, name: "Carla Oliveira", company: "Apex Group", email: "carla@apex.com", phone: "(11) 99999-0103", score: 91, source: "Social", status: "Qualified", tags: ["enterprise", "priority"], notes: "", activity: ["2026-05-20: Demo scheduled", "2026-05-16: Lead created"] },
  { id: 4, name: "Daniel Santos", company: "Synergy Solutions", email: "daniel@synergy.com", phone: "(11) 99999-0104", score: 45, source: "Direct", status: "New", tags: ["tech"], notes: "", activity: ["2026-05-18: Lead created"] },
  { id: 5, name: "Eduarda Alves", company: "Omega Holdings", email: "eduarda@omega.com", phone: "(11) 99999-0105", score: 68, source: "Google", status: "Contacted", tags: ["finance"], notes: "", activity: ["2026-05-19: Called and left voicemail", "2026-05-15: Lead created"] },
  { id: 6, name: "Felipe Torres", company: "BlueLine Corp", email: "felipe@blueline.com", phone: "(11) 99999-0106", score: 34, source: "Referral", status: "Lost", tags: ["lost"], notes: "", activity: ["2026-05-17: Not interested at this time", "2026-05-14: Lead created"] },
  { id: 7, name: "Gabriela Silva", company: "Aurora Labs", email: "gabriela@aurora.com", phone: "(11) 99999-0107", score: 88, source: "Social", status: "Qualified", tags: ["tech", "hot"], notes: "", activity: ["2026-05-20: Proposal sent", "2026-05-13: Lead created"] },
  { id: 8, name: "Henrique Rocha", company: "Quantum Partners", email: "henrique@quantum.com", phone: "(11) 99999-0108", score: 56, source: "Google", status: "Contacted", tags: ["enterprise"], notes: "", activity: ["2026-05-18: Email opened", "2026-05-12: Lead created"] },
  { id: 9, name: "Isabela Mendes", company: "Velocity Tech", email: "isabela@velocity.com", phone: "(11) 99999-0109", score: 79, source: "Direct", status: "Qualified", tags: ["tech", "priority"], notes: "", activity: ["2026-05-19: Product demo completed", "2026-05-11: Lead created"] },
  { id: 10, name: "João Pereira", company: "DataFlow Inc", email: "joao@dataflow.com", phone: "(11) 99999-0110", score: 22, source: "Referral", status: "New", tags: ["small"], notes: "", activity: ["2026-05-20: Lead created"] },
];

const cx = "rounded-xl border border-white/[0.06] bg-white/[0.02] p-4";
const lx = "text-[11px] text-white/30 uppercase tracking-wider mb-1";
const ix = "w-full bg-white/5 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/20 outline-none focus:border-cyan-500/40 focus:bg-white/[0.08] transition";

function scoreBadge(score) {
  if (score >= 70) return "bg-emerald-500/15 text-emerald-400";
  if (score >= 40) return "bg-amber-500/15 text-amber-400";
  return "bg-red-500/15 text-red-400";
}

function statusBadge(status) {
  const m = { New: "bg-blue-500/15 text-blue-400", Contacted: "bg-amber-500/15 text-amber-400", Qualified: "bg-emerald-500/15 text-emerald-400", Lost: "bg-red-500/15 text-red-400" };
  return m[status] || "bg-white/[0.06] text-white/40";
}

export default function LeadsCenter() {
  const [leads, setLeads] = useLocalStorage("brane_leads", MOCK_LEADS);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedLead, setSelectedLead] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [notesText, setNotesText] = useState("");
  const [form, setForm] = useState({ name: "", email: "", company: "", phone: "", source: "Google", tags: "" });

  const stats = useMemo(() => {
    const total = leads.length;
    const qualified = leads.filter((l) => l.status === "Qualified").length;
    const converted = leads.filter((l) => l.status === "Qualified" && l.score >= 70).length;
    const avgScore = Math.round(leads.reduce((s, l) => s + l.score, 0) / total);
    return { total, qualified, converted, avgScore };
  }, [leads]);

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      const m = l.name.toLowerCase().includes(search.toLowerCase()) || l.company.toLowerCase().includes(search.toLowerCase()) || l.email.toLowerCase().includes(search.toLowerCase());
      return filterStatus === "All" ? m : m && l.status === filterStatus;
    });
  }, [leads, search, filterStatus]);

  const handleAdd = useCallback(() => {
    if (!form.name.trim() || !form.email.trim()) return;
    setLeads((prev) => [{ id: Date.now(), name: form.name, email: form.email, company: form.company, phone: form.phone, source: form.source, tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : [], score: Math.floor(Math.random() * 60) + 20, status: "New", notes: "", activity: [`${new Date().toISOString().slice(0, 10)}: Lead created`] }, ...prev]);
    setForm({ name: "", email: "", company: "", phone: "", source: "Google", tags: "" });
    setShowModal(false);
  }, [form, setLeads]);

  const saveNotes = useCallback(() => {
    if (!selectedLead) return;
    setLeads((prev) => prev.map((l) => l.id === selectedLead.id ? { ...l, notes: notesText, activity: [...l.activity, `${new Date().toISOString().slice(0, 10)}: Notes updated`] } : l));
    setSelectedLead((p) => p ? { ...p, notes: notesText } : p);
  }, [selectedLead, notesText, setLeads]);

  return (
    <div className="flex-1 min-h-0 bg-[#0a0a0a] p-4 md:p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white/90 tracking-tight">Leads Center</h1>
          <button onClick={() => setShowModal(true)}
            className="px-4 py-1.5 text-[11px] font-medium rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/20 transition"
          >+ Add Lead</button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Total Leads", value: stats.total, color: "text-white/80" },
            { label: "Qualified", value: stats.qualified, color: "text-emerald-400" },
            { label: "Converted", value: stats.converted, color: "text-cyan-400" },
            { label: "Avg Score", value: stats.avgScore, color: "text-blue-400" },
          ].map((card) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cx}>
              <div className={lx}>{card.label}</div>
              <div className={`text-2xl font-semibold ${card.color}`}>{card.value}</div>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input placeholder="Search leads..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-60 bg-white/5 border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-white/70 placeholder-white/20 outline-none focus:border-cyan-500/40 transition"
          />
          <div className="flex gap-1 bg-white/[0.03] border border-white/[0.06] rounded-lg p-1">
            {["All", ...STATUSES].map((s) => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-2.5 py-1 text-[10px] rounded-md font-medium transition ${filterStatus === s ? "bg-cyan-500/20 text-cyan-400" : "text-white/30 hover:text-white/60"}`}
              >{s}</button>
            ))}
          </div>
        </div>

        <div className={cx + " overflow-x-auto"}>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-white/30 text-[10px] uppercase tracking-wider border-b border-white/[0.06]">
                <th className="text-left py-2 pr-2">Name</th>
                <th className="text-left py-2 pr-2">Company</th>
                <th className="text-left py-2 pr-2">Email</th>
                <th className="text-left py-2 pr-2">Score</th>
                <th className="text-left py-2 pr-2">Source</th>
                <th className="text-left py-2 pr-2">Status</th>
                <th className="text-left py-2 pr-2">Tags</th>
                <th className="text-right py-2 pr-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <tr key={lead.id} onClick={() => { setSelectedLead(lead); setNotesText(lead.notes || ""); }}
                  className="border-b border-white/[0.03] hover:bg-white/[0.02] cursor-pointer transition"
                >
                  <td className="py-2.5 pr-2 text-white/70 font-medium">{lead.name}</td>
                  <td className="py-2.5 pr-2 text-white/50">{lead.company}</td>
                  <td className="py-2.5 pr-2 text-white/40">{lead.email}</td>
                  <td className="py-2.5 pr-2">
                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium ${scoreBadge(lead.score)}`}>{lead.score}</span>
                  </td>
                  <td className="py-2.5 pr-2 text-white/50">{lead.source}</td>
                  <td className="py-2.5 pr-2">
                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full capitalize ${statusBadge(lead.status)}`}>{lead.status}</span>
                  </td>
                  <td className="py-2.5 pr-2">
                    <div className="flex flex-wrap gap-1">
                      {lead.tags.map((tag) => (
                        <span key={tag} className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-white/[0.04] text-white/40">{tag}</span>
                      ))}
                    </div>
                  </td>
                  <td className="py-2.5 text-right">
                    <button onClick={(e) => { e.stopPropagation(); setSelectedLead(lead); setNotesText(lead.notes || ""); }}
                      className="text-[10px] text-cyan-400/60 hover:text-cyan-400 transition"
                    >View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedLead && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 bg-black/40" onClick={() => { saveNotes(); setSelectedLead(null); }}
            />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-80 bg-[#0f0f0f] border-l border-white/[0.06] z-40 overflow-y-auto p-5 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-semibold text-white/80">Lead Details</h2>
                <button onClick={() => { saveNotes(); setSelectedLead(null); }} className="text-white/20 hover:text-white/60 transition text-lg leading-none">✕</button>
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
                <div><div className={lx}>Source</div><div className="text-sm text-white/60">{selectedLead.source}</div></div>
                <div><div className={lx}>Score</div><span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${scoreBadge(selectedLead.score)}`}>{selectedLead.score}</span></div>
                <div><div className={lx}>Status</div><span className={`inline-block text-[10px] px-2 py-0.5 rounded-full capitalize ${statusBadge(selectedLead.status)}`}>{selectedLead.status}</span></div>
                <div>
                  <div className={lx}>Tags</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedLead.tags.map((tag) => (
                      <span key={tag} className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-white/[0.04] text-white/40">{tag}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className={lx}>Notes</div>
                  <textarea value={notesText} onChange={(e) => setNotesText(e.target.value)} onBlur={saveNotes}
                    rows={3} placeholder="Add notes..." className={ix + " resize-none"}
                  />
                </div>
                <div>
                  <div className={lx}>Activity Log</div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedLead.activity.slice().reverse().map((entry, i) => (
                      <div key={i} className="text-[11px] border-l-2 border-cyan-500/30 pl-2">
                        <div className="text-white/50">{entry}</div>
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
                <input placeholder="Name *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={ix} />
                <input placeholder="Email *" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className={ix} />
                <input placeholder="Company" value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} className={ix} />
                <input placeholder="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className={ix} />
                <select value={form.source} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))} className={ix}>
                  {SOURCES.map((s) => (<option key={s} value={s}>{s}</option>))}
                </select>
                <input placeholder="Tags (comma separated)" value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} className={ix} />
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
