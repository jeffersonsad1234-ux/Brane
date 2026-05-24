export const FMT = (s) => {
  if (s == null || isNaN(s)) return "00:00.00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 100);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}.${String(ms).padStart(2, "0")}`;
};

export const UID = () => Math.random().toString(36).slice(2, 9);

export function truncate(str, max = 100) {
  if (!str) return "";
  return str.length > max ? str.slice(0, max) + "..." : str;
}

export function parseJSON(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

export function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function throttle(fn, ms = 300) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= ms) {
      last = now;
      fn(...args);
    }
  };
}

export function classNames(...args) {
  return args.filter(Boolean).join(" ");
}

export async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function stripHtml(html) {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}
