import { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';

function PasswordInput({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <Input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required
        minLength={6}
        className="mt-1.5 h-12 rounded-xl border border-[#D8D1C5] bg-white/95 px-4 pr-10 text-[#111318] placeholder:text-[#8A8A8A] font-medium outline-none focus:border-[#6D28D9] focus:ring-2 focus:ring-[#6D28D9]/20"
      />

      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#6D28D9]"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function AuthModal({ open, onClose }) {
  const { login, register, loginWithGoogle } = useAuth();

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [regData, setRegData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'buyer'
  });

  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(loginData.email, loginData.password);
      toast.success('Login realizado!');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Email ou senha incorretos');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await register(regData.name, regData.email, regData.password, regData.role);
      toast.success('Conta criada com sucesso!');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-white/20 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-md rounded-[28px] bg-white/70 border border-white/70 shadow-[0_30px_90px_rgba(20,20,30,0.25)] backdrop-blur-xl p-5 md:p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white text-[#111318] flex items-center justify-center shadow-lg border border-black/10"
        >
          <X className="w-5 h-5" />
        </button>

        <Tabs defaultValue="login">
          <TabsList className="grid w-full grid-cols-2 mb-5 rounded-2xl bg-white/90 border border-[#E2D8CA] p-1 shadow-sm">
            <TabsTrigger
              value="login"
              className="rounded-xl font-black text-[#111318] data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#5B1CB5] data-[state=active]:to-[#D4A24C] data-[state=active]:text-white"
            >
              Entrar
            </TabsTrigger>

            <TabsTrigger
              value="register"
              className="rounded-xl font-black text-[#111318] data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#5B1CB5] data-[state=active]:to-[#D4A24C] data-[state=active]:text-white"
            >
              Criar conta
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label className="text-[#111318] text-xs uppercase tracking-wider font-black">
                  Email
                </Label>
                <Input
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  required
                  className="mt-1.5 h-12 rounded-xl border border-[#D8D1C5] bg-white/95 px-4 text-[#111318] placeholder:text-[#8A8A8A] font-medium outline-none focus:border-[#6D28D9] focus:ring-2 focus:ring-[#6D28D9]/20"
                />
              </div>

              <div>
                <Label className="text-[#111318] text-xs uppercase tracking-wider font-black">
                  Senha
                </Label>
                <PasswordInput
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#5B1CB5] via-[#8A2CFF] to-[#D4A24C] text-white font-black shadow-[0_14px_35px_rgba(91,28,181,0.28)] disabled:opacity-60"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          </TabsContent>

          <TabsContent value="register">
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <Label className="text-[#111318] text-xs uppercase tracking-wider font-black">
                  Cadastrar como
                </Label>

                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[
                    { value: 'buyer', label: 'Comprador' },
                    { value: 'seller', label: 'Vendedor' },
                    { value: 'affiliate', label: 'Afiliado' }
                  ].map((opt) => {
                    const active = regData.role === opt.value;

                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setRegData({ ...regData, role: opt.value })}
                        className={
                          'h-11 rounded-xl border text-xs font-black transition ' +
                          (active
                            ? 'bg-[#111318] text-white border-[#111318]'
                            : 'bg-white/90 text-[#111318] border-[#D8D1C5] hover:border-[#D4A24C]')
                        }
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label className="text-[#111318] text-xs uppercase tracking-wider font-black">
                  Nome completo
                </Label>
                <Input
                  value={regData.name}
                  onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                  required
                  className="mt-1.5 h-12 rounded-xl border border-[#D8D1C5] bg-white/95 px-4 text-[#111318] placeholder:text-[#8A8A8A] font-medium outline-none focus:border-[#6D28D9] focus:ring-2 focus:ring-[#6D28D9]/20"
                />
              </div>

              <div>
                <Label className="text-[#111318] text-xs uppercase tracking-wider font-black">
                  Email
                </Label>
                <Input
                  type="email"
                  value={regData.email}
                  onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                  required
                  className="mt-1.5 h-12 rounded-xl border border-[#D8D1C5] bg-white/95 px-4 text-[#111318] placeholder:text-[#8A8A8A] font-medium outline-none focus:border-[#6D28D9] focus:ring-2 focus:ring-[#6D28D9]/20"
                />
              </div>

              <div>
                <Label className="text-[#111318] text-xs uppercase tracking-wider font-black">
                  Senha
                </Label>
                <PasswordInput
                  value={regData.password}
                  onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#5B1CB5] via-[#8A2CFF] to-[#D4A24C] text-white font-black shadow-[0_14px_35px_rgba(91,28,181,0.28)] disabled:opacity-60"
              >
                {loading ? 'Criando...' : 'Criar conta'}
              </button>
            </form>
          </TabsContent>
        </Tabs>

        <button
          type="button"
          onClick={loginWithGoogle}
          className="mt-5 w-full h-12 rounded-2xl bg-white text-[#111318] font-black border border-[#D8D1C5] shadow-sm hover:bg-[#F7F3EA]"
        >
          Entrar com Google
        </button>
      </div>
    </div>
  );
}
