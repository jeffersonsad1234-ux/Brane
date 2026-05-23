import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "../../hooks/useLocalStorage";

const cx = "rounded-xl border border-white/[0.06] bg-white/[0.02] p-4";
const lx = "text-[11px] text-white/30 uppercase tracking-wider mb-1";
const ix = "w-full bg-white/5 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/20 outline-none focus:border-cyan-500/40 focus:bg-white/[0.08] transition";

const STATUS_STYLES = { Active: "bg-emerald-500/10 text-emerald-400", Paused: "bg-amber-500/10 text-amber-400", Error: "bg-red-500/10 text-red-400" };

const ALL_EVENTS = ["order.created", "order.updated", "order.cancelled", "user.registered", "user.updated", "payment.received", "payment.failed", "subscription.created", "subscription.cancelled", "webhook.enabled", "webhook.disabled"];

const MOCK_WEBHOOKS = [
  { id: 1, url: "https://api.example.com/webhooks/orders", events: ["order.created", "order.updated", "order.cancelled"], status: "Active", lastTriggered: "2026-05-22T14:32:00", description: "Order lifecycle events from storefront.", logs: [{ time: "2026-05-22T14:32:00", status: 200, body: "OK" }, { time: "2026-05-22T13:15:00", status: 200, body: "OK" }] },
  { id: 2, url: "https://api.example.com/webhooks/users", events: ["user.registered", "user.updated"], status: "Active", lastTriggered: "2026-05-21T09:45:00", description: "User registration and profile updates.", logs: [{ time: "2026-05-21T09:45:00", status: 200, body: "OK" }, { time: "2026-05-20T18:20:00", status: 200, body: "OK" }] },
  { id: 3, url: "https://api.example.com/webhooks/payments", events: ["payment.received", "payment.failed"], status: "Paused", lastTriggered: "2026-05-19T16:00:00", description: "Payment confirmation and failure events.", logs: [{ time: "2026-05-19T16:00:00", status: 200, body: "OK" }] },
  { id: 4, url: "https://api.example.com/webhooks/subscriptions", events: ["subscription.created", "subscription.cancelled", "payment.failed"], status: "Error", lastTriggered: "2026-05-18T10:30:00", description: "Subscription lifecycle with failed payment alerts.", logs: [{ time: "2026-05-18T10:30:00", status: 500, body: "Internal Server Error" }, { time: "2026-05-17T22:00:00", status: 200, body: "OK" }] },
];

export default function WebhooksView() {
  const [webhooks, setWebhooks] = useLocalStorage("brane_webhooks", MOCK_WEBHOOKS);
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [testing, setTesting] = useState(null);
  const [form, setForm] = useState({ url: "", events: [], description: "" });

  const nextId = useMemo(() => Math.max(0, ...webhooks.map((w) => w.id)) + 1, [webhooks]);
  const detail = useMemo(() => webhooks.find((w) => w.id === selected), [webhooks, selected]);

  const toggleEvent = useCallback((ev) => {
    setForm((p) => ({
      ...p,
      events: p.events.includes(ev) ? p.events.filter((e) => e !== ev) : [...p.events, ev],
    }));
  }, []);

  const toggleStatus = useCallback((id) => {
    setWebhooks((p) => p.map((w) => {
      if (w.id !== id) return w;
      const next = w.status === "Active" ? "Paused" : "Active";
      return { ...w, status: next };
    }));
  }, [setWebhooks]);

  const handleAdd = useCallback(() => {
    if (!form.url.trim() || form.events.length === 0) return;
    setWebhooks((p) => [...p, {
      id: nextId, url: form.url, events: form.events, status: "Active",
      lastTriggered: null, description: form.description, logs: [],
    }]);
    setForm({ url: "", events: [], description: "" });
    setShowModal(false);
  }, [form, nextId, setWebhooks]);

  const handleTest = useCallback((id) => {
    setTesting(id);
    setTimeout(() => {
      setWebhooks((p) => p.map((w) => {
        if (w.id !== id) return w;
        const newLog = { time: new Date().toISOString(), status: 200, body: "Mock OK" };
        return { ...w, logs: [newLog, ...(w.logs || [])], lastTriggered: newLog.time };
      }));
      setTesting(null);
    }, 1000);
  }, [setWebhooks]);

  const fmtTime = (t) => t ? new Date(t).toLocaleString() : "—";

  return (
    <div className="flex-1 min-h-0 bg-[#0a0a0a] p-4 md:p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white/90 tracking-tight">Webhooks</h1>
          <button onClick={() => setShowModal(true)}
            className="px-4 py-1.5 text-[11px] font-medium rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/20 transition"
          >+ Add Webhook</button>
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {webhooks.map((wh) => (
              <motion.div key={wh.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelected(wh.id)}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 hover:border-cyan-500/30 hover:bg-white/[0.04] transition cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 mr-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-cyan-400/80 truncate">{wh.url}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full shrink-0 ${STATUS_STYLES[wh.status]}`}>{wh.status}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-white/30">
                      <span>📡 {wh.events.join(", ")}</span>
                      {wh.lastTriggered && <span>Last: {fmtTime(wh.lastTriggered)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => toggleStatus(wh.id)}
                      className={`relative w-9 h-5 rounded-full transition-colors ${wh.status === "Active" ? "bg-emerald-500/50" : "bg-white/10"}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${wh.status === "Active" ? "translate-x-4.5" : "translate-x-0.5"}`}
                        style={{ transform: wh.status === "Active" ? "translateX(18px)" : "translateX(2px)" }} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {detail && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 bg-black/40" onClick={() => setSelected(null)}
            />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-80 bg-[#0f0f0f] border-l border-white/[0.06] z-40 overflow-y-auto p-5 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-semibold text-white/80">Webhook Details</h2>
                <button onClick={() => setSelected(null)} className="text-white/20 hover:text-white/60 transition text-lg leading-none">✕</button>
              </div>
              <div className="space-y-3 mb-4">
                <div>
                  <div className={lx}>URL</div>
                  <div className="text-xs font-mono text-cyan-400/80 break-all">{detail.url}</div>
                </div>
                <div>
                  <div className={lx}>Status</div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${STATUS_STYLES[detail.status]}`}>{detail.status}</span>
                </div>
                <div>
                  <div className={lx}>Events</div>
                  <div className="flex flex-wrap gap-1">
                    {detail.events.map((ev) => (
                      <span key={ev} className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/[0.04] text-white/50">{ev}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className={lx}>Last Triggered</div>
                  <div className="text-xs text-white/50">{fmtTime(detail.lastTriggered)}</div>
                </div>
                {detail.description && (
                  <div>
                    <div className={lx}>Description</div>
                    <div className="text-xs text-white/50">{detail.description}</div>
                  </div>
                )}
              </div>
              <button onClick={() => handleTest(detail.id)} disabled={testing === detail.id}
                className="w-full py-2 text-xs font-medium rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/20 transition disabled:opacity-50 mb-4"
              >{testing === detail.id ? "⏳ Testing..." : "▶ Test Webhook"}</button>
              <div className={lx + " mb-2"}>Recent Logs ({detail.logs?.length || 0})</div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {(detail.logs || []).map((log, i) => (
                  <div key={i} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.04] text-[10px]">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${log.status < 300 ? "bg-emerald-400" : "bg-red-400"}`} />
                      <span className="text-white/40 font-mono">{log.status}</span>
                      <span className="text-white/30">{log.body}</span>
                    </div>
                    <span className="text-white/20">{new Date(log.time).toLocaleTimeString()}</span>
                  </div>
                ))}
                {(!detail.logs || detail.logs.length === 0) && (
                  <div className="text-[10px] text-white/20 italic">No logs yet</div>
                )}
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
              <h3 className="text-base font-semibold text-white/90 mb-4">Add Webhook</h3>
              <div className="space-y-3">
                <input value={form.url} onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
                  placeholder="https://api.example.com/webhook" className={ix} autoFocus />
                <input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Description (optional)" className={ix} />
                <div>
                  <div className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Events</div>
                  <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
                    {ALL_EVENTS.map((ev) => (
                      <label key={ev} className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/[0.03] cursor-pointer">
                        <input type="checkbox" checked={form.events.includes(ev)} onChange={() => toggleEvent(ev)}
                          className="w-3 h-3 rounded border-white/20 bg-white/5 accent-cyan-500" />
                        <span className="text-[10px] text-white/50 truncate">{ev}</span>
                      </label>
                    ))}
                  </div>
                </div>
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
