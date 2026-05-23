import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "../../hooks/useLocalStorage";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const MOCK_REVENUE = [3200,4100,3800,5200,4800,5600,5100,6300,5800,7200,6800,8450];
const MOCK_EXPENSES = [980,1120,1050,1240,1180,1350,1220,1410,1280,1560,1450,1600];

const MOCK_TRANSACTIONS = [
  { id:1, date:"2026-05-22", desc:"BRANPY subscription - Enterprise", amount:1299, status:"paid" },
  { id:2, date:"2026-05-21", desc:"AI agent deployment fee", amount:450, status:"paid" },
  { id:3, date:"2026-05-20", desc:"Marketing retainer - Q2", amount:2500, status:"paid" },
  { id:4, date:"2026-05-19", desc:"Cloud infrastructure costs", amount:890, status:"paid" },
  { id:5, date:"2026-05-18", desc:"Consulting - workflow automation", amount:1800, status:"pending" },
  { id:6, date:"2026-05-17", desc:"API integration setup", amount:750, status:"pending" },
  { id:7, date:"2026-05-16", desc:"Data analytics dashboard", amount:3200, status:"overdue" },
  { id:8, date:"2026-05-15", desc:"Agent training session", amount:600, status:"paid" },
];

const MOCK_INVOICES = [
  { id:1, client:"BrightPath Media", amount:4200, due:"2026-06-15", status:"pending" },
  { id:2, client:"Nexus Digital Labs", amount:2800, due:"2026-06-10", status:"pending" },
  { id:3, client:"Apex Marketing Group", amount:5600, due:"2026-06-01", status:"paid" },
  { id:4, client:"Synergy Solutions Inc", amount:1950, due:"2026-05-28", status:"overdue" },
];

const STATUS_STYLES = {
  paid: "bg-emerald-500/15 text-emerald-400",
  pending: "bg-amber-500/15 text-amber-400",
  overdue: "bg-red-500/15 text-red-400",
};

export default function FinanceHubView() {
  const [revenue] = useLocalStorage("brane_revenue", MOCK_REVENUE);
  const [expenses] = useLocalStorage("brane_expenses", MOCK_EXPENSES);
  const [transactions, setTransactions] = useLocalStorage("brane_transactions", MOCK_TRANSACTIONS);
  const [invoices, setInvoices] = useLocalStorage("brane_invoices", MOCK_INVOICES);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [form, setForm] = useState({ client:"", amount:"", dueDate:"", status:"pending" });

  const totals = useMemo(() => {
    const totalRev = revenue.reduce((a,b) => a+b, 0);
    const totalExp = expenses.reduce((a,b) => a+b, 0);
    const profit = totalRev - totalExp;
    const pending = invoices.filter((i) => i.status === "pending").length;
    return { totalRev, totalExp, profit, pending };
  }, [revenue, expenses, invoices]);

  const maxRevenue = useMemo(() => Math.max(...revenue, 1), [revenue]);

  const handleCreateInvoice = useCallback(() => {
    if (!form.client.trim() || !form.amount || !form.dueDate) return;
    const invoice = {
      id: Date.now(),
      client: form.client,
      amount: parseFloat(form.amount),
      due: form.dueDate,
      status: form.status,
    };
    setInvoices((prev) => [invoice, ...prev]);
    setForm({ client:"", amount:"", dueDate:"", status:"pending" });
    setShowInvoiceModal(false);
  }, [form, setInvoices]);

  const cardClass = "rounded-xl border border-white/[0.06] bg-white/[0.02] p-4";
  const labelClass = "text-[11px] text-white/30 uppercase tracking-wider mb-1";
  const inputClass = "w-full bg-white/5 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/20 outline-none focus:border-white/20 focus:bg-white/[0.08] transition";

  return (
    <div className="flex-1 min-h-0 bg-[#0a0a0a] p-4 md:p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-xl font-semibold text-white/90 tracking-tight">Finance Hub</h1>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label:"Total Revenue", value:`$${totals.totalRev.toLocaleString()}`, color:"text-emerald-400" },
            { label:"Expenses", value:`$${totals.totalExp.toLocaleString()}`, color:"text-red-400" },
            { label:"Profit", value:`$${totals.profit.toLocaleString()}`, color:"text-blue-400" },
            { label:"Pending Invoices", value:totals.pending, color:"text-amber-400" },
          ].map((card) => (
            <motion.div key={card.label} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} className={cardClass}>
              <div className={labelClass}>{card.label}</div>
              <div className={`text-2xl font-semibold ${card.color}`}>{card.value}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className={cardClass}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-white/70">Revenue vs Expenses</h2>
              <span className="text-[10px] text-white/20">12 months</span>
            </div>
            <div className="flex items-end gap-1.5 h-32">
              {revenue.map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group">
                  <div className="relative w-full flex flex-col items-center">
                    <div
                      className="w-full rounded-t-sm bg-gradient-to-t from-emerald-600/80 to-emerald-400/60 transition-all duration-300 group-hover:brightness-125"
                      style={{ height: `${(val / maxRevenue) * 100}%` }}
                    />
                    <div
                      className="w-full rounded-t-sm bg-gradient-to-t from-red-600/80 to-red-400/60 transition-all duration-300 group-hover:brightness-125"
                      style={{ height: `${(expenses[i] / maxRevenue) * 100}%`, marginTop: 2 }}
                    />
                  </div>
                  <span className="text-[9px] text-white/20 pt-1">{MONTHS[i]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={cardClass}>
            <h2 className="text-sm font-medium text-white/70 mb-3">Recent Transactions</h2>
            <div className="space-y-1">
              {transactions.slice(0, 5).map((txn) => (
                <div key={txn.id} className="flex items-center justify-between py-1.5 border-b border-white/[0.03] last:border-0">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-white/70 truncate">{txn.desc}</div>
                    <div className="text-[10px] text-white/20">{new Date(txn.date).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right ml-3">
                    <div className="text-xs text-white/80">${txn.amount}</div>
                    <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded-full capitalize ${STATUS_STYLES[txn.status]}`}>{txn.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={cardClass}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-white/70">Invoices</h2>
            <button onClick={() => setShowInvoiceModal(true)} className="px-3 py-1.5 text-[11px] font-medium rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/20 transition">
              + Create Invoice
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-white/30 text-[10px] uppercase tracking-wider border-b border-white/[0.06]">
                  <th className="text-left py-2 pr-2">Client</th>
                  <th className="text-left py-2 pr-2">Amount</th>
                  <th className="text-left py-2 pr-2">Due Date</th>
                  <th className="text-left py-2 pr-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <td className="py-2.5 pr-2 text-white/70">{inv.client}</td>
                    <td className="py-2.5 pr-2 text-white/80">${inv.amount.toLocaleString()}</td>
                    <td className="py-2.5 pr-2 text-white/40">{new Date(inv.due).toLocaleDateString()}</td>
                    <td className="py-2.5 pr-2">
                      <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[inv.status]}`}>{inv.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={cardClass}>
          <h2 className="text-sm font-medium text-white/70 mb-3">All Transactions</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-white/30 text-[10px] uppercase tracking-wider border-b border-white/[0.06]">
                  <th className="text-left py-2 pr-2">Date</th>
                  <th className="text-left py-2 pr-2">Description</th>
                  <th className="text-right py-2 pr-2">Amount</th>
                  <th className="text-left py-2 pr-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn) => (
                  <tr key={txn.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <td className="py-2.5 pr-2 text-white/40 whitespace-nowrap">{new Date(txn.date).toLocaleDateString()}</td>
                    <td className="py-2.5 pr-2 text-white/70">{txn.desc}</td>
                    <td className="py-2.5 pr-2 text-right text-white/80">${txn.amount}</td>
                    <td className="py-2.5 pr-2">
                      <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded-full capitalize ${STATUS_STYLES[txn.status]}`}>{txn.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showInvoiceModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setShowInvoiceModal(false)}
          >
            <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.95 }}
              transition={{ duration:0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0f0f0f] border border-white/[0.06] rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <h3 className="text-base font-semibold text-white/90 mb-4">Create Invoice</h3>
              <div className="space-y-3">
                <input placeholder="Client name" value={form.client}
                  onChange={(e) => setForm((f) => ({ ...f, client: e.target.value }))}
                  className={inputClass}
                />
                <input type="number" placeholder="Amount" value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  className={inputClass}
                />
                <input type="date" placeholder="Due date" value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                  className={inputClass}
                />
                <select value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  className={inputClass}
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setShowInvoiceModal(false)}
                  className="flex-1 py-2 text-xs rounded-lg border border-white/[0.06] text-white/40 hover:text-white/70 transition"
                >Cancel</button>
                <button onClick={handleCreateInvoice}
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
