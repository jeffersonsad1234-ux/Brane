const DEFAULT_BACKEND = process.env.REACT_APP_BACKEND_URL || "https://brane-production-3c87.up.railway.app";
const BLIVRE_API_BASE = `${DEFAULT_BACKEND}/api/blivre`;

export const blivreAPI = {
  base: BLIVRE_API_BASE,

  // Auth
  auth: {
    login: () => `${BLIVRE_API_BASE}/auth/login`,
    register: () => `${BLIVRE_API_BASE}/auth/register`,
    logout: () => `${BLIVRE_API_BASE}/auth/logout`,
    session: () => `${BLIVRE_API_BASE}/auth/session`,
    me: () => `${BLIVRE_API_BASE}/auth/me`,
  },

  // Ads / Posts
  posts: {
    list: (limit = 24, page = 1) => `${BLIVRE_API_BASE}/posts?limit=${limit}&page=${page}`,
    create: () => `${BLIVRE_API_BASE}/posts`,
    update: (key) => `${BLIVRE_API_BASE}/posts/${key}`,
    delete: (key) => `${BLIVRE_API_BASE}/posts/${key}`,
  },

  // Favorites
  favorites: {
    list: () => `${BLIVRE_API_BASE}/favorites`,
    toggle: (key) => `${BLIVRE_API_BASE}/favorites/${key}`,
  },

  // Stats
  stats: {
    get: () => `${BLIVRE_API_BASE}/stats`,
  },

  // Profile
  profile: {
    update: () => `${BLIVRE_API_BASE}/profile`,
  },

  // Messages
  messages: {
    list: () => `${BLIVRE_API_BASE}/messages`,
    conversation: (postId) => `${BLIVRE_API_BASE}/messages?post_id=${postId}`,
    send: () => `${BLIVRE_API_BASE}/messages`,
  },

  // Notifications
  notifications: {
    list: () => `${BLIVRE_API_BASE}/notifications`,
    readAll: () => `${BLIVRE_API_BASE}/notifications/read-all`,
  },
};

export default blivreAPI;
