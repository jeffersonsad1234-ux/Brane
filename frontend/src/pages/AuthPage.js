import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Eye, EyeOff, ArrowLeft, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

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
        className="bg-black/40 border-purple-900/40 text-white pr-10 focus:border-pink-400"
        data-testid={testId}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-300/60 hover:text-pink-400"
        data-testid={`${testId}-toggle`}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

function ForgotPasswordForm({ onBack }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [sentCode, setSentCode] = useState('');
  const [loading, setLoading] = useState(false);

  const requestCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/forgot-password`, { email });
      setSentCode(res.data.code);
      toast.success('Código enviado!');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Email não encontrado');
    } finally { setLoading(false); }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/auth/reset-password`, { email, code, new_password: newPassword });
      toast.success('Senha alterada com sucesso!');
      onBack();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Código inválido');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-pink-300 mb-4 hover:text-pink-200" data-testid="back-to-login">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>
      <h3 className="font-bold text-lg text-white mb-4 font-['Outfit']">Recuperar senha</h3>

      {step === 1 ? (
        <form onSubmit={requestCode} className="space-y-4">
          <div>
            <Label className="text-purple-100">Email cadastrado</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="bg-black/40 border-purple-900/40 text-white focus:border-pink-400" placeholder="seu@email.com" data-testid="forgot-email" />
          </div>
          <Button type="submit" disabled={loading} data-testid="send-code-btn"
            className="w-full rounded-lg text-white" style={{ background: 'linear-gradient(135deg, #ec4899, #a855f7)' }}>
            {loading ? 'Enviando...' : 'Enviar código'}
          </Button>
        </form>
      ) : (
        <form onSubmit={resetPassword} className="space-y-4">
          <div className="bg-pink-500/10 border border-pink-500/30 rounded-lg p-3 mb-2">
            <p className="text-xs text-pink-200">Código para {email}</p>
            <p className="text-lg font-bold text-white font-mono tracking-wider mt-1">{sentCode}</p>
          </div>
          <div>
            <Label className="text-purple-100">Código</Label>
            <Input value={code} onChange={e => setCode(e.target.value)} required
              className="bg-black/40 border-purple-900/40 text-white text-center text-lg tracking-widest focus:border-pink-400" placeholder="000000" maxLength={6} data-testid="reset-code" />
          </div>
          <div>
            <Label className="text-purple-100">Nova senha</Label>
            <PasswordInput value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} testId="new-password" />
          </div>
          <Button type="submit" disabled={loading} data-testid="reset-password-btn"
            className="w-full rounded-lg text-white" style={{ background: 'linear-gradient(135deg, #ec4899, #a855f7)' }}>
            {loading ? 'Alterando...' : 'Alterar senha'}
          </Button>
        </form>
      )}
    </div>
  );
}

export default function AuthPage() {
  const { login, register, loginWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [regData, setRegData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  // Redirect if already logged in (in effect, not render)
  useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' ? '/admin' : '/social', { replace: true });
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(loginData.email, loginData.password);
      toast.success('Bem-vindo ao BRANE!');
      navigate(res.user.role === 'admin' ? '/admin' : '/social');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Email ou senha incorretos');
    } finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(regData.name, regData.email, regData.password, 'buyer');
      toast.success('Conta criada com sucesso!');
      navigate('/social');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao criar conta');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center py-12 px-4"
         style={{ background: 'linear-gradient(135deg, #0a0014 0%, #1a0033 50%, #2d0052 100%)' }}
         data-testid="auth-page">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-1/4 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-pink-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Back link to entry */}
        <Link to="/" className="inline-flex items-center gap-2 text-xs text-purple-200/60 hover:text-pink-300 mb-6 transition-colors" data-testid="back-to-entry">
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar
        </Link>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-pink-400/60" />
            <Sparkles className="w-4 h-4 text-pink-400" />
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-pink-400/60" />
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-2"
              style={{
                fontFamily: "'Outfit', sans-serif",
                background: 'linear-gradient(135deg, #ffffff 0%, #f0abfc 60%, #d946ef 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
            BRANE
          </h1>
          <p className="text-xs text-purple-200/60 tracking-[0.3em] uppercase">Bem-vindo</p>
        </div>

        <div className="rounded-2xl p-6 md:p-7 backdrop-blur-xl"
             style={{
               background: 'linear-gradient(135deg, rgba(26,6,46,0.8), rgba(20,4,38,0.9))',
               border: '1px solid rgba(168,85,247,0.25)',
               boxShadow: '0 25px 60px -15px rgba(217,70,239,0.25)'
             }}>
          {showForgot ? (
            <ForgotPasswordForm onBack={() => setShowForgot(false)} />
          ) : (
            <>
              <Tabs defaultValue="login">
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-black/40 border border-purple-900/40">
                  <TabsTrigger value="login" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500 data-[state=active]:text-white" data-testid="tab-login">
                    Entrar
                  </TabsTrigger>
                  <TabsTrigger value="register" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500 data-[state=active]:text-white" data-testid="tab-register">
                    Criar conta
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label className="text-purple-100">Email</Label>
                      <Input type="email" value={loginData.email} onChange={e => setLoginData({...loginData, email: e.target.value})}
                        required className="bg-black/40 border-purple-900/40 text-white focus:border-pink-400" data-testid="login-email" />
                    </div>
                    <div>
                      <Label className="text-purple-100">Senha</Label>
                      <PasswordInput value={loginData.password} onChange={e => setLoginData({...loginData, password: e.target.value})} required testId="login-password" />
                    </div>
                    <div className="flex justify-end">
                      <button type="button" onClick={() => setShowForgot(true)} className="text-xs text-pink-300 hover:text-pink-200" data-testid="forgot-password-link">
                        Esqueceu a senha?
                      </button>
                    </div>
                    <Button type="submit" disabled={loading} data-testid="login-submit"
                      className="w-full rounded-full py-6 text-white font-semibold"
                      style={{ background: 'linear-gradient(135deg, #ec4899, #a855f7)', boxShadow: '0 10px 30px -10px rgba(217,70,239,0.6)' }}>
                      {loading ? 'Entrando...' : 'Entrar na plataforma'}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <Label className="text-purple-100">Nome completo</Label>
                      <Input value={regData.name} onChange={e => setRegData({...regData, name: e.target.value})}
                        required minLength={2} className="bg-black/40 border-purple-900/40 text-white focus:border-pink-400" placeholder="Seu nome" data-testid="register-name" />
                    </div>
                    <div>
                      <Label className="text-purple-100">Email</Label>
                      <Input type="email" value={regData.email} onChange={e => setRegData({...regData, email: e.target.value})}
                        required className="bg-black/40 border-purple-900/40 text-white focus:border-pink-400" placeholder="seu@email.com" data-testid="register-email" />
                    </div>
                    <div>
                      <Label className="text-purple-100">Senha</Label>
                      <PasswordInput value={regData.password} onChange={e => setRegData({...regData, password: e.target.value})} required minLength={6} testId="register-password" />
                      <p className="text-[10px] text-purple-200/40 mt-1">Mínimo 6 caracteres</p>
                    </div>
                    <Button type="submit" disabled={loading} data-testid="register-submit"
                      className="w-full rounded-full py-6 text-white font-semibold"
                      style={{ background: 'linear-gradient(135deg, #ec4899, #a855f7)', boxShadow: '0 10px 30px -10px rgba(217,70,239,0.6)' }}>
                      {loading ? 'Criando...' : 'Criar minha conta'}
                    </Button>
                    <p className="text-[10px] text-center text-purple-200/50">
                      Ao criar conta você concorda com nossos <Link to="/pages/termos" className="text-pink-300 underline">Termos</Link>
                    </p>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="mt-5 pt-5 border-t border-purple-900/40">
                <Button variant="outline" onClick={loginWithGoogle} data-testid="google-login-btn"
                  className="w-full rounded-full border-purple-900/40 text-purple-100 hover:bg-purple-500/10 hover:text-white hover:border-pink-400/50">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Entrar com Google
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
