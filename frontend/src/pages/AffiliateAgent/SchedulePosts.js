import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "../../hooks/useLocalStorage";

const PLATFORMS = ["Instagram", "TikTok", "YouTube", "Twitter"];
const PLATFORM_COLORS = { Instagram: "bg-pink-500/20 text-pink-400", TikTok: "bg-blue-500/20 text-blue-400", YouTube: "bg-red-500/20 text-red-400", Twitter: "bg-sky-500/20 text-sky-400" };

const MOCK_POSTS = [
  { id: 1, title: "Product Launch Teaser", platform: "Instagram", scheduledAt: "2026-05-25T10:00", status: "Scheduled" },
  { id: 2, title: "Behind the Scenes", platform: "TikTok", scheduledAt: "2026-05-26T14:00", status: "Scheduled" },
  { id: 3, title: "Tutorial: Getting Started", platform: "YouTube", scheduledAt: "2026-05-20T09:00", status: "Published" },
  { id: 4, title: "Weekly Tips Thread", platform: "Twitter", scheduledAt: "2026-05-22T11:00", status: "Published" },
  { id: 5, title: "Customer Spotlight", platform: "Instagram", scheduledAt: "2026-05-28T16:00", status: "Draft" },
  { id: 6, title: "Q&A Livestream Reminder", platform: "YouTube", scheduledAt: "2026-05-30T18:00", status: "Scheduled" },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const cx = "rounded-xl border border-white/[0.06] bg-white/[0.02] p-4";
const lx = "text-[11px] text-white/30 uppercase tracking-wider mb-1";
const ix = "w-full bg-white/5 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/20 outline-none focus:border-cyan-500/40 focus:bg-white/[0.08] transition";

export default function SchedulePosts() {
  const [posts, setPosts] = useLocalStorage("brane_schedule_posts", MOCK_POSTS);
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", platform: "Instagram", date: "", time: "" });

  const stats = useMemo(() => {
    const scheduled = posts.filter((p) => p.status === "Scheduled").length;
    const published = posts.filter((p) => p.status === "Published").length;
    const drafts = posts.filter((p) => p.status === "Draft").length;
    return { scheduled, published, drafts };
  }, [posts]);

  const calendar = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [currentMonth, currentYear]);

  const postDates = useMemo(() => {
    const set = new Set();
    posts.forEach((p) => {
      const d = new Date(p.scheduledAt);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) set.add(d.getDate());
    });
    return set;
  }, [posts, currentMonth, currentYear]);

  const handleSchedule = useCallback(() => {
    if (!form.title.trim() || !form.date || !form.time) return;
    setPosts((prev) => [{ id: Date.now(), title: form.title, platform: form.platform, scheduledAt: `${form.date}T${form.time}`, status: "Scheduled" }, ...prev]);
    setForm({ title: "", content: "", platform: "Instagram", date: "", time: "" });
    setShowModal(false);
  }, [form, setPosts]);

  const statusBadge = (s) => {
    if (s === "Scheduled") return "bg-blue-500/15 text-blue-400";
    if (s === "Published") return "bg-emerald-500/15 text-emerald-400";
    return "bg-white/[0.06] text-white/40";
  };

  return (
    <div className="flex-1 min-h-0 bg-[#0a0a0a] p-4 md:p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white/90 tracking-tight">Schedule Posts</h1>
          <button onClick={() => setShowModal(true)}
            className="px-4 py-1.5 text-[11px] font-medium rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/20 transition"
          >+ Schedule Post</button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Scheduled", value: stats.scheduled, color: "text-blue-400" },
            { label: "Published", value: stats.published, color: "text-emerald-400" },
            { label: "Drafts", value: stats.drafts, color: "text-white/50" },
          ].map((card) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cx}>
              <div className={lx}>{card.label}</div>
              <div className={`text-2xl font-semibold ${card.color}`}>{card.value}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className={cx}>
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1); } else setCurrentMonth((m) => m - 1); }}
                className="text-white/30 hover:text-white/60 transition text-xs"
              >◀</button>
              <span className="text-sm font-medium text-white/70">{MONTHS[currentMonth]} {currentYear}</span>
              <button onClick={() => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1); } else setCurrentMonth((m) => m + 1); }}
                className="text-white/30 hover:text-white/60 transition text-xs"
              >▶</button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {DAYS.map((d) => (
                <div key={d} className="text-[9px] text-white/20 text-center uppercase tracking-wider py-1">{d}</div>
              ))}
              {calendar.map((day, i) => (
                <div key={i} className="relative text-center py-2 text-xs">
                  {day !== null ? (
                    <>
                      <span className="text-white/40">{day}</span>
                      {postDates.has(day) && <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                    </>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className={cx + " max-h-80 overflow-y-auto"}>
            <h2 className="text-sm font-medium text-white/70 mb-3">Upcoming Posts</h2>
            <div className="space-y-2">
              {posts.map((post) => (
                <div key={post.id} className="flex items-center justify-between py-2 border-b border-white/[0.03] last:border-0">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-white/70 truncate">{post.title}</div>
                    <div className="text-[10px] text-white/30 mt-0.5">{new Date(post.scheduledAt).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded-full ${PLATFORM_COLORS[post.platform]}`}>{post.platform}</span>
                    <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded-full ${statusBadge(post.status)}`}>{post.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={cx}>
          <h2 className="text-sm font-medium text-white/70 mb-3">All Posts</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-white/30 text-[10px] uppercase tracking-wider border-b border-white/[0.06]">
                  <th className="text-left py-2 pr-2">Title</th>
                  <th className="text-left py-2 pr-2">Platform</th>
                  <th className="text-left py-2 pr-2">Scheduled Time</th>
                  <th className="text-left py-2 pr-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <td className="py-2.5 pr-2 text-white/70 font-medium">{post.title}</td>
                    <td className="py-2.5 pr-2">
                      <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium ${PLATFORM_COLORS[post.platform]}`}>{post.platform}</span>
                    </td>
                    <td className="py-2.5 pr-2 text-white/40">{new Date(post.scheduledAt).toLocaleString()}</td>
                    <td className="py-2.5 pr-2">
                      <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full ${statusBadge(post.status)}`}>{post.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
              <h3 className="text-base font-semibold text-white/90 mb-4">Schedule Post</h3>
              <div className="space-y-3">
                <input placeholder="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className={ix} />
                <textarea placeholder="Content" rows={3} value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} className={ix + " resize-none"} />
                <select value={form.platform} onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))} className={ix}>
                  {PLATFORMS.map((p) => (<option key={p} value={p}>{p}</option>))}
                </select>
                <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className={ix} />
                <input type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} className={ix} />
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
