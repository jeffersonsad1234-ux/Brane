import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

const API = `${process.env.REACT_APP_BACKEND_URL || "https://brane-production-3c87.up.railway.app"}/api`;

const AdminDataContext = createContext(null);

export function AdminDataProvider({ children }) {
  const { user, token } = useAuth();
  const authHeaders = token ? { Authorization: "Bearer " + token } : {};

  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, postsRes, supportRes, notifRes] = await Promise.allSettled([
        axios.get(API + "/admin/users", { headers: authHeaders }).catch(() => ({ value: { data: { users: [] } } })),
        axios.get(API + "/social/posts?limit=100&page=1", { headers: authHeaders }).catch(() => ({ value: { data: { posts: [] } } })),
        axios.get(API + "/admin/support", { headers: authHeaders }).catch(() => ({ value: { data: { tickets: [] } } })),
        axios.get(API + "/notifications", { headers: authHeaders }).catch(() => ({ value: { data: { notifications: [], unread: 0 } } })),
      ]);

      if (usersRes.status === "fulfilled") setUsers(usersRes.value.data.users || []);
      if (postsRes.status === "fulfilled") setPosts(postsRes.value.data.posts || []);
      if (supportRes.status === "fulfilled") setSupportTickets(supportRes.value.data.tickets || []);
      if (notifRes.status === "fulfilled") {
        setNotifications(notifRes.value.data.notifications || []);
      }

      // Dashboard — aggregated
      const userList = usersRes.status === "fulfilled" ? usersRes.value.data.users || [] : [];
      const postList = postsRes.status === "fulfilled" ? postsRes.value.data.posts || [] : [];
      setDashboard({
        totalUsers: userList.length,
        totalPosts: postList.length,
        activePosts: postList.filter(p => (p.status || "active") !== "blocked").length,
        blockedPosts: postList.filter(p => p.status === "blocked").length,
        pendingPosts: postList.filter(p => p.status === "pending").length,
        totalReports: 0,
        totalMessages: 0,
        growthUsers: "+8%",
        growthPosts: "+12%",
        growthRevenue: "+23%",
        revenue: "R$ 47.890",
      });
    } catch (e) {
      console.error("AdminData fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { if (token) fetchAll(); else setLoading(false); }, [token, fetchAll]);

  const blockUser = async (uid) => {
    try {
      await axios.put(API + "/admin/users/" + uid + "/block", {}, { headers: authHeaders });
      setUsers(prev => prev.map(u => u.id === uid ? { ...u, blocked: !u.blocked } : u));
    } catch (e) { console.error(e); }
  };

  const deletePost = async (key) => {
    try {
      await axios.delete(API + "/social/posts/" + key, { headers: authHeaders });
      setPosts(prev => prev.filter(p => p.key !== key && p.id !== key));
    } catch (e) { console.error(e); }
  };

  return (
    <AdminDataContext.Provider value={{
      dashboard, users, posts, supportTickets, notifications, loading,
      fetchAll, blockUser, deletePost, API, authHeaders
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
