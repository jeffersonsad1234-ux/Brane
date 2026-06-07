import axios from 'axios';

const API = (process.env.REACT_APP_BACKEND_URL || "https://brane-production-3c87.up.railway.app").trim() + "/api";

function getHeaders() {
  const token = localStorage.getItem('brane_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getFeed(page = 1, limit = 10) {
  const res = await axios.get(`${API}/branpy/feed?page=${page}&limit=${limit}`, { headers: getHeaders() });
  return res.data;
}

export async function getTrending(page = 1, limit = 20) {
  const res = await axios.get(`${API}/branpy/trending?page=${page}&limit=${limit}`, { headers: getHeaders() });
  return res.data;
}

export async function getVideo(videoId) {
  const res = await axios.get(`${API}/branpy/video/${videoId}`, { headers: getHeaders() });
  return res.data;
}

export async function uploadVideo(file) {
  const form = new FormData();
  form.append('video', file);
  const res = await axios.post(`${API}/branpy/upload`, form, { headers: { ...getHeaders(), 'Content-Type': 'multipart/form-data' }, maxContentLength: Infinity, maxBodyLength: Infinity });
  return res.data;
}

export async function updateVideo(videoId, data) {
  const res = await axios.put(`${API}/branpy/video/${videoId}`, data, { headers: getHeaders() });
  return res.data;
}

export async function deleteVideo(videoId) {
  const res = await axios.delete(`${API}/branpy/video/${videoId}`, { headers: getHeaders() });
  return res.data;
}

export async function getUserVideos(userId, page = 1, limit = 20) {
  const res = await axios.get(`${API}/branpy/user/${userId}/videos?page=${page}&limit=${limit}`, { headers: getHeaders() });
  return res.data;
}

export async function toggleLike(videoId) {
  const res = await axios.post(`${API}/branpy/video/${videoId}/like`, {}, { headers: getHeaders() });
  return res.data;
}

export async function checkLiked(videoId) {
  const res = await axios.get(`${API}/branpy/video/${videoId}/liked`, { headers: getHeaders() });
  return res.data;
}

export async function getComments(videoId, page = 1, limit = 30) {
  const res = await axios.get(`${API}/branpy/video/${videoId}/comments?page=${page}&limit=${limit}`, { headers: getHeaders() });
  return res.data;
}

export async function addComment(videoId, content) {
  const res = await axios.post(`${API}/branpy/video/${videoId}/comment`, { content }, { headers: getHeaders() });
  return res.data;
}

export async function deleteComment(commentId) {
  const res = await axios.delete(`${API}/branpy/comment/${commentId}`, { headers: getHeaders() });
  return res.data;
}

export async function toggleFollow(userId) {
  const res = await axios.post(`${API}/branpy/user/${userId}/follow`, {}, { headers: getHeaders() });
  return res.data;
}

export async function getFollowers(userId, page = 1, limit = 50) {
  const res = await axios.get(`${API}/branpy/user/${userId}/followers?page=${page}&limit=${limit}`, { headers: getHeaders() });
  return res.data;
}

export async function getFollowing(userId, page = 1, limit = 50) {
  const res = await axios.get(`${API}/branpy/user/${userId}/following?page=${page}&limit=${limit}`, { headers: getHeaders() });
  return res.data;
}

export async function checkFollowed(userId) {
  const res = await axios.get(`${API}/branpy/user/${userId}/followed`, { headers: getHeaders() });
  return res.data;
}

export async function addView(videoId) {
  try { await axios.post(`${API}/branpy/video/${videoId}/view`, {}, { headers: getHeaders() }); } catch {}
}

export async function search(q, type = "videos", page = 1, limit = 20) {
  const res = await axios.get(`${API}/branpy/search?q=${encodeURIComponent(q)}&type=${type}&page=${page}&limit=${limit}`, { headers: getHeaders() });
  return res.data;
}

export async function getHashtag(name, page = 1, limit = 20) {
  const res = await axios.get(`${API}/branpy/hashtag/${encodeURIComponent(name)}?page=${page}&limit=${limit}`, { headers: getHeaders() });
  return res.data;
}

export async function getProfile(userId) {
  const res = await axios.get(`${API}/branpy/profile/${userId}`, { headers: getHeaders() });
  return res.data;
}

export async function updateProfile(data) {
  const res = await axios.put(`${API}/branpy/profile`, data, { headers: getHeaders() });
  return res.data;
}

export async function getLiveQuiz(count = 10) {
  const res = await axios.get(`${API}/branpy/live?count=${count}`, { headers: getHeaders() });
  return res.data;
}

export async function getAdminStats() {
  const res = await axios.get(`${API}/branpy/admin/stats`, { headers: getHeaders() });
  return res.data;
}

export async function getAdminVideos(page = 1, limit = 50) {
  const res = await axios.get(`${API}/branpy/admin/videos?page=${page}&limit=${limit}`, { headers: getHeaders() });
  return res.data;
}

export async function getAdminUsers(page = 1, limit = 50) {
  const res = await axios.get(`${API}/branpy/admin/users?page=${page}&limit=${limit}`, { headers: getHeaders() });
  return res.data;
}
