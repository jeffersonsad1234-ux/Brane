import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "../../hooks/useLocalStorage";

const UID = () => Math.random().toString(36).slice(2, 9);

const mockDocs = [
  { id: UID(), title: "BRANPY Vision 2026", body: "Our mission is to democratize artificial intelligence for creators worldwide. The BRANPY ecosystem brings together cutting-edge tools for content generation, brand management, and creative automation. We believe in a future where anyone can produce professional-grade work without traditional barriers.", date: "2026-05-20" },
  { id: UID(), title: "Market Analysis Q2", body: "The AI content creation market has grown 340% year-over-year. Key trends include multimodal generation, real-time collaboration, and edge deployment. BRANPY is positioned at the intersection of these trends with our modular architecture.", date: "2026-05-18" },
  { id: UID(), title: "Product Roadmap", body: "Q3 priorities: launch mobile companion app, expand API surface area, introduce team workspaces. Q4: enterprise SSO, advanced analytics dashboard, and the BRANPY marketplace for third-party plugins.", date: "2026-05-15" },
];

const aiSnippets = [
  "\n\nThe convergence of generative AI and creative workflows represents a paradigm shift in content production. By 2027, over 60% of digital content will incorporate AI-assisted creation at some stage.",
  "\n\nKey success metrics include user retention, daily active creators, and ecosystem expansion. Early indicators suggest strong product-market fit across all verticals.",
  "\n\nStrategic recommendations: invest in community building, reduce friction in cross-module workflows, and establish strategic partnerships with distribution platforms.",
];

export default function DocumentsAI() {
  const [docs, setDocs] = useLocalStorage("branpy-docs", mockDocs);
  const [currentId, setCurrentId] = useState(docs[0]?.id || null);
  const [title, setTitle] = useState(docs[0]?.title || "");
  const [body, setBody] = useState(docs[0]?.body || "");

  const currentDoc = docs.find((d) => d.id === currentId);

  const selectDoc = (id) => {
    const doc = docs.find((d) => d.id === id);
    if (doc) {
      setCurrentId(doc.id);
      setTitle(doc.title);
      setBody(doc.body);
    }
  };

  const saveCurrent = () => {
    if (!currentId) return;
    setDocs((prev) => prev.map((d) => d.id === currentId ? { ...d, title, body, date: new Date().toISOString().slice(0, 10) } : d));
  };

  const newDocument = () => {
    const doc = { id: UID(), title: "Untitled Document", body: "", date: new Date().toISOString().slice(0, 10) };
    setDocs((prev) => [doc, ...prev]);
    setCurrentId(doc.id);
    setTitle(doc.title);
    setBody(doc.body);
  };

  const deleteDocument = () => {
    if (!currentId) return;
    setDocs((prev) => prev.filter((d) => d.id !== currentId));
    const remaining = docs.filter((d) => d.id !== currentId);
    if (remaining.length > 0) {
      selectDoc(remaining[0].id);
    } else {
      setCurrentId(null);
      setTitle("");
      setBody("");
    }
  };

  const aiGenerate = () => {
    const snippet = aiSnippets[Math.floor(Math.random() * aiSnippets.length)];
    setBody((prev) => prev + snippet);
    saveCurrent();
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#0a0a0a] text-white/50 select-none overflow-hidden">
      <div className="h-9 flex-shrink-0 flex items-center px-4 border-b border-white/[0.06]">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20">Documents AI</span>
        <div className="flex-1" />
        <span className="text-[8px] text-white/10 font-mono">{docs.length} docs</span>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="w-56 flex-shrink-0 border-r border-white/[0.06] flex flex-col overflow-y-auto">
          <div className="p-3 border-b border-white/[0.06]">
            <motion.button whileTap={{ scale: 0.97 }} onClick={newDocument} className="w-full py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-[9px] text-white/30 hover:text-white/50 transition-all">
              + New Document
            </motion.button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <AnimatePresence initial={false}>
              {docs.map((doc) => (
                <motion.div key={doc.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} onClick={() => selectDoc(doc.id)} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${doc.id === currentId ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"}`}>
                  <div className="w-6 h-6 rounded-lg bg-white/[0.04] flex items-center justify-center text-xs flex-shrink-0">📄</div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] text-white/50 truncate">{doc.title}</div>
                    <div className="text-[8px] text-white/15">{doc.date}</div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          {currentDoc ? (
            <>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={saveCurrent}
                  className="w-full bg-transparent text-lg font-semibold text-white/70 outline-none placeholder:text-white/10"
                  placeholder="Document title"
                />
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  onBlur={saveCurrent}
                  rows={16}
                  className="w-full bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3 text-[11px] text-white/50 outline-none resize-none placeholder:text-white/10 focus:border-white/[0.12] transition-colors leading-relaxed"
                  placeholder="Start writing..."
                />
              </div>
              <div className="h-10 flex-shrink-0 border-t border-white/[0.06] flex items-center px-4 gap-2">
                <motion.button whileTap={{ scale: 0.97 }} onClick={aiGenerate} className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400/80 text-[9px] font-semibold hover:bg-emerald-500/30 transition-all">
                  AI Generate
                </motion.button>
                <div className="flex-1" />
                <motion.button whileTap={{ scale: 0.97 }} onClick={deleteDocument} className="px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/25 text-red-400/60 text-[9px] hover:bg-red-500/25 transition-all">
                  Delete
                </motion.button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[10px] text-white/10">No document selected</div>
          )}
        </div>
      </div>
    </div>
  );
}
