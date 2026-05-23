import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "../../hooks/useLocalStorage";

const PLATFORMS = [
  { id: "instagram", label: "Instagram", color: "from-pink-500 to-rose-500" },
  { id: "tiktok", label: "TikTok", color: "from-gray-700 to-gray-900" },
  { id: "youtube", label: "YouTube", color: "from-red-500 to-red-600" },
  { id: "twitter", label: "Twitter", color: "from-sky-400 to-blue-500" },
];

const MOCK_POSTS = [
  { id: 1, content: "Check out our latest product launch! 🚀 Exclusive discounts for early adopters. Grab yours now before they're gone!", platforms: ["instagram", "twitter"], image: "product-launch.jpg", link: "", scheduledAt: null, status: "Published", createdAt: "2026-05-20T10:30:00" },
  { id: 2, content: "Behind the scenes at today's photoshoot. Amazing energy from the team! 📸", platforms: ["instagram", "tiktok"], image: "behind-scenes.jpg", link: "https://example.com/bts", scheduledAt: "2026-05-22T14:00:00", status: "Scheduled", createdAt: "2026-05-19T09:00:00" },
  { id: 3, content: "New tutorial coming soon — mastering color grading in under 10 minutes. Stay tuned for pro tips!", platforms: ["youtube"], image: "", link: "", scheduledAt: null, status: "Draft", createdAt: "2026-05-18T16:45:00" },
  { id: 4, content: "Flash sale this weekend! Use code FLASH20 for 20% off. Don't miss out on these amazing deals!", platforms: ["instagram", "twitter", "tiktok"], image: "", link: "https://example.com/sale", scheduledAt: null, status: "Failed", createdAt: "2026-05-17T08:15:00" },
  { id: 5, content: "We hit 10K followers! Thank you all for the incredible support. More exciting content coming your way 🎉", platforms: ["instagram", "twitter", "youtube"], image: "", link: "", scheduledAt: "2026-05-25T12:00:00", status: "Scheduled", createdAt: "2026-05-16T14:20:00" },
  { id: 6, content: "Quick tip: Always use consistent branding across all platforms to build recognition. Your logo, colors, and tone matter!", platforms: ["twitter", "tiktok"], image: "", link: "https://example.com/brand-guide", scheduledAt: null, status: "Published", createdAt: "2026-05-15T11:00:00" },
];

const cx = "rounded-xl border border-white/[0.06] bg-white/[0.02] p-4";
const lx = "text-[11px] text-white/30 uppercase tracking-wider mb-1";
const ix = "w-full bg-white/5 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/20 outline-none focus:border-cyan-500/40 focus:bg-white/[0.08] transition";

const statusStyles = { Published: "bg-emerald-500/15 text-emerald-400", Scheduled: "bg-cyan-500/15 text-cyan-400", Draft: "bg-amber-500/15 text-amber-400", Failed: "bg-red-500/15 text-red-400" };
const platformIcons = { instagram: "📷", tiktok: "🎵", youtube: "▶️", twitter: "🐦" };

export default function SocialPublisher() {
  const [posts, setPosts] = useLocalStorage("brane_social_posts", MOCK_POSTS);
  const [connected, setConnected] = useState({ instagram: true, tiktok: false, youtube: true, twitter: true });
  const [content, setContent] = useState("");
  const [link, setLink] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState(["instagram"]);
  const [scheduleMode, setScheduleMode] = useState("now");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  const togglePlatform = (id) => {
    setSelectedPlatforms((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);
  };

  const toggleConnected = (id) => {
    setConnected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const deletePost = useCallback((id) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }, [setPosts]);

  const publish = useCallback((status) => {
    if (!content.trim() || selectedPlatforms.length === 0) return;
    const scheduledAt = scheduleMode === "later" && scheduleDate && scheduleTime ? `${scheduleDate}T${scheduleTime}` : null;
    setPosts((prev) => [{
      id: Date.now(), content, platforms: selectedPlatforms, image: "", link, scheduledAt, status: scheduleMode === "later" ? "Scheduled" : status, createdAt: new Date().toISOString(),
    }, ...prev]);
    setContent("");
    setLink("");
    setSelectedPlatforms(["instagram"]);
    setScheduleMode("now");
    setScheduleDate("");
    setScheduleTime("");
  }, [content, selectedPlatforms, scheduleMode, scheduleDate, scheduleTime, setPosts]);

  const charCount = content.length;

  return (
    <div className="flex-1 min-h-0 bg-[#0a0a0a] p-4 md:p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white/90 tracking-tight">Social Publisher</h1>
        </div>

        <div className="flex gap-2 flex-wrap">
          {PLATFORMS.map((p) => (
            <button key={p.id} onClick={() => toggleConnected(p.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] font-medium transition ${connected[p.id] ? "bg-gradient-to-r " + p.color + " text-white border-transparent" : "bg-white/[0.03] border-white/[0.06] text-white/30"}`}
            >
              <span>{platformIcons[p.id]}</span>
              <span>{p.label}</span>
              <span className={`ml-1 w-1.5 h-1.5 rounded-full ${connected[p.id] ? "bg-white/60" : "bg-white/10"}`} />
            </button>
          ))}
        </div>

        <div className={cx + " space-y-4"}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-white/70">Composer</h3>
            <span className={`text-[10px] ${charCount > 250 ? "text-red-400" : "text-white/20"}`}>{charCount}/500</span>
          </div>
          <textarea placeholder="What would you like to share?" value={content} onChange={(e) => setContent(e.target.value.slice(0, 500))}
            rows={4} className={ix + " resize-none"}
          />
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[140px]">
              <div className={lx}>Image</div>
              <div className="bg-white/5 border border-dashed border-white/[0.06] rounded-lg px-3 py-3 text-center text-[10px] text-white/20 cursor-pointer hover:border-white/20 transition flex flex-col items-center gap-1">
                <span className="text-lg">🖼</span>
                <span>Click to upload (mock)</span>
              </div>
            </div>
            <div className="flex-1 min-w-[140px]">
              <div className={lx}>Link</div>
              <input placeholder="https://..." value={link} onChange={(e) => setLink(e.target.value)} className={ix} />
            </div>
          </div>
          <div>
            <div className={lx}>Platforms ({selectedPlatforms.length} selected)</div>
            <div className="flex flex-wrap gap-2 mt-1">
              {PLATFORMS.map((p) => (
                <label key={p.id} className={`flex items-center gap-1.5 cursor-pointer px-2.5 py-1 rounded-lg border text-[11px] transition ${selectedPlatforms.includes(p.id) ? "border-cyan-500/30 bg-cyan-500/10 text-white/70" : "border-white/[0.06] text-white/30 hover:text-white/50"}`}>
                  <input type="checkbox" checked={selectedPlatforms.includes(p.id)} onChange={() => togglePlatform(p.id)}
                    className="accent-cyan-500 w-3 h-3"
                  />
                  <span>{platformIcons[p.id]} {p.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className={lx}>Schedule</div>
            <div className="flex gap-1 bg-white/[0.03] border border-white/[0.06] rounded-lg p-1">
              <button onClick={() => setScheduleMode("now")}
                className={`px-3 py-1 text-[10px] rounded-md font-medium transition ${scheduleMode === "now" ? "bg-cyan-500/20 text-cyan-400" : "text-white/30 hover:text-white/60"}`}
              >Post Now</button>
              <button onClick={() => setScheduleMode("later")}
                className={`px-3 py-1 text-[10px] rounded-md font-medium transition ${scheduleMode === "later" ? "bg-cyan-500/20 text-cyan-400" : "text-white/30 hover:text-white/60"}`}
              >Schedule</button>
            </div>
            {scheduleMode === "later" && (
              <div className="flex gap-2">
                <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)}
                  className="bg-white/5 border border-white/[0.06] rounded-lg px-2 py-1 text-[11px] text-white/60 outline-none"
                />
                <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)}
                  className="bg-white/5 border border-white/[0.06] rounded-lg px-2 py-1 text-[11px] text-white/60 outline-none"
                />
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => publish("Published")}
              className="px-5 py-1.5 text-[11px] font-medium rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/20 transition disabled:opacity-30"
              disabled={!content.trim() || selectedPlatforms.length === 0}
            >Publish</button>
            <button onClick={() => publish("Draft")}
              className="px-5 py-1.5 text-[11px] rounded-lg border border-white/[0.06] text-white/40 hover:text-white/70 transition disabled:opacity-30"
              disabled={!content.trim()}
            >Save Draft</button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] text-white/30 uppercase tracking-wider">Post History ({posts.length})</span>
          </div>
          <div className="space-y-2">
            {posts.map((post) => (
              <motion.div key={post.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} layout
                className={cx + " flex items-start gap-3 group"}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white/70 line-clamp-2 leading-relaxed">{post.content}</div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <div className="flex gap-0.5">
                      {post.platforms.map((p) => <span key={p} className="text-[11px]" title={p}>{platformIcons[p]}</span>)}
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusStyles[post.status]}`}>{post.status}</span>
                    <span className="text-[10px] text-white/20">{new Date(post.createdAt).toLocaleDateString()}</span>
                    {post.link && <span className="text-[10px] text-cyan-400/50 truncate max-w-[120px]">🔗 {post.link}</span>}
                    {post.scheduledAt && <span className="text-[10px] text-white/30">📅 {new Date(post.scheduledAt).toLocaleDateString()}</span>}
                  </div>
                </div>
                <button onClick={() => deletePost(post.id)}
                  className="text-white/10 hover:text-red-400 transition text-[10px] opacity-0 group-hover:opacity-100 mt-1"
                >✕</button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
