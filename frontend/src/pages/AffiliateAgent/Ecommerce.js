import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const COLORS = ["bg-rose-500", "bg-sky-500", "bg-emerald-500", "bg-amber-500", "bg-violet-500", "bg-cyan-500", "bg-pink-500", "bg-lime-500"];

const CATEGORIES = ["Electronics", "Clothing", "Home", "Beauty", "Sports"];

const MOCK_PRODUCTS = [
  { id: 1, name: "Wireless Headphones", price: 299.90, stock: 42, sales: 128, status: "Active", category: "Electronics", description: "Premium noise-canceling wireless headphones with 30h battery." },
  { id: 2, name: "Smart Watch Pro", price: 599.90, stock: 18, sales: 67, status: "Active", category: "Electronics", description: "Advanced smartwatch with health monitoring and GPS." },
  { id: 3, name: "Designer T-Shirt", price: 89.90, stock: 0, sales: 203, status: "Out of Stock", category: "Clothing", description: "Premium cotton t-shirt with minimalist design." },
  { id: 4, name: "Leather Wallet", price: 149.90, stock: 55, sales: 91, status: "Active", category: "Clothing", description: "Handcrafted genuine leather wallet with RFID protection." },
  { id: 5, name: "Yoga Mat Premium", price: 79.90, stock: 120, sales: 45, status: "Draft", category: "Sports", description: "Extra thick eco-friendly yoga mat with alignment lines." },
  { id: 6, name: "LED Desk Lamp", price: 129.90, stock: 30, sales: 74, status: "Active", category: "Home", description: "Adjustable LED desk lamp with wireless charging base." },
  { id: 7, name: "Serum Facial", price: 59.90, stock: 0, sales: 312, status: "Out of Stock", category: "Beauty", description: "Vitamin C brightening facial serum with hyaluronic acid." },
  { id: 8, name: "Bluetooth Speaker", price: 199.90, stock: 8, sales: 156, status: "Active", category: "Electronics", description: "Portable waterproof bluetooth speaker with deep bass." },
];

const TABS = ["All Products", "Active", "Draft", "Out of Stock"];

const cx = "rounded-xl border border-white/[0.06] bg-white/[0.02] p-4";
const lx = "text-[11px] text-white/30 uppercase tracking-wider mb-1";
const ix = "w-full bg-white/5 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/20 outline-none focus:border-cyan-500/40 focus:bg-white/[0.08] transition";

const statusStyles = { Active: "bg-emerald-500/15 text-emerald-400", Draft: "bg-amber-500/15 text-amber-400", "Out of Stock": "bg-red-500/15 text-red-400" };

export default function Ecommerce() {
  const [products, setProducts] = useState(MOCK_PRODUCTS);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("All Products");
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", price: "", stock: "", description: "", category: "Electronics" });

  const stats = useMemo(() => ({
    products: products.length,
    orders: products.reduce((s, p) => s + p.sales, 0),
    revenue: products.reduce((s, p) => s + p.price * p.sales, 0),
    conversion: ((products.filter((p) => p.status === "Active").length / products.length) * 100).toFixed(1),
  }), [products]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) => {
      const m = p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      if (tab === "All Products") return m;
      return m && p.status === tab;
    });
  }, [products, search, tab]);

  const addProduct = useCallback(() => {
    if (!editForm.name.trim()) return;
    setProducts((prev) => [{ id: Date.now(), name: editForm.name, price: parseFloat(editForm.price) || 0, stock: parseInt(editForm.stock) || 0, sales: 0, status: "Draft", category: editForm.category, description: editForm.description }, ...prev]);
    setEditForm({ name: "", price: "", stock: "", description: "", category: "Electronics" });
    setShowModal(false);
  }, [editForm]);

  const updateProduct = useCallback((id, patch) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    setSelected((s) => s?.id === id ? { ...s, ...patch } : s);
  }, []);

  const formatMoney = (v) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  return (
    <div className="flex-1 min-h-0 bg-[#0a0a0a] p-4 md:p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white/90 tracking-tight">Ecommerce</h1>
          <button onClick={() => { setEditForm({ name: "", price: "", stock: "", description: "", category: "Electronics" }); setShowModal(true); }}
            className="px-4 py-1.5 text-[11px] font-medium rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/20 transition"
          >+ Add Product</button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Products", value: stats.products, color: "text-white/80" },
            { label: "Orders", value: stats.orders, color: "text-cyan-400" },
            { label: "Revenue", value: formatMoney(stats.revenue), color: "text-emerald-400" },
            { label: "Conversion", value: `${stats.conversion}%`, color: "text-blue-400" },
          ].map((card) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cx}>
              <div className={lx}>{card.label}</div>
              <div className={`text-2xl font-semibold ${card.color}`}>{card.value}</div>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-60 bg-white/5 border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-white/70 placeholder-white/20 outline-none focus:border-cyan-500/40 transition"
          />
          <div className="flex gap-1 bg-white/[0.03] border border-white/[0.06] rounded-lg p-1">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-2.5 py-1 text-[10px] rounded-md font-medium transition ${tab === t ? "bg-cyan-500/20 text-cyan-400" : "text-white/30 hover:text-white/60"}`}
              >{t}</button>
            ))}
          </div>
        </div>

        <div className={cx + " overflow-x-auto"}>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-white/30 text-[10px] uppercase tracking-wider border-b border-white/[0.06]">
                <th className="text-left py-2 pr-2 w-10"></th>
                <th className="text-left py-2 pr-2">Name</th>
                <th className="text-left py-2 pr-2">Price</th>
                <th className="text-left py-2 pr-2">Stock</th>
                <th className="text-left py-2 pr-2">Sales</th>
                <th className="text-left py-2 pr-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product, i) => (
                <tr key={product.id} onClick={() => setSelected(product)}
                  className="border-b border-white/[0.03] hover:bg-white/[0.02] cursor-pointer transition"
                >
                  <td className="py-2.5 pr-2"><div className={`w-7 h-7 rounded-full ${COLORS[i % COLORS.length]} flex items-center justify-center text-white text-[10px] font-bold`}>{product.name[0]}</div></td>
                  <td className="py-2.5 pr-2 text-white/70 font-medium">{product.name}</td>
                  <td className="py-2.5 pr-2 text-white/60">{formatMoney(product.price)}</td>
                  <td className="py-2.5 pr-2 text-white/50">{product.stock}</td>
                  <td className="py-2.5 pr-2 text-white/50">{product.sales}</td>
                  <td className="py-2.5"><span className={`inline-block text-[10px] px-2 py-0.5 rounded-full ${statusStyles[product.status]}`}>{product.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 bg-black/40" onClick={() => setSelected(null)}
            />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-80 bg-[#0f0f0f] border-l border-white/[0.06] z-40 overflow-y-auto p-5 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-semibold text-white/80">Edit Product</h2>
                <button onClick={() => setSelected(null)} className="text-white/20 hover:text-white/60 transition text-lg leading-none">✕</button>
              </div>
              <div className="space-y-3">
                <div><div className={lx}>Name</div><input value={selected.name} onChange={(e) => updateProduct(selected.id, { name: e.target.value })} className={ix} /></div>
                <div><div className={lx}>Price</div><input type="number" step="0.01" value={selected.price} onChange={(e) => updateProduct(selected.id, { price: parseFloat(e.target.value) || 0 })} className={ix} /></div>
                <div><div className={lx}>Stock</div><input type="number" value={selected.stock} onChange={(e) => updateProduct(selected.id, { stock: parseInt(e.target.value) || 0 })} className={ix} /></div>
                <div><div className={lx}>Description</div><textarea rows={3} value={selected.description} onChange={(e) => updateProduct(selected.id, { description: e.target.value })} className={ix + " resize-none"} /></div>
                <div>
                  <div className={lx}>Status</div>
                  <button onClick={() => updateProduct(selected.id, { status: selected.status === "Active" ? "Draft" : selected.status === "Draft" ? "Out of Stock" : "Active" })}
                    className={`w-full py-2 rounded-lg text-[10px] font-medium border transition ${statusStyles[selected.status]} border-current`}
                  >{selected.status}</button>
                </div>
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
              <h3 className="text-base font-semibold text-white/90 mb-4">Add Product</h3>
              <div className="space-y-3">
                <input placeholder="Product name *" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} className={ix} />
                <input placeholder="Price" type="number" step="0.01" value={editForm.price} onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))} className={ix} />
                <input placeholder="Stock" type="number" value={editForm.stock} onChange={(e) => setEditForm((f) => ({ ...f, stock: e.target.value }))} className={ix} />
                <textarea placeholder="Description" rows={3} value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} className={ix + " resize-none"} />
                <select value={editForm.category} onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))} className={ix}>
                  {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
                </select>
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2 text-xs rounded-lg border border-white/[0.06] text-white/40 hover:text-white/70 transition">Cancel</button>
                <button onClick={addProduct} className="flex-1 py-2 text-xs font-medium rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/20 transition">Add</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
