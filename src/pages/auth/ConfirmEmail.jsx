// frontend/src/pages/auth/ConfirmEmail.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { confirmEmailAPI, resendOtpAPI } from "../../api/auth";
import {
  Mail,
  Key,
  CheckCircle,
  AlertCircle,
  Shield,
  RefreshCw,
  ArrowLeft,
  MessageCircle,
  Sparkles,
  Clock,
  Send,
  UserCheck
} from "lucide-react";

export default function ConfirmEmail() {
  const navigate = useNavigate();

  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [otpError, setOtpError] = useState("");
  const [focusedField, setFocusedField] = useState(null);
  const [attempts, setAttempts] = useState(0);

  // Guard - Check if email exists
  useEffect(() => {
    const savedEmail = localStorage.getItem("email");
    const tempRegistration = localStorage.getItem("tempRegistration");

    if (!savedEmail || !tempRegistration) {
      toast.error("Please register first ❌");
      navigate("/register", { replace: true });
      return;
    }

    setEmail(savedEmail);
    setTimer(30);
  }, [navigate]);

  // Timer effect
  useEffect(() => {
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const handleOtpChange = useCallback((e) => {
    const value = e.target.value.replace(/\D/g, "");
    setOtp(value);
    setOtpError("");
  }, []);

  // Confirm OTP
  const confirm = async () => {
    if (loading) return;

    if (!otp) {
      setOtpError("OTP is required");
      return toast.error("Please enter the verification code");
    }

    if (otp.length < 4) {
      setOtpError("OTP must be at least 4 digits");
      return toast.error("Invalid OTP format");
    }

    try {
      setLoading(true);

      const res = await confirmEmailAPI({ email, otp });

      toast.success(res?.data?.message || "Email confirmed successfully! 🎉");
      
      localStorage.removeItem("email");
      localStorage.removeItem("tempRegistration");

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1500);

    } catch (err) {
      console.error(err);
      
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      const message = err?.response?.data?.message || "Invalid OTP ❌";
      toast.error(message);
      
      if (newAttempts >= 3) {
        toast.error("Too many failed attempts. Please request a new OTP");
        setOtpError("Invalid OTP. Request a new code");
      }
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const resend = async () => {
    if (resendLoading || timer > 0) return;

    try {
      setResendLoading(true);

      const res = await resendOtpAPI({ email });

      toast.success(res?.data?.message || "OTP resent successfully! 📩");
      setTimer(30);
      setAttempts(0);
      setOtp("");
      setOtpError("");

    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to resend OTP ❌");
    } finally {
      setResendLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") confirm();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative flex justify-center items-center bg-gradient-to-br from-gray-900 via-black to-gray-900 px-4 min-h-screen overflow-hidden">
      
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="-top-40 -right-40 absolute bg-teal-600 opacity-20 blur-3xl rounded-full w-80 h-80 animate-pulse mix-blend-multiply filter"></div>
        <div className="-bottom-40 -left-40 absolute bg-blue-600 opacity-20 blur-3xl rounded-full w-80 h-80 animate-pulse delay-1000 mix-blend-multiply filter"></div>
        <div className="top-1/2 left-1/2 absolute bg-cyan-600 opacity-10 blur-3xl rounded-full w-96 h-96 -translate-x-1/2 -translate-y-1/2 animate-pulse delay-2000 transform mix-blend-multiply filter"></div>
        
        {/* Floating particles */}
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-white/20 rounded-full w-1 h-1"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              y: [null, -50, 50, -50],
              x: [null, 50, -50, 50],
            }}
            transition={{
              duration: Math.random() * 15 + 10,
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="z-10 relative w-full max-w-md"
      >
        <div className="bg-gradient-to-br from-white/10 to-transparent shadow-2xl backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
          <div className="p-6 md:p-8">
            {/* Header */}
            <div className="mb-6 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="inline-block bg-gradient-to-br from-teal-500 to-blue-500 mb-4 p-3 rounded-2xl"
              >
                <Mail size={32} />
              </motion.div>
              <h2 className="bg-clip-text bg-gradient-to-r from-white to-gray-400 font-bold text-transparent text-3xl">
                Verify Your Email
              </h2>
              <p className="mt-2 text-gray-400 text-sm">
                We've sent a verification code to your email
              </p>
            </div>

            {/* Email Display */}
            <div className="bg-teal-500/10 mb-6 p-3 border border-teal-500/30 rounded-xl">
              <div className="flex justify-center items-center gap-2">
                <MessageCircle size={16} className="text-teal-400" />
                <span className="text-gray-200 text-sm break-all">{email}</span>
              </div>
            </div>

            {/* OTP Input Section */}
            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-medium text-gray-300 text-sm">
                  Verification Code
                </label>
                <div className={`relative transition-all duration-200 ${focusedField === 'otp' ? 'scale-[1.02]' : ''}`}>
                  <Key size={18} className="top-1/2 left-3 absolute text-gray-400 -translate-y-1/2 transform" />
                  <input
                    type="text"
                    value={otp}
                    onChange={handleOtpChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setFocusedField('otp')}
                    onBlur={() => setFocusedField(null)}
                    maxLength={6}
                    autoFocus
                    placeholder="Enter 6-digit code"
                    className={`w-full bg-black/40 rounded-xl pl-10 pr-4 py-3 border outline-none transition-all duration-200 text-center tracking-[0.25em] font-mono text-lg text-white placeholder-gray-400 ${
                      otpError
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-white/20 focus:border-teal-500'
                    }`}
                  />
                </div>
                <AnimatePresence>
                  {otpError && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="flex items-center gap-1 mt-1 text-red-400 text-xs"
                    >
                      <AlertCircle size={12} />
                      {otpError}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* OTP Tips */}
              {otp.length > 0 && otp.length < 6 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-gray-500 text-xs text-center"
                >
                  {6 - otp.length} more digit{6 - otp.length !== 1 ? 's' : ''} remaining
                </motion.div>
              )}

              {/* Confirm Button */}
              <motion.button
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                onClick={confirm}
                disabled={loading}
                className="group relative bg-gradient-to-r from-teal-500 hover:from-teal-600 to-blue-500 hover:to-blue-600 disabled:opacity-50 shadow-lg py-3 rounded-xl w-full overflow-hidden font-semibold text-white transition-all duration-200 disabled:cursor-not-allowed"
              >
                <span className="z-10 relative flex justify-center items-center gap-2">
                  {loading ? (
                    <>
                      <div className="border-2 border-white/30 border-t-white rounded-full w-5 h-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <UserCheck size={18} />
                      Verify Email
                    </>
                  )}
                </span>
              </motion.button>

              {/* Resend Section */}
              <div className="pt-2 text-center">
                {timer > 0 ? (
                  <div className="flex justify-center items-center gap-2 text-gray-400 text-sm">
                    <Clock size={14} className="text-teal-400" />
                    <span>Resend available in {formatTime(timer)}</span>
                  </div>
                ) : (
                  <button
                    onClick={resend}
                    disabled={resendLoading}
                    className="flex justify-center items-center gap-2 mx-auto text-teal-400 hover:text-teal-300 text-sm transition-colors"
                  >
                    {resendLoading ? (
                      <>
                        <div className="border-2 border-teal-400/30 border-t-teal-400 rounded-full w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={14} />
                        Resend Verification Code
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Help Text */}
              <div className="text-gray-500 text-xs text-center">
                <p>Didn't receive the code? Check your spam folder</p>
              </div>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="border-white/10 border-t w-full"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-transparent px-2 text-gray-500">or</span>
                </div>
              </div>

              {/* Back to Login */}
              <button
                onClick={() => navigate("/login")}
                className="flex justify-center items-center gap-2 w-full text-gray-400 hover:text-white text-sm transition-colors"
              >
                <ArrowLeft size={14} />
                Back to Login
              </button>
            </div>

            {/* Security Note */}
            <div className="bg-teal-500/10 mt-6 p-3 border border-teal-500/30 rounded-lg">
              <div className="flex items-start gap-2 text-gray-400 text-xs">
                <Shield size={14} className="flex-shrink-0 mt-0.5 text-teal-400" />
                <div>
                  <p className="mb-1 font-semibold text-teal-400">Why verify your email?</p>
                  <p>Email verification helps secure your account and ensures you can recover your password if needed.</p>
                </div>
              </div>
            </div>

            {/* Attempts Warning */}
            {attempts >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-yellow-500/10 mt-4 p-2 border border-yellow-500/30 rounded-lg"
              >
                <div className="flex items-center gap-2 text-yellow-400 text-xs">
                  <AlertCircle size={12} />
                  <span>{3 - attempts} attempt{3 - attempts !== 1 ? 's' : ''} remaining before code expires</span>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Floating Decorations */}
      <motion.div
        animate={{
          y: [0, -30, 0],
          rotate: [0, 10, 0],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="hidden lg:block bottom-10 left-10 fixed opacity-20 pointer-events-none"
      >
        <Shield size={48} className="text-teal-500" />
      </motion.div>

      <motion.div
        animate={{
          y: [0, 30, 0],
          rotate: [0, -10, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
        className="hidden lg:block top-10 right-10 fixed opacity-20 pointer-events-none"
      >
        <Sparkles size={48} className="text-blue-500" />
      </motion.div>
    </div>
  );
}