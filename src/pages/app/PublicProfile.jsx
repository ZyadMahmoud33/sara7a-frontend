// frontend/src/pages/app/PublicProfile.jsx
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sendMessageAPI } from "../../api/message";
import { getUserByIdAPI, getUserByUsernameAPI } from "../../api/user";
import toast from "react-hot-toast";
import {
  User,
  Send,
  Copy,
  Check,
  Lock,
  Shield,
  AlertCircle,
  MessageCircle,
  Heart,
  Calendar,
  CheckCircle,
  ArrowLeft,
  Sparkles,
  LogIn,
} from "lucide-react";

export default function PublicProfile() {
  const { userId, username } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState(null);
  const [avatarError, setAvatarError] = useState(false);
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [focused, setFocused] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [messageSent, setMessageSent] = useState(false);

  const textareaRef = useRef(null);

  const maxLength = 500;
  const minLength = 2;

  // ✅ التحقق من حالة تسجيل الدخول
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  // =========================
  // 👤 GET USER (by ID or Username)
  // =========================
  useEffect(() => {
    let isMounted = true;

    const fetchUser = async () => {
  try {
    const identifier = userId || username;
    
    if (!identifier || identifier === "undefined" || identifier === "null") {
      throw new Error("Invalid profile link");
    }

    setLoadingUser(true);
    setError(null);
    setMessageSent(false);
    setAvatarError(false);

    let userData = null;
    
    if (userId) {
      try {
        const res = await getUserByIdAPI(identifier);
        userData = res?.user ||           
                   res?.data?.user ||     
                   res?.data?.data?.user || 
                   res?.data?.data ||     
                   res?.data ||           
                   res;                   
      } catch (err) {
        console.log("Fetch by ID failed:", err.message);
        if (username) {
          const res = await getUserByUsernameAPI(username);
          userData = res?.user ||
                     res?.data?.user ||
                     res?.data?.data?.user ||
                     res?.data?.data ||
                     res?.data ||
                     res;
        } else {
          throw err;
        }
      }
    } 
    else if (username) {
      const res = await getUserByUsernameAPI(identifier);
      userData = res?.user ||
                 res?.data?.user ||
                 res?.data?.data?.user ||
                 res?.data?.data ||
                 res?.data ||
                 res;
    }

    if (!userData) {
      throw new Error("No data received from API");
    }
    
    const userId_field = userData._id || userData.id;
    if (!userId_field) {
      throw new Error("User not found - missing ID");
    }

    if (userData.freezedAt) {
      throw new Error("This account is currently unavailable");
    }

    if (isMounted) {
      // ✅ تصحيح مسار الصورة
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      let profilePicUrl = userData?.profilePic || null;
      
      if (profilePicUrl && profilePicUrl.startsWith('/uploads')) {
        profilePicUrl = `${baseUrl}${profilePicUrl}`;
      }
      
      setUser({
        ...userData,
        profilePic: profilePicUrl
      });
      
      // ✅ استعادة الرسالة المعلقة بعد تسجيل الدخول
      const pendingMessage = localStorage.getItem("pendingMessage");
      const pendingReceiverId = localStorage.getItem("pendingReceiverId");
      
      if (pendingMessage && pendingReceiverId === userData._id) {
        setContent(pendingMessage);
        localStorage.removeItem("pendingMessage");
        localStorage.removeItem("pendingReceiverId");
        toast.success("Your message has been restored! ✨");
        setTimeout(() => textareaRef.current?.focus(), 500);
      }
    }

  } catch (err) {
    console.error("Fetch user error:", err);
    setError(err.message || "User not found");
    toast.error(err.message || "User not found ❌");
    if (isMounted) setUser(null);
  } finally {
    if (isMounted) setLoadingUser(false);
  }
};
  fetchUser();


    return () => {
      isMounted = false;
    };
  }, [userId, username]);

  // Update char count
  useEffect(() => {
    setCharCount(content.length);
  }, [content]);

  // Reset message sent state after 3 seconds
  useEffect(() => {
    if (messageSent) {
      const timer = setTimeout(() => {
        setMessageSent(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [messageSent]);

  // =========================
  // 🚀 SEND MESSAGE
  // =========================
  const handleSend = async () => {
    if (sending) return;

    const identifier = userId || username;
    if (!identifier || identifier === "undefined" || identifier === "null") {
      return toast.error("Invalid profile link ❌");
    }

    if (!user) {
      return toast.error("User not found ❌");
    }

    const text = content.trim();

    if (!text) {
      toast.error("Please write a message first 💬");
      textareaRef.current?.focus();
      return;
    }

    if (text.length < minLength) {
      toast.error(`Message must be at least ${minLength} characters ❌`);
      textareaRef.current?.focus();
      return;
    }

    if (text.length > maxLength) {
      toast.error(`Message too long (max ${maxLength} characters) ❌`);
      return;
    }

    // ✅ التحقق من تسجيل الدخول قبل الإرسال
    if (!isLoggedIn) {
      // حفظ الرسالة في localStorage
      localStorage.setItem("pendingMessage", text);
      localStorage.setItem("pendingReceiverId", user._id);
      localStorage.setItem("redirectAfterLogin", window.location.pathname);
      setShowLoginModal(true);
      return;
    }

    // ✅ إرسال الرسالة (المستخدم مسجل دخول)
    await sendMessage(text);
  };

  // ✅ دالة إرسال الرسالة الفعلية
  const sendMessage = async (text) => {
    try {
      setSending(true);

      await sendMessageAPI(user._id, text);

      setContent("");
      setCharCount(0);
      setMessageSent(true);
      
      toast.success("✨ Message sent successfully! Redirecting to dashboard...");
      
      // ✅ بعد إرسال الرسالة، اذهب إلى Dashboard
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);

    } catch (err) {
      console.error("Send message error:", err);
      
      const errorMessage = err?.response?.data?.message || err?.message || "Failed to send message ❌";
      toast.error(errorMessage);
      
      if (err?.response?.status === 403) {
        toast.error("This user has disabled anonymous messages");
      }
      if (err?.response?.status === 429) {
        toast.error("Too many requests. Please wait a moment.");
      }
    } finally {
      setSending(false);
    }
  };

  // ✅ التوجيه إلى صفحة تسجيل الدخول
  const redirectToLogin = () => {
    setShowLoginModal(false);
    navigate("/login");
  };

  // =========================
  // 📋 COPY LINK
  // =========================
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Profile link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link ❌");
    }
  };

  // =========================
  // ⌨️ HANDLE KEYBOARD
  // =========================
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  // =========================
  // ⏳ LOADING
  // =========================
  if (loadingUser) {
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
          transition={{ duration: 0.5 }}
          className="text-gray-400"
        >
          Loading profile...
        </motion.p>
      </div>
    );
  }

  // =========================
  // ❌ ERROR / NOT FOUND
  // =========================
  if (error || !user) {
    return (
      <div className="flex flex-col justify-center items-center bg-gradient-to-br from-gray-900 via-black to-gray-900 min-h-screen">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
        >
          <Shield size={64} className="mb-4 text-red-500" />
        </motion.div>
        <h1 className="mb-2 font-bold text-2xl">Profile Not Found</h1>
        <p className="mb-6 text-gray-400">{error || "The profile you're looking for doesn't exist."}</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/")}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2 rounded-xl font-semibold"
        >
          <ArrowLeft size={18} />
          Go Home
        </motion.button>
      </div>
    );
  }

  return (
    <div className="relative flex justify-center items-center bg-gradient-to-br from-gray-900 via-black to-gray-900 min-h-screen overflow-hidden">
      
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="-top-40 -right-40 absolute bg-purple-600 opacity-20 blur-3xl rounded-full w-80 h-80 animate-pulse mix-blend-multiply filter"></div>
        <div className="-bottom-40 -left-40 absolute bg-blue-600 opacity-20 blur-3xl rounded-full w-80 h-80 animate-pulse delay-1000 mix-blend-multiply filter"></div>
        <div className="top-1/2 left-1/2 absolute bg-pink-600 opacity-10 blur-3xl rounded-full w-96 h-96 -translate-x-1/2 -translate-y-1/2 animate-pulse delay-2000 transform mix-blend-multiply filter"></div>
      </div>

      {/* Login Required Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="z-50 fixed inset-0 flex justify-center items-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setShowLoginModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-gradient-to-br from-gray-900 to-black shadow-2xl p-6 border border-purple-500/30 rounded-2xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-full">
                    <LogIn size={32} className="text-white" />
                  </div>
                </div>
                <h2 className="mb-2 font-bold text-2xl">Login Required</h2>
                <p className="mb-4 text-gray-400">
                  You need to be logged in to send anonymous messages.
                </p>
                <div className="bg-yellow-500/10 mb-6 p-3 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-400 text-sm">
                    <AlertCircle size={16} />
                    <span>Your message has been saved and will be restored after login!</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowLoginModal(false)}
                    className="flex-1 bg-white/10 hover:bg-white/20 py-2 rounded-xl font-medium transition-all duration-200"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={redirectToLogin}
                    className="flex-1 bg-gradient-to-r from-purple-500 hover:from-purple-600 to-pink-500 hover:to-pink-600 py-2 rounded-xl font-semibold transition-all duration-200"
                  >
                    Login Now
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="z-10 relative mx-auto p-6 w-full max-w-lg"
      >
        <div className="bg-white/5 shadow-2xl backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
          
          {/* Avatar Section */}
          <div className="relative bg-gradient-to-br from-purple-600 to-pink-600 p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-flex justify-center items-center bg-white/20 backdrop-blur-sm mx-auto mb-4 border-4 border-white/30 rounded-full w-24 h-24 overflow-hidden"
            >
             {user?.profilePic && !avatarError ? (
  <img 
    src={user.profilePic} 
    alt={user.firstName} 
    className="w-full h-full object-cover"
    onError={(e) => {
      console.error("Image failed to load:", user.profilePic);
      setAvatarError(true);
      e.target.style.display = 'none';
    }}
    onLoad={() => console.log("Image loaded:", user.profilePic)}
  />
) : (
  <div className="flex justify-center items-center w-full h-full">
    <span className="font-bold text-white text-4xl">
      {user?.firstName?.[0]?.toUpperCase() || ''}
      {user?.lastName?.[0]?.toUpperCase() || ''}
    </span>
  </div>
)}
            </motion.div>
            
            <h1 className="font-bold text-white text-2xl">
              {user.firstName} {user.lastName}
            </h1>
            
            <p className="mt-1 text-white/80 text-sm">
              @{user.username || `${user.firstName?.toLowerCase()}_${user.lastName?.toLowerCase()}`}
            </p>
            
            <div className="flex justify-center gap-4 mt-4">
              <div className="text-center">
                <p className="text-white/60 text-xs">Member since</p>
                <p className="font-medium text-white text-sm">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Recent"}
                </p>
              </div>
              <div className="bg-white/20 w-px" />
              <div className="text-center">
                <p className="text-white/60 text-xs">Anonymous messages</p>
                <p className="font-medium text-white text-sm">Unlimited</p>
              </div>
            </div>
            
            <div className="top-4 right-4 absolute">
              <Sparkles size={20} className="text-yellow-400 animate-pulse" />
            </div>
            <div className="bottom-4 left-4 absolute">
              <Heart size={16} className="text-pink-400 animate-pulse" />
            </div>
          </div>

          {/* Message Form Section */}
          <div className="p-6">
            <div className="mb-6 text-center">
              <h2 className="mb-1 font-semibold text-xl">Send Anonymous Message</h2>
              <p className="flex justify-center items-center gap-1 text-gray-400 text-sm">
                <Lock size={14} />
                Your identity will be completely hidden
              </p>
              {!isLoggedIn && (
                <div className="flex justify-center items-center gap-2 bg-yellow-500/20 mt-2 px-3 py-1.5 rounded-full text-yellow-400 text-xs">
                  <LogIn size={12} />
                  <span>Login required to send messages</span>
                </div>
              )}
              {isLoggedIn && (
                <div className="flex justify-center items-center gap-2 bg-green-500/20 mt-2 px-3 py-1.5 rounded-full text-green-400 text-xs">
                  <CheckCircle size={12} />
                  <span>Logged in - Ready to send</span>
                </div>
              )}
            </div>

            {/* Success Animation */}
            <AnimatePresence>
              {messageSent && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-green-500/20 mb-4 p-3 border border-green-500/50 rounded-lg text-center"
                >
                  <div className="flex justify-center items-center gap-2 text-green-400">
                    <CheckCircle size={18} />
                    <span className="font-medium text-sm">✨ Message sent successfully! Redirecting to dashboard...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Message Input */}
            <div className={`relative transition-all duration-200 ${focused ? 'scale-[1.02]' : ''}`}>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => {
                  if (e.target.value.length <= maxLength) {
                    setContent(e.target.value);
                  }
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onKeyDown={handleKeyDown}
                disabled={sending}
                placeholder={`Write something nice to ${user.firstName}...`}
                className="bg-black/40 disabled:opacity-50 p-4 border focus:border-purple-500 rounded-xl focus:outline-none w-full min-h-[120px] text-white transition-all duration-200 resize-none disabled:cursor-not-allowed placeholder-gray-500"
                autoFocus
              />
              
              {focused && (
                <div className="absolute inset-0 rounded-xl ring-2 ring-purple-500/50 pointer-events-none" />
              )}
            </div>

            {/* Character Counter */}
            <div className="mt-2">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <Lock size={12} className="text-gray-500" />
                  <span className="text-gray-500">Your message is anonymous</span>
                </div>
                <div className="flex items-center gap-3">
                  {content.length > 0 && content.length < minLength && (
                    <span className="text-yellow-400">
                      Need {minLength - content.length} more chars
                    </span>
                  )}
                  <span className={`${charCount > maxLength ? 'text-red-400' : 'text-gray-400'}`}>
                    {charCount}/{maxLength}
                  </span>
                </div>
              </div>
              
              {content.length > 0 && (
                <div className="bg-white/10 mt-1 rounded-full h-1 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(charCount / maxLength) * 100}%` }}
                    className={`h-full rounded-full ${
                      charCount > maxLength ? 'bg-red-500' : 'bg-purple-500'
                    }`}
                  />
                </div>
              )}
            </div>

            {/* Validation Warnings */}
            <AnimatePresence>
              {content.length > 0 && content.length < minLength && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 bg-yellow-500/20 mt-2 p-2 border border-yellow-500/30 rounded-lg text-yellow-400 text-xs"
                >
                  <AlertCircle size={12} />
                  <span>Message is too short (minimum {minLength} characters)</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSend}
                disabled={sending || !content.trim() || content.length < minLength}
                className="flex flex-1 justify-center items-center gap-2 bg-gradient-to-r from-purple-500 hover:from-purple-600 to-pink-500 hover:to-pink-600 disabled:opacity-50 py-3 rounded-xl font-semibold transition-all duration-200 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <>
                    <div className="border-2 border-white/30 border-t-white rounded-full w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Send Anonymous Message
                  </>
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCopy}
                className="flex justify-center items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-3 rounded-xl transition-all duration-200"
                title="Copy profile link"
              >
                {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
              </motion.button>
            </div>

            {/* Keyboard Shortcut Hint */}
            <div className="mt-3 text-gray-500 text-xs text-center">
              <span className="bg-white/10 px-2 py-1 rounded">Ctrl + Enter</span> to send
            </div>

            {/* Tip Section */}
            <div className="bg-cyan-500/10 mt-4 p-3 border border-cyan-500/30 rounded-lg">
              <div className="flex items-start gap-2 text-cyan-400 text-xs">
                <Heart size={14} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="mb-1 font-semibold">💡 Tips for your message:</p>
                  <ul className="space-y-1 text-gray-300 list-disc list-inside">
                    <li>Be respectful and kind</li>
                    <li>Your message will be sent anonymously</li>
                    <li>You must be logged in to send</li>
                    <li>Press Ctrl+Enter to send quickly</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Security Note */}
            <div className="mt-4 text-center">
              <p className="flex justify-center items-center gap-1 text-gray-500 text-xs">
                <Shield size={12} />
                Powered by Sara7a - Anonymous Messaging Platform
              </p>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-4 text-center">
          <button
            onClick={() => navigate("/")}
            className="flex justify-center items-center gap-1 mx-auto text-gray-400 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft size={14} />
            Back to Home
          </button>
        </div>
      </motion.div>
    </div>
  );
}