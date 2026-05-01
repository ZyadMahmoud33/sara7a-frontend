// frontend/src/pages/auth/ResetPassword.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { resetPasswordAPI } from "../../api/auth";
import {
  Mail,
  Key,
  Lock,
  Eye,
  EyeOff,
  Shield,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  MessageCircle,
  RefreshCw
} from "lucide-react";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  // =========================
  // 🧠 INIT STATE
  // =========================
  const [form, setForm] = useState({
    email: location.state?.email || "",
    otp: location.state?.otp || "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [strength, setStrength] = useState(0);

  // =========================
  // 🔐 GUARD
  // =========================
  useEffect(() => {
    if (!location.state?.email) {
      toast.error("Please start from Forget Password ❌");
      navigate("/forget-password", { replace: true });
    }
  }, [location.state, navigate]);

  // =========================
  // 🔐 PASSWORD STRENGTH
  // =========================
  useEffect(() => {
    const pass = form.password;
    let score = 0;

    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    setStrength(score);
  }, [form.password]);

  const strengthConfig = {
    0: { label: "Very Weak", color: "bg-red-500", textColor: "text-red-400", width: "25%" },
    1: { label: "Weak", color: "bg-orange-500", textColor: "text-orange-400", width: "50%" },
    2: { label: "Fair", color: "bg-yellow-500", textColor: "text-yellow-400", width: "75%" },
    3: { label: "Good", color: "bg-green-500", textColor: "text-green-400", width: "85%" },
    4: { label: "Strong", color: "bg-emerald-500", textColor: "text-emerald-400", width: "100%" },
  };

  // =========================
  // 🔄 HANDLE CHANGE
  // =========================
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }, []);

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // =========================
  // ✅ VALIDATION
  // =========================
  const validate = () => {
    const newErrors = {};

    if (!form.otp) {
      newErrors.otp = "OTP is required";
    } else if (form.otp.length < 4) {
      newErrors.otp = "OTP must be at least 4 digits";
    }

    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    } else if (strength < 2) {
      newErrors.password = "Password is too weak";
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // =========================
  // 🚀 SUBMIT
  // =========================
  const handleSubmit = async () => {
    if (loading) return;
    if (!validate()) return;

    try {
      setLoading(true);

      await resetPasswordAPI({
        email: form.email,
        otp: form.otp,
        newPassword: form.password,
      });

      toast.success("Password reset successfully! 🔥");
      toast.success("Please login with your new password");

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1500);

    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Reset failed ❌");
      
      if (err?.response?.data?.message?.includes("OTP")) {
        setErrors({ otp: "Invalid or expired OTP" });
      }
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // ⌨️ SUBMIT ON ENTER
  // =========================
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className="relative flex justify-center items-center bg-gradient-to-br from-gray-900 via-black to-gray-900 px-4 min-h-screen overflow-hidden">

      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="-top-40 -right-40 absolute bg-cyan-600 opacity-20 blur-3xl rounded-full w-80 h-80 animate-pulse mix-blend-multiply filter"></div>
        <div className="-bottom-40 -left-40 absolute bg-blue-600 opacity-20 blur-3xl rounded-full w-80 h-80 animate-pulse delay-1000 mix-blend-multiply filter"></div>
        <div className="top-1/2 left-1/2 absolute bg-purple-600 opacity-10 blur-3xl rounded-full w-96 h-96 -translate-x-1/2 -translate-y-1/2 animate-pulse delay-2000 transform mix-blend-multiply filter"></div>

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
                className="inline-block bg-gradient-to-br from-cyan-500 to-blue-500 mb-4 p-3 rounded-2xl"
              >
                <RefreshCw size={32} />
              </motion.div>
              <h2 className="bg-clip-text bg-gradient-to-r from-white to-gray-400 font-bold text-transparent text-3xl">
                Reset Password
              </h2>
              <p className="mt-2 text-gray-400 text-sm">
                Create a new strong password for your account
              </p>
            </div>

            {/* Email Display */}
            <div className="bg-cyan-500/10 mb-6 p-3 border border-cyan-500/30 rounded-xl">
              <div className="flex justify-center items-center gap-2">
                <Mail size={16} className="text-cyan-400" />
                <span className="text-gray-200 text-sm break-all">{form.email}</span>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-4">

              {/* OTP Field */}
              <div>
                <label className="block mb-2 font-medium text-gray-300 text-sm">
                  Verification Code
                </label>
                <div className={`relative transition-all duration-200 ${focusedField === 'otp' ? 'scale-[1.02]' : ''}`}>
                  <Key size={18} className="top-1/2 left-3 absolute text-gray-400 -translate-y-1/2 transform" />
                  <input
                    name="otp"
                    value={form.otp}
                    onChange={handleChange}
                    onBlur={() => handleBlur('otp')}
                    onFocus={() => setFocusedField('otp')}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter OTP"
                    maxLength={6}
                    className={`w-full bg-black/40 rounded-xl pl-10 pr-4 py-3 border outline-none transition-all duration-200 text-center tracking-[0.25em] font-mono text-lg text-white placeholder-gray-400 ${
                      errors.otp && touched.otp
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-white/20 focus:border-cyan-500'
                    }`}
                  />
                </div>
                <AnimatePresence>
                  {errors.otp && touched.otp && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="flex items-center gap-1 mt-1 text-red-400 text-xs"
                    >
                      <AlertCircle size={12} />
                      {errors.otp}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* New Password Field */}
              <div>
                <label className="block mb-2 font-medium text-gray-300 text-sm">
                  New Password
                </label>
                <div className={`relative transition-all duration-200 ${focusedField === 'password' ? 'scale-[1.02]' : ''}`}>
                  <Lock size={18} className="top-1/2 left-3 absolute text-gray-400 -translate-y-1/2 transform" />
                  <input
                    name="password"
                    type={showPass ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    onBlur={() => handleBlur('password')}
                    onFocus={() => setFocusedField('password')}
                    onKeyDown={handleKeyDown}
                    placeholder="New Password (min 6 characters)"
                    className={`w-full bg-black/40 rounded-xl pl-10 pr-12 py-3 border outline-none transition-all duration-200 text-white placeholder-gray-400 ${
                      errors.password && touched.password
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-white/20 focus:border-cyan-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="top-1/2 right-3 absolute text-gray-400 hover:text-white transition-colors -translate-y-1/2 transform"
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {form.password && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-xs ${strengthConfig[strength]?.textColor || 'text-gray-400'}`}>
                        Password Strength: {strengthConfig[strength]?.label || "Very Weak"}
                      </span>
                    </div>
                    <div className="bg-gray-700 rounded-full h-1.5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: strengthConfig[strength]?.width || "0%" }}
                        className={`h-full rounded-full ${strengthConfig[strength]?.color || 'bg-red-500'} transition-all duration-300`}
                      />
                    </div>
                  </motion.div>
                )}

                <AnimatePresence>
                  {errors.password && touched.password && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="flex items-center gap-1 mt-1 text-red-400 text-xs"
                    >
                      <AlertCircle size={12} />
                      {errors.password}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block mb-2 font-medium text-gray-300 text-sm">
                  Confirm Password
                </label>
                <div className={`relative transition-all duration-200 ${focusedField === 'confirmPassword' ? 'scale-[1.02]' : ''}`}>
                  <Lock size={18} className="top-1/2 left-3 absolute text-gray-400 -translate-y-1/2 transform" />
                  <input
                    name="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={handleChange}
                    onBlur={() => handleBlur('confirmPassword')}
                    onFocus={() => setFocusedField('confirmPassword')}
                    onKeyDown={handleKeyDown}
                    placeholder="Confirm your new password"
                    className={`w-full bg-black/40 rounded-xl pl-10 pr-12 py-3 border outline-none transition-all duration-200 text-white placeholder-gray-400 ${
                      errors.confirmPassword && touched.confirmPassword
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-white/20 focus:border-cyan-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="top-1/2 right-3 absolute text-gray-400 hover:text-white transition-colors -translate-y-1/2 transform"
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <AnimatePresence>
                  {errors.confirmPassword && touched.confirmPassword && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="flex items-center gap-1 mt-1 text-red-400 text-xs"
                    >
                      <AlertCircle size={12} />
                      {errors.confirmPassword}
                    </motion.p>
                  )}
                  {form.confirmPassword && !errors.confirmPassword && form.password === form.confirmPassword && form.password && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-1 mt-1 text-green-400 text-xs"
                    >
                      <CheckCircle size={12} />
                      Passwords match
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Reset Button */}
              <motion.button
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                onClick={handleSubmit}
                disabled={loading}
                className="group relative bg-gradient-to-r from-cyan-500 hover:from-cyan-600 to-blue-500 hover:to-blue-600 disabled:opacity-50 shadow-lg mt-4 py-3 rounded-xl w-full overflow-hidden font-semibold text-white transition-all duration-200 disabled:cursor-not-allowed"
              >
                <span className="z-10 relative flex justify-center items-center gap-2">
                  {loading ? (
                    <>
                      <div className="border-2 border-white/30 border-t-white rounded-full w-5 h-5 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={18} />
                      Reset Password
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
            <div className="bg-cyan-500/10 mt-6 p-3 border border-cyan-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-gray-400 text-xs">
                <Shield size={14} className="text-cyan-400" />
                <span>Your new password must be different from your previous passwords.</span>
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