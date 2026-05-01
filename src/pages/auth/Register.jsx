// frontend/src/pages/auth/Register.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { registerAPI } from "../../api/auth";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertCircle,
  Shield,
  ArrowRight,
  UserPlus,
  Sparkles,
  Heart,
  Award
} from "lucide-react";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    age: "",
  });

  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const [strength, setStrength] = useState(0);
  const [passwordSuggestions, setPasswordSuggestions] = useState([]);

  // Password strength calculation
  useEffect(() => {
    const pass = form.password;
    let score = 0;
    const suggestions = [];

    if (pass.length >= 8) {
      score++;
    } else if (pass.length > 0) {
      suggestions.push("Use at least 8 characters");
    }

    if (/[A-Z]/.test(pass)) {
      score++;
    } else if (pass.length > 0) {
      suggestions.push("Add an uppercase letter");
    }

    if (/[0-9]/.test(pass)) {
      score++;
    } else if (pass.length > 0) {
      suggestions.push("Add a number");
    }

    if (/[^A-Za-z0-9]/.test(pass)) {
      score++;
    } else if (pass.length > 0) {
      suggestions.push("Add a special character (!@#$%^&*)");
    }

    setStrength(score);
    setPasswordSuggestions(suggestions);
  }, [form.password]);

  const strengthConfig = {
    0: { label: "Very Weak", color: "bg-red-500", textColor: "text-red-400", width: "25%" },
    1: { label: "Weak", color: "bg-orange-500", textColor: "text-orange-400", width: "50%" },
    2: { label: "Fair", color: "bg-yellow-500", textColor: "text-yellow-400", width: "75%" },
    3: { label: "Good", color: "bg-green-500", textColor: "text-green-400", width: "85%" },
    4: { label: "Strong", color: "bg-emerald-500", textColor: "text-emerald-400", width: "100%" },
  };

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  }, []);

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const validateEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validatePhone = (phone) =>
    /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,3}[)]?[-\s\.]?[0-9]{3,4}[-\s\.]?[0-9]{4}$/.test(phone);

  const validateForm = () => {
    const newErrors = {};

    if (!form.firstName.trim()) {
      newErrors.firstName = "First name is required";
    } else if (form.firstName.length < 2) {
      newErrors.firstName = "First name must be at least 2 characters";
    }

    if (!form.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    } else if (form.lastName.length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters";
    }

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(form.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!form.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!validatePhone(form.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (!form.age) {
      newErrors.age = "Age is required";
    } else if (form.age < 13) {
      newErrors.age = "You must be at least 13 years old";
    } else if (form.age > 120) {
      newErrors.age = "Please enter a valid age";
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

    if (!accepted) {
      newErrors.terms = "You must accept the Terms & Privacy Policy";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (loading) return;
    if (!validateForm()) return;

    try {
      setLoading(true);

      await registerAPI({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim(),
        age: Number(form.age),
      });

      localStorage.setItem("email", form.email);
      localStorage.setItem("tempRegistration", "true");

      toast.success("Account created successfully! 🎉");
      toast.success("Please verify your email address");

      setTimeout(() => {
        navigate("/confirm-email", { replace: true });
      }, 1500);

    } catch (err) {
      console.error(err);
      const message = err?.response?.data?.message || "Registration failed. Please try again.";
      toast.error(message);
      
      if (err?.response?.data?.message?.includes("email")) {
        setErrors({ email: "Email already exists" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleRegister();
  };

  return (
    <div className="relative flex justify-center items-center bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4 min-h-screen overflow-hidden">
      
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="-top-40 -right-40 absolute bg-purple-600 opacity-20 blur-3xl rounded-full w-80 h-80 animate-pulse mix-blend-multiply filter"></div>
        <div className="-bottom-40 -left-40 absolute bg-blue-600 opacity-20 blur-3xl rounded-full w-80 h-80 animate-pulse delay-1000 mix-blend-multiply filter"></div>
        <div className="top-1/2 left-1/2 absolute bg-pink-600 opacity-10 blur-3xl rounded-full w-96 h-96 -translate-x-1/2 -translate-y-1/2 animate-pulse delay-2000 transform mix-blend-multiply filter"></div>
        
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
        className="z-10 relative w-full max-w-2xl"
      >
        <div className="bg-gradient-to-br from-white/10 to-transparent shadow-2xl backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
          <div className="p-6 md:p-8">
            {/* Header */}
            <div className="mb-6 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="inline-block bg-gradient-to-br from-purple-500 to-pink-500 mb-4 p-3 rounded-2xl"
              >
                <UserPlus size={32} />
              </motion.div>
              <h2 className="bg-clip-text bg-gradient-to-r from-white to-gray-400 font-bold text-transparent text-3xl">
                Create Account
              </h2>
              <p className="mt-2 text-gray-400 text-sm">
                Join our community and start receiving anonymous messages
              </p>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Name Fields */}
              <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
                <div>
                  <label className="block mb-2 font-medium text-gray-300 text-sm">
                    First Name
                  </label>
                  <div className={`relative transition-all duration-200 ${focusedField === 'firstName' ? 'scale-[1.02]' : ''}`}>
                    <User size={18} className="top-1/2 left-3 absolute text-gray-400 -translate-y-1/2 transform" />
                    <input
                      name="firstName"
                      value={form.firstName}
                      placeholder="Enter first name"
                      onChange={handleChange}
                      onFocus={() => setFocusedField('firstName')}
                      onBlur={() => {
                        setFocusedField(null);
                        handleBlur('firstName');
                      }}
                      onKeyDown={handleKeyDown}
                      className={`w-full bg-black/40 rounded-xl pl-10 pr-4 py-3 border outline-none transition-all duration-200 text-white placeholder-gray-400 ${
                        errors.firstName && touched.firstName
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-white/20 focus:border-purple-500'
                      }`}
                    />
                  </div>
                  <AnimatePresence>
                    {errors.firstName && touched.firstName && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="flex items-center gap-1 mt-1 text-red-400 text-xs"
                      >
                        <AlertCircle size={12} />
                        {errors.firstName}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <div>
                  <label className="block mb-2 font-medium text-gray-300 text-sm">
                    Last Name
                  </label>
                  <div className={`relative transition-all duration-200 ${focusedField === 'lastName' ? 'scale-[1.02]' : ''}`}>
                    <User size={18} className="top-1/2 left-3 absolute text-gray-400 -translate-y-1/2 transform" />
                    <input
                      name="lastName"
                      value={form.lastName}
                      placeholder="Enter last name"
                      onChange={handleChange}
                      onFocus={() => setFocusedField('lastName')}
                      onBlur={() => {
                        setFocusedField(null);
                        handleBlur('lastName');
                      }}
                      onKeyDown={handleKeyDown}
                      className={`w-full bg-black/40 rounded-xl pl-10 pr-4 py-3 border outline-none transition-all duration-200 text-white placeholder-gray-400 ${
                        errors.lastName && touched.lastName
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-white/20 focus:border-purple-500'
                      }`}
                    />
                  </div>
                  <AnimatePresence>
                    {errors.lastName && touched.lastName && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="flex items-center gap-1 mt-1 text-red-400 text-xs"
                      >
                        <AlertCircle size={12} />
                        {errors.lastName}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Email */}
              <div>
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
                    onBlur={() => {
                      setFocusedField(null);
                      handleBlur('email');
                    }}
                    onKeyDown={handleKeyDown}
                    className={`w-full bg-black/40 rounded-xl pl-10 pr-4 py-3 border outline-none transition-all duration-200 text-white placeholder-gray-400 ${
                      errors.email && touched.email
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-white/20 focus:border-purple-500'
                    }`}
                  />
                </div>
                <AnimatePresence>
                  {errors.email && touched.email && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="flex items-center gap-1 mt-1 text-red-400 text-xs"
                    >
                      <AlertCircle size={12} />
                      {errors.email}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Phone and Age */}
              <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
                <div>
                  <label className="block mb-2 font-medium text-gray-300 text-sm">
                    Phone Number
                  </label>
                  <div className={`relative transition-all duration-200 ${focusedField === 'phone' ? 'scale-[1.02]' : ''}`}>
                    <Phone size={18} className="top-1/2 left-3 absolute text-gray-400 -translate-y-1/2 transform" />
                    <input
                      name="phone"
                      value={form.phone}
                      placeholder="+1234567890"
                      onChange={handleChange}
                      onFocus={() => setFocusedField('phone')}
                      onBlur={() => {
                        setFocusedField(null);
                        handleBlur('phone');
                      }}
                      onKeyDown={handleKeyDown}
                      className={`w-full bg-black/40 rounded-xl pl-10 pr-4 py-3 border outline-none transition-all duration-200 text-white placeholder-gray-400 ${
                        errors.phone && touched.phone
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-white/20 focus:border-purple-500'
                      }`}
                    />
                  </div>
                  <AnimatePresence>
                    {errors.phone && touched.phone && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="flex items-center gap-1 mt-1 text-red-400 text-xs"
                      >
                        <AlertCircle size={12} />
                        {errors.phone}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <div>
                  <label className="block mb-2 font-medium text-gray-300 text-sm">
                    Age
                  </label>
                  <div className={`relative transition-all duration-200 ${focusedField === 'age' ? 'scale-[1.02]' : ''}`}>
                    <Calendar size={18} className="top-1/2 left-3 absolute text-gray-400 -translate-y-1/2 transform" />
                    <input
                      name="age"
                      type="number"
                      value={form.age}
                      placeholder="Enter your age"
                      onChange={handleChange}
                      onFocus={() => setFocusedField('age')}
                      onBlur={() => {
                        setFocusedField(null);
                        handleBlur('age');
                      }}
                      onKeyDown={handleKeyDown}
                      className={`w-full bg-black/40 rounded-xl pl-10 pr-4 py-3 border outline-none transition-all duration-200 text-white placeholder-gray-400 ${
                        errors.age && touched.age
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-white/20 focus:border-purple-500'
                      }`}
                    />
                  </div>
                  <AnimatePresence>
                    {errors.age && touched.age && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="flex items-center gap-1 mt-1 text-red-400 text-xs"
                      >
                        <AlertCircle size={12} />
                        {errors.age}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block mb-2 font-medium text-gray-300 text-sm">
                  Password
                </label>
                <div className={`relative transition-all duration-200 ${focusedField === 'password' ? 'scale-[1.02]' : ''}`}>
                  <Lock size={18} className="top-1/2 left-3 absolute text-gray-400 -translate-y-1/2 transform" />
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    placeholder="Create a password"
                    onChange={handleChange}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => {
                      setFocusedField(null);
                      handleBlur('password');
                    }}
                    onKeyDown={handleKeyDown}
                    className={`w-full bg-black/40 rounded-xl pl-10 pr-12 py-3 border outline-none transition-all duration-200 text-white placeholder-gray-400 ${
                      errors.password && touched.password
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
                      {strength === 4 && (
                        <Award size={14} className="text-emerald-400" />
                      )}
                    </div>
                    <div className="bg-gray-700 rounded-full h-1.5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: strengthConfig[strength]?.width || "0%" }}
                        className={`h-full rounded-full ${strengthConfig[strength]?.color || 'bg-red-500'} transition-all duration-300`}
                      />
                    </div>
                    {passwordSuggestions.length > 0 && strength < 3 && (
                      <div className="space-y-1 mt-2">
                        {passwordSuggestions.map((suggestion, idx) => (
                          <p key={idx} className="flex items-center gap-1 text-gray-400 text-xs">
                            <XCircle size={10} className="text-yellow-400" />
                            {suggestion}
                          </p>
                        ))}
                      </div>
                    )}
                    {strength === 4 && (
                      <p className="flex items-center gap-1 mt-1 text-emerald-400 text-xs">
                        <CheckCircle size={12} />
                        Strong password!
                      </p>
                    )}
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

              {/* Confirm Password */}
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
                    placeholder="Confirm your password"
                    onChange={handleChange}
                    onFocus={() => setFocusedField('confirmPassword')}
                    onBlur={() => {
                      setFocusedField(null);
                      handleBlur('confirmPassword');
                    }}
                    onKeyDown={handleKeyDown}
                    className={`w-full bg-black/40 rounded-xl pl-10 pr-12 py-3 border outline-none transition-all duration-200 text-white placeholder-gray-400 ${
                      errors.confirmPassword && touched.confirmPassword
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-white/20 focus:border-purple-500'
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
                      <XCircle size={12} />
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

              {/* Terms and Conditions */}
              <div className="flex items-start gap-3 pt-2">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={() => setAccepted(!accepted)}
                  className="bg-white/10 mt-0.5 border-white/20 rounded focus:ring-purple-500 focus:ring-offset-0 w-4 h-4 text-purple-500"
                />
                <label className="text-gray-300 text-sm">
                  I accept the{" "}
                  <button
                    type="button"
                    onClick={() => toast("Terms and Conditions - Coming Soon")}
                    className="text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Terms of Service
                  </button>{" "}
                  and{" "}
                  <button
                    type="button"
                    onClick={() => toast("Privacy Policy - Coming Soon")}
                    className="text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Privacy Policy
                  </button>
                </label>
              </div>
              <AnimatePresence>
                {errors.terms && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="flex items-center gap-1 text-red-400 text-xs"
                  >
                    <AlertCircle size={12} />
                    {errors.terms}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Register Button */}
              <motion.button
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                onClick={handleRegister}
                disabled={loading}
                className="group relative bg-gradient-to-r from-purple-500 hover:from-purple-600 to-pink-500 hover:to-pink-600 disabled:opacity-50 shadow-lg py-3 rounded-xl w-full overflow-hidden font-semibold text-white transition-all duration-200 disabled:cursor-not-allowed"
              >
                <span className="z-10 relative flex justify-center items-center gap-2">
                  {loading ? (
                    <>
                      <div className="border-2 border-white/30 border-t-white rounded-full w-5 h-5 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Register Now
                      <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </span>
              </motion.button>

              {/* Login Link */}
              <div className="pt-4 text-center">
                <p className="text-gray-400 text-sm">
                  Already have an account?{" "}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate("/login")}
                    className="inline-flex items-center gap-1 font-semibold text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Sign In
                    <ArrowRight size={14} />
                  </motion.button>
                </p>
              </div>

              {/* Security Note */}
              <div className="bg-purple-500/10 mt-4 p-3 border border-purple-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-gray-400 text-xs">
                  <Shield size={14} className="text-purple-400" />
                  <span>Your information is encrypted and secure. We never share your data.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating Hearts Animation */}
      <motion.div
        animate={{
          y: [0, -30, 0],
          rotate: [0, 10, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="hidden lg:block bottom-10 left-10 fixed opacity-20 pointer-events-none"
      >
        <Heart size={48} className="text-pink-500" />
      </motion.div>

      <motion.div
        animate={{
          y: [0, 30, 0],
          rotate: [0, -10, 0],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
        className="hidden lg:block top-10 right-10 fixed opacity-20 pointer-events-none"
      >
        <Shield size={48} className="text-purple-500" />
      </motion.div>
    </div>
  );
}