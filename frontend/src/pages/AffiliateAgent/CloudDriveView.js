import React, { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "../../hooks/useLocalStorage";

const FOLDERS = ["My Files", "Shared", "Recent", "Trash"];
const STORAGE_TOTAL = 5 * 1024 * 1024 * 1024;

const FILE_ICONS = { folder: "\u{1F4C1}", image: "\u{1F5BC}\uFE0F", video: "\u{1F3AC}", doc: "\u{1F4C4}", pdf: "\u{1F4D1}", zip: "\u{1F4E6}", audio: "\u{1F3B5}", default: "\u{1F4CE}" };

const MOCK_FILES = [
  { id: 1, name: "Marketing Assets", type: "folder", size: 0, date: Date.now() - 86400000, parent: null },
  { id: 2, name: "Product Photos", type: "folder", size: 0, date: Date.now() - 172800000, parent: null },
  { id: 3, name: "Brand Guidelines.pdf", type: "pdf", size: 2457600, date: Date.now() - 3600000, parent: null },
  { id: 4, name: "Logo Final.png", type: "image", size: 1024000, date: Date.now() - 7200000, parent: null },
  { id: 5, name: "Promo Video.mp4", type: "video", size: 52428800, date: Date.now() - 43200000, parent: null },
  { id: 6, name: "Q2 Report.docx", type: "doc", size: 512000, date: Date.now() - 259200000, parent: null },
  { id: 7, name: "Assets.zip", type: "zip", size: 10485760, date: Date.now() - 604800000, parent: null },
  { id: 8, name: "Voiceover.mp3", type: "audio", size: 3145728, date: Date.now() - 1209600000, parent: "Marketing Assets" },
  { id: 9, name: "Banner Ads", type: "folder", size: 0, date: Date.now() - 86400000, parent: "Marketing Assets" },
  { id: 10, name: "Instagram Story.png", type: "image", size: 204800, date: Date.now() - 43200000, parent: "Banner Ads" },
];

function formatSize(bytes) {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0; let size = bytes;
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

export default function CloudDriveView() {
  const [files, setFiles] = useLocalStorage("branpy_clouddrive", MOCK_FILES);
  const [activeFolder, setActiveFolder] = useState("My Files");
  const [currentDir, setCurrentDir] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [gridView, setGridView] = useState(true);
  const nextId = useMemo(() => Math.max(0, ...files.map((f) => f.id)) + 1, [files]);

  const breadcrumbs = useMemo(() => {
    const crumbs = [{ label: activeFolder, dir: null }];
    if (currentDir) {
      const parts = [];
      let dir = currentDir;
      while (dir) { parts.unshift(dir); const p = files.find((f) => f.name === dir && f.type === "folder" && f.parent !== null); dir = p ? p.parent : null; }
      parts.forEach((p) => crumbs.push({ label: p, dir: p }));
    }
    return crumbs;
  }, [activeFolder, currentDir, files]);

  const visibleFiles = useMemo(() => {
    let list = files;
    if (activeFolder === "Recent") return [...files].filter((f) => f.type !== "folder").sort((a, b) => b.date - a.date).slice(0, 10);
    if (activeFolder === "Trash") return [];
    if (activeFolder === "Shared") return files.filter((f) => f.type !== "folder").slice(0, 3);
    if (currentDir) return files.filter((f) => f.parent === currentDir);
    return files.filter((f) => f.parent === null);
  }, [files, activeFolder, currentDir]);

  const storageUsed = useMemo(() => files.reduce((acc, f) => acc + (f.size || 0), 0), [files]);

  const enterFolder = useCallback((name) => {
    setCurrentDir(name);
    setSelectedFile(null);
  }, []);

  const goToBreadcrumb = useCallback((dir) => {
    setCurrentDir(dir);
    setSelectedFile(null);
  }, []);

  const uploadMockFile = useCallback(() => {
    const types = ["image", "doc", "pdf", "zip", "audio"];
    const t = types[Math.floor(Math.random() * types.length)];
    const file = { id: nextId, name: `File_${nextId}.${t === "image" ? "png" : t === "doc" ? "docx" : t === "pdf" ? "pdf" : t === "zip" ? "zip" : "mp3"}`, type: t, size: Math.floor(Math.random() * 5000000) + 100000, date: Date.now(), parent: currentDir };
    setFiles((prev) => [file, ...prev]);
  }, [nextId, currentDir, setFiles]);

  const deleteFile = useCallback((id, e) => {
    e?.stopPropagation();
    setFiles((prev) => prev.filter((f) => f.id !== id));
    if (selectedFile?.id === id) setSelectedFile(null);
  }, [setFiles, selectedFile]);

  return (
    <div className="flex-1 flex min-h-0 bg-[#0a0a0a]">
      <div className="w-44 flex-shrink-0 border-r border-white/[0.06] p-3 flex flex-col gap-1">
        <button onClick={uploadMockFile} className="w-full flex items-center justify-center gap-1.5 mb-3 px-3 py-2 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-white text-xs font-medium transition-all">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" /></svg>
          Upload
        </button>
        {FOLDERS.map((f) => (
          <button key={f} onClick={() => { setActiveFolder(f); setCurrentDir(null); setSelectedFile(null); }}
            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all ${
              activeFolder === f ? "bg-white/10 text-white/80" : "text-white/40 hover:bg-white/5 hover:text-white/60"
            }`}
          >
            {f === "My Files" ? "\u{1F4C1} " : f === "Shared" ? "\u{1F91D} " : f === "Recent" ? "\u{23F3} " : "\u{1F5D1}\uFE0F "}{f}
          </button>
        ))}
        <div className="mt-auto pt-4">
          <div className="h-1 rounded-full bg-white/5 overflow-hidden mb-1">
            <div className="h-full rounded-full bg-emerald-500/70" style={{ width: `${Math.min(100, (storageUsed / STORAGE_TOTAL) * 100)}%` }} />
          </div>
          <div className="text-[10px] text-white/20 text-center">{formatSize(storageUsed)} / {formatSize(STORAGE_TOTAL)}</div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="h-11 flex items-center gap-2 px-4 border-b border-white/[0.06] flex-shrink-0 overflow-x-auto scrollbar-none">
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="text-white/20 text-[10px]">/</span>}
              <button onClick={() => goToBreadcrumb(crumb.dir)} className={`text-xs whitespace-nowrap ${i === breadcrumbs.length - 1 ? "text-white/60" : "text-white/30 hover:text-white/50"}`}>{crumb.label}</button>
            </React.Fragment>
          ))}
          <div className="flex-1" />
          <button onClick={() => setGridView(true)} className={`p-1 rounded ${gridView ? "text-white/60 bg-white/10" : "text-white/30 hover:text-white/50"}`}>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z" /></svg>
          </button>
          <button onClick={() => setGridView(false)} className={`p-1 rounded ${!gridView ? "text-white/60 bg-white/10" : "text-white/30 hover:text-white/50"}`}>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M3 4h18v2H3zm0 7h18v2H3zm0 7h18v2H3z" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          {gridView ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {visibleFiles.map((file) => (
                <motion.div key={file.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.15 }}
                  onClick={() => { if (file.type === "folder") enterFolder(file.name); else setSelectedFile(file); }}
                  className={`group relative rounded-xl border p-3 cursor-pointer transition-all ${
                    selectedFile?.id === file.id ? "border-emerald-500/40 bg-emerald-500/[0.03]" : "border-white/[0.06] hover:border-white/10 hover:bg-white/[0.02]"
                  }`}
                >
                  <div className="text-2xl mb-2">{FILE_ICONS[file.type] || FILE_ICONS.default}</div>
                  <div className="text-[11px] text-white/70 truncate">{file.name}</div>
                  <div className="text-[10px] text-white/20 mt-1">{formatSize(file.size)}</div>
                  <button onClick={(e) => deleteFile(file.id, e)} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-400/50 hover:text-red-400 text-xs">\u2715</button>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-white/[0.06] overflow-hidden">
              <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-white/[0.06] text-[10px] text-white/30 uppercase tracking-wider">
                <span className="col-span-5">Name</span><span className="col-span-2">Type</span><span className="col-span-3">Date</span><span className="col-span-2 text-right">Size</span>
              </div>
              {visibleFiles.map((file) => (
                <div key={file.id} onClick={() => { if (file.type === "folder") enterFolder(file.name); else setSelectedFile(file); }}
                  className="group grid grid-cols-12 gap-2 px-4 py-2.5 text-xs text-white/50 hover:bg-white/[0.02] cursor-pointer border-b border-white/[0.03] items-center"
                >
                  <span className="col-span-5 flex items-center gap-2 text-white/70 truncate">
                    <span className="text-sm">{FILE_ICONS[file.type] || FILE_ICONS.default}</span>
                    {file.name}
                  </span>
                  <span className="col-span-2 text-white/30 uppercase">{file.type}</span>
                  <span className="col-span-3 text-white/30">{new Date(file.date).toLocaleDateString()}</span>
                  <span className="col-span-2 text-right text-white/30 group-hover:text-white/50">{formatSize(file.size)}</span>
                </div>
              ))}
            </div>
          )}
          {visibleFiles.length === 0 && (
            <div className="flex items-center justify-center h-48 text-xs text-white/20">
              {activeFolder === "Trash" ? "Trash is empty" : "No files here"}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedFile && (
          <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 280, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="border-l border-white/[0.06] p-4 flex-shrink-0 overflow-y-auto scrollbar-thin"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-white/60">Preview</span>
              <button onClick={() => setSelectedFile(null)} className="text-white/30 hover:text-white/60 text-xs">\u2715</button>
            </div>
            <div className="text-4xl mb-4 text-center">{FILE_ICONS[selectedFile.type] || FILE_ICONS.default}</div>
            <div className="text-sm font-medium text-white/70 mb-1 break-words">{selectedFile.name}</div>
            <div className="space-y-2 text-xs text-white/30">
              <div className="flex justify-between"><span>Type</span><span className="uppercase text-white/40">{selectedFile.type}</span></div>
              <div className="flex justify-between"><span>Size</span><span className="text-white/40">{formatSize(selectedFile.size)}</span></div>
              <div className="flex justify-between"><span>Modified</span><span className="text-white/40">{new Date(selectedFile.date).toLocaleDateString()}</span></div>
            </div>
            {selectedFile.type !== "folder" && (
              <button className="w-full mt-4 text-xs py-1.5 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 transition-all">Download</button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
