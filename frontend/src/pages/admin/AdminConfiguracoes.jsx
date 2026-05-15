import { Globe, Shield, Lock, Sliders } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import BLivreSEO from "../../components/BLivreSEO";

const glassCard = "rounded-2xl border bg-[#121216]/80 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.3)]";

function Toggle({ value }) {
  return (
    <div className={`w-10 h-5 rounded-full transition-colors ${value ? "bg-[#D4A24C]" : "bg-white/10"} relative cursor-pointer`}>
      <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${value ? "left-5" : "left-0.5"}`} />
    </div>
  );
}

export default function AdminConfiguracoes() {
  return (
    <div className="space-y-6">
      <BLivreSEO page="home" title="Configurações" description="Configurações B Livre" />
      <div>
        <h1 className="text-xl font-black text-white">Configurações</h1>
        <p className="text-sm text-[#8C8F9A] mt-0.5">Gerencie as configurações da plataforma</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`${glassCard} p-5`}>
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Globe size={16} className="text-[#D4A24C]" /> Geral</h3>
          <div className="space-y-4">
            {[
              { label: "Nome da plataforma", value: "B Livre" },
              { label: "URL base", value: "https://blivre.com" },
              { label: "Email de contato", value: "suporte@blivre.com" },
              { label: "Moeda", value: "BRL (R$)" },
            ].map((f) => (
              <div key={f.label} className="space-y-1.5">
                <label className="text-[12px] font-medium text-[#8C8F9A]">{f.label}</label>
                <Input defaultValue={f.value} className="h-9 bg-[#0A0A0C] border-white/10 text-white text-[13px] rounded-xl" />
              </div>
            ))}
          </div>
        </div>

        <div className={`${glassCard} p-5`}>
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Shield size={16} className="text-[#D4A24C]" /> Moderação</h3>
          <div className="space-y-4">
            {[
              { label: "Aprovação automática", val: true },
              { label: "Notificar sobre denúncias", val: true },
              { label: "Bloqueio automático após 3 denúncias", val: true },
            ].map((f) => (
              <div key={f.label} className="flex items-center justify-between py-2">
                <label className="text-[13px] text-white">{f.label}</label>
                <Toggle value={f.val} />
              </div>
            ))}
            <div className="space-y-1.5 pt-2">
              <label className="text-[12px] font-medium text-[#8C8F9A]">Limite de anúncios por usuário</label>
              <Input defaultValue="50" className="h-9 bg-[#0A0A0C] border-white/10 text-white text-[13px] rounded-xl" />
            </div>
          </div>
        </div>

        <div className={`${glassCard} p-5`}>
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Lock size={16} className="text-[#D4A24C]" /> Segurança</h3>
          <div className="space-y-4">
            {[
              { label: "Autenticação em dois fatores", val: false },
              { label: "Recaptcha no cadastro", val: true },
              { label: "Verificação de email obrigatória", val: false },
              { label: "Log de atividades", val: true },
            ].map((f) => (
              <div key={f.label} className="flex items-center justify-between py-2">
                <label className="text-[13px] text-white">{f.label}</label>
                <Toggle value={f.val} />
              </div>
            ))}
          </div>
        </div>

        <div className={`${glassCard} p-5`}>
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Sliders size={16} className="text-[#D4A24C]" /> Aparência</h3>
          <div className="space-y-4">
            {[
              { label: "Tema escuro", val: true },
              { label: "Modo compacto", val: false },
              { label: "Mostrar indicadores", val: true },
            ].map((f) => (
              <div key={f.label} className="flex items-center justify-between py-2">
                <label className="text-[13px] text-white">{f.label}</label>
                <Toggle value={f.val} />
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-white/[0.06]">
            <Button className="w-full h-10 bg-[#D4A24C] text-black font-bold rounded-xl hover:bg-[#C49542]">Salvar Configurações</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
