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
      const [usersRes, postsRes, supportRes, notifRes, financeRes] = await Promise.allSettled([
        axios.get(API + "/admin/users", { headers: authHeaders }),
        axios.get(API + "/admin/blivre/posts?limit=200", { headers: authHeaders }),
        axios.get(API + "/admin/support", { headers: authHeaders }),
        axios.get(API + "/notifications", { headers: authHeaders }),
        axios.get(API + "/admin/finance/dashboard", { headers: authHeaders }),
      ]);

      if (usersRes.status === "fulfilled") setUsers(usersRes.value.data.users || []);
      if (postsRes.status === "fulfilled") setPosts(postsRes.value.data.posts || []);
      if (supportRes.status === "fulfilled") setSupportTickets(supportRes.value.data.tickets || []);
      if (notifRes.status === "fulfilled") setNotifications(notifRes.value.data.notifications || []);
      if (financeRes.status === "fulfilled") setTransactions(financeRes.value.data.transactions || []);

      // Dashboard — computed from real data only
      const userList = usersRes.status === "fulfilled" ? usersRes.value.data.users || [] : [];
      const postList = postsRes.status === "fulfilled" ? postsRes.value.data.posts || [] : [];
      const txList = financeRes.status === "fulfilled" ? financeRes.value.data.transactions || [] : [];

      setDashboard(userList.length > 0 || postList.length > 0 ? {
        totalUsers: userList.length,
        totalPosts: postList.length,
        activePosts: postList.filter(p => (p.status || "active") !== "blocked" && p.status !== "bloqueado").length,
        blockedPosts: postList.filter(p => p.status === "blocked" || p.status === "bloqueado").length,
        pendingPosts: postList.filter(p => p.status === "pending" || p.status === "pendente").length,
        totalTransactions: txList.length,
      } : null);
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
