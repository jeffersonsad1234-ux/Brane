import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Eye, EyeOff, ArrowLeft, Mail, Shield, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_brane-exchange/artifacts/wiagamwr_IMG_20260412_043249_662.jpg';
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
        className="bg-[#111] border-[#2A2A2A] text-white pr-10"
        data-testid={testId}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-[#B38B36]"
        data-testid={`${testId}-toggle`}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

// Email verification modal/flow - after registration
function EmailVerificationStep({ email, initialCode, onVerified, onCancel }) {
  const [code, setCode] = useState('');
  const [displayCode, setDisplayCode] = useState(initialCode || '');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const verifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/verify-email`, { email, code });
      toast.success('Email verificado com sucesso!');
      onVerified(res.data.user);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Código inválido');
    } finally { setLoading(false); }
  };

  const resendCode = async () => {
    setResending(true);
    try {
      const res = await axios.post(`${API}/auth/send-verification`, { email });
      if (res.data.already_verified) {
        toast.success('Email já verificado!');
        return;
      }
      setDisplayCode(res.data.verification_code || '');
      toast.success('Novo código enviado!');
    } catch {
      toast.error('Erro ao reenviar código');
    } finally { setResending(false); }
  };

  return (
    <div>
      <button onClick={onCancel} className="flex items-center gap-1 text-sm text-[#B38B36] mb-4 hover:text-[#9A752B]" data-testid="back-to-auth">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#B38B36]/20 to-[#8B6914]/10 border border-[#B38B36]/40 flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-[#B38B36]" />
        </div>
        <h3 className="font-bold text-xl text-white font-['Outfit'] mb-2">Verifique seu email</h3>
        <p className="text-xs text-[#888] leading-relaxed">
          Enviamos um código de 6 dígitos para<br />
          <span className="text-[#B38B36] font-semibold">{email}</span>
        </p>
      </div>

      {/* DEV MODE: show code on screen */}
      {displayCode && (
        <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-amber-400" />
            <p className="text-xs font-semibold text-amber-300">Modo desenvolvimento</p>
          </div>
          <p className="text-[10px] text-amber-200/70 mb-2">Servidor SMTP ainda não configurado. Seu código:</p>
          <p className="text-3xl font-bold text-white text-center font-mono tracking-[0.5em] py-2">{displayCode}</p>
        </div>
      )}

      <form onSubmit={verifyCode} className="space-y-4">
        <div>
          <Label className="text-[#CCC]">Código de verificação</Label>
          <Input
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            className="bg-[#111] border-[#2A2A2A] text-white text-center text-2xl tracking-[0.5em] font-mono"
            placeholder="000000"
            maxLength={6}
            data-testid="verify-code-input"
          />
        </div>
        <Button type="submit" className="w-full gold-btn rounded-lg gap-2" disabled={loading || code.length !== 6} data-testid="verify-submit-btn">
          {loading ? 'Verificando...' : <>Confirmar <CheckCircle2 className="w-4 h-4" /></>}
        </Button>
      </form>

      <div className="text-center mt-4">
        <button
          onClick={resendCode}
          disabled={resending}
          className="text-xs text-[#B38B36] hover:text-[#9A752B] disabled:opacity-50"
          data-testid="resend-code-btn"
        >
          {resending ? 'Reenviando...' : 'Não recebeu? Reenviar código'}
        </button>
      </div>
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
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-[#B38B36] mb-4 hover:text-[#9A752B]" data-testid="back-to-login">
        <ArrowLeft className="w-4 h-4" /> Voltar ao login
      </button>
      <h3 className="font-bold text-lg text-white mb-4 font-['Outfit']">Recuperar Senha</h3>

      {step === 1 ? (
        <form onSubmit={requestCode} className="space-y-4">
          <div>
            <Label className="text-[#CCC]">Email cadastrado</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="bg-[#111] border-[#2A2A2A] text-white" placeholder="seu@email.com" data-testid="forgot-email" />
          </div>
          <Button type="submit" className="w-full gold-btn rounded-lg" disabled={loading} data-testid="send-code-btn">
            {loading ? 'Enviando...' : 'Enviar Código'}
          </Button>
        </form>
      ) : (
        <form onSubmit={resetPassword} className="space-y-4">
          <div className="bg-[#111] rounded-lg p-3 border border-[#B38B36]/30 mb-2">
            <p className="text-xs text-[#B38B36]">Código enviado para {email}</p>
            <p className="text-lg font-bold text-white font-mono tracking-wider mt-1">{sentCode}</p>
          </div>
          <div>
            <Label className="text-[#CCC]">Código de verificação</Label>
            <Input value={code} onChange={e => setCode(e.target.value)} required
              className="bg-[#111] border-[#2A2A2A] text-white text-center text-lg tracking-widest" placeholder="000000" maxLength={6} data-testid="reset-code" />
          </div>
          <div>
            <Label className="text-[#CCC]">Nova senha</Label>
            <PasswordInput value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} testId="new-password" />
          </div>
          <Button type="submit" className="w-full gold-btn rounded-lg" disabled={loading} data-testid="reset-password-btn">
            {loading ? 'Alterando...' : 'Alterar Senha'}
          </Button>
        </form>
      )}
    </div>
  );
}

export default function AuthPage() {
  const { login, loginWithGoogle, user, setUser, setToken } = useAuth();
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [regData, setRegData] = useState({ name: '', email: '', password: '', role: 'buyer' });
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  // Verification state
  const [verifyingEmail, setVerifyingEmail] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');

  if (user && !verifyingEmail) {
    navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    return null;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(loginData.email, loginData.password);
      toast.success('Login realizado!');
      navigate(res.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao fazer login');
    } finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/register`, regData);
      // Store token so user is authenticated (verification is for email only)
      localStorage.setItem('brane_token', res.data.token);
      if (setToken) setToken(res.data.token);
      if (setUser) setUser(res.data.user);

      if (res.data.verification_required) {
        setVerifyingEmail(regData.email.trim().toLowerCase());
        setVerificationCode(res.data.verification_code || '');
        toast.success('Conta criada! Verifique seu email.');
      } else {
        toast.success('Conta criada com sucesso!');
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao criar conta');
    } finally { setLoading(false); }
  };

  const onEmailVerified = (verifiedUser) => {
    if (setUser) setUser(verifiedUser);
    toast.success('Bem-vindo ao BRANE!');
    navigate('/dashboard');
  };

  const cancelVerification = () => {
    // User can proceed without verifying, but they can verify later from profile
    setVerifyingEmail(null);
    navigate('/dashboard');
  };

  const roleLabels = { buyer: 'Comprador', seller: 'Vendedor', affiliate: 'Afiliado' };

  return (
    <div className="min-h-screen carbon-bg flex items-center justify-center py-12 px-4" data-testid="auth-page">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={LOGO_URL} alt="BRANE" className="w-16 h-16 rounded-xl mx-auto mb-3" />
          <h1 className="text-2xl font-bold font-['Outfit'] text-white">Bem-vindo ao BRANE</h1>
          <p className="text-sm text-[#888]">Marketplace Premium</p>
        </div>

        <div className="dark-card rounded-xl p-6">
          {verifyingEmail ? (
            <EmailVerificationStep
              email={verifyingEmail}
              initialCode={verificationCode}
              onVerified={onEmailVerified}
              onCancel={cancelVerification}
            />
          ) : showForgot ? (
            <ForgotPasswordForm onBack={() => setShowForgot(false)} />
          ) : (
            <>
              <Tabs defaultValue="login">
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-[#111] border border-[#2A2A2A]">
                  <TabsTrigger value="login" className="data-[state=active]:bg-[#B38B36] data-[state=active]:text-white" data-testid="tab-login">Entrar</TabsTrigger>
                  <TabsTrigger value="register" className="data-[state=active]:bg-[#B38B36] data-[state=active]:text-white" data-testid="tab-register">Criar Conta</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label className="text-[#CCC]">Email</Label>
                      <Input type="email" value={loginData.email} onChange={e => setLoginData({...loginData, email: e.target.value})}
                        required className="bg-[#111] border-[#2A2A2A] text-white" data-testid="login-email" />
                    </div>
                    <div>
                      <Label className="text-[#CCC]">Senha</Label>
                      <PasswordInput value={loginData.password} onChange={e => setLoginData({...loginData, password: e.target.value})} required testId="login-password" />
                    </div>
                    <div className="flex justify-end">
                      <button type="button" onClick={() => setShowForgot(true)} className="text-xs text-[#B38B36] hover:text-[#9A752B]" data-testid="forgot-password-link">
                        Esqueceu a senha?
                      </button>
                    </div>
                    <Button type="submit" className="w-full gold-btn rounded-lg" disabled={loading} data-testid="login-submit">
                      {loading ? 'Entrando...' : 'Entrar'}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <Label className="text-[#CCC]">Nome completo</Label>
                      <Input value={regData.name} onChange={e => setRegData({...regData, name: e.target.value})}
                        required minLength={2} className="bg-[#111] border-[#2A2A2A] text-white" placeholder="Seu nome" data-testid="register-name" />
                    </div>
                    <div>
                      <Label className="text-[#CCC]">Email</Label>
                      <Input type="email" value={regData.email} onChange={e => setRegData({...regData, email: e.target.value})}
                        required className="bg-[#111] border-[#2A2A2A] text-white" placeholder="seu@email.com" data-testid="register-email" />
                      <p className="text-xs text-[#555] mt-1">Emails temporários não são aceitos. Você receberá um código.</p>
                    </div>
                    <div>
                      <Label className="text-[#CCC]">Senha</Label>
                      <PasswordInput value={regData.password} onChange={e => setRegData({...regData, password: e.target.value})} required minLength={6} testId="register-password" />
                    </div>
                    <div>
                      <Label className="text-[#CCC]">Cadastrar como</Label>
                      <Select value={regData.role} onValueChange={v => setRegData({...regData, role: v})}>
                        <SelectTrigger className="bg-[#111] border-[#2A2A2A] text-white" data-testid="register-role-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1A1A1A] border-[#2A2A2A]">
                          <SelectItem value="buyer"><span className="flex items-center gap-2">Comprador</span></SelectItem>
                          <SelectItem value="seller"><span className="flex items-center gap-2">Vendedor</span></SelectItem>
                          <SelectItem value="affiliate"><span className="flex items-center gap-2">Afiliado</span></SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-[#555] mt-1">
                        {regData.role === 'seller' ? 'Venda seus produtos na plataforma' :
                         regData.role === 'affiliate' ? 'Ganhe comissões indicando produtos' :
                         'Compre produtos na plataforma'}
                      </p>
                    </div>
                    <Button type="submit" className="w-full gold-btn rounded-lg" disabled={loading} data-testid="register-submit">
                      {loading ? 'Criando...' : 'Criar Conta'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="mt-4 pt-4 border-t border-[#2A2A2A]">
                <Button variant="outline" className="w-full rounded-lg border-[#2A2A2A] text-[#CCC] hover:bg-[#1A1A1A]" onClick={loginWithGoogle} data-testid="google-login-btn">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
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
