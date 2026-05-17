import { useState, useEffect } from "react";
import axios from "axios";
import { useAdminData } from "../../contexts/AdminDataContext";
import { Search, Plus, Image, Link, ToggleLeft, ToggleRight, Trash2, ExternalLink, Eye, X } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import BLivreSEO from "../../components/BLivreSEO";

const glassCard = "rounded-2xl border bg-[#121216]/80 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.3)]";
const API = `${process.env.REACT_APP_BACKEND_URL || "https://brane-production-3c87.up.railway.app"}/api`;

const positions = [
  { value: "topo", label: "Topo" },
  { value: "meio_feed", label: "Meio do Feed" },
  { value: "apos_5_cards", label: "Após 5 Cards" },
  { value: "lateral", label: "Lateral" },
];

export default function AdminBanners() {
  const { authHeaders } = useAdminData();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: "", image: "", link: "", position: "topo", active: true });

  useEffect(() => {
    fetchBanners();
  }, [authHeaders]);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API + "/admin/blivre/banners", { headers: authHeaders }).catch(() => null);
      if (res?.data?.banners) setBanners(res.data.banners);
      else setBanners([]);
    } catch { setBanners([]); }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setForm({ title: "", image: "", link: "", position: "topo", active: true });
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!form.title) return;
    try {
      if (editing) {
        await axios.put(API + "/admin/blivre/banners/" + editing, form, { headers: authHeaders });
      } else {
        await axios.post(API + "/admin/blivre/banners", form, { headers: authHeaders });
      }
      resetForm();
      fetchBanners();
    } catch (e) { console.error(e); }
  };

  const toggleActive = async (banner) => {
    try {
      await axios.put(API + "/admin/blivre/banners/" + banner.ad_id, { active: !banner.active }, { headers: authHeaders });
      fetchBanners();
    } catch (e) { console.error(e); }
  };

  const deleteBanner = async (id) => {
    if (!window.confirm("Remover este banner?")) return;
    try {
      await axios.delete(API + "/admin/blivre/banners/" + id, { headers: authHeaders });
      fetchBanners();
    } catch (e) { console.error(e); }
  };

  const filtered = banners.filter(b => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (b.title || "").toLowerCase().includes(q) || (b.position || "").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <BLivreSEO page="home" title="Banners" description="Gerenciar banners internos B Livre" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">Banners Internos</h1>
          <p className="text-sm text-[#8C8F9A] mt-0.5">{banners.length} banners cadastrados</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8F9A]" />
            <Input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar..." className="pl-9 h-9 w-44 bg-[#0A0A0C] border-white/10 text-white text-[12px] placeholder:text-[#8C8F9A] rounded-xl" />
          </div>
          <Button onClick={() => { resetForm(); setShowForm(true); }}
            className="h-9 px-4 bg-[#D4A24C] text-black font-bold rounded-xl hover:bg-[#C49542] text-[12px]">
            <Plus size={14} className="mr-1" /> Novo Banner
          </Button>
        </div>
      </div>

      {showForm && (
        <div className={`${glassCard} p-5 border-[#D4A24C]/20`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">{editing ? "Editar Banner" : "Novo Banner"}</h3>
            <button onClick={resetForm} className="text-[#8C8F9A] hover:text-white"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[12px] font-medium text-[#8C8F9A]">Título *</label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Nome do banner" className="h-9 bg-[#0A0A0C] border-white/10 text-white text-[13px] rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-[12px] font-medium text-[#8C8F9A]">Posição</label>
              <select value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
                className="w-full h-9 bg-[#0A0A0C] border border-white/10 text-white text-[13px] rounded-xl px-3 focus:outline-none focus:border-[#D4A24C]/30">
                {positions.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[12px] font-medium text-[#8C8F9A]">URL da Imagem</label>
              <Input value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
                placeholder="https://..." className="h-9 bg-[#0A0A0C] border-white/10 text-white text-[13px] rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-[12px] font-medium text-[#8C8F9A]">Link de destino</label>
              <Input value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
                placeholder="https://..." className="h-9 bg-[#0A0A0C] border-white/10 text-white text-[13px] rounded-xl" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.06]">
            <label className="flex items-center gap-2 text-[13px] text-white cursor-pointer" onClick={() => setForm(f => ({ ...f, active: !f.active }))}>
              <div className={`w-9 h-4.5 rounded-full transition-colors ${form.active ? "bg-[#D4A24C]" : "bg-white/10"} relative`}>
                <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all ${form.active ? "left-[18px]" : "left-0.5"}`} />
              </div>
              Banner ativo
            </label>
            <div className="flex gap-2">
              <Button onClick={resetForm} variant="ghost" className="h-9 px-4 text-[#8C8F9A] text-[12px] rounded-xl">Cancelar</Button>
              <Button onClick={handleSubmit} disabled={!form.title}
                className="h-9 px-5 bg-[#D4A24C] text-black font-bold rounded-xl hover:bg-[#C49542] text-[12px]">
                {editing ? "Salvar" : "Criar Banner"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className={`${glassCard} p-5`}>
        {loading ? (
          <div className="flex items-center justify-center h-32 text-[#8C8F9A]">
            <div className="w-6 h-6 border-2 border-[#D4A24C] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : banners.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <Image size={40} className="mb-3 text-[#8C8F9A] opacity-20" />
            <p className="text-[15px] font-medium text-white mb-1">Nenhum banner ainda</p>
            <p className="text-[12px] text-[#8C8F9A] mb-4">Crie o primeiro banner interno da plataforma</p>
            <Button onClick={() => { resetForm(); setShowForm(true); }}
              className="h-9 px-4 bg-[#D4A24C] text-black font-bold rounded-xl hover:bg-[#C49542] text-[12px]">
              <Plus size={14} className="mr-1" /> Criar Banner
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.04]">
                <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Título</TableHead>
                <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Posição</TableHead>
                <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Cliques</TableHead>
                <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Status</TableHead>
                <TableHead className="text-[11px] text-[#8C8F9A] font-medium text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((b) => (
                <TableRow key={b.ad_id} className="border-white/[0.04] hover:bg-white/[0.02]">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#D4A24C]/10 flex items-center justify-center text-[#D4A24C] flex-shrink-0 overflow-hidden">
                        {b.image ? <img src={b.image} alt="" className="w-full h-full object-cover" /> : <Image size={14} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-white truncate">{b.title}</p>
                        {b.link && <p className="text-[10px] text-[#5C5F6A] truncate">{b.link}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-[12px] text-[#8C8F9A]">{positions.find(p => p.value === b.position)?.label || b.position}</span>
                  </TableCell>
                  <TableCell className="text-white text-[13px]">{b.clicks || 0}</TableCell>
                  <TableCell>
                    <button onClick={() => toggleActive(b)} className="flex items-center gap-1.5">
                      {b.active ? (
                        <><ToggleRight size={18} className="text-emerald-400" /><span className="text-[11px] text-emerald-400 font-semibold">Ativo</span></>
                      ) : (
                        <><ToggleLeft size={18} className="text-[#8C8F9A]" /><span className="text-[11px] text-[#8C8F9A] font-semibold">Inativo</span></>
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {b.link && (
                        <a href={b.link} target="_blank" rel="noopener noreferrer"
                          className="h-8 px-2.5 bg-white/[0.04] text-[#8C8F9A] border border-white/10 rounded-xl text-[11px] font-semibold hover:text-white inline-flex items-center gap-1">
                          <ExternalLink size={11} />
                        </a>
                      )}
                      <Button onClick={() => { setEditing(b.ad_id); setForm({ title: b.title, image: b.image || "", link: b.link || "", position: b.position || "topo", active: b.active }); setShowForm(true); }}
                        className="h-8 px-2.5 bg-white/[0.04] text-[#D4A24C] border border-[#D4A24C]/20 rounded-xl text-[11px] font-semibold hover:bg-[#D4A24C]/10">
                        Editar
                      </Button>
                      <Button onClick={() => deleteBanner(b.ad_id)}
                        className="h-8 px-2.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-[11px] font-semibold hover:bg-red-500/20">
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
