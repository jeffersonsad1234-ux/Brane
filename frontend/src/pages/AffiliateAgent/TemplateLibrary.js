import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIES = ["All", "Video", "Image", "Site", "Design", "Document", "Social"];

const MOCK_TEMPLATES = [
  { id: 1, name: "Product Showcase", icon: "🎬", type: "Video", duration: "30s", category: "Video", tags: ["ecommerce", "ads"], description: "Dynamic product showcase template with smooth transitions and call-to-action overlay. Perfect for social media ads and promotional content." },
  { id: 2, name: "Brand Intro", icon: "✨", type: "Video", duration: "15s", category: "Video", tags: ["branding", "intro"], description: "Animated brand intro with customizable colors, logo placement, and modern typography animations. Great for YouTube and Instagram." },
  { id: 3, name: "Instagram Story", icon: "📸", type: "Image", duration: "1080×1920", category: "Image", tags: ["social", "story"], description: "Engaging Instagram story template with poll stickers, countdown timers, and swipe-up call-to-action. Fully customizable." },
  { id: 4, name: "Product Grid", icon: "🖼", type: "Image", duration: "1920×1080", category: "Image", tags: ["ecommerce", "grid"], description: "Clean product grid layout for ecommerce featuring zoom-on-hover effects and quick-add functionality. Optimized for conversions." },
  { id: 5, name: "Landing Page", icon: "🌐", type: "Site", duration: "Full", category: "Site", tags: ["marketing", "conversion"], description: "High-converting landing page template with hero section, feature grid, client testimonials, pricing table, and optimized footer." },
  { id: 6, name: "Portfolio Site", icon: "👤", type: "Site", duration: "Multi-page", category: "Site", tags: ["creative", "portfolio"], description: "Elegant portfolio website for creatives with project gallery, about section, skills timeline, and integrated contact form." },
  { id: 7, name: "Business Card", icon: "💳", type: "Design", duration: "3.5×2in", category: "Design", tags: ["print", "corporate"], description: "Modern business card design with dual-color scheme, QR code spot, minimalist layout, and optional foil accent finish." },
  { id: 8, name: "Social Banner", icon: "🎨", type: "Design", duration: "1500×500", category: "Design", tags: ["social", "banner"], description: "Versatile social media banner template for LinkedIn, Twitter, and Facebook. Includes text overlay and brand guidelines." },
  { id: 9, name: "Invoice Template", icon: "📄", type: "Document", duration: "A4", category: "Document", tags: ["finance", "business"], description: "Professional invoice template with auto-calculating totals, tax fields, payment terms, and company branding section." },
  { id: 10, name: "Proposal Deck", icon: "📑", type: "Document", duration: "10 slides", category: "Document", tags: ["sales", "pitch"], description: "Client proposal deck with cover page, problem/solution slides, pricing table, case study, timeline, and next steps." },
  { id: 11, name: "TikTok Post", icon: "🎵", type: "Social", duration: "9:16", category: "Social", tags: ["viral", "short"], description: "Trendy TikTok video template with caption overlays, transition effects, trending audio placeholder, and hashtag suggestions." },
  { id: 12, name: "LinkedIn Carousel", icon: "📊", type: "Social", duration: "5 slides", category: "Social", tags: ["professional", "carousel"], description: "Thought leadership carousel for LinkedIn with data points, quotes, brand color scheme, and engagement-driven CTA slide." },
  { id: 13, name: "Email Newsletter", icon: "✉️", type: "Design", duration: "600px", category: "Design", tags: ["email", "marketing"], description: "Responsive email newsletter template with hero image, product grid, social links, and unsubscribe footer. Works across all clients." },
  { id: 14, name: "YouTube Thumbnail", icon: "▶️", type: "Image", duration: "1280×720", category: "Image", tags: ["youtube", "clickable"], description: "Eye-catching YouTube thumbnail template with bold text overlay, face frame, arrows, and brand watermark position." },
  { id: 15, name: "Coming Soon Page", icon: "⏳", type: "Site", duration: "Single", category: "Site", tags: ["launch", "email"], description: "Sleek coming soon page with countdown timer, email signup form, social links, and animated background effects." },
  { id: 16, name: "Pitch Deck", icon: "📈", type: "Document", duration: "8 slides", category: "Document", tags: ["investor", "startup"], description: "Investor-ready pitch deck with problem statement, solution, market size, traction, team, financials, and ask slide." },
];

const cx = "rounded-xl border border-white/[0.06] bg-white/[0.02] p-4";
const ix = "w-full bg-white/5 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/20 outline-none focus:border-cyan-500/40 focus:bg-white/[0.08] transition";

const typeBadge = { Video: "bg-rose-500/15 text-rose-400", Image: "bg-blue-500/15 text-blue-400", Site: "bg-emerald-500/15 text-emerald-400", Design: "bg-violet-500/15 text-violet-400", Document: "bg-amber-500/15 text-amber-400", Social: "bg-cyan-500/15 text-cyan-400" };

export default function TemplateLibrary() {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [favorites, setFavorites] = useState([]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return MOCK_TEMPLATES.filter((t) => {
      const m = t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.tags.some((tag) => tag.includes(q));
      return category === "All" ? m : m && t.category === category;
    });
  }, [search, category]);

  const toggleFavorite = useCallback((id) => {
    setFavorites((prev) => prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]);
  }, []);

  const categoryCounts = useMemo(() => {
    const counts = { All: MOCK_TEMPLATES.length };
    CATEGORIES.filter((c) => c !== "All").forEach((c) => {
      counts[c] = MOCK_TEMPLATES.filter((t) => t.category === c).length;
    });
    return counts;
  }, []);

  return (
    <div className="flex-1 min-h-0 bg-[#0a0a0a] p-4 md:p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white/90 tracking-tight">Template Library</h1>
          <div className="text-[11px] text-white/20">{MOCK_TEMPLATES.length} templates</div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input placeholder="Search templates..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-60 bg-white/5 border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-white/70 placeholder-white/20 outline-none focus:border-cyan-500/40 transition"
          />
          <div className="flex gap-1 bg-white/[0.03] border border-white/[0.06] rounded-lg p-1 flex-wrap">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCategory(c)}
                className={`px-2.5 py-1 text-[10px] rounded-md font-medium transition ${category === c ? "bg-cyan-500/20 text-cyan-400" : "text-white/30 hover:text-white/60"}`}
              >{c} <span className="text-white/20 ml-0.5">({categoryCounts[c]})</span></button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className={cx + " cursor-pointer hover:bg-white/[0.04] transition group relative"}
              onClick={() => setSelected(t)}
            >
              <button onClick={(e) => { e.stopPropagation(); toggleFavorite(t.id); }}
                className={`absolute top-3 right-3 text-sm transition ${favorites.includes(t.id) ? "text-amber-400" : "text-white/10 opacity-0 group-hover:opacity-100"}`}
              >{favorites.includes(t.id) ? "★" : "☆"}</button>
              <div className="text-3xl mb-3 text-center">{t.icon}</div>
              <h3 className="text-sm font-semibold text-white/80 mb-1 truncate">{t.name}</h3>
              <div className="flex items-center gap-2 justify-center flex-wrap">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${typeBadge[t.type]}`}>{t.type}</span>
                <span className="text-[10px] text-white/30">{t.duration}</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-2 justify-center">
                {t.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="text-[8px] uppercase tracking-wider px-1 py-0.5 rounded bg-white/[0.04] text-white/25">{tag}</span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-16 text-white/20 text-sm">No templates match your search</div>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          >
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }} onClick={(e) => e.stopPropagation()}
              className="bg-[#0f0f0f] border border-white/[0.06] rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="text-4xl">{selected.icon}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white/90">{selected.name}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${typeBadge[selected.type]}`}>{selected.type}</span>
                    <span className="text-[11px] text-white/30">{selected.duration}</span>
                    <span className="text-[11px] text-white/20">{selected.category}</span>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="text-white/20 hover:text-white/60 transition text-lg leading-none">✕</button>
              </div>
              <p className="text-xs text-white/50 leading-relaxed mb-4">{selected.description}</p>
              <div className="flex flex-wrap gap-1 mb-5">
                {selected.tags.map((tag) => (
                  <span key={tag} className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.04] text-white/30">{tag}</span>
                ))}
              </div>
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl h-48 flex items-center justify-center mb-5 relative overflow-hidden">
                <span className="text-6xl opacity-20">{selected.icon}</span>
                <div className="absolute inset-0 bg-gradient-to-t from-white/[0.02] to-transparent" />
                <span className="absolute bottom-3 right-3 text-[9px] text-white/15">{selected.duration} · {selected.type}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggleFavorite(selected.id)}
                  className={`px-4 py-2.5 text-[11px] rounded-lg border transition ${favorites.includes(selected.id) ? "bg-amber-500/15 text-amber-400 border-amber-500/20" : "border-white/[0.06] text-white/40 hover:text-white/70"}`}
                >{favorites.includes(selected.id) ? "★ Favorited" : "☆ Favorite"}</button>
                <button onClick={() => {}}
                  className="flex-1 py-2.5 text-[11px] font-medium rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/20 transition"
                >Use Template</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
