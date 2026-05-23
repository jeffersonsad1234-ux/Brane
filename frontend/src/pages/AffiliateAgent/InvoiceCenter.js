import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "../../hooks/useLocalStorage";

const MOCK_INVOICES = [
  { id: 1, client: "Nexus Digital", amount: 12500, issueDate: "2026-05-01", dueDate: "2026-05-15", status: "paid", description: "Enterprise plan Q2" },
  { id: 2, client: "BrightPath Media", amount: 8400, issueDate: "2026-05-03", dueDate: "2026-05-20", status: "paid", description: "Marketing retainer" },
  { id: 3, client: "Apex Group", amount: 6200, issueDate: "2026-05-05", dueDate: "2026-05-25", status: "pending", description: "Consulting services" },
  { id: 4, client: "Synergy Solutions", amount: 9800, issueDate: "2026-05-07", dueDate: "2026-06-01", status: "pending", description: "Software license" },
  { id: 5, client: "Omega Holdings", amount: 3700, issueDate: "2026-04-20", dueDate: "2026-05-05", status: "overdue", description: "Support contract" },
  { id: 6, client: "BlueLine Corp", amount: 4500, issueDate: "2026-05-10", dueDate: "2026-05-30", status: "pending", description: "Web development" },
  { id: 7, client: "Aurora Labs", amount: 2130, issueDate: "2026-04-15", dueDate: "2026-04-30", status: "overdue", description: "Hosting fees" },
  { id: 8, client: "Quantum Partners", amount: 1000, issueDate: "2026-05-12", dueDate: "2026-05-26", status: "paid", description: "Domain renewal" },
];

const STATUS_STYLES = { paid: "bg-emerald-500/15 text-emerald-400", pending: "bg-amber-500/15 text-amber-400", overdue: "bg-red-500/15 text-red-400" };
const TABS = ["All", "Paid", "Pending", "Overdue"];

const cx = "rounded-xl border border-white/[0.06] bg-white/[0.02] p-4";
const lx = "text-[11px] text-white/30 uppercase tracking-wider mb-1";
const ix = "w-full bg-white/5 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/20 outline-none focus:border-cyan-500/40 focus:bg-white/[0.08] transition";

export default function InvoiceCenter() {
  const [invoices, setInvoices] = useLocalStorage("brane_invoices", MOCK_INVOICES);
  const [tab, setTab] = useState("All");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ client: "", amount: "", dueDate: "", description: "", status: "pending" });

  const summary = useMemo(() => {
    const total = invoices.reduce((s, i) => s + i.amount, 0);
    const paid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);
    const pending = invoices.filter((i) => i.status === "pending").reduce((s, i) => s + i.amount, 0);
    const overdue = invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + i.amount, 0);
    return { total, paid, pending, overdue };
  }, [invoices]);

  const filtered = useMemo(() => {
    if (tab === "All") return invoices;
    return invoices.filter((i) => i.status === tab.toLowerCase());
  }, [invoices, tab]);

  const handleCreate = useCallback(() => {
    if (!form.client.trim() || !form.amount || !form.dueDate) return;
    setInvoices((prev) => [{ id: Date.now(), client: form.client, amount: parseFloat(form.amount), issueDate: new Date().toISOString().slice(0, 10), dueDate: form.dueDate, status: form.status, description: form.description }, ...prev]);
    setForm({ client: "", amount: "", dueDate: "", description: "", status: "pending" });
    setShowModal(false);
  }, [form, setInvoices]);

  const fmt = (v) => "R$ " + v.toLocaleString("pt-BR");

  return (
    <div className="flex-1 min-h-0 bg-[#0a0a0a] p-4 md:p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white/90 tracking-tight">Invoice Center</h1>
          <button onClick={() => setShowModal(true)}
            className="px-4 py-1.5 text-[11px] font-medium rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/20 transition"
          >+ Create Invoice</button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Total Invoiced", value: fmt(summary.total), color: "text-white/80" },
            { label: "Paid", value: fmt(summary.paid), color: "text-emerald-400" },
            { label: "Pending", value: fmt(summary.pending), color: "text-amber-400" },
            { label: "Overdue", value: fmt(summary.overdue), color: "text-red-400" },
          ].map((card) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cx}>
              <div className={lx}>{card.label}</div>
              <div className={`text-2xl font-semibold ${card.color}`}>{card.value}</div>
            </motion.div>
          ))}
        </div>

        <div className="flex gap-1 bg-white/[0.03] border border-white/[0.06] rounded-lg p-1 w-fit">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1 text-[10px] rounded-md font-medium transition ${tab === t ? "bg-cyan-500/20 text-cyan-400" : "text-white/30 hover:text-white/60"}`}
            >{t}</button>
          ))}
        </div>

        <div className={cx + " overflow-x-auto"}>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-white/30 text-[10px] uppercase tracking-wider border-b border-white/[0.06]">
                <th className="text-left py-2 pr-2">Invoice #</th>
                <th className="text-left py-2 pr-2">Client</th>
                <th className="text-right py-2 pr-2">Amount</th>
                <th className="text-left py-2 pr-2">Issue Date</th>
                <th className="text-left py-2 pr-2">Due Date</th>
                <th className="text-left py-2 pr-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id} onClick={() => setSelectedInvoice(inv)}
                  className="border-b border-white/[0.03] hover:bg-white/[0.02] cursor-pointer transition"
                >
                  <td className="py-2.5 pr-2 text-white/70 font-medium">#{String(inv.id).padStart(4, "0")}</td>
                  <td className="py-2.5 pr-2 text-white/70">{inv.client}</td>
                  <td className="py-2.5 pr-2 text-right text-white/80 font-medium">{fmt(inv.amount)}</td>
                  <td className="py-2.5 pr-2 text-white/40">{new Date(inv.issueDate).toLocaleDateString()}</td>
                  <td className="py-2.5 pr-2 text-white/40">{new Date(inv.dueDate).toLocaleDateString()}</td>
                  <td className="py-2.5 pr-2">
                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[inv.status]}`}>{inv.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedInvoice && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 bg-black/40" onClick={() => setSelectedInvoice(null)}
            />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-80 bg-[#0f0f0f] border-l border-white/[0.06] z-40 overflow-y-auto p-5 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-semibold text-white/80">Invoice #{String(selectedInvoice.id).padStart(4, "0")}</h2>
                <button onClick={() => setSelectedInvoice(null)} className="text-white/20 hover:text-white/60 transition text-lg leading-none">✕</button>
              </div>
              <div className="space-y-4">
                {[
                  ["Client", selectedInvoice.client, "text-white/70"],
                  ["Description", selectedInvoice.description, "text-white/60"],
                  ["Issue Date", new Date(selectedInvoice.issueDate).toLocaleDateString(), "text-white/50"],
                  ["Due Date", new Date(selectedInvoice.dueDate).toLocaleDateString(), "text-white/50"],
                ].map(([l, v, c]) => (
                  <div key={l}><div className={lx}>{l}</div><div className={`text-sm ${c}`}>{v}</div></div>
                ))}
                <div><div className={lx}>Amount</div><div className="text-lg font-semibold text-cyan-400">{fmt(selectedInvoice.amount)}</div></div>
                <div><div className={lx}>Status</div>
                  <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[selectedInvoice.status]}`}>{selectedInvoice.status}</span>
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
              <h3 className="text-base font-semibold text-white/90 mb-4">Create Invoice</h3>
              <div className="space-y-3">
                <input placeholder="Client name *" value={form.client} onChange={(e) => setForm((f) => ({ ...f, client: e.target.value }))} className={ix} />
                <input type="number" placeholder="Amount *" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className={ix} />
                <input type="date" placeholder="Due date *" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} className={ix} />
                <input placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className={ix} />
                <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className={ix}>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 py-2 text-xs rounded-lg border border-white/[0.06] text-white/40 hover:text-white/70 transition"
                >Cancel</button>
                <button onClick={handleCreate}
                  className="flex-1 py-2 text-xs font-medium rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/20 transition"
                >Create</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
