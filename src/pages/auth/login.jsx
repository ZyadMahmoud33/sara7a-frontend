// frontend/src/pages/auth/Login.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { loginAPI } from "../../api/auth";
import { jwtDecode } from "jwt-decode";
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
  MessageCircle
} from "lucide-react";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  // ✅ التحقق من وجود redirect بعد تسجيل الدخول
  const [redirectUrl, setRedirectUrl] = useState(null);

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
      
      // ✅ التحقق من وجود redirect URL
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

  // ✅ حفظ redirect URL عند تحميل الصفحة
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

      const accessToken = res?.data?.accessToken || res?.accessToken;
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

      // ✅ التحقق من وجود redirect URL بعد تسجيل الدخول
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

  return (
    <div className="relative flex justify-center items-center bg-gradient-to-br from-gray-900 via-black to-gray-900 px-4 min-h-screen overflow-hidden">
      
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="-top-40 -right-40 absolute bg-purple-600 opacity-20 blur-3xl rounded-full w-80 h-80 animate-pulse mix-blend-multiply filter"></div>
        <div className="-bottom-40 -left-40 absolute bg-blue-600 opacity-20 blur-3xl rounded-full w-80 h-80 animate-pulse delay-1000 mix-blend-multiply filter"></div>
        <div className="top-1/2 left-1/2 absolute bg-pink-600 opacity-10 blur-3xl rounded-full w-96 h-96 -translate-x-1/2 -translate-y-1/2 animate-pulse delay-2000 transform mix-blend-multiply filter"></div>
        
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-white/20 rounded-full w-1 h-1"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              y: [null, -30, 30, -30],
              x: [null, 30, -30, 30],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* ✅ Banner for redirect info (if coming from another page) */}
      <AnimatePresence>
        {redirectUrl && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="top-5 left-1/2 z-20 fixed bg-purple-500/20 backdrop-blur-sm px-4 py-2 border border-purple-500/50 rounded-full text-purple-300 text-sm -translate-x-1/2 transform"
          >
            <div className="flex items-center gap-2">
              <MessageCircle size={16} />
              <span>Login to continue to the previous page</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="z-10 relative bg-white/5 shadow-2xl backdrop-blur-xl border border-white/10 rounded-3xl w-full max-w-6xl overflow-hidden"
      >
        <div className="flex md:flex-row flex-col">
          {/* LEFT SECTION - Welcome Area */}
          <div className="hidden relative md:flex bg-gradient-to-br from-purple-900/50 to-pink-900/50 w-1/2 overflow-hidden">
            <div className="absolute inset-0">
              <img
                src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80"
                alt="Background"
                className="opacity-40 w-full h-full object-cover hover:scale-110 transition-transform duration-700"
              />
            </div>
            
            <div className="z-10 relative flex flex-col justify-center items-center p-12 text-white text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="bg-gradient-to-br from-purple-500 to-pink-500 mb-6 p-3 rounded-2xl"
              >
                <MessageCircle size={48} />
              </motion.div>
              
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mb-4 font-bold text-white text-4xl leading-tight"
              >
                {displayText}
                <span className={`inline-block w-0.5 h-8 ml-1 bg-white ${showCursor ? 'opacity-100' : 'opacity-0'} transition-opacity duration-100`}></span>
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mb-6 text-gray-200 text-sm"
              >
                Send anonymous messages, discover secrets, and connect freely 💬
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-3 w-full"
              >
                <div className="flex items-center gap-2 text-gray-200 text-sm">
                  <CheckCircle size={16} className="text-green-400" />
                  <span>100% Anonymous Messaging</span>
                </div>
                <div className="flex items-center gap-2 text-gray-200 text-sm">
                  <CheckCircle size={16} className="text-green-400" />
                  <span>Real-time Notifications</span>
                </div>
                <div className="flex items-center gap-2 text-gray-200 text-sm">
                  <CheckCircle size={16} className="text-green-400" />
                  <span>Premium Features Available</span>
                </div>
              </motion.div>
            </div>
          </div>

          {/* RIGHT SECTION - Login Form */}
          <div className="bg-gradient-to-br from-white/10 to-transparent backdrop-blur-xl p-8 md:p-12 w-full md:w-1/2">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="mb-8 text-center">
                <div className="md:hidden inline-block bg-gradient-to-br from-purple-500 to-pink-500 mb-4 p-2 rounded-xl">
                  <MessageCircle size={32} />
                </div>
                <h2 className="bg-clip-text bg-gradient-to-r from-white to-gray-300 font-bold text-transparent text-3xl">
                  Welcome Back
                </h2>
                <p className="mt-2 text-gray-400 text-sm">
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
                    className="flex items-center gap-2 bg-red-500/20 mb-6 p-3 border border-red-500/50 rounded-xl"
                  >
                    <AlertCircle size={18} className="flex-shrink-0 text-red-400" />
                    <span className="text-red-300 text-sm">{errors.general}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email Field */}
              <div className="mb-5">
                <label className="block mb-2 font-medium text-gray-300 text-sm">
                  Email Address
                </label>
                <div className={`relative transition-all duration-200 ${focusedField === 'email' ? 'scale-[1.02]' : ''}`}>
                  <Mail size={18} className="top-1/2 left-3 absolute text-gray-400 -translate-y-1/2 transform" />
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
                      className="mt-1 text-red-400 text-xs"
                    >
                      {errors.email}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Password Field */}
              <div className="mb-5">
                <label className="block mb-2 font-medium text-gray-300 text-sm">
                  Password
                </label>
                <div className={`relative transition-all duration-200 ${focusedField === 'password' ? 'scale-[1.02]' : ''}`}>
                  <Lock size={18} className="top-1/2 left-3 absolute text-gray-400 -translate-y-1/2 transform" />
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
                    className="top-1/2 right-3 absolute text-gray-400 hover:text-white transition-colors -translate-y-1/2 transform"
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
                      className="mt-1 text-red-400 text-xs"
                    >
                      {errors.password}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex justify-between items-center mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="bg-white/10 border-white/20 rounded focus:ring-purple-500 focus:ring-offset-0 w-4 h-4 text-purple-500"
                  />
                  <span className="text-gray-400 text-sm">Remember me</span>
                </label>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/forget-password")}
                  className="text-purple-400 hover:text-purple-300 text-sm transition-colors"
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
                className="group relative bg-gradient-to-r from-purple-500 hover:from-purple-600 to-pink-500 hover:to-pink-600 disabled:opacity-50 shadow-lg py-3 rounded-xl w-full overflow-hidden font-semibold text-white transition-all duration-200 disabled:cursor-not-allowed"
              >
                <span className="z-10 relative flex justify-center items-center gap-2">
                  {loading ? (
                    <>
                      <div className="border-2 border-white/30 border-t-white rounded-full w-5 h-5 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    <>
                      <LogIn size={18} />
                      Login
                      <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </span>
              </motion.button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="border-white/10 border-t w-full"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-transparent px-2 text-gray-500">or</span>
                </div>
              </div>

              {/* Register Link */}
              <div className="text-center">
                <p className="text-gray-400 text-sm">
                  Don't have an account?{" "}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate("/register")}
                    className="inline-flex items-center gap-1 font-semibold text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Create Account
                    <UserPlus size={14} />
                  </motion.button>
                </p>
              </div>

              {/* Security Note */}
              <div className="bg-purple-500/10 mt-6 p-3 border border-purple-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-gray-400 text-xs">
                  <Shield size={14} className="text-purple-400" />
                  <span>Your data is encrypted and secure. We never share your information.</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Floating Elements */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          rotate: [0, 10, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="hidden lg:block bottom-10 left-10 fixed opacity-20 pointer-events-none"
      >
        <Sparkles size={64} className="text-purple-500" />
      </motion.div>

      <motion.div
        animate={{
          y: [0, 20, 0],
          rotate: [0, -10, 0],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
        className="hidden lg:block top-10 right-10 fixed opacity-20 pointer-events-none"
      >
        <Key size={64} className="text-pink-500" />
      </motion.div>
    </div>
  );
}