import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Image, Send, User, Bell, Search, MessageSquare,
  Settings, BadgeCheck, Package, MapPin, Tags,
  Heart, X, ChevronLeft, ChevronRight, Globe, Camera, Plus,
  Phone, LogOut, ShoppingBag, Flag
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import ProductImageZoom from "../components/ProductImageZoom";
import AIAssistantPanelSocial from "../components/AIAssistantPanelSocial";
import BLivreAuthModal from "../components/BLivreAuthModal";
import PWAInstallButton from "../components/PWAInstallButton";
import { BRANE_LOGO_URL } from "../components/Navbar";
const PAGE_SIZE = 24;

const categories = ["Celulares", "Veículos", "Imóveis", "Casa e móveis", "Moda", "Serviços", "Outros"];

const CATEGORIES = [
  { id: "all", label: "Todas" },
  { id: "Celulares", label: "Celulares" },
  { id: "Veículos", label: "Veículos" },
  { id: "Imóveis", label: "Imóveis" },
  { id: "Casa e móveis", label: "Casa e móveis" },
  { id: "Moda", label: "Moda" },
  { id: "Serviços", label: "Serviços" },
  { id: "Outros", label: "Outros" }
];

const states = [
  "Acre", "Alagoas", "Amapá", "Amazonas", "Bahia", "Ceará", "Distrito Federal",
  "Espírito Santo", "Goiás", "Maranhão", "Mato Grosso", "Mato Grosso do Sul",
  "Minas Gerais", "Pará", "Paraíba", "Paraná", "Pernambuco", "Piauí",
  "Rio de Janeiro", "Rio Grande do Norte", "Rio Grande do Sul", "Rondônia",
  "Roraima", "Santa Catarina", "São Paulo", "Sergipe", "Tocantins"
];

const productConditions = ["Novo", "Usado", "Em bom estado", "Com detalhes", "Para retirada de peças"];

export default function SocialPage() {
  const { user, token, API, setUser } = useAuth();
  const navigate = useNavigate();

  const authHeaders = token
    ? { Authorization: "Bearer " + token }
    : {};

  const imageInputRef = useRef(null);
  const avatarInputRef = useRef(null);
  const loadMoreRef = useRef(null);
  const scrollFrameRef = useRef(null);
  const mainScrollRef = useRef(null);
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
  const [activeCategory, setActiveCategory] = useState("all");
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

  const [pendingAction, setPendingAction] = useState(null);
  const requireAuth = (action = null) => {
    if (!user) {
      setPendingAction(action);
      setShowAuthModal(true);
      return false;
    }
    return true;
  };

  // Estado para denúncias
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState(null); // { tipo, post_id, reported_user_id }
  const [reportMotivo, setReportMotivo] = useState("");
  const [reportDescricao, setReportDescricao] = useState("");
  const [sendingReport, setSendingReport] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactData, setContactData] = useState(null);
  // Mobile: caixinha de mensagem rápida para suporte
  const [showMobileSupport, setShowMobileSupport] = useState(false);
  // Modal de suporte no settings
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportMsg, setSupportMsg] = useState("");
  const [sendingSupport, setSendingSupport] = useState(false);
  const sendSupportMsg = async () => {
    if (!supportMsg.trim()) return;
    if (!requireAuth()) return;
    setSendingSupport(true);
    try {
      await axios.post(`${API}/support`, { subject: "Suporte B Livre", message: supportMsg }, { headers: authHeaders });
      setSupportMsg("");
      setShowSupportModal(false);
      alert("Mensagem enviada ao suporte!");
    } catch { alert("Erro ao enviar. Tente novamente."); }
    finally { setSendingSupport(false); }
  };
  const [mobileSupportMsg, setMobileSupportMsg] = useState("");
  const [sendingMobileSupport, setSendingMobileSupport] = useState(false);
  const sendMobileSupportMsg = async () => {
    if (!mobileSupportMsg.trim()) return;
    if (!requireAuth("suporte")) return;
    setSendingMobileSupport(true);
    try {
      await axios.post(`${API}/support`, { subject: "Suporte B Livre", message: mobileSupportMsg }, { headers: authHeaders });
      setMobileSupportMsg("");
      setShowMobileSupport(false);
      alert("Mensagem enviada ao suporte!");
    } catch { alert("Erro ao enviar. Tente novamente."); }
    finally { setSendingMobileSupport(false); }
  };

  const REPORT_MOTIVOS = [
    "Produto falso ou golpe",
    "Conteúdo ofensivo",
    "Preço enganoso",
    "Vendedor desrespeitoso",
    "Produto proibido",
    "Outro"
  ];

  const openReportModal = (tipo, post_id = null, reported_user_id = null) => {
    if (!requireAuth()) return;
    if (tipo === "contato") {
      setContactData(post_id); // post_id aqui contém os dados de contato
      setShowContactModal(true);
      return;
    }
    setReportTarget({ tipo, post_id, reported_user_id });
    setReportMotivo("");
    setReportDescricao("");
    setShowReportModal(true);
  };

  const sendReport = async () => {
    if (!reportMotivo) { alert("Selecione um motivo."); return; }
    try {
      setSendingReport(true);
      await axios.post(
        `${API}/social/reports`,
        { ...reportTarget, motivo: reportMotivo, descricao: reportDescricao },
        { headers: authHeaders }
      );
      setShowReportModal(false);
      alert("Denúncia enviada. Obrigado por ajudar a manter a comunidade segura.");
    } catch (err) {
      console.error(err);
      alert("Erro ao enviar denúncia.");
    } finally {
      setSendingReport(false);
    }
  };

  const { logout } = useAuth();

  const [profileForm, setProfileForm] = useState({
    name: "",
    city: "",
    state: "",
    picture: "",
    phone: "",
    bio: ""
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
    contact_phone: "",
    contact_whatsapp: ""
  });

  const getPostKey = (post) => String(post?.post_id || post?.id || post?.created_at || JSON.stringify(post));

  const getPostImages = (post) => {
    if (!post || !post.image) return [];

    if (Array.isArray(post.image)) return post.image.filter(Boolean);

    try {
      const parsed = typeof post.image === 'string' ? JSON.parse(post.image) : post.image;
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

  // Faz upload real do arquivo e retorna URL. Se falhar, usa base64 como fallback.
  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      const img = new window.Image();
      reader.onload = () => { img.src = reader.result; };
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

  // Upload real: envia o arquivo para /api/upload e retorna a URL
  // O backend retorna { imageUrl, thumbnailUrl, filename, ... }
  const uploadFileToServer = async (file) => {
    if (!token) return null;
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await axios.post(`${API}/upload`, fd, {
        headers: { ...authHeaders, "Content-Type": "multipart/form-data" }
      });
      // Novo formato: imageUrl (full) e thumbnailUrl (leve)
      if (res.data?.imageUrl) return res.data.imageUrl;
      // Legado: path
      const path = res.data?.path;
      if (path) return `${API}/files/${path}`;
      return null;
    } catch (err) {
      console.warn("Upload falhou, usando base64:", err);
      return null;
    }
  };

  // Converte arquivo para URL (upload real) ou base64 como fallback
  const fileToUrl = async (file) => {
    const url = await uploadFileToServer(file);
    if (url) return url;
    return fileToBase64(file);
  };

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
          axios.get(`${API}/social/favorites`, { headers: authHeaders }),
          axios.get(`${API}/social/stats`, { headers: authHeaders }),
          axios.get(`${API}/notifications`, { headers: authHeaders }),
          axios.get(`${API}/social/messages`, { headers: authHeaders })
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
        `${API}/social/posts?limit=${PAGE_SIZE}&page=${pageNumber}`
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
      console.error("Erro ao carregar posts:", error);
      if (!append) setPosts([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadPosts(1, false);
    loadSocialData();

    const handleScroll = () => {
      if (window.innerWidth < 768) return;

      if (scrollFrameRef.current) cancelAnimationFrame(scrollFrameRef.current);

      scrollFrameRef.current = requestAnimationFrame(() => {
        const scrollY = window.scrollY || window.pageYOffset || 0;
        // Histerese: expand > 90, collapse < 20 (sem flicker)
        let next = expandedRef.current;
        if (!expandedRef.current && scrollY > 90) next = true;
        else if (expandedRef.current && scrollY < 20) next = false;

        if (next !== expandedRef.current) {
          expandedRef.current = next;
          setExpanded(next);
        }
      });
    };

    // Scroll natural da WINDOW (sem nested scroll = sem travamento)
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollFrameRef.current) cancelAnimationFrame(scrollFrameRef.current);
    };
  }, [token]);

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

    const urlList = await Promise.all(
      selectedFiles.map((file) => fileToUrl(file))
    );

    setImages((prev) => [...prev, ...urlList].slice(0, 5));

    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleAvatarImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await fileToUrl(file);
    setProfileForm((prev) => ({ ...prev, picture: url }));

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
    const lines = [
      sourceForm.title,
      sourceForm.price ? "R$ " + sourceForm.price : "",
      sourceForm.category,
      sourceForm.productCondition,
      sourceForm.city || sourceForm.state ? [sourceForm.city, sourceForm.state].filter(Boolean).join(" - ") : "",
      sourceForm.availability,
      sourceForm.description
    ];
    return lines.filter(line => line !== undefined && line !== null && String(line).trim() !== "").join("\n");
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
        `${API}/social/posts`,
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
          availability: sourceForm.availability,
          contact_phone: sourceForm.contact_phone || "",
          contact_whatsapp: sourceForm.contact_whatsapp || ""
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
        `${API}/social/posts/${key}`,
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

  const [sendingMessage, setSendingMessage] = useState(false);

  const sendMessage = async () => {
    if (!selectedPost) return;
    if (!requireAuth()) return;
    const text = String(message || "").trim();
    if (!text) {
      toast.error("Digite uma mensagem antes de enviar.");
      return;
    }

    setSendingMessage(true);
    try {
      await axios.post(
        `${API}/messages`,
        {
          recipient_id: selectedPost.user_id || "",
          product_id: getPostKey(selectedPost),
          message: text
        },
        { headers: authHeaders }
      );

      toast.success("Mensagem enviada!");
      setMessage("Esse anúncio ainda está disponível?");
    } catch (error) {
      console.error("sendMessage error:", error);
      const detail = error?.response?.data?.detail || "Erro ao enviar mensagem.";
      toast.error(typeof detail === "string" ? detail : "Erro ao enviar mensagem.");
    } finally {
      setSendingMessage(false);
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
    if (activeFilter === "messages") return true;
    if (selectedCategory && category.toLowerCase() !== selectedCategory.toLowerCase()) return false;

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
        `${API}/social/favorites/${key}`,
        {},
        { headers: authHeaders }
      );

      setFavorites((prev) => {
        if (res.data.favorited) return [...prev, key];
        return prev.filter((item) => item !== key);
      });
      loadSocialData();
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
        `${API}/users/profile-extended`,
        profileForm,
        { headers: authHeaders }
      );
      
      if (typeof setUser === "function") {
        setUser(prev => ({ ...prev, ...profileForm }));
      }

      setShowSettings(false);
      alert("Perfil atualizado.");
    } catch (error) {
      console.error(error);
      alert("Erro ao atualizar perfil.");
    } finally {
      setSavingProfile(false);
    }
  };

  const openChat = (chat) => {
    setSelectedChat(chat);
    setChatMessages([
      {
        id: 1,
        sender: chat.sender_name || chat.name || "Usuário",
        message: chat.message || chat.content,
        timestamp: new Date(chat.created_at || Date.now())
      }
    ]);
  };

  const closeChat = () => {
    setSelectedChat(null);
    setChatMessages([]);
    setChatMessage("");
  };

  const sendChatMessage = async () => {
    if (!chatMessage.trim() || !selectedChat) return;

    const newMessage = {
      id: chatMessages.length + 1,
      sender: user?.name || "Você",
      message: chatMessage,
      timestamp: new Date()
    };

    setChatMessages((prev) => [...prev, newMessage]);

    try {
      await axios.post(
        `${API}/social/messages`,
        {
          post_id: selectedChat.post_id,
          message: chatMessage
        },
        { headers: authHeaders }
      );

      setChatMessage("");
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
      await axios.delete(`${API}/social/posts/${key}`, {
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
    <div
      className="rounded-[20px] overflow-hidden bg-white border border-[#E5E7EB]"
      aria-hidden="true"
      style={{ pointerEvents: 'none' }}
    >
      <div
        className="aspect-square"
        style={{
          background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
          backgroundSize: '200% 100%',
          animation: 'brane-skeleton-shimmer 1.4s infinite linear'
        }}
      />
      <div className="p-3 bg-white space-y-3">
        <div style={{
          height: '14px', borderRadius: '6px', width: '80%',
          background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
          backgroundSize: '200% 100%',
          animation: 'brane-skeleton-shimmer 1.4s 0.1s infinite linear'
        }} />
        <div style={{
          height: '18px', borderRadius: '6px', width: '55%',
          background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
          backgroundSize: '200% 100%',
          animation: 'brane-skeleton-shimmer 1.4s 0.2s infinite linear'
        }} />
        <div style={{
          height: '11px', borderRadius: '6px', width: '65%',
          background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
          backgroundSize: '200% 100%',
          animation: 'brane-skeleton-shimmer 1.4s 0.3s infinite linear'
        }} />
        <div style={{
          height: '32px', borderRadius: '12px', width: '100%',
          background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
          backgroundSize: '200% 100%',
          animation: 'brane-skeleton-shimmer 1.4s 0.4s infinite linear'
        }} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen text-white relative bg-[#040407]">
      <style>
        {`
          @keyframes brane-skeleton-shimmer {
            0%   { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }

          @keyframes blivreSlideIn {
            from { opacity: 0; transform: translateX(180px) scale(0.92); }
            to { opacity: 1; transform: translateX(0) scale(1); }
          }

          .blivre-header {
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            transform: translateZ(0);
            contain: layout paint style;
          }
          @media (max-width: 768px) {
            .blivre-header {
              backdrop-filter: none !important;
              -webkit-backdrop-filter: none !important;
              background: #050508 !important;
            }
          }

          .blivre-shell {
            display: grid !important;
            grid-template-columns: 235px minmax(0, 1fr) 255px;
            gap: 16px;
            transition: grid-template-columns 320ms cubic-bezier(0.22, 1, 0.36, 1);
            will-change: grid-template-columns;
          }

          /* Asides com position: sticky — scroll fluido SEM nested scroll */
          .blivre-side {
            position: sticky;
            top: 92px;
            align-self: start;
            max-height: calc(100vh - 100px);
            overflow-y: auto;
            overscroll-behavior: contain;
            scrollbar-width: thin;
            scrollbar-color: rgba(212,162,76,0.25) transparent;
            transition: padding 320ms cubic-bezier(0.22, 1, 0.36, 1),
                        opacity 220ms ease;
            will-change: padding, opacity;
          }
          .blivre-side::-webkit-scrollbar { width: 6px; }
          .blivre-side::-webkit-scrollbar-track { background: transparent; }
          .blivre-side::-webkit-scrollbar-thumb {
            background: rgba(212,162,76,0.2);
            border-radius: 6px;
          }

          .blivre-main {
            min-width: 0;
            min-height: calc(100vh - 92px);
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

          .blivre-gold-text {
            background: linear-gradient(135deg, #8F5F12 0%, #C88A1A 18%, #FFD36A 38%, #FFF1A8 50%, #D89B25 68%, #9F6811 100%);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            -webkit-text-fill-color: transparent;
            filter: drop-shadow(0 4px 10px rgba(200,138,26,0.28));
          }

          /* ============================================
             DOURADO 3D PREMIUM REALISTA - Logo B Livre
             Baseado na análise da logo real
             Fire glow + profundidade + brilho intenso
             ============================================ */
          
          .blivre-gold-button {
            /* Gradiente complexo baseado na logo */
            background: linear-gradient(135deg, 
              #5A3A00 0%,     /* Sombra profunda bronze */
              #8A4A00 8%,     /* Bronze escuro */
              #B87333 18%,    /* Ouro rico */
              #D48A00 30%,    /* Ouro saturado */
              #E5A000 42%,    /* Ouro brilhante */
              #FFC107 50%,    /* Ouro vibrante */
              #FFEC8B 58%,    /* Highlight dourado */
              #FFF3BF 62%,    /* Quase branco */
              #FFC107 70%,    /* Ouro vibrante */
              #E5A000 82%,    /* Ouro brilhante */
              #8A4A00 100%    /* Bronze escuro fim */
            );
            
            /* Múltiplas camadas de sombra para glow intenso */
            box-shadow: 
              /* Glow interno superior (brilho metálico) */
              inset 0 3px 8px rgba(255, 255, 255, 0.65),
              inset 0 1px 3px rgba(255, 243, 191, 0.9),
              /* Sombra interna inferior (profundidade 3D) */
              inset 0 -8px 16px rgba(58, 33, 0, 0.75),
              inset 0 -3px 6px rgba(90, 58, 0, 0.6),
              /* Fire glow externo - camada 1 (mais próxima) */
              0 0 10px 2px rgba(255, 193, 7, 0.9),
              0 0 15px 4px rgba(229, 160, 0, 0.8),
              /* Fire glow externo - camada 2 (média) */
              0 0 25px 6px rgba(255, 193, 7, 0.7),
              0 0 35px 10px rgba(255, 236, 139, 0.5),
              /* Fire glow externo - camada 3 (mais distante) */
              0 0 50px 15px rgba(255, 170, 20, 0.4),
              0 0 70px 25px rgba(255, 185, 45, 0.25),
              /* Sombra de elevação */
              0 12px 40px rgba(138, 79, 0, 0.6),
              0 6px 20px rgba(90, 58, 0, 0.5);
            
            /* Borda iluminada */
            border: 2px solid rgba(255, 236, 139, 0.7);
            position: relative;
            overflow: hidden;
            color: #000 !important;
            font-weight: 900;
            
            /* Text shadow complexo para profundidade */
            text-shadow: 
              0 1px 2px rgba(255, 243, 191, 0.9),
              0 2px 4px rgba(255, 236, 139, 0.7),
              0 -1px 2px rgba(58, 33, 0, 0.7),
              0 0 10px rgba(255, 215, 0, 0.5);
            
            transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
            filter: brightness(1.08) contrast(1.12) saturate(1.15);
          }
          
          /* Brilho deslizante metálico */
          .blivre-gold-button::before {
            content: '';
            position: absolute;
            top: -60%;
            left: -80%;
            width: 60%;
            height: 220%;
            background: linear-gradient(
              45deg, 
              transparent 0%, 
              rgba(255, 255, 255, 0.4) 40%,
              rgba(255, 243, 191, 0.85) 48%,
              rgba(255, 255, 255, 0.95) 52%,
              rgba(255, 243, 191, 0.85) 56%,
              rgba(255, 255, 255, 0.4) 65%,
              transparent 100%
            );
            transform: rotate(25deg);
            transition: left 0.8s cubic-bezier(0.4, 0, 0.2, 1);
            pointer-events: none;
            z-index: 2;
          }
          
          /* Fire glow estático (aura dourada) — sem animação infinita por performance */
          .blivre-gold-button::after {
            content: '';
            position: absolute;
            inset: -6px;
            border-radius: inherit;
            background: radial-gradient(
              ellipse at center,
              rgba(255, 193, 7, 0.6) 0%,
              rgba(255, 170, 20, 0.45) 25%,
              rgba(255, 185, 45, 0.3) 50%,
              rgba(255, 215, 0, 0.15) 75%,
              transparent 100%
            );
            opacity: 0.85;
            pointer-events: none;
            z-index: -1;
            filter: blur(8px);
          }
          
          @keyframes fireGlowPulse {
            0%, 100% { 
              opacity: 0.7; 
              transform: scale(1);
              filter: blur(8px);
            }
            50% { 
              opacity: 1; 
              transform: scale(1.08);
              filter: blur(12px);
            }
          }
          
          /* Hover: Intensifica TUDO dramaticamente */
          .blivre-gold-button:hover {
            background: linear-gradient(135deg, 
              #6A4600 0%, 
              #9A5A00 8%, 
              #C89343 18%, 
              #E49A10 30%, 
              #F5B010 42%, 
              #FFD717 50%, 
              #FFF69F 58%, 
              #FFFBDF 62%, 
              #FFD717 70%, 
              #F5B010 82%, 
              #9A5A00 100%
            );
            
            transform: translateY(-4px) scale(1.04);
            
            box-shadow: 
              inset 0 4px 10px rgba(255, 255, 255, 0.75),
              inset 0 2px 5px rgba(255, 251, 223, 1),
              inset 0 -10px 20px rgba(58, 33, 0, 0.8),
              inset 0 -4px 8px rgba(90, 58, 0, 0.7),
              0 0 15px 4px rgba(255, 193, 7, 1),
              0 0 25px 8px rgba(229, 160, 0, 0.9),
              0 0 40px 12px rgba(255, 193, 7, 0.8),
              0 0 60px 20px rgba(255, 236, 139, 0.65),
              0 0 80px 30px rgba(255, 170, 20, 0.5),
              0 0 110px 45px rgba(255, 185, 45, 0.35),
              0 16px 56px rgba(138, 79, 0, 0.7),
              0 8px 28px rgba(90, 58, 0, 0.6);
            
            border-color: rgba(255, 246, 159, 0.9);
            filter: brightness(1.2) contrast(1.18) saturate(1.25);
          }
          
          .blivre-gold-button:hover::before {
            left: 140%;
          }
          
          .blivre-gold-button:hover::after {
            animation: fireGlowIntense 1.8s ease-in-out infinite;
          }
          
          @keyframes fireGlowIntense {
            0%, 100% { 
              opacity: 0.9; 
              transform: scale(1.08);
              filter: blur(12px);
            }
            50% { 
              opacity: 1; 
              transform: scale(1.2);
              filter: blur(16px);
            }
          }
          
          /* Active: Pressão com feedback visual */
          .blivre-gold-button:active {
            transform: translateY(-1px) scale(0.99);
            box-shadow: 
              inset 0 3px 6px rgba(255, 255, 255, 0.6),
              inset 0 -6px 12px rgba(58, 33, 0, 0.75),
              0 0 12px 3px rgba(255, 193, 7, 0.8),
              0 0 20px 6px rgba(229, 160, 0, 0.7),
              0 0 35px 10px rgba(255, 170, 20, 0.4),
              0 6px 24px rgba(138, 79, 0, 0.5);
            filter: brightness(1.05) contrast(1.1) saturate(1.1);
          }
          
          /* ============================================
             PREÇOS COM DOURADO 3D + GLOW ANIMADO
             ============================================ */
          
          .blivre-price-gold {
            /* Gradiente baseado na logo */
            background: linear-gradient(135deg, 
              #5A3A00 0%, 
              #8A4A00 10%, 
              #B87333 22%, 
              #D48A00 35%, 
              #E5A000 45%, 
              #FFC107 52%, 
              #FFEC8B 58%, 
              #FFF3BF 62%, 
              #FFC107 68%, 
              #E5A000 78%, 
              #8A4A00 100%
            );
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            
            /* Fire glow estático nos preços (sem animação infinita) */
            filter: 
              drop-shadow(0 2px 4px rgba(138, 79, 0, 0.7))
              drop-shadow(0 0 8px rgba(255, 193, 7, 0.55))
              drop-shadow(0 0 16px rgba(255, 170, 20, 0.4));
            
            font-weight: 900;
            position: relative;
          }

          /* Layout Desktop - Estado Expandido (laterais recolhidas) */
          .blivre-shell-expanded {
            grid-template-columns: 70px minmax(0, 1fr) 70px !important;
          }

          .blivre-side-left-collapsed,
          .blivre-side-right-collapsed {
            opacity: 1 !important;
          }

          .blivre-grid,
          .blivre-grid-focused {
            grid-template-columns: repeat(auto-fill, minmax(185px, 1fr)) !important;
            gap: 16px !important;
            transition: all 0.3s ease;
          }

          .blivre-grid-expanded {
            grid-template-columns: repeat(5, 1fr) !important;
            gap: 16px !important;
          }

          /* Layout Mobile Profissional (Amazon/Shopee Style) */
          @media (max-width: 768px) {
            .blivre-shell {
              grid-template-columns: 1fr !important;
              gap: 0 !important;
              padding: 0 !important;
            }

            .blivre-side {
              display: none !important;
            }

            .blivre-grid,
            .blivre-grid-focused {
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 8px !important;
              padding: 8px !important;
            }

            /* Ajuste para celulares maiores */
            @media (min-width: 481px) {
              .blivre-grid,
              .blivre-grid-focused {
                grid-template-columns: repeat(3, 1fr) !important;
              }
            }
          }

          @media (max-width: 480px) {
            .blivre-grid,
            .blivre-grid-focused {
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 6px !important;
              padding: 6px !important;
            }
          }

          /* Estilo para o carrossel de categorias mobile */
          .categories-carousel {
            display: none;
          }
          
          @media (max-width: 768px) {
            .categories-carousel {
              display: flex;
              overflow-x: auto;
              scroll-behavior: smooth;
              -webkit-overflow-scrolling: touch;
              gap: 8px;
              padding: 12px 8px;
              scrollbar-width: none;
            }
            .categories-carousel::-webkit-scrollbar {
              display: none;
            }

            /* PERFORMANCE MOBILE/TABLET — simplificar gold para evitar lag */
            .blivre-gold-button,
            .gold-premium-3d,
            .brane-btn-gold {
              box-shadow:
                inset 0 2px 4px rgba(255, 255, 255, 0.45),
                inset 0 -4px 8px rgba(58, 33, 0, 0.55),
                0 0 8px rgba(255, 193, 7, 0.5),
                0 4px 14px rgba(138, 79, 0, 0.4) !important;
              filter: none !important;
              animation: none !important;
              transition: none !important;
            }
            /* Remover shimmer e glow pulsante caros em mobile */
            .blivre-gold-button::before,
            .blivre-gold-button::after,
            .gold-premium-3d::before,
            .gold-premium-3d::after,
            .brane-btn-gold::before,
            .brane-btn-gold::after {
              display: none !important;
              content: none !important;
            }
            .blivre-gold-button:hover,
            .gold-premium-3d:hover,
            .brane-btn-gold:hover {
              transform: none !important;
            }
            /* Preços: drop-shadow mais barato */
            .blivre-price-gold,
            .gold-text-premium,
            .brane-gold-text,
            .theme-aware-price {
              animation: none !important;
              filter: drop-shadow(0 1px 2px rgba(138, 79, 0, 0.6)) !important;
            }
            /* Cards: remover transform+shadow caros no hover mobile */
            .blivre-product-card {
              transition: none !important;
              transform: none !important;
              will-change: auto !important;
              contain: content;
            }
            .blivre-product-card:hover {
              transform: none !important;
            }
            /* Backdrop-blur pesado → mais leve em mobile */
            .blivre-modal-blur {
              backdrop-filter: blur(6px) !important;
              -webkit-backdrop-filter: blur(6px) !important;
            }
            /* Skeleton shimmer só durante loading inicial - desligar em mobile para economizar GPU */
            @keyframes brane-skeleton-shimmer {
              0%, 100% { background-position: 0% 0; }
            }
          }
        `}
      </style>

      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#040407_0%,#090914_48%,#12070C_100%)]" />
        <div className="hidden md:block absolute inset-0 bg-[radial-gradient(circle_at_15%_5%,rgba(212,162,76,0.12),transparent_30%),radial-gradient(circle_at_85%_8%,rgba(124,58,237,0.10),transparent_34%)]" />
      </div>

      {showNotifications && (
        <div className="fixed inset-0 z-[120] flex items-stretch justify-center bg-black/70 backdrop-blur-sm md:items-center md:px-4 md:py-6">
          <div className="w-full md:max-w-[520px] h-[100dvh] md:h-auto rounded-none md:rounded-[28px] border-0 md:border border-[#D4A24C]/25 bg-[#0B0B12] p-4 md:p-5 shadow-[0_24px_80px_rgba(0,0,0,0.62)] flex flex-col">
            <button
              onClick={() => setShowNotifications(false)}
              className="md:hidden inline-flex items-center gap-1.5 text-xs text-[#A6A8B3] hover:text-[#D4A24C] transition-colors mb-2"
              data-testid="blivre-back-from-notifications"
            >
              <ChevronLeft size={16} />
              Voltar
            </button>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-black text-lg text-white">Notificações</h2>
                <p className="text-xs text-[#8C8F9A] mt-1">
                  Novidades dos seus anúncios, favoritos e mensagens.
                </p>
              </div>

              <button
                onClick={() => setShowNotifications(false)}
                className="w-9 h-9 rounded-2xl border border-white/10 bg-white/[0.04] flex items-center justify-center text-[#C9CBD6]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 flex-1 md:flex-initial md:max-h-[56vh] overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm text-[#8C8F9A]">
                  Nenhuma notificação por enquanto.
                </div>
              ) : (
                notifications.map((item, index) => {
                  const data = item.data || {};
                  const chatUrl =
                    data.open_chat_url ||
                    data.openChatUrl ||
                    null;
                  const directUserId =
                    data.sender_id ||
                    data.from_user_id ||
                    data.user_id;
                  const storeKey = data.store_id || data.slug;
                  const isChat =
                    item.type === "store_chat" ||
                    item.type === "direct_chat" ||
                    item.type === "message" ||
                    !!chatUrl ||
                    (!!directUserId && item.type === "direct_chat") ||
                    (!!storeKey && item.type === "store_chat");

                  const handleClick = async () => {
                    try {
                      if (!item.read && (item.notification_id || item.id) && token) {
                        const nid = item.notification_id || item.id;
                        await axios.put(
                          `${API}/notifications/${nid}/read`,
                          {},
                          { headers: authHeaders }
                        );
                        setNotifications((prev) =>
                          prev.map((n) =>
                            (n.notification_id || n.id) === nid
                              ? { ...n, read: true }
                              : n
                          )
                        );
                      }
                    } catch {}

                    // ========================================
                    // B LIVRE: notificações abrem DENTRO da B Livre.
                    // NUNCA redirecionar para o Marketplace.
                    // ========================================
                    setShowNotifications(false);

                    // 1) Mensagem / chat → abrir conversa interna da B Livre
                    if (isChat) {
                      const senderName =
                        data.sender_name ||
                        data.from_name ||
                        item.from_name ||
                        "Usuário";
                      const chatPayload = {
                        post_id: data.post_id || data.related_id || "",
                        sender_id: directUserId || "",
                        sender_name: senderName,
                        message:
                          data.message ||
                          item.message ||
                          item.content ||
                          "",
                        created_at: item.created_at || new Date().toISOString()
                      };
                      setActiveFilter("messages");
                      openChat(chatPayload);
                      return;
                    }

                    // 2) Suporte → abrir modal de suporte da B Livre
                    if (item.type === "support" || item.type === "support_reply") {
                      setShowSupportModal(true);
                      return;
                    }

                    // 3) Denúncia / resposta de denúncia → mostrar mensagem dentro da B Livre
                    if (item.type === "report_response" || item.type === "report") {
                      setShowSupportModal(false);
                      try {
                        toast.info(
                          item.title || "Atualização da sua denúncia",
                          {
                            description:
                              item.message ||
                              item.content ||
                              "Veja os detalhes na B Livre."
                          }
                        );
                      } catch {}
                      return;
                    }

                    // 4) Anúncio relacionado → abrir o post da B Livre
                    const relatedPostId =
                      data.post_id ||
                      data.related_post_id ||
                      item.related_id;
                    if (relatedPostId) {
                      const found = posts.find(
                        (p) => getPostKey(p) === String(relatedPostId)
                      );
                      if (found) {
                        openPost(found);
                        return;
                      }
                      // Carrega via API se não estiver no feed
                      try {
                        const r = await axios.get(
                          `${API}/social/posts/${relatedPostId}`,
                          { headers: authHeaders }
                        );
                        if (r.data) {
                          openPost(r.data);
                          return;
                        }
                      } catch {}
                    }

                    // 5) Fallback: ficar na B Livre (não redirecionar para Marketplace)
                    try {
                      toast(item.title || "Notificação", {
                        description: item.message || item.content || ""
                      });
                    } catch {}
                  };

                  return (
                    <button
                      key={item.notification_id || item.id || index}
                      type="button"
                      onClick={handleClick}
                      className={
                        "w-full text-left rounded-2xl border border-white/10 bg-white/[0.04] p-4 " +
                        "hover:border-[#D4A24C]/50 hover:bg-white/[0.06] transition-colors " +
                        (item.read ? "" : "ring-1 ring-[#D4A24C]/25")
                      }
                      data-testid={`blivre-notification-item-${index}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {isChat ? (
                            <MessageSquare size={16} className="text-[#D4A24C]" />
                          ) : (
                            <Bell size={16} className="text-[#D4A24C]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-white truncate">
                            {item.title || (isChat ? "Nova mensagem" : "Nova notificação")}
                          </p>
                          <p className="text-xs text-[#B8BAC6] mt-1 line-clamp-2">
                            {item.message || item.content || "Você tem uma nova atualização."}
                          </p>
                          {isChat && (
                            <p className="text-[10.5px] text-[#D4A24C] mt-2">
                              Clique para abrir o chat e responder
                            </p>
                          )}
                        </div>
                        {!item.read && (
                          <span className="w-2 h-2 rounded-full bg-[#D4A24C] mt-1.5" />
                        )}
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
        <div className="fixed inset-0 z-[120] flex items-stretch justify-center bg-black/70 backdrop-blur-sm md:items-center md:px-4 md:py-6">
          <div className="w-full md:max-w-[620px] h-[100dvh] md:h-auto md:max-h-[92vh] overflow-y-auto rounded-none md:rounded-[28px] border-0 md:border border-[#D4A24C]/25 bg-[#0B0B12] p-4 md:p-5 shadow-[0_24px_80px_rgba(0,0,0,0.62)]">
            {/* Seta voltar mobile - configurações */}
            <button
              onClick={() => setShowSettings(false)}
              className="md:hidden inline-flex items-center gap-1.5 text-xs text-[#A6A8B3] hover:text-[#D4A24C] transition-colors mb-2"
              data-testid="blivre-back-from-settings"
            >
              <ChevronLeft size={16} />
              Voltar
            </button>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-black text-lg text-white">Editar perfil</h2>
                <p className="text-xs text-[#8C8F9A] mt-1">Atualize suas informações pessoais.</p>
              </div>
              <button onClick={() => setShowSettings(false)} className="w-9 h-9 rounded-2xl border border-white/10 bg-white/[0.04] flex items-center justify-center text-[#C9CBD6]">
                <X size={18} />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-5">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#D4A24C] via-[#F1D28A] to-[#8A2CFF] p-[2px]">
                <div className="w-full h-full rounded-full bg-[#0B0B0F] overflow-hidden flex items-center justify-center">
                  {(profileForm.picture || profileForm.avatar) ? (
                    <img src={profileForm.picture || profileForm.avatar} alt="Perfil" className="w-full h-full object-cover" />
                  ) : (
                    <User className="text-[#F1D28A]" size={34} />
                  )}
                </div>
              </div>
              <label className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl border border-[#D4A24C]/25 bg-[#D4A24C]/10 text-[#F1D28A] text-sm font-bold cursor-pointer">
                <Camera size={17} />
                Trocar foto
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarImage} />
              </label>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="text-xs text-[#8C8F9A] font-bold">Nome</label>
                <input
                  value={profileForm.name}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="mt-1.5 w-full p-3 rounded-2xl bg-black/30 border border-white/10 text-white outline-none"
                  placeholder="Seu nome"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs text-[#8C8F9A] font-bold">Bio / Sobre você</label>
                <textarea
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                  className="mt-1.5 w-full p-3 rounded-2xl bg-black/30 border border-white/10 text-white outline-none resize-none"
                  placeholder="Conte um pouco sobre você..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs text-[#8C8F9A] font-bold">Telefone (opcional)</label>
                <div className="mt-1.5 flex items-center gap-2 w-full p-3 rounded-2xl bg-black/30 border border-white/10">
                  <Phone size={15} className="text-[#8C8F9A] flex-shrink-0" />
                  <input
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
                    className="flex-1 bg-transparent text-white outline-none"
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#8C8F9A] font-bold">Estado</label>
                <select
                  value={profileForm.state}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, state: e.target.value }))}
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
                  value={profileForm.city}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, city: e.target.value }))}
                  className="mt-1.5 w-full p-3 rounded-2xl bg-black/30 border border-white/10 text-white outline-none"
                  placeholder="Sua cidade"
                />
              </div>
            </div>

            <button
              onClick={saveProfile}
              disabled={savingProfile}
              className="mt-5 w-full rounded-2xl bg-gradient-to-r from-[#D4A24C] via-[#F1D28A] to-[#B98228] text-black font-black py-3 disabled:opacity-60"
            >
              {savingProfile ? "Salvando..." : "Salvar perfil"}
            </button>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <button
                onClick={() => { setShowSettings(false); setActiveFilter("mine"); }}
                className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] text-white/80 font-bold py-3 text-sm hover:bg-white/10 transition-all"
              >
                <ShoppingBag size={16} />
                Meus anúncios
              </button>
              <button
                onClick={() => {
                  logout();
                  setShowSettings(false);
                  // Bug fix mobile/tablet: ao sair, abrir DIRETO o modal de login da B Livre
                  // (não permitir que a tela fique vazia ou redirecione para o marketplace)
                  setTimeout(() => setShowAuthModal(true), 60);
                }}
                className="flex items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 font-bold py-3 text-sm hover:bg-red-500/20 transition-all"
                data-testid="blivre-logout-btn"
              >
                <LogOut size={16} />
                Sair da conta
              </button>
            </div>
            <button
              onClick={() => { setShowSettings(false); setShowSupportModal(true); }}
              className="mt-2 w-full flex items-center justify-center gap-2 rounded-2xl border border-[#D4A24C]/20 bg-[#D4A24C]/5 text-[#D4A24C] font-bold py-3 text-sm hover:bg-[#D4A24C]/10 transition-all"
            >
              <MessageSquare size={16} />
              Fale com suporte
            </button>
          </div>
        </div>
      )}

     {composerOpen && (
  <div className="fixed inset-0 z-[100] flex items-stretch justify-center bg-black/80 backdrop-blur-sm md:items-center md:px-4 md:py-6" data-testid="composer-modal">
    <div
      className="w-full md:max-w-[560px] h-[100dvh] md:h-[92vh] rounded-none md:rounded-[28px] border-0 md:border border-[#D4A24C]/25 bg-[#0B0B12] p-3 sm:p-4 md:p-5 shadow-[0_24px_80px_rgba(0,0,0,0.62)] overflow-hidden flex flex-col"
      style={{ animation: "blivreSlideIn 0.28s ease-out" }}
    >
      {/* Seta voltar mobile - composer */}
      <button
        type="button"
        onClick={() => {
          setComposerOpen(false);
          setEditingPost(null);
          setUseAI(true);
          setGeneratedAd(null);
        }}
        className="md:hidden inline-flex items-center gap-1.5 text-xs text-[#A6A8B3] hover:text-[#D4A24C] transition-colors mb-2 self-start flex-shrink-0"
        data-testid="blivre-back-from-composer"
      >
        <ChevronLeft size={16} />
        Voltar
      </button>
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h2 className="font-black text-lg text-white">
            {editingPost ? "Editar anúncio" : "Novo anúncio com IA"}
          </h2>
          <p className="text-[11px] text-[#8C8F9A] mt-1">
            {editingPost
              ? "Atualize as informações do seu anúncio."
              : "Responda algumas perguntas e a IA monta o anúncio para você."}
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
        <div className="flex-1 min-h-0 overflow-y-auto">
          <AIAssistantPanelSocial
            uploadedPhotos={images}
            onPhotoUpload={async (files) => {
              const fileList = Array.from(files || []);
              const base64List = await Promise.all(
                fileList.slice(0, 5).map((file) => fileToBase64(file))
              );
              setImages((prev) => [...prev, ...base64List].slice(0, 5));
            }}
            onGenerateAd={(data) => {
              const finalData = {
                ...data,
                photos: images.length > 0 ? images : data.photos || []
              };

              const newForm = {
                category: finalData.category || "",
                title: finalData.title || finalData.productName || "",
                price: String(finalData.price || "").replace(/^R\$\s*/i, ""),
                state: finalData.state || "",
                city: finalData.city || "",
                productCondition: finalData.condition || finalData.productCondition || finalData.product_condition || "",
                description: finalData.description || "",
                availability: finalData.availability || "Item único",
                contact_phone: finalData.contact_phone || "",
                contact_whatsapp: finalData.contact_whatsapp || ""
              };

              setForm(newForm);
              setGeneratedAd(finalData);
              setIsGeneratingAd(false);
              if (finalData.photos && finalData.photos.length > 0 && images.length === 0) {
                setImages(finalData.photos);
              }
            }}
            onImproveAd={(improvedAd) => {
              const finalData = {
                ...improvedAd,
                photos: images.length > 0 ? images : improvedAd.photos || []
              };

              setForm(prev => ({
                ...prev,
                category: finalData.category || prev.category,
                title: finalData.title || prev.title,
                price: String(finalData.price || prev.price || "").replace(/^R\$\s*/i, ""),
                state: finalData.state || prev.state,
                city: finalData.city || prev.city,
                productCondition: finalData.condition || finalData.productCondition || finalData.product_condition || prev.productCondition,
                description: finalData.description || prev.description,
                availability: finalData.availability || prev.availability
              }));

              setGeneratedAd(finalData);
              if (finalData.photos && finalData.photos.length > 0 && images.length === 0) {
                setImages(finalData.photos);
              }
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
                productCondition: data.condition || data.productCondition || data.product_condition || "",
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
                productCondition: ad.condition || ad.productCondition || ad.product_condition || "",
                description: ad.description || "",
                availability: ad.availability || "Item único",
                contact_phone: ad.contact_phone || "",
                contact_whatsapp: ad.contact_whatsapp || ""
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
                className="mt-1.5 w-full p-4 rounded-[22px] bg-black/30 border border-white/10 text-white outline-none resize-none"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={publishFromModal}
            disabled={posting}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-[#D4A24C] via-[#F1D28A] to-[#B98228] text-black font-black disabled:opacity-60"
          >
            <Send size={17} />
            {posting ? "Atualizando..." : "Atualizar anúncio"}
          </button>
        </div>
      )}
    </div>
  </div>
)}

      {/* Modal de Contato */}
      {showContactModal && contactData && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-[360px] rounded-[28px] border border-[#D4A24C]/25 bg-[#0B0B12] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.62)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-lg text-white">Entrar em contato</h2>
              <button onClick={() => setShowContactModal(false)} className="w-9 h-9 rounded-2xl border border-white/10 bg-white/[0.04] flex items-center justify-center text-[#C9CBD6]">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              {contactData.contact_whatsapp && (
                <a
                  href={`https://wa.me/${contactData.contact_whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-green-500 text-white font-black py-3 hover:bg-green-600 transition-all"
                >
                  📲 Abrir WhatsApp
                </a>
              )}
              {contactData.contact_phone && (
                <div className="space-y-2">
                  <a
                    href={`tel:${contactData.contact_phone.replace(/\D/g, '')}`}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-blue-500 text-white font-black py-3 hover:bg-blue-600 transition-all"
                  >
                    📞 Ligar
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(contactData.contact_phone);
                      alert("Número copiado!");
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] text-white font-black py-3 hover:bg-white/[0.08] transition-all"
                  >
                    📋 Copiar número
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Denúncia */}
      {showReportModal && reportTarget?.tipo !== "contato" && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-[480px] rounded-[28px] border border-red-500/25 bg-[#0B0B12] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.62)]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-black text-lg text-white">
                  {reportTarget?.tipo === "usuario" ? "Denunciar usuário" : "Denunciar anúncio"}
                </h2>
                <p className="text-xs text-[#8C8F9A] mt-1">Selecione o motivo da denúncia.</p>
              </div>
              <button onClick={() => setShowReportModal(false)} className="w-9 h-9 rounded-2xl border border-white/10 bg-white/[0.04] flex items-center justify-center text-[#C9CBD6]">
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {REPORT_MOTIVOS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setReportMotivo(m)}
                  className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                    reportMotivo === m
                      ? "border-red-400 bg-red-500/20 text-red-300"
                      : "border-white/10 bg-white/5 text-white/70 hover:border-red-400/50 hover:text-red-300"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <textarea
              value={reportDescricao}
              onChange={(e) => setReportDescricao(e.target.value)}
              rows={3}
              placeholder="Descrição adicional (opcional)..."
              className="w-full p-3 rounded-2xl bg-black/30 border border-white/10 text-white outline-none resize-none text-sm mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowReportModal(false)}
                className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] text-white/80 font-bold py-3 text-sm hover:bg-white/10 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={sendReport}
                disabled={sendingReport || !reportMotivo}
                className="flex-1 rounded-2xl bg-red-500 text-white font-black py-3 text-sm hover:bg-red-600 disabled:opacity-50 transition-all"
              >
                {sendingReport ? "Enviando..." : "Enviar denúncia"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedPost && (
        <div className="fixed inset-0 z-[90] bg-black/75 blivre-modal-blur backdrop-blur-xl flex items-center justify-center px-4">
          {/* Seta voltar mobile - produto aberto */}
          <button
            onClick={closePost}
            className="md:hidden absolute top-3 left-3 inline-flex items-center gap-1.5 text-xs text-white/90 hover:text-[#D4A24C] bg-black/50 backdrop-blur px-3 py-2 rounded-2xl border border-white/10 z-[5]"
            data-testid="blivre-back-from-product"
          >
            <ChevronLeft size={16} />
            Voltar
          </button>
          <button
            onClick={closePost}
            className="absolute top-5 right-5 w-12 h-12 rounded-2xl gold-premium-3d flex items-center justify-center"
            data-testid="close-product-modal-btn"
          >
            <X size={22} />
          </button>

          {selectedImages.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 border border-white/10 flex items-center justify-center"
              >
                <ChevronLeft />
              </button>

              <button
                onClick={nextImage}
                className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 border border-white/10 flex items-center justify-center"
              >
                <ChevronRight />
              </button>
            </>
          )}

          <div className="w-full max-w-[1100px] mx-auto px-4">
            <div className="overflow-hidden bg-white shadow-[0_30px_120px_rgba(0,0,0,0.65)]">
              <div className="grid md:grid-cols-[1fr_360px] gap-6 items-center">
                <div className="bg-[#EEF1F4] flex items-center justify-center min-h-[500px] relative px-4">
                  {selectedImage ? (
                    <ProductImageZoom
                      mode="detailPro"
                      src={selectedImage}
                      alt="Produto"
                      className="max-h-[650px] w-full object-contain"
                      wrapperClassName="w-full h-full"
                      zoomPanelSize={240}
                      lensSize={220}
                    />
                  ) : (
                    <Package className="text-[#D4A24C]" size={80} />
                  )}
                </div>

                <div className="flex flex-col text-[#111318] h-[85vh] max-w-[360px] w-full relative z-10">
                  <div className="flex-1 overflow-y-auto px-5 pt-5 pb-3">
                    <h2 className="text-xl font-black leading-tight">
                      {getTitle(selectedPost)}
                    </h2>

                    <p className="text-xl font-black mt-2 blivre-price-gold">
                      {getPrice(selectedPost)}
                    </p>

                    <p className="text-sm text-[#606875] mt-2 flex items-center gap-2">
                      <MapPin size={16} />
                      {getLocation(selectedPost)}
                    </p>

                    {getCondition(selectedPost) && (
                      <p className="text-sm font-bold text-[#111318] mt-2">
                        Estado: {getCondition(selectedPost)}
                      </p>
                    )}

                    {selectedPost.availability && selectedPost.availability !== "Item único" && (
                      <p className="text-sm text-[#606875] mt-1">
                        📦 {selectedPost.availability}
                      </p>
                    )}

                    <div className="mt-4 border-t border-[#E5E7EB] pt-4">
                      <p className="text-sm whitespace-pre-wrap text-[#3F4652]">
                        {selectedPost.content}
                      </p>
                    </div>

                    {/* Botão de contato */}
                    {(selectedPost.contact_phone || selectedPost.contact_whatsapp) && (
                      <div className="mt-4 border-t border-[#E5E7EB] pt-4">
                        <button
                          onClick={() => openReportModal("contato", {
                            contact_phone: selectedPost.contact_phone,
                            contact_whatsapp: selectedPost.contact_whatsapp
                          })}
                          className="w-full rounded-2xl gold-premium-3d py-2 text-sm"
                          data-testid="contact-seller-btn"
                        >
                          Entrar em contato
                        </button>
                      </div>
                    )}

                    {/* Botões de ação */}
                    <div className="mt-4 border-t border-[#E5E7EB] pt-3 space-y-2">
                      <button
                        onClick={() => openReportModal("usuario", null, selectedPost.user_id)}
                        className="w-full flex items-center justify-center gap-1.5 text-xs text-[#9CA3AF] hover:text-red-400 transition-colors border border-[#E5E7EB] rounded-lg py-2"
                      >
                        <Flag size={13} />
                        Denunciar usuário
                      </button>
                      <button
                        onClick={() => openReportModal("anuncio", getPostKey(selectedPost), selectedPost.user_id)}
                        className="w-full flex items-center justify-center gap-1.5 text-xs text-[#9CA3AF] hover:text-red-400 transition-colors border border-[#E5E7EB] rounded-lg py-2"
                      >
                        <Flag size={13} />
                        Denunciar anúncio
                      </button>
                    </div>
                  </div>

                  <div className="px-5 pb-4 pt-3 border-t border-[#E5E7EB]">
                    <div className="flex gap-2">
                      <input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="flex-1 h-11 rounded-2xl border border-[#E5E7EB] px-4 outline-none"
                        placeholder="Digite sua mensagem..."
                      />

                      <button
                        onClick={sendMessage}
                        disabled={sendingMessage || !message.trim()}
                        className="h-11 px-5 rounded-2xl gold-premium-3d disabled:opacity-50"
                        data-testid="send-message-btn"
                      >
                        {sendingMessage ? "Enviando..." : "Enviar"}
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
        <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050508]/95 w-full overflow-x-hidden blivre-header">
          <div className="w-full px-3 sm:px-4 py-3 sm:py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
            <div className="flex items-center justify-between md:justify-start gap-2 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-[#D4A24C] via-[#F1D28A] to-[#8A2CFF] p-[1px] flex-shrink-0">
                  <div className="w-full h-full rounded-2xl bg-[#09090D] overflow-hidden flex items-center justify-center">
                    <img src={BRANE_LOGO_URL} alt="B Livre" className="w-full h-full object-cover" />
                  </div>
                </div>

                <div className="min-w-0">
                  <h1 className="font-black tracking-wide leading-none text-base sm:text-lg">B Livre</h1>
                  <p className="text-[10px] sm:text-[11px] text-[#8C8F9A] uppercase tracking-[0.2em] truncate hidden sm:block">
                    compras, vendas e oportunidades locais
                  </p>
                </div>
              </div>

              {/* Botões de Notificação/Configuração no Mobile (lado direito do logo) */}
              <div className="flex md:hidden items-center gap-1 sm:gap-2">
                {/* Avatar do usuário logado - mobile */}
                {user && (
                  <button
                    onClick={() => {
                      setProfileForm({
                        name: user?.name || "",
                        city: user?.city || "",
                        state: user?.state || "",
                        picture: user?.picture || user?.avatar || "",
                        phone: user?.phone || "",
                        bio: user?.bio || ""
                      });
                      setShowSettings(true);
                    }}
                    className="w-9 h-9 rounded-full bg-gradient-to-br from-[#D4A24C] via-[#F1D28A] to-[#8A2CFF] p-[1.5px] flex-shrink-0"
                  >
                    <div className="w-full h-full rounded-full bg-[#09090D] overflow-hidden flex items-center justify-center">
                      {user?.picture || user?.avatar ? (
                        <img src={user.picture || user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User size={14} className="text-[#F1D28A]" />
                      )}
                    </div>
                  </button>
                )}
                <PWAInstallButton size="sm" />
                <button
                  onClick={() => setShowNotifications(true)}
                  className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-2xl border border-white/10 bg-white/[0.04] flex items-center justify-center text-[#D4A24C] flex-shrink-0"
                  data-testid="blivre-bell-btn-mobile"
                >
                  <Bell size={16} />
                </button>

                <button
                  onClick={() => {
                    setProfileForm({
                      name: user?.name || "",
                      city: user?.city || "",
                      state: user?.state || "",
                      picture: user?.picture || user?.avatar || "",
                      phone: user?.phone || "",
                      bio: user?.bio || ""
                    });
                    setShowSettings(true);
                  }}
                  className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl border border-white/10 bg-white/[0.04] flex items-center justify-center text-[#D4A24C] flex-shrink-0"
                >
                  <Settings size={16} />
                </button>
              </div>
            </div>

            {/* Busca: Empilhada no Mobile, Lado a Lado no Desktop */}
            <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-2.5 sm:py-3 md:max-w-xl">
              <Search size={18} className="text-[#D4A24C]" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar produtos, serviços..."
                className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-[#6F7280]"
              />
            </div>

            {/* Botões de Notificação/Configuração no Desktop (lado direito da busca) */}
            <div className="hidden md:flex items-center gap-1 sm:gap-2">
              <PWAInstallButton />
              <button
                onClick={() => setShowNotifications(true)}
                className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-2xl border border-white/10 bg-white/[0.04] flex items-center justify-center text-[#D4A24C] flex-shrink-0"
                data-testid="blivre-bell-btn"
              >
                <Bell size={16} />
              </button>

              <button
                onClick={() => {
                  setProfileForm({
                    name: user?.name || "",
                    city: user?.city || "",
                    state: user?.state || "",
                    picture: user?.picture || user?.avatar || "",
                    phone: user?.phone || "",
                    bio: user?.bio || ""
                  });
                  setShowSettings(true);
                }}
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl border border-white/10 bg-white/[0.04] flex items-center justify-center text-[#D4A24C] flex-shrink-0"
              >
                <Settings size={16} />
              </button>
            </div>

            {/* Carrossel de Categorias: Apenas Mobile */}
            <div className="categories-carousel md:hidden">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeCategory === cat.id
                      ? "bg-[#D4A24C] text-black"
                      : "bg-white/5 text-[#8C8F9A] border border-white/10"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className="w-full px-2 sm:px-4 py-3 sm:py-4">
          <div
            className={`grid items-start blivre-shell ${expanded ? 'blivre-shell-expanded' : ''}`}
          >
            <aside
              className={
                "space-y-3 sm:space-y-5 blivre-side blivre-side-left " +
                (expanded ? "blivre-side-left-collapsed" : "")
              }
            >
              <div
                className={`rounded-[28px] border border-white/10 bg-white/[0.04] transition-all duration-300 ${expanded ? 'opacity-0 pointer-events-none h-0 overflow-hidden m-0 p-0' : 'p-5 opacity-100'}`}
                style={{ transition: 'padding 280ms ease, opacity 220ms ease' }}
              >
                <div className={`flex items-center gap-3 mb-2 ${expanded ? 'justify-center' : ''}`}>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4A24C] via-[#F1D28A] to-[#8A2CFF] p-[1px] flex-shrink-0">
                    <div className="w-full h-full rounded-full bg-[#09090D] overflow-hidden flex items-center justify-center">
                      {user?.picture || user?.avatar ? (
                        <img src={user.picture || user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User size={20} className="text-[#F1D28A]" />
                      )}
                    </div>
                  </div>
                  {!expanded && (
                    <h3 className="font-black text-lg flex items-center gap-2 truncate">
                      {user && user.name ? user.name : "Usuário B Livre"}
                      <BadgeCheck size={17} className="text-[#D4A24C]" />
                    </h3>
                  )}
                </div>

                <div className={`mt-5 space-y-2 ${expanded ? 'flex flex-col items-center' : ''}`}>
                  {[
                    ["Perto de você", MapPin, "near"],
                    ["Meus anúncios", Package, "mine"],
                    ["Favoritos", Heart, "favorites"],
                    ["Mensagens", MessageSquare, "messages"]
                  ].map(([label, Icon, value]) => (
                    <button
                      key={label}
                      onClick={() => {
                        setActiveFilter(value);
                        setSelectedCategory("");
                      }}
                      title={expanded ? label : ""}
                      className={
                        `flex items-center gap-3 text-sm rounded-xl ${expanded ? 'w-12 h-12 justify-center p-0' : 'w-full px-3 py-3'} ` +
                        (activeFilter === value ? "text-[#F1D28A] bg-[#D4A24C]/10" : "text-[#C9CBD6] hover:bg-white/[0.04]")
                      }
                    >
                      <Icon size={expanded ? 20 : 17} className="text-[#D4A24C]" />
                      {!expanded && label}
                    </button>
                  ))}
                </div>
              </div>

              <div
                className={`rounded-[28px] border border-white/10 bg-white/[0.035] transition-all duration-300 ${expanded ? 'opacity-0 pointer-events-none h-0 overflow-hidden m-0 p-0' : 'p-5 opacity-100'}`}
                style={{ transition: 'padding 280ms ease, opacity 220ms ease' }}
              >
                <h3 className={`font-black flex items-center gap-2 ${expanded ? 'mb-0' : 'mb-4'}`}>
                  <Tags size={expanded ? 20 : 18} className="text-[#D4A24C]" />
                  {!expanded && "Categorias"}
                </h3>
                {!expanded && (
                  <>
                    <button
                      onClick={() => {
                        setSelectedCategory("");
                        setActiveFilter("all");
                      }}
                      className="w-full py-3 border-b border-white/5 text-sm text-[#F1D28A] text-left"
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
                        className={
                          "w-full py-3 border-b border-white/5 text-sm text-left transition-colors " +
                          (selectedCategory === item ? "text-[#F1D28A] font-bold" : "text-[#C9CBD6] hover:text-white")
                        }
                      >
                        {item}
                      </button>
                    ))}
                  </>
                )}
              </div>
            </aside>

            {/* Botão "+" dourado fixo no LADO ESQUERDO ao recolher (desktop/tablet) */}
            {expanded && (
              <button
                type="button"
                onClick={() => {
                  if (!requireAuth("anunciar")) return;
                  setUseAI(true);
                  setComposerOpen(true);
                }}
                className="hidden md:flex fixed top-[108px] left-4 sm:left-8 z-[100] w-14 h-14 rounded-2xl gold-premium-3d items-center justify-center text-2xl animate-in fade-in zoom-in duration-300"
                title="Novo anúncio"
                data-testid="blivre-fab-left"
              >
                <Plus size={28} strokeWidth={3} />
              </button>
            )}

            <main 
              ref={mainScrollRef}
              className="blivre-main-scroll h-[calc(100vh-110px)] overflow-y-auto pr-1 sm:pr-2"
            >
              {activeFilter === "messages" ? (
                selectedChat ? (
                  <div className="rounded-[32px] border border-white/10 bg-white/[0.035] p-6">
                    {/* Seta voltar mobile (B Livre) — chat aberto → lista */}
                    <button
                      type="button"
                      onClick={closeChat}
                      className="md:hidden inline-flex items-center gap-1.5 text-xs text-[#A6A8B3] hover:text-[#D4A24C] transition-colors mb-3"
                      data-testid="blivre-back-from-chat"
                    >
                      <ChevronLeft size={16} />
                      Voltar para mensagens
                    </button>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-black text-xl flex items-center gap-2">
                        <MessageSquare className="text-[#D4A24C]" />
                        Chat com {selectedChat.sender_name || selectedChat.name || "Usuário"}
                      </h2>
                      <button
                        onClick={closeChat}
                        className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-[#C9CBD6] hover:bg-white/20"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="h-[400px] overflow-y-auto mb-4 space-y-3">
                      {chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender === (user?.name || "Você") ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] p-3 rounded-2xl ${
                              msg.sender === (user?.name || "Você")
                                ? "bg-[#D4A24C] text-black"
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
                        className="flex-1 p-3 rounded-2xl bg-black/30 border border-white/10 text-white outline-none"
                      />
                      <button
                        onClick={sendChatMessage}
                        disabled={!chatMessage.trim()}
                        className="px-5 py-3 rounded-2xl bg-[#D4A24C] text-black font-black disabled:opacity-60"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[32px] border border-white/10 bg-white/[0.035] p-6">
                    {/* Seta voltar mobile (B Livre) — sai de mensagens */}
                    <button
                      type="button"
                      onClick={() => { setActiveFilter("all"); setSelectedChat(null); }}
                      className="md:hidden inline-flex items-center gap-1.5 text-xs text-[#A6A8B3] hover:text-[#D4A24C] transition-colors mb-3"
                      data-testid="blivre-back-from-messages"
                    >
                      <ChevronLeft size={16} />
                      Voltar
                    </button>
                    <h2 className="font-black text-xl mb-4 flex items-center gap-2">
                      <MessageSquare className="text-[#D4A24C]" />
                      Mensagens
                    </h2>

                    {messages.length === 0 ? (
                      <p className="text-sm text-[#8C8F9A]">
                        Nenhuma mensagem por enquanto.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {messages.map((item, index) => (
                          <button
                            key={item.id || index}
                            onClick={() => openChat(item)}
                            className="w-full text-left rounded-2xl border border-white/10 bg-white/[0.04] p-4 hover:bg-white/[0.08] transition-colors"
                          >
                            <p className="text-sm font-black text-white">
                              {item.sender_name || item.name || "Usuário"}
                            </p>
                            <p className="text-xs text-[#B8BAC6] mt-1">
                              {item.message || item.content}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              ) : loading ? (
                <div className="grid gap-2 sm:gap-4 blivre-grid">
                  {Array.from({ length: 12 }, (_, index) => (
                    <SkeletonCard key={index} />
                  ))}
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="rounded-[32px] border border-white/10 bg-white/[0.035] p-6 sm:p-12 text-center">
                  <Package className="mx-auto text-[#D4A24C] mb-4" size={46} />
                  <p className="text-[#C9CBD6] font-black text-lg">
                    Nenhum anúncio encontrado.
                  </p>
                </div>
              ) : (
                <>
                  {/* Seta voltar mobile (B Livre) - filtros específicos */}
                  {(activeFilter === "mine" || activeFilter === "favorites" || activeFilter === "near") && (
                    <button
                      type="button"
                      onClick={() => setActiveFilter("all")}
                      className="md:hidden inline-flex items-center gap-1.5 text-xs text-[#A6A8B3] hover:text-[#D4A24C] transition-colors mb-3 px-2"
                      data-testid="blivre-back-to-feed"
                    >
                      <ChevronLeft size={16} />
                      Voltar para tudo
                    </button>
                  )}
                <div className={`grid gap-2 sm:gap-4 blivre-grid ${expanded ? 'blivre-grid-expanded' : ''}`}
                  style={{
                    gridTemplateColumns: expanded
                      ? "repeat(5, 1fr)"
                      : "repeat(auto-fill, minmax(185px, 1fr))"
                  }}
                >
                  {filteredPosts.map((post) => {
                    const key = getPostKey(post);
                    const isFavorite = favorites.includes(key);

                    return (
                      <div
                        key={key}
                        className="blivre-product-card text-left rounded-[20px] overflow-hidden bg-white border border-[#E5E7EB] shadow-[0_16px_38px_rgba(0,0,0,0.18)] hover:-translate-y-1 transition-transform duration-200"
                      >
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => openPost(post)}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openPost(post); } }}
                          className="w-full text-left cursor-pointer"
                          data-testid={`blivre-card-${key}`}
                        >
                          <div className="relative aspect-square bg-[#F3F4F6]">
                            {getCoverImage(post) ? (
                              <ProductImageZoom
                                src={getCoverImage(post)}
                                alt="Anúncio"
                                className="w-full h-full object-cover"
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
                                  className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600"
                                  data-testid={`blivre-edit-${key}`}
                                >
                                  <Settings size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deletePost(post);
                                  }}
                                  className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                                  data-testid={`blivre-delete-${key}`}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => toggleFavorite(post, e)}
                                className={
                                  "absolute top-2 right-2 w-9 h-9 rounded-full flex items-center justify-center border border-white/20 transition-colors " +
                                  (isFavorite ? "bg-[#D4A24C] text-black" : "bg-black/60 text-white hover:bg-black/80")
                                }
                                data-testid={`blivre-favorite-${key}`}
                                aria-label={isFavorite ? "Desfavoritar" : "Favoritar"}
                              >
                                <Heart size={16} fill={isFavorite ? "currentColor" : "none"} />
                              </button>
                            )}
                          </div>

                          <div className="p-2 sm:p-3 bg-white">
                            <p className="text-[#17130B] font-black text-xs sm:text-sm leading-tight line-clamp-2 tracking-[-0.03em]">
                              {getTitle(post)}
                            </p>

                            <p className="blivre-price-gold text-base sm:text-lg mt-1 sm:mt-2 tracking-[-0.04em] font-black">
                              {getPrice(post)}
                            </p>

                            <p className="text-[10px] sm:text-[11px] text-[#8B8790] font-semibold mt-0.5 sm:mt-1 truncate flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                              {getLocation(post)}
                            </p>

                            <span className="mt-2 sm:mt-3 inline-flex w-full justify-center rounded-xl blivre-gold-button px-2 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-[12px] font-black">
                              {activeFilter === "mine" ? "Ver meu anúncio" : "Ver produto"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <div ref={loadMoreRef} />
                </div>
                </>
              )}
            </main>

            <aside className={`blivre-side blivre-side-right ${expanded ? 'blivre-side-right-collapsed' : ''}`}>
              <div className="space-y-5">
                <div className={`rounded-[28px] border border-[#D4A24C]/20 bg-gradient-to-br from-white/[0.06] to-white/[0.025] p-5 transition-all duration-300 ${expanded ? 'opacity-0 pointer-events-none h-0 overflow-hidden m-0 p-0' : 'opacity-100'}`}>
                  <h3 className="font-black mb-3 flex items-center gap-2">
                    <Package size={18} className="text-[#D4A24C]" />
                    Anunciar produto
                  </h3>

                  <button
                    type="button"
                    onClick={() => {
                      if (!requireAuth("anunciar")) return;
                      setUseAI(true);
                      setComposerOpen(true);
                    }}
                    className="w-full rounded-2xl gold-premium-3d py-3"
                  >
                    Anunciar
                  </button>
                </div>

                {/* Botão + Fixo que aparece ao rolar */}
                {expanded && (
                  <div className="hidden md:block fixed top-[108px] right-4 sm:right-8 z-[100]">
                    <button
                      onClick={() => {
                        if (!requireAuth("anunciar")) return;
                        setUseAI(true);
                        setComposerOpen(true);
                      }}
                      className="w-14 h-14 rounded-2xl gold-premium-3d flex items-center justify-center text-2xl animate-in fade-in zoom-in duration-300"
                      data-testid="blivre-fab-right"
                      title="Novo anúncio"
                    >
                      <Plus size={28} strokeWidth={3} />
                    </button>
                  </div>
                )}

                  <div className={`rounded-[28px] border border-white/10 bg-white/[0.035] p-5 transition-all duration-300 ${expanded ? 'opacity-0 pointer-events-none h-0 overflow-hidden m-0 p-0' : 'opacity-100'}`}>
                    <h3 className="font-black mb-4 flex items-center gap-2">
                      <Globe size={18} className="text-[#D4A24C]" />
                      Alcance
                    </h3>

                    <div className="space-y-2 sm:space-y-3 text-[10px] sm:text-sm text-[#B8BAC6]">
                      <div className="flex items-center justify-between">
                        <span>Visualizações</span>
                        <span className="gold-text-premium">{totalViews}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span>Interesses</span>
                        <span className="gold-text-premium">{totalInterests}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span>Meus anúncios</span>
                        <span className="gold-text-premium">{totalMyAds}</span>
                      </div>
                    </div>
                  </div>
                </div>
            </aside>
          </div>
        </div>
      </div>

  {/* Botões flutuantes mobile */}
<div className="fixed bottom-7 right-4 z-50 md:hidden flex flex-col items-center gap-3">
  <button
    type="button"
    onClick={() => {
      if (!requireAuth("messages")) return;
      setActiveFilter("messages");
      setSelectedChat(null);
    }}
    className="w-12 h-12 rounded-full gold-premium-3d flex items-center justify-center text-black"
    title="Mensagens"
    data-testid="blivre-mobile-fab-mensagens"
  >
    <MessageSquare size={20} strokeWidth={2.7} />
  </button>

  <button
    type="button"
    onClick={() => {
      if (!requireAuth("anunciar")) return;
      setUseAI(true);
      setComposerOpen(true);
    }}
    className="w-14 h-14 rounded-full gold-premium-3d flex items-center justify-center text-black"
    title="Anunciar"
    data-testid="blivre-mobile-fab-anunciar"
  >
    <Plus size={30} strokeWidth={3.2} />
  </button>
</div>
        
        

      {/* Modal de Suporte */}
      {showSupportModal && (
        <div className="fixed inset-0 z-[130] flex items-stretch justify-center bg-black/70 backdrop-blur-sm md:items-center md:px-4 md:py-6">
          <div className="w-full md:max-w-[420px] h-[100dvh] md:h-auto rounded-none md:rounded-[28px] border-0 md:border border-[#D4A24C]/25 bg-[#0B0B12] p-4 md:p-5 shadow-[0_24px_80px_rgba(0,0,0,0.62)] flex flex-col">
            <button
              onClick={() => setShowSupportModal(false)}
              className="md:hidden inline-flex items-center gap-1.5 text-xs text-[#A6A8B3] hover:text-[#D4A24C] transition-colors mb-2"
              data-testid="blivre-back-from-support"
            >
              <ChevronLeft size={16} />
              Voltar
            </button>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-black text-lg text-white">Fale com o suporte</h2>
                <p className="text-xs text-[#8C8F9A] mt-1">Envie sua mensagem e responderemos em breve.</p>
              </div>
              <button onClick={() => setShowSupportModal(false)} className="w-9 h-9 rounded-2xl border border-white/10 bg-white/[0.04] flex items-center justify-center text-[#C9CBD6]"><X size={18} /></button>
            </div>
            <textarea
              value={supportMsg}
              onChange={(e) => setSupportMsg(e.target.value)}
              placeholder="Descreva sua dúvida ou problema..."
              rows={5}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-[#D4A24C]/50 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowSupportModal(false)} className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] text-white/70 font-bold py-3 text-sm hover:bg-white/10 transition-all">Cancelar</button>
              <button
                onClick={sendSupportMsg}
                disabled={sendingSupport || !supportMsg.trim()}
                className="flex-1 rounded-2xl gold-premium-3d font-black py-3 text-sm disabled:opacity-50"
              >
                {sendingSupport ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </div>
        </div>
      )}
      <BLivreAuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setPendingAction(null);
        }}
        onAuthSuccess={() => {
          setShowAuthModal(false);
          loadSocialData();
          if (pendingAction === "anunciar") {
            setUseAI(true);
            setComposerOpen(true);
          }
          setPendingAction(null);
        }}
      />
    </div>
  );
}
