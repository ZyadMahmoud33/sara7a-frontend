// frontend/src/pages/auth/AuthSuccess.jsx
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Loader2, XCircle, User, Shield, Clock, Sparkles, Fingerprint, Lock, Globe } from "lucide-react";
import { jwtDecode } from "jwt-decode";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

export default function AuthSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [userInfo, setUserInfo] = useState(null);
  const [status, setStatus] = useState("processing"); // processing, success, error
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

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

  useEffect(() => {
    // Progress bar animation
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    // استخراج التوكن من الـ URL
    const params = new URLSearchParams(location.search);
    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");
    const error = params.get("error");

    const processAuth = async () => {
      if (error) {
        setStatus("error");
        toast.error(error || "Social login failed");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
        return;
      }

      if (accessToken) {
        try {
          // حفظ التوكن في localStorage
          localStorage.setItem("accessToken", accessToken);
          
          if (refreshToken) {
            localStorage.setItem("refreshToken", refreshToken);
          }
          
          // استخراج معلومات المستخدم من التوكن
          let decoded = null;
          let userData = null;
          
          try {
            decoded = jwtDecode(accessToken);
            if (decoded.role !== undefined) {
              localStorage.setItem("role", decoded.role);
            }
            if (decoded.id || decoded.userId) {
              localStorage.setItem("userId", decoded.id || decoded.userId);
            }
            
            // تخزين معلومات المستخدم للعرض
            userData = {
              email: decoded.email || decoded.sub || "user@example.com",
              role: decoded.role === 0 ? "Admin" : "User",
              id: decoded.id || decoded.userId || decoded.sub,
              exp: new Date(decoded.exp * 1000).toLocaleString(),
            };
            setUserInfo(userData);
            
          } catch (e) {
            console.error("Failed to decode token:", e);
          }
          
          setStatus("success");
          toast.success("Logged in successfully! 🎉");
          
          // جلب الـ redirect بعد تسجيل الدخول
          const savedRedirect = localStorage.getItem("redirectAfterLogin");
          
          // تأخير التحويل لعرض تأثير النجاح
          setTimeout(() => {
            if (savedRedirect && !savedRedirect.includes("/login") && !savedRedirect.includes("/register")) {
              localStorage.removeItem("redirectAfterLogin");
              navigate(savedRedirect);
            } else {
              let role = 1;
              try {
                const decodedToken = jwtDecode(accessToken);
                role = decodedToken.role;
              } catch (e) {}
              navigate(role === 0 ? "/admin" : "/dashboard");
            }
          }, 2500);
          
        } catch (err) {
          console.error("Auth processing error:", err);
          setStatus("error");
          toast.error("Authentication failed");
          setTimeout(() => {
            navigate("/login");
          }, 2000);
        }
      } else {
        setStatus("error");
        toast.error("Authentication failed");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    };

    processAuth();

    return () => clearInterval(interval);
  }, [location, navigate]);

  // Floating particles
  const particles = [...Array(30)].map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 10 + 5,
    delay: Math.random() * 5
  }));

  return (
    <div 
      className={cn('relative', 'flex', 'flex-col', 'justify-center', 'items-center', 'bg-gradient-to-br', 'from-gray-900', 'via-black', 'to-gray-900', 'min-h-screen', 'overflow-hidden')}
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
        <div className={cn('top-20', 'left-10', 'absolute', 'bg-green-600', 'blur-[100px]', 'rounded-full', 'w-72', 'h-72', 'animate-pulse')} />
        <div className={cn('right-10', 'bottom-20', 'absolute', 'bg-purple-600', 'blur-[120px]', 'rounded-full', 'w-96', 'h-96', 'animate-pulse', 'delay-1000')} />
        <div className={cn('top-1/2', 'left-1/2', 'absolute', 'bg-blue-600', 'blur-[150px]', 'rounded-full', 'w-[500px]', 'h-[500px]', '-translate-x-1/2', '-translate-y-1/2', 'animate-pulse', 'delay-2000')} />
      </div>

      {/* Floating Particles */}
      <div className={cn('fixed', 'inset-0', 'pointer-events-none')}>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className={cn('absolute', 'bg-white/20', 'rounded-full')}
            style={{
              width: particle.size,
              height: particle.size,
              left: `${particle.x}%`,
              top: `${particle.y}%`,
            }}
            animate={{
              y: [0, -100, 0],
              x: [0, Math.random() * 50 - 25, 0],
              opacity: [0, 0.5, 0]
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 50, rotateX: -15, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
        transition={{ duration: 0.6, type: "spring" }}
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(${mousePosition.y * 0.1}deg) rotateY(${mousePosition.x * 0.1}deg)`,
        }}
        className={cn('z-10', 'relative', 'bg-white/5', 'backdrop-blur-xl', 'border', 'border-white/20', 'rounded-2xl', 'p-8', 'md:p-12', 'text-center', 'max-w-md', 'w-full', 'mx-4', 'shadow-2xl')}
      >
        {/* Glow Effect */}
        <div className={cn('-z-10', 'absolute', 'inset-0', 'bg-gradient-to-r', 'from-purple-500/20', 'to-pink-500/20', 'blur-xl', 'rounded-2xl')} />

        {/* Status Icon with Animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring", duration: 0.6 }}
          className="relative"
        >
          <AnimatePresence mode="wait">
            {status === "processing" && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                className="relative"
              >
                <div className={cn('absolute', 'inset-0', 'bg-purple-500/30', 'blur-xl', 'rounded-full', 'animate-ping')} />
                <Loader2 size={80} className={cn('mx-auto', 'mb-6', 'text-purple-400', 'animate-spin', 'relative', 'z-10')} />
              </motion.div>
            )}
            
            {status === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
              >
                <div className={cn('absolute', 'inset-0', 'bg-green-500/30', 'blur-xl', 'rounded-full', 'animate-pulse')} />
                <CheckCircle size={80} className={cn('mx-auto', 'mb-6', 'text-green-400', 'relative', 'z-10')} />
              </motion.div>
            )}
            
            {status === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
              >
                <div className={cn('absolute', 'inset-0', 'bg-red-500/30', 'blur-xl', 'rounded-full', 'animate-pulse')} />
                <XCircle size={80} className={cn('mx-auto', 'mb-6', 'text-red-400', 'relative', 'z-10')} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={cn('mb-2', 'font-bold', 'bg-clip-text', 'bg-gradient-to-r', 'from-white', 'to-gray-300', 'text-transparent', 'text-3xl')}
        >
          {status === "processing" && "Processing..."}
          {status === "success" && "Login Successful!"}
          {status === "error" && "Authentication Failed"}
        </motion.h2>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className={cn('mb-6', 'text-gray-400')}
        >
          {status === "processing" && "Please wait, we're logging you in..."}
          {status === "success" && "Redirecting you to your dashboard..."}
          {status === "error" && "Something went wrong. Redirecting to login..."}
        </motion.p>

        {/* Progress Bar */}
        {status === "processing" && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "100%" }}
            transition={{ delay: 0.5 }}
            className={cn('relative', 'bg-white/10', 'mb-6', 'rounded-full', 'h-1', 'overflow-hidden')}
          >
            <motion.div
              className={cn('left-0', 'absolute', 'inset-y-0', 'bg-gradient-to-r', 'from-purple-500', 'to-pink-500', 'rounded-full')}
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </motion.div>
        )}

        {/* Success Animation - Fingerprint Scanner */}
        {status === "success" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-6"
          >
            <div className={cn('inline-flex', 'relative', 'justify-center', 'items-center')}>
              <Fingerprint size={60} className={cn('text-green-400', 'animate-pulse')} />
              <motion.div
                className={cn('absolute', 'inset-0', 'border-2', 'border-green-400', 'rounded-full')}
                animate={{
                  scale: [1, 1.5, 2],
                  opacity: [1, 0.5, 0]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
              />
            </div>
          </motion.div>
        )}

        {/* User Info Card (on success) */}
        <AnimatePresence>
          {status === "success" && userInfo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className={cn('mt-6', 'p-4', 'bg-white/5', 'rounded-xl', 'border', 'border-white/10')}
            >
              <h3 className={cn('flex', 'justify-center', 'items-center', 'gap-2', 'mb-3', 'font-semibold', 'text-gray-300', 'text-sm')}>
                <User size={14} />
                Account Details
              </h3>
              <div className={cn('space-y-2', 'text-left')}>
                <div className={cn('flex', 'justify-between', 'text-xs')}>
                  <span className="text-gray-400">Email:</span>
                  <span className={cn('ml-2', 'font-mono', 'text-gray-200', 'truncate')}>{userInfo.email}</span>
                </div>
                <div className={cn('flex', 'justify-between', 'text-xs')}>
                  <span className="text-gray-400">Role:</span>
                  <span className={cn("font-semibold", userInfo.role === "Admin" ? "text-purple-400" : "text-green-400")}>
                    {userInfo.role}
                  </span>
                </div>
                <div className={cn('flex', 'justify-between', 'text-xs')}>
                  <span className="text-gray-400">Session expires:</span>
                  <span className="text-gray-200">{userInfo.exp}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Security Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className={cn('flex', 'justify-center', 'gap-4', 'mt-6', 'pt-4', 'border-t', 'border-white/10')}
        >
          {[
            { icon: Lock, label: "256-bit SSL", color: "text-green-400" },
            { icon: Shield, label: "Secure Auth", color: "text-purple-400" },
            { icon: Globe, label: "Global CDN", color: "text-blue-400" }
          ].map((badge, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.05, y: -2 }}
              className={cn('flex', 'flex-col', 'items-center', 'gap-1')}
            >
              <badge.icon size={16} className={badge.color} />
              <span className={cn('text-[10px]', 'text-gray-500')}>{badge.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Loading Dots Animation */}
        {status === "processing" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className={cn('flex', 'justify-center', 'gap-2', 'mt-6')}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={cn('bg-purple-500', 'rounded-full', 'w-2', 'h-2')}
                animate={{
                  y: [0, -8, 0],
                  opacity: [0.3, 1, 0.3]
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.15
                }}
              />
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Floating Sparkles */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          rotate: [0, 360],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear"
        }}
        className={cn('hidden', 'lg:block', 'bottom-10', 'right-10', 'fixed', 'opacity-30', 'pointer-events-none')}
      >
        <Sparkles size={48} className="text-yellow-500" />
      </motion.div>

      <motion.div
        animate={{
          y: [0, 20, 0],
          rotate: [0, -360],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "linear",
          delay: 1
        }}
        className={cn('hidden', 'lg:block', 'top-10', 'left-10', 'fixed', 'opacity-30', 'pointer-events-none')}
      >
        <Clock size={48} className="text-cyan-500" />
      </motion.div>
    </div>
  );
}