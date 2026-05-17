import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL || "https://brane-production-3c87.up.railway.app"}/api`;

const AdminDataContext = createContext(null);

export function AdminDataProvider({ children }) {
  const [token, setToken] = useState(null);
  const authHeaders = token ? { Authorization: "Bearer " + token } : {};

  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Grab token from B Livre auth (blivre_token) or main auth
  useEffect(() => {
    try {
      const stored = localStorage.getItem("blivre_token") || localStorage.getItem("auth_token") || localStorage.getItem("token");
      if (stored) setToken(stored);
    } catch { /* noop */ }
    const check = () => {
      const t = localStorage.getItem("blivre_token") || localStorage.getItem("auth_token") || localStorage.getItem("token");
      if (t !== token) setToken(t);
    };
    window.addEventListener("storage", check);
    const poll = setInterval(check, 2000);
    return () => { window.removeEventListener("storage", check); clearInterval(poll); };
  }, [token]);

  const fetchAll = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    try {
      const [usersRes, postsRes, supportRes, statsRes] = await Promise.allSettled([
        axios.get(API + "/admin/users", { headers: authHeaders }),
        axios.get(API + "/admin/posts?limit=200", { headers: authHeaders }),
        axios.get(API + "/admin/support", { headers: authHeaders }),
        axios.get(API + "/admin/stats", { headers: authHeaders }),
      ]);

      if (usersRes.status === "fulfilled") setUsers(usersRes.value.data.users || []);
      if (postsRes.status === "fulfilled") setPosts(postsRes.value.data.posts || []);
      if (supportRes.status === "fulfilled") {
        const d = supportRes.value.data;
        setSupportTickets(d.tickets || d.messages || []);
      }

      // Dashboard from real /admin/stats
      if (statsRes.status === "fulfilled") {
        const s = statsRes.value.data;
        setDashboard({
          totalUsers: s.total_users || 0,
          totalPosts: s.total_posts || 0,
          totalMessages: s.total_messages || 0,
          postsToday: s.posts_today || 0,
          usersToday: s.users_today || 0,
        });
      }
    } catch (e) {
      console.error("AdminData fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const blockUser = async (uid) => {
    try {
      await axios.put(API + "/admin/users/" + uid + "/block", {}, { headers: authHeaders });
      setUsers(prev => prev.map(u => (u.user_id || u.id) === uid ? { ...u, is_blocked: !u.is_blocked } : u));
    } catch (e) { console.error(e); }
  };

  const deletePost = async (key) => {
    try {
      await axios.delete(API + "/social/posts/" + key, { headers: authHeaders });
      setPosts(prev => prev.filter(p => (p.post_id || p.key || p.id) !== key));
    } catch (e) { console.error(e); }
  };

  return (
    <AdminDataContext.Provider value={{
      dashboard, users, posts, supportTickets, notifications, transactions, loading,
      fetchAll, blockUser, deletePost, API, authHeaders, token
    }}>
      {children}
    </AdminDataContext.Provider>
  );
}

export const useAdminData = () => {
  const ctx = useContext(AdminDataContext);
  if (!ctx) throw new Error("useAdminData must be used within AdminDataProvider");
  return ctx;
};
