import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const INITIAL_DATA = [
  ["Wireless Mouse", "R$ 89.90", "342", "Electronics", "Active"],
  ["Mechanical Keyboard", "R$ 249.00", "187", "Electronics", "Active"],
  ["USB-C Hub", "R$ 129.50", "563", "Accessories", "Active"],
  ["Noise Canceling Headphones", "R$ 599.00", "98", "Audio", "Active"],
  ["Laptop Stand", "R$ 179.90", "274", "Accessories", "Active"],
  ["Webcam HD Pro", "R$ 349.00", "156", "Electronics", "Inactive"],
  ["Smart Desk Lamp", "R$ 219.00", "89", "Lighting", "Active"],
  ["Ergonomic Chair", "R$ 1.299,00", "45", "Furniture", "Active"],
  ["Monitor 27\" 4K", "R$ 2.499,00", "23", "Monitors", "Active"],
  ["Portable SSD 1TB", "R$ 499.00", "412", "Storage", "Active"],
];

const COLUMNS = ["A", "B", "C", "D", "E"];

const cx = "rounded-xl border border-white/[0.06] bg-white/[0.02] p-4";
const lx = "text-[11px] text-white/30 uppercase tracking-wider mb-1";

function columnLabel(i) {
  if (i < 26) return String.fromCharCode(65 + i);
  return String.fromCharCode(65 + Math.floor(i / 26) - 1) + String.fromCharCode(65 + (i % 26));
}

export default function SpreadsheetAI() {
  const [rows, setRows] = useState(INITIAL_DATA.length);
  const [cols, setCols] = useState(INITIAL_DATA[0].length);
  const [data, setData] = useState(() => INITIAL_DATA);
  const [selectedCol, setSelectedCol] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const updateCell = useCallback((r, c, value) => {
    setData((prev) => {
      const next = prev.map((row) => [...row]);
      next[r][c] = value;
      return next;
    });
  }, []);

  const addRow = useCallback(() => {
    setData((prev) => [...prev, Array.from({ length: cols }, (_, i) => i === 0 ? `Item ${prev.length + 1}` : "")]);
    setRows((r) => r + 1);
  }, [cols]);

  const addColumn = useCallback(() => {
    setData((prev) => prev.map((row) => [...row, ""]));
    setCols((c) => c + 1);
    setSelectedCol(null);
  }, []);

  const analysis = useMemo(() => {
    const numbers = data.slice(0, rows).map((row) => {
      const val = parseFloat(row[1]?.replace(/[R$\s.,]/g, (m) => m === "," ? "" : "").replace(",", ".") || "0");
      return isNaN(val) ? 0 : val;
    });
    const sum = numbers.reduce((a, b) => a + b, 0);
    const avg = numbers.length > 0 ? sum / numbers.length : 0;
    const count = numbers.length;
    const min = numbers.length > 0 ? Math.min(...numbers) : 0;
    const max = numbers.length > 0 ? Math.max(...numbers) : 0;
    return { sum: sum.toFixed(2), avg: avg.toFixed(2), count, min: min.toFixed(2), max: max.toFixed(2) };
  }, [data, rows]);

  return (
    <div className="flex-1 min-h-0 bg-[#0a0a0a] p-4 md:p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white/90 tracking-tight">Spreadsheet AI</h1>
          <div className="flex gap-2">
            <button onClick={() => setShowAnalysis(true)}
              className="px-4 py-1.5 text-[11px] font-medium rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/20 transition"
            >AI Analyze</button>
          </div>
        </div>

        <div className={cx + " overflow-x-auto"}>
          <div className="flex gap-2 mb-3">
            <button onClick={addRow} className="px-3 py-1.5 text-[10px] font-medium rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/50 border border-white/[0.06] transition">+ Add Row</button>
            <button onClick={addColumn} className="px-3 py-1.5 text-[10px] font-medium rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/50 border border-white/[0.06] transition">+ Add Column</button>
          </div>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="text-left py-2 pr-2 text-[10px] text-white/20 uppercase tracking-wider w-8">#</th>
                {Array.from({ length: cols }, (_, i) => (
                  <th key={i} onClick={() => setSelectedCol(selectedCol === i ? null : i)}
                    className={`text-left py-2 pr-2 text-[10px] uppercase tracking-wider cursor-pointer transition ${selectedCol === i ? "text-cyan-400 bg-cyan-500/10" : "text-white/30 hover:text-white/60"}`}
                  >{columnLabel(i)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rows }, (_, r) => (
                <tr key={r} className="border-t border-white/[0.03] hover:bg-white/[0.02]">
                  <td className="text-white/20 text-[10px] py-2 pr-2">{r + 1}</td>
                  {Array.from({ length: cols }, (_, c) => (
                    <td key={c} className="py-1 pr-2">
                      <input value={data[r]?.[c] || ""} onChange={(e) => updateCell(r, c, e.target.value)}
                        className="w-full bg-transparent text-white/70 text-xs outline-none border border-transparent focus:border-cyan-500/40 rounded px-1.5 py-1 transition"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showAnalysis && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setShowAnalysis(false)}
          >
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }} onClick={(e) => e.stopPropagation()}
              className="bg-[#0f0f0f] border border-white/[0.06] rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-white/90">AI Analysis</h3>
                <span className="text-[10px] text-purple-400/60 bg-purple-500/10 px-2 py-0.5 rounded-full">Column B (Price)</span>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Sum", value: `R$ ${analysis.sum}` },
                  { label: "Average", value: `R$ ${analysis.avg}` },
                  { label: "Count", value: analysis.count },
                  { label: "Minimum", value: `R$ ${analysis.min}` },
                  { label: "Maximum", value: `R$ ${analysis.max}` },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/[0.03] last:border-0">
                    <span className="text-xs text-white/40">{item.label}</span>
                    <span className="text-sm font-medium text-white/80">{item.value}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowAnalysis(false)}
                className="w-full mt-5 py-2 text-xs rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/20 transition"
              >Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
