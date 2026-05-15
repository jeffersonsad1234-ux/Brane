import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useBLivreAuth } from "./BLivreAuthContext";
import blivreAPI from "../services/blivreAPI";

const BLivreMessageContext = createContext(null);

export function BLivreMessageProvider({ children }) {
  const { user, token, authHeaders } = useBLivreAuth();

  const [messages, setMessages] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatMessage, setChatMessage] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const chatScrollRef = useRef(null);
  const notifIntervalRef = useRef(null);
  const messagesIntervalRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(blivreAPI.messages.list(), { headers: authHeaders });
      setMessages(res.data.messages || []);
    } catch (e) {
      console.error("Erro ao buscar mensagens:", e);
    }
  }, [token, authHeaders]);

  const loadChatMessages = useCallback(async (postId) => {
    try {
      const res = await axios.get(blivreAPI.messages.conversation(postId), { headers: authHeaders });
      const msgs = (res.data.messages || [])
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        .map((m) => ({
          id: m.message_id || m.id,
          sender: m.sender_name || m.name || "Usuário",
          message: m.message,
          timestamp: new Date(m.created_at || Date.now()),
          isMine: m.sender_id === user?.user_id
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
  }, [authHeaders, user]);

  const loadChatMessagesRef = useRef(loadChatMessages);
  useEffect(() => { loadChatMessagesRef.current = loadChatMessages; }, [loadChatMessages]);

  const openChat = useCallback((chat) => {
    setSelectedChat(chat);
    fetchMessages();
  }, [fetchMessages]);

  const closeChat = useCallback(() => {
    setSelectedChat(null);
    setChatMessages([]);
    setChatMessage("");
  }, []);

  const sendChatMessage = useCallback(async () => {
    if (!chatMessage.trim() || !selectedChat) return;
    const text = chatMessage;
    setChatMessage("");
    try {
      await axios.post(blivreAPI.messages.send(), {
        post_id: selectedChat.post_id,
        message: text
      }, { headers: authHeaders });
      loadChatMessages(selectedChat.post_id);
      fetchMessages();
      axios.get(blivreAPI.notifications.list(), { headers: authHeaders })
        .then((r) => {
          setNotifications(r.data.notifications || []);
          setUnreadCount(r.data.unread || 0);
        })
        .catch(() => {});
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      alert("Erro ao enviar mensagem.");
    }
  }, [chatMessage, selectedChat, authHeaders, loadChatMessages, fetchMessages]);

  const openMessagesTab = useCallback(() => {
    setSelectedChat(null);
    fetchMessages();
    axios.get(blivreAPI.notifications.list(), { headers: authHeaders })
      .then((r) => {
        setNotifications(r.data.notifications || []);
        setUnreadCount(r.data.unread || 0);
      })
      .catch(() => {});
  }, [authHeaders, fetchMessages]);

  useEffect(() => {
    if (!token) return;
    openMessagesTab();

    notifIntervalRef.current = setInterval(() => {
      axios.get(blivreAPI.notifications.list(), { headers: authHeaders })
        .then((r) => {
          setNotifications(r.data.notifications || []);
          setUnreadCount(r.data.unread || 0);
        })
        .catch(() => {});
    }, 5000);

    messagesIntervalRef.current = setInterval(() => {
      axios.get(blivreAPI.messages.list(), { headers: authHeaders })
        .then((r) => setMessages(r.data.messages || []))
        .catch(() => {});
    }, 3000);

    const onVisible = () => {
      if (document.hidden) return;
      openMessagesTab();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);

    return () => {
      if (notifIntervalRef.current) clearInterval(notifIntervalRef.current);
      if (messagesIntervalRef.current) clearInterval(messagesIntervalRef.current);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [token]);

  useEffect(() => {
    if (selectedChat?.post_id) {
      loadChatMessages(selectedChat.post_id);
    }
  }, [selectedChat?.post_id]);

  useEffect(() => {
    if (!selectedChat?.post_id) return;
    const interval = setInterval(() => {
      loadChatMessagesRef.current(selectedChat.post_id);
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedChat?.post_id]);

  return (
    <BLivreMessageContext.Provider value={{
      messages, selectedChat, chatMessages, chatMessage, unreadCount, notifications,
      chatScrollRef, fetchMessages, loadChatMessages, openChat, closeChat,
      sendChatMessage, setChatMessage, setUnreadCount, setNotifications, openMessagesTab
    }}>
      {children}
    </BLivreMessageContext.Provider>
  );
}

export const useBLivreMessages = () => {
  const ctx = useContext(BLivreMessageContext);
  if (!ctx) throw new Error("useBLivreMessages must be used within BLivreMessageProvider");
  return ctx;
};
