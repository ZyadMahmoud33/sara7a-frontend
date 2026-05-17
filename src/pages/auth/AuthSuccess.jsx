// frontend/src/pages/auth/AuthSuccess.jsx
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, Loader2 } from "lucide-react";
import { jwtDecode } from "jwt-decode";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

export default function AuthSuccess() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // استخراج التوكن من الـ URL
    const params = new URLSearchParams(location.search);
    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");
    const error = params.get("error");

    if (error) {
      toast.error(error || "Social login failed");
      navigate("/login");
      return;
    }

    if (accessToken) {
      // حفظ التوكن في localStorage
      localStorage.setItem("accessToken", accessToken);
      
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }
      
      // استخراج role من التوكن
      try {
        const decoded = jwtDecode(accessToken);
        if (decoded.role !== undefined) {
          localStorage.setItem("role", decoded.role);
        }
        if (decoded.id || decoded.userId) {
          localStorage.setItem("userId", decoded.id || decoded.userId);
        }
      } catch (e) {
        console.error("Failed to decode token:", e);
      }
      
      toast.success("Logged in successfully! 🎉");
      
      // جلب الـ redirect بعد تسجيل الدخول
      const savedRedirect = localStorage.getItem("redirectAfterLogin");
      
      setTimeout(() => {
        if (savedRedirect && !savedRedirect.includes("/login") && !savedRedirect.includes("/register")) {
          localStorage.removeItem("redirectAfterLogin");
          navigate(savedRedirect);
        } else {
          // التحقق من role للتوجيه للصفحة المناسبة
          let role = 1;
          try {
            const decoded = jwtDecode(accessToken);
            role = decoded.role;
          } catch (e) {}
          navigate(role === 0 ? "/admin" : "/dashboard");
        }
      }, 1500);
    } else {
      toast.error("Authentication failed");
      navigate("/login");
    }
  }, [location, navigate]);

  return (
    <div className={cn('flex', 'flex-col', 'justify-center', 'items-center', 'bg-gradient-to-br', 'from-gray-900', 'via-black', 'to-gray-900', 'min-h-screen')}>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5 }}
        className={cn('bg-white/10', 'backdrop-blur-xl', 'p-8', 'border', 'border-white/20', 'rounded-2xl', 'text-center')}
      >
        {localStorage.getItem("accessToken") ? (
          <>
            <CheckCircle size={64} className={cn('mx-auto', 'mb-4', 'text-green-400')} />
            <h2 className={cn('mb-2', 'font-bold', 'text-white', 'text-2xl')}>Login Successful!</h2>
            <p className="text-gray-400">Redirecting to dashboard...</p>
            <div className={cn('flex', 'justify-center', 'mt-4')}>
              <div className={cn('border-purple-500', 'border-b-2', 'rounded-full', 'w-6', 'h-6', 'animate-spin')}></div>
            </div>
          </>
        ) : (
          <>
            <Loader2 size={64} className={cn('mx-auto', 'mb-4', 'text-purple-400', 'animate-spin')} />
            <h2 className={cn('mb-2', 'font-bold', 'text-white', 'text-2xl')}>Processing...</h2>
            <p className="text-gray-400">Please wait, logging you in...</p>
          </>
        )}
      </motion.div>
    </div>
  );
}