import { useState, useEffect } from "react";
import axios from "axios";
import { useAdminData } from "../../contexts/AdminDataContext";
import { Globe, Shield, Lock, Sliders, Save } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import BLivreSEO from "../../components/BLivreSEO";

const glassCard = "rounded-2xl border bg-[#121216]/80 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.3)]";
const API = `${process.env.REACT_APP_BACKEND_URL || "https://brane-production-3c87.up.railway.app"}/api`;

function Toggle({ value, onChange }) {
  return (
    <div onClick={onChange} className={`w-10 h-5 rounded-full transition-colors ${value ? "bg-[#D4A24C]" : "bg-white/10"} relative cursor-pointer`}>
      <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${value ? "left-5" : "left-0.5"}`} />
    </div>
  );
}

export default function AdminConfiguracoes() {
  const { authHeaders, token } = useAdminData();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await axios.get(API + "/admin/blivre/settings", { headers: authHeaders }).catch(() => null);
        if (res?.data) setSettings(res.data);
      } catch {} finally { setLoading(false); }
    };
    fetch();
  }, [authHeaders]);

  const update = (key, value) => setSettings(prev => prev ? { ...prev, [key]: value } : prev);

  const save = async () => {
    setSaving(true); setMsg("");
    try {
      await axios.put(API + "/admin/blivre/settings", settings, { headers: authHeaders });
      setMsg("Configuracoes salvas com sucesso!");
    } catch { setMsg("Erro ao salvar configuracoes"); }
    finally { setSaving(false); setTimeout(() => setMsg(""), 3000); }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <BLivreSEO page="home" title="Configurações" description="Configurações B Livre" />
        <h1 className="text-xl font-black text-white">Configurações</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className={`${glassCard} p-5`}><div className="h-32 bg-white/[0.03] rounded-xl animate-pulse" /></div>)}
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="space-y-6">
        <BLivreSEO page="home" title="Configurações" description="Configurações B Livre" />
        <h1 className="text-xl font-black text-white">Configurações</h1>
        <div className={`${glassCard} p-12 text-center`}>
          <p className="text-lg font-bold text-white mb-1">Faça login na B Livre primeiro</p>
          <p className="text-sm text-[#8C8F9A]">Você precisa estar logado com uma conta administradora.</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="space-y-6">
        <BLivreSEO page="home" title="Configurações" description="Configurações B Livre" />
        <h1 className="text-xl font-black text-white">Configurações</h1>
        <div className={`${glassCard} p-12 text-center`}>
          <p className="text-lg font-bold text-white mb-1">Erro ao carregar configurações</p>
          <p className="text-sm text-[#8C8F9A]">Não foi possível conectar ao backend.</p>
        </div>
      </div>
    );
  }

  const fields = {
    geral: [
      { key: "platform_name", label: "Nome da plataforma" },
      { key: "base_url", label: "URL base" },
      { key: "contact_email", label: "Email de contato" },
      { key: "currency", label: "Moeda" },
    ],
    moderacao: [
      { key: "auto_approve", label: "Aprovação automática", type: "toggle" },
      { key: "notify_reports", label: "Notificar sobre denúncias", type: "toggle" },
      { key: "auto_block_reports", label: "Bloqueio automático após N denúncias", type: "number" },
    ],
    seguranca: [
      { key: "two_factor_auth", label: "Autenticação em dois fatores", type: "toggle" },
      { key: "recaptcha", label: "Recaptcha no cadastro", type: "toggle" },
      { key: "email_verification", label: "Verificação de email obrigatória", type: "toggle" },
      { key: "activity_log", label: "Log de atividades", type: "toggle" },
    ],
    aparencia: [
      { key: "dark_theme", label: "Tema escuro", type: "toggle" },
      { key: "compact_mode", label: "Modo compacto", type: "toggle" },
      { key: "show_indicators", label: "Mostrar indicadores", type: "toggle" },
    ],
  };

  return (
    <div className="space-y-6">
      <BLivreSEO page="home" title="Configurações" description="Configurações B Livre" />
      <div>
        <h1 className="text-xl font-black text-white">Configurações</h1>
        <p className="text-sm text-[#8C8F9A] mt-0.5">Gerencie as configurações da plataforma</p>
      </div>

      {msg && (
        <div className={`${glassCard} p-3 text-center text-[13px] font-semibold ${msg.includes("sucesso") ? "text-emerald-400" : "text-red-400"}`}>
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`${glassCard} p-5`}>
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Globe size={16} className="text-[#D4A24C]" /> Geral</h3>
          <div className="space-y-4">
            {fields.geral.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <label className="text-[12px] font-medium text-[#8C8F9A]">{f.label}</label>
                <Input value={settings[f.key] || ""} onChange={e => update(f.key, e.target.value)}
                  className="h-9 bg-[#0A0A0C] border-white/10 text-white text-[13px] rounded-xl" />
              </div>
            ))}
          </div>
        </div>

        <div className={`${glassCard} p-5`}>
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Shield size={16} className="text-[#D4A24C]" /> Moderação</h3>
          <div className="space-y-4">
            {fields.moderacao.map((f) => (
              f.type === "toggle" ? (
                <div key={f.key} className="flex items-center justify-between py-2">
                  <label className="text-[13px] text-white">{f.label}</label>
                  <Toggle value={!!settings[f.key]} onChange={() => update(f.key, !settings[f.key])} />
                </div>
              ) : (
                <div key={f.key} className="space-y-1.5 pt-2">
                  <label className="text-[12px] font-medium text-[#8C8F9A]">{f.label}</label>
                  <Input type="number" value={settings[f.key] ?? ""} onChange={e => update(f.key, Number(e.target.value))}
                    className="h-9 bg-[#0A0A0C] border-white/10 text-white text-[13px] rounded-xl" />
                </div>
              )
            ))}
          </div>
        </div>

        <div className={`${glassCard} p-5`}>
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Lock size={16} className="text-[#D4A24C]" /> Segurança</h3>
          <div className="space-y-4">
            {fields.seguranca.map((f) => (
              <div key={f.key} className="flex items-center justify-between py-2">
                <label className="text-[13px] text-white">{f.label}</label>
                <Toggle value={!!settings[f.key]} onChange={() => update(f.key, !settings[f.key])} />
              </div>
            ))}
          </div>
        </div>

        <div className={`${glassCard} p-5`}>
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Sliders size={16} className="text-[#D4A24C]" /> Aparência</h3>
          <div className="space-y-4">
            {fields.aparencia.map((f) => (
              <div key={f.key} className="flex items-center justify-between py-2">
                <label className="text-[13px] text-white">{f.label}</label>
                <Toggle value={!!settings[f.key]} onChange={() => update(f.key, !settings[f.key])} />
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-white/[0.06]">
            <Button onClick={save} disabled={saving}
              className="w-full h-10 bg-[#D4A24C] text-black font-bold rounded-xl hover:bg-[#C49542]">
              <Save size={14} className="mr-2" />{saving ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}