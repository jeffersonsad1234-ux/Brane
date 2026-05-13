import { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  Image, Send, User, Bell, Search, MessageSquare,
  Settings, BadgeCheck, Package, MapPin, Tags,
  Heart, X, ChevronLeft, ChevronRight, Globe, Camera, ShoppingCart
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import ProductImageZoom from "../components/ProductImageZoom";
import AIAssistantPanelSocial from "../components/AIAssistantPanelSocial";
import BLivreAuthModal from "../components/BLivreAuthModal";
import "../styles/premium.css";
import "../styles/product3d.css";
import "../styles/animations.css";
const PAGE_SIZE = 24;

const categories = ["Celulares", "Veículos", "Imóveis", "Casa e móveis", "Moda", "Serviços", "Outros"];

const states = [
  "Acre", "Alagoas", "Amapá", "Amazonas", "Bahia", "Ceará", "Distrito Federal",
  "Espírito Santo", "Goiás", "Maranhão", "Mato Grosso", "Mato Grosso do Sul",
  "Minas Gerais", "Pará", "Paraíba", "Paraná", "Pernambuco", "Piauí",
  "Rio de Janeiro", "Rio Grande do Norte", "Rio Grande do Sul", "Rondônia",
  "Roraima", "Santa Catarina", "São Paulo", "Sergipe", "Tocantins"
];

const productConditions = ["Novo", "Usado", "Em bom estado", "Com detalhes", "Para retirada de peças"];

const descriptionExamples = [
  "iPhone 13, R$3500, São Paulo, seminovo…",
  "Notebook gamer, R$2200, Belém…",
  "Sofá 3 lugares, R$800, Rio de Janeiro, ótimo estado…",
  "Bicicleta aro 29, R$600, BH, usada 6 meses…",
  "Fone Bluetooth, R$120, Curitiba, novo na caixa…"
];

export default function SocialPage() {
  const { user, token, API: AUTH_API } = useAuth();
  const API = AUTH_API || `${process.env.REACT_APP_BACKEND_URL || "https://brane-production-3c87.up.railway.app"}/api`;

  const authHeaders = token
    ? { Authorization: "Bearer " + token }
    : {};

  const imageInputRef = useRef(null);
  const avatarInputRef = useRef(null);
  const loadMoreRef = useRef(null);
  const scrollFrameRef = useRef(null);
  const expandedRef = useRef(false);

  const [posts, setPosts] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [posting, setPosting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [message, setMessage] = useState("Esse anúncio ainda está disponível?");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [stats, setStats] = useState({});
  const [socialStats, setSocialStats] = useState({
    views: 0,
    interests: 0,
    my_ads: 0
  });

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const [showSettings, setShowSettings] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [messages, setMessages] = useState([]);

  const [selectedChat, setSelectedChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatMessage, setChatMessage] = useState("");

  // Estados para IA
  const [useAI, setUseAI] = useState(true);
  const [generatedAd, setGeneratedAd] = useState(null);
  const [isGeneratingAd, setIsGeneratingAd] = useState(false);

  const [editingPost, setEditingPost] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);

  const [unreadCount, setUnreadCount] = useState(0);
  const notifIntervalRef = useRef(null);
  const messagesIntervalRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const [exampleIndex, setExampleIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setExampleIndex((prev) => (prev + 1) % descriptionExamples.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowInstall(false);
    setDeferredPrompt(null);
  };

  const requireAuth = () => {
    if (!user) {
      setShowAuthModal(true);
      return false;
    }
    return true;
  };

  const [profileForm, setProfileForm] = useState({
    name: "",
    city: "",
    state: "",
    avatar: ""
  });

  const [form, setForm] = useState({
    category: "",
    title: "",
    price: "",
    state: "",
    city: "",
    productCondition: "",
    description: "",
    availability: "Item único"
  });

  const getPostKey = (post) => String(post?.post_id || post?.id || post?.created_at || JSON.stringify(post));

  const getPostImages = (post) => {
    if (!post || !post.image) return [];

    try {
      const parsed = JSON.parse(post.image);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {}

    return [post.image];
  };

  const getCoverImage = (post) => getPostImages(post)[0] || "";

  const getPostLines = (post) => String(post.content || "").split("\n").filter(Boolean);
  const getTitle = (post) => getPostLines(post)[0] || post.title || "Produto anunciado";
  const getPrice = (post) => getPostLines(post).find((line) => line.includes("R$")) || (post.price ? "R$ " + post.price : "R$ consultar");

  const getCondition = (post) => {
    const line = getPostLines(post).find((item) => productConditions.includes(item));
    return line || post.product_condition || "";
  };

  const getLocation = (post) =>
    getPostLines(post).find((line) => line.includes(" - ")) ||
    [post.city, post.state].filter(Boolean).join(" - ") ||
    "Localização a combinar";

  const getCategory = (post) =>
    getPostLines(post).find((line) => categories.includes(line)) || post.category || "";

  const isMine = (post) => {
    if (!user) return false;
    return (
      post.user_id === user.id ||
      post.user_id === user.user_id ||
      post.owner_id === user.id ||
      post.email === user.email ||
      post.user_email === user.email ||
      post.user_name === user.name
    );
  };

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      const img = new window.Image();

      reader.onload = () => {
        img.src = reader.result;
      };

      reader.onerror = reject;
      img.onerror = reject;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const maxWidth = 900;
        const scale = Math.min(1, maxWidth / img.width);

        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.68));
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

  const loadSocialData = async () => {
    if (!token) return;

    try {
      const [favoritesRes, statsRes, notificationsRes, messagesRes] =
        await Promise.allSettled([
          axios.get(API + "/social/favorites", { headers: authHeaders }),
          axios.get(API + "/social/stats", { headers: authHeaders }),
          axios.get(API + "/notifications", { headers: authHeaders }),
          axios.get(API + "/social/messages", { headers: authHeaders })
        ]);

      if (favoritesRes.status === "fulfilled") {
        setFavorites((favoritesRes.value.data.favorites || []).map(String));
      }

      if (statsRes.status === "fulfilled") {
        setSocialStats({
          views: statsRes.value.data.views || 0,
          interests: statsRes.value.data.interests || 0,
          my_ads: statsRes.value.data.my_ads || 0
        });
      }

      if (notificationsRes.status === "fulfilled") {
        setNotifications(notificationsRes.value.data.notifications || []);
        setUnreadCount(notificationsRes.value.data.unread || 0);
      }

      if (messagesRes.status === "fulfilled") {
        setMessages(messagesRes.value.data.messages || []);
      }
    } catch (error) {
      console.error("Erro ao carregar dados sociais:", error);
    }
  };

  const loadPosts = async (pageNumber = 1, append = false) => {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);

      const res = await axios.get(
        API + "/social/posts?limit=" + PAGE_SIZE + "&page=" + pageNumber
      );

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
  };

  useEffect(() => {
    loadPosts(1, false);
  }, []);

  useEffect(() => {
    if (!token) return;
    loadSocialData();

    notifIntervalRef.current = setInterval(() => {
      axios.get(API + "/notifications", { headers: authHeaders })
        .then((r) => {
          setNotifications(r.data.notifications || []);
          setUnreadCount(r.data.unread || 0);
        })
        .catch(() => {});
    }, 5000);

    messagesIntervalRef.current = setInterval(() => {
      axios.get(API + "/social/messages", { headers: authHeaders })
        .then((r) => setMessages(r.data.messages || []))
        .catch(() => {});
    }, 3000);

    return () => {
      if (scrollFrameRef.current) cancelAnimationFrame(scrollFrameRef.current);
      if (notifIntervalRef.current) clearInterval(notifIntervalRef.current);
      if (messagesIntervalRef.current) clearInterval(messagesIntervalRef.current);
    };
  }, [token]);

  useEffect(() => {
    const handlePop = () => {
      if (selectedChat) { closeChat(); return; }
      if (showNotifications) { setShowNotifications(false); return; }
      if (showSettings) { setShowSettings(false); return; }
      if (selectedPost) { setSelectedPost(null); return; }
      if (composerOpen) { setComposerOpen(false); return; }
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, [selectedChat, showNotifications, showSettings, selectedPost, composerOpen]);

  useEffect(() => {
    expandedRef.current = expanded;
  }, [expanded]);

  useEffect(() => {
    if (!loadMoreRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (entry.isIntersecting && !loading && !loadingMore && hasMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          loadPosts(nextPage, true);
        }
      },
      { root: null, rootMargin: "700px", threshold: 0 }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [page, loading, loadingMore, hasMore]);
  const handleImage = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const availableSlots = Math.max(0, 5 - images.length);
    const selectedFiles = files.slice(0, availableSlots);

    const base64List = await Promise.all(
      selectedFiles.map((file) => fileToBase64(file))
    );

    setImages((prev) => [...prev, ...base64List].slice(0, 5));

    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleAvatarImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const base64 = await fileToBase64(file);
    setProfileForm((prev) => ({ ...prev, avatar: base64 }));

    if (avatarInputRef.current) avatarInputRef.current.value = "";
  };

  const removeImageAt = (indexToRemove) => {
    setImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const clearImages = () => {
    setImages([]);
  };

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const buildContent = (sourceForm = form) => {
    return [
      sourceForm.title,
      sourceForm.price ? "R$ " + sourceForm.price : "",
      sourceForm.category,
      sourceForm.productCondition,
      sourceForm.city || sourceForm.state ? [sourceForm.city, sourceForm.state].filter(Boolean).join(" - ") : "",
      sourceForm.availability,
      sourceForm.description
    ].filter(Boolean).join("\n");
  };

  const createPost = async (sourceForm = form, sourceImages = images) => {
    if (!requireAuth()) return false;

    if (!sourceForm.title.trim()) {
      alert("Digite o nome do produto.");
      return false;
    }

    if (!sourceForm.price.trim()) {
      alert("Digite o preço.");
      return false;
    }

    if (!sourceForm.productCondition.trim()) {
      alert("Selecione o estado do produto.");
      return false;
    }

    try {
      setPosting(true);

      await axios.post(
        API + "/social/posts",
        {
          content: buildContent(sourceForm),
          image: JSON.stringify(sourceImages),
          category: sourceForm.category,
          title: sourceForm.title,
          price: sourceForm.price,
          state: sourceForm.state,
          city: sourceForm.city,
          product_condition: sourceForm.productCondition,
          description: sourceForm.description,
          availability: sourceForm.availability
        },
        { headers: authHeaders }
      );

      setForm({
        category: "",
        title: "",
        price: "",
        state: "",
        city: "",
        productCondition: "",
        description: "",
        availability: "Item único"
      });

      clearImages();
      setPage(1);
      setHasMore(true);
      await loadPosts(1, false);
      await loadSocialData();
      return true;

    } catch (error) {
      console.error(error);
      alert("Erro ao anunciar.");
      return false;
    } finally {
      setPosting(false);
    }
  };

  const publishFromModal = async () => {
    if (editingPost) {
      await updatePost();
    } else {
      const ok = await createPost();
      if (ok) {
        setComposerOpen(false);
        setEditingPost(null);
      }
    }
  };

  const updatePost = async () => {
    if (!editingPost) return;

    try {
      setPosting(true);

      const key = getPostKey(editingPost);
      await axios.put(
        API + "/social/posts/" + key,
        {
          content: buildContent(),
          image: JSON.stringify(images),
          category: form.category,
          title: form.title,
          price: form.price,
          state: form.state,
          city: form.city,
          product_condition: form.productCondition,
        },
        { headers: authHeaders }
      );

      setComposerOpen(false);
      setEditingPost(null);
      await loadPosts(1, false);
      alert("Anúncio atualizado com sucesso!");

    } catch (error) {
      console.error("Erro ao atualizar anúncio:", error);
      alert("Erro ao atualizar anúncio.");
    } finally {
      setPosting(false);
    }
  };

  const openPost = (post) => {
    setSelectedPost(post);
    setSelectedImageIndex(0);
    window.history.pushState({ branePost: true }, "", window.location.pathname);
  };

  const closePost = () => {
    setSelectedPost(null);
    setSelectedImageIndex(0);
    if (window.history.state?.branePost) window.history.back();
  };

  const nextImage = () => {
    const list = getPostImages(selectedPost);
    if (list.length > 1) {
      setSelectedImageIndex((prev) => (prev + 1) % list.length);
    }
  };

  const prevImage = () => {
    const list = getPostImages(selectedPost);
    if (list.length > 1) {
      setSelectedImageIndex((prev) => (prev - 1 + list.length) % list.length);
    }
  };

  const sendMessage = async () => {
    if (!selectedPost) return;
    if (!requireAuth()) return;

    try {
      await axios.post(
        API + "/social/messages",
        {
          post_id: getPostKey(selectedPost),
          message
        },
        { headers: authHeaders }
      );

      alert("Mensagem enviada.");
    } catch (error) {
      console.error(error);
      alert("Erro ao enviar mensagem.");
    }
  };

  const filteredPosts = posts.filter((post) => {
    const title = getTitle(post).toLowerCase();
    const content = String(post.content || "").toLowerCase();
    const description = String(post.description || "").toLowerCase();
    const location = getLocation(post).toLowerCase();
    const category = String(getCategory(post) || "");
    const key = getPostKey(post);
    const search = searchTerm.trim().toLowerCase();

    if (activeFilter === "mine" && !isMine(post)) return false;
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
      return (
        title.includes(search) ||
        content.includes(search) ||
        description.includes(search) ||
        location.includes(search) ||
        category.toLowerCase().includes(search)
      );
    }

    return true;
  });

  const selectedImages = selectedPost ? getPostImages(selectedPost) : [];
  const selectedImage = selectedImages[selectedImageIndex] || "";
  const myPosts = posts.filter((post) => isMine(post));
  const totalViews = socialStats.views || 0;
  const totalInterests = socialStats.interests || 0;
  const totalMyAds = socialStats.my_ads || myPosts.length;

  const toggleFavorite = async (post, e) => {
    e.stopPropagation();

    if (!requireAuth()) return;

    const key = getPostKey(post);

    try {
      const res = await axios.post(
        API + "/social/favorites/" + key,
        {},
        { headers: authHeaders }
      );

      setFavorites((prev) => {
        if (res.data.favorited) return [...prev, key];
        return prev.filter((item) => item !== key);
      });
    } catch (err) {
      console.error(err);
      alert("Erro ao favoritar.");
    }
  };

  const saveProfile = async () => {
    if (!requireAuth()) return;

    try {
      setSavingProfile(true);

      await axios.put(
        API + "/social/profile",
        profileForm,
        { headers: authHeaders }
      );

      setShowSettings(false);
      alert("Perfil atualizado.");
    } catch (error) {
      console.error(error);
      alert("Erro ao atualizar perfil.");
    } finally {
      setSavingProfile(false);
    }
  };

  const fetchMessages = async () => {
    if (!token) return;
    try {
      const res = await axios.get(API + "/social/messages", { headers: authHeaders });
      setMessages(res.data.messages || []);
    } catch (e) {
      console.error("Erro ao buscar mensagens:", e);
    }
  };

  const openMessagesTab = () => {
    setActiveFilter("messages");
    setSelectedChat(null);
    setSelectedCategory("");
    fetchMessages();
  };

  const loadChatMessages = async (postId) => {
    try {
      const res = await axios.get(API + "/social/messages?post_id=" + postId, { headers: authHeaders });
      const msgs = (res.data.messages || []).map((m, i) => ({
        id: i + 1,
        sender: m.sender_name || "Usuário",
        message: m.message,
        timestamp: new Date(m.created_at || Date.now()),
        isMine: m.sender_id === user?.user_id
      }));
      setChatMessages(msgs);
    } catch (e) {
      console.error("Erro ao carregar mensagens:", e);
      setChatMessages([]);
    }
  };

  const openChat = (chat) => {
    setSelectedChat(chat);
    loadChatMessages(chat.post_id);
    window.history.pushState({ braneChat: true }, "", window.location.pathname);
  };

  const closeChat = () => {
    setSelectedChat(null);
    setChatMessages([]);
    setChatMessage("");
    if (window.history.state?.braneChat) {
      window.history.back();
    }
  };

  const sendChatMessage = async () => {
    if (!chatMessage.trim() || !selectedChat) return;

    const text = chatMessage;

    setChatMessage("");

    try {
      await axios.post(
        API + "/social/messages",
        {
          post_id: selectedChat.post_id,
          message: text
        },
        { headers: authHeaders }
      );

      loadChatMessages(selectedChat.post_id);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      alert("Erro ao enviar mensagem.");
    }
  };

  const editPost = (post) => {
    setForm({
      category: getCategory(post) || "",
      title: getTitle(post) || "",
      price: String(post.price || "").replace("R$ ", "") || "",
      state: post.state || "",
      city: post.city || "",
      productCondition: post.product_condition || getCondition(post) || "",
      description: post.description || post.content || "",
      availability: post.availability || "Item único"
    });

    setImages(getPostImages(post) || []);
    setEditingPost(post);
    setComposerOpen(true);
    setUseAI(false);
  };

  const deletePost = async (post) => {
    if (!window.confirm("Tem certeza que deseja excluir este anúncio?")) return;

    const key = getPostKey(post);

    try {
      await axios.delete(API + "/social/posts/" + key, {
        headers: authHeaders
      });

      setPosts((prev) => prev.filter((p) => getPostKey(p) !== key));
      alert("Anúncio excluído com sucesso.");
    } catch (error) {
      console.error("Erro ao excluir anúncio:", error);
      alert("Erro ao excluir anúncio.");
    }
  };

  const handleProductsScroll = (e) => {
    const scrollTop = e.currentTarget.scrollTop;

    if (scrollFrameRef.current) cancelAnimationFrame(scrollFrameRef.current);

    scrollFrameRef.current = requestAnimationFrame(() => {
      if (scrollTop > 1 && !expandedRef.current) {
        expandedRef.current = true;
        setExpanded(true);
      }

      if (scrollTop === 0 && expandedRef.current) {
        expandedRef.current = false;
        setExpanded(false);
      }
    });
  };

  const SkeletonCard = () => (
    <div className="brane-card-premium overflow-hidden" style={{ borderRadius: 22 }}>
      <div className="aspect-square bg-[#0B0D12] animate-pulse" />
      <div className="p-3 space-y-3" style={{ background: 'linear-gradient(180deg, rgba(9,10,15,0.96), rgba(5,6,10,1))' }}>
        <div className="h-4 rounded bg-[#1E2230] animate-pulse" />
        <div className="h-5 rounded bg-[#1E2230] w-2/3 animate-pulse" />
        <div className="h-3 rounded bg-[#1E2230] w-1/2 animate-pulse" />
        <div className="h-8 rounded-xl bg-[#1E2230] animate-pulse" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen text-white relative overflow-hidden bg-[#040407]">
      <style>
        {`
          @keyframes blivreSlideIn {
            from { opacity: 0; transform: translateX(180px) scale(0.92); }
            to { opacity: 1; transform: translateX(0) scale(1); }
          }

          .blivre-shell {
            transition: grid-template-columns 280ms cubic-bezier(0.22, 1, 0.36, 1);
            will-change: grid-template-columns;
          }

          .blivre-side {
            transition: opacity 180ms ease, transform 280ms cubic-bezier(0.22, 1, 0.36, 1);
            will-change: opacity, transform;
          }

          .blivre-grid {
            grid-template-columns: repeat(auto-fill, minmax(185px, 1fr));
            transition: grid-template-columns 280ms cubic-bezier(0.22, 1, 0.36, 1);
            will-change: grid-template-columns;
          }

          .blivre-grid-focused {
            grid-template-columns: repeat(auto-fill, minmax(165px, 1fr));
            transition: grid-template-columns 280ms cubic-bezier(0.22, 1, 0.36, 1);
            will-change: grid-template-columns;
          }

          .blivre-product-card {
            transform: translateZ(0);
            contain: layout paint;
            will-change: transform;
          }

        `}
      </style>

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_5%,rgba(212,162,76,0.16),transparent_30%),radial-gradient(circle_at_85%_8%,rgba(124,58,237,0.16),transparent_34%),radial-gradient(circle_at_50%_95%,rgba(212,162,76,0.08),transparent_38%),linear-gradient(135deg,#040407_0%,#090914_48%,#12070C_100%)]" />
      </div>

      {showNotifications && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-[520px] brane-card-premium p-5" style={{ borderRadius: 28 }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-black text-lg text-white">Notificações</h2>
                <p className="text-xs text-[#8C8F9A] mt-1">
                  Novidades dos seus anúncios, favoritos e mensagens.
                </p>
              </div>

              <button
                onClick={() => setShowNotifications(false)}
                className="w-9 h-9 brane-btn-gold flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 max-h-[56vh] overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <div className="brane-card-soft p-4 text-sm text-[#8C8F9A]">
                  Nenhuma notificação por enquanto.
                </div>
              ) : (
                notifications.map((item, index) => {
                  const nPostId = item.data?.post_id || item.post_id;
                  const notifPost = posts.find((p) => (p.post_id || p.id) === nPostId || getPostKey(p) === nPostId);
                  const notifImg = notifPost ? getPostImages(notifPost)[0] || "" : "";
                  const notifTitle = notifPost ? getTitle(notifPost) : (item.title || item.data?.sender_name || "Nova mensagem");
                  return (
                    <button
                      key={item.id || index}
                      onClick={() => {
                        setShowNotifications(false);
                        const nSender = item.data?.sender_name || item.sender_name || "Usuário";
                        if (nPostId) {
                          setSelectedChat({ post_id: nPostId, sender_name: nSender, message: item.message || "" });
                          loadChatMessages(nPostId);
                          setActiveFilter("messages");
                          fetchMessages();
                          window.history.pushState({ braneChat: true }, "", window.location.pathname);
                        }
                      }}
                      className="w-full text-left brane-card-soft p-3 hover:bg-white/[0.08] transition-colors cursor-pointer flex items-start gap-3"
                    >
                      {notifImg ? (
                        <img src={notifImg} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4A24C]/20 to-[#8A2CFF]/20 flex items-center justify-center text-[#D4A24C] shrink-0">
                          <Package size={16} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-white truncate">{notifTitle}</p>
                        <p className="text-[11px] text-[#A6A8B3] mt-0.5">
                          {item.data?.sender_name || "Alguém"}: {item.message?.replace(/^[^:]+:\s*/, "").slice(0, 80) || item.content?.slice(0, 80) || "Nova mensagem"}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-[620px] brane-card-premium p-6" style={{ borderRadius: 28 }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4A24C] via-[#F1D28A] to-[#8A2CFF] p-[1px]">
                  <div className="w-full h-full rounded-xl bg-[#09090D] flex items-center justify-center">
                    <User className="text-[#F1D28A]" size={18} />
                  </div>
                </div>
                <div>
                  <h2 className="font-black text-lg text-white">Editar perfil</h2>
                  <p className="text-xs text-[#8C8F9A] mt-0.5">
                    Atualize sua foto, nome e localização
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowSettings(false)}
                className="w-9 h-9 brane-btn-gold flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col items-center gap-4 mb-6 pb-6 border-b border-[#1E2230]">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#D4A24C] via-[#F1D28A] to-[#8A2CFF] p-[2px] shadow-[0_0_30px_rgba(212,162,76,0.2)]">
                <div className="w-full h-full rounded-full bg-[#0B0B0F] overflow-hidden flex items-center justify-center">
                  {profileForm.avatar ? (
                    <img
                      src={profileForm.avatar}
                      alt="Perfil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="text-[#F1D28A]" size={38} />
                  )}
                </div>
              </div>

              <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-[#D4A24C]/25 bg-[#D4A24C]/10 text-[#F1D28A] text-sm font-semibold cursor-pointer hover:bg-[#D4A24C]/20 transition-colors">
                <Camera size={16} />
                Trocar foto
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarImage}
                />
              </label>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="text-xs text-[#8C8F9A] font-semibold">Nome</label>
                <input
                  value={profileForm.name}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="mt-1.5 w-full p-3 brane-input"
                  placeholder="Seu nome"
                />
              </div>

              <div>
                <label className="text-xs text-[#8C8F9A] font-semibold">Estado</label>
                <select
                  value={profileForm.state}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, state: e.target.value }))}
                  className="mt-1.5 w-full p-3 brane-input"
                >
                  <option value="">Selecionar estado</option>
                  {states.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-[#8C8F9A] font-semibold">Cidade</label>
                <input
                  value={profileForm.city}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, city: e.target.value }))}
                  className="mt-1.5 w-full p-3 brane-input"
                  placeholder="Sua cidade"
                />
              </div>
            </div>

            <button
              onClick={saveProfile}
              disabled={savingProfile}
              className="mt-6 w-full brane-btn-gold disabled:opacity-60"
            >
              {savingProfile ? "Salvando..." : "Salvar perfil"}
            </button>

            <div className="mt-5 pt-4 border-t border-[#1E2230] space-y-1">
              <button
                onClick={() => { setShowSettings(false); window.location.href = '/support'; }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#A6A8B3] hover:text-white hover:bg-white/[0.04] transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-[#D4A24C]">
                  <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Falar com suporte
              </button>
              <button
                onClick={() => { setShowSettings(false); window.location.href = '/auth'; }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#A6A8B3] hover:text-white hover:bg-white/[0.04] transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-[#D4A24C]">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Esqueci minha senha
              </button>
              <button
                onClick={() => { setShowSettings(false); window.location.href = '/dashboard'; }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#A6A8B3] hover:text-white hover:bg-white/[0.04] transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-[#D4A24C]">
                  <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
                Configurações da conta
              </button>
            </div>
          </div>
        </div>
      )}

     {composerOpen && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
    <div
      className="w-full max-w-[560px] h-[92vh] brane-card-premium p-4 md:p-5 overflow-hidden flex flex-col"
      style={{ borderRadius: 28, animation: "blivreSlideIn 0.28s ease-out" }}
    >
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h2 className="font-black text-lg text-white">
            {editingPost ? "Editar anúncio" : "Novo anúncio com BRANE"}
          </h2>
          <p className="text-[11px] text-[#8C8F9A] mt-1">
            {editingPost
              ? "Atualize as informações do seu anúncio."
              : "Responda algumas perguntas e a BRANE monta o anúncio pra você."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setComposerOpen(false);
            setEditingPost(null);
            setUseAI(true);
            setGeneratedAd(null);
            setForm({
              category: "",
              title: "",
              price: "",
              state: "",
              city: "",
              productCondition: "",
              description: "",
              availability: "Item único"
            });
            setImages([]);
          }}
          className="w-9 h-9 rounded-2xl border border-white/10 bg-white/[0.04] flex items-center justify-center text-[#C9CBD6] hover:bg-white/10"
        >
          <X size={18} />
        </button>
      </div>

      {!editingPost ? (
        <div className="flex-1 min-h-0">
          <AIAssistantPanelSocial
            onPhotoUpload={async (files) => {
              const fileList = Array.from(files || []);
              const base64List = await Promise.all(
                fileList.slice(0, 5).map((file) => fileToBase64(file))
              );
              setImages(base64List);
            }}
            onGenerateAd={(data) => {
              const finalData = {
                ...data,
                photos: images.length > 0 ? images : data.photos || []
              };

              setForm({
                category: finalData.category || "",
                title: finalData.title || finalData.productName || "",
                price: String(finalData.price || "").replace(/^R\$\s*/i, ""),
                state: finalData.state || "",
                city: finalData.city || "",
                productCondition: finalData.condition || finalData.productCondition || "",
                description: finalData.description || "",
                availability: finalData.availability || "Item único"
              });

              setGeneratedAd(finalData);
              setIsGeneratingAd(false);
            }}
            onImproveAd={(improvedAd) => {
              const finalData = {
                ...improvedAd,
                photos: images.length > 0 ? images : improvedAd.photos || []
              };

              setForm({
                category: finalData.category || form.category,
                title: finalData.title || form.title,
                price: String(finalData.price || form.price || "").replace(/^R\$\s*/i, ""),
                state: finalData.state || form.state,
                city: finalData.city || form.city,
                productCondition: finalData.condition || finalData.productCondition || form.productCondition,
                description: finalData.description || form.description,
                availability: finalData.availability || form.availability
              });

              setGeneratedAd(finalData);
            }}
            onGenerateNew={() => {
              setGeneratedAd(null);
              setImages([]);
              setForm({
                category: "",
                title: "",
                price: "",
                state: "",
                city: "",
                productCondition: "",
                description: "",
                availability: "Item único"
              });
            }}
            onFillForm={(data) => {
              setForm({
                category: data.category || "",
                title: data.title || data.productName || "",
                price: String(data.price || "").replace(/^R\$\s*/i, ""),
                state: data.state || "",
                city: data.city || "",
                productCondition: data.condition || data.productCondition || "",
                description: data.description || "",
                availability: data.availability || "Item único"
              });
            }}
            onPublishAd={async (ad) => {
              const nextForm = {
                category: ad.category || "",
                title: ad.title || ad.productName || "",
                price: String(ad.price || "").replace(/^R\$\s*/i, ""),
                state: ad.state || "",
                city: ad.city || "",
                productCondition: ad.condition || ad.productCondition || "",
                description: ad.description || "",
                availability: ad.availability || "Item único"
              };
              setForm(nextForm);

              const nextImages = (ad.photos || images || []).filter(Boolean).slice(0, 5);
              if (nextImages.length > 0) setImages(nextImages);

              const ok = await createPost(nextForm, nextImages.length > 0 ? nextImages : images);
              if (ok) {
                setComposerOpen(false);
                setGeneratedAd(null);
              }
            }}
            generatedAd={generatedAd}
            isGenerating={isGeneratingAd}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#8C8F9A] font-bold">Categoria</label>
              <select
                value={form.category}
                onChange={(e) => updateForm("category", e.target.value)}
                className="mt-1.5 w-full p-3 rounded-2xl bg-black/30 border border-white/10 text-white outline-none"
              >
                <option value="">Selecionar</option>
                {categories.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-[#8C8F9A] font-bold">Produto</label>
              <input
                value={form.title}
                onChange={(e) => updateForm("title", e.target.value)}
                className="mt-1.5 w-full p-3 rounded-2xl bg-black/30 border border-white/10 text-white outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-[#8C8F9A] font-bold">Preço</label>
              <input
                value={form.price}
                onChange={(e) => updateForm("price", e.target.value)}
                className="mt-1.5 w-full p-3 rounded-2xl bg-black/30 border border-white/10 text-white outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-[#8C8F9A] font-bold">Estado do produto</label>
              <select
                value={form.productCondition}
                onChange={(e) => updateForm("productCondition", e.target.value)}
                className="mt-1.5 w-full p-3 rounded-2xl bg-black/30 border border-white/10 text-white outline-none"
              >
                <option value="">Selecionar</option>
                {productConditions.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-[#8C8F9A] font-bold">Estado</label>
              <select
                value={form.state}
                onChange={(e) => updateForm("state", e.target.value)}
                className="mt-1.5 w-full p-3 rounded-2xl bg-black/30 border border-white/10 text-white outline-none"
              >
                <option value="">Selecionar estado</option>
                {states.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-[#8C8F9A] font-bold">Cidade</label>
              <input
                value={form.city}
                onChange={(e) => updateForm("city", e.target.value)}
                className="mt-1.5 w-full p-3 rounded-2xl bg-black/30 border border-white/10 text-white outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs text-[#8C8F9A] font-bold">Descrição</label>
              <textarea
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
                rows="4"
                placeholder={descriptionExamples[exampleIndex]}
                className="mt-1.5 w-full p-4 rounded-[22px] bg-black/30 border border-white/10 text-white outline-none resize-none placeholder:text-[#6F7280]"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={publishFromModal}
            disabled={posting}
            className="mt-4 w-full brane-btn-gold disabled:opacity-60"
          >
            <Send size={17} />
            {posting ? "Atualizando..." : "Atualizar anúncio"}
          </button>
        </div>
      )}
    </div>
  </div>
)}

      {selectedPost && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center px-4 brane-modal-detail-wrapper" style={{ background: 'rgba(5,6,8,0.82)', backdropFilter: 'blur(4px)' }}>
          <button
            onClick={closePost}
            className="absolute top-4 right-4 z-30 w-10 h-10 brane-btn-gold flex items-center justify-center"
          >
            <X size={20} />
          </button>

          <div className="relative w-full max-w-[1200px] mx-auto px-4 z-10 brane-modal-detail">
            <div className="brane-card-premium overflow-hidden" style={{ borderRadius: 22 }}>
              <div className="grid md:grid-cols-[1fr_380px]">
                <div className="bg-[#050608] flex items-center justify-center min-h-[500px] relative px-4 py-6 brane-modal-image">
                  {selectedImage ? (
                    <>
                      {selectedImages.length > 1 && (
                        <>
                          <button
                            onClick={prevImage}
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white hover:bg-black/80 z-10"
                          >
                            <ChevronLeft />
                          </button>
                          <button
                            onClick={nextImage}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white hover:bg-black/80 z-10"
                          >
                            <ChevronRight />
                          </button>
                        </>
                      )}
                      <ProductImageZoom
                        mode="detailPro"
                        src={selectedImage}
                        alt="Produto"
                        className="max-h-[650px] w-full object-contain"
                        wrapperClassName="w-full h-full"
                        zoomPanelSize={240}
                        lensSize={220}
                      />
                    </>
                  ) : (
                    <Package className="text-[#D4A24C]" size={80} />
                  )}

                  {selectedImages.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                      {selectedImages.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedImageIndex(i)}
                          className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${
                            selectedImageIndex === i ? 'border-[#D4A24C] opacity-100' : 'border-transparent opacity-60'
                          }`}
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col h-[85vh] max-h-[650px] brane-modal-sidebar" style={{ background: 'linear-gradient(180deg, rgba(9,10,15,0.98), rgba(5,6,10,1))' }}>
                  <div className="flex-1 overflow-y-auto px-6 pt-6 pb-3">
                    <div className="brane-badge brane-badge-gold mb-3 inline-flex">
                      {getCategory(selectedPost) || "Produto"}
                    </div>

                    <h2 className="text-xl font-bold text-[#F7F7FA] leading-tight">
                      {getTitle(selectedPost)}
                    </h2>

                    <p className="brane-gold-text text-2xl font-black mt-3">
                      {getPrice(selectedPost)}
                    </p>

                    <div className="flex items-center gap-3 mt-3 text-sm">
                      <span className="flex items-center gap-1.5 text-[#A6A8B3]">
                        <MapPin size={15} />
                        {getLocation(selectedPost)}
                      </span>

                      {getCondition(selectedPost) && (
                        <span className="brane-badge brane-badge-purple">
                          {getCondition(selectedPost)}
                        </span>
                      )}
                    </div>

                    <div className="mt-5 pt-4 border-t border-[#1E2230]">
                      <p className="text-sm leading-relaxed text-[#A6A8B3] whitespace-pre-wrap">
                        {selectedPost.content || selectedPost.description || "Sem descrição disponível."}
                      </p>
                    </div>

                    {selectedPost.seller_name && (
                      <div className="mt-4 pt-4 border-t border-[#1E2230] flex items-center gap-3">
                        <div className="brane-avatar-gradient w-10 h-10 flex items-center justify-center">
                          <div className="w-full h-full rounded-full bg-[#0B0D12] flex items-center justify-center">
                            <User size={18} className="text-[#D4A24C]" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#F7F7FA]">{selectedPost.seller_name}</p>
                          <p className="text-xs text-[#6F7280]">Vendedor</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="px-6 pb-5 pt-3 border-t border-[#1E2230]">
                    <div className="flex gap-2">
                      <input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        className="flex-1 h-11 rounded-2xl brane-input"
                        placeholder="Digite sua mensagem..."
                      />

                      <button
                        onClick={sendMessage}
                        className="brane-btn-gold h-11"
                      >
                        <Send size={16} />
                        Enviar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050508]/90 backdrop-blur-xl">
          <div className="max-w-[1600px] mx-auto px-4 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#D4A24C] via-[#F1D28A] to-[#8A2CFF] p-[1px]">
                <div className="w-full h-full rounded-2xl bg-[#09090D] flex items-center justify-center">
                  <span className="text-[#F1D28A] font-black text-xl">B</span>
                </div>
              </div>

              <div>
                <h1 className="font-black tracking-wide leading-none">B Livre</h1>
                <p className="text-[11px] text-[#8C8F9A] uppercase tracking-[0.2em]">
                  compras, vendas e oportunidades locais
                </p>
              </div>
            </div>

            <div className="hidden md:flex flex-1 max-w-xl items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3">
              <Search size={18} className="text-[#D4A24C]" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar produtos, serviços e oportunidades..."
                className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-[#6F7280]"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setProfileForm({
                    name: user?.name || "",
                    city: user?.city || "",
                    state: user?.state || "",
                    avatar: user?.avatar || user?.photo || user?.picture || ""
                  });
                  setShowSettings(true);
                }}
                className="w-9 h-9 rounded-full bg-gradient-to-br from-[#D4A24C] via-[#F1D28A] to-[#8A2CFF] p-[1.5px] shrink-0 hover:brightness-110 transition-all shadow-[0_0_12px_rgba(212,162,76,0.2)]"
              >
                <div className="w-full h-full rounded-full bg-[#0B0D12] overflow-hidden flex items-center justify-center">
                  {(user?.avatar || user?.photo || user?.picture) ? (
                    <img
                      src={user?.avatar || user?.photo || user?.picture}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[#D4A24C] font-black text-[11px]">
                      {(user?.name || "B")[0].toUpperCase()}
                    </span>
                  )}
                </div>
              </button>
              {showInstall && (
                <button
                  onClick={handleInstall}
                  className="h-10 px-3.5 brane-btn-gold text-[12px] font-black gap-1.5 inline-flex items-center"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Instalar
                </button>
              )}
              <button
                onClick={() => {
                  setUnreadCount(0);
                  setShowNotifications(true);
                  axios.put(API + "/notifications/read-all", {}, { headers: authHeaders }).catch(() => {});
                }}
                className="relative w-11 h-11 rounded-2xl border border-white/10 bg-white/[0.04] flex items-center justify-center text-[#D4A24C] hover:bg-white/[0.08] transition-colors"
              >
                <Bell size={19} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#D4A24C] text-[10px] font-black text-black flex items-center justify-center shadow-[0_0_8px_rgba(212,162,76,0.5)]">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setProfileForm({
                    name: user?.name || "",
                    city: user?.city || "",
                    state: user?.state || "",
                    avatar: user?.avatar || user?.photo || ""
                  });
                  setShowSettings(true);
                }}
                className="w-11 h-11 rounded-2xl border border-white/10 bg-white/[0.04] flex items-center justify-center text-[#D4A24C]"
              >
                <Settings size={19} />
              </button>
            </div>
          </div>
        </header>

        {/* Mobile search bar */}
        <div className="brane-mobile-search">
          <Search size={16} className="text-[#D4A24C] shrink-0" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar na B Livre..."
            className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-[#6F7280]"
          />
        </div>

        <div className="max-w-[1600px] mx-auto px-4 py-4">
          <div
            className="grid gap-4 items-start h-[calc(100vh-92px)] overflow-hidden blivre-shell"
            style={{
              gridTemplateColumns: expanded
                ? "0px minmax(0, 1fr) 70px"
                : "235px minmax(0, 1fr) 255px"
            }}
          >
            <aside
              className={
                "hidden lg:block space-y-5 self-start h-[calc(100vh-110px)] overflow-y-auto pr-1 blivre-side " +
                (expanded ? "opacity-0 pointer-events-none scale-95" : "opacity-100 scale-100")
              }
            >
              <div className="brane-card-soft p-5">
                <div className="flex items-center gap-3 mb-3">
                  <button
                    onClick={() => {
                      setProfileForm({
                        name: user?.name || "",
                        city: user?.city || "",
                        state: user?.state || "",
                        avatar: user?.avatar || user?.photo || user?.picture || ""
                      });
                      setShowSettings(true);
                    }}
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4A24C] via-[#F1D28A] to-[#8A2CFF] p-[2px] shrink-0 hover:brightness-110 transition-all shadow-[0_0_16px_rgba(212,162,76,0.25)]"
                  >
                    <div className="w-full h-full rounded-full bg-[#0B0D12] overflow-hidden flex items-center justify-center">
                      {(user?.avatar || user?.photo || user?.picture) ? (
                        <img
                          src={user?.avatar || user?.photo || user?.picture}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[#D4A24C] font-black text-sm">
                          {(user?.name || "B")[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                  </button>
                  <div className="min-w-0">
                    <h3 className="font-black text-lg flex items-center gap-2 brane-gold-text truncate">
                      {user && user.name ? user.name : "Usuário B Livre"}
                      <BadgeCheck size={17} className="text-[#D4A24C] shrink-0" />
                    </h3>
                  </div>
                </div>

                <div className="mt-5 space-y-1">
                  {[
                    ["Perto de você", MapPin, "near"],
                    ["Meus anúncios", Package, "mine"],
                    ["Favoritos", Heart, "favorites"],
                    ["Mensagens", MessageSquare, "messages"]
                  ].map(([label, Icon, value]) => (
                    <button
                      key={label}
                      onClick={() => {
                        if (value === "messages") {
                          openMessagesTab();
                        } else {
                          setActiveFilter(value);
                          setSelectedCategory("");
                        }
                      }}
                      className={
                        "w-full flex items-center gap-3 text-sm rounded-xl px-3 py-3 transition-all " +
                        (activeFilter === value ? "text-[#F1D28A] bg-[#D4A24C]/10 brane-gold-text font-bold" : "text-[#A6A8B3] hover:bg-white/[0.04] hover:text-white")
                      }
                    >
                      <Icon size={17} className="text-[#D4A24C]" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="brane-card-soft p-5">
                <h3 className="font-black mb-4 flex items-center gap-2 brane-gold-text">
                  <Tags size={18} className="text-[#D4A24C]" />
                  Categorias
                </h3>

                <button
                  onClick={() => {
                    setSelectedCategory("");
                    setActiveFilter("all");
                  }}
                  className="w-full py-2.5 border-b border-[#1E2230] text-sm text-[#F1D28A] text-left hover:text-white transition-colors"
                >
                  Todas
                </button>

                {categories.map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      setSelectedCategory(item);
                      setActiveFilter("all");
                    }}
                    className="w-full py-2.5 border-b border-[#1E2230] last:border-b-0 text-sm text-left text-[#A6A8B3] hover:text-white transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </aside>

            <main
              onScroll={handleProductsScroll}
              className="h-[calc(100vh-110px)] overflow-y-auto pr-2"
            >
              {activeFilter === "messages" ? (
                selectedChat ? (
                  <div className="brane-card-premium p-6" style={{ borderRadius: 32 }}>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-bold text-xl flex items-center gap-2 brane-gold-text">
                        <MessageSquare size={20} />
                        Chat com {selectedChat.sender_name || selectedChat.name || "Usuário"}
                      </h2>
                      <button
                        onClick={closeChat}
                        className="w-8 h-8 brane-btn-gold flex items-center justify-center"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="h-[400px] overflow-y-auto mb-4 space-y-3">
                      {chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.isMine ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] p-3 rounded-2xl ${
                              msg.isMine
                                ? "brane-btn-gold text-black"
                                : "bg-white/10 text-white"
                            }`}
                          >
                            <p className="text-sm">{msg.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
                        placeholder="Digite sua mensagem..."
                        className="flex-1 p-3 brane-input"
                      />
                      <button
                        onClick={sendChatMessage}
                        disabled={!chatMessage.trim()}
                        className="brane-btn-gold disabled:opacity-60"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="brane-card-premium p-6" style={{ borderRadius: 32 }}>
                    <h2 className="font-bold text-xl mb-4 flex items-center gap-2 brane-gold-text">
                      <MessageSquare size={20} />
                      Mensagens
                    </h2>

                    {messages.length === 0 ? (
                      <p className="text-sm text-[#8C8F9A]">
                        Nenhuma mensagem por enquanto.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {(() => {
                          const grouped = {};
                          messages.forEach((m) => {
                            const pid = m.post_id || "unknown";
                            if (!grouped[pid]) grouped[pid] = { post_id: pid, messages: [] };
                            grouped[pid].messages.push(m);
                          });
                          const conversations = Object.values(grouped).map((g) => {
                            g.messages.sort((a, b) => (a.created_at || "").localeCompare(b.created_at || ""));
                            const last = g.messages[g.messages.length - 1];
                            const other = g.messages.find((m) => m.sender_id !== user?.user_id) || g.messages[0];
                            return { post_id: g.post_id, lastMsg: last, otherName: other?.sender_name || "Você" };
                          });
                          conversations.sort((a, b) => ((b.lastMsg?.created_at || "") > (a.lastMsg?.created_at || "") ? 1 : -1));
                          return conversations.map((conv, i) => {
                            const convPost = posts.find((p) => (p.post_id || p.id || "") === conv.post_id || getPostKey(p) === conv.post_id);
                            const convImg = convPost ? getPostImages(convPost)[0] || "" : "";
                            const convTitle = convPost ? getTitle(convPost) : "Anúncio";
                            return (
                              <button
                                key={conv.post_id || i}
                                onClick={() => openChat({ post_id: conv.post_id, sender_name: conv.otherName, message: conv.lastMsg?.message })}
                                className="w-full text-left brane-card-soft p-3 hover:bg-white/[0.08] transition-colors flex items-start gap-3"
                              >
                                {convImg ? (
                                  <img src={convImg} alt="" className="w-11 h-11 rounded-xl object-cover shrink-0" />
                                ) : (
                                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#D4A24C]/20 to-[#8A2CFF]/20 flex items-center justify-center text-[#D4A24C] shrink-0">
                                    <Package size={18} />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-semibold text-white truncate">{convTitle}</p>
                                    <span className="text-[10px] text-[#6F7280] shrink-0">{conv.lastMsg?.created_at ? new Date(conv.lastMsg.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : ""}</span>
                                  </div>
                                  <p className="text-xs text-[#D4A24C] mt-0.5 font-medium">{conv.otherName}</p>
                                  <p className="text-[11px] text-[#A6A8B3] mt-0.5 truncate">{conv.lastMsg?.message || "Clique para ver a conversa"}</p>
                                </div>
                              </button>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>
                )
              ) : loading ? (
                <div className="grid gap-4 blivre-grid">
                  {Array.from({ length: 12 }, (_, index) => (
                    <SkeletonCard key={index} />
                  ))}
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="brane-card-premium p-12 text-center" style={{ borderRadius: 32 }}>
                  <Package className="mx-auto text-[#D4A24C] mb-4" size={46} />
                  <p className="text-[#A6A8B3] font-semibold text-lg">
                    Nenhum anúncio encontrado.
                  </p>
                  <p className="text-sm text-[#6F7280] mt-2">
                    Tente buscar por outra categoria ou termo.
                  </p>
                </div>
              ) : (
                <div className={expanded ? "grid gap-4 blivre-grid-focused" : "grid gap-4 blivre-grid"}>
                  {filteredPosts.map((post) => {
                    const key = getPostKey(post);
                    const isFavorite = favorites.includes(key);

                    return (
                      <div
                        key={key}
                        className="brane-card-premium blivre-product-card animate-brane-fade-in"
                        style={{ animationDelay: filteredPosts.indexOf(post) * 0.03 + 's', animationFillMode: 'both' }}
                      >
                        <button
                          type="button"
                          onClick={() => openPost(post)}
                          className="w-full text-left"
                        >
                          <div className="relative aspect-square bg-[#050608] overflow-hidden rounded-t-[22px]">
                            {getCoverImage(post) ? (
                              <ProductImageZoom
                                src={getCoverImage(post)}
                                alt="Anúncio"
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                                wrapperClassName="w-full h-full"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#D4A24C]">
                                <Package size={42} />
                              </div>
                            )}

                            {activeFilter === "mine" ? (
                              <div className="absolute top-2 right-2 flex gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    editPost(post);
                                  }}
                                  className="w-8 h-8 rounded-full bg-[#D4A24C] text-black flex items-center justify-center hover:brightness-110"
                                >
                                  <Settings size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deletePost(post);
                                  }}
                                  className="w-8 h-8 rounded-full bg-red-500/80 text-white flex items-center justify-center hover:bg-red-500"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => toggleFavorite(post, e)}
                                className={
                                  "absolute top-2 right-2 w-9 h-9 rounded-full flex items-center justify-center border z-10 " +
                                  (isFavorite ? "bg-[#D4A24C] text-black border-[#D4A24C]" : "bg-black/60 text-white border-white/20")
                                }
                              >
                                <Heart size={16} fill={isFavorite ? "currentColor" : "none"} />
                              </button>
                            )}
                          </div>

                          <div className="p-3" style={{ background: 'linear-gradient(180deg, rgba(9,10,15,0.96), rgba(5,6,10,1))' }}>
                            <div className="flex items-center gap-2 mb-1.5">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#D4A24C] to-[#8A2CFF] p-[1px] flex-shrink-0">
                                <div className="w-full h-full rounded-full bg-[#0B0D12] flex items-center justify-center">
                                  <span className="text-[10px] font-bold text-[#D4A24C]">{(post.seller_name || post.user_name || 'B')[0]}</span>
                                </div>
                              </div>
                              <span className="text-[11px] text-[#A6A8B3] truncate">{post.seller_name || post.user_name || "B Livre"}</span>
                            </div>
                            <p className="text-[#F7F7FA] font-semibold text-sm leading-tight line-clamp-2">
                              {getTitle(post)}
                            </p>

                            <p className="brane-gold-text font-black text-lg mt-1 tracking-[-0.04em]">
                              {getPrice(post)}
                            </p>

                            <p className="text-[11px] text-[#A6A8B3] font-medium mt-1 truncate flex items-center gap-1">
                              <MapPin size={11} />
                              {getLocation(post)}
                            </p>

                            <div className="mt-2.5">
                              <span className="inline-flex justify-center items-center gap-1 brane-btn-gold text-[10px] py-1 px-2.5">
                                <ShoppingCart size={11} />
                                {activeFilter === "mine" ? "Ver meu anúncio" : "Ver produto"}
                              </span>
                            </div>
                          </div>
                        </button>
                      </div>
                    );
                  })}

                  <div ref={loadMoreRef} />
                </div>
              )}
            </main>

            <aside className="hidden lg:block h-[calc(100vh-110px)] overflow-hidden blivre-side">
              {expanded ? (
                <button
                  onClick={() => setComposerOpen(true)}
                  className="w-12 h-12 brane-btn-gold font-black text-lg items-center justify-center flex mx-auto"
                >
                  +
                </button>
              ) : (
                <div className="space-y-5">
                  <div className="brane-card-premium p-5">
                    <h3 className="font-black mb-3 flex items-center gap-2 brane-gold-text">
                      <Package size={18} className="text-[#D4A24C]" />
                      Anunciar produto
                    </h3>

                    <button
                      type="button"
                      onClick={() => {
                        if (!requireAuth()) return;
                        setUseAI(true);
                        setComposerOpen(true);
                      }}
                      className="w-full brane-btn-gold"
                    >
                      Anunciar
                    </button>
                  </div>

                  <div className="brane-card-soft p-5">
                    <h3 className="font-black mb-4 flex items-center gap-2 brane-gold-text">
                      <Globe size={18} className="text-[#D4A24C]" />
                      Alcance
                    </h3>

                    <div className="space-y-3 text-sm text-[#A6A8B3]">
                      <div className="flex items-center justify-between">
                        <span>Visualizações</span>
                        <span className="brane-gold-text font-bold">{totalViews}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span>Interesses</span>
                        <span className="brane-gold-text font-bold">{totalInterests}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span>Meus anúncios</span>
                        <span className="brane-gold-text font-bold">{totalMyAds}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>

      {/* Mobile FAB anunciar (hidden when detail modal is open) */}
      {(!selectedPost) && (
        <button className="brane-fab" onClick={() => { if (!requireAuth()) return; setUseAI(true); setComposerOpen(true); }}>
          +
        </button>
      )}

      {/* Mobile bottom navigation */}
      <nav className="brane-bottom-nav">
        {[
          ["Início", Package, "all"],
          ["Mensagens", MessageSquare, "messages"],
          ["Favoritos", Heart, "favorites"],
          ["Anúncios", User, "mine"],
          ["Conta", Settings, "settings"]
        ].map(([label, Icon, value]) => (
          <button
            key={value}
            onClick={() => {
              if (value === "settings") {
                setProfileForm({
                  name: user?.name || "",
                  city: user?.city || "",
                  state: user?.state || "",
                  avatar: user?.avatar || user?.photo || ""
                });
                setShowSettings(true);
                window.history.pushState({ braneSettings: true }, "", window.location.pathname);
              } else if (value === "messages") {
                openMessagesTab();
              } else {
                setActiveFilter(value === "all" ? "all" : value);
                setSelectedCategory("");
                setSelectedChat(null);
              }
            }}
            className={value === (activeFilter === "all" ? "all" : activeFilter) ? "brane-bottom-active" : ""}
          >
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <BLivreAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={() => {
          setShowAuthModal(false);
          loadSocialData();
        }}
      />
    </div>
  );
}
