import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Eye, EyeOff, ArrowLeft, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { BRANE_LOGO_URL } from '../components/Navbar';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function PasswordInput({ value, onChange, placeholder, testId, ...props }) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <Input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="brane-input pr-10 mt-1.5"
        data-testid={testId}
        {...props}
      />

      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 translate-y-[2px] text-[#A6A8B3] hover:text-[#D4A24C]"
      >
        {show ? (
          <EyeOff className="w-4 h-4" />
        ) : (
          <Eye className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}

export default function AuthPage() {
  const { login, register, loginWithGoogle, user } = useAuth();
  const navigate = useNavigate();

  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const [regData, setRegData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'buyer'
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' ? '/admin' : '/market', {
        replace: true
      });
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await login(
        loginData.email,
        loginData.password
      );

      toast.success('Bem-vindo ao BRANE!');

      navigate(
        res.user.role === 'admin'
          ? '/admin'
          : '/market'
      );
    } catch (err) {
      toast.error(
        err.response?.data?.detail ||
        'Email ou senha incorretos'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await register(
        regData.name,
        regData.email,
        regData.password,
        regData.role
      );

      toast.success('Conta criada com sucesso!');
      navigate('/market');
    } catch (err) {
      toast.error(
        err.response?.data?.detail ||
        'Erro ao criar conta'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden flex items-center justify-center py-12 px-4 bg-[#050608]"
      data-testid="auth-page"
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[520px] h-[520px] bg-[#5B1CB5]/18 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 -right-40 w-[520px] h-[520px] bg-[#D4A24C]/12 rounded-full blur-[140px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs text-[#A6A8B3] hover:text-[#D4A24C] mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar
        </Link>

        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto rounded-2xl overflow-hidden ring-1 ring-[#D4A24C]/35 mb-4">
            <img
              src={BRANE_LOGO_URL}
              alt="BRANE"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-[#D4A24C]/60" />
            <Sparkles className="w-4 h-4 text-[#D4A24C]" />
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-[#6D28D9]/60" />
          </div>

          <h1 className="text-3xl font-extrabold brane-gold-text mb-2">
            BRANE
          </h1>

          <p className="text-[11px] text-[#A6A8B3] tracking-[0.3em] uppercase">
            Bem-vindo
          </p>
        </div>

        <div className="brane-card p-6 md:p-7 brane-shadow-purple">
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2 mb-6 brane-tabs-list">
              <TabsTrigger value="login">
                Entrar
              </TabsTrigger>

              <TabsTrigger value="register">
                Criar conta
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form
                onSubmit={handleLogin}
                className="space-y-4"
              >
                <div>
                  <Label>Email</Label>

                  <Input
                    type="email"
                    value={loginData.email}
                    onChange={(e) =>
                      setLoginData({
                        ...loginData,
                        email: e.target.value
                      })
                    }
                    required
                    className="brane-input mt-1.5"
                  />
                </div>

                <div>
                  <Label>Senha</Label>

                  <PasswordInput
                    value={loginData.password}
                    onChange={(e) =>
                      setLoginData({
                        ...loginData,
                        password: e.target.value
                      })
                    }
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="brane-btn-primary w-full justify-center"
                >
                  {loading
                    ? 'Entrando...'
                    : 'Entrar na plataforma'}
                </button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form
                onSubmit={handleRegister}
                className="space-y-4"
              >
                <div>
                  <Label>Nome completo</Label>

                  <Input
                    value={regData.name}
                    onChange={(e) =>
                      setRegData({
                        ...regData,
                        name: e.target.value
                      })
                    }
                    required
                    className="brane-input mt-1.5"
                  />
                </div>

                <div>
                  <Label>Email</Label>

                  <Input
                    type="email"
                    value={regData.email}
                    onChange={(e) =>
                      setRegData({
                        ...regData,
                        email: e.target.value
                      })
                    }
                    required
                    className="brane-input mt-1.5"
                  />
                </div>

                <div>
                  <Label>Senha</Label>

                  <PasswordInput
                    value={regData.password}
                    onChange={(e) =>
                      setRegData({
                        ...regData,
                        password: e.target.value
                      })
                    }
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="brane-btn-primary w-full justify-center"
                >
                  {loading
                    ? 'Criando...'
                    : 'Criar minha conta'}
                </button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-5 pt-5 border-t border-[#1E2230]">
            <button
              onClick={loginWithGoogle}
              className="brane-btn-outline w-full justify-center"
            >
              Entrar com Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
