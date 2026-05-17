import { useState } from "react";
import axios from "axios";
import { useAdminData } from "../../contexts/AdminDataContext";
import { Search, Eye, Trash2, Filter, Plus, CheckCircle, XCircle, Star, Edit3, X } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import BLivreSEO from "../../components/BLivreSEO";

const glassCard = "rounded-2xl border bg-[#121216]/80 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.3)]";
const API = `${process.env.REACT_APP_BACKEND_URL || "https://brane-production-3c87.up.railway.app"}/api`;

export default function AdminProducts() {
  const { posts: ctxPosts, loading, deletePost, authHeaders, token } = useAdminData();
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("Todas");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "Outros", price: "", city: "", state: "", whatsapp: "", image: "" });

  const posts = ctxPosts || [];
  const categories = ["Todas", ...new Set(posts.map(p => p.category || p.categoria || "Outros"))];

  const filtered = posts.filter(p => {
    if (cat !== "Todas" && p.category !== cat && p.categoria !== cat) return false;
    if (search) {
      const q = search.toLowerCase();
      const title = (p.title || p.titulo || "").toLowerCase();
      const author = (p.author || p.autor || "").toLowerCase();
      return title.includes(q) || author.includes(q);
    }
    return true;
  });

  const updateStatus = async (pid, status) => {
    try {
      await axios.put(API + "/admin/blivre/products/" + pid + "/status", { status }, { headers: authHeaders });
    } catch (e) { console.error(e); }
  };

  const toggleFeatured = async (pid) => {
    try {
      await axios.put(API + "/admin/blivre/products/" + pid + "/promote", {}, { headers: authHeaders });
    } catch (e) { console.error(e); }
  };

  const handleCreate = async () => {
    if (!form.title) return;
    try {
      await axios.post(API + "/admin/blivre/products", form, { headers: authHeaders });
      setShowForm(false);
      setForm({ title: "", description: "", category: "Outros", price: "", city: "", state: "", whatsapp: "", image: "" });
      window.location.reload();
    } catch (e) { console.error(e); }
  };

  if (!token) {
    return (
      <div className="space-y-6">
        <BLivreSEO page="home" title="Anúncios" description="Gerenciar anúncios B Livre" />
        <h1 className="text-xl font-black text-white">Anúncios</h1>
        <div className={`${glassCard} p-12 text-center`}>
          <p className="text-lg font-bold text-white mb-1">Faça login na B Livre primeiro</p>
          <p className="text-sm text-[#8C8F9A]">Você precisa estar logado com uma conta administradora.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <BLivreSEO page="home" title="Anúncios" description="Gerenciar anúncios B Livre" />
        <div className="h-8 w-32 bg-white/[0.04] rounded-xl animate-pulse" />
        <div className={`${glassCard} p-5`}>{[1, 2, 3].map(i => <div key={i} className="h-12 bg-white/[0.02] rounded-xl mb-2 animate-pulse" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BLivreSEO page="home" title="Anúncios" description="Gerenciar anúncios B Livre" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">Anúncios</h1>
          <p className="text-sm text-[#8C8F9A] mt-0.5">{posts.length} anúncios no total</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8F9A]" />
            <Input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar..." className="pl-9 h-9 w-44 bg-[#0A0A0C] border-white/10 text-white text-[12px] placeholder:text-[#8C8F9A] rounded-xl" />
          </div>
          <Button onClick={() => setShowForm(true)}
            className="h-9 px-4 bg-[#D4A24C] text-black font-bold rounded-xl hover:bg-[#C49542] text-[12px]">
            <Plus size={14} className="mr-1" /> Novo Anúncio
          </Button>
        </div>
      </div>

      {showForm && (
        <div className={`${glassCard} p-5 border-[#D4A24C]/20`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Criar Anúncio (Admin)</h3>
            <button onClick={() => setShowForm(false)} className="text-[#8C8F9A] hover:text-white"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-[12px] font-medium text-[#8C8F9A]">Título *</label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Título do anúncio" className="h-9 bg-[#0A0A0C] border-white/10 text-white text-[13px] rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-[12px] font-medium text-[#8C8F9A]">Categoria</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full h-9 bg-[#0A0A0C] border border-white/10 text-white text-[13px] rounded-xl px-3 focus:outline-none focus:border-[#D4A24C]/30">
                {["Serviços", "Produtos", "Vagas", "Imóveis", "Autos", "Outros"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[12px] font-medium text-[#8C8F9A]">Preço</label>
              <Input value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="R$ 0,00" className="h-9 bg-[#0A0A0C] border-white/10 text-white text-[13px] rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-[12px] font-medium text-[#8C8F9A]">Cidade</label>
              <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Cidade" className="h-9 bg-[#0A0A0C] border-white/10 text-white text-[13px] rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-[12px] font-medium text-[#8C8F9A]">Estado</label>
              <Input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} placeholder="UF" className="h-9 bg-[#0A0A0C] border-white/10 text-white text-[13px] rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-[12px] font-medium text-[#8C8F9A]">WhatsApp</label>
              <Input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} placeholder="(11) 99999-9999" className="h-9 bg-[#0A0A0C] border-white/10 text-white text-[13px] rounded-xl" />
            </div>
            <div className="space-y-2 md:col-span-3">
              <label className="text-[12px] font-medium text-[#8C8F9A]">Descrição</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Descrição do anúncio..." rows={2}
                className="w-full bg-[#0A0A0C] border border-white/10 text-white text-[13px] rounded-xl px-3 py-2 resize-none focus:outline-none focus:border-[#D4A24C]/30 placeholder:text-[#8C8F9A]" />
            </div>
            <div className="space-y-2 md:col-span-3">
              <label className="text-[12px] font-medium text-[#8C8F9A]">URL da Imagem</label>
              <Input value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} placeholder="https://..." className="h-9 bg-[#0A0A0C] border-white/10 text-white text-[13px] rounded-xl" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-white/[0.06]">
            <Button onClick={() => setShowForm(false)} variant="ghost" className="h-9 px-4 text-[#8C8F9A] text-[12px] rounded-xl">Cancelar</Button>
            <Button onClick={handleCreate} disabled={!form.title}
              className="h-9 px-5 bg-[#D4A24C] text-black font-bold rounded-xl hover:bg-[#C49542] text-[12px]">Criar Anúncio</Button>
          </div>
        </div>
      )}

      {posts.length === 0 ? (
        <div className={`${glassCard} p-12 text-center`}>
          <p className="text-lg font-bold text-white mb-1">Nenhum dado real ainda</p>
          <p className="text-sm text-[#8C8F9A]">Nenhum anúncio encontrado no banco de dados.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {categories.map(c => (
              <button key={c} onClick={() => setCat(c)}
                className={`px-4 py-2 rounded-xl text-[12px] font-semibold transition-all whitespace-nowrap ${cat === c ? "bg-[#D4A24C]/10 text-[#D4A24C] border border-[#D4A24C]/20" : "text-[#8C8F9A] hover:text-white border border-transparent"}`}>{c}</button>
            ))}
          </div>

          <div className={`${glassCard} p-5`}>
            <Table>
              <TableHeader>
                <TableRow className="border-white/[0.04]">
                  <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Título</TableHead>
                  <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Categoria</TableHead>
                  <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Preço</TableHead>
                  <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Autor</TableHead>
                  <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Status</TableHead>
                  <TableHead className="text-[11px] text-[#8C8F9A] font-medium text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p, i) => (
                  <TableRow key={p.post_id || p.key || p.id || i} className="border-white/[0.04] hover:bg-white/[0.02]">
                    <TableCell className="text-white font-medium">{p.title || p.titulo || "—"}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px] border-white/10 text-[#8C8F9A] bg-white/[0.02]">{p.category || p.categoria || "Outros"}</Badge></TableCell>
                    <TableCell className="text-white font-semibold">{p.price || p.preco || "—"}</TableCell>
                    <TableCell className="text-[#8C8F9A]">{p.author || p.autor || "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {p.featured && <Star size={11} className="text-[#D4A24C]" />}
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                          (p.status || "active") === "blocked" || p.status === "bloqueado" || p.status === "hidden"
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : (p.status || "active") === "pending" || p.status === "pendente"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        }`}>{p.status || "ativo"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {(p.status || "active") !== "blocked" && p.status !== "bloqueado" && p.status !== "hidden" ? (
                          <button onClick={() => updateStatus(p.post_id || p.key || p.id, "hidden")}
                            className="h-8 px-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl text-[11px] font-semibold hover:bg-amber-500/20" title="Ocultar">
                            <XCircle size={12} />
                          </button>
                        ) : (
                          <button onClick={() => updateStatus(p.post_id || p.key || p.id, "active")}
                            className="h-8 px-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-[11px] font-semibold hover:bg-emerald-500/20" title="Ativar">
                            <CheckCircle size={12} />
                          </button>
                        )}
                        <button onClick={() => toggleFeatured(p.post_id || p.key || p.id)}
                          className={`h-8 px-2 rounded-xl border text-[11px] font-semibold ${p.featured ? "bg-[#D4A24C]/10 text-[#D4A24C] border-[#D4A24C]/20 hover:bg-[#D4A24C]/20" : "bg-white/[0.04] text-[#8C8F9A] border-white/10 hover:text-white"}`} title="Destaque">
                          <Star size={12} />
                        </button>
                        <button onClick={() => deletePost(p.post_id || p.key || p.id)}
                          className="h-8 px-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-[11px] font-semibold hover:bg-red-500/20" title="Excluir">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
