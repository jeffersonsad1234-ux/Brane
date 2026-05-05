import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || "").trim();
const API = BACKEND_URL ? `${BACKEND_URL}/api` : "/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('brane_token'));
  const [loading, setLoading] = useState(true);

  const getHeaders = useCallback(() => {
    if (token) return { Authorization: `Bearer ${token}` };
    return {};
  }, [token]);

  const checkAuth = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/auth/me`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        
      });
      setUser(res.data);
    } catch {
      setUser(null);
      setToken(null);
      localStorage.removeItem('brane_token');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    // CRITICAL: If returning from OAuth callback, skip the /me check.
    // AuthCallback will exchange the session_id and establish the session first.
    if (window.location.hash?.includes('session_id=')) {
      setLoading(false);
      return;
    }
    if (token) {
      checkAuth();
    } else {
      setLoading(false);
    }
  }, [checkAuth, token]);

  const login = async (email, password) => {
    const res = await axios.post(`${API}/auth/login`, { email, password });
    setToken(res.data.token);
    setUser(res.data.user);
    localStorage.setItem('brane_token', res.data.token);
    return res.data;
  };

  const register = async (name, email, password, role = 'buyer') => {
    const res = await axios.post(`${API}/auth/register`, { 
      name: name.trim(), 
      email: email.trim().toLowerCase(), 
      password, 
      role 
    });
    setToken(res.data.token);
    setUser(res.data.user);
    localStorage.setItem('brane_token', res.data.token);
    return res.data;
  };

  const loginWithGoogle = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const exchangeSession = async (sessionId) => {
    const res = await axios.post(`${API}/auth/session`, { session_id: sessionId }, {  });
    setUser(res.data);
    return res.data;
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, {  });
    } catch {}
    setUser(null);
    setToken(null);
    localStorage.removeItem('brane_token');
  };

  const switchRole = async (role) => {
    const res = await axios.put(`${API}/users/role`, { role }, {
      headers: getHeaders()
    });
    setToken(res.data.token);
    setUser(res.data.user);
    localStorage.setItem('brane_token', res.data.token);
    return res.data;
  };

  return (
    <AuthContext.Provider value={{
      user, token, loading, login, register, logout,
      loginWithGoogle, exchangeSession, switchRole,
      getHeaders, API, setUser, setToken
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
