import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import blivreAPI from "../services/blivreAPI";

const BLivreAuthContext = createContext(null);

const STORAGE_KEY = "blivre_token";

export function BLivreAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [loading, setLoading] = useState(true);

  const authHeaders = token ? { Authorization: "Bearer " + token } : {};

  const checkAuth = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const res = await axios.get(blivreAPI.auth.me(), { headers: authHeaders });
      setUser(res.data.user || res.data);
    } catch {
      setUser(null);
      setToken(null);
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, [token, authHeaders]);

  useEffect(() => { checkAuth(); }, []);

  const login = async (email, password) => {
    const res = await axios.post(blivreAPI.auth.login(), { email, password });
    setToken(res.data.token);
    setUser(res.data.user);
    localStorage.setItem(STORAGE_KEY, res.data.token);
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await axios.post(blivreAPI.auth.register(), { name, email, password });
    setToken(res.data.token);
    setUser(res.data.user);
    localStorage.setItem(STORAGE_KEY, res.data.token);
    return res.data;
  };

  const logout = async () => {
    try { await axios.post(blivreAPI.auth.logout(), {}, { headers: authHeaders }); } catch {}
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <BLivreAuthContext.Provider value={{ user, token, loading, login, register, logout, authHeaders }}>
      {children}
    </BLivreAuthContext.Provider>
  );
}

export const useBLivreAuth = () => {
  const ctx = useContext(BLivreAuthContext);
  if (!ctx) throw new Error("useBLivreAuth must be used within BLivreAuthProvider");
  return ctx;
};
