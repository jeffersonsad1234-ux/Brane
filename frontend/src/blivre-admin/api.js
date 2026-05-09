import axios from "axios";

const RAW = (process.env.REACT_APP_BACKEND_URL || "https://brane-production-3c87.up.railway.app").trim().replace(/\/$/, "");
export const API = `${RAW}/api`;

const TOKEN_KEY = "brane_token"; // mesma chave do AuthContext do projeto

export const blApi = axios.create({ baseURL: API });

blApi.interceptors.request.use((cfg) => {
  const t = localStorage.getItem(TOKEN_KEY);
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

blApi.interceptors.response.use(
  (r) => r,
  (e) => {
    if (e?.response?.status === 401 && !window.location.pathname.startsWith("/admin/blivre/login")) {
      window.location.href = "/admin/blivre/login";
    }
    return Promise.reject(e);
  }
);

export function blFmtErr(e) {
  const d = e?.response?.data?.detail;
  if (!d) return e?.message || "Erro";
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((x) => x.msg || JSON.stringify(x)).join(" • ");
  return JSON.stringify(d);
}
