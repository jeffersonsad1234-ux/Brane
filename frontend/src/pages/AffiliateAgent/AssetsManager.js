import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "../../hooks/useLocalStorage";

const cx = "rounded-xl border border-white/[0.06] bg-white/[0.02] p-4";
const lx = "text-[11px] text-white/30 uppercase tracking-wider mb-1";
const ix = "w-full bg-white/5 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/20 outline-none focus:border-cyan-500/40 focus:bg-white/[0.08] transition";

const CATEGORIES = ["All", "Images", "Videos", "Audio", "Documents", "Fonts"];
const ICONS = { Images: "🖼️", Videos: "🎬", Audio: "🎵", Documents: "📄", Fonts: "🔤" };
const CAT_COLORS = { Images: "text-blue-400 bg-blue-500/10", Videos: "text-purple-400 bg-purple-500/10", Audio: "text-pink-400 bg-pink-500/10", Documents: "text-amber-400 bg-amber-500/10", Fonts: "text-emerald-400 bg-emerald-500/10" };

const MOCK_ASSETS = [
  { id: 1, name: "hero-banner.jpg", type: "Images", size: "2.4 MB", date: "2026-05-20", icon: "🖼️" },
  { id: 2, name: "product-demo.mp4", type: "Videos", size: "45 MB", date: "2026-05-19", icon: "🎬" },
  { id: 3, name: "background-music.mp3", type: "Audio", size: "5.1 MB", date: "2026-05-18", icon: "🎵" },
  { id: 4, name: "brand-guidelines.pdf", type: "Documents", size: "1.2 MB", date: "2026-05-17", icon: "📄" },
  { id: 5, name: "inter-variable.woff2", type: "Fonts", size: "180 KB", date: "2026-05-16", icon: "🔤" },
  { id: 6, name: "logo-dark.png", type: "Images", size: "340 KB", date: "2026-05-15", icon: "🖼️" },
  { id: 7, name: "intro-animation.mp4", type: "Videos", size: "28 MB", date: "2026-05-14", icon: "🎬" },
  { id: 8, name: "voiceover-final.wav", type: "Audio", size: "12.6 MB", date: "2026-05-13", icon: "🎵" },
  { id: 9, name: "contract-template.docx", type: "Documents", size: "89 KB", date: "2026-05-12", icon: "📄" },
  { id: 10, name: "space-grotesk.woff2", type: "Fonts", size: "210 KB", date: "2026-05-11", icon: "🔤" },
  { id: 11, name: "social-card.png", type: "Images", size: "1.1 MB", date: "2026-05-10", icon: "🖼️" },
  { id: 12, name: "testimonial-clip.mp4", type: "Videos", size: "62 MB", date: "2026-05-09", icon: "🎬" },
];

const fmtDate = (d) => new Date(d).toLocaleDateString();
const fmtSize = (s) => {
  if (s.includes("MB")) return parseFloat(s) * 1024;
  if (s.includes("KB")) return parseFloat(s);
  return 0;
};

const totalStorage = 250;
const iconMap = { "🖼️": "🖼️", "🎬": "🎬", "🎵": "🎵", "📄": "📄", "🔤": "🔤" };

export default function AssetsManager() {
  const [assets, setAssets] = useLocalStorage("brane_assets", MOCK_ASSETS);
  const [viewMode, setViewMode] = useState("grid");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState(null);
  const [uploading, setUploading] = useState(false);

  const filtered = useMemo(() => {
    let list = assets;
    if (category !== "All") list = list.filter((a) => a.type === category);
    if (search.trim()) list = list.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [assets, category, search]);

  const usedStorage = useMemo(() => assets.reduce((s, a) => s + fmtSize(a.size), 0), [assets]);
  const usedMB = Math.round(usedStorage / 10.24) / 100;
  const pct = Math.min(100, Math.round((usedMB / totalStorage) * 100));

  const handleUpload = useCallback(() => {
    setUploading(true);
    setTimeout(() => {
      setAssets((p) => {
        const n = p.length + 1;
        const types = ["Images", "Videos", "Audio", "Documents", "Fonts"];
        const type = types[n % types.length];
        return [{ id: Date.now(), name: `upload-${n}.${type === "Images" ? "png" : type === "Videos" ? "mp4" : type === "Audio" ? "mp3" : type === "Fonts" ? "woff2" : "pdf"}`, type, size: `${Math.floor(Math.random() * 10 + 1)} MB`, date: new Date().toISOString().slice(0, 10), icon: ICONS[type] }, ...p];
      });
      setUploading(false);
    }, 800);
  }, [setAssets]);

  const detail = useMemo(() => assets.find((a) => a.id === selected), [assets, selected]);

  return (
    <div className="flex-1 min-h-0 bg-[#0a0a0a] p-4 md:p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white/90 tracking-tight">Assets</h1>
          <button onClick={handleUpload} disabled={uploading}
            className="px-4 py-1.5 text-[11px] font-medium rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/20 transition disabled:opacity-50"
          >{uploading ? "Uploading..." : "+ Upload"}</button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 text-xs">🔍</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assets..." className={ix + " pl-8"} />
          </div>
          <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded-lg p-1">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCategory(c)}
                className={`px-3 py-1 text-[11px] rounded-md font-medium transition ${category === c ? "bg-cyan-500/20 text-cyan-400" : "text-white/30 hover:text-white/60"}`}
              >{c}</button>
            ))}
          </div>
          <div className="flex bg-white/[0.03] border border-white/[0.06] rounded-lg p-1">
            {["grid", "list"].map((v) => (
              <button key={v} onClick={() => setViewMode(v)}
                className={`px-2.5 py-1 text-xs rounded-md transition ${viewMode === v ? "bg-white/10 text-white/80" : "text-white/30 hover:text-white/60"}`}
              >{v === "grid" ? "▦" : "☰"}</button>
            ))}
          </div>
        </div>

        {viewMode === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            <AnimatePresence>
              {filtered.map((asset) => (
                <motion.div key={asset.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  onClick={() => setSelected(asset.id)}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 hover:border-cyan-500/30 hover:bg-white/[0.04] transition cursor-pointer group text-center"
                >
                  <div className="text-3xl mb-2">{iconMap[asset.icon] || "📁"}</div>
                  <div className="text-xs text-white/70 truncate mb-1.5">{asset.name}</div>
                  <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded-full ${CAT_COLORS[asset.type] || "text-white/30 bg-white/5"}`}>{asset.type}</span>
                  <div className="text-[10px] text-white/30 mt-1.5">{asset.size} · {fmtDate(asset.date)}</div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className={cx + " overflow-x-auto"}>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-white/30 text-[10px] uppercase tracking-wider border-b border-white/[0.06]">
                  <th className="text-left py-2 pr-2 w-8"></th>
                  <th className="text-left py-2 pr-2">Name</th>
                  <th className="text-left py-2 pr-2">Type</th>
                  <th className="text-left py-2 pr-2">Size</th>
                  <th className="text-left py-2 pr-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((asset) => (
                  <tr key={asset.id} onClick={() => setSelected(asset.id)}
                    className="border-b border-white/[0.03] hover:bg-white/[0.02] cursor-pointer transition"
                  >
                    <td className="py-2.5 pr-2 text-base">{iconMap[asset.icon] || "📁"}</td>
                    <td className="py-2.5 pr-2 text-white/70 font-medium">{asset.name}</td>
                    <td className="py-2.5 pr-2"><span className={`text-[9px] px-1.5 py-0.5 rounded-full ${CAT_COLORS[asset.type] || "text-white/30 bg-white/5"}`}>{asset.type}</span></td>
                    <td className="py-2.5 pr-2 text-white/40">{asset.size}</td>
                    <td className="py-2.5 pr-2 text-white/30 whitespace-nowrap">{fmtDate(asset.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="flex items-center justify-center h-32 text-xs text-white/20">No assets found</div>
        )}

        <div className={cx + " flex items-center gap-4"}>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className={lx}>Storage</span>
              <span className="text-[10px] text-white/40">{usedMB.toFixed(1)} MB / {totalStorage} MB</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }}
                className="h-full rounded-full bg-cyan-500/70" />
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-white/60 font-medium">{assets.length} files</div>
            <div className="text-[10px] text-white/30">{pct}% used</div>
          </div>
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
                <h2 className="text-sm font-semibold text-white/80">Asset Details</h2>
                <button onClick={() => setSelected(null)} className="text-white/20 hover:text-white/60 transition text-lg leading-none">✕</button>
              </div>
              <div className="flex flex-col items-center mb-6">
                <div className="text-5xl mb-3">{iconMap[detail.icon] || "📁"}</div>
                <div className="text-sm text-white/70 font-medium text-center break-all">{detail.name}</div>
              </div>
              <div className="space-y-3">
                {[
                  ["Type", detail.type],
                  ["Size", detail.size],
                  ["Date Added", fmtDate(detail.date)],
                ].map(([l, v]) => (
                  <div key={l} className="flex items-center justify-between py-2 border-b border-white/[0.03]">
                    <span className={lx}>{l}</span>
                    <span className="text-xs text-white/60">{v}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => {}}
                className="w-full mt-6 py-2 text-xs font-medium rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/20 transition"
              >⬇ Download</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
