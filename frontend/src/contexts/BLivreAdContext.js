import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useBLivreAuth } from "./BLivreAuthContext";
import blivreAPI from "../services/blivreAPI";

const PAGE_SIZE = 24;

export const categories = ["Celulares", "Veículos", "Imóveis", "Casa e móveis", "Moda", "Serviços", "Outros"];

export const states = [
  "Acre", "Alagoas", "Amapá", "Amazonas", "Bahia", "Ceará", "Distrito Federal",
  "Espírito Santo", "Goiás", "Maranhão", "Mato Grosso", "Mato Grosso do Sul",
  "Minas Gerais", "Pará", "Paraíba", "Paraná", "Pernambuco", "Piauí",
  "Rio de Janeiro", "Rio Grande do Norte", "Rio Grande do Sul", "Rondônia",
  "Roraima", "Santa Catarina", "São Paulo", "Sergipe", "Tocantins"
];

export const productConditions = ["Novo", "Usado", "Seminovo", "Recondicionado", "Em bom estado", "Com detalhes", "Para retirada de peças"];

export const descriptionExamples = [
  "iPhone 13, R$3500, São Paulo, seminovo…",
  "Notebook gamer, R$2200, Belém…",
  "Sofá 3 lugares, R$800, Rio de Janeiro, ótimo estado…",
  "Bicicleta aro 29, R$600, BH, usada 6 meses…",
  "Fone Bluetooth, R$120, Curitiba, novo na caixa…"
];

// ── Helpers ──────────────────────────────────────────

export const safe = (val) => val !== null && val !== undefined && val !== "";

export const getPostKey = (post) => post?.post_id || post?.id || post?.created_at || JSON.stringify(post);

export const getPostImages = (post) => {
  if (!post) return [];
  try {
    const raw = post.image || post.images || post.photos || "[]";
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [parsed].filter(Boolean);
  } catch { return []; }
};

export const getCoverImage = (post) => getPostImages(post)[0] || "";

const getPostLines = (post) => (post?.content || "").split("\n").filter(Boolean);

export const getTitle = (post) => getPostLines(post)[0] || post?.title || "Sem título";

export const getPrice = (post) => {
  const lines = getPostLines(post);
  for (const line of lines) { if (line.includes("R$")) return line; }
  return post?.price ? `R$ ${post.price}` : "";
};

export const getCondition = (post) => {
  for (const line of getPostLines(post)) {
    for (const c of productConditions) { if (line.trim() === c) return c; }
  }
  return post?.product_condition || "";
};

export const getLocation = (post) => {
  for (const line of getPostLines(post)) { if (line.includes(" - ")) return line; }
  return [post?.city, post?.state].filter(Boolean).join(" - ") || "";
};

export const getCategory = (post) => {
  for (const line of getPostLines(post)) { if (categories.includes(line.trim())) return line.trim(); }
  return post?.category || "";
};

export const isMine = (post, user) => {
  if (!user || !post) return false;
  const uid = String(user.user_id || user.id || user.email || "");
  return (
    String(post.user_id) === uid ||
    String(post.owner_id) === uid ||
    post.email === user.email ||
    post.user_email === user.email ||
    post.user_name === user.name
  );
};

export const findName = (obj) => {
  if (!obj) return "";
  return (
    obj.sender_name || obj.name || obj.user_name || obj.author_name ||
    obj.owner_name || obj.contact_name || obj.display_name || obj.full_name ||
    (obj.data && (obj.data.name || obj.data.sender_name)) ||
    obj.post?.user_name || obj.post?.name ||
    "Usuário"
  );
};

export const fileToBase64 = (file) => new Promise((resolve) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let w = img.width, h = img.height;
      const max = 900;
      if (w > max || h > max) { if (w > h) { h = (h / w) * max; w = max; } else { w = (w / h) * max; h = max; } }
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.68));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
});

const mergePosts = (oldPosts, newPosts) => {
  const map = new Map();
  [...oldPosts, ...newPosts].forEach((post) => {
    const key = getPostKey(post);
    if (!map.has(key)) map.set(key, post);
  });
  return Array.from(map.values());
};

const buildContent = (sourceForm) =>
  [sourceForm.title, `R$ ${sourceForm.price}`, sourceForm.category, sourceForm.condition, [sourceForm.city, sourceForm.state].filter(Boolean).join(" - "), sourceForm.description, sourceForm.availability].filter(Boolean).join("\n");

const BLivreAdContext = createContext(null);

export function BLivreAdProvider({ children }) {
  const { user, token, authHeaders } = useBLivreAuth();

  // ── State ──────────────────────────────────────────
  const [posts, setPosts] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [posting, setPosting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [socialStats, setSocialStats] = useState({ views: 0, interests: 0, my_ads: 0 });
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [form, setForm] = useState({ category: "", title: "", price: "", state: "", city: "", productCondition: "", description: "", availability: "Item único", phone: "", whatsapp: "" });
  const [showContactModal, setShowContactModal] = useState(null);
  const [profileForm, setProfileForm] = useState({ name: "", city: "", state: "", avatar: "" });
  const [editingPost, setEditingPost] = useState(null);
  const [useAI, setUseAI] = useState(true);
  const [generatedAd, setGeneratedAd] = useState(null);
  const [isGeneratingAd, setIsGeneratingAd] = useState(false);
  const [showMobileAiInput, setShowMobileAiInput] = useState(false);
  const [mobileAiText, setMobileAiText] = useState("");
  const [mobileEditInput, setMobileEditInput] = useState("");
  const [aiFilled, setAiFilled] = useState(false);
  const [mobileShowForm, setMobileShowForm] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [exampleIndex, setExampleIndex] = useState(0);

  const imageInputRef = useRef(null);
  const avatarInputRef = useRef(null);
  const loadMoreRef = useRef(null);
  const scrollFrameRef = useRef(null);
  const expandedRef = useRef(false);

  // ── Computed ───────────────────────────────────────
  const myPosts = posts.filter((post) => isMine(post, user));

  const filteredPosts = posts.filter((post) => {
    const title = getTitle(post).toLowerCase();
    const content = String(post.content || "").toLowerCase();
    const description = String(post.description || "").toLowerCase();
    const location = getLocation(post).toLowerCase();
    const category = String(getCategory(post) || "");
    const key = getPostKey(post);
    const search = searchTerm.trim().toLowerCase();

    if (activeFilter === "mine" && !isMine(post, user)) return false;
    if (activeFilter === "favorites" && !favorites.includes(key)) return false;
    if (activeFilter === "messages") return false;
    if (selectedCategory && category !== selectedCategory) return false;

    if (activeFilter === "near") {
      const userCity = String(user?.city || "").toLowerCase();
      const userState = String(user?.state || "").toLowerCase();
      if (userCity || userState) {
        if (!location.includes(userCity) && !location.includes(userState)) return false;
      }
    }
    if (search) {
      return title.includes(search) || content.includes(search) ||
        description.includes(search) || location.includes(search) ||
        category.toLowerCase().includes(search);
    }
    return true;
  });

  // ── Data loading ───────────────────────────────────
  const loadSocialData = useCallback(async () => {
    if (!token) return;
    try {
      const [favoritesRes, statsRes, notificationsRes] = await Promise.allSettled([
        axios.get(blivreAPI.favorites.list(), { headers: authHeaders }),
        axios.get(blivreAPI.stats.get(), { headers: authHeaders }),
        axios.get(blivreAPI.notifications.list(), { headers: authHeaders }),
      ]);
      if (favoritesRes.status === "fulfilled")
        setFavorites((favoritesRes.value.data.favorites || []).map(String));
      if (statsRes.status === "fulfilled")
        setSocialStats({
          views: statsRes.value.data.views || 0,
          interests: statsRes.value.data.interests || 0,
          my_ads: statsRes.value.data.my_ads || 0
        });
      if (notificationsRes.status === "fulfilled") {
        setNotifications(notificationsRes.value.data.notifications || []);
        setUnreadCount(notificationsRes.value.data.unread || 0);
      }
    } catch (error) {
      console.error("Erro ao carregar dados sociais:", error);
    }
  }, [token, authHeaders]);

  const loadPosts = useCallback(async (pageNumber = 1, append = false) => {
    try {
      if (append) setLoadingMore(true); else setLoading(true);
      const res = await axios.get(blivreAPI.posts.list(PAGE_SIZE, pageNumber));
      const list = res.data.posts || [];
      if (append) {
        setPosts((prev) => {
          const merged = mergePosts(prev, list);
          if (merged.length === prev.length) setHasMore(false);
          return merged;
        });
      } else {
        setPosts(list);
        setHasMore(list.length >= PAGE_SIZE);
      }
      if (list.length < PAGE_SIZE) setHasMore(false);
    } catch (error) {
      console.error(error);
      if (!append) setPosts([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // ── Image handling ─────────────────────────────────
  const handleImage = useCallback(async (e) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 5) { alert("Máximo 5 fotos."); return; }
    const base64List = await Promise.all(files.map(fileToBase64));
    setImages((prev) => [...prev, ...base64List]);
  }, [images.length]);

  const removeImageAt = useCallback((index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearImages = useCallback(() => setImages([]), []);

  const handleAvatarImage = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await fileToBase64(file);
    setProfileForm((prev) => ({ ...prev, avatar: base64 }));
  }, []);

  // ── AI parse ───────────────────────────────────────
  const runAiParse = useCallback((rawText) => {
    const conditions = ["Novo", "Seminovo", "Usado", "Recondicionado"];
    const catKeywords = { Celulares: ["iphone", "celular", "smartphone", "samsung", "xiaomi", "motorola", "apple", "galaxy", "telefone", "i11", "i12", "i13", "i14", "i15", "poco", "redmi", "realme", "nokia", "lg", "asus", "lenovo"], Veículos: ["carro", "moto", "veículo", "caminhão", "bicicleta", "hb20", "onix", "gol", "civic", "corolla", "fiat", "chevrolet", "volkswagen", "honda", "toyota", "yamaha", "honda", "suzuki"], Moda: ["roupa", "vestido", "calça", "camisa", "tênis", "sapato", "bolsa", "relógio", "acessório"], "Casa e móveis": ["sofá", "mesa", "cadeira", "cama", "guarda-roupa", "geladeira", "fogão", "tv", "televisão", "microondas", "casa", "móvel"], Imóveis: ["apartamento", "casa", "kitnet", "flat", "cobertura", "terreno", "sala", "comercial", "aluguel"], Serviços: ["serviço", "aula", "consultoria", "reforma", "manutenção", "limpeza", "freelancer", "design", "programação"], Outros: ["outro", "diversos", "geral"] };
    const ufs = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];
    let title = rawText, price = "", city = "", state = "", condition = "", category = "Outros", description = "";
    const priceMatch = rawText.match(/R?\$?\s*([\d.,]+)/);
    if (priceMatch) { price = priceMatch[1].replace(".", ","); }
    const locationRegex = new RegExp("([A-Za-zÀ-ü\\s]+)\\s*[-–]\\s*(" + ufs.join("|") + ")", "i");
    const locMatch = rawText.match(locationRegex);
    if (locMatch) { city = locMatch[1].trim(); state = locMatch[2].toUpperCase(); }
    for (const c of conditions) { if (rawText.toLowerCase().includes(c.toLowerCase())) { condition = c; break; } }
    for (const [cat, kws] of Object.entries(catKeywords)) { for (const kw of kws) { if (rawText.toLowerCase().includes(kw.toLowerCase())) { category = cat; break; } } if (category !== "Outros") break; }
    if (priceMatch && rawText.startsWith(priceMatch[0])) title = rawText.replace(priceMatch[0], "").trim();
    setForm((prev) => ({ ...prev, title, price, city, state, productCondition: condition, category }));
  }, []);

  // ── Mobile AI handlers ─────────────────────────────
  const handleAiFill = useCallback(() => {
    if (!mobileAiText.trim()) return;
    runAiParse(mobileAiText);
  }, [mobileAiText, runAiParse]);

  const handleFooterSend = useCallback(() => {
    if (!mobileEditInput.trim()) return;
    runAiParse(mobileEditInput);
  }, [mobileEditInput, runAiParse]);

  const handleNewMobile = useCallback(() => {
    setForm({ category: "", title: "", price: "", state: "", city: "", productCondition: "", description: "", availability: "Item único", phone: "", whatsapp: "" });
    setImages([]);
    setAiFilled(false);
    setMobileShowForm(false);
    setMobileAiText("");
    setMobileEditInput("");
    setGeneratedAd(null);
    setUseAI(true);
    setShowMobileAiInput(false);
  }, []);

  // ── Create / Update / Delete ───────────────────────
  const createPost = useCallback(async (sourceForm, sourceImages) => {
    if (!sourceForm.title?.trim() || !sourceForm.price?.trim() || !sourceForm.productCondition) {
      alert("Preencha título, preço e condição."); return false;
    }
    setPosting(true);
    try {
      await axios.post(blivreAPI.posts.create(), {
        title: sourceForm.title,
        price: "R$ " + sourceForm.price.replace("R$ ", ""),
        category: sourceForm.category || "Outros",
        product_condition: sourceForm.productCondition,
        city: sourceForm.city || "",
        state: sourceForm.state || "",
        description: sourceForm.description || "",
        content: buildContent(sourceForm),
        availability: sourceForm.availability || "Item único",
        phone: sourceForm.phone || "",
        whatsapp: sourceForm.whatsapp || "",
        image: JSON.stringify(sourceImages || [])
      }, { headers: authHeaders });
      alert("Anúncio criado!");
      handleNewMobile();
      setComposerOpen(false);
      loadPosts(1, false);
      return true;
    } catch (error) {
      console.error(error);
      alert("Erro ao criar anúncio.");
      return false;
    } finally {
      setPosting(false);
    }
  }, [authHeaders, handleNewMobile, loadPosts]);

  const updatePost = useCallback(async (key) => {
    setPosting(true);
    try {
      await axios.put(blivreAPI.posts.update(key), {
        title: form.title, price: "R$ " + form.price.replace("R$ ", ""),
        category: form.category || "Outros", product_condition: form.productCondition,
        city: form.city || "", state: form.state || "",
        description: form.description || "", content: buildContent(form),
        availability: form.availability || "Item único",
        phone: form.phone || "", whatsapp: form.whatsapp || "",
        image: JSON.stringify(images)
      }, { headers: authHeaders });
      alert("Anúncio atualizado!");
      setComposerOpen(false);
      setEditingPost(null);
      loadPosts(1, false);
    } catch (error) {
      console.error(error);
      alert("Erro ao atualizar anúncio.");
    } finally {
      setPosting(false);
    }
  }, [authHeaders, form, images, loadPosts]);

  const deletePost = useCallback(async (post) => {
    if (!window.confirm("Tem certeza que deseja excluir este anúncio?")) return;
    const key = getPostKey(post);
    try {
      await axios.delete(blivreAPI.posts.delete(key), { headers: authHeaders });
      loadPosts(1, false);
    } catch (error) {
      console.error(error);
      alert("Erro ao excluir anúncio.");
    }
  }, [authHeaders, loadPosts]);

  const publishFromModal = useCallback(async () => {
    if (editingPost) {
      await updatePost(getPostKey(editingPost));
    } else {
      await createPost(form, images);
    }
  }, [editingPost, updatePost, createPost, form, images]);

  const editPost = useCallback((post) => {
    setForm({
      category: getCategory(post) || "", title: getTitle(post) || "",
      price: String(post.price || "").replace("R$ ", "") || "",
      state: post.state || "", city: post.city || "",
      productCondition: post.product_condition || getCondition(post) || "",
      description: post.description || post.content || "",
      availability: post.availability || "Item único",
      phone: post.phone || "", whatsapp: post.whatsapp || ""
    });
    setImages(getPostImages(post) || []);
    setEditingPost(post);
    setComposerOpen(true);
    setUseAI(false);
  }, []);

  // ── Post interactions ──────────────────────────────
  const openPost = useCallback((post) => {
    setSelectedPost(post);
    setSelectedImageIndex(0);
    window.history.pushState({ branePost: true }, "", window.location.pathname);
  }, []);

  const closePost = useCallback(() => {
    setSelectedPost(null);
    setSelectedImageIndex(0);
  }, []);

  const nextImage = useCallback(() => {
    const list = getPostImages(selectedPost);
    if (list.length > 1) setSelectedImageIndex((prev) => (prev + 1) % list.length);
  }, [selectedPost]);

  const prevImage = useCallback(() => {
    const list = getPostImages(selectedPost);
    if (list.length > 1) setSelectedImageIndex((prev) => (prev - 1 + list.length) % list.length);
  }, [selectedPost]);

  const toggleFavorite = useCallback(async (post, e) => {
    e.stopPropagation();
    const key = getPostKey(post);
    try {
      const res = await axios.post(blivreAPI.favorites.toggle(key), {}, { headers: authHeaders });
      setFavorites((prev) => {
        if (res.data.favorited) return [...prev, key];
        return prev.filter((item) => item !== key);
      });
    } catch (err) {
      console.error(err);
      alert("Erro ao favoritar.");
    }
  }, [authHeaders]);

  const saveProfile = useCallback(async () => {
    setSavingProfile(true);
    try {
      await axios.put(blivreAPI.profile.update(), profileForm, { headers: authHeaders });
      setShowSettings(false);
      alert("Perfil atualizado.");
    } catch (error) {
      console.error(error);
      alert("Erro ao atualizar perfil.");
    } finally {
      setSavingProfile(false);
    }
  }, [authHeaders, profileForm]);

  const updateForm = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  // ── Scroll handler ─────────────────────────────────
  const handleProductsScroll = useCallback((e) => {
    if (scrollFrameRef.current) cancelAnimationFrame(scrollFrameRef.current);
    scrollFrameRef.current = requestAnimationFrame(() => {
      const scrollTop = e.target.scrollTop;
      const max = 120;
      if (scrollTop > max && !expandedRef.current) { setExpanded(true); expandedRef.current = true; }
      else if (scrollTop <= max && expandedRef.current) { setExpanded(false); expandedRef.current = false; }
    });
  }, []);

  // ── Effects ────────────────────────────────────────
  useEffect(() => {
    loadPosts(1, false);
  }, [loadPosts]);

  useEffect(() => {
    if (!token) return;
    loadSocialData();
  }, [token, loadSocialData]);

  useEffect(() => {
    expandedRef.current = expanded;
  }, [expanded]);

  useEffect(() => {
    const interval = setInterval(() => {
      setExampleIndex((prev) => (prev + 1) % descriptionExamples.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <BLivreAdContext.Provider value={{
      posts, setPosts, images, setImages, loading, loadingMore, posting,
      expanded, setExpanded, composerOpen, setComposerOpen,
      selectedPost, setSelectedPost, selectedImageIndex, setSelectedImageIndex,
      page, setPage, hasMore, setHasMore, searchTerm, setSearchTerm,
      activeFilter, setActiveFilter, selectedCategory, setSelectedCategory,
      favorites, socialStats, notifications, setNotifications,
      showNotifications, setShowNotifications,
      showSettings, setShowSettings, savingProfile,
      form, setForm, showContactModal, setShowContactModal,
      profileForm, setProfileForm,
      editingPost, setEditingPost, useAI, setUseAI,
      generatedAd, setGeneratedAd, isGeneratingAd, setIsGeneratingAd,
      showMobileAiInput, setShowMobileAiInput,
      mobileAiText, setMobileAiText, mobileEditInput, setMobileEditInput,
      aiFilled, setAiFilled, mobileShowForm, setMobileShowForm,
      unreadCount, setUnreadCount, exampleIndex,
      imageInputRef, avatarInputRef, loadMoreRef, scrollFrameRef, expandedRef,
      myPosts, filteredPosts,
      loadSocialData, loadPosts, handleImage, removeImageAt, clearImages,
      handleAvatarImage, handleAiFill, handleFooterSend, handleNewMobile,
      runAiParse, createPost, publishFromModal, updatePost,
      openPost, closePost, nextImage, prevImage, toggleFavorite,
      saveProfile, editPost, deletePost, handleProductsScroll, updateForm
    }}>
      {children}
    </BLivreAdContext.Provider>
  );
}

export const useBLivreAds = () => {
  const ctx = useContext(BLivreAdContext);
  if (!ctx) throw new Error("useBLivreAds must be used within BLivreAdProvider");
  return ctx;
};
