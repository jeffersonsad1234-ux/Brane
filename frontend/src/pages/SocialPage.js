import { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  Image, Send, User, Bell, Search, MessageSquare,
  Settings, BadgeCheck, Package, MapPin, Tags,
  Heart, X, ChevronLeft, ChevronRight, Globe, Camera
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import ProductImageZoom from "../components/ProductImageZoom";
import AIAssistantPanelSocial from "../components/AIAssistantPanelSocial";
import BLivreAuthModal from "../components/BLivreAuthModal";
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

export default function SocialPage() {
  const { user, token, API, setUser } = useAuth();

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

  const [pendingAction, setPendingAction] = useState(null);
  const requireAuth = (action = null) => {
    if (!user) {
      setPendingAction(action);
      setShowAuthModal(true);
      return false;
    }
    return true;
  };

  const [profileForm, setProfileForm] = useState({
    name: "",
    city: "",
    state: "",
    picture: ""
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

    return () => {
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
    setProfileForm((prev) => ({ ...prev, picture: base64 }));

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

  const sendMessage = async () => {
    if (!selectedPost) return;
    if (!requireAuth()) return;

    try {
      await axios.post(
        `${API}/social/messages`,
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

      const res = await axios.put(
        `${API}/social/profile`,
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
    <div className="rounded-[20px] overflow-hidden bg-white border border-[#E5E7EB]">
      <div className="aspect-square bg-[#E5E7EB] animate-pulse" />
      <div className="p-3 bg-white space-y-3">
        <div className="h-4 rounded bg-[#E5E7EB] animate-pulse" />
        <div className="h-5 rounded bg-[#E5E7EB] w-2/3 animate-pulse" />
        <div className="h-3 rounded bg-[#E5E7EB] w-1/2 animate-pulse" />
        <div className="h-8 rounded-xl bg-[#E5E7EB] animate-pulse" />
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

          .blivre-gold-text {
            background: linear-gradient(135deg, #8F5F12 0%, #C88A1A 18%, #FFD36A 38%, #FFF1A8 50%, #D89B25 68%, #9F6811 100%);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            -webkit-text-fill-color: transparent;
            filter: drop-shadow(0 4px 10px rgba(200,138,26,0.28));
          }

          .blivre-gold-button {
            background: linear-gradient(135deg, #8F5F12 0%, #C88A1A 18%, #FFD36A 38%, #FFF1A8 50%, #D89B25 68%, #9F6811 100%);
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.55), 0 8px 22px rgba(200,138,26,0.28);
          }
        `}
      </style>

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_5%,rgba(212,162,76,0.16),transparent_30%),radial-gradient(circle_at_85%_8%,rgba(124,58,237,0.16),transparent_34%),radial-gradient(circle_at_50%_95%,rgba(212,162,76,0.08),transparent_38%),linear-gradient(135deg,#040407_0%,#090914_48%,#12070C_100%)]" />
      </div>

      {showNotifications && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-[520px] rounded-[28px] border border-[#D4A24C]/25 bg-[#0B0B12] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.62)]">
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

            <div className="space-y-3 max-h-[56vh] overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm text-[#8C8F9A]">
                  Nenhuma notificação por enquanto.
                </div>
              ) : (
                notifications.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                  >
                    <p className="text-sm font-black text-white">
                      {item.title || "Nova notificação"}
                    </p>
                    <p className="text-xs text-[#B8BAC6] mt-1">
                      {item.message || item.content || "Você tem uma nova atualização."}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-[620px] rounded-[28px] border border-[#D4A24C]/25 bg-[#0B0B12] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.62)]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-black text-lg text-white">Editar perfil</h2>
                <p className="text-xs text-[#8C8F9A] mt-1">
                  Atualize sua foto, nome e localização.
                </p>
              </div>

              <button
                onClick={() => setShowSettings(false)}
                className="w-9 h-9 rounded-2xl border border-white/10 bg-white/[0.04] flex items-center justify-center text-[#C9CBD6]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-5">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#D4A24C] via-[#F1D28A] to-[#8A2CFF] p-[2px]">
                    <div className="w-full h-full rounded-full bg-[#0B0B0F] overflow-hidden flex items-center justify-center">
                  {(profileForm.picture || profileForm.avatar) ? (
                    <img
                      src={profileForm.picture || profileForm.avatar}
                      alt="Perfil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="text-[#F1D28A]" size={34} />
                  )}
                </div>
              </div>

              <label className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl border border-[#D4A24C]/25 bg-[#D4A24C]/10 text-[#F1D28A] text-sm font-bold cursor-pointer">
                <Camera size={17} />
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
                <label className="text-xs text-[#8C8F9A] font-bold">Nome</label>
                <input
                  value={profileForm.name}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="mt-1.5 w-full p-3 rounded-2xl bg-black/30 border border-white/10 text-white outline-none"
                  placeholder="Seu nome"
                />
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
          </div>
        </div>
      )}

     {composerOpen && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
    <div
      className="w-full max-w-[560px] h-[92vh] rounded-[28px] border border-[#D4A24C]/25 bg-[#0B0B12] p-4 md:p-5 shadow-[0_24px_80px_rgba(0,0,0,0.62)] overflow-hidden flex flex-col"
      style={{ animation: "blivreSlideIn 0.28s ease-out" }}
    >
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

              const newForm = {
                category: finalData.category || "",
                title: finalData.title || finalData.productName || "",
                price: String(finalData.price || "").replace(/^R\$\s*/i, ""),
                state: finalData.state || "",
                city: finalData.city || "",
                productCondition: finalData.condition || finalData.productCondition || "",
                description: finalData.description || "",
                availability: finalData.availability || "Item único"
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
                productCondition: finalData.condition || finalData.productCondition || prev.productCondition,
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

      {selectedPost && (
        <div className="fixed inset-0 z-[90] bg-black/75 backdrop-blur-xl flex items-center justify-center px-4">
          <button
            onClick={closePost}
            className="absolute top-5 right-5 w-12 h-12 rounded-2xl bg-[#D4A24C] text-black flex items-center justify-center font-black"
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

                    <p className="text-xl font-black text-[#B98228] mt-2">
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

                    <div className="mt-4 border-t border-[#E5E7EB] pt-4">
                      <p className="text-sm whitespace-pre-wrap text-[#3F4652]">
                        {selectedPost.content}
                      </p>
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
                        className="h-11 px-5 rounded-2xl bg-[#111318] text-white font-black"
                      >
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
                onClick={() => setShowNotifications(true)}
                className="relative w-11 h-11 rounded-2xl border border-white/10 bg-white/[0.04] flex items-center justify-center text-[#D4A24C]"
              >
                <Bell size={19} />
              </button>

              <button
                onClick={() => {
                  setProfileForm({
                    name: user?.name || "",
                    city: user?.city || "",
                    state: user?.state || "",
                    picture: user?.picture || user?.avatar || ""
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
              <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4A24C] via-[#F1D28A] to-[#8A2CFF] p-[1px]">
                    <div className="w-full h-full rounded-full bg-[#09090D] overflow-hidden flex items-center justify-center">
                      {user?.picture || user?.avatar ? (
                        <img src={user.picture || user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User size={20} className="text-[#F1D28A]" />
                      )}
                    </div>
                  </div>
                  <h3 className="font-black text-lg flex items-center gap-2">
                    {user && user.name ? user.name : "Usuário B Livre"}
                    <BadgeCheck size={17} className="text-[#D4A24C]" />
                  </h3>
                </div>

                <div className="mt-5 space-y-2">
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
                      className={
                        "w-full flex items-center gap-3 text-sm rounded-xl px-3 py-3 hover:bg-white/[0.04] " +
                        (activeFilter === value ? "text-[#F1D28A] bg-[#D4A24C]/10" : "text-[#C9CBD6]")
                      }
                    >
                      <Icon size={17} className="text-[#D4A24C]" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5">
                <h3 className="font-black mb-4 flex items-center gap-2">
                  <Tags size={18} className="text-[#D4A24C]" />
                  Categorias
                </h3>

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
                    className="w-full py-3 border-b border-white/5 last:border-b-0 text-sm text-left text-[#B8BAC6]"
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
                  <div className="rounded-[32px] border border-white/10 bg-white/[0.035] p-6">
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
                <div className="grid gap-4 blivre-grid">
                  {Array.from({ length: 12 }, (_, index) => (
                    <SkeletonCard key={index} />
                  ))}
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="rounded-[32px] border border-white/10 bg-white/[0.035] p-12 text-center">
                  <Package className="mx-auto text-[#D4A24C] mb-4" size={46} />
                  <p className="text-[#C9CBD6] font-black text-lg">
                    Nenhum anúncio encontrado.
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
                        className="blivre-product-card text-left rounded-[20px] overflow-hidden bg-white border border-[#E5E7EB] shadow-[0_16px_38px_rgba(0,0,0,0.18)] hover:-translate-y-1 transition-transform duration-200"
                      >
                        <button
                          type="button"
                          onClick={() => openPost(post)}
                          className="w-full text-left"
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
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => toggleFavorite(post, e)}
                                className={
                                  "absolute top-2 right-2 w-9 h-9 rounded-full flex items-center justify-center border border-white/20 " +
                                  (isFavorite ? "bg-[#D4A24C] text-black" : "bg-black/60 text-white")
                                }
                              >
                                <Heart size={16} fill={isFavorite ? "currentColor" : "none"} />
                              </button>
                            )}
                          </div>

                          <div className="p-3 bg-white">
                            <p className="text-[#17130B] font-black text-sm leading-tight line-clamp-2 tracking-[-0.03em]">
                              {getTitle(post)}
                            </p>

                            <p className="blivre-gold-text font-black text-lg mt-2 tracking-[-0.04em]">
                              {getPrice(post)}
                            </p>

                            <p className="text-[11px] text-[#8B8790] font-semibold mt-1 truncate">
                              {getLocation(post)}
                            </p>

                            <span className="mt-3 inline-flex w-full justify-center rounded-xl blivre-gold-button px-3 py-2 text-[12px] font-black text-[#14100A]">
                              {activeFilter === "mine" ? "Ver meu anúncio" : "Ver produto"}
                            </span>
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
                  className="w-full h-16 rounded-2xl bg-gradient-to-r from-[#D4A24C] via-[#F1D28A] to-[#B98228] text-black font-black shadow-[0_12px_35px_rgba(212,162,76,0.22)]"
                >
                  +
                </button>
              ) : (
                <div className="space-y-5">
                  <div className="rounded-[28px] border border-[#D4A24C]/20 bg-gradient-to-br from-white/[0.06] to-white/[0.025] p-5">
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
                      className="w-full rounded-2xl bg-gradient-to-r from-[#D4A24C] via-[#F1D28A] to-[#B98228] text-black font-black py-3"
                    >
                      Anunciar
                    </button>
                  </div>

                  <div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5">
                    <h3 className="font-black mb-4 flex items-center gap-2">
                      <Globe size={18} className="text-[#D4A24C]" />
                      Alcance
                    </h3>

                    <div className="space-y-3 text-sm text-[#B8BAC6]">
                      <div className="flex items-center justify-between">
                        <span>Visualizações</span>
                        <span className="text-[#F1D28A] font-bold">{totalViews}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span>Interesses</span>
                        <span className="text-[#F1D28A] font-bold">{totalInterests}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span>Meus anúncios</span>
                        <span className="text-[#F1D28A] font-bold">{totalMyAds}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>

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
