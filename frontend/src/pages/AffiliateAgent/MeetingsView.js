import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "../../hooks/useLocalStorage";

const cx = "rounded-xl border border-white/[0.06] bg-white/[0.02] p-4";
const lx = "text-[11px] text-white/30 uppercase tracking-wider mb-1";
const ix = "w-full bg-white/5 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/20 outline-none focus:border-cyan-500/40 focus:bg-white/[0.08] transition";

const STATUS_STYLES = {
  "Scheduled": "bg-cyan-500/10 text-cyan-400",
  "In Progress": "bg-emerald-500/10 text-emerald-400",
  "Ended": "bg-white/5 text-white/30",
};

const MOCK_MEETINGS = [
  { id: 1, title: "Sprint Planning", date: "2026-05-25", time: "09:00", duration: 60, participants: ["AL", "JM", "RC", "PT"], status: "Scheduled", description: "Plan next sprint tasks and review backlog." },
  { id: 2, title: "Client Sync — Acme Corp", date: "2026-05-24", time: "14:00", duration: 30, participants: ["JD", "AS", "MK"], status: "Scheduled", description: "Bi-weekly check-in with Acme stakeholders." },
  { id: 3, title: "Design Review", date: "2026-05-23", time: "11:00", duration: 45, participants: ["TF", "GP", "LN"], status: "In Progress", description: "Review homepage mockups and provide feedback." },
  { id: 4, title: "BRANPY Standup", date: "2026-05-22", time: "09:30", duration: 15, participants: ["AL", "JM", "RC", "PT", "TF"], status: "Ended", description: "Daily team standup to discuss blockers." },
  { id: 5, title: "Q2 Retrospective", date: "2026-05-20", time: "15:00", duration: 90, participants: ["AL", "JM", "RC"], status: "Ended", description: "Quarterly retrospective to discuss wins and improvements." },
];

const AVATAR_COLORS = ["#0ea5e9", "#6366f1", "#ec4899", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function MeetingsView() {
  const [meetings, setMeetings] = useLocalStorage("brane_meetings", MOCK_MEETINGS);
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [form, setForm] = useState({ title: "", date: "", time: "", duration: 30, participants: "" });

  const nextId = useMemo(() => Math.max(0, ...meetings.map((m) => m.id)) + 1, [meetings]);
  const detail = useMemo(() => meetings.find((m) => m.id === selected), [meetings, selected]);

  const handleSchedule = useCallback(() => {
    if (!form.title.trim() || !form.date || !form.time) return;
    const parts = form.participants.split(",").map((s) => s.trim()).filter(Boolean);
    setMeetings((p) => [...p, {
      id: nextId, title: form.title, date: form.date, time: form.time,
      duration: form.duration, participants: parts.length > 0 ? parts.map((_, i) => (i < 26 ? String.fromCharCode(65 + i) : "X") + "Z") : ["AL"],
      status: "Scheduled", description: "",
    }]);
    setForm({ title: "", date: "", time: "", duration: 30, participants: "" });
    setShowModal(false);
  }, [form, nextId, setMeetings]);

  const handleJoin = useCallback(() => {
    setInCall(true);
  }, []);

  const Avatar = ({ initials, index }) => (
    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium text-white border border-white/10"
      style={{ backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] + "60" }}
    >{initials}</div>
  );

  return (
    <div className="flex-1 min-h-0 bg-[#0a0a0a] p-4 md:p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white/90 tracking-tight">Meetings</h1>
          <button onClick={() => setShowModal(true)}
            className="px-4 py-1.5 text-[11px] font-medium rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/20 transition"
          >+ Schedule Meeting</button>
        </div>

        {inCall ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="relative bg-black rounded-2xl overflow-hidden border border-white/[0.06]" style={{ aspectRatio: "16/9" }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                  <span className="text-4xl text-white/20">📷</span>
                </div>
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
                <button onClick={() => {}} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition">
                  <span className="text-sm">🎤</span>
                </button>
                <button onClick={() => setInCall(false)} className="w-10 h-10 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center text-white transition">
                  <span className="text-sm">📞</span>
                </button>
              </div>
              <div className="absolute top-4 right-4 w-32 rounded-xl overflow-hidden border border-white/[0.10] bg-black" style={{ aspectRatio: "4/3" }}>
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-xs text-white/30">You</span>
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-white/50">In call · <span className="text-emerald-400">Live</span></div>
              <button onClick={() => setInCall(false)} className="mt-2 text-[10px] text-red-400/60 hover:text-red-400 transition">Leave</button>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {meetings.map((m) => (
                <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelected(m.id)}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 hover:border-cyan-500/30 hover:bg-white/[0.04] transition cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-white/80 truncate">{m.title}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full shrink-0 ${STATUS_STYLES[m.status] || "text-white/30 bg-white/5"}`}>{m.status}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-white/40">
                        <span>📅 {new Date(m.date).toLocaleDateString()}</span>
                        <span>⏰ {m.time}</span>
                        <span>⏱ {m.duration}m</span>
                      </div>
                    </div>
                    <div className="flex items-center -space-x-1.5 ml-3">
                      {m.participants.slice(0, 4).map((p, i) => (
                        <Avatar key={i} initials={p} index={i} />
                      ))}
                      {m.participants.length > 4 && (
                        <div className="w-7 h-7 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center text-[9px] text-white/30">+{m.participants.length - 4}</div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {detail && !inCall && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 bg-black/40" onClick={() => setSelected(null)}
            />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-80 bg-[#0f0f0f] border-l border-white/[0.06] z-40 overflow-y-auto p-5 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-semibold text-white/80">{detail.title}</h2>
                <button onClick={() => setSelected(null)} className="text-white/20 hover:text-white/60 transition text-lg leading-none">✕</button>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${STATUS_STYLES[detail.status] || "text-white/30 bg-white/5"}`}>{detail.status}</span>
              </div>
              <div className="space-y-3 mb-5">
                {[
                  ["Date", new Date(detail.date).toLocaleDateString()],
                  ["Time", detail.time],
                  ["Duration", `${detail.duration} min`],
                ].map(([l, v]) => (
                  <div key={l} className="flex items-center justify-between py-2 border-b border-white/[0.03]">
                    <span className={lx}>{l}</span>
                    <span className="text-xs text-white/60">{v}</span>
                  </div>
                ))}
              </div>
              <div className={lx + " mb-2"}>Participants ({detail.participants.length})</div>
              <div className="flex flex-wrap gap-2 mb-4">
                {detail.participants.map((p, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                    <Avatar initials={p} index={i} />
                    <span className="text-[10px] text-white/50">User {p}</span>
                  </div>
                ))}
              </div>
              {detail.description && (
                <>
                  <div className={lx}>Description</div>
                  <div className="text-xs text-white/50 mb-4">{detail.description}</div>
                </>
              )}
              {detail.status !== "Ended" && (
                <button onClick={handleJoin}
                  className="w-full py-2 text-xs font-medium rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/20 transition"
                >📹 Join Meeting</button>
              )}
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
              <h3 className="text-base font-semibold text-white/90 mb-4">Schedule Meeting</h3>
              <div className="space-y-3">
                <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Meeting title" className={ix} autoFocus />
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} className={ix} />
                  <input type="time" value={form.time} onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))} className={ix} />
                </div>
                <select value={form.duration} onChange={(e) => setForm((p) => ({ ...p, duration: Number(e.target.value) }))} className={ix}>
                  {[15, 30, 45, 60, 90, 120].map((d) => (
                    <option key={d} value={d}>{d} minutes</option>
                  ))}
                </select>
                <input value={form.participants} onChange={(e) => setForm((p) => ({ ...p, participants: e.target.value }))}
                  placeholder="Participants (comma-separated initials)" className={ix} />
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 py-2 text-xs rounded-lg border border-white/[0.06] text-white/40 hover:text-white/70 transition"
                >Cancel</button>
                <button onClick={handleSchedule}
                  className="flex-1 py-2 text-xs font-medium rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/20 transition"
                >Schedule</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
