// frontend/src/pages/auth/Login.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { loginAPI, googleLoginAPI, facebookLoginAPI, githubLoginAPI, appleLoginAPI, twitterLoginAPI } from "../../api/auth";
import { jwtDecode } from "jwt-decode";
import { cn } from "@/lib/utils";
import { useGoogleLogin } from "@react-oauth/google";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Shield,
  Sparkles,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  UserPlus,
  Key,
  MessageCircle,
  Chrome,
  Facebook,
  Github,
  Apple,
  Twitter,
  Star,
  Zap,
  Fingerprint,
  Globe
} from "lucide-react";

// ✅ تحميل Facebook SDK تلقائياً
const loadFacebookSDK = () => {
  return new Promise((resolve) => {
    if (window.FB) {
      resolve(window.FB);
      return;
    }
    
    window.fbAsyncInit = function() {
      window.FB.init({
        appId: '1528951325606522',
        cookie: true,
        xfbml: true,
        version: 'v18.0'
      });
      resolve(window.FB);
    };
    
    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    document.body.appendChild(script);
  });
};

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [redirectUrl, setRedirectUrl] = useState(null);
  const [fbSDKLoaded, setFbSDKLoaded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // تحميل Facebook SDK عند تحميل الـ component
  useEffect(() => {
    loadFacebookSDK().then(() => setFbSDKLoaded(true));
  }, []);

  // 3D effect للماوس
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Auto login check
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      const decoded = jwtDecode(token);
      if (decoded.exp * 1000 < Date.now()) {
        localStorage.clear();
        return;
      }
      const role = decoded.role;
      
      const savedRedirect = localStorage.getItem("redirectAfterLogin");
      if (savedRedirect) {
        localStorage.removeItem("redirectAfterLogin");
        navigate(savedRedirect);
      } else {
        navigate(role === 0 ? "/admin" : "/dashboard");
      }
    } catch {
      localStorage.clear();
    }
  }, [navigate]);

  useEffect(() => {
    const savedRedirect = localStorage.getItem("redirectAfterLogin");
    if (savedRedirect) {
      setRedirectUrl(savedRedirect);
    }
  }, []);

  // Typing animation
  const fullText = "Welcome To Sara7a 🚀";
  const [displayText, setDisplayText] = useState("");
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayText(fullText.slice(0, i + 1));
      i++;
      if (i === fullText.length) clearInterval(interval);
    }, 50);

    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => {
      clearInterval(interval);
      clearInterval(cursorInterval);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "", general: "" }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!form.password.trim()) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const login = async () => {
    if (loading) return;
    if (!validateForm()) return;

    try {
      setLoading(true);

      const res = await loginAPI({
        email: form.email.trim(),
        password: form.password.trim(),
      });

      const accessToken = res?.data?.accessToken || res?.accessToken || res?.data?.data?.accessToken;
      const refreshToken = res?.data?.refreshToken || res?.refreshToken;
      const user = res?.data?.user || res?.user;

      if (!accessToken) throw new Error("Authentication failed");

      const decoded = jwtDecode(accessToken);
      const role = decoded.role;

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("role", role);
      if (user?.adminLevel !== undefined) {
        localStorage.setItem("adminLevel", user.adminLevel);
      }

      if (rememberMe) {
        localStorage.setItem("rememberedEmail", form.email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      toast.success("Welcome back! 🎉");

      const savedRedirect = localStorage.getItem("redirectAfterLogin");
      
      setTimeout(() => {
        if (savedRedirect) {
          localStorage.removeItem("redirectAfterLogin");
          navigate(savedRedirect);
        } else {
          navigate(role === 0 ? "/admin" : "/dashboard");
        }
      }, 500);

    } catch (err) {
      console.error("Login error:", err);
      const message = err?.response?.data?.message || err?.message || "Login failed. Please check your credentials.";
      setErrors({ general: message });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Google Login Handler
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setSocialLoading("google");

        const res = await googleLoginAPI(tokenResponse.access_token);
        
        const accessToken = res?.data?.accessToken || res?.accessToken;
        const refreshToken = res?.data?.refreshToken || res?.refreshToken;
        const user = res?.data?.user || res?.user;

        if (!accessToken) throw new Error("No access token received from server");

        localStorage.setItem("accessToken", accessToken);
        if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
        
        try {
          const decoded = jwtDecode(accessToken);
          if (decoded.role !== undefined) localStorage.setItem("role", decoded.role);
          if (decoded.id || decoded.userId) localStorage.setItem("userId", decoded.id || decoded.userId);
        } catch {
          if (user?.role !== undefined) localStorage.setItem("role", user.role);
          if (user?._id) localStorage.setItem("userId", user._id);
        }

        toast.success("Logged in with Google! 🎉");
        
        window.dispatchEvent(new Event("authChange"));

        const savedRedirect = localStorage.getItem("redirectAfterLogin");
        if (savedRedirect && !savedRedirect.includes("/login") && !savedRedirect.includes("/register")) {
          localStorage.removeItem("redirectAfterLogin");
          navigate(savedRedirect);
        } else {
          const role = localStorage.getItem("role");
          navigate(parseInt(role) === 0 ? "/admin" : "/dashboard");
        }
      } catch (error) {
        console.error("Google login error:", error);
        const message = error?.response?.data?.message || "Google login failed. Please try again.";
        toast.error(message);
      } finally {
        setSocialLoading(null);
      }
    },
    onError: (error) => {
      console.error("Google OAuth error:", error);
      toast.error("Google login failed");
      setSocialLoading(null);
    },
    flow: "implicit",
  });

  // ✅ Facebook Login Handler (Token Flow - زي Google بالظبط)
  const handleFacebookLogin = async () => {
    if (!fbSDKLoaded) {
      toast.error("Facebook SDK is loading, please try again");
      return;
    }
    
    setSocialLoading("facebook");
    
    window.FB.login(async (response) => {
      if (response.authResponse) {
        try {
          const res = await facebookLoginAPI(response.authResponse.accessToken);
          
          toast.success("Logged in with Facebook! 🎉");
          
          window.dispatchEvent(new Event("authChange"));
          
          const savedRedirect = localStorage.getItem("redirectAfterLogin");
          if (savedRedirect && !savedRedirect.includes("/login") && !savedRedirect.includes("/register")) {
            localStorage.removeItem("redirectAfterLogin");
            navigate(savedRedirect);
          } else {
            const role = localStorage.getItem("role");
            navigate(role === "0" ? "/admin" : "/dashboard");
          }
        } catch (error) {
          console.error("Facebook login error:", error);
          toast.error(error?.response?.data?.message || "Facebook login failed");
        }
      } else {
        toast.error("Facebook login cancelled");
      }
      setSocialLoading(null);
    }, { scope: "email,public_profile" });
  };

  // GitHub Login Handler
  const handleGitHubLogin = () => {
    setSocialLoading("github");
    window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/github`;
  };

  // Apple Login Handler
  const handleAppleLogin = () => {
    setSocialLoading("apple");
    window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/apple`;
  };

  // X (Twitter) Login Handler
  const handleTwitterLogin = () => {
    setSocialLoading("twitter");
    window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/twitter`;
  };

  const handleSocialLogin = (provider) => {
    switch (provider) {
      case "google":
        handleGoogleLogin();
        break;
      case "facebook":
        handleFacebookLogin();
        break;
      case "github":
        handleGitHubLogin();
        break;
      case "apple":
        handleAppleLogin();
        break;
      case "twitter":
        handleTwitterLogin();
        break;
      default:
        break;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") login();
  };

  // Load remembered email
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    if (rememberedEmail) {
      setForm(prev => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true);
    }
  }, []);

  // Social buttons configuration
  const socialButtons = [
    { 
      provider: "google", 
      label: "Google", 
      icon: Chrome, 
      bgGradient: "bg-gradient-to-r from-red-600/15 to-red-600/5",
      hoverBg: "hover:from-red-600/25 hover:to-red-600/10",
      borderColor: "border-red-500/30",
      hoverBorder: "hover:border-red-500/50",
      color: "text-red-400",
      iconColor: "text-red-500"
    },
    { 
      provider: "facebook", 
      label: "Facebook", 
      icon: Facebook, 
      bgGradient: "bg-gradient-to-r from-blue-700/15 to-blue-700/5",
      hoverBg: "hover:from-blue-700/25 hover:to-blue-700/10",
      borderColor: "border-blue-500/30",
      hoverBorder: "hover:border-blue-500/50",
      color: "text-blue-400",
      iconColor: "text-blue-500"
    },
    { 
      provider: "github", 
      label: "GitHub", 
      icon: Github, 
      bgGradient: "bg-gradient-to-r from-gray-600/15 to-gray-600/5",
      hoverBg: "hover:from-gray-600/25 hover:to-gray-600/10",
      borderColor: "border-gray-500/30",
      hoverBorder: "hover:border-gray-500/50",
      color: "text-gray-400",
      iconColor: "text-gray-400"
    },
    { 
      provider: "apple", 
      label: "Apple", 
      icon: Apple, 
      bgGradient: "bg-gradient-to-r from-white/10 to-white/5",
      hoverBg: "hover:from-white/20 hover:to-white/10",
      borderColor: "border-white/20",
      hoverBorder: "hover:border-white/40",
      color: "text-white",
      iconColor: "text-white"
    },
    { 
      provider: "twitter", 
      label: "X", 
      icon: Twitter, 
      bgGradient: "bg-gradient-to-r from-white/10 to-white/5",
      hoverBg: "hover:from-white/20 hover:to-white/10",
      borderColor: "border-white/20",
      hoverBorder: "hover:border-white/40",
      color: "text-white",
      iconColor: "text-white"
    },
  ];

  return (
    <div 
      className={cn('relative', 'flex', 'justify-center', 'items-center', 'bg-gradient-to-br', 'from-gray-900', 'via-black', 'to-gray-900', 'px-4', 'min-h-screen', 'overflow-hidden')}
      style={{
        perspective: '1000px'
      }}
    >
      {/* 3D Animated Background */}
      <div 
        className={cn('fixed', 'inset-0', 'opacity-30', 'pointer-events-none')}
        style={{
          transform: `rotateX(${mousePosition.y * 0.5}deg) rotateY(${mousePosition.x * 0.5}deg)`,
          transition: 'transform 0.1s ease-out'
        }}
      >
        <div className={cn('top-20', 'left-10', 'absolute', 'bg-purple-600', 'blur-[100px]', 'rounded-full', 'w-72', 'h-72', 'animate-pulse')} />
        <div className={cn('right-10', 'bottom-20', 'absolute', 'bg-blue-600', 'blur-[120px]', 'rounded-full', 'w-96', 'h-96', 'animate-pulse', 'delay-1000')} />
        <div className={cn('top-1/2', 'left-1/2', 'absolute', 'bg-pink-600', 'blur-[150px]', 'rounded-full', 'w-[500px]', 'h-[500px]', '-translate-x-1/2', '-translate-y-1/2', 'animate-pulse', 'delay-2000')} />
      </div>

      {/* Animated Particles Grid */}
      <div className={cn('fixed', 'inset-0', 'pointer-events-none')}>
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className={cn('absolute', 'bg-white/20', 'rounded-full', 'w-1', 'h-1')}
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              y: [null, -100, 100, -50, 50],
              x: [null, 50, -50, 30, -30],
              opacity: [0.2, 0.5, 0.2]
            }}
            transition={{
              duration: Math.random() * 15 + 10,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Redirect Banner */}
      <AnimatePresence>
        {redirectUrl && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={cn('top-5', 'left-1/2', 'z-20', 'fixed', 'bg-purple-500/20', 'backdrop-blur-sm', 'px-4', 'py-2', 'border', 'border-purple-500/50', 'rounded-full', 'text-purple-300', 'text-sm', '-translate-x-1/2', 'transform')}
          >
            <div className={cn('flex', 'items-center', 'gap-2')}>
              <MessageCircle size={16} />
              <span>Login to continue to the previous page</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main 3D Card */}
      <motion.div
        initial={{ opacity: 0, y: 50, rotateX: -15 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.6, type: "spring" }}
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(${mousePosition.y * 0.1}deg) rotateY(${mousePosition.x * 0.1}deg)`,
        }}
        className={cn('z-10', 'relative', 'bg-white/5', 'shadow-2xl', 'backdrop-blur-xl', 'border', 'border-white/10', 'rounded-3xl', 'w-full', 'max-w-6xl', 'overflow-hidden', 'transition-all', 'duration-200')}
      >
        <div className={cn('flex', 'md:flex-row', 'flex-col')}>
          {/* LEFT SECTION - Welcome Area with 3D */}
          <div className={cn('hidden', 'relative', 'md:flex', 'bg-gradient-to-br', 'from-purple-900/50', 'to-pink-900/50', 'w-1/2', 'overflow-hidden')}>
            <div className={cn('absolute', 'inset-0')}>
              <img
                src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80"
                alt="Background"
                className={cn('opacity-40', 'w-full', 'h-full', 'object-cover', 'hover:scale-110', 'transition-transform', 'duration-700')}
              />
            </div>
            
            <div className={cn('z-10', 'relative', 'flex', 'flex-col', 'justify-center', 'items-center', 'p-12', 'text-white', 'text-center')}>
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring" }}
                className={cn('bg-gradient-to-br', 'from-purple-500', 'to-pink-500', 'mb-6', 'p-4', 'rounded-2xl', 'shadow-2xl')}
              >
                <MessageCircle size={48} />
              </motion.div>
              
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className={cn('mb-4', 'font-bold', 'text-white', 'text-4xl', 'leading-tight')}
              >
                {displayText}
                <span className={`inline-block w-0.5 h-8 ml-1 bg-white ${showCursor ? 'opacity-100' : 'opacity-0'} transition-opacity duration-100`}></span>
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className={cn('mb-6', 'text-gray-200', 'text-sm')}
              >
                Send anonymous messages, discover secrets, and connect freely 💬
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className={cn('space-y-3', 'w-full')}
              >
                {[
                  { text: "100% Anonymous Messaging", icon: Shield },
                  { text: "Real-time Notifications", icon: Zap },
                  { text: "Premium Features Available", icon: Star },
                  { text: "End-to-End Encrypted", icon: Fingerprint },
                  { text: "Global Community", icon: Globe }
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + idx * 0.1 }}
                    className={cn('flex', 'items-center', 'gap-2', 'text-gray-200', 'text-sm')}
                  >
                    <CheckCircle size={16} className="text-green-400" />
                    <span>{item.text}</span>
                  </motion.div>
                ))}
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className={cn('grid', 'grid-cols-3', 'gap-4', 'mt-8', 'pt-6', 'border-t', 'border-white/20', 'w-full')}
              >
                {[
                  { value: "50K+", label: "Users" },
                  { value: "1M+", label: "Messages" },
                  { value: "150+", label: "Countries" }
                ].map((stat, idx) => (
                  <div key={idx} className="text-center">
                    <div className={cn('font-bold', 'text-white', 'text-xl')}>{stat.value}</div>
                    <div className={cn('text-gray-400', 'text-xs')}>{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>

          {/* RIGHT SECTION - Login Form */}
          <div className={cn('bg-gradient-to-br', 'from-white/10', 'to-transparent', 'backdrop-blur-xl', 'p-8', 'md:p-12', 'w-full', 'md:w-1/2')}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className={cn('mb-8', 'text-center')}>
                <motion.div 
                  className={cn('md:hidden', 'inline-block', 'bg-gradient-to-br', 'from-purple-500', 'to-pink-500', 'mb-4', 'p-2', 'rounded-xl')}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <MessageCircle size={32} />
                </motion.div>
                <h2 className={cn('bg-clip-text', 'bg-gradient-to-r', 'from-white', 'to-gray-300', 'font-bold', 'text-transparent', 'text-3xl')}>
                  Welcome Back
                </h2>
                <p className={cn('mt-2', 'text-gray-400', 'text-sm')}>
                  {redirectUrl ? "Login to continue to the previous page" : "Sign in to continue to your account"}
                </p>
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {errors.general && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={cn('flex', 'items-center', 'gap-2', 'bg-red-500/20', 'mb-6', 'p-3', 'border', 'border-red-500/50', 'rounded-xl')}
                  >
                    <AlertCircle size={18} className={cn('flex-shrink-0', 'text-red-400')} />
                    <span className={cn('text-red-300', 'text-sm')}>{errors.general}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email Field */}
              <motion.div 
                className="mb-5"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <label className={cn('block', 'mb-2', 'font-medium', 'text-gray-300', 'text-sm')}>Email Address</label>
                <div className={`relative transition-all duration-200 ${focusedField === 'email' ? 'scale-[1.02]' : ''}`}>
                  <Mail size={18} className={cn('top-1/2', 'left-3', 'absolute', 'text-gray-400', '-translate-y-1/2', 'transform')} />
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    placeholder="Enter your email"
                    onChange={handleChange}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    onKeyDown={handleKeyDown}
                    className={`w-full bg-black/40 rounded-xl pl-10 pr-4 py-3 border outline-none transition-all duration-200 text-white placeholder-gray-400 ${
                      errors.email 
                        ? 'border-red-500 focus:border-red-500' 
                        : 'border-white/20 focus:border-purple-500'
                    }`}
                  />
                </div>
                <AnimatePresence>
                  {errors.email && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className={cn('mt-1', 'text-red-400', 'text-xs')}
                    >
                      {errors.email}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Password Field */}
              <motion.div 
                className="mb-5"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <label className={cn('block', 'mb-2', 'font-medium', 'text-gray-300', 'text-sm')}>Password</label>
                <div className={`relative transition-all duration-200 ${focusedField === 'password' ? 'scale-[1.02]' : ''}`}>
                  <Lock size={18} className={cn('top-1/2', 'left-3', 'absolute', 'text-gray-400', '-translate-y-1/2', 'transform')} />
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    placeholder="Enter your password"
                    onChange={handleChange}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    onKeyDown={handleKeyDown}
                    className={`w-full bg-black/40 rounded-xl pl-10 pr-12 py-3 border outline-none transition-all duration-200 text-white placeholder-gray-400 ${
                      errors.password 
                        ? 'border-red-500 focus:border-red-500' 
                        : 'border-white/20 focus:border-purple-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={cn('top-1/2', 'right-3', 'absolute', 'text-gray-400', 'hover:text-white', 'transition-colors', '-translate-y-1/2', 'transform')}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <AnimatePresence>
                  {errors.password && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className={cn('mt-1', 'text-red-400', 'text-xs')}
                    >
                      {errors.password}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Remember Me & Forgot Password */}
              <div className={cn('flex', 'justify-between', 'items-center', 'mb-6')}>
                <label className={cn('flex', 'items-center', 'gap-2', 'cursor-pointer')}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className={cn('bg-white/10', 'border-white/20', 'rounded', 'focus:ring-purple-500', 'focus:ring-offset-0', 'w-4', 'h-4', 'text-purple-500')}
                  />
                  <span className={cn('text-gray-400', 'text-sm')}>Remember me</span>
                </label>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/forget-password")}
                  className={cn('text-purple-400', 'hover:text-purple-300', 'text-sm', 'transition-colors')}
                >
                  Forgot Password?
                </motion.button>
              </div>

              {/* Login Button */}
              <motion.button
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                onClick={login}
                disabled={loading}
                className={cn('group', 'relative', 'bg-gradient-to-r', 'from-purple-500', 'hover:from-purple-600', 'to-pink-500', 'hover:to-pink-600', 'disabled:opacity-50', 'shadow-lg', 'py-3', 'rounded-xl', 'w-full', 'overflow-hidden', 'font-semibold', 'text-white', 'transition-all', 'duration-200', 'disabled:cursor-not-allowed')}
              >
                <span className={cn('z-10', 'relative', 'flex', 'justify-center', 'items-center', 'gap-2')}>
                  {loading ? (
                    <>
                      <div className={cn('border-2', 'border-white/30', 'border-t-white', 'rounded-full', 'w-5', 'h-5', 'animate-spin')} />
                      Logging in...
                    </>
                  ) : (
                    <>
                      <LogIn size={18} />
                      Login
                      <ArrowRight size={18} className={cn('transition-transform', 'group-hover:translate-x-1')} />
                    </>
                  )}
                </span>
              </motion.button>

              {/* Divider */}
              <div className={cn('relative', 'my-6')}>
                <div className={cn('absolute', 'inset-0', 'flex', 'items-center')}>
                  <div className={cn('border-white/10', 'border-t', 'w-full')}></div>
                </div>
                <div className={cn('relative', 'flex', 'justify-center', 'text-sm')}>
                  <span className={cn('bg-transparent', 'px-2', 'text-gray-500')}>or continue with</span>
                </div>
              </div>

              {/* Social Login Buttons */}
              <div className={cn('grid', 'grid-cols-5', 'gap-2', 'mb-6')}>
                {socialButtons.map((btn) => (
                  <motion.button
                    key={btn.provider}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSocialLogin(btn.provider)}
                    disabled={socialLoading !== null}
                    className={cn(
                      'group relative flex flex-col justify-center items-center gap-1 py-2 rounded-xl transition-all duration-200',
                      btn.bgGradient, btn.hoverBg,
                      'border', btn.borderColor, btn.hoverBorder,
                      'disabled:opacity-50', 'disabled:cursor-not-allowed',
                      'overflow-hidden'
                    )}
                  >
                    {socialLoading === btn.provider ? (
                      <div className={cn('border-2', 'border-white/30', 'border-t-white', 'rounded-full', 'w-5', 'h-5', 'animate-spin')} />
                    ) : (
                      <>
                        <btn.icon size={20} className={cn(btn.iconColor, 'transition-all duration-300 group-hover:scale-110 group-hover:rotate-12')} />
                        <span className={cn('text-gray-300', 'text-xs')}>{btn.label}</span>
                      </>
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Register Link */}
              <div className="text-center">
                <p className={cn('text-gray-400', 'text-sm')}>
                  Don't have an account?{" "}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate("/register")}
                    className={cn('inline-flex', 'items-center', 'gap-1', 'font-semibold', 'text-purple-400', 'hover:text-purple-300', 'transition-colors')}
                  >
                    Create Account
                    <UserPlus size={14} />
                  </motion.button>
                </p>
              </div>

              {/* Security Note */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className={cn('bg-purple-500/10', 'mt-6', 'p-3', 'border', 'border-purple-500/30', 'rounded-lg')}
              >
                <div className={cn('flex', 'items-center', 'gap-2', 'text-gray-400', 'text-xs')}>
                  <Shield size={14} className="text-purple-400" />
                  <span>Your data is encrypted and secure. We never share your information.</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Floating 3D Elements */}
      <motion.div
        animate={{
          y: [0, -30, 0],
          rotateZ: [0, 10, 0],
          rotateX: [0, 15, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={cn('hidden', 'lg:block', 'bottom-10', 'left-10', 'fixed', 'opacity-30', 'pointer-events-none')}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <Sparkles size={64} className="text-purple-500" />
      </motion.div>

      <motion.div
        animate={{
          y: [0, 30, 0],
          rotateZ: [0, -10, 0],
          rotateY: [0, 15, 0],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
        className={cn('hidden', 'lg:block', 'top-10', 'right-10', 'fixed', 'opacity-30', 'pointer-events-none')}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <Key size={64} className="text-pink-500" />
      </motion.div>
    </div>
  );
}