// frontend/src/pages/auth/ForgetPassword.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { forgetPasswordAPI, resendOtpAPI } from "../../api/auth";
import {
  Mail,
  Key,
  ArrowLeft,
  Send,
  CheckCircle,
  AlertCircle,
  Shield,
  Lock,
  RefreshCw,
  ChevronRight,
  Clock,
  MessageCircle,
  Sparkles
} from "lucide-react";

export default function ForgetPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [timer, setTimer] = useState(0);
  const [emailError, setEmailError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [focusedField, setFocusedField] = useState(null);

  // Timer effect
  useEffect(() => {
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const validateEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setEmailError("");
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    setOtp(value);
    setOtpError("");
  };

  // Send OTP
  const sendOTP = async () => {
    if (loading) return;

    if (!email.trim()) {
      setEmailError("Email is required");
      return toast.error("Please enter your email address");
    }

    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return toast.error("Invalid email format");
    }

    try {
      setLoading(true);

      await forgetPasswordAPI({ email });

      toast.success("OTP sent successfully! Check your email 📩");
      setStep(2);
      setTimer(60);

    } catch (err) {
      const message = err?.response?.data?.message || "Failed to send OTP";
      toast.error(message);
      if (message.toLowerCase().includes("not found")) {
        setEmailError("No account found with this email");
      }
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const resendOTP = async () => {
    if (timer > 0 || resendLoading) return;

    try {
      setResendLoading(true);

      await resendOtpAPI({ email });

      toast.success("OTP resent successfully 🔁");
      setTimer(60);

    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to resend OTP");
    } finally {
      setResendLoading(false);
    }
  };

  // Verify OTP
  const verifyOTP = () => {
    if (!otp.trim()) {
      setOtpError("OTP is required");
      return toast.error("Please enter the OTP");
    }

    if (otp.length < 4) {
      setOtpError("OTP must be at least 4 digits");
      return toast.error("Invalid OTP format");
    }

    navigate("/reset-password", {
      state: { email, otp },
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (step === 1) sendOTP();
      else verifyOTP();
    }
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
        <div className="-top-40 -right-40 absolute bg-cyan-600 opacity-20 blur-3xl rounded-full w-80 h-80 animate-pulse mix-blend-multiply filter"></div>
        <div className="-bottom-40 -left-40 absolute bg-blue-600 opacity-20 blur-3xl rounded-full w-80 h-80 animate-pulse delay-1000 mix-blend-multiply filter"></div>
        <div className="top-1/2 left-1/2 absolute bg-purple-600 opacity-10 blur-3xl rounded-full w-96 h-96 -translate-x-1/2 -translate-y-1/2 animate-pulse delay-2000 transform mix-blend-multiply filter"></div>
        
        {/* Floating particles */}
        {[...Array(25)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-white/20 rounded-full w-1 h-1"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              y: [null, -40, 40, -40],
              x: [null, 40, -40, 40],
            }}
            transition={{
              duration: Math.random() * 12 + 8,
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
                className="inline-block bg-gradient-to-br from-cyan-500 to-blue-500 mb-4 p-3 rounded-2xl"
              >
                <Lock size={32} />
              </motion.div>
              <h2 className="bg-clip-text bg-gradient-to-r from-white to-gray-400 font-bold text-transparent text-3xl">
                Reset Password
              </h2>
              <p className="mt-2 text-gray-400 text-sm">
                {step === 1 
                  ? "Enter your email to receive a verification code" 
                  : "Enter the 6-digit code sent to your email"}
              </p>
            </div>

            {/* Step Indicator */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 text-xs">Step {step} of 2</span>
                <span className="text-gray-400 text-xs">
                  {step === 1 ? "Account Recovery" : "Verification"}
                </span>
              </div>
              <div className="flex gap-2">
                <motion.div 
                  animate={{ width: step === 1 ? "50%" : "100%" }}
                  className={`h-2 rounded-full transition-all duration-500 ${
                    step >= 1 ? "bg-gradient-to-r from-cyan-500 to-blue-500" : "bg-gray-700"
                  }`}
                  style={{ width: step === 1 ? "50%" : "100%" }}
                />
                <motion.div 
                  animate={{ width: step === 2 ? "100%" : "50%" }}
                  className={`h-2 rounded-full transition-all duration-500 ${
                    step >= 2 ? "bg-gradient-to-r from-cyan-500 to-blue-500" : "bg-gray-700"
                  }`}
                  style={{ width: step === 1 ? "50%" : "100%" }}
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {/* Step 1 - Email */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block mb-2 font-medium text-gray-300 text-sm">
                      Email Address
                    </label>
                    <div className={`relative transition-all duration-200 ${focusedField === 'email' ? 'scale-[1.02]' : ''}`}>
                      <Mail size={18} className="top-1/2 left-3 absolute text-gray-400 -translate-y-1/2 transform" />
                      <input
                        type="email"
                        placeholder="Enter your registered email"
                        value={email}
                        onChange={handleEmailChange}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        onKeyDown={handleKeyDown}
                        className={`w-full bg-black/40 rounded-xl pl-10 pr-4 py-3 border outline-none transition-all duration-200 text-white placeholder-gray-400 ${
                          emailError
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-white/20 focus:border-cyan-500'
                        }`}
                      />
                    </div>
                    <AnimatePresence>
                      {emailError && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="flex items-center gap-1 mt-1 text-red-400 text-xs"
                        >
                          <AlertCircle size={12} />
                          {emailError}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  <motion.button
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    onClick={sendOTP}
                    disabled={loading}
                    className="group relative bg-gradient-to-r from-cyan-500 hover:from-cyan-600 to-blue-500 hover:to-blue-600 disabled:opacity-50 shadow-lg py-3 rounded-xl w-full overflow-hidden font-semibold text-white transition-all duration-200 disabled:cursor-not-allowed"
                  >
                    <span className="z-10 relative flex justify-center items-center gap-2">
                      {loading ? (
                        <>
                          <div className="border-2 border-white/30 border-t-white rounded-full w-5 h-5 animate-spin" />
                          Sending OTP...
                        </>
                      ) : (
                        <>
                          <Send size={18} />
                          Send Verification Code
                          <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                        </>
                      )}
                    </span>
                  </motion.button>
                </motion.div>
              )}

              {/* Step 2 - OTP Verification */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block mb-2 font-medium text-gray-300 text-sm">
                      Verification Code
                    </label>
                    <div className={`relative transition-all duration-200 ${focusedField === 'otp' ? 'scale-[1.02]' : ''}`}>
                      <Key size={18} className="top-1/2 left-3 absolute text-gray-400 -translate-y-1/2 transform" />
                      <input
                        placeholder="Enter 6-digit code"
                        value={otp}
                        onChange={handleOtpChange}
                        onFocus={() => setFocusedField('otp')}
                        onBlur={() => setFocusedField(null)}
                        onKeyDown={handleKeyDown}
                        maxLength={6}
                        className={`w-full bg-black/40 rounded-xl pl-10 pr-4 py-3 border outline-none transition-all duration-200 text-center tracking-[0.25em] font-mono text-lg text-white placeholder-gray-400 ${
                          otpError
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-white/20 focus:border-green-500'
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

                  <div className="bg-cyan-500/10 p-3 border border-cyan-500/30 rounded-xl">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <MessageCircle size={16} className="text-cyan-400" />
                        <span className="text-gray-200 text-xs">
                          We sent a code to {email}
                        </span>
                      </div>
                      {timer > 0 && (
                        <div className="flex items-center gap-1 text-cyan-400 text-xs">
                          <Clock size={12} />
                          <span>{formatTime(timer)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={verifyOTP}
                    className="bg-gradient-to-r from-green-500 hover:from-green-600 to-emerald-500 hover:to-emerald-600 shadow-lg py-3 rounded-xl w-full font-semibold text-white transition-all duration-200"
                  >
                    Verify & Continue ✅
                  </motion.button>

                  {/* Resend Section */}
                  <div className="text-center">
                    {timer > 0 ? (
                      <div className="flex justify-center items-center gap-2 text-gray-400 text-sm">
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Resend available in {formatTime(timer)}</span>
                      </div>
                    ) : (
                      <button
                        onClick={resendOTP}
                        disabled={resendLoading}
                        className="flex justify-center items-center gap-2 mx-auto text-cyan-400 hover:text-cyan-300 text-sm transition-colors"
                      >
                        {resendLoading ? (
                          <>
                            <div className="border-2 border-cyan-400/30 border-t-cyan-400 rounded-full w-4 h-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <RefreshCw size={14} />
                            Resend OTP
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Back to Login Link */}
            <div className="mt-6 pt-4 border-white/10 border-t">
              <button
                onClick={() => navigate("/login")}
                className="flex justify-center items-center gap-2 w-full text-gray-400 hover:text-white text-sm transition-colors"
              >
                <ArrowLeft size={14} />
                Back to Login
              </button>
            </div>

            {/* Security Note */}
            <div className="bg-cyan-500/10 mt-4 p-3 border border-cyan-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-gray-400 text-xs">
                <Shield size={14} className="text-cyan-400" />
                <span>For security reasons, the OTP will expire in 10 minutes.</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating Decorations */}
      <motion.div
        animate={{
          y: [0, -25, 0],
          rotate: [0, 10, 0],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="hidden lg:block bottom-10 left-10 fixed opacity-20 pointer-events-none"
      >
        <Shield size={48} className="text-cyan-500" />
      </motion.div>

      <motion.div
        animate={{
          y: [0, 25, 0],
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