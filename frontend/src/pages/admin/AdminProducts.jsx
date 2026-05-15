import { useState } from "react";
import { useAdminData } from "../../contexts/AdminDataContext";
import { Search, Eye, Trash2, Filter } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import BLivreSEO from "../../components/BLivreSEO";

const glassCard = "rounded-2xl border bg-[#121216]/80 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.3)]";

export default function AdminProducts() {
  const { posts, loading, deletePost } = useAdminData();
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("Todas");

  const categories = ["Todas", ...new Set((posts || []).map(p => p.category || p.categoria || "Outros"))];

  const filtered = (posts || []).filter(p => {
    if (cat !== "Todas" && p.category !== cat && p.categoria !== cat) return false;
    if (search) {
      const q = search.toLowerCase();
      const title = (p.title || p.titulo || "").toLowerCase();
      const author = (p.author || p.autor || "").toLowerCase();
      return title.includes(q) || author.includes(q);
    }
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <BLivreSEO page="home" title="Anúncios" description="Gerenciar anúncios B Livre" />
        <ProductsSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BLivreSEO page="home" title="Anúncios" description="Gerenciar anúncios B Livre" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">Anúncios</h1>
          <p className="text-sm text-[#8C8F9A] mt-0.5">{posts?.length || 0} anúncios no total</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8F9A]" />
            <Input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar..." className="pl-9 h-9 w-52 bg-[#0A0A0C] border-white/10 text-white text-[12px] placeholder:text-[#8C8F9A] rounded-xl" />
          </div>
        </div>
      </div>

      {(!posts || posts.length === 0) ? (
        <div className={`${glassCard} p-12 text-center`}>
          <p className="text-lg font-bold text-white mb-1">Nenhum dado real ainda</p>
          <p className="text-sm text-[#8C8F9A]">Nenhum anúncio encontrado no banco de dados.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {categories.map(c => (
              <button key={c} onClick={() => setCat(c)}
                className={`px-4 py-2 rounded-xl text-[12px] font-semibold transition-all whitespace-nowrap ${
                  cat === c ? "bg-[#D4A24C]/10 text-[#D4A24C] border border-[#D4A24C]/20" : "text-[#8C8F9A] hover:text-white border border-transparent"
                }`}>{c}</button>
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
                  <TableRow key={p.key || p.id || i} className="border-white/[0.04] hover:bg-white/[0.02]">
                    <TableCell className="text-white font-medium">{p.title || p.titulo || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] border-white/10 text-[#8C8F9A] bg-white/[0.02]">
                        {p.category || p.categoria || "Outros"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-white font-semibold">{p.price || p.preco || "—"}</TableCell>
                    <TableCell className="text-[#8C8F9A]">{p.author || p.autor || "—"}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                        (p.status || "active") === "blocked" || p.status === "bloqueado"
                          ? "bg-red-500/10 text-red-400 border-red-500/20"
                          : (p.status || "active") === "pending" || p.status === "pendente"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      }`}>{p.status || "ativo"}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button onClick={() => deletePost(p.key || p.id)}
                          className="h-8 px-2.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-[11px] font-semibold hover:bg-red-500/20">
                          <Trash2 size={12} className="mr-1" /> Excluir
                        </Button>
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

function ProductsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-32 bg-white/[0.04] rounded-xl animate-pulse" />
      <div className="rounded-2xl border bg-[#121216]/80 p-5">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-12 bg-white/[0.02] rounded-xl mb-2 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
