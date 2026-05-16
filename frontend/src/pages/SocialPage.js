import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import axios from "axios";
import {
  Send, User, Bell, Search, MessageSquare,
  Settings, BadgeCheck, Package, MapPin, Tags,
  Heart, X, ChevronLeft, ChevronRight, Globe, Camera, ShoppingCart,
  Copy, Phone
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useBLivreAuth } from "../contexts/BLivreAuthContext";
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

const productConditions = ["Novo", "Usado", "Seminovo", "Recondicionado", "Em bom estado", "Com detalhes", "Para retirada de peças"];

const descriptionExamples = [
  "iPhone 13, R$3500, São Paulo, seminovo…",
  "Notebook gamer, R$2200, Belém…",
  "Sofá 3 lugares, R$800, Rio de Janeiro, ótimo estado…",
  "Bicicleta aro 29, R$600, BH, usada 6 meses…",
  "Fone Bluetooth, R$120, Curitiba, novo na caixa…"
];

export default function SocialPage() {
  const mainAuth = useAuth() || {};
  const blivreAuth = useBLivreAuth() || {};

  const readStoredToken = () => {
    if (typeof window === "undefined") return null;
    return (
      window.localStorage.getItem("blivre_token") ||
      window.localStorage.getItem("brane_token") ||
      null
    );
  };

  const decodeTokenUser = (jwt) => {
    try {
      if (!jwt || typeof window === "undefined") return null;
      const payload = JSON.parse(window.atob(jwt.split(".")[1] || ""));
      return {
        id: payload.id || payload.user_id || payload.sub || payload._id,
        user_id: payload.user_id || payload.id || payload.sub || payload._id,
        email: payload.email,
        name: payload.name || payload.username || payload.full_name
      };
    } catch {
      return null;
    }
  };

  const currentToken =
    blivreAuth.token ||
    mainAuth.token ||
    readStoredToken();

  const currentUser =
    blivreAuth.user ||
    mainAuth.user ||
    decodeTokenUser(currentToken) ||
    null;

  const getCurrentUserId = () =>
    String(currentUser?.user_id || currentUser?.id || currentUser?.sub || currentUser?._id || "");

  const logout = blivreAuth.logout || mainAuth.logout || (() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("blivre_token");
      window.localStorage.removeItem("brane_token");
      window.sessionStorage.removeItem("blivre_token");
    }
  });

  const authHeaders = useMemo(() => currentToken ? { Authorization: "Bearer " + currentToken } : {}, [currentToken]);
  const API = mainAuth.API || `${process.env.REACT_APP_BACKEND_URL || "https://brane-production-3c87.up.railway.app"}/api`;

  const imageInputRef = useRef(null);
  const avatarInputRef = useRef(null);
  const loadMoreRef = useRef(null);
  const scrollFrameRef = useRef(null);
  const expandedRef = useRef(false);
  const chatScrollRef = useRef(null);
  const aiChatScrollRef = useRef(null);
  const userRef = useRef(null);
  userRef.current = currentUser;

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
  const [showMobileAiInput, setShowMobileAiInput] = useState(false);
  const [mobileAiText, setMobileAiText] = useState("");
  const [mobileEditInput, setMobileEditInput] = useState("");
  const [aiFilled, setAiFilled] = useState(false);
  const [mobileShowForm, setMobileShowForm] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);
  const [formError, setFormError] = useState("");

  const [aiChatMessages, setAiChatMessages] = useState([]);
  const [aiStep, setAiStep] = useState('greeting');
  const [contactInput, setContactInput] = useState("");
  const [contactType, setContactType] = useState(null); // 'whatsapp' | 'phone' | null
  const [emojiCycle, setEmojiCycle] = useState(0);
  const [enhancedTitle, setEnhancedTitle] = useState("");
  const [enhancedDesc, setEnhancedDesc] = useState("");
  const [marketingLine, setMarketingLine] = useState("");

  const titleEmojiSets = [
    ["🏷️", "💎"],
    ["🔥", "⭐"],
    ["👑", "⚡"],
    ["💫", "🎯"],
  ];
  const descEmojiSets = [
    ["📌", "🔹"],
    ["✅", "➡️"],
    ["📍", "🔸"],
    ["💡", "▫️"],
  ];
  const marketingEmojis = ["✨", "🔥", "💬", "📞", "💎", "⚡", "🎯", "🏆", "👉", "💫"];
  const marketingPhrases = [
    "Aproveite essa oportunidade imperdível!",
    "Atendimento rápido e facilitado.",
    "Entre em contato para mais informações.",
    "Disponível para negociação.",
    "Não perca tempo, chame agora!",
    "Qualidade e bom negócio esperam por você.",
    "Oferta especial por tempo limitado.",
    "Garanta já o seu produto!",
    "Solicite mais fotos e detalhes.",
    "Estoque limitado, aproveite!",
  ];

  const generateMarketingText = (descLength, cycleOffset) => {
    let count;
    if (descLength < 50) count = 4;
    else if (descLength < 150) count = 3;
    else count = 2;
    const start = cycleOffset % Math.max(1, marketingPhrases.length - count + 1);
    const lines = [];
    for (let i = 0; i < count; i++) {
      const emoji = marketingEmojis[(cycleOffset + i) % marketingEmojis.length];
      const phrase = marketingPhrases[(start + i) % marketingPhrases.length];
      lines.push(`${emoji} ${phrase}`);
    }
    return lines.join("\n");
  };

  const applyEnhancement = (cycle) => {
    const te = titleEmojiSets[cycle % titleEmojiSets.length];
    const de = descEmojiSets[cycle % descEmojiSets.length];
    if (form.title) setEnhancedTitle(`${te[0]} ${form.title} ${te[1]}`);
    if (form.description) setEnhancedDesc(`${de[0]} ${form.description} ${de[1]}`);
    setMarketingLine(generateMarketingText((form.description || "").length, cycle));
  };

  const conditionOptions = ["Novo", "Seminovo", "Usado", "Com defeito", "Recondicionado"];
  const availabilityOptions = ["Item único", "Tenho unidades", "Sob encomenda"];

  const [unreadCount, setUnreadCount] = useState(0);
  const notifIntervalRef = useRef(null);

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

  useEffect(() => {
    if (composerOpen) {
      document.body.classList.add('ai-modal-open');
      setAiFilled(false);
      setMobileShowForm(false);
      setMobileAiText("");
      setMobileEditInput("");
      setShowMobileAiInput(false);
      setAiStep('greeting');
      setAiChatMessages([]);
    } else {
      document.body.classList.remove('ai-modal-open');
    }
    return () => document.body.classList.remove('ai-modal-open');
  }, [composerOpen]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowInstall(false);
    setDeferredPrompt(null);
  };

  const requireAuth = () => {
    if (!currentUser) {
      window.location.href = "/blivre/login";
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
    availability: "Item único",
    phone: "",
    whatsapp: ""
  });

  const [showContactModal, setShowContactModal] = useState(null);

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
  const getTitle = (post) => post.enhanced_title || getPostLines(post)[0] || post.title || "Produto anunciado";
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
    if (!currentUser) return false;
    return (
      String(post.user_id) === getCurrentUserId() ||
      String(post.owner_id) === getCurrentUserId()
    );
  };

  // Find real name from any object checking all possible fields
  const findName = (obj) => {
    if (!obj) return "";
    return obj.sender_name || obj.name || obj.user_name || obj.buyer_name ||
           obj.seller_name || obj.receiver_name || obj.owner_name || obj.author ||
           obj.sender || obj.user?.name || obj.profile?.name || "";
  };

  const getMessageSenderId = (msg) =>
    String(msg?.sender_id || msg?.sender_user_id || msg?.from_user_id || msg?.sender?.id || msg?.user_id || "");

  const [unreadConversations, setUnreadConversations] = useState([]);

  const fetchUnreadMessages = async () => {
    if (!currentToken) return;
    try {
      const res = await axios.get(API + "/social/messages/unread", { headers: authHeaders });
      const data = res.data;
      setUnreadConversations(data.conversations || []);
      setUnreadCount(data.conversation_count || 0);
    } catch (e) {
      console.error("Erro ao buscar mensagens não lidas:", e);
    }
  };

  const markChatAsRead = async (postId) => {
    if (!postId || !currentToken) return;
    try {
      await axios.post(API + "/social/messages/read-conversation/" + postId, {}, { headers: authHeaders });
      await fetchUnreadMessages();
    } catch (e) {
      console.error("Erro ao marcar conversa como lida:", e);
    }
  };

  const refreshUnreadCount = () => {
    fetchUnreadMessages();
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

        const maxWidth = 800;
        const scale = Math.min(1, maxWidth / img.width);

        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.6));
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
    if (!currentToken) return;

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

      const nd = notificationsRes.status === "fulfilled" ? notificationsRes.value.data : {};
      const md = messagesRes.status === "fulfilled" ? messagesRes.value.data : {};
      const nextNotifications = nd.notifications || [];
      const nextMessages = md.messages || [];

      setNotifications(nextNotifications);
      setMessages(nextMessages);
      refreshUnreadCount();
    } catch (error) {
      console.error("Erro ao carregar dados sociais:", error);
    }
  };

  const CACHE_KEY = "blivre_posts_cache";

  const latestReq = useRef(0);
  const loadPosts = async (pageNumber = 1, append = false) => {
    const reqId = ++latestReq.current;
    const controller = new AbortController();
    try {
      if (append) setLoadingMore(true);
      else {
        // Show cached posts immediately while loading fresh ones
        const fromCache = pageNumber === 1 && !append;
        if (fromCache) {
          try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
              const parsed = JSON.parse(cached);
              if (Array.isArray(parsed) && parsed.length) {
                setPosts(parsed);
                setHasMore(parsed.length >= PAGE_SIZE);
              }
            }
          } catch {}
        }
        setLoading(true);
      }

      const res = await axios.get(
        API + "/social/posts?limit=" + PAGE_SIZE + "&page=" + pageNumber,
        { signal: controller.signal }
      );

      if (reqId !== latestReq.current) return;

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
        // Cache page 1 results
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(list)); } catch {}
      }

      if (list.length < PAGE_SIZE) setHasMore(false);
    } catch (error) {
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') return;
      console.error(error);
      if (!append && !posts.length) setPosts([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadPosts(1, false);
  }, []);

  const pollIntervalRef = useRef(null);

  useEffect(() => {
    if (!currentToken) return;
    loadSocialData();

    let backoff = 5000;
    const pollSocial = async () => {
      if (document.hidden) return;
      try {
        const controller = new AbortController();
        const [notificationsRes, messagesRes] = await Promise.allSettled([
          axios.get(API + "/notifications", { headers: authHeaders, signal: controller.signal }),
          axios.get(API + "/social/messages", { headers: authHeaders, signal: controller.signal })
        ]);

        const nd = notificationsRes.status === "fulfilled" ? notificationsRes.value.data : {};
        const md = messagesRes.status === "fulfilled" ? messagesRes.value.data : {};
        const nextNotifications = nd.notifications || [];
        const nextMessages = md.messages || [];

        const notifLen = nextNotifications.length;
        const msgLen = nextMessages.length;
        setNotifications((prev) => prev.length !== notifLen ? nextNotifications : prev);
        setMessages((prev) => {
          if (prev.length !== msgLen) return nextMessages;
          for (let i = 0; i < msgLen; i++) {
            if (prev[i]?.message_id !== nextMessages[i]?.message_id) return nextMessages;
          }
          return prev;
        });

        fetchUnreadMessages();
        backoff = 5000;
      } catch {
        // keep silent polling failures from breaking the UI
      }
    };

    const startPolling = () => {
      pollSocial();
      pollIntervalRef.current = setInterval(pollSocial, 15000);
    };

    const onVisible = () => {
      if (document.hidden) return;
      loadSocialData();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);

    startPolling();

    return () => {
      if (scrollFrameRef.current) cancelAnimationFrame(scrollFrameRef.current);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [currentToken]);

  useEffect(() => {
    const handlePop = () => {
      if (selectedChat) { closeChat(); return; }
      if (selectedPost) { setSelectedPost(null); return; }
      if (showNotifications) { setShowNotifications(false); return; }
      if (showSettings) { setShowSettings(false); return; }
      if (composerOpen) { setComposerOpen(false); return; }
      if (activeFilter !== "all") { setActiveFilter("all"); return; }
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, [selectedChat, showNotifications, showSettings, selectedPost, composerOpen, activeFilter]);

  useEffect(() => {
    if (selectedChat?.post_id) {
      loadChatMessages(selectedChat.post_id);
    }
  }, [selectedChat?.post_id]);

  // Chat real-time polling using filtered endpoint (complete data)
  useEffect(() => {
    if (!selectedChat?.post_id) return;
    const interval = setInterval(() => {
      loadChatMessagesRef.current(selectedChat.post_id);
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedChat?.post_id]);

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

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    for (const f of files) {
      if (f.size > MAX_FILE_SIZE) {
        alert("Imagem muito grande. Máximo 5MB por foto.");
        if (imageInputRef.current) imageInputRef.current.value = "";
        return;
      }
    }

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

  const handleAiFill = () => {
    const text = mobileAiText.trim();
    if (!text) return;

    setAiChatMessages(prev => [...prev, { role: 'user', text }]);

    runAiParse(text);
    setShowMobileAiInput(false);
    setMobileAiText("");

    // Check if parsing produced essential data
    // We check via setTimeout since form state updates are batched
    setTimeout(() => {
      setForm(currentForm => {
        if (currentForm.title && currentForm.price) {
          setAiChatMessages(prev => [...prev, {
            role: 'assistant',
            text: 'Ótimo, entendi.'
          }]);
          setTimeout(() => {
            setAiChatMessages(prev => [...prev, {
              role: 'assistant',
              text: 'Agora, qual o estado do produto?'
            }]);
            setAiStep('asking_condition');
          }, 600);
        } else {
          setAiChatMessages(prev => [...prev, {
            role: 'assistant',
            text: 'Não consegui interpretar. Tente no formato: "produto, R$ preço, cidade, descrição"'
          }]);
        }
        return currentForm;
      });
    }, 50);
  };

  const handleFooterSend = () => {
    const text = mobileEditInput.trim();
    if (!text) return;
    runAiParse(text);
    setMobileEditInput("");
  };

  const handleNewMobile = () => {
    setForm({ category: "", title: "", price: "", state: "", city: "", productCondition: "", description: "", availability: "Item único", phone: "", whatsapp: "" });
    setImages([]);
    setAiFilled(false);
    setMobileShowForm(false);
    setMobileAiText("");
    setMobileEditInput("");
    setAiStep('greeting');
    setAiChatMessages([]);
    setContactInput("");
    setContactType(null);
    setEmojiCycle(0);
    setEnhancedTitle("");
    setEnhancedDesc("");
    setMarketingLine("");
  };

  const handleConditionSelect = (condition) => {
    setForm(prev => ({ ...prev, productCondition: condition }));
    setAiChatMessages(prev => [...prev, { role: 'assistant', text: `Perfeito. Qual a disponibilidade?` }]);
    setAiStep('asking_availability');
  };

  const handleAvailabilitySelect = (availability) => {
    setForm(prev => ({ ...prev, availability }));
    setAiChatMessages(prev => [...prev, { role: 'assistant', text: 'Deseja adicionar número para contato?' }]);
    setAiStep('asking_contact');
  };

  const handleContactChoice = (type) => {
    if (type === 'skip') {
      setAiChatMessages(prev => [...prev, { role: 'assistant', text: 'Agora envie pelo menos uma foto do produto.' }]);
      setAiStep('asking_photo');
      return;
    }
    setContactType(type);
    const label = type === 'whatsapp' ? 'WhatsApp' : 'Chamada normal';
    setAiChatMessages(prev => [...prev, {
      role: 'assistant',
      text: `Digite o número de ${label}:`
    }]);
    setAiStep('typing_contact');
  };

  const handleContactSubmit = () => {
    const num = contactInput.trim();
    if (!num) return;
    if (contactType === 'whatsapp') {
      setForm(prev => ({ ...prev, whatsapp: num }));
    } else {
      setForm(prev => ({ ...prev, phone: num }));
    }
    setContactInput("");
    setAiChatMessages(prev => [...prev, { role: 'assistant', text: 'Número salvo ✅' }]);
    setTimeout(() => {
      setAiChatMessages(prev => [...prev, { role: 'assistant', text: 'Agora envie pelo menos uma foto do produto.' }]);
      setAiStep('asking_photo');
    }, 500);
  };

  useEffect(() => {
    if (aiStep === 'asking_photo' && images.length > 0) {
      setAiStep('preview');
      setEmojiCycle(0);
      applyEnhancement(0);
    }
  }, [images, aiStep]);

  useEffect(() => {
    if (aiChatScrollRef.current) {
      aiChatScrollRef.current.scrollTop = aiChatScrollRef.current.scrollHeight;
    }
  }, [aiChatMessages, aiStep]);

  const runAiParse = (rawText) => {
    const text = rawText.trim();
    if (!text) return;

    const conditions = ["Novo", "Seminovo", "Usado", "Recondicionado"];
    const catKeywords = {
      "Celulares": ["celular", "iphone", "smartphone", "tablet", "ipad", "notebook", "computador", "apple", "samsung", "xiaomi", "fone", "carregador"],
      "Veículos": ["bicicleta", "bike", "moto", "carro", "caminhão", "veículo", "patinete", "skate"],
      "Imóveis": ["casa", "apartamento", "kitnet", "terreno", "imóvel", "aluguel", "condomínio"],
      "Casa e móveis": ["cama", "sofá", "mesa", "cadeira", "armário", "móvel", "geladeira", "fogão", "tv", "televisão", "ventilador"],
      "Moda": ["sapato", "roupa", "bolsa", "vestido", "camisa", "tênis", "jaqueta", "calça", "bermuda", "casaco"],
      "Serviços": ["serviço", "conserto", "manutenção", "aula", "reforma", "limpeza", "instalação", "frete"]
    };
    const ufs = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
    const fullStateNames = {
      "AC":"Acre","AL":"Alagoas","AP":"Amapá","AM":"Amazonas","BA":"Bahia","CE":"Ceará","DF":"Distrito Federal",
      "ES":"Espírito Santo","GO":"Goiás","MA":"Maranhão","MT":"Mato Grosso","MS":"Mato Grosso do Sul",
      "MG":"Minas Gerais","PA":"Pará","PB":"Paraíba","PR":"Paraná","PE":"Pernambuco","PI":"Piauí",
      "RJ":"Rio de Janeiro","RN":"Rio Grande do Norte","RS":"Rio Grande do Sul","RO":"Rondônia",
      "RR":"Roraima","SC":"Santa Catarina","SP":"São Paulo","SE":"Sergipe","TO":"Tocantins"
    };
    const stateNameToUf = {};
    for (const [uf, name] of Object.entries(fullStateNames)) {
      stateNameToUf[name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase()] = uf;
    }

    // Protect Brazilian price commas before splitting by comma
    const priceCommaReplacer = (match) => match.replace(",", "__PC__");
    const textProtected = text.replace(/(?:R\$\s*)?\d{1,3}(?:\.\d{3})*,\d{2}/g, priceCommaReplacer);

    const parts = textProtected.split(",").map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return;

    // Step 1: find price — any part that is a number (with or without R$, commas/dots)
    let priceIdx = -1;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i].replace(/__PC__/g, ",");
      const stripped = p.replace(/^R\$\s*/i, "").trim();
      const digitsOnly = stripped.replace(/[^\d,]/g, "");
      const isPrice = digitsOnly.length >= 1 && digitsOnly.length <= 10 &&
        stripped.replace(/[.,\d]/g, "").length <= 1 &&
        /[\d,.]/.test(stripped) &&
        !/^\d{4,}$/.test(stripped);
      if (isPrice) {
        priceIdx = i;
        break;
      }
    }

    let parsedPrice = "";
    if (priceIdx >= 0) {
      const rawPrice = parts[priceIdx].replace(/__PC__/g, ",").replace(/^R\$\s*/i, "").trim();
      parsedPrice = rawPrice.replace(/\./g, "").replace(",", ".");
      updateForm("price", parsedPrice);
    }

    // Step 2: find city/state in the last part(s)
    let cityIdx = -1;
    let parsedCity = "";
    let parsedState = "";
    for (let i = parts.length - 1; i >= 0; i--) {
      if (i === priceIdx) continue;
      const raw = parts[i];
      const words = raw.split(/\s+/).filter(Boolean);
      if (words.length >= 1) {
        const lastWord = words[words.length - 1];
        const lastWordClean = lastWord.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
        const lastWordUF = ufs.includes(lastWordClean) ? lastWordClean : (stateNameToUf[lastWordClean] || null);
        const secondToLast = words.length >= 2 ? words.slice(0, -1).join(" ") : null;

        if (lastWordUF) {
          if (secondToLast) {
            const secondToLastClean = secondToLast.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
            if (!ufs.includes(secondToLastClean) && secondToLast.length > 2) {
              parsedCity = secondToLast;
              parsedState = lastWordUF;
            } else {
              if (i > 0 && i !== priceIdx) {
                const prevPart = parts[i - 1];
                const prevWords = prevPart.split(/\s+/);
                const possibleCity = prevWords[prevWords.length - 1];
                const possibleCityClean = possibleCity?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
                if (possibleCity && possibleCity.length > 2 && !ufs.includes(possibleCityClean)) {
                  parsedCity = possibleCity;
                  parsedState = lastWordUF;
                  cityIdx = i - 1;
                }
              }
              if (!parsedCity) {
                const stateName = fullStateNames[lastWordUF] || lastWord;
                parsedCity = raw.replace(new RegExp(lastWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "i"), "").trim() || raw;
                parsedState = lastWordUF;
              }
            }
          } else {
            parsedState = lastWordUF;
          }
          cityIdx = i;
          break;
        }
      }
    }

    // If no UF found, check if last part looks like a city name
    if (cityIdx < 0) {
      for (let i = parts.length - 1; i >= 0; i--) {
        if (i === priceIdx) continue;
        const raw = parts[i];
        // A city name: 3+ chars, only letters/spaces, not a price
        if (/^[A-Za-zÀ-ÿ\s]{3,}$/.test(raw) && !/\d/.test(raw)) {
          parsedCity = raw;
          cityIdx = i;
          break;
        }
      }
    }

    if (parsedCity) updateForm("city", parsedCity);
    if (parsedState) updateForm("state", parsedState);

    // Step 3: title = first part, description = everything else not price/city
    if (parts.length > 0) {
      updateForm("title", parts[0]);
    }

    // Category detection with fallback
    const allText = parts.join(" ").toLowerCase();
    let detected = false;
    for (const [cat, words] of Object.entries(catKeywords)) {
      if (words.some((w) => allText.includes(w))) {
        updateForm("category", cat);
        detected = true;
        break;
      }
    }
    if (!detected) {
      updateForm("category", "Outros");
    }

    const knownIdx = new Set([0, priceIdx, cityIdx].filter(i => i >= 0 && i !== 0));
    const descParts = [];
    for (let i = 1; i < parts.length; i++) {
      if (knownIdx.has(i)) continue;
      descParts.push(parts[i]);
    }
    if (descParts.length > 0) {
      updateForm("description", descParts.join(", "));
    }

    setAiFilled(true);
    setMobileShowForm(false);
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

      const markSuffix = marketingLine ? "\n" + marketingLine : "";
      await axios.post(
        API + "/social/posts",
        {
          content: buildContent(sourceForm) + markSuffix,
          image: JSON.stringify(sourceImages),
          category: sourceForm.category,
          title: sourceForm.title,
          price: sourceForm.price,
          state: sourceForm.state,
          city: sourceForm.city,
          product_condition: sourceForm.productCondition,
          description: sourceForm.description,
          availability: sourceForm.availability,
          phone: sourceForm.phone || "",
          whatsapp: sourceForm.whatsapp || "",
          enhanced_title: enhancedTitle || "",
          enhanced_description: enhancedDesc || "",
          marketing_text: marketingLine || ""
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
        availability: "Item único",
        phone: "",
        whatsapp: ""
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
          phone: form.phone,
          whatsapp: form.whatsapp
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

      setMessage("");
      openChat({ post_id: getPostKey(selectedPost), sender_name: findName(selectedPost) || "Usuário", message });
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
      const userCity = String(currentUser?.city || "").toLowerCase();
      const userState = String(currentUser?.state || "").toLowerCase();

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
    if (!currentToken) return;
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
    axios.get(API + "/social/messages", { headers: authHeaders })
      .then((r) => {
        setMessages(r.data.messages || []);
        refreshUnreadCount();
      })
      .catch(() => {});
  };

  const loadChatMessages = async (postId) => {
    try {
      const res = await axios.get(API + "/social/messages?post_id=" + postId, { headers: authHeaders });
      const msgs = (res.data.messages || [])
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        .map((m) => ({
          id: m.message_id || m.id,
          sender: findName(m) || "Usuário",
          message: m.message,
          timestamp: new Date(m.created_at || Date.now()),
          isMine: getMessageSenderId(m) === getCurrentUserId()
        }));
      setChatMessages(msgs);
      setTimeout(() => {
        if (chatScrollRef.current) {
          chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
      }, 50);
    } catch (e) {
      console.error("Erro ao carregar mensagens:", e);
      setChatMessages([]);
    }
  };

  const loadChatMessagesRef = useRef(loadChatMessages);
  useEffect(() => {
    loadChatMessagesRef.current = loadChatMessages;
  });

  const openChat = (chat) => {
    setActiveFilter("messages");
    setSelectedChat(chat);
    if (chat?.post_id) markChatAsRead(chat.post_id);
    fetchMessages();
    window.history.pushState({ braneChat: true }, "", window.location.pathname);
  };

  const closeChat = () => {
    setSelectedChat(null);
    setChatMessages([]);
    setChatMessage("");
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
      fetchMessages();
      axios.get(API + "/notifications", { headers: authHeaders })
        .then((r) => {
          setNotifications(r.data.notifications || []);
          refreshUnreadCount();
        })
        .catch(() => {});
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
      availability: post.availability || "Item único",
      phone: post.phone || "",
      whatsapp: post.whatsapp || ""
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
    <div className="min-h-screen text-white relative overflow-hidden" style={{ background: '#020814' }}>
      <style>
        {`
          @keyframes blivreSlideIn {
            from { opacity: 0; transform: translateX(180px) scale(0.92); }
            to { opacity: 1; transform: translateX(0) scale(1); }
          }

          @keyframes braneFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes braneSlideUp {
            from { opacity: 0; transform: translateY(40px) scale(0.96); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }

          @keyframes braneFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-6px); }
          }

          @keyframes braneTilt {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(-1.5deg); }
            75% { transform: rotate(1.5deg); }
          }

          @keyframes braneBreathe {
            0%, 100% { transform: scaleY(1); }
            50% { transform: scaleY(1.02); }
          }

          @keyframes braneArmLeft {
            0%, 100% { transform: rotate(0deg); }
            33% { transform: rotate(6deg); }
            66% { transform: rotate(-3deg); }
          }

          @keyframes braneArmRight {
            0%, 100% { transform: rotate(0deg); }
            33% { transform: rotate(-6deg); }
            66% { transform: rotate(3deg); }
          }

          @media (max-width: 767px) {
            .brane-glass-mobile {
              background: rgba(5, 6, 8, 0.72) !important;
              backdrop-filter: blur(18px) !important;
              -webkit-backdrop-filter: blur(18px) !important;
            }
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

          @media (max-width: 768px) {
            .blivre-grid,
            .blivre-grid-focused {
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 10px !important;
            }
            .blivre-product-card img,
            .blivre-product-card .aspect-square {
              min-height: 160px;
            }
            .blivre-product-card .text-sm.line-clamp-2 {
              font-size: 13px !important;
            }
            .blivre-product-card .text-lg {
              font-size: 17px !important;
            }
          }

          body.ai-modal-open .bottom-nav,
          body.ai-modal-open .mobile-bottom-nav,
          body.ai-modal-open .mobile-tabbar,
          body.ai-modal-open .safe-area-bottom,
          body.ai-modal-open .bottom-safe-area,
          body.ai-modal-open .brane-bottom-nav {
            display: none !important;
          }

          .mobile-ai-overlay {
            position: fixed;
            inset: 0;
            bottom: 0;
            min-height: 100dvh;
            background: #05050a !important;
            z-index: 9999;
          }

        `}
      </style>

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at center, rgba(0,120,255,0.28), transparent 45%), linear-gradient(180deg, #031633 0%, #020814 55%, #01040A 100%)' }} />
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
              {(() => {
                const items = unreadConversations;

                if (items.length === 0) {
                  return <div className="brane-card-soft p-4 text-sm text-[#8C8F9A]">Nenhuma notificação por enquanto.</div>;
                }

                return items.map((msg) => {
                  const nPostId = msg?.post_id;
                  const notifPost = posts.find((p) => (p.post_id || p.id) === nPostId || getPostKey(p) === nPostId);
                  const notifImg = notifPost ? getPostImages(notifPost)[0] || "" : "";
                  const notifTitle = notifPost ? getTitle(notifPost) : "Anúncio";
                  const nSender = findName(msg) || "Usuário";
                  return (
                    <button
                      key={nPostId}
                      onClick={() => {
                        setShowNotifications(false);
                        markChatAsRead(nPostId);
                        setSelectedChat({ post_id: nPostId, sender_name: nSender, message: msg.message || "" });
                        loadChatMessages(nPostId);
                        setActiveFilter("messages");
                        fetchMessages();
                        window.history.pushState({ braneChat: true }, "", window.location.pathname);
                      }}
                      className="w-full text-left brane-card-soft p-3 hover:bg-white/[0.08] transition-colors cursor-pointer flex items-start gap-3"
                    >
                      {notifImg ? (
                        <img src={notifImg} alt="" loading="lazy" className="w-10 h-10 rounded-xl object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4A24C]/20 to-[#8A2CFF]/20 flex items-center justify-center text-[#D4A24C] shrink-0">
                          <Package size={16} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-white truncate">{notifTitle}</p>
                        <p className="text-[11px] text-[#A6A8B3] mt-0.5">
                          {nSender}: {msg.message?.slice(0, 80) || msg.content?.slice(0, 80) || "Nova mensagem"}
                        </p>
                      </div>
                    </button>
                  );
                });
              })()}
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
              <button
                onClick={async () => { await logout(); setShowSettings(false); window.location.href = "/blivre/login"; }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/[0.06] transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Sair da conta
              </button>
            </div>
          </div>
        </div>
      )}

     {composerOpen && (
   <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-start md:items-center justify-center pt-[1dvh] md:pt-0" style={{ animation: "braneFadeIn 0.2s ease" }}>
     <div className="w-[96vw] md:w-full md:max-w-md h-[calc(100dvh-1dvh-6px)] md:h-auto md:max-h-[85dvh] rounded-[28px] md:rounded-[24px] overflow-hidden flex flex-col brane-glass-mobile bg-[#050608]" style={{ animation: "braneSlideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1)" }}>
       <div className="flex items-center justify-between px-4 md:px-5 py-2.5 md:py-3 flex-shrink-0 bg-[#08060d]/95 border-b border-white/[0.04]">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-xl overflow-hidden ring-1 ring-[#D4A24C]/30">
              <img src="/logo-belivre.png" alt="B Livre" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">{editingPost ? "Editar anúncio" : "Novo anúncio"}</h2>
              <p className="text-[9px] md:text-[10px] text-[#6F7280] tracking-wide uppercase">B Livre — Anúncios</p>
            </div>
          </div>
          <button type="button" onClick={() => { setComposerOpen(false); setEditingPost(null); setUseAI(true); setGeneratedAd(null); setForm({ category: "", title: "", price: "", state: "", city: "", productCondition: "", description: "", availability: "Item único", phone: "", whatsapp: "" }); setImages([]); }}
            className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#C9CBD6] hover:bg-white/10 hover:text-white transition-all">
            <X size={16} />
          </button>
        </div>

        {!editingPost ? (
        <>
          {/* MOBILE: painel IA em etapas */}
          <div className="flex md:hidden flex-col flex-1 overflow-hidden">
            {/* Área de chat com assistente */}
            <div ref={aiChatScrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {aiChatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full px-4">
                  <svg viewBox="0 0 200 240" className="w-24 h-auto" style={{ animation: "braneFloat 3s ease-in-out infinite" }}>
                    <defs>
                      <linearGradient id="skinGradM" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FCE4C8" />
                        <stop offset="100%" stopColor="#F0CAA0" />
                      </linearGradient>
                      <linearGradient id="hairGradM" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#4A2810" />
                        <stop offset="100%" stopColor="#2D1508" />
                      </linearGradient>
                      <linearGradient id="dressGradM" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#D4A24C" />
                        <stop offset="100%" stopColor="#B8862E" />
                      </linearGradient>
                      <radialGradient id="glowM" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#D4A24C" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#D4A24C" stopOpacity="0" />
                      </radialGradient>
                    </defs>
                    <circle cx="100" cy="140" r="50" fill="url(#glowM)" />
                    <g style={{ animation: "braneTilt 4s ease-in-out infinite" }}>
                      <ellipse cx="100" cy="85" rx="32" ry="36" fill="url(#skinGradM)" />
                      <ellipse cx="100" cy="85" rx="32" ry="36" fill="none" stroke="#E8B88A" strokeWidth="0.5" opacity="0.3" />
                      <path d="M85 80 Q88 76 92 80" fill="none" stroke="#4A2810" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
                      <path d="M108 80 Q112 76 115 80" fill="none" stroke="#4A2810" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
                      <ellipse cx="92" cy="78" rx="3" ry="3.5" fill="#4A2810" opacity="0.8" />
                      <ellipse cx="108" cy="78" rx="3" ry="3.5" fill="#4A2810" opacity="0.8" />
                      <path d="M95 95 Q100 100 105 95" fill="none" stroke="#D4737A" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M68 85 Q60 60 65 50 Q70 38 90 42" fill="url(#hairGradM)" opacity="0.9" />
                      <path d="M132 85 Q140 60 135 50 Q130 38 110 42" fill="url(#hairGradM)" opacity="0.9" />
                      <path d="M72 70 Q60 45 70 35 Q80 22 100 30 Q120 22 130 35 Q140 45 128 70" fill="url(#hairGradM)" opacity="0.7" />
                      <path d="M125 55 Q135 50 138 65 Q140 75 132 85" fill="url(#hairGradM)" opacity="0.6" />
                    </g>
                    <g style={{ animation: "braneBreathe 3s ease-in-out infinite" }}>
                      <path d="M100 120 Q70 125 65 150 L60 200 L140 200 L135 150 Q130 125 100 120Z" fill="url(#dressGradM)" />
                      <path d="M100 120 Q70 125 65 150" fill="none" stroke="#C99A3E" strokeWidth="0.5" opacity="0.3" />
                      <path d="M65 150 L55 170 L60 173 L68 152" fill="#C99A3E" opacity="0.2" />
                      <path d="M135 150 L145 170 L140 173 L132 152" fill="#C99A3E" opacity="0.2" />
                    </g>
                    <g style={{ animation: "braneArmLeft 5s ease-in-out infinite", transformOrigin: "65px 135px" }}>
                      <path d="M65 130 L45 145 L40 155" fill="none" stroke="url(#skinGradM)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                    <g style={{ animation: "braneArmRight 5s ease-in-out infinite", transformOrigin: "135px 135px" }}>
                      <path d="M135 130 L155 145 L158 155" fill="none" stroke="url(#skinGradM)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                  </svg>
                  <p className="text-[13px] text-[#A6A8B3] mt-3 font-medium">Olá! 👋 Sou sua assistente virtual.</p>
                  <p className="text-[11px] text-[#6F7280] mt-1 text-center">Digite abaixo o nome, preço, cidade e descrição do seu anúncio.</p>
                </div>
              ) : (
                <>
                  {aiChatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] px-4 py-2.5 text-[13px] leading-relaxed whitespace-pre-line ${
                        msg.role === 'user'
                          ? 'bg-[#D4A24C]/20 text-white rounded-2xl rounded-br-md'
                          : 'bg-white/[0.06] text-[#C9CBD6] rounded-2xl rounded-bl-md'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Step: asking condition */}
              {aiStep === 'asking_condition' && (
                <div className="flex flex-wrap gap-2">
                  {conditionOptions.map(c => (
                    <button key={c} onClick={() => handleConditionSelect(c)}
                      className="px-5 py-3 rounded-xl bg-gradient-to-b from-[#F8E0A0] via-[#EAC871] to-[#C89A2E] text-[#161000] text-[13px] font-black hover:brightness-110 transition-all shadow-[0_0_16px_rgba(212,162,76,0.3)]"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}

              {/* Step: asking availability */}
              {aiStep === 'asking_availability' && (
                <div className="flex flex-wrap gap-2">
                  {availabilityOptions.map(a => (
                    <button key={a} onClick={() => handleAvailabilitySelect(a)}
                      className="px-5 py-3 rounded-xl bg-gradient-to-b from-[#F8E0A0] via-[#EAC871] to-[#C89A2E] text-[#161000] text-[13px] font-black hover:brightness-110 transition-all shadow-[0_0_16px_rgba(212,162,76,0.3)]"
                    >
                      {a}
                    </button>
                  ))}
                </div>
              )}

              {/* Step: asking contact */}
              {aiStep === 'asking_contact' && (
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'WhatsApp', value: 'whatsapp' },
                    { label: 'Chamada normal', value: 'phone' },
                    { label: 'Continuar sem número', value: 'skip' },
                  ].map(opt => (
                    <button key={opt.value} onClick={() => handleContactChoice(opt.value)}
                      className="px-5 py-3 rounded-xl bg-gradient-to-b from-[#F8E0A0] via-[#EAC871] to-[#C89A2E] text-[#161000] text-[13px] font-black hover:brightness-110 transition-all shadow-[0_0_16px_rgba(212,162,76,0.3)]"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Step: typing contact */}
              {aiStep === 'typing_contact' && (
                <div className="flex gap-2 items-center">
                  <input
                    value={contactInput}
                    onChange={(e) => setContactInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleContactSubmit(); }}
                    placeholder="Digite o número com DDD..."
                    className="flex-1 h-12 rounded-2xl brane-input px-4 text-[14px]"
                  />
                  <button onClick={handleContactSubmit}
                    className="shrink-0 h-12 px-4 rounded-xl bg-gradient-to-b from-[#F8E0A0] via-[#EAC871] to-[#C89A2E] text-[#161000] text-[13px] font-black hover:brightness-110 transition-all"
                  >
                    OK
                  </button>
                </div>
              )}

              {/* Step: asking photo */}
              {aiStep === 'asking_photo' && (
                <div className="bg-white/[0.06] px-4 py-3 rounded-2xl text-[13px] text-[#C9CBD6]">
                  Envie pelo menos uma foto do produto.
                </div>
              )}

              {/* Step: preview */}
              {aiStep === 'preview' && (
                <div className="brane-card-premium overflow-hidden" style={{ borderRadius: 22 }}>
                  {images.length > 0 && (
                    <div className="aspect-square bg-[#050608] overflow-hidden">
                      <img src={images[0]} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-5 space-y-3">
                    {form.category && (
                      <span className="inline-block px-3 py-1 rounded-full bg-[#D4A24C]/10 text-[#F1D28A] text-[10px] font-bold">{form.category}</span>
                    )}
                    {enhancedTitle && <h3 className="text-base font-black text-white">{enhancedTitle}</h3>}
                    {form.price && <p className="brane-gold-text font-black text-xl">R$ {form.price}</p>}
                    {(form.city || form.state) && (
                      <p className="text-[12px] text-[#A6A8B3] flex items-center gap-1">
                        <MapPin size={12} /> {[form.city, form.state].filter(Boolean).join(" - ")}
                      </p>
                    )}
                    {form.productCondition && (
                      <span className="inline-block px-3 py-1 rounded-full bg-[#8A2CFF]/10 text-[#B66DFF] text-[10px] font-bold">{form.productCondition}</span>
                    )}
                    {enhancedDesc && <p className="text-[12px] text-[#A6A8B3] leading-relaxed">{enhancedDesc}</p>}
                    {(form.phone || form.whatsapp) && (
                      <p className="text-[11px] text-[#25D366] font-medium flex items-center gap-1">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        Contato disponível
                      </p>
                    )}
                    {marketingLine && (
                      <div className="pt-2 border-t border-white/[0.06] space-y-0.5">
                        {marketingLine.split("\n").map((line, i) => (
                          <p key={i} className="text-[11px] text-[#D4A24C] leading-relaxed">{line}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom bar: input + camera + botoes */}
            <div className="flex-shrink-0 bg-[#050608] border-t border-white/[0.06]">
              {/* Input chat */}
              <div className="px-4 pt-3 pb-2">
                <div className="relative">
                  <input
                    value={mobileAiText}
                    onChange={(e) => setMobileAiText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAiFill(); }}
                    className="w-full h-12 rounded-2xl brane-input pr-12 text-[14px]"
                    placeholder="Digite os dados do anúncio..."
                  />
                  <button
                    onClick={handleAiFill}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-[#D4A24C]/20 flex items-center justify-center text-[#D4A24C] hover:bg-[#D4A24C]/30"
                  >
                    <Send size={14} />
                  </button>
                </div>
                {images.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {images.map((img, i) => (
                      <div key={i} className="relative w-10 h-10 rounded-xl overflow-hidden border border-white/10">
                        <img src={img} alt="" loading="lazy" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removeImageAt(i)}
                          className="absolute top-0 right-0 w-4 h-4 bg-black/80 text-white text-[8px] rounded-full flex items-center justify-center">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Botoes */}
              <div className="px-4 pb-3">
                {formError && (
                  <p className="text-[11px] text-red-400 font-medium text-center mb-2">{formError}</p>
                )}
                <div className="flex gap-2 items-center">
                  <label className="shrink-0 w-12 h-12 rounded-2xl border border-dashed border-white/20 flex items-center justify-center text-white/40 cursor-pointer hover:border-[#D4A24C]/40 hover:text-[#D4A24C] transition-all">
                    <Camera size={18} />
                    <input type="file" accept="image/*" className="hidden" multiple onChange={handleImage} ref={imageInputRef} />
                  </label>
                  <button
                    onClick={() => {
                      const next = emojiCycle + 1;
                      setEmojiCycle(next);
                      applyEnhancement(next);
                    }}
                    className="flex-1 h-12 rounded-xl border border-white/10 bg-white/[0.04] text-[13px] font-bold text-[#C9CBD6] hover:bg-white/[0.08] transition-all"
                  >
                    Melhorar anúncio
                  </button>
                  <button
                    onClick={handleNewMobile}
                    className="flex-1 h-12 rounded-xl border border-white/10 bg-white/[0.04] text-[13px] font-bold text-[#C9CBD6] hover:bg-white/[0.08] transition-all"
                  >
                    Novo
                  </button>
                  <button
                    onClick={async () => {
                      if (!form.title.trim() || !form.price.trim() || !(form.city.trim() || form.state.trim()) || !form.description.trim() || !form.productCondition || !form.availability || !form.category || images.length === 0) {
                        setFormError("Preencha todos os campos e adicione pelo menos 1 foto.");
                        return;
                      }
                      setFormError("");
                      const ok = await createPost();
                      if (ok) { setComposerOpen(false); setAiFilled(false); setMobileAiText(""); setAiChatMessages([]); setAiStep('greeting'); setEmojiCycle(0); setEnhancedTitle(""); setEnhancedDesc(""); setMarketingLine(""); setContactInput(""); setContactType(null); }
                    }}
                    disabled={posting || !form.title.trim() || !form.price.trim() || !(form.city.trim() || form.state.trim()) || !form.description.trim() || !form.productCondition || !form.availability || !form.category || images.length === 0}
                    className="flex-1 h-12 rounded-xl bg-gradient-to-b from-[#F8E0A0] via-[#EAC871] to-[#C89A2E] text-[#161000] text-[13px] font-black hover:brightness-110 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(212,162,76,0.25)]"
                  >
                    {posting ? "⏳ Publicando..." : "Publicar"}
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* DESKTOP/TABLET: AI Assistant */}
          <div className="hidden md:flex flex-1 min-h-0">
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
                  availability: finalData.availability || form.availability,
                  phone: finalData.phone || form.phone,
                  whatsapp: finalData.whatsapp || form.whatsapp
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
                  availability: "Item único",
                  phone: "",
                  whatsapp: ""
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
                  availability: data.availability || "Item único",
                  phone: data.phone || "",
                  whatsapp: data.whatsapp || ""
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
                  availability: ad.availability || "Item único",
                  phone: ad.phone || "",
                  whatsapp: ad.whatsapp || ""
                };
                setForm(nextForm);

                // Use the already-resized images from SocialPage state (fileToBase64 900px)
                const nextImages = (images || []).filter(Boolean).slice(0, 5);
                if (nextImages.length > 0) setImages(nextImages);

                const ok = await createPost(nextForm, nextImages.length > 0 ? nextImages : images);
                if (ok) {
                  setComposerOpen(false);
                  setGeneratedAd(null);
                }
                return ok;
              }}
              generatedAd={generatedAd}
              isGenerating={isGeneratingAd}
            />
          </div>
        </>
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
                          <img src={img} alt="" loading="lazy" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col h-[85vh] max-h-[650px] brane-modal-sidebar" style={{ background: 'linear-gradient(180deg, rgba(9,10,15,0.98), rgba(5,6,10,1))' }}>
                  <div className="flex-1 overflow-y-auto px-6 pt-6 pb-3">
                    <div className="brane-badge brane-badge-gold mb-3 inline-flex">
                      {getCategory(selectedPost) || "Outros"}
                    </div>

                    <h2 className="text-xl font-bold text-[#F7F7FA] leading-tight">
                      {getTitle(selectedPost)}
                    </h2>

                    <p className="brane-gold-text text-2xl font-black mt-3">
                      {getPrice(selectedPost)}
                    </p>

                    <div className="flex items-center gap-3 mt-3 text-sm flex-wrap">
                      <span className="flex items-center gap-1.5 text-[#A6A8B3]">
                        <MapPin size={15} />
                        {getLocation(selectedPost)}
                      </span>

                      {getCondition(selectedPost) && (
                        <span className="brane-badge brane-badge-purple">
                          {getCondition(selectedPost)}
                        </span>
                      )}

                      {selectedPost.availability && (
                        <span className="inline-block px-3 py-1 rounded-full bg-[#D4A24C]/15 text-[#EAC871] text-[10px] font-bold">
                          {selectedPost.availability}
                        </span>
                      )}
                    </div>

                    <div className="mt-5 pt-4 border-t border-[#1E2230]">
                      {(selectedPost.enhanced_description || selectedPost.description) && (
                        <p className="text-sm leading-relaxed text-[#A6A8B3] whitespace-pre-wrap">
                          {selectedPost.enhanced_description || selectedPost.description}
                        </p>
                      )}
                      {selectedPost.marketing_text && (
                        <div className={selectedPost.enhanced_description || selectedPost.description ? "mt-4 pt-3 border-t border-[#1E2230]" : ""}>
                          {selectedPost.marketing_text.split("\n").map((line, i) => (
                            <p key={i} className="text-[13px] text-[#D4A24C] leading-relaxed">{line}</p>
                          ))}
                        </div>
                      )}
                    </div>

                    {(selectedPost.phone || selectedPost.whatsapp) && (
                      <div className="mt-4">
                        {showContactModal === getPostKey(selectedPost) ? (
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#8C8F9A]">Contato do vendedor</p>
                            {selectedPost.phone && (
                              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-3">
                                <Phone size={16} className="text-[#D4A24C]" />
                                <span className="flex-1 text-sm text-white">{selectedPost.phone}</span>
                                <div className="flex gap-1">
                                  <button onClick={() => navigator.clipboard.writeText(selectedPost.phone)} className="p-2 rounded-xl bg-white/[0.06] text-[#C9CBD6] hover:bg-white/[0.1]" title="Copiar">
                                    <Copy size={14} />
                                  </button>
                                  <button onClick={() => window.location.href = "tel:" + selectedPost.phone} className="p-2 rounded-xl bg-white/[0.06] text-[#C9CBD6] hover:bg-white/[0.1]" title="Ligar">
                                    <Phone size={14} />
                                  </button>
                                </div>
                              </div>
                            )}
                            {selectedPost.whatsapp && (
                              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-3">
                                <MessageSquare size={16} className="text-[#25D366]" />
                                <span className="flex-1 text-sm text-white">{selectedPost.whatsapp}</span>
                                <div className="flex gap-1">
                                  <button onClick={() => navigator.clipboard.writeText(selectedPost.whatsapp)} className="p-2 rounded-xl bg-white/[0.06] text-[#C9CBD6] hover:bg-white/[0.1]" title="Copiar">
                                    <Copy size={14} />
                                  </button>
                                  <button onClick={() => window.open("https://wa.me/" + selectedPost.whatsapp.replace(/\D/g, ""), "_blank")} className="p-2 rounded-xl bg-white/[0.06] text-[#25D366] hover:bg-white/[0.1]" title="WhatsApp">
                                    <MessageSquare size={14} />
                                  </button>
                                </div>
                              </div>
                            )}
                            <button onClick={() => setShowContactModal(null)} className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 text-xs font-bold text-[#A6A8B3] hover:bg-white/[0.08]">
                              Voltar
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setShowContactModal(getPostKey(selectedPost))}
                            className="w-full h-11 rounded-xl bg-gradient-to-b from-[#F8E0A0] via-[#EAC871] to-[#C89A2E] text-[#161000] text-[12px] font-black hover:brightness-110 transition-all shadow-[0_0_12px rgba(212,162,76,0.2)]"
                          >
                            Ver contato
                          </button>
                        )}
                      </div>
                    )}

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
                    {showContactModal === getPostKey(selectedPost) ? (
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#8C8F9A]">Contato do vendedor</p>
                        {selectedPost.phone && (
                          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-3">
                            <Phone size={16} className="text-[#D4A24C]" />
                            <span className="flex-1 text-sm text-white">{selectedPost.phone}</span>
                            <div className="flex gap-1">
                              <button onClick={() => navigator.clipboard.writeText(selectedPost.phone)} className="p-2 rounded-xl bg-white/[0.06] text-[#C9CBD6] hover:bg-white/[0.1]" title="Copiar">
                                <Copy size={14} />
                              </button>
                              <button onClick={() => window.location.href = "tel:" + selectedPost.phone} className="p-2 rounded-xl bg-white/[0.06] text-[#C9CBD6] hover:bg-white/[0.1]" title="Ligar">
                                <Phone size={14} />
                              </button>
                            </div>
                          </div>
                        )}
                        {selectedPost.whatsapp && (
                          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-3">
                            <MessageSquare size={16} className="text-[#25D366]" />
                            <span className="flex-1 text-sm text-white">{selectedPost.whatsapp}</span>
                            <div className="flex gap-1">
                              <button onClick={() => navigator.clipboard.writeText(selectedPost.whatsapp)} className="p-2 rounded-xl bg-white/[0.06] text-[#C9CBD6] hover:bg-white/[0.1]" title="Copiar">
                                <Copy size={14} />
                              </button>
                              <button onClick={() => window.open("https://wa.me/" + selectedPost.whatsapp.replace(/\D/g, ""), "_blank")} className="p-2 rounded-xl bg-white/[0.06] text-[#25D366] hover:bg-white/[0.1]" title="WhatsApp">
                                <MessageSquare size={14} />
                              </button>
                            </div>
                          </div>
                        )}
                        {!selectedPost.phone && !selectedPost.whatsapp && (
                          <p className="text-sm text-[#6F7280]">Nenhum contato disponível.</p>
                        )}
                        <button onClick={() => setShowContactModal(null)} className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 text-xs font-bold text-[#A6A8B3] hover:bg-white/[0.08]">
                          Voltar
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                            className="w-full h-14 rounded-2xl brane-input pr-14 text-[14px]"
                            placeholder="Esse anúncio ainda está disponível?"
                          />
                          <button
                            onClick={sendMessage}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-xl bg-[#D4A24C]/20 flex items-center justify-center text-[#D4A24C] hover:bg-[#D4A24C]/30"
                          >
                            <Send size={18} />
                          </button>
                        </div>
                      </div>
                    )}
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
              <div className="w-11 h-11 rounded-2xl overflow-hidden ring-1 ring-[#D4A24C]/40">
                <img src="/logo-belivre.png" alt="B Livre" className="w-full h-full object-cover" />
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
                    name: currentUser?.name || "",
                    city: currentUser?.city || "",
                    state: currentUser?.state || "",
                    avatar: currentUser?.avatar || currentUser?.photo || currentUser?.picture || ""
                  });
                  setShowSettings(true);
                }}
                className="w-9 h-9 rounded-full bg-gradient-to-br from-[#D4A24C] via-[#F1D28A] to-[#8A2CFF] p-[1.5px] shrink-0 hover:brightness-110 transition-all shadow-[0_0_12px_rgba(212,162,76,0.2)]"
              >
                <div className="w-full h-full rounded-full bg-[#0B0D12] overflow-hidden flex items-center justify-center">
                  {(currentUser?.avatar || currentUser?.photo || currentUser?.picture) ? (
                    <img
                      src={currentUser?.avatar || currentUser?.photo || currentUser?.picture}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[#D4A24C] font-black text-[11px]">
                      {(currentUser?.name || "B")[0].toUpperCase()}
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
                    name: currentUser?.name || "",
                    city: currentUser?.city || "",
                    state: currentUser?.state || "",
                    avatar: currentUser?.avatar || currentUser?.photo || ""
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
          <button
            onClick={() => {
              if (!requireAuth()) return;
              setShowNotifications(true);
              axios.put(API + "/notifications/read-all", {}, { headers: authHeaders }).catch(() => {});
            }}
            className="relative w-9 h-9 rounded-xl border border-white/10 bg-white/[0.04] flex items-center justify-center text-[#D4A24C] hover:bg-white/[0.08] transition-colors shrink-0"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-[#D4A24C] text-[9px] font-black text-black flex items-center justify-center shadow-[0_0_6px_rgba(212,162,76,0.5)]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
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
                        name: currentUser?.name || "",
                        city: currentUser?.city || "",
                        state: currentUser?.state || "",
                        avatar: currentUser?.avatar || currentUser?.photo || currentUser?.picture || ""
                      });
                      setShowSettings(true);
                    }}
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4A24C] via-[#F1D28A] to-[#8A2CFF] p-[2px] shrink-0 hover:brightness-110 transition-all shadow-[0_0_16px_rgba(212,162,76,0.25)]"
                  >
                    <div className="w-full h-full rounded-full bg-[#0B0D12] overflow-hidden flex items-center justify-center">
                      {(currentUser?.avatar || currentUser?.photo || currentUser?.picture) ? (
                        <img
                          src={currentUser?.avatar || currentUser?.photo || currentUser?.picture}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[#D4A24C] font-black text-sm">
                          {(currentUser?.name || "B")[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                  </button>
                  <div className="min-w-0">
                    <h3 className="font-black text-lg flex items-center gap-2 brane-gold-text truncate">
                      {currentUser && currentUser.name ? currentUser.name : "Usuário B Livre"}
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
                        if (window.innerWidth < 768) window.history.pushState({ braneTab: value }, "");
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
                        Chat com {findName(selectedChat) || "Usuário"}
                      </h2>
                      <button
                        onClick={closeChat}
                        className="w-8 h-8 brane-btn-gold flex items-center justify-center"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="h-[400px] overflow-y-auto mb-4 space-y-3" ref={chatScrollRef}>
                      {chatMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center text-[#6F7280]">
                          <MessageSquare className="w-10 h-10 text-[#1E2230] mb-2" />
                          <p className="text-sm">Nenhuma mensagem ainda.</p>
                        </div>
                      ) : (
                        chatMessages.map((msg) => (
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
                              {!msg.isMine && (
                                <p className="text-[10px] font-semibold mb-1 text-[#D4A24C]">{msg.sender}</p>
                              )}
                              <p className="text-sm">{msg.message}</p>
                              <p className={`text-[9px] mt-1 ${msg.isMine ? "text-black/50" : "text-white/40"}`}>
                                {msg.timestamp.toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
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

                    {(() => {
                      // Build conversations from notifications (primary source = mesma fonte das notificações)
                      const notifGrouped = {};
                      (notifications || []).forEach((n) => {
                        if (n.type !== "social_message") return;
                        const pid = n.data?.post_id;
                        if (!pid) return;
                        const existing = notifGrouped[pid];
                        if (!existing) {
                          notifGrouped[pid] = { post_id: pid, lastMsg: null, otherName: findName(n.data) || findName(n) || "Usuário", createdAt: n.created_at || "" };
                        }
                        if (n.created_at > (notifGrouped[pid].createdAt || "")) {
                          notifGrouped[pid].lastMsg = { message: n.message, created_at: n.created_at };
                          notifGrouped[pid].otherName = findName(n.data) || findName(n) || notifGrouped[pid].otherName;
                          notifGrouped[pid].createdAt = n.created_at;
                        }
                      });
                      // Fallback: also use messages for posts without notifications (ex: sender's own messages)
                      (messages || []).forEach((m) => {
                        const pid = m.post_id;
                        if (!pid || notifGrouped[pid]) return;
                        let otherName = findName(m) || "Usuário";
                        if (getMessageSenderId(m) === getCurrentUserId()) {
                          const otherMsg = (messages || []).find((msg) => msg.post_id === pid && getMessageSenderId(msg) !== getCurrentUserId());
                          if (otherMsg) otherName = findName(otherMsg) || "Usuário";
                        }
                        notifGrouped[pid] = {
                          post_id: pid,
                          lastMsg: { message: m.message, created_at: m.created_at },
                          otherName,
                          createdAt: m.created_at || ""
                        };
                      });
                      const conversations = Object.values(notifGrouped);
                      conversations.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
                      if (conversations.length === 0) {
                        return <p className="text-sm text-[#8C8F9A]">Nenhuma mensagem por enquanto.</p>;
                      }
                      return (
                        <div className="space-y-3">
                          {conversations.map((conv, i) => {
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
                                  <img src={convImg} alt="" loading="lazy" className="w-11 h-11 rounded-xl object-cover shrink-0" />
                                ) : (
                                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#D4A24C]/20 to-[#8A2CFF]/20 flex items-center justify-center text-[#D4A24C] shrink-0">
                                    <Package size={18} />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-semibold text-white truncate">{convTitle}</p>
                                    <span className="text-[10px] text-[#6F7280] shrink-0">{conv.createdAt ? new Date(conv.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : ""}</span>
                                  </div>
                                  <p className="text-xs text-[#D4A24C] mt-0.5 font-medium">{conv.otherName}</p>
                                  <p className="text-[11px] text-[#A6A8B3] mt-0.5 truncate">{conv.lastMsg?.message || "Clique para ver a conversa"}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}
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
                      >
                        <button
                          type="button"
                          onClick={() => openPost(post)}
                          className="w-full text-left"
                        >
                          <div className="relative aspect-square bg-[#050608] overflow-hidden rounded-t-[22px]">
                            {getCoverImage(post) ? (
                              <img
                                src={getCoverImage(post)}
                                alt="Anúncio"
                                loading="lazy"
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
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

      {/* Mobile FAB anunciar (only on Início/feed) */}
      {(activeFilter === "all" && !selectedPost && !showNotifications && !showSettings && !composerOpen) && (
          <button className="brane-fab" onClick={() => { if (!requireAuth()) return; setComposerOpen(true); }}>
          +
        </button>
      )}

      {/* Mobile bottom navigation */}
      <nav className="brane-bottom-nav" style={composerOpen ? { display: 'none' } : {}}>
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
                  name: currentUser?.name || "",
                  city: currentUser?.city || "",
                  state: currentUser?.state || "",
                  avatar: currentUser?.avatar || currentUser?.photo || ""
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
            className={"relative " + (value === (activeFilter === "all" ? "all" : activeFilter) ? "brane-bottom-active" : "")}
          >
            <Icon size={20} />
            <span>{label}</span>
            {value === "messages" && unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
                {unreadCount}
              </span>
            )}
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
