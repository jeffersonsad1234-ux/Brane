import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { User, Mail, Lock, ArrowLeft } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function BLivreAuthPage() {
  const { pathname } = useLocation();
  const isLogin = !pathname.endsWith("/register");
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
        navigate("/blivre");
      } else {
        if (formData.password !== formData.confirmPassword) {
          setError("As senhas não coincidem");
          setLoading(false);
          return;
        }
        await register(formData.name, formData.email, formData.password);
        navigate("/blivre");
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

  return (
    <div className="min-h-screen bg-[#050608] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.04]">
        <button onClick={() => navigate("/blivre")}
          className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#C9CBD6] hover:bg-white/10">
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-sm font-black text-white">B Livre</h1>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm text-[#8C8F9A] font-bold mb-2">Nome completo</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8F9A]" />
                  <input type="text" value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white placeholder-[#7B7E8B] focus:border-[#D4A24C] focus:outline-none"
                    placeholder="Seu nome completo" required={!isLogin} />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm text-[#8C8F9A] font-bold mb-2">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8F9A]" />
                <input type="email" value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white placeholder-[#7B7E8B] focus:border-[#D4A24C] focus:outline-none"
                  placeholder="seu@email.com" required />
              </div>
            </div>

            <div>
              <label className="block text-sm text-[#8C8F9A] font-bold mb-2">Senha</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8F9A]" />
                <input type="password" value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white placeholder-[#7B7E8B] focus:border-[#D4A24C] focus:outline-none"
                  placeholder="Sua senha" required />
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm text-[#8C8F9A] font-bold mb-2">Confirmar senha</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8F9A]" />
                  <input type="password" value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white placeholder-[#7B7E8B] focus:border-[#D4A24C] focus:outline-none"
                    placeholder="Confirme sua senha" required={!isLogin} />
                </div>
              </div>
            )}

            {error && (
              <div className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-[#D4A24C] text-black font-bold py-3 rounded-xl hover:bg-[#C49542] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {loading ? "Carregando..." : (isLogin ? "Entrar" : "Criar conta")}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button onClick={() => {
              navigate(isLogin ? "/blivre/register" : "/blivre/login");
              setError("");
              setFormData({ name: "", email: "", password: "", confirmPassword: "" });
            }} className="text-[#D4A24C] hover:text-[#F1D28A] text-sm">
              {isLogin
                ? "Não tem conta? Criar agora"
                : "Já tem conta? Fazer login"
              }
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10">
            <p className="text-xs text-[#8C8F9A] text-center mb-3">Ao se cadastrar você pode:</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-[#8C8F9A]">
              {["Anunciar produtos", "Conversar com vendedores", "Salvar favoritos", "Receber notificações"].map((text) => (
                <div key={text} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#D4A24C]" />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
