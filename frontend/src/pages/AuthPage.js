import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_brane-exchange/artifacts/wiagamwr_IMG_20260412_043249_662.jpg';

export default function AuthPage() {
  const { login, register, loginWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [regData, setRegData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  if (user) {
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
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(regData.name, regData.email, regData.password);
      toast.success('Conta criada com sucesso!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F8] flex items-center justify-center py-12 px-4" data-testid="auth-page">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={LOGO_URL} alt="BRANE" className="w-16 h-16 rounded-xl mx-auto mb-3" />
          <h1 className="text-2xl font-bold font-['Outfit'] text-[#1A1A1A]">Bem-vindo ao BRANE</h1>
          <p className="text-sm text-[#666]">Marketplace Premium</p>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E5E5] p-6 shadow-sm">
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" data-testid="tab-login">Entrar</TabsTrigger>
              <TabsTrigger value="register" data-testid="tab-register">Criar Conta</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={loginData.email} onChange={e => setLoginData({...loginData, email: e.target.value})} required data-testid="login-email" />
                </div>
                <div>
                  <Label>Senha</Label>
                  <Input type="password" value={loginData.password} onChange={e => setLoginData({...loginData, password: e.target.value})} required data-testid="login-password" />
                </div>
                <Button type="submit" className="w-full gold-btn rounded-lg" disabled={loading} data-testid="login-submit">
                  {loading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <Label>Nome</Label>
                  <Input value={regData.name} onChange={e => setRegData({...regData, name: e.target.value})} required data-testid="register-name" />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={regData.email} onChange={e => setRegData({...regData, email: e.target.value})} required data-testid="register-email" />
                </div>
                <div>
                  <Label>Senha</Label>
                  <Input type="password" value={regData.password} onChange={e => setRegData({...regData, password: e.target.value})} required minLength={6} data-testid="register-password" />
                </div>
                <Button type="submit" className="w-full gold-btn rounded-lg" disabled={loading} data-testid="register-submit">
                  {loading ? 'Criando...' : 'Criar Conta'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-4 pt-4 border-t border-[#E5E5E5]">
            <Button variant="outline" className="w-full rounded-lg" onClick={loginWithGoogle} data-testid="google-login-btn">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Entrar com Google
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
