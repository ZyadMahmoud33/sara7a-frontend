import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getMyMessagesAPI } from "../api/message";
import {
  MessageCircle,
  Inbox as InboxIcon,
  Search,
  Filter,
  Calendar,
  Eye,
  Lock,
  Heart,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Star,
  Clock
} from "lucide-react";

export default function Inbox() {
  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState(null);
  const [likedMessages, setLikedMessages] = useState(new Set());
  const [stats, setStats] = useState({
    total: 0,
    revealed: 0,
    anonymous: 0,
    liked: 0,
  });

  const ITEMS_PER_PAGE = 8;

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getMyMessagesAPI();
      const messagesData = Array.isArray(data) ? data : [];

      // Sort by newest first
      const sortedData = [...messagesData].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );

      setMessages(sortedData);

      // Calculate stats
      const revealed = sortedData.filter(m => m.isRevealed).length;
      const liked = likedMessages.size;
      
      setStats({
        total: sortedData.length,
        revealed: revealed,
        anonymous: sortedData.length - revealed,
        liked: liked,
      });

    } catch (err) {
      console.error("Inbox error:", err);
      const status = err?.response?.status;

      if (status === 403) {
        setError("Access denied. You don't have permission.");
      } else if (status === 429) {
        setError("Too many requests. Please wait a moment.");
      } else if (status === 401) {
        setError("Please login to continue.");
      } else {
        setError("Failed to load messages. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [likedMessages.size]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Filter and search messages
  useEffect(() => {
    let filtered = [...messages];

    // Apply filter
    if (filter === "revealed") {
      filtered = filtered.filter(m => m.isRevealed);
    } else if (filter === "anonymous") {
      filtered = filtered.filter(m => !m.isRevealed);
    } else if (filter === "liked") {
      filtered = filtered.filter(m => likedMessages.has(m._id));
    }

    // Apply search
    if (search.trim()) {
      filtered = filtered.filter(m =>
        m.content?.toLowerCase().includes(search.toLowerCase()) ||
        (m.isRevealed && m.senderId?.firstName?.toLowerCase().includes(search.toLowerCase()))
      );
    }

    setFilteredMessages(filtered);
    setCurrentPage(1);
  }, [messages, filter, search, likedMessages]);

  // Handle like
  const handleLike = (id) => {
    setLikedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Handle copy message
  const handleCopy = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchMessages();
  };

  // Pagination
  const totalPages = Math.ceil(filteredMessages.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedMessages = filteredMessages.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const getMessageStats = () => {
    const totalChars = filteredMessages.reduce((sum, msg) => sum + (msg.content?.length || 0), 0);
    const avgLength = filteredMessages.length > 0 ? Math.round(totalChars / filteredMessages.length) : 0;
    return { totalChars, avgLength };
  };

  const { totalChars, avgLength } = getMessageStats();

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center bg-gradient-to-br from-gray-900 via-black to-gray-900 min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="mb-4"
        >
          <MessageCircle size={48} className="text-purple-500" />
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-gray-400"
        >
          Loading your messages...
        </motion.p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center bg-gradient-to-br from-gray-900 via-black to-gray-900 min-h-screen">
        <div className="mx-auto p-6 max-w-md text-center">
          <AlertCircle size={64} className="mx-auto mb-4 text-red-400" />
          <p className="mb-4 text-red-400 text-lg">{error}</p>
          <button
            onClick={handleRefresh}
            className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2 rounded-lg font-semibold hover:scale-105 transition-all duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 min-h-screen text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="-top-40 -right-40 absolute bg-purple-600 opacity-20 blur-3xl rounded-full w-80 h-80 animate-pulse mix-blend-multiply filter"></div>
        <div className="-bottom-40 -left-40 absolute bg-blue-600 opacity-20 blur-3xl rounded-full w-80 h-80 animate-pulse delay-1000 mix-blend-multiply filter"></div>
        <div className="top-1/2 left-1/2 absolute bg-pink-600 opacity-10 blur-3xl rounded-full w-96 h-96 -translate-x-1/2 -translate-y-1/2 animate-pulse delay-2000 transform mix-blend-multiply filter"></div>
      </div>

      <div className="z-10 relative mx-auto p-6 lg:p-8 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white/5 shadow-2xl backdrop-blur-xl mb-8 p-6 border border-white/10 rounded-2xl"
        >
          <div className="flex lg:flex-row flex-col justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2 rounded-xl">
                <MessageCircle size={28} />
              </div>
              <div>
                <h1 className="bg-clip-text bg-gradient-to-r from-white to-gray-400 font-bold text-transparent text-3xl">
                  My Inbox
                </h1>
                <p className="text-gray-400 text-sm">
                  {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''} in your inbox
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-all duration-200"
              >
                <RefreshCw size={18} />
                Refresh
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="gap-4 grid grid-cols-2 lg:grid-cols-4 mb-8"
        >
          {[
            { label: "Total Messages", value: stats.total, icon: InboxIcon, color: "from-blue-500 to-cyan-500" },
            { label: "Revealed", value: stats.revealed, icon: Eye, color: "from-green-500 to-emerald-500" },
            { label: "Anonymous", value: stats.anonymous, icon: Lock, color: "from-yellow-500 to-orange-500" },
            { label: "Liked", value: stats.liked, icon: Heart, color: "from-pink-500 to-rose-500" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className={`bg-gradient-to-br ${stat.color} p-5 rounded-2xl shadow-xl cursor-pointer`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-white/80 text-sm">{stat.label}</p>
                  <p className="mt-1 font-bold text-2xl">{stat.value}</p>
                </div>
                <stat.icon size={24} className="text-white/50" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-xl mb-8 p-6 border border-white/10 rounded-2xl"
        >
          <div className="flex lg:flex-row flex-col gap-4">
            <div className="relative flex-1">
              <Search size={18} className="top-1/2 left-3 absolute text-gray-400 -translate-y-1/2 transform" />
              <input
                type="text"
                placeholder="Search by message content or sender name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-black/40 py-3 pr-4 pl-10 border border-white/10 focus:border-purple-500 rounded-xl focus:outline-none w-full transition-all duration-200"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {[
              { value: "all", label: "All Messages", icon: MessageCircle },
              { value: "revealed", label: "Revealed", icon: Eye },
              { value: "anonymous", label: "Anonymous", icon: Lock },
              { value: "liked", label: "Liked", icon: Heart },
            ].map((type) => (
              <button
                key={type.value}
                onClick={() => setFilter(type.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
                  filter === type.value
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                    : "bg-white/10 hover:bg-white/20"
                }`}
              >
                <type.icon size={14} />
                {type.label}
              </button>
            ))}
          </div>

          {/* Message Insights */}
          {filteredMessages.length > 0 && (
            <div className="bg-purple-500/10 mt-4 p-3 border border-purple-500/30 rounded-lg">
              <div className="flex flex-wrap justify-between items-center gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-purple-400" />
                  <span>Message Insights:</span>
                </div>
                <div className="flex gap-4 text-gray-300 text-xs">
                  <span>📊 {filteredMessages.length} messages</span>
                  <span>📝 {totalChars.toLocaleString()} characters</span>
                  <span>📏 Avg. {avgLength} chars/message</span>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Messages List */}
        {filteredMessages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/5 backdrop-blur-xl p-12 border border-white/10 rounded-2xl text-center"
          >
            <InboxIcon size={64} className="mx-auto mb-4 text-gray-600" />
            <p className="mb-2 text-gray-400 text-xl">No messages found</p>
            <p className="text-gray-500">
              {search || filter !== "all" 
                ? "Try adjusting your search or filters" 
                : "Share your profile link to receive anonymous messages"}
            </p>
          </motion.div>
        ) : (
          <>
            <div className="space-y-4">
              <AnimatePresence>
                {paginatedMessages.map((msg, index) => (
                  <motion.div
                    key={msg._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.01 }}
                    className="group bg-gradient-to-r from-white/5 to-transparent backdrop-blur-xl border border-white/10 hover:border-purple-500/50 rounded-xl transition-all duration-300"
                  >
                    <div className="p-5">
                      {/* Header */}
                      <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="bg-white/5 px-2 py-1 rounded-lg text-gray-500 text-xs">
                            #{startIndex + index + 1}
                          </span>
                          <span className="flex items-center gap-1 text-gray-500 text-xs">
                            <Calendar size={12} />
                            {new Date(msg.createdAt).toLocaleDateString()} at {new Date(msg.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                              msg.isRevealed
                                ? "bg-green-500/20 text-green-400 border border-green-500/50"
                                : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50"
                            }`}
                          >
                            {msg.isRevealed ? <Eye size={12} /> : <Lock size={12} />}
                            {msg.isRevealed ? "Revealed" : "Anonymous"}
                          </span>
                          
                          {likedMessages.has(msg._id) && (
                            <span className="flex items-center gap-1 bg-pink-500/20 px-2 py-1 rounded-full text-pink-400 text-xs">
                              <Heart size={12} fill="currentColor" />
                              Liked
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="mb-4">
                        <p className="text-gray-200 leading-relaxed">
                          "{msg.content || "No content"}"
                        </p>
                      </div>

                      {/* Sender Info */}
                      <div className="bg-white/5 mb-4 p-3 rounded-lg">
                        {msg.isRevealed && msg.senderId ? (
                          <div className="flex items-center gap-3">
                            <div className="flex justify-center items-center bg-gradient-to-br from-green-500 to-emerald-500 rounded-full w-8 h-8">
                              <Eye size={14} />
                            </div>
                            <div>
                              <p className="font-medium text-green-400">
                                {msg.senderId.firstName} {msg.senderId.lastName || ""}
                              </p>
                              <p className="text-gray-500 text-xs">{msg.senderId.email}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="flex justify-center items-center bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full w-8 h-8">
                              <Lock size={14} />
                            </div>
                            <div>
                              <p className="font-medium text-yellow-400">Anonymous Sender</p>
                              <p className="text-gray-500 text-xs">Identity hidden</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 pt-3 border-white/10 border-t">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleCopy(msg.content, msg._id)}
                          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg text-sm transition-all duration-200"
                        >
                          {copiedId === msg._id ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                          {copiedId === msg._id ? "Copied" : "Copy"}
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleLike(msg._id)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 text-sm ${
                            likedMessages.has(msg._id)
                              ? "bg-pink-500/20 text-pink-400"
                              : "bg-white/5 hover:bg-white/10"
                          }`}
                        >
                          <Heart size={14} fill={likedMessages.has(msg._id) ? "currentColor" : "none"} />
                          {likedMessages.has(msg._id) ? "Liked" : "Like"}
                        </motion.button>

                        <div className="flex-1"></div>
                        
                        <div className="flex items-center gap-1 text-gray-500 text-xs">
                          <Clock size={12} />
                          {new Date(msg.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 mt-8">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="bg-white/10 hover:bg-white/20 disabled:opacity-50 p-2 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={20} />
                </motion.button>
                
                <div className="flex gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-9 h-9 rounded-lg transition-all duration-200 ${
                          currentPage === pageNum
                            ? "bg-gradient-to-r from-purple-500 to-pink-500"
                            : "bg-white/10 hover:bg-white/20"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="bg-white/10 hover:bg-white/20 disabled:opacity-50 p-2 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={20} />
                </motion.button>
              </div>
            )}

            {/* Message Count Info */}
            <div className="mt-4 text-gray-500 text-sm text-center">
              Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredMessages.length)} of {filteredMessages.length} messages
            </div>
          </>
        )}
      </div>
    </div>
  );
}