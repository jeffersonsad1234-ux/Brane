import { useEffect, useState } from "react";
import { X, LifeBuoy, Mail, User as UserIcon, KeyRound, MessageSquare } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const API = `${(process.env.REACT_APP_BACKEND_URL || "https://brane-production-3c87.up.railway.app").trim().replace(/\/$/, "")}/api`;

/**
 * Modal público de suporte / recuperação de conta.
 * Não exige login — envia para /api/public/support e aparece
 * no painel ADM existente em "Suporte".
 *
 * Props:
 *  - isOpen: boolean
 *  - onClose: () => void
 *  - mode: "support" | "recovery"  (default: "support")
 */
export default function PublicSupportModal({ isOpen, onClose, mode = "support" }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const isRecovery = mode === "recovery";

  useEffect(() => {
    if (!isOpen) {
      setSent(false);
      setSending(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (sending) return;

    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Preencha todos os campos.");
      return;
    }

    setSending(true);
    try {
      await axios.post(`${API}/public/support`, {
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
        category: isRecovery ? "recovery" : "support",
      });
      setSent(true);
      toast.success("Solicitação enviada com sucesso.");
    } catch (err) {
      const detail = err?.response?.data?.detail || "Erro ao enviar. Tente novamente.";
      toast.error(detail);
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-6"
      data-testid="public-support-modal"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-[#D4A24C]/25 bg-[#0B0B12] p-5 sm:p-6 shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl border border-[#D4A24C]/30 bg-[#D4A24C]/10 flex items-center justify-center text-[#F1D28A]">
              {isRecovery ? <KeyRound size={18} /> : <LifeBuoy size={18} />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white leading-tight">
                {isRecovery ? "Recuperar minha conta" : "Falar com suporte"}
              </h2>
              <p className="text-[11px] text-[#8C8F9A] mt-0.5">
                {isRecovery
                  ? "Nossa equipe vai ajudar você a recuperar o acesso."
                  : "Conte seu problema. A equipe responde por aqui."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-white/10 bg-white/[0.04] text-[#C9CBD6] hover:bg-white/10 flex items-center justify-center"
            data-testid="public-support-close"
          >
            <X size={15} />
          </button>
        </div>

        {sent ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-[#D4A24C]/15 border border-[#D4A24C]/30 mx-auto mb-3 flex items-center justify-center text-[#F1D28A]">
              <MessageSquare size={22} />
            </div>
            <h3 className="text-white font-bold text-base mb-1">Tudo certo!</h3>
            <p className="text-[#A6A8B3] text-sm">
              Recebemos sua solicitação. Nossa equipe entrará em contato no e-mail informado em breve.
            </p>
            <button
              onClick={onClose}
              className="mt-5 inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#D4A24C] text-black text-sm font-bold hover:bg-[#C49542]"
              data-testid="public-support-done"
            >
              Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] uppercase tracking-[0.18em] text-[#8C8F9A] font-bold mb-1.5">
                Seu nome
              </label>
              <div className="relative">
                <UserIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8F9A]" />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-white placeholder-[#7B7E8B] text-sm focus:border-[#D4A24C] focus:outline-none"
                  placeholder="Como devemos te chamar?"
                  required
                  data-testid="public-support-name"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-[0.18em] text-[#8C8F9A] font-bold mb-1.5">
                E-mail da conta
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8F9A]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-white placeholder-[#7B7E8B] text-sm focus:border-[#D4A24C] focus:outline-none"
                  placeholder="seu@email.com"
                  required
                  data-testid="public-support-email"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-[0.18em] text-[#8C8F9A] font-bold mb-1.5">
                {isRecovery ? "Descreva o que aconteceu" : "Sua mensagem"}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-white placeholder-[#7B7E8B] text-sm focus:border-[#D4A24C] focus:outline-none resize-none"
                placeholder={
                  isRecovery
                    ? "Ex.: Esqueci minha senha, perdi acesso ao e-mail, etc."
                    : "Conte com o máximo de detalhes."
                }
                required
                data-testid="public-support-message"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full py-2.5 rounded-xl bg-[#D4A24C] text-black text-sm font-extrabold hover:bg-[#C49542] disabled:opacity-50 transition-colors"
              data-testid="public-support-submit"
            >
              {sending ? "Enviando..." : "Enviar solicitação"}
            </button>

            <p className="text-[10.5px] text-[#6F7280] text-center mt-1.5">
              Sua mensagem chega direto ao painel da equipe B Livre.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
