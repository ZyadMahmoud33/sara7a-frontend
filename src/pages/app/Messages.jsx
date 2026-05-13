// frontend/src/pages/Messages.jsx
import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  getMyMessagesAPI,
  revealSenderAPI,
  deleteMessageAPI,
  likeMessageAPI,
} from "../../api/message";
import { getProfileAPI } from "../../api/user";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import AdModal from "../../components/AdModal";
import {
  Search, Filter, Eye, Lock, Trash2, Heart, Copy, Check,
  MessageCircle, Calendar, User, TrendingUp, AlertCircle, Crown,
  ChevronDown, ChevronUp, RefreshCw, Inbox, Send, ChevronLeft, ChevronRight,
  Award, Zap, Coins, X, AtSign, Mail, Clock, Hash, Share2, Download,
  Maximize2, Star, Shield, Sparkles
} from "lucide-react";

export default function Messages() {
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [expandedId, setExpandedId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [userPlan, setUserPlan] = useState("free");
  const [userCoins, setUserCoins] = useState(0);
  const [revealingId, setRevealingId] = useState(null);
  const [likingId, setLikingId] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    revealed: 0,
    anonymous: 0,
    liked: 0,
  });

  const ITEMS_PER_PAGE = 8;
  const REVEAL_COST = 5;
  const PRO_MAX_REVEALS = 50;

  // ✅ التحقق من التوكن
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Please login to view your messages");
      navigate("/login");
    }
  }, [navigate]);

  const fetchUserProfile = useCallback(async () => {
    try {
      const userData = await getProfileAPI();
      setUserPlan(userData?.plan || "free");
      setUserCoins(userData?.coins || 0);
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getMyMessagesAPI();
      let messagesData = [];
      if (Array.isArray(data)) messagesData = data;
      else if (data?.messages) messagesData = data.messages;
      else if (data?.data) messagesData = data.data;
      const safeData = [...messagesData].reverse().map((msg) => ({
        ...msg,
        liked: msg.liked ?? false,
      }));
      setMessages(safeData);
      const revealed = safeData.filter((m) => m.isRevealed).length;
      const liked = safeData.filter((m) => m.liked).length;
      setStats({
        total: safeData.length,
        revealed: revealed,
        anonymous: safeData.length - revealed,
        liked: liked,
      });
    } catch (err) {
      console.error("Fetch messages error:", err);
      const status = err?.response?.status;
      if (status === 403) setError("Access denied. You don't have permission.");
      else if (status === 429) setError("Too many requests. Please wait a moment.");
      else if (status === 401) { localStorage.clear(); window.location.href = "/login"; }
      else setError(err?.message || "Failed to load messages. Please try again.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchMessages();
    fetchUserProfile();
  }, [fetchMessages, fetchUserProfile]);

  const refreshMessages = async () => {
    setRefreshing(true);
    await Promise.all([fetchMessages(), fetchUserProfile()]);
    setRefreshing(false);
    toast.success("Messages refreshed!");
    setCurrentPage(1);
  };

  useEffect(() => {
    let result = [...messages];
    if (filterType === "revealed") result = result.filter((m) => m.isRevealed);
    else if (filterType === "anonymous") result = result.filter((m) => !m.isRevealed);
    else if (filterType === "liked") result = result.filter((m) => m.liked);
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter((msg) =>
        msg.content?.toLowerCase().includes(searchLower) ||
        (msg.isRevealed && msg.sender?.firstName?.toLowerCase().includes(searchLower)) ||
        (msg.isRevealed && msg.sender?.lastName?.toLowerCase().includes(searchLower)) ||
        (msg.isRevealed && msg.sender?.username?.toLowerCase().includes(searchLower))
      );
    }
    switch (sortBy) {
      case "newest": result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
      case "oldest": result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); break;
      case "longest": result.sort((a, b) => (b.content?.length || 0) - (a.content?.length || 0)); break;
      case "shortest": result.sort((a, b) => (a.content?.length || 0) - (b.content?.length || 0)); break;
      default: break;
    }
    setFiltered(result);
    setCurrentPage(1);
  }, [search, messages, filterType, sortBy]);

  const canReveal = useCallback(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return false;
    if (userPlan === "premium") return true;
    if (userPlan === "pro" && userCoins >= REVEAL_COST) return true;
    return false;
  }, [userPlan, userCoins]);

  const getRevealMessage = useCallback(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return "Login to reveal sender 🔒";
    if (userPlan === "premium") return "Reveal sender (Unlimited) ✨";
    if (userPlan === "pro") return `Reveal sender (${REVEAL_COST} coins) 💰`;
    return "Upgrade to reveal sender 🔒";
  }, [userPlan]);

  const getRemainingReveals = useCallback(() => {
    if (userPlan === "premium") return "Unlimited ♾️";
    if (userPlan === "pro") {
      const remaining = PRO_MAX_REVEALS - stats.revealed;
      return remaining > 0 ? remaining : 0;
    }
    return 0;
  }, [userPlan, stats.revealed]);

  const getRevealCostDisplay = useCallback(() => {
    if (userPlan === "premium") return "Free ✨";
    if (userPlan === "pro") return `${REVEAL_COST} coins 💰`;
    return "Upgrade required 🔒";
  }, [userPlan]);

  const getUsedReveals = useCallback(() => {
    if (userPlan === "premium") return "Unlimited";
    if (userPlan === "pro") return `${stats.revealed} / ${PRO_MAX_REVEALS}`;
    return `${stats.revealed} / 0`;
  }, [userPlan, stats.revealed]);

  // ✅ Reveal sender with token check
  const handleReveal = async (id) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Please login first to reveal sender 🔒");
      navigate("/login");
      return;
    }
    if (!canReveal()) {
      if (userPlan === "free") toast.error("Premium or Pro plan required! Upgrade to reveal sender 🔒");
      else if (userPlan === "pro" && userCoins < REVEAL_COST) toast.error(`Not enough coins! Need ${REVEAL_COST - userCoins} more coins to reveal sender 💰`);
      return;
    }
    if (userPlan === "pro" && userCoins < REVEAL_COST) {
      toast.error(`Insufficient coins! You have ${userCoins}, need ${REVEAL_COST} coins 💰`);
      return;
    }
    setRevealingId(id);
    try {
      const result = await revealSenderAPI(id);
      const updateMessages = (list) =>
        list.map((msg) =>
          msg._id === id ? { 
            ...msg, 
            isRevealed: true,
            sender: result.data?.sender || result.sender || msg.sender,
            revealedAt: result.data?.revealedAt || result.revealedAt,
            canReveal: false
          } : msg
        );
      setMessages(updateMessages);
      setFiltered(updateMessages);
      if (selectedMessage?._id === id) {
        setSelectedMessage({
          ...selectedMessage,
          isRevealed: true,
          sender: result.data?.sender || result.sender,
          revealedAt: result.data?.revealedAt || result.revealedAt,
          canReveal: false
        });
      }
      if (userPlan === "pro") {
        if (result.data?.remainingCoins !== undefined) setUserCoins(result.data.remainingCoins);
        else if (result.remainingCoins !== undefined) setUserCoins(result.remainingCoins);
        else setUserCoins((prev) => prev - REVEAL_COST);
      }
      setStats((prev) => ({
        ...prev,
        revealed: prev.revealed + 1,
        anonymous: prev.anonymous - 1,
      }));
      const successMsg = userPlan === "premium" ? "Sender revealed successfully! ✨" : `Sender revealed! -${REVEAL_COST} coins 💰`;
      toast.success(result.message || successMsg);
      await fetchUserProfile();
    } catch (err) {
      console.error("Reveal error:", err);
      const errorMsg = err?.response?.data?.message || err?.message;
      const status = err?.response?.status;
      if (status === 400 && errorMsg?.includes("coins")) {
        toast.error(`Not enough coins! Need ${REVEAL_COST} coins to reveal sender 💰`);
        await fetchUserProfile();
      } else if (status === 400 && errorMsg?.includes("already revealed")) {
        toast.error("This sender has already been revealed! 🔓");
        const updateMessages = (list) => list.map((msg) => msg._id === id ? { ...msg, isRevealed: true } : msg);
        setMessages(updateMessages);
        setFiltered(updateMessages);
        if (selectedMessage?._id === id) setSelectedMessage({ ...selectedMessage, isRevealed: true });
      } else if (status === 400 && errorMsg?.includes("guest")) {
        toast.error("This message was sent before login. Sender cannot be revealed. 📝");
      } else if (status === 403) {
        toast.error("You don't have permission to reveal this sender ❌");
      } else if (status === 404) {
        toast.error("Message not found or has been deleted 🗑️");
      } else if (errorMsg?.includes("upgrade")) {
        toast.error(`Upgrade to ${userPlan === "free" ? "Pro or Premium" : "Premium"} to reveal senders 🚀`);
      } else {
        toast.error(errorMsg || "Failed to reveal sender. Please try again.");
      }
    } finally { setRevealingId(null); }
  };

  const handleLike = async (id) => {
    const msg = messages.find((m) => m._id === id);
    if (!msg) return;
    const newLikedState = !msg.liked;
    const updateMessages = (list) => list.map((m) => (m._id === id ? { ...m, liked: newLikedState } : m));
    setMessages(updateMessages);
    setFiltered(updateMessages);
    if (selectedMessage?._id === id) setSelectedMessage({ ...selectedMessage, liked: newLikedState });
    setStats((prev) => ({ ...prev, liked: newLikedState ? prev.liked + 1 : prev.liked - 1 }));
    setLikingId(id);
    try {
      await likeMessageAPI(id);
      toast.success(newLikedState ? "❤️ Liked!" : "💔 Unliked");
    } catch (err) {
      setMessages(updateMessages);
      setFiltered(updateMessages);
      setStats((prev) => ({ ...prev, liked: newLikedState ? prev.liked - 1 : prev.liked + 1 }));
      toast.error("Failed to update like");
    } finally { setLikingId(null); }
  };

  const handleDelete = async (id) => {
    const deletedMsg = messages.find((m) => m._id === id);
    if (!deletedMsg) return;
    const updated = messages.filter((m) => m._id !== id);
    setMessages(updated);
    setFiltered(updated);
    if (selectedMessage?._id === id) { setShowMessageModal(false); setSelectedMessage(null); }
    setStats((prev) => ({
      total: prev.total - 1,
      revealed: deletedMsg.isRevealed ? prev.revealed - 1 : prev.revealed,
      anonymous: !deletedMsg.isRevealed ? prev.anonymous - 1 : prev.anonymous,
      liked: deletedMsg.liked ? prev.liked - 1 : prev.liked,
    }));
    try {
      await deleteMessageAPI(id);
      toast.success("Message moved to trash");
    } catch (err) {
      setMessages(messages);
      setFiltered(filtered);
      setStats({
        total: messages.length,
        revealed: messages.filter((m) => m.isRevealed).length,
        anonymous: messages.filter((m) => !m.isRevealed).length,
        liked: messages.filter((m) => m.liked).length,
      });
      toast.error("Failed to delete message");
    }
  };

  const handleCopy = async (text, id) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
      toast.success("Copied to clipboard!");
    } catch { toast.error("Failed to copy text"); }
  };

  const openMessageModal = (msg) => {
    setSelectedMessage(msg);
    setShowMessageModal(true);
  };

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedMessages = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const getMessageStats = useMemo(() => {
    const totalChars = filtered.reduce((sum, msg) => sum + (msg.content?.length || 0), 0);
    const avgLength = filtered.length > 0 ? Math.round(totalChars / filtered.length) : 0;
    return { totalChars, avgLength };
  }, [filtered]);

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

  const formatFullDate = (date) => new Date(date).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'medium' });
  const truncateText = (text, maxLength = 200) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  if (loading) {
    return (
      <div className={cn('flex', 'flex-col', 'justify-center', 'items-center', 'bg-gradient-to-br', 'from-gray-900', 'via-black', 'to-gray-900', 'min-h-screen')}>
        <motion.div animate={{ rotate: 360, scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} className="mb-4">
          <MessageCircle size={48} className="text-purple-500" />
        </motion.div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-gray-400">Loading messages...</motion.p>
      </div>
    );
  }

  return (
    <div className={cn('bg-gradient-to-br', 'from-gray-900', 'via-black', 'to-gray-900', 'min-h-screen', 'text-white')}>
      {/* Animated Background */}
      <div className={cn('fixed', 'inset-0', 'overflow-hidden', 'pointer-events-none')}>
        <div className={cn('-top-40', '-right-40', 'absolute', 'bg-purple-600', 'opacity-20', 'blur-3xl', 'rounded-full', 'w-80', 'h-80', 'animate-pulse', 'mix-blend-multiply', 'filter')}></div>
        <div className={cn('-bottom-40', '-left-40', 'absolute', 'bg-blue-600', 'opacity-20', 'blur-3xl', 'rounded-full', 'w-80', 'h-80', 'animate-pulse', 'delay-1000', 'mix-blend-multiply', 'filter')}></div>
        <div className={cn('top-1/2', 'left-1/2', 'absolute', 'bg-pink-600', 'opacity-10', 'blur-3xl', 'rounded-full', 'w-96', 'h-96', '-translate-x-1/2', '-translate-y-1/2', 'animate-pulse', 'delay-2000', 'transform', 'mix-blend-multiply', 'filter')}></div>
      </div>

      <div className={cn('z-10', 'relative', 'mx-auto', 'p-6', 'max-w-7xl')}>
        {/* Header */}
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={cn('bg-white/5', 'shadow-2xl', 'backdrop-blur-xl', 'mb-8', 'p-6', 'border', 'border-white/10', 'rounded-2xl')}>
          <div className={cn('flex', 'lg:flex-row', 'flex-col', 'justify-between', 'items-start', 'lg:items-center', 'gap-4')}>
            <div className={cn('flex', 'items-center', 'gap-3')}>
              <div className={cn('bg-gradient-to-br', 'from-purple-500', 'to-pink-500', 'p-2', 'rounded-xl')}><MessageCircle size={28} /></div>
              <div><h1 className={cn('bg-clip-text', 'bg-gradient-to-r', 'from-white', 'to-gray-400', 'font-bold', 'text-transparent', 'text-3xl')}>Message Inbox</h1>
              <p className={cn('text-gray-400', 'text-sm')}>{filtered.length} message{filtered.length !== 1 ? "s" : ""} in your inbox</p></div>
            </div>
            <div className={cn('flex', 'gap-3')}>
              <div className={`px-3 py-1 rounded-full text-sm flex items-center gap-2 ${userPlan === "premium" ? "bg-gradient-to-r from-yellow-500 to-orange-500" : userPlan === "pro" ? "bg-gradient-to-r from-cyan-500 to-blue-500" : "bg-gray-600"}`}>
                {userPlan === "premium" && <Crown size={14} />}
                {userPlan === "pro" && <Zap size={14} />}
                <span className="capitalize">{userPlan}</span>
                {userPlan === "pro" && (<span className={cn('flex', 'items-center', 'gap-1', 'bg-white/20', 'ml-1', 'px-1.5', 'py-0.5', 'rounded', 'text-xs')}><Coins size={10} />{userCoins}</span>)}
              </div>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={refreshMessages} disabled={refreshing} className={cn('flex', 'items-center', 'gap-2', 'bg-white/10', 'hover:bg-white/20', 'px-4', 'py-2', 'rounded-xl', 'transition-all', 'duration-200')}>
                <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} /> Refresh
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cn('gap-4', 'grid', 'grid-cols-2', 'lg:grid-cols-5', 'mb-8')}>
          {[
            { label: "Total Messages", value: stats.total, icon: Inbox, color: "from-blue-500 to-cyan-500" },
            { label: "Revealed", value: stats.revealed, icon: Eye, color: "from-green-500 to-emerald-500" },
            { label: "Anonymous", value: stats.anonymous, icon: Lock, color: "from-yellow-500 to-orange-500" },
            { label: "Liked", value: stats.liked, icon: Heart, color: "from-pink-500 to-rose-500" },
            { label: "Remaining Reveals", value: getRemainingReveals(), icon: Crown, color: "from-purple-500 to-indigo-500" },
          ].map((stat, index) => (
            <motion.div key={stat.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.1 }} whileHover={{ y: -5 }} className={`bg-gradient-to-br ${stat.color} p-5 rounded-2xl shadow-xl cursor-pointer`}>
              <div className={cn('flex', 'justify-between', 'items-start')}>
                <div><p className={cn('font-medium', 'text-white/80', 'text-sm')}>{stat.label}</p><p className={cn('mt-1', 'font-bold', 'text-2xl')}>{stat.value}</p></div>
                <stat.icon size={24} className="text-white/50" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Search and Filters */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={cn('bg-white/5', 'backdrop-blur-xl', 'mb-8', 'p-6', 'border', 'border-white/10', 'rounded-2xl')}>
          <div className={cn('flex', 'lg:flex-row', 'flex-col', 'gap-4')}>
            <div className={cn('relative', 'flex-1')}>
              <Search size={18} className={cn('top-1/2', 'left-3', 'absolute', 'text-gray-400', '-translate-y-1/2', 'transform')} />
              <input type="text" placeholder="Search by message content or sender name..." value={search} onChange={(e) => setSearch(e.target.value)} className={cn('bg-black/40', 'py-3', 'pr-4', 'pl-10', 'border', 'border-white/10', 'focus:border-purple-500', 'rounded-xl', 'focus:outline-none', 'w-full', 'transition-all', 'duration-200')} />
            </div>
            <motion.button whileHover={{ scale: 1.02 }} onClick={() => setShowFilters(!showFilters)} className={cn('flex', 'justify-center', 'items-center', 'gap-2', 'bg-white/10', 'hover:bg-white/20', 'px-5', 'py-3', 'rounded-xl', 'transition-all', 'duration-200')}>
              <Filter size={18} /> Filters {showFilters ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </motion.button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className={cn('mt-4', 'pt-4', 'border-white/10', 'border-t')}>
                <div className={cn('flex', 'sm:flex-row', 'flex-col', 'gap-4')}>
                  <div className="flex-1">
                    <label className={cn('block', 'mb-2', 'font-medium', 'text-gray-300', 'text-sm')}>Filter by Status</label>
                    <div className={cn('flex', 'flex-wrap', 'gap-2')}>
                      {[
                        { value: "all", label: "All Messages", icon: MessageCircle },
                        { value: "revealed", label: "Revealed", icon: Eye },
                        { value: "anonymous", label: "Anonymous", icon: Lock },
                        { value: "liked", label: "Liked", icon: Heart },
                      ].map((type) => (
                        <button key={type.value} onClick={() => setFilterType(type.value)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all duration-200 ${filterType === type.value ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" : "bg-white/10 hover:bg-white/20"}`}>
                          <type.icon size={14} /> {type.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className={cn('block', 'mb-2', 'font-medium', 'text-gray-300', 'text-sm')}>Sort by</label>
                    <div className={cn('flex', 'flex-wrap', 'gap-2')}>
                      {[
                        { value: "newest", label: "Newest First" },
                        { value: "oldest", label: "Oldest First" },
                        { value: "longest", label: "Longest Message" },
                        { value: "shortest", label: "Shortest Message" },
                      ].map((type) => (
                        <button key={type.value} onClick={() => setSortBy(type.value)} className={`px-4 py-2 rounded-lg text-sm transition-all duration-200 ${sortBy === type.value ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-white/10 hover:bg-white/20"}`}>
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {filtered.length > 0 && (
            <div className={cn('bg-purple-500/10', 'mt-4', 'p-3', 'border', 'border-purple-500/30', 'rounded-lg')}>
              <div className={cn('flex', 'flex-wrap', 'justify-between', 'items-center', 'gap-3', 'text-sm')}>
                <div className={cn('flex', 'items-center', 'gap-2')}><TrendingUp size={16} className="text-purple-400" /> Message Insights:</div>
                <div className={cn('flex', 'gap-4', 'text-gray-300', 'text-xs')}>
                  <span>📊 {filtered.length} messages</span>
                  <span>📝 {getMessageStats.totalChars.toLocaleString()} characters</span>
                  <span>📏 Avg. {getMessageStats.avgLength} chars/message</span>
                  {userPlan !== "free" && <span>🔓 {getUsedReveals()} reveals used</span>}
                </div>
              </div>
            </div>
          )}
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={cn('flex', 'items-center', 'gap-3', 'bg-red-500/20', 'mb-6', 'p-4', 'border', 'border-red-500/50', 'rounded-xl')}>
              <AlertCircle size={20} className={cn('flex-shrink-0', 'text-red-400')} /><span className="text-red-400">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {messages.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={cn('bg-white/5', 'backdrop-blur-xl', 'p-12', 'border', 'border-white/10', 'rounded-2xl', 'text-center')}>
            <Inbox size={64} className={cn('mx-auto', 'mb-4', 'text-gray-600')} />
            <p className={cn('mb-2', 'text-gray-400', 'text-xl')}>No messages found</p>
            <p className="text-gray-500">{search || filterType !== "all" ? "Try adjusting your search or filters" : "Share your profile link to receive anonymous messages"}</p>
            {!search && filterType === "all" && (
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { const link = `${window.location.origin}/profile`; navigator.clipboard.writeText(link); toast.success("Profile link copied!"); }} className={cn('inline-flex', 'items-center', 'gap-2', 'bg-gradient-to-r', 'from-purple-500', 'to-pink-500', 'mt-4', 'px-6', 'py-2', 'rounded-xl')}>
                <Send size={18} /> Get Your Profile Link
              </motion.button>
            )}
          </motion.div>
        ) : (
          <>
            <div className={cn('gap-4', 'grid')}>
              <AnimatePresence>
                {paginatedMessages.map((msg, idx) => (
                  <motion.div key={msg._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -100 }} transition={{ delay: idx * 0.05 }} whileHover={{ scale: 1.01 }} onClick={() => openMessageModal(msg)} className={cn('group', 'bg-gradient-to-r', 'from-white/5', 'to-transparent', 'backdrop-blur-xl', 'border', 'border-white/10', 'hover:border-purple-500/50', 'rounded-xl', 'transition-all', 'duration-300', 'cursor-pointer')}>
                    <div className="p-5">
                      <div className={cn('flex', 'flex-wrap', 'justify-between', 'items-start', 'gap-2', 'mb-3')}>
                        <div className={cn('flex', 'flex-wrap', 'items-center', 'gap-2')}>
                          <span className={cn('bg-white/5', 'px-2', 'py-1', 'rounded-lg', 'text-gray-500', 'text-xs')}>#{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</span>
                          <span className={cn('flex', 'items-center', 'gap-1', 'text-gray-500', 'text-xs')}><Calendar size={12} />{formatDate(msg.createdAt)}</span>
                        </div>
                        <div className={cn('flex', 'items-center', 'gap-2')}>
                          <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${msg.isRevealed ? "bg-green-500/20 text-green-400 border border-green-500/50" : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50"}`}>
                            {msg.isRevealed ? <Eye size={12} /> : <Lock size={12} />}{msg.isRevealed ? "Revealed" : "Anonymous"}
                          </span>
                          {msg.liked && (<span className={cn('flex', 'items-center', 'gap-1', 'bg-pink-500/20', 'px-2', 'py-1', 'rounded-full', 'text-pink-400', 'text-xs')}><Heart size={12} fill="currentColor" /> Liked</span>)}
                        </div>
                      </div>
                      <div className="mb-4"><p className={cn('text-gray-200', 'leading-relaxed')}>{truncateText(msg.content, 150)}</p></div>
                      <div className={cn('flex', 'justify-between', 'items-center', 'pt-3', 'border-white/10', 'border-t')}>
                        <div className={cn('flex', 'items-center', 'gap-2')}>
                          {msg.isRevealed && msg.sender ? (
                            <div className={cn('flex', 'items-center', 'gap-2')}>
                              {msg.sender.profilePic ? <img src={msg.sender.profilePic} alt={msg.sender.firstName} className={cn('border', 'border-green-500', 'rounded-full', 'w-6', 'h-6', 'object-cover')} /> : <div className={cn('flex', 'justify-center', 'items-center', 'bg-gradient-to-br', 'from-green-500', 'to-emerald-500', 'rounded-full', 'w-6', 'h-6')}><User size={12} /></div>}
                              <span className={cn('text-green-400', 'text-sm')}>{msg.sender.firstName} {msg.sender.lastName}</span>
                            </div>
                          ) : (
                            <div className={cn('flex', 'items-center', 'gap-2')}><div className={cn('flex', 'justify-center', 'items-center', 'bg-gradient-to-br', 'from-yellow-500', 'to-orange-500', 'rounded-full', 'w-6', 'h-6')}><Lock size={12} /></div><span className={cn('text-yellow-400', 'text-sm')}>Anonymous</span></div>
                          )}
                        </div>
                        <div className={cn('flex', 'items-center', 'gap-1', 'text-gray-500', 'text-xs')}><Maximize2 size={12} /><span>Click to expand</span></div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            {totalPages > 1 && (
              <div className={cn('flex', 'justify-center', 'items-center', 'gap-3', 'mt-8')}>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className={cn('bg-white/10', 'hover:bg-white/20', 'disabled:opacity-50', 'p-2', 'rounded-lg', 'transition-all', 'duration-200', 'disabled:cursor-not-allowed')}><ChevronLeft size={20} /></motion.button>
                <div className={cn('flex', 'gap-2')}>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;
                    return (<button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`w-9 h-9 rounded-lg transition-all duration-200 ${currentPage === pageNum ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-white/10 hover:bg-white/20"}`}>{pageNum}</button>);
                  })}
                </div>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className={cn('bg-white/10', 'hover:bg-white/20', 'disabled:opacity-50', 'p-2', 'rounded-lg', 'transition-all', 'duration-200', 'disabled:cursor-not-allowed')}><ChevronRight size={20} /></motion.button>
              </div>
            )}
            <div className={cn('mt-4', 'text-gray-500', 'text-sm', 'text-center')}>Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} messages</div>
          </>
        )}

        {userPlan === "pro" && userCoins < REVEAL_COST && filtered.some((m) => !m.isRevealed) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cn('bg-yellow-500/20', 'mt-6', 'p-4', 'border', 'border-yellow-500/30', 'rounded-xl')}>
            <div className={cn('flex', 'flex-wrap', 'justify-between', 'items-center', 'gap-4')}>
              <div className={cn('flex', 'items-center', 'gap-3')}><Coins size={24} className="text-yellow-400" /><div><p className="font-semibold">Not enough coins!</p><p className={cn('text-gray-300', 'text-sm')}>You need {REVEAL_COST} coins to reveal a sender. Upgrade to Premium for unlimited reveals!</p></div></div>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => window.location.href = "/premium"} className={cn('bg-gradient-to-r', 'from-purple-500', 'to-pink-500', 'px-6', 'py-2', 'rounded-xl', 'font-bold', 'text-white')}>Upgrade Now</motion.button>
            </div>
          </motion.div>
        )}

        {userPlan === "free" && filtered.some((m) => !m.isRevealed) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cn('bg-gradient-to-r', 'from-purple-500/20', 'to-pink-500/20', 'mt-6', 'p-4', 'border', 'border-purple-500/30', 'rounded-xl')}>
            <div className={cn('flex', 'flex-wrap', 'justify-between', 'items-center', 'gap-4')}>
              <div className={cn('flex', 'items-center', 'gap-3')}><Award size={24} className="text-purple-400" /><div><p className="font-semibold">Unlock Premium Features</p><p className={cn('text-gray-300', 'text-sm')}>Reveal anonymous senders, get more insights, and remove ads!</p></div></div>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => window.location.href = "/premium"} className={cn('bg-gradient-to-r', 'from-yellow-500', 'to-orange-500', 'px-6', 'py-2', 'rounded-xl', 'font-bold', 'text-black')}>Upgrade Now</motion.button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Message Detail Modal */}
      <AnimatePresence>
        {showMessageModal && selectedMessage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={cn('z-50', 'fixed', 'inset-0', 'flex', 'justify-center', 'items-center', 'bg-black/80', 'backdrop-blur-md', 'p-4')} onClick={() => setShowMessageModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className={cn('relative', 'bg-gradient-to-br', 'from-gray-900', 'to-black', 'shadow-2xl', 'border', 'border-purple-500/30', 'rounded-2xl', 'w-full', 'max-w-2xl', 'max-h-[90vh]', 'overflow-y-auto')} onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowMessageModal(false)} className={cn('top-4', 'right-4', 'absolute', 'bg-white/10', 'hover:bg-white/20', 'p-2', 'rounded-lg', 'transition-all', 'duration-200')}><X size={20} /></button>
              <div className="p-6">
                {/* Header Badges */}
                <div className={cn('flex', 'flex-wrap', 'justify-between', 'items-start', 'gap-3', 'mb-6')}>
                  <div className={cn('flex', 'flex-wrap', 'gap-2')}>
                    <span className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${selectedMessage.isRevealed ? "bg-green-500/20 text-green-400 border border-green-500/50" : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50"}`}>
                      {selectedMessage.isRevealed ? <Eye size={14} /> : <Lock size={14} />}{selectedMessage.isRevealed ? "Sender Revealed" : "Anonymous"}
                    </span>
                    {selectedMessage.liked && (<span className={cn('flex', 'items-center', 'gap-2', 'bg-pink-500/20', 'px-3', 'py-1.5', 'border', 'border-pink-500/50', 'rounded-full', 'text-pink-400', 'text-sm')}><Heart size={14} fill="currentColor" /> Liked</span>)}
                    {selectedMessage.isRevealed && selectedMessage.sender?.plan === "premium" && (<span className={cn('flex', 'items-center', 'gap-2', 'bg-gradient-to-r', 'from-yellow-500', 'to-orange-500', 'px-3', 'py-1.5', 'rounded-full', 'text-white', 'text-sm')}><Crown size={14} /> Premium Sender</span>)}
                    {selectedMessage.isRevealed && selectedMessage.sender?.plan === "pro" && (<span className={cn('flex', 'items-center', 'gap-2', 'bg-gradient-to-r', 'from-cyan-500', 'to-blue-500', 'px-3', 'py-1.5', 'rounded-full', 'text-white', 'text-sm')}><Zap size={14} /> Pro Sender</span>)}
                  </div>
                  <div className={cn('flex', 'items-center', 'gap-2', 'text-gray-500', 'text-sm')}><Hash size={14} /><span>ID: {selectedMessage._id?.slice(-8)}</span></div>
                </div>

                {/* Message Content */}
                <div className={cn('bg-white/5', 'mb-6', 'p-6', 'border', 'border-white/10', 'rounded-xl')}>
                  <div className={cn('flex', 'items-center', 'gap-2', 'mb-4', 'text-purple-400')}><MessageCircle size={18} /><span className="font-semibold">Message Content</span></div>
                  <p className={cn('text-gray-200', 'leading-relaxed', 'whitespace-pre-wrap')}>{selectedMessage.content || "No content"}</p>
                </div>

                {/* Sender Info */}
                {selectedMessage.isRevealed && selectedMessage.sender ? (
                  <div className={cn('bg-gradient-to-r', 'from-green-500/10', 'to-emerald-500/10', 'mb-6', 'p-6', 'border', 'border-green-500/30', 'rounded-xl')}>
                    <div className={cn('flex', 'items-center', 'gap-2', 'mb-4', 'text-green-400')}><User size={18} /><span className="font-semibold">Sender Information</span></div>
                    <div className={cn('flex', 'items-start', 'gap-4')}>
                      <div className="flex-shrink-0">
                        {selectedMessage.sender.profilePic ? <img src={selectedMessage.sender.profilePic} alt={selectedMessage.sender.firstName} className={cn('border-2', 'border-green-500', 'rounded-full', 'w-16', 'h-16', 'object-cover')} /> : <div className={cn('flex', 'justify-center', 'items-center', 'bg-gradient-to-br', 'from-green-500', 'to-emerald-500', 'rounded-full', 'w-16', 'h-16')}><User size={32} /></div>}
                      </div>
                      <div className="flex-1">
                        <h3 className={cn('font-bold', 'text-green-400', 'text-xl')}>{selectedMessage.sender.firstName} {selectedMessage.sender.lastName || ""}</h3>
                        <div className={cn('space-y-1', 'mt-2', 'text-sm')}>
                          {selectedMessage.sender.username && (<div className={cn('flex', 'items-center', 'gap-2', 'text-gray-300')}><AtSign size={14} className="text-gray-500" /><span>@{selectedMessage.sender.username}</span></div>)}
                          {selectedMessage.sender.email && (<div className={cn('flex', 'items-center', 'gap-2', 'text-gray-300')}><Mail size={14} className="text-gray-500" /><span>{selectedMessage.sender.email}</span></div>)}
                          {selectedMessage.sender.plan && (<div className={cn('flex', 'items-center', 'gap-2', 'text-gray-300')}><Crown size={14} className="text-yellow-500" /><span className="capitalize">{selectedMessage.sender.plan} Member</span></div>)}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={cn('bg-yellow-500/10', 'mb-6', 'p-6', 'border', 'border-yellow-500/30', 'rounded-xl')}>
                    <div className={cn('flex', 'items-center', 'gap-3')}>
                      <div className={cn('flex', 'justify-center', 'items-center', 'bg-gradient-to-br', 'from-yellow-500', 'to-orange-500', 'rounded-full', 'w-12', 'h-12')}><Lock size={20} /></div>
                      <div className="flex-1"><p className={cn('font-semibold', 'text-yellow-400')}>Anonymous Sender</p><p className={cn('mt-1', 'text-gray-400', 'text-sm')}>{userPlan === "premium" ? "Click the Reveal button to see who sent this message" : userPlan === "pro" ? `Reveal sender for ${REVEAL_COST} coins` : "Upgrade to Premium or Pro to reveal the sender"}</p></div>
                    </div>
                  </div>
                )}

                {/* Coins Section */}
                {!selectedMessage.isRevealed && (
                  <div className={cn('bg-yellow-500/10', 'mb-4', 'p-3', 'border', 'border-yellow-500/30', 'rounded-lg')}>
                    <div className={cn('flex', 'justify-between', 'items-center')}>
                      <div className={cn('flex', 'items-center', 'gap-2')}><Coins size={18} className="text-yellow-400" /><span className={cn('font-semibold', 'text-yellow-400', 'text-sm')}>🪙 Reveal Cost: {REVEAL_COST} Coins</span></div>
                      {userPlan === "pro" && (<div className={cn('flex', 'items-center', 'gap-1', 'bg-white/10', 'px-2', 'py-1', 'rounded-lg')}><Coins size={14} className="text-yellow-400" /><span className={cn('font-bold', 'text-white', 'text-sm')}>{userCoins}</span><span className={cn('text-gray-400', 'text-xs')}>available</span></div>)}
                      {userPlan === "premium" && (<div className={cn('flex', 'items-center', 'gap-1', 'bg-purple-500/20', 'px-2', 'py-1', 'rounded-lg')}><Crown size={14} className="text-purple-400" /><span className={cn('font-semibold', 'text-purple-400', 'text-sm')}>✨ Unlimited</span></div>)}
                    </div>
                    {userPlan === "pro" && userCoins < REVEAL_COST && (<div className={cn('flex', 'items-center', 'gap-2', 'mt-2', 'text-yellow-400', 'text-xs')}><AlertCircle size={12} /><span>⚠️ Not enough coins! Watch ads or upgrade to Premium</span></div>)}
                    {userPlan === "free" && (<div className={cn('flex', 'items-center', 'gap-2', 'mt-2', 'text-purple-400', 'text-xs')}><Crown size={12} /><span>🔒 Upgrade to Pro or Premium to reveal senders</span></div>)}
                  </div>
                )}

                {/* Message Details */}
                <div className={cn('bg-white/5', 'mb-6', 'p-6', 'border', 'border-white/10', 'rounded-xl')}>
                  <div className={cn('flex', 'items-center', 'gap-2', 'mb-4', 'text-gray-400')}><Clock size={18} /><span className="font-semibold">Message Details</span></div>
                  <div className={cn('gap-4', 'grid', 'grid-cols-2', 'text-sm')}>
                    <div><p className="text-gray-500">Sent</p><p className="text-gray-300">{formatFullDate(selectedMessage.createdAt)}</p></div>
                    {selectedMessage.revealedAt && (<div><p className="text-gray-500">Revealed</p><p className="text-gray-300">{formatFullDate(selectedMessage.revealedAt)}</p></div>)}
                    <div><p className="text-gray-500">Message Length</p><p className="text-gray-300">{selectedMessage.content?.length || 0} characters</p></div>
                    <div><p className="text-gray-500">Quality Score</p><p className="text-gray-300">{selectedMessage.content?.length > 200 ? "Excellent" : selectedMessage.content?.length > 100 ? "Good" : "Short"}</p></div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className={cn('flex', 'flex-wrap', 'gap-3')}>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleCopy(selectedMessage.content, selectedMessage._id)} className={cn('flex', 'items-center', 'gap-2', 'bg-white/10', 'hover:bg-white/20', 'px-4', 'py-2', 'rounded-lg', 'transition-all', 'duration-200')}>
                    {copiedId === selectedMessage._id ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}{copiedId === selectedMessage._id ? "Copied" : "Copy Message"}
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleLike(selectedMessage._id)} disabled={likingId === selectedMessage._id} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${selectedMessage.liked ? "bg-pink-500/20 text-pink-400" : "bg-white/10 hover:bg-white/20"} disabled:opacity-50`}>
                    {likingId === selectedMessage._id ? (<div className={cn('border-2', 'border-pink-400', 'border-t-transparent', 'rounded-full', 'w-5', 'h-5', 'animate-spin')} />) : (<Heart size={18} fill={selectedMessage.liked ? "currentColor" : "none"} />)}{selectedMessage.liked ? "Liked" : "Like"}
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleDelete(selectedMessage._id)} className={cn('flex', 'items-center', 'gap-2', 'bg-red-500/10', 'hover:bg-red-500/20', 'px-4', 'py-2', 'rounded-lg', 'text-red-400', 'transition-all', 'duration-200')}><Trash2 size={18} /> Delete</motion.button>
                  {!selectedMessage.isRevealed && userPlan === "pro" && userCoins < REVEAL_COST && (
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { setShowAdModal(true); setShowMessageModal(false); }} className={cn('flex', 'items-center', 'gap-2', 'bg-yellow-500/10', 'hover:bg-yellow-500/20', 'px-4', 'py-2', 'rounded-lg', 'text-yellow-400', 'transition-all', 'duration-200')}>
                      <Coins size={18} /> Watch Ad (+5 coins)
                    </motion.button>
                  )}
                  {!selectedMessage.isRevealed && userPlan === "free" && (
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => navigate("/premium")} className={cn('flex', 'items-center', 'gap-2', 'bg-purple-500/10', 'hover:bg-purple-500/20', 'px-4', 'py-2', 'rounded-lg', 'text-purple-400', 'transition-all', 'duration-200')}>
                      <Crown size={18} /> Upgrade to Reveal
                    </motion.button>
                  )}
                  {!selectedMessage.isRevealed && (
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleReveal(selectedMessage._id)} disabled={!canReveal() || revealingId === selectedMessage._id} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${canReveal() ? "bg-purple-500/10 hover:bg-purple-500/20 text-purple-400" : "bg-gray-500/10 text-gray-500 cursor-not-allowed"} disabled:opacity-50`}>
                      {revealingId === selectedMessage._id ? (<div className={cn('border-2', 'border-purple-400', 'border-t-transparent', 'rounded-full', 'w-5', 'h-5', 'animate-spin')} />) : (<Eye size={18} />)} Reveal Sender{userPlan === "pro" && !selectedMessage.isRevealed && (<span className={cn('ml-1', 'text-xs')}>({REVEAL_COST})</span>)}
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
        {showAdModal && <AdModal onClose={() => setShowAdModal(false)} onCoinsEarned={(newCoins, dailyWatched) => { setUserCoins(newCoins); fetchUserProfile(); toast.success(`You now have ${newCoins} coins! 🎉`); }} />}
      </AnimatePresence>
    </div>
  );
}