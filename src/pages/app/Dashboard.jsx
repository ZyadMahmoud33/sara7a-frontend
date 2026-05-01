// frontend/src/pages/app/Dashboard.jsx
import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, LogOut, MessageCircle, Star, Eye, 
  Trash2, Heart, Copy, Check, Lock, Crown,
  Calendar, Mail, Share2, Zap, Shield, 
  TrendingUp, Send, Coins,
  RefreshCw, Inbox, ChevronLeft, ChevronRight,
  Video, Clock, Settings, X, AtSign, Hash,
  Maximize2, Award, Sparkles, ImageOff
} from "lucide-react";
import { getProfileAPI } from "../../api/user";
import {
  getMyMessagesAPI,
  revealSenderAPI,
  deleteMessageAPI,
  likeMessageAPI,
} from "../../api/message";
import { logoutAPI } from "../../api/auth";
import AdModal from "../../components/AdModal";
import toast from "react-hot-toast";

export default function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [revealingId, setRevealingId] = useState(null);
  const [likingId, setLikingId] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const [stats, setStats] = useState({
    total: 0,
    revealed: 0,
    liked: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [showAdModal, setShowAdModal] = useState(false);
  const [dailyAdWatched, setDailyAdWatched] = useState(0);
  const [showSparkles, setShowSparkles] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredMessage, setHoveredMessage] = useState(null);

  const ITEMS_PER_PAGE = 5;
  const REVEAL_COST = 5;
  const MAX_ADS_PER_DAY = 5;

  // ✅ Helper function to fix image URLs (مُضافة)
  const getImageUrl = useCallback((profilePic) => {
    if (!profilePic) return null;
    
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    
    if (profilePic.startsWith('/uploads')) {
      return `${baseUrl}${profilePic}`;
    }
    if (profilePic.startsWith('http')) {
      return profilePic;
    }
    if (profilePic.startsWith('./')) {
      return `${baseUrl}/${profilePic.substring(2)}`;
    }
    return `${baseUrl}/${profilePic}`;
  }, []);

  // Fetch user profile
  const fetchUserProfile = useCallback(async () => {
    try {
      const userData = await getProfileAPI();
      setUser(userData);
      setDailyAdWatched(userData?.dailyAdWatched || 0);
      return userData;
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      return null;
    }
  }, []);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    try {
      const data = await getMyMessagesAPI();
      
      let messagesData = [];
      if (Array.isArray(data)) {
        messagesData = data;
      } else if (data?.messages) {
        messagesData = data.messages;
      } else if (data?.data) {
        messagesData = data.data;
      }

      const processedMessages = [...messagesData]
        .reverse()
        .map((m) => ({
          ...m,
          liked: m.liked ?? false,
          sender: m.sender || m.senderId,
        }));

      setMessages(processedMessages);
      
      setStats({
        total: processedMessages.length,
        revealed: processedMessages.filter(m => m.isRevealed).length,
        liked: processedMessages.filter(m => m.liked).length,
      });
    } catch (err) {
      console.error("Fetch messages error:", err);
      throw err;
    }
  }, []);

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        navigate("/login");
        return;
      }

      setLoading(true);

      await Promise.all([
        fetchUserProfile(),
        fetchMessages(),
      ]);
    } catch (err) {
      const status = err?.response?.status;
      if ([401, 403].includes(status)) {
        await logoutAPI();
        navigate("/login");
      } else if (status === 429) {
        toast.error("Too many requests. Please wait a moment.");
      } else {
        toast.error(err?.message || "Error loading dashboard");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, fetchUserProfile, fetchMessages]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refreshData = async () => {
    setRefreshing(true);
    await Promise.all([fetchUserProfile(), fetchMessages()]);
    setRefreshing(false);
    toast.success("Dashboard refreshed!");
    setCurrentPage(1);
    setShowSparkles(true);
    setTimeout(() => setShowSparkles(false), 2000);
  };

  const handleLogout = async () => {
    await logoutAPI();
    navigate("/login");
  };

  const handleCoinsEarned = (newCoins, watched) => {
    setUser(prev => ({ ...prev, coins: newCoins }));
    setDailyAdWatched(watched);
    fetchMessages();
    toast.success(`You now have ${newCoins} coins! 🎉`);
    setShowSparkles(true);
    setTimeout(() => setShowSparkles(false), 2000);
  };

  const publicLink = user?._id
    ? `${window.location.origin}/profile/${user._id}`
    : "";

  const copyLink = async () => {
    if (!publicLink) return;
    await navigator.clipboard.writeText(publicLink);
    setCopied(true);
    toast.success("Profile link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopy = async (text, id) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Message copied to clipboard!");
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleLike = async (id) => {
    const msg = messages.find(m => m._id === id);
    if (!msg) return;

    const newLikedState = !msg.liked;
    
    setMessages(prev => {
      const updated = prev.map(m =>
        m._id === id ? { ...m, liked: newLikedState } : m
      );
      setStats(prevStats => ({
        ...prevStats,
        liked: updated.filter(m => m.liked).length
      }));
      return updated;
    });

    if (selectedMessage?._id === id) {
      setSelectedMessage(prev => ({ ...prev, liked: newLikedState }));
    }

    setLikingId(id);
    try {
      if (likeMessageAPI) {
        await likeMessageAPI(id);
      }
      toast.success(newLikedState ? "❤️ Added to liked!" : "💔 Removed from liked");
    } catch (err) {
      setMessages(prev => {
        const rolledBack = prev.map(m =>
          m._id === id ? { ...m, liked: !newLikedState } : m
        );
        setStats(prevStats => ({
          ...prevStats,
          liked: rolledBack.filter(m => m.liked).length
        }));
        return rolledBack;
      });
      toast.error("Failed to update like");
    } finally {
      setLikingId(null);
    }
  };

  const handleDelete = async (id) => {
    const deletedMsg = messages.find(m => m._id === id);
    if (!deletedMsg) return;

    const updatedMessages = messages.filter(m => m._id !== id);
    setMessages(updatedMessages);
    
    if (selectedMessage?._id === id) {
      setShowMessageModal(false);
      setSelectedMessage(null);
    }
    
    setStats({
      total: updatedMessages.length,
      revealed: updatedMessages.filter(m => m.isRevealed).length,
      liked: updatedMessages.filter(m => m.liked).length,
    });

    try {
      await deleteMessageAPI(id);
      toast.success("Message deleted successfully");
    } catch (err) {
      setMessages(messages);
      setStats({
        total: messages.length,
        revealed: messages.filter(m => m.isRevealed).length,
        liked: messages.filter(m => m.liked).length,
      });
      toast.error("Failed to delete message");
    }
  };

  const canReveal = useCallback(() => {
    if (user?.plan === "premium") return true;
    if (user?.plan === "pro" && (user?.coins || 0) >= REVEAL_COST) return true;
    return false;
  }, [user?.plan, user?.coins]);

  const getRevealMessage = useCallback(() => {
    if (user?.plan === "premium") return "Reveal sender (Unlimited) ✨";
    if (user?.plan === "pro") return `Reveal sender (${REVEAL_COST} coins) 💰`;
    return "Upgrade to reveal sender 🔒";
  }, [user?.plan]);

  const handleReveal = async (id) => {
    if (!canReveal()) {
      if (user?.plan === "free") {
        toast.error("Premium or Pro plan required to reveal sender! Upgrade now 🔒");
        navigate("/premium");
      } else if (user?.plan === "pro" && (user?.coins || 0) < REVEAL_COST) {
        toast.error(`Not enough coins! Need ${REVEAL_COST} coins to reveal sender 💰`);
      }
      return;
    }

    setRevealingId(id);
    try {
      const result = await revealSenderAPI(id);
      
      setMessages(prev => {
        const updated = prev.map(m =>
          m._id === id ? { 
            ...m, 
            isRevealed: true,
            sender: result.data?.sender || result.sender,
            revealedAt: result.data?.revealedAt || result.revealedAt
          } : m
        );
        setStats(prevStats => ({
          ...prevStats,
          revealed: updated.filter(m => m.isRevealed).length
        }));
        return updated;
      });
      
      if (selectedMessage?._id === id) {
        setSelectedMessage(prev => ({
          ...prev,
          isRevealed: true,
          sender: result.data?.sender || result.sender,
          revealedAt: result.data?.revealedAt || result.revealedAt
        }));
      }
      
      if (user?.plan === "pro" && result.data?.remainingCoins !== undefined) {
        setUser(prev => ({ ...prev, coins: result.data.remainingCoins }));
      } else if (user?.plan === "pro" && result.remainingCoins !== undefined) {
        setUser(prev => ({ ...prev, coins: result.remainingCoins }));
      } else if (user?.plan === "pro") {
        setUser(prev => ({ ...prev, coins: (prev?.coins || 0) - REVEAL_COST }));
      }
      
      toast.success(result.message || "Sender revealed! 🎉");
    } catch (err) {
      console.error("Reveal error:", err);
      const errorMsg = err?.response?.data?.message || err?.message;
      
      if (errorMsg?.includes("coins")) {
        toast.error(`Not enough coins! Need ${REVEAL_COST} coins to reveal sender 💰`);
        await fetchUserProfile();
      } else {
        toast.error(errorMsg || "Failed to reveal sender. Please try again.");
      }
    } finally {
      setRevealingId(null);
    }
  };

  const handleImageError = (messageId, senderId) => {
    setImageErrors(prev => ({ ...prev, [`${messageId}-${senderId}`]: true }));
  };

  const openMessageModal = (msg) => {
    setSelectedMessage(msg);
    setShowMessageModal(true);
  };

  const formatFullDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'medium'
    });
  };

  const paginatedMessages = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return messages.slice(start, end);
  }, [messages, currentPage]);

  const totalPages = Math.ceil(messages.length / ITEMS_PER_PAGE);

  const formatDate = (date) => {
    const msgDate = new Date(date);
    const now = new Date();
    const diffMs = now - msgDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return msgDate.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center bg-gradient-to-br from-gray-900 via-black to-gray-900 min-h-screen">
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="mb-4"
        >
          <MessageCircle size={48} className="text-purple-500" />
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-gray-400"
        >
          Loading your dashboard...
        </motion.p>
      </div>
    );
  }

  return (
    <div className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 min-h-screen overflow-hidden text-white">
      
      {/* Sparkles Animation Overlay */}
      <AnimatePresence>
        {showSparkles && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="z-50 fixed inset-0 pointer-events-none"
          >
            {[...Array(80)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight, opacity: 1, rotate: 0 }}
                animate={{ scale: [0, 1.5, 0], opacity: [1, 0.5, 0], y: [null, -150], rotate: [0, 180, 360] }}
                transition={{ duration: 1.5, delay: Math.random() * 0.5 }}
                className="absolute rounded-full"
                style={{ 
                  width: Math.random() * 6 + 2 + "px", 
                  height: Math.random() * 6 + 2 + "px",
                  background: `radial-gradient(circle, ${['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFB347', '#6B5B95'][i % 7]}, transparent)`,
                  boxShadow: "0 0 10px currentColor"
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Animated Background with floating particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="-top-40 -right-40 absolute bg-purple-600 opacity-20 blur-3xl rounded-full w-80 h-80 animate-pulse mix-blend-multiply filter"></div>
        <div className="-bottom-40 -left-40 absolute bg-blue-600 opacity-20 blur-3xl rounded-full w-80 h-80 animate-pulse delay-1000 mix-blend-multiply filter"></div>
        <div className="top-1/2 left-1/2 absolute bg-pink-600 opacity-10 blur-3xl rounded-full w-96 h-96 -translate-x-1/2 -translate-y-1/2 animate-pulse delay-2000 transform mix-blend-multiply filter"></div>
        
        {/* Floating particles */}
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 4 + 1 + "px",
              height: Math.random() * 4 + 1 + "px",
              background: `rgba(255,255,255,${Math.random() * 0.3 + 0.1})`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [null, -80, 80, -80],
              x: [null, 80, -80, 80],
              scale: [1, 1.5, 1],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: Math.random() * 20 + 15,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

      <div className="z-10 relative mx-auto p-6 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white/5 shadow-2xl backdrop-blur-xl mb-8 p-6 border border-white/10 rounded-2xl"
        >
          <div className="flex lg:flex-row flex-col justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: 15, scale: 1.1 }}
                className="bg-gradient-to-br from-purple-500 to-pink-500 p-2 rounded-xl"
              >
                <MessageCircle size={28} />
              </motion.div>
              <div>
                <h1 className="bg-clip-text bg-gradient-to-r from-white to-gray-400 font-bold text-transparent text-3xl">
                  Welcome back, {user?.firstName || "User"}! 👋
                </h1>
                <p className="text-gray-400 text-sm">Manage your anonymous messages</p>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              {/* Plan Badge with Coins */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className={`px-3 py-1 rounded-full text-sm flex items-center gap-2 ${
                  user?.plan === "premium" 
                    ? "bg-gradient-to-r from-yellow-500 to-orange-500" 
                    : user?.plan === "pro"
                    ? "bg-gradient-to-r from-cyan-500 to-blue-500"
                    : "bg-gray-600"
                }`}
              >
                {user?.plan === "premium" && <Crown size={14} className="text-yellow-300 animate-pulse" />}
                {user?.plan === "pro" && <Zap size={14} />}
                <span className="capitalize">{user?.plan || "free"}</span>
                {user?.plan === "pro" && (
                  <span className="flex items-center gap-1 bg-white/20 ml-1 px-1.5 py-0.5 rounded text-xs">
                    <Coins size={10} />
                    {user?.coins || 0}
                  </span>
                )}
              </motion.div>
              
              {/* Settings Button */}
              <motion.button
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/profile-settings")}
                className="flex items-center gap-2 bg-purple-500/20 hover:bg-purple-500/30 px-4 py-2 border border-purple-500/30 rounded-xl text-purple-400 transition-all duration-200"
              >
                <Settings size={18} />
                Edit Profile
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05, rotateZ: 15 }}
                whileTap={{ scale: 0.95 }}
                onClick={refreshData}
                disabled={refreshing}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-all duration-200"
              >
                <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
                Refresh
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 px-5 py-2 border border-red-500/30 rounded-xl text-red-400 transition-all duration-200"
              >
                <LogOut size={18} />
                Logout
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="gap-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 mb-8"
        >
          {[
            { label: "Total Messages", value: stats.total, icon: Inbox, color: "from-blue-500 to-cyan-500", emoji: "📩" },
            { label: "Messages Revealed", value: stats.revealed, icon: Eye, color: "from-green-500 to-emerald-500", emoji: "👁️" },
            { label: "Liked Messages", value: stats.liked, icon: Heart, color: "from-pink-500 to-rose-500", emoji: "❤️" },
            { label: "Account Status", value: user?.isPremium ? "Premium" : user?.plan === "pro" ? "Pro" : "Free", icon: user?.isPremium ? Crown : user?.plan === "pro" ? Zap : Shield, color: user?.isPremium ? "from-yellow-500 to-orange-500" : user?.plan === "pro" ? "from-cyan-500 to-blue-500" : "from-gray-500 to-gray-600", emoji: user?.isPremium ? "👑" : user?.plan === "pro" ? "⚡" : "🛡️" },
            { label: "Coins", value: user?.coins || 0, icon: Coins, color: "from-yellow-500 to-orange-500", emoji: "💰" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              onHoverStart={() => setHoveredCard(index)}
              onHoverEnd={() => setHoveredCard(null)}
              className={`bg-gradient-to-br ${stat.color} p-5 rounded-2xl shadow-xl cursor-pointer relative overflow-hidden transition-all duration-300 ${
                hoveredCard === index ? "shadow-2xl" : ""
              }`}
            >
              <motion.div
                animate={{ y: [0, -8, 0], rotate: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="-top-2 -right-2 absolute opacity-20 text-4xl"
              >
                {stat.emoji}
              </motion.div>
              
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-white/80 text-sm">{stat.label}</p>
                  <p className="mt-1 font-bold text-2xl">{stat.value}</p>
                </div>
                <stat.icon size={24} className="text-white/50" />
              </div>
              
              {hoveredCard === index && (
                <motion.div
                  layoutId="cardGlow"
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ boxShadow: `0 0 30px rgba(139,92,246,0.5)` }}
                />
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/5 backdrop-blur-xl mb-8 p-6 border border-white/10 rounded-2xl"
        >
          <div className="flex lg:flex-row flex-col justify-between items-start lg:items-center gap-6">
            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex justify-center items-center bg-gradient-to-br from-purple-500 to-pink-500 rounded-full w-16 h-16"
              >
                {user?.profilePic ? (
                  <img 
                    src={getImageUrl(user.profilePic)} 
                    alt="Profile" 
                    className="rounded-full w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <User size={32} />
                )}
              </motion.div>
              <div>
                <h2 className="font-bold text-2xl">
                  {user?.firstName || "User"} {user?.lastName || ""}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <Mail size={14} className="text-gray-400" />
                  <p className="text-gray-400">{user?.email || "No email"}</p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar size={14} className="text-gray-400" />
                  <p className="text-gray-400 text-sm">
                    Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "recently"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {!user?.isPremium && user?.plan !== "pro" && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/premium")}
                  className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 shadow-lg px-6 py-3 rounded-xl font-bold text-black"
                >
                  <Crown size={18} />
                  Upgrade to Premium ⭐
                </motion.button>
              )}

              {user?.plan === "pro" && !user?.isPremium && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/premium")}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg px-6 py-3 rounded-xl font-bold text-white"
                >
                  <Crown size={18} />
                  Upgrade to Premium
                </motion.button>
              )}
            </div>
          </div>

          <div className="mt-6">
            <label className="block mb-2 font-medium text-gray-300 text-sm">
              Your Public Profile Link
            </label>
            <div className="flex gap-2">
              <input
                value={publicLink}
                readOnly
                className="flex-1 bg-black/40 p-3 border border-white/10 focus:border-purple-500 rounded-xl focus:outline-none transition-all duration-200"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={copyLink}
                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 px-6 rounded-xl font-medium"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? "Copied" : "Copy"}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'My Anonymous Message Profile',
                      text: 'Send me anonymous messages!',
                      url: publicLink,
                    });
                  } else {
                    copyLink();
                  }
                }}
                className="flex items-center gap-2 bg-purple-500/20 hover:bg-purple-500/30 px-4 border border-purple-500/30 rounded-xl transition-all duration-200"
              >
                <Share2 size={18} />
                Share
              </motion.button>
            </div>
          </div>

          {/* Watch Ad Button */}
          {user?.plan === "free" && dailyAdWatched < MAX_ADS_PER_DAY && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAdModal(true)}
              className="flex justify-center items-center gap-2 hover:bg-yellow-500/30 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 mt-4 py-2.5 border border-yellow-500/30 rounded-lg w-full font-medium text-sm transition-all duration-200"
            >
              <Video size={16} className="text-yellow-400" />
              <span>Watch Ad to Earn +5 Coins</span>
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-yellow-400 text-xs"
              >
                ({dailyAdWatched}/{MAX_ADS_PER_DAY} today)
              </motion.span>
            </motion.button>
          )}

          {user?.plan === "free" && dailyAdWatched >= MAX_ADS_PER_DAY && (
            <div className="flex justify-center items-center gap-2 bg-gray-500/10 mt-4 py-2.5 rounded-lg w-full text-gray-500 text-sm">
              <Clock size={14} />
              Daily ad limit reached ({MAX_ADS_PER_DAY}/{MAX_ADS_PER_DAY}). Come back tomorrow!
            </div>
          )}
        </motion.div>

        {/* Messages Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl p-6 border border-white/10 rounded-2xl"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="flex items-center gap-2 font-bold text-2xl">
              <MessageCircle size={24} />
              Messages 💬
              {messages.length > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="bg-purple-500/20 px-2 py-1 rounded-lg text-sm"
                >
                  {messages.length} total
                </motion.span>
              )}
            </h2>
            <TrendingUp size={20} className="text-gray-400" />
          </div>

          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-16 text-center"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Inbox size={64} className="mx-auto mb-4 text-gray-600" />
              </motion.div>
              <p className="text-gray-400 text-lg">No messages yet 😢</p>
              <p className="mt-2 text-gray-500 text-sm">Share your profile link to receive anonymous messages!</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={copyLink}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 mt-4 px-6 py-2 rounded-xl"
              >
                <Send size={18} />
                Share Your Link
              </motion.button>
            </motion.div>
          ) : (
            <>
              <div className="gap-4 grid">
                <AnimatePresence>
                  {paginatedMessages.map((msg, idx) => {
                    const senderData = msg.sender || msg.senderId;
                    const isSenderRevealed = msg.isRevealed && senderData;
                    const imageKey = `${msg._id}-${senderData?._id}`;
                    const hasImageError = imageErrors[imageKey];
                    
                    return (
                      <motion.div
                        key={msg._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ delay: idx * 0.05 }}
                        whileHover={{ scale: 1.01 }}
                        onClick={() => openMessageModal(msg)}
                        onHoverStart={() => setHoveredMessage(idx)}
                        onHoverEnd={() => setHoveredMessage(null)}
                        className={`group relative bg-gradient-to-r from-white/10 to-transparent p-5 rounded-xl border transition-all duration-300 cursor-pointer ${
                          hoveredMessage === idx 
                            ? "border-purple-500/50 shadow-xl shadow-purple-500/20" 
                            : "border-white/10"
                        }`}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className="bg-white/5 px-2 py-1 rounded-lg text-gray-500 text-xs">
                                #{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                              </span>
                              <span className="flex items-center gap-1 text-gray-500 text-xs">
                                <Calendar size={12} />
                                {formatDate(msg.createdAt)}
                              </span>
                            </div>

                            <p className="mt-2 text-gray-200 line-clamp-2 leading-relaxed">
                              "{msg.content || "No content"}"
                            </p>

                            <div className="mt-3">
                              {isSenderRevealed ? (
                                <motion.div
                                  whileHover={{ scale: 1.02 }}
                                  className="inline-flex items-center gap-3 bg-green-500/10 px-3 py-2 rounded-lg"
                                >
                                  {!hasImageError && senderData.profilePic ? (
                                    <img
                                      key={`img-${msg._id}`}
                                      src={getImageUrl(senderData.profilePic)}
                                      alt={senderData.firstName}
                                      className="border border-green-500 rounded-full w-6 h-6 object-cover"
                                      onError={() => handleImageError(msg._id, senderData._id)}
                                    />
                                  ) : (
                                    <div className="flex justify-center items-center bg-gradient-to-br from-green-500 to-emerald-500 rounded-full w-6 h-6">
                                      <User size={12} />
                                    </div>
                                  )}
                                  <div>
                                    <span className="font-medium text-green-400 text-sm">
                                      {senderData.firstName || "Unknown"} {senderData.lastName || ""}
                                    </span>
                                    {senderData.username && (
                                      <span className="ml-1 text-gray-400 text-xs">
                                        (@{senderData.username})
                                      </span>
                                    )}
                                  </div>
                                  {msg.revealedAt && (
                                    <span className="text-gray-500 text-xs">
                                      • Revealed {new Date(msg.revealedAt).toLocaleDateString()}
                                    </span>
                                  )}
                                </motion.div>
                              ) : (
                                <div className="inline-flex items-center gap-2 bg-yellow-500/10 px-3 py-1.5 rounded-lg text-yellow-400">
                                  <Lock size={14} />
                                  <span className="text-sm">Anonymous Sender</span>
                                  {user?.plan === "pro" && !msg.isRevealed && (
                                    <span className="ml-1 text-cyan-400 text-xs">
                                      ({REVEAL_COST} coins to reveal)
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-1">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => { e.stopPropagation(); handleCopy(msg.content, msg._id); }}
                              className="hover:bg-white/10 p-2 rounded-lg transition-all duration-200"
                              title="Copy message"
                            >
                              {copiedId === msg._id ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => { e.stopPropagation(); handleLike(msg._id); }}
                              disabled={likingId === msg._id}
                              className={`p-2 rounded-lg hover:bg-white/10 transition-all duration-200 disabled:opacity-50 ${msg.liked ? 'text-pink-500' : ''}`}
                              title="Like"
                            >
                              {likingId === msg._id ? (
                                <div className="border-2 border-pink-400 border-t-transparent rounded-full w-5 h-5 animate-spin" />
                              ) : (
                                <Heart size={18} fill={msg.liked ? "currentColor" : "none"} />
                              )}
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => { e.stopPropagation(); handleDelete(msg._id); }}
                              className="hover:bg-red-500/20 p-2 rounded-lg text-red-400 transition-all duration-200"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </motion.button>

                            {!msg.isRevealed && (user?.plan === "premium" || user?.plan === "pro") && (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => { e.stopPropagation(); handleReveal(msg._id); }}
                                disabled={revealingId === msg._id || !canReveal()}
                                className={`p-2 rounded-lg transition-all duration-200 disabled:opacity-50 ${
                                  canReveal()
                                    ? "hover:bg-purple-500/20 text-purple-400"
                                    : "text-gray-500 cursor-not-allowed"
                                }`}
                                title={getRevealMessage()}
                              >
                                {revealingId === msg._id ? (
                                  <div className="border-2 border-purple-400 border-t-transparent rounded-full w-5 h-5 animate-spin" />
                                ) : (
                                  <Eye size={18} />
                                )}
                              </motion.button>
                            )}

                            {!msg.isRevealed && user?.plan === "free" && (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => { e.stopPropagation(); navigate("/premium"); }}
                                className="hover:bg-yellow-500/20 p-2 rounded-lg text-yellow-400 transition-all duration-200"
                                title="Upgrade to reveal"
                              >
                                <Crown size={18} />
                              </motion.button>
                            )}
                          </div>
                        </div>

                        {/* Animated CTA on hover */}
                        {hoveredMessage === idx && !msg.isRevealed && user?.plan === "free" && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute inset-0 flex justify-center items-center bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-xl"
                          >
                            <div className="text-center">
                              <Crown size={32} className="mx-auto mb-2 text-yellow-400" />
                              <p className="font-semibold text-sm">Upgrade to Premium</p>
                              <p className="text-gray-300 text-xs">Reveal who sent this message</p>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 mt-6">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="bg-white/10 hover:bg-white/20 disabled:opacity-50 p-2 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={20} />
                  </motion.button>
                  
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="bg-white/10 hover:bg-white/20 disabled:opacity-50 p-2 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={20} />
                  </motion.button>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>

      {/* Message Detail Modal */}
      <AnimatePresence>
        {showMessageModal && selectedMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="z-50 fixed inset-0 flex justify-center items-center bg-black/80 backdrop-blur-md p-4"
            onClick={() => setShowMessageModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-gradient-to-br from-gray-900 to-black shadow-2xl border border-purple-500/30 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowMessageModal(false)}
                className="top-4 right-4 absolute bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-all duration-200"
              >
                <X size={20} />
              </button>

              <div className="p-6">
                <div className="flex flex-wrap justify-between items-start gap-3 mb-6">
                  <div className="flex flex-wrap gap-2">
                    <span className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                      selectedMessage.isRevealed
                        ? "bg-green-500/20 text-green-400 border border-green-500/50"
                        : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50"
                    }`}>
                      {selectedMessage.isRevealed ? <Eye size={14} /> : <Lock size={14} />}
                      {selectedMessage.isRevealed ? "Sender Revealed" : "Anonymous"}
                    </span>
                    
                    {selectedMessage.liked && (
                      <span className="flex items-center gap-2 bg-pink-500/20 px-3 py-1.5 border border-pink-500/50 rounded-full text-pink-400 text-sm">
                        <Heart size={14} fill="currentColor" />
                        Liked
                      </span>
                    )}
                    
                    {selectedMessage.isRevealed && selectedMessage.sender?.plan === "premium" && (
                      <span className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 px-3 py-1.5 rounded-full text-white text-sm">
                        <Crown size={14} />
                        Premium Sender
                      </span>
                    )}
                    
                    {selectedMessage.isRevealed && selectedMessage.sender?.plan === "pro" && (
                      <span className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 px-3 py-1.5 rounded-full text-white text-sm">
                        <Zap size={14} />
                        Pro Sender
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Hash size={14} />
                    <span>ID: {selectedMessage._id?.slice(-8)}</span>
                  </div>
                </div>

                <div className="bg-white/5 mb-6 p-6 border border-white/10 rounded-xl">
                  <div className="flex items-center gap-2 mb-4 text-purple-400">
                    <MessageCircle size={18} />
                    <span className="font-semibold">Message Content</span>
                  </div>
                  <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                    {selectedMessage.content || "No content"}
                  </p>
                </div>

                {selectedMessage.isRevealed && selectedMessage.sender ? (
                  <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 mb-6 p-6 border border-green-500/30 rounded-xl">
                    <div className="flex items-center gap-2 mb-4 text-green-400">
                      <User size={18} />
                      <span className="font-semibold">Sender Information</span>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {selectedMessage.sender.profilePic ? (
                          <img
                            key={`modal-img-${selectedMessage._id}`}
                            src={getImageUrl(selectedMessage.sender.profilePic)}
                            alt={selectedMessage.sender.firstName}
                            className="border-2 border-green-500 rounded-full w-16 h-16 object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                              const fallback = e.target.parentElement?.querySelector('.modal-fallback');
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="flex justify-center items-center bg-gradient-to-br from-green-500 to-emerald-500 rounded-full w-16 h-16 modal-fallback" style={{ display: selectedMessage.sender.profilePic ? 'none' : 'flex' }}>
                          <User size={32} />
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-bold text-green-400 text-xl">
                          {selectedMessage.sender.firstName} {selectedMessage.sender.lastName || ""}
                        </h3>
                        
                        <div className="space-y-1 mt-2 text-sm">
                          {selectedMessage.sender.username && (
                            <div className="flex items-center gap-2 text-gray-300">
                              <AtSign size={14} className="text-gray-500" />
                              <span>@{selectedMessage.sender.username}</span>
                            </div>
                          )}
                          {selectedMessage.sender.email && (
                            <div className="flex items-center gap-2 text-gray-300">
                              <Mail size={14} className="text-gray-500" />
                              <span>{selectedMessage.sender.email}</span>
                            </div>
                          )}
                          {selectedMessage.sender.plan && (
                            <div className="flex items-center gap-2 text-gray-300">
                              <Crown size={14} className="text-yellow-500" />
                              <span className="capitalize">{selectedMessage.sender.plan} Member</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-500/10 mb-6 p-6 border border-yellow-500/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="flex justify-center items-center bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full w-12 h-12">
                        <Lock size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-yellow-400">Anonymous Sender</p>
                        <p className="mt-1 text-gray-400 text-sm">
                          {user?.plan === "premium" 
                            ? "Click the Reveal button to see who sent this message" 
                            : user?.plan === "pro"
                            ? `Reveal sender for ${REVEAL_COST} coins`
                            : "Upgrade to Premium or Pro to reveal the sender"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-white/5 mb-6 p-6 border border-white/10 rounded-xl">
                  <div className="flex items-center gap-2 mb-4 text-gray-400">
                    <Clock size={18} />
                    <span className="font-semibold">Message Details</span>
                  </div>
                  <div className="gap-4 grid grid-cols-2 text-sm">
                    <div>
                      <p className="text-gray-500">Sent</p>
                      <p className="text-gray-300">{formatFullDate(selectedMessage.createdAt)}</p>
                    </div>
                    {selectedMessage.revealedAt && (
                      <div>
                        <p className="text-gray-500">Revealed</p>
                        <p className="text-gray-300">{formatFullDate(selectedMessage.revealedAt)}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-500">Message Length</p>
                      <p className="text-gray-300">{selectedMessage.content?.length || 0} characters</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Quality Score</p>
                      <p className="text-gray-300">
                        {selectedMessage.content?.length > 200 ? "Excellent" : selectedMessage.content?.length > 100 ? "Good" : "Short"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCopy(selectedMessage.content, selectedMessage._id)}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all duration-200"
                  >
                    {copiedId === selectedMessage._id ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                    {copiedId === selectedMessage._id ? "Copied" : "Copy Message"}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleLike(selectedMessage._id)}
                    disabled={likingId === selectedMessage._id}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                      selectedMessage.liked
                        ? "bg-pink-500/20 text-pink-400"
                        : "bg-white/10 hover:bg-white/20"
                    } disabled:opacity-50`}
                  >
                    {likingId === selectedMessage._id ? (
                      <div className="border-2 border-pink-400 border-t-transparent rounded-full w-5 h-5 animate-spin" />
                    ) : (
                      <Heart size={18} fill={selectedMessage.liked ? "currentColor" : "none"} />
                    )}
                    {selectedMessage.liked ? "Liked" : "Like"}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleDelete(selectedMessage._id)}
                    className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 px-4 py-2 rounded-lg text-red-400 transition-all duration-200"
                  >
                    <Trash2 size={18} />
                    Delete
                  </motion.button>

                  {!selectedMessage.isRevealed && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleReveal(selectedMessage._id)}
                      disabled={!canReveal() || revealingId === selectedMessage._id}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                        canReveal()
                          ? "bg-purple-500/10 hover:bg-purple-500/20 text-purple-400"
                          : "bg-gray-500/10 text-gray-500 cursor-not-allowed"
                      } disabled:opacity-50`}
                    >
                      {revealingId === selectedMessage._id ? (
                        <div className="border-2 border-purple-400 border-t-transparent rounded-full w-5 h-5 animate-spin" />
                      ) : (
                        <Eye size={18} />
                      )}
                      Reveal Sender
                      {user?.plan === "pro" && !selectedMessage.isRevealed && (
                        <span className="ml-1 text-xs">({REVEAL_COST})</span>
                      )}
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ad Modal */}
      <AnimatePresence>
        {showAdModal && (
          <AdModal
            onClose={() => setShowAdModal(false)}
            onCoinsEarned={handleCoinsEarned}
          />
        )}
      </AnimatePresence>
    </div>
  );
}