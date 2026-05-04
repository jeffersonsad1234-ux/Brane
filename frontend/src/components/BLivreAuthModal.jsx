import { useEffect, useState } from "react";
import { X, User, Mail, Lock } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function BLivreAuthModal({ isOpen, onClose, onAuthSuccess }) {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    setLoading(false);
  }, [isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        if (typeof onAuthSuccess === "function") onAuthSuccess();
        onClose();
      } else {
        if (formData.password !== formData.confirmPassword) {
          setError("As senhas não coincidem");
          setLoading(false);
          return;
        }
        await register(formData.name, formData.email, formData.password);
        if (typeof onAuthSuccess === "function") onAuthSuccess();
        onClose();
      }
    } catch (err) {
      const apiMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "";

      if (apiMessage) {
        setError(apiMessage);
      } else if (isLogin) {
        setError("Email ou senha incorretos.");
      } else {
        setError("Erro de conexão. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-3xl border border-[#D4A24C]/25 bg-[#0B0B12] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.62)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-center flex-1">
            <h2 className="text-2xl font-black text-white mb-2">
              {isLogin ? "Bem-vindo à B-Livre!" : "Junte-se à B-Livre!"}
            </h2>
            <p className="text-sm text-[#8C8F9A]">
              {isLogin
                ? "Entre para anunciar, favoritar e conversar"
                : "Crie sua conta gratuita e comece a desapegar"
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-white/10 bg-white/[0.04] flex items-center justify-center text-[#C9CBD6] hover:bg-white/10"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm text-[#8C8F9A] font-bold mb-2">
                Nome completo
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8F9A]" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white placeholder-[#7B7E8B] focus:border-[#D4A24C] focus:outline-none"
                  placeholder="Seu nome completo"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm text-[#8C8F9A] font-bold mb-2">
              Email
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8F9A]" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white placeholder-[#7B7E8B] focus:border-[#D4A24C] focus:outline-none"
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-[#8C8F9A] font-bold mb-2">
              Senha
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8F9A]" />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white placeholder-[#7B7E8B] focus:border-[#D4A24C] focus:outline-none"
                placeholder="Sua senha"
                required
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm text-[#8C8F9A] font-bold mb-2">
                Confirmar senha
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8F9A]" />
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white placeholder-[#7B7E8B] focus:border-[#D4A24C] focus:outline-none"
                  placeholder="Confirme sua senha"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#D4A24C] text-black font-bold py-3 rounded-xl hover:bg-[#C49542] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Carregando..." : (isLogin ? "Entrar" : "Criar conta")}
          </button>
        </form>

        {/* Toggle Login/Register */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
              setFormData({
                name: "",
                email: "",
                password: "",
                confirmPassword: ""
              });
            }}
            className="text-[#D4A24C] hover:text-[#F1D28A] text-sm"
          >
            {isLogin
              ? "Não tem conta? Criar agora"
              : "Já tem conta? Fazer login"
            }
          </button>
        </div>

        {/* Benefits */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <p className="text-xs text-[#8C8F9A] text-center mb-3">
            Ao se cadastrar você pode:
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs text-[#8C8F9A]">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#D4A24C]" />
              Anunciar produtos
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#D4A24C]" />
              Conversar com vendedores
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#D4A24C]" />
              Salvar favoritos
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#D4A24C]" />
              Receber notificações
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}