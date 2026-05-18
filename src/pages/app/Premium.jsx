// frontend/src/pages/Premium.jsx
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  createCheckoutSessionAPI,
  createManualPaymentAPI,
  upgradePlanAPI,
  getProfileAPI,
} from "../../api/user";
import PaymentModal from "../../components/PaymentModal";
import { cn } from "@/lib/utils";
import {
  Crown,
  Star,
  Rocket,
  Check,
  X,
  Zap,
  Shield,
  MessageCircle,
  Eye,
  Clock,
  CreditCard,
  TrendingUp,
  Award,
  Sparkles,
  ArrowLeft,
  Coins,
  Infinity,
  Mail,
  Headphones,
  BarChart3,
  Palette,
  Code,
  Smartphone,
  Building,
  ExternalLink,
  Copy,
  CheckCircle,
  AlertCircle,
  Loader,
  Gift,
  Wallet,
  Send,
  QrCode,
  Lock,
  Globe,
  Orbit,
  Satellite
} from "lucide-react";
import confetti from "canvas-confetti";

// ================================
// 🌟 Starfield Canvas Component
// ================================
const Starfield = () => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let stars = [];
    let coloredStars = [];
    let animationId;
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    class Star {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speed = Math.random() * 0.2;
        this.opacity = Math.random() * 0.8 + 0.2;
        this.twinkleSpeed = Math.random() * 0.02 + 0.005;
        this.twinkleDir = Math.random() > 0.5 ? 1 : -1;
      }
      
      update() {
        this.y += this.speed;
        if (this.y > canvas.height) {
          this.y = 0;
          this.x = Math.random() * canvas.width;
        }
        this.opacity += this.twinkleSpeed * this.twinkleDir;
        if (this.opacity >= 1 || this.opacity <= 0.2) this.twinkleDir *= -1;
      }
      
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.fill();
      }
    }
    
    class ColoredStar {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speed = Math.random() * 0.1;
        this.colors = ['#a855f7', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#3b82f6'];
        this.color = this.colors[Math.floor(Math.random() * this.colors.length)];
        this.opacity = Math.random() * 0.6 + 0.3;
        this.pulseSpeed = Math.random() * 0.02 + 0.005;
        this.pulseDir = 1;
      }
      
      update() {
        this.y += this.speed;
        if (this.y > canvas.height) {
          this.y = 0;
          this.x = Math.random() * canvas.width;
        }
        this.opacity += this.pulseSpeed * this.pulseDir;
        if (this.opacity >= 0.8 || this.opacity <= 0.3) this.pulseDir *= -1;
      }
      
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `${this.color}${Math.floor(this.opacity * 255).toString(16).padStart(2, '0')}`;
        ctx.fill();
      }
    }
    
    for (let i = 0; i < 400; i++) stars.push(new Star());
    for (let i = 0; i < 80; i++) coloredStars.push(new ColoredStar());
    
    const animate = () => {
      ctx.fillStyle = '#050510';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, 'rgba(88, 28, 135, 0.15)');
      gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.08)');
      gradient.addColorStop(1, 'rgba(236, 72, 153, 0.12)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      stars.forEach(star => { star.update(); star.draw(); });
      coloredStars.forEach(star => { star.update(); star.draw(); });
      
      animationId = requestAnimationFrame(animate);
    };
    
    resize();
    window.addEventListener('resize', resize);
    animate();
    
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);
  
  return <canvas ref={canvasRef} className={cn('z-0', 'fixed', 'inset-0', 'w-full', 'h-full', 'pointer-events-none')} />;
};

// ================================
// 🔗 تكامل تطبيقات الدفع
// ================================

const APP_LINKS = {
  vodafone: {
    name: "Vodafone Cash",
    ios: "vodafonecash://",
    android: "vodafonecash://",
    webApp: "https://vodafonecash.vodafone.com.eg/",
    market: {
      ios: "https://apps.apple.com/eg/app/vodafone-cash/id1234567890",
      android: "https://play.google.com/store/apps/details?id=com.vodafone.cash"
    },
    accountNumber: "01067309450",
    accountName: "Sara7a App",
    deepLinkSupported: true,
    instructions: [
      "افتح تطبيق Vodafone Cash",
      "اختر 'تحويل الأموال'",
      "أدخل رقم الحساب: 01067309450",
      "أدخل المبلغ المطلوب",
      "اكتب الرقم المرجعي واحفظ الإيصال"
    ]
  },
  instapay: {
    name: "InstaPay",
    ios: "instapay://",
    android: "instapay://",
    webApp: "https://instapay.gov.eg/",
    market: {
      ios: "https://apps.apple.com/eg/app/instapay/id1234567890",
      android: "https://play.google.com/store/apps/details?id=eg.gov.instapay"
    },
    accountNumber: "instapay@sara7a.com",
    accountName: "Sara7a App",
    deepLinkSupported: true,
    instructions: [
      "افتح تطبيق InstaPay",
      "اختر 'تحويل'",
      "أدخل البريد الإلكتروني: instapay@sara7a.com",
      "أدخل المبلغ المطلوب",
      "قم بتأكيد التحويل واحفظ الإيصال"
    ]
  }
};

export default function Premium() {
  const navigate = useNavigate();

  const [selected, setSelected] = useState("premium");
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billing, setBilling] = useState("monthly");
  const [hoveredPlan, setHoveredPlan] = useState(null);
  const [savedAmount, setSavedAmount] = useState(0);
  const [currentPlan, setCurrentPlan] = useState("free");
  const [userCoins, setUserCoins] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

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
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const mobile = /android|webos|iphone|ipad|ipod|blackberry|windows phone/i.test(userAgent);
    const ios = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    const android = /Android/.test(userAgent);
    
    setIsMobile(mobile);
    setIsIOS(ios);
    setIsAndroid(android);
  }, []);

  useEffect(() => {
    const fetchCurrentPlan = async () => {
      try {
        const userData = await getProfileAPI();
        setCurrentPlan(userData?.plan || "free");
        setUserCoins(userData?.coins || 0);
      } catch (err) {
        console.error("Failed to fetch user plan:", err);
      }
    };
    fetchCurrentPlan();
  }, []);

  useEffect(() => {
    const proMonthly = 2.99;
    const proYearly = 28.99;
    const proSavings = (proMonthly * 12) - proYearly;
    const premiumMonthly = 5.99;
    const premiumYearly = 59.99;
    const premiumSavings = (premiumMonthly * 12) - premiumYearly;
    setSavedAmount(Math.max(proSavings, premiumSavings));
  }, [billing]);

  const openAppOrMarket = useCallback((appKey) => {
    const app = APP_LINKS[appKey];
    if (!app) return;
    const deepLink = isIOS ? app.ios : app.android;
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = deepLink;
    document.body.appendChild(iframe);
    setTimeout(() => {
      document.body.removeChild(iframe);
      const marketUrl = isIOS ? app.market.ios : app.market.android;
      if (marketUrl) window.open(marketUrl, '_blank');
      else window.open(app.webApp, '_blank');
    }, 2000);
  }, [isIOS, isAndroid]);

  const copyAccountNumber = useCallback(async (appKey) => {
    const app = APP_LINKS[appKey];
    if (!app) return;
    try {
      await navigator.clipboard.writeText(app.accountNumber);
      toast.success(`تم نسخ ${app.accountNumber} بنجاح! 📋`);
    } catch {
      toast.error("فشل نسخ الرقم ❌");
    }
  }, []);

  const triggerConfetti = () => {
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#a855f7', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'] });
  };

  const plans = [
    {
      id: "free",
      name: "Free",
      icon: Shield,
      price: { monthly: "$0", yearly: "$0" },
      priceValue: { monthly: 0, yearly: 0 },
      desc: "Perfect for getting started",
      features: [
        { text: "Receive unlimited messages", included: true, icon: MessageCircle },
        { text: "Anonymous replies", included: true, icon: Eye },
        { text: "Reveal sender identity", included: false, icon: Lock },
        { text: "Priority support", included: false, icon: Headphones },
        { text: "Remove ads", included: false, icon: Shield },
        { text: "Coins per month", included: false, value: "0", icon: Coins },
      ],
      color: "from-gray-600 to-gray-800",
      borderColor: "border-gray-700",
      buttonColor: "bg-gray-700 hover:bg-gray-600",
      glow: "shadow-gray-500/20",
    },
    {
      id: "pro",
      name: "Pro",
      icon: Rocket,
      price: { monthly: "$2.99", yearly: "$28.99" },
      priceValue: { monthly: 2.99, yearly: 28.99 },
      desc: "For power users",
      features: [
        { text: "Everything in Free", included: true, icon: Check },
        { text: "Reveal sender", included: true, value: "50/month", icon: Eye },
        { text: "Priority email support", included: true, icon: Mail },
        { text: "Message analytics", included: true, icon: BarChart3 },
        { text: "Remove ads", included: false, icon: Shield },
        { text: "Coins per month", included: true, value: "100 coins", icon: Coins, highlight: true },
      ],
      color: "from-cyan-500 to-blue-600",
      borderColor: "border-cyan-500/50",
      buttonColor: "bg-gradient-to-r from-cyan-500 to-blue-600",
      popular: true,
      glow: "shadow-cyan-500/30",
    },
    {
      id: "premium",
      name: "Premium",
      icon: Crown,
      price: { monthly: "$5.99", yearly: "$59.99" },
      priceValue: { monthly: 5.99, yearly: 59.99 },
      desc: "Ultimate experience",
      features: [
        { text: "Everything in Pro", included: true, icon: Check },
        { text: "Unlimited reveal sender", included: true, value: "∞", icon: Infinity },
        { text: "24/7 Priority support", included: true, icon: Headphones },
        { text: "Remove all ads", included: true, icon: Shield },
        { text: "Advanced analytics", included: true, icon: BarChart3 },
        { text: "Coins per month", included: true, value: "300 coins", icon: Coins, highlight: true },
      ],
      color: "from-yellow-500 to-orange-600",
      borderColor: "border-yellow-500/50",
      buttonColor: "bg-gradient-to-r from-yellow-500 to-orange-600",
      best: true,
      glow: "shadow-yellow-500/30",
    },
  ];

  const handleSelect = (planId) => {
    if (loading) return;
    if (planId === currentPlan) {
      toast.success(`You are already on the ${planId} plan! 🎉`);
      return;
    }
    setSelected(planId);
    setSelectedPlan(planId);
    if (planId === "free") return handleFreePlan();
    setShowPayment(true);
  };

  const handleFreePlan = async () => {
    try {
      setLoading(true);
      const result = await upgradePlanAPI({ plan: "free" });
      toast.success(result?.message || "Switched to Free Plan ✅");
      setCurrentPlan("free");
      setUserCoins(0);
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) {
      toast.error(err?.message || "Failed to switch plan ❌");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (method, screenshot, paymentData = {}) => {
    if (loading) return;
    try {
      setLoading(true);
      if (!selectedPlan) throw new Error("No plan selected");
      if (method === "card") {
        const data = await createCheckoutSessionAPI({ plan: selectedPlan, billingPeriod: billing });
        if (!data?.url) throw new Error("Payment session failed");
        window.location.href = data.url;
        return;
      }
      if (!screenshot) throw new Error("Screenshot is required");
      await createManualPaymentAPI({ plan: selectedPlan, method, screenshot });
      toast.success("تم إرسال طلب الدفع بنجاح! في انتظار الموافقة ⏳");
      triggerConfetti();
      setShowPayment(false);
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (err) {
      console.error("Payment error:", err);
      toast.error(err?.response?.data?.message || err?.message || "فشل الدفع ❌");
    } finally {
      setLoading(false);
    }
  };

  const getAnnualSavings = (plan) => {
    if (billing === "yearly" && plan.priceValue) {
      const monthlyTotal = plan.priceValue.monthly * 12;
      const savings = monthlyTotal - plan.priceValue.yearly;
      return Math.round(savings * 100) / 100;
    }
    return 0;
  };

  const isCurrentPlan = (planId) => currentPlan === planId;
  const getButtonText = (planId) => {
    if (loading && selected === planId) return "Processing...";
    if (isCurrentPlan(planId)) return "Current Plan";
    if (planId === "free") return "Switch to Free";
    return "Upgrade Now";
  };

  return (
    <div className={cn('relative', 'bg-[#050510]', 'min-h-screen', 'overflow-hidden', 'text-white')}>
      {/* Starfield Background */}
      <Starfield />
      
      {/* Animated Nebula Orbs */}
      <div className={cn('z-0', 'fixed', 'inset-0', 'pointer-events-none')}>
        <div className={cn('top-20', 'right-10', 'absolute', 'bg-purple-600/20', 'blur-[120px]', 'rounded-full', 'w-96', 'h-96', 'animate-pulse')} style={{ animationDuration: '8s' }} />
        <div className={cn('bottom-20', 'left-10', 'absolute', 'bg-orange-600/15', 'blur-[100px]', 'rounded-full', 'w-80', 'h-80', 'animate-pulse')} style={{ animationDuration: '10s', animationDelay: '2s' }} />
        <div className={cn('top-1/2', 'left-1/2', 'absolute', 'bg-yellow-600/10', 'blur-[80px]', 'rounded-full', 'w-64', 'h-64', '-translate-x-1/2', '-translate-y-1/2', 'animate-pulse')} style={{ animationDuration: '12s', animationDelay: '4s' }} />
        <div className={cn('top-1/3', 'right-1/4', 'absolute', 'bg-cyan-600/10', 'blur-[100px]', 'rounded-full', 'w-72', 'h-72', 'animate-pulse')} style={{ animationDuration: '14s', animationDelay: '6s' }} />
      </div>

      {/* Floating Particles */}
      {/* ✨ CSS Stars Background - 500 نجمة بتملى الشاشة */}
      <div className="stars">
        {[...Array(500)].map((_, i) => (
          <div
            key={i}
            className="star"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 3 + 1}s`,
              backgroundColor: ['#ffffff', '#a855f7', '#ec4899', '#06b6d4', '#f59e0b'][Math.floor(Math.random() * 5)],
              boxShadow: `0 0 ${Math.random() * 5 + 2}px ${['#a855f7', '#ec4899', '#06b6d4', '#f59e0b'][Math.floor(Math.random() * 4)]}`
            }}
          />
        ))}
      </div>

      <div className={cn('z-10', 'relative', 'mx-auto', 'p-4', 'md:p-6', 'max-w-7xl')}>
        {/* Current Plan Badge */}
        {currentPlan !== "free" && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn('flex', 'justify-center', 'mb-4')}
          >
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className={`px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 shadow-lg ${
                currentPlan === "premium" 
                  ? "bg-gradient-to-r from-yellow-500 to-orange-500 shadow-yellow-500/30" 
                  : "bg-gradient-to-r from-cyan-500 to-blue-600 shadow-cyan-500/30"
              }`}
            >
              {currentPlan === "premium" ? <Crown size={16} className="text-yellow-300" /> : <Rocket size={16} />}
              Current Plan: {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
              {currentPlan === "pro" && (
                <span className={cn('flex', 'items-center', 'gap-1', 'bg-white/20', 'ml-1', 'px-2', 'py-0.5', 'rounded', 'text-xs')}>
                  <Coins size={10} /> {userCoins} coins
                </span>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateX(${mousePosition.y * 0.1}deg) rotateY(${mousePosition.x * 0.1}deg)`,
          }}
          className={cn('relative', 'mb-12', 'text-center')}
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring" }}
            className={cn('inline-block', 'relative', 'mb-4')}
          >
            <div className={cn('absolute', 'inset-0', 'bg-gradient-to-r', 'from-yellow-500', 'to-orange-600', 'blur-xl', 'rounded-2xl', 'animate-pulse')} />
            <div className={cn('relative', 'bg-gradient-to-r', 'from-yellow-500', 'to-orange-600', 'p-4', 'rounded-2xl')}>
              <Crown size={48} className="text-white" />
            </div>
          </motion.div>
          
          <h1 className={cn('bg-clip-text', 'bg-gradient-to-r', 'from-yellow-400', 'via-orange-500', 'to-red-500', 'mb-4', 'font-bold', 'text-transparent', 'text-5xl', 'md:text-7xl')}>
            Upgrade Your Experience
          </h1>
          
          <p className={cn('mx-auto', 'max-w-2xl', 'text-gray-400', 'text-lg')}>
            Choose the perfect plan for your needs and unlock exclusive features
          </p>

          {/* Billing Toggle */}
          <div className={cn('flex', 'justify-center', 'mt-8')}>
            <div className={cn('relative', 'bg-white/10', 'backdrop-blur-xl', 'p-1', 'rounded-full')}>
              <div className={cn('flex', 'gap-1')}>
                {["monthly", "yearly"].map((b) => (
                  <button
                    key={b}
                    onClick={() => setBilling(b)}
                    className={`relative px-6 py-2.5 rounded-full font-medium transition-all duration-300 z-10 ${
                      billing === b ? "text-white" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {b === "monthly" ? "Monthly" : "Yearly"}
                    {b === "yearly" && (
                      <span className={cn('-top-2', '-right-2', 'absolute', 'bg-green-500', 'px-1.5', 'py-0.5', 'rounded-full', 'text-[10px]', 'text-white')}>Save</span>
                    )}
                    {billing === b && (
                      <motion.div
                        layoutId="billingTab"
                        className={cn('z-[-1]', 'absolute', 'inset-0', 'bg-gradient-to-r', 'from-yellow-500', 'to-orange-600', 'rounded-full')}
                        transition={{ type: "spring", duration: 0.5 }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Savings Badge */}
          {billing === "yearly" && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn('inline-flex', 'items-center', 'gap-2', 'bg-green-500/20', 'shadow-green-500/10', 'shadow-lg', 'backdrop-blur-sm', 'mt-4', 'px-5', 'py-2.5', 'border', 'border-green-500/50', 'rounded-full')}
            >
              <Sparkles size={18} className={cn('text-green-400', 'animate-pulse')} />
              <span className={cn('font-medium', 'text-green-400', 'text-sm')}>
                Save up to ${savedAmount.toFixed(2)} per year with annual billing
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* Plans Grid */}
        <div className={cn('gap-8', 'grid', 'grid-cols-1', 'lg:grid-cols-3', 'mb-12')}>
          {plans.map((plan, index) => {
            const isSelected = selected === plan.id;
            const isHovered = hoveredPlan === plan.id;
            const annualSavings = getAnnualSavings(plan);
            const current = isCurrentPlan(plan.id);
            const buttonText = getButtonText(plan.id);

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15, type: "spring" }}
                whileHover={{ y: -10 }}
                onHoverStart={() => setHoveredPlan(plan.id)}
                onHoverEnd={() => setHoveredPlan(null)}
                onClick={() => handleSelect(plan.id)}
                className={`relative cursor-pointer rounded-2xl transition-all duration-300 ${
                  isSelected ? "scale-105" : "hover:scale-102"
                }`}
              >
                {/* Glow Effect */}
                <div className={`absolute inset-0 bg-gradient-to-r ${plan.color} rounded-2xl blur-xl transition-all duration-500 ${
                  isHovered || isSelected ? `opacity-60 ${plan.glow}` : "opacity-0"
                }`} />
                
                <div className={`relative bg-gradient-to-br from-white/10 to-transparent backdrop-blur-2xl rounded-2xl border ${
                  isSelected ? plan.borderColor : "border-white/10"
                } overflow-hidden h-full transition-all duration-300`}>
                  
                  {current && (
                    <div className={cn('top-4', 'left-4', 'z-10', 'absolute')}>
                      <div className={cn('bg-green-500/20', 'backdrop-blur-sm', 'px-2.5', 'py-1', 'border', 'border-green-500/50', 'rounded-full')}>
                        <span className={cn('flex', 'items-center', 'gap-1', 'font-medium', 'text-green-400', 'text-xs')}>
                          <Check size={12} /> CURRENT
                        </span>
                      </div>
                    </div>
                  )}

                  {plan.popular && !current && (
                    <div className={cn('top-4', 'right-4', 'z-10', 'absolute')}>
                      <motion.div 
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className={cn('bg-gradient-to-r', 'from-cyan-500', 'to-blue-600', 'shadow-lg', 'px-3', 'py-1.5', 'rounded-full')}
                      >
                        <span className={cn('font-bold', 'text-xs')}>🔥 POPULAR</span>
                      </motion.div>
                    </div>
                  )}

                  {plan.best && !current && (
                    <div className={cn('top-4', 'right-4', 'z-10', 'absolute')}>
                      <motion.div 
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className={cn('bg-gradient-to-r', 'from-yellow-500', 'to-orange-600', 'shadow-lg', 'shadow-yellow-500/30', 'px-3', 'py-1.5', 'rounded-full')}
                      >
                        <span className={cn('font-bold', 'text-xs')}>⭐ BEST VALUE</span>
                      </motion.div>
                    </div>
                  )}

                  <div className="p-8">
                    <motion.div 
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                      className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${plan.color} mb-4 shadow-lg`}
                    >
                      <plan.icon size={28} />
                    </motion.div>

                    <h2 className={cn('mb-2', 'font-bold', 'text-2xl')}>{plan.name}</h2>
                    <p className={cn('mb-4', 'text-gray-400', 'text-sm')}>{plan.desc}</p>

                    <div className="mb-6">
                      <div className={cn('flex', 'items-baseline', 'gap-1')}>
                        <span className={cn('font-bold', 'text-4xl')}>{plan.price[billing]}</span>
                        <span className="text-gray-400">/{billing === "monthly" ? "month" : "year"}</span>
                      </div>
                      {billing === "yearly" && annualSavings > 0 && (
                        <p className={cn('mt-1', 'text-green-400', 'text-xs')}>Save ${annualSavings.toFixed(2)}/year</p>
                      )}
                    </div>

                    <ul className={cn('space-y-3', 'mb-8')}>
                      {plan.features.map((feature, idx) => (
                        <motion.li 
                          key={idx} 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 + idx * 0.05 }}
                          className={cn('flex', 'items-center', 'gap-2', 'text-sm')}
                        >
                          {feature.included ? (
                            feature.icon === Check ? (
                              <div className={cn('flex', 'flex-shrink-0', 'justify-center', 'items-center', 'bg-green-500/20', 'rounded-full', 'w-5', 'h-5')}>
                                <Check size={12} className="text-green-400" />
                              </div>
                            ) : (
                              <feature.icon size={14} className={cn('flex-shrink-0', 'text-green-400')} />
                            )
                          ) : (
                            <X size={14} className={cn('flex-shrink-0', 'text-gray-500')} />
                          )}
                          <span className={feature.included ? "text-gray-200" : "text-gray-500"}>
                            {feature.text}
                            {feature.value && (
                              <span className={`ml-1 font-semibold ${feature.highlight ? 'text-yellow-400' : ''}`}>
                                {feature.value}
                              </span>
                            )}
                          </span>
                        </motion.li>
                      ))}
                    </ul>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={loading && selected === plan.id}
                      className={`w-full py-3 rounded-xl font-bold transition-all duration-300 ${
                        current
                          ? "bg-white/20 text-white cursor-default"
                          : isSelected
                          ? `${plan.buttonColor} text-white shadow-lg`
                          : "bg-white/10 hover:bg-white/20"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {loading && selected === plan.id ? (
                        <div className={cn('flex', 'justify-center', 'items-center', 'gap-2')}>
                          <div className={cn('border-2', 'border-white/30', 'border-t-white', 'rounded-full', 'w-4', 'h-4', 'animate-spin')} />
                          Processing...
                        </div>
                      ) : (
                        buttonText
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Payment Methods Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={cn('mb-12', 'text-center')}
        >
          <p className={cn('flex', 'justify-center', 'items-center', 'gap-2', 'mb-3', 'text-gray-400', 'text-sm')}>
            <Lock size={12} className="text-green-400" />
            Secure payment methods
          </p>
          <div className={cn('flex', 'flex-wrap', 'justify-center', 'items-center', 'gap-6')}>
            {[
              { icon: CreditCard, name: "Card", color: "text-purple-400" },
              { icon: Smartphone, name: "Vodafone Cash", color: "text-red-400" },
              { icon: Building, name: "InstaPay", color: "text-green-400" },
            ].map((method, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -3, scale: 1.05 }}
                className={cn('flex', 'items-center', 'gap-2', 'bg-white/5', 'px-4', 'py-2', 'border', 'border-white/10', 'rounded-full')}
              >
                <method.icon size={18} className={method.color} />
                <span className={cn('text-gray-300', 'text-sm')}>{method.name}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Feature Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={cn('mt-16', 'mb-12')}
        >
          <div className={cn('mb-8', 'text-center')}>
            <h2 className={cn('bg-clip-text', 'bg-gradient-to-r', 'from-white', 'to-purple-200', 'mb-2', 'font-bold', 'text-transparent', 'text-3xl')}>Compare All Features</h2>
            <p className="text-gray-400">Everything you need to make the right choice</p>
          </div>

          <div className={cn('relative', 'bg-black/30', 'backdrop-blur-2xl', 'border', 'border-white/10', 'rounded-2xl', 'overflow-hidden')}>
            <div className={cn('absolute', 'inset-0', 'bg-gradient-to-br', 'from-purple-500/5', 'to-transparent')} />
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={cn('bg-white/5', 'border-white/10', 'border-b')}>
                  <tr>
                    <th className={cn('p-4', 'text-left')}>Feature</th>
                    <th className={cn('p-4', 'text-center')}>Free</th>
                    <th className={cn('p-4', 'text-center')}>Pro</th>
                    <th className={cn('p-4', 'text-center')}>Premium</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: "Anonymous Messages", free: true, pro: true, premium: true },
                    { feature: "Reveal Sender", free: false, pro: "50/month", premium: "Unlimited" },
                    { feature: "Coins per month", free: "0", pro: "100", premium: "300" },
                    { feature: "Message Analytics", free: false, pro: true, premium: true },
                    { feature: "Priority Support", free: false, pro: "Email", premium: "24/7" },
                    { feature: "Remove Ads", free: false, pro: false, premium: true },
                    { feature: "Custom Branding", free: false, pro: false, premium: true },
                  ].map((row, idx) => (
                    <motion.tr 
                      key={idx} 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 + idx * 0.05 }}
                      className={cn('hover:bg-white/5', 'border-white/5', 'border-b', 'transition-colors')}
                    >
                      <td className={cn('p-4', 'font-medium')}>{row.feature}</td>
                      <td className={cn('p-4', 'text-center')}>
                        {typeof row.free === 'boolean' ? (
                          row.free ? <Check size={18} className={cn('mx-auto', 'text-green-400')} /> : <X size={18} className={cn('mx-auto', 'text-gray-500')} />
                        ) : (
                          <span className={cn('text-gray-300', 'text-sm')}>{row.free}</span>
                        )}
                      </td>
                      <td className={cn('p-4', 'text-center')}>
                        {typeof row.pro === 'boolean' ? (
                          row.pro ? <Check size={18} className={cn('mx-auto', 'text-green-400')} /> : <X size={18} className={cn('mx-auto', 'text-gray-500')} />
                        ) : (
                          <span className={cn('font-medium', 'text-cyan-400', 'text-sm')}>{row.pro}</span>
                        )}
                      </td>
                      <td className={cn('p-4', 'text-center')}>
                        {typeof row.premium === 'boolean' ? (
                          row.premium ? <Check size={18} className={cn('mx-auto', 'text-green-400')} /> : <X size={18} className={cn('mx-auto', 'text-gray-500')} />
                        ) : (
                          <span className={cn('font-medium', 'text-yellow-400', 'text-sm')}>{row.premium}</span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className={cn('mt-12', 'mb-8')}
        >
          <div className={cn('mb-8', 'text-center')}>
            <h2 className={cn('bg-clip-text', 'bg-gradient-to-r', 'from-white', 'to-purple-200', 'mb-2', 'font-bold', 'text-transparent', 'text-3xl')}>Frequently Asked Questions</h2>
            <p className="text-gray-400">Got questions? We've got answers</p>
          </div>

          <div className={cn('gap-4', 'grid', 'grid-cols-1', 'md:grid-cols-2')}>
            {[
              { q: "Can I change my plan later?", a: "Yes, you can upgrade or downgrade your plan at any time from your dashboard." },
              { q: "Is there a free trial?", a: "We offer a free plan with basic features. Upgrade anytime to unlock more!" },
              { q: "How does billing work?", a: "You'll be billed monthly or yearly based on your selected plan. Cancel anytime." },
              { q: "What payment methods are accepted?", a: "We accept credit cards, Vodafone Cash, and InstaPay." },
              { q: "What are coins used for?", a: "Coins are used to reveal sender identities. Pro users get 100 coins/month, Premium get 300 coins/month." },
              { q: "Do coins expire?", a: "Coins expire at the end of your billing cycle if unused." },
            ].map((faq, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + idx * 0.05 }}
                whileHover={{ y: -3, scale: 1.01 }}
                className={cn('bg-white/5', 'backdrop-blur-xl', 'p-5', 'border', 'border-white/10', 'hover:border-purple-500/30', 'rounded-xl', 'transition-all', 'duration-200', 'cursor-pointer')}
              >
                <h3 className={cn('flex', 'items-center', 'gap-2', 'mb-2', 'font-semibold')}>
                  <span className={cn('flex', 'justify-center', 'items-center', 'bg-purple-500/20', 'rounded-full', 'w-6', 'h-6')}>
                    <span className={cn('text-purple-400', 'text-sm')}>💡</span>
                  </span>
                  {faq.q}
                </h3>
                <p className={cn('pl-8', 'text-gray-400', 'text-sm')}>{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Coin Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          whileHover={{ scale: 1.02 }}
          className={cn('bg-gradient-to-r', 'from-purple-500/10', 'via-pink-500/10', 'to-yellow-500/10', 'shadow-lg', 'shadow-purple-500/10', 'mt-8', 'p-5', 'border', 'border-purple-500/30', 'rounded-xl')}
        >
          <div className={cn('flex', 'flex-wrap', 'justify-between', 'items-center', 'gap-4')}>
            <div className={cn('flex', 'items-center', 'gap-3')}>
              <div className={cn('flex', 'justify-center', 'items-center', 'bg-yellow-500/20', 'rounded-xl', 'w-12', 'h-12')}>
                <Coins size={24} className="text-yellow-400" />
              </div>
              <div>
                <p className={cn('font-semibold', 'text-lg')}>About Coins</p>
                <p className={cn('text-gray-400', 'text-sm')}>
                  Coins are used to reveal anonymous senders. Pro users get 100 coins/month, Premium get 300 coins/month.
                  Each reveal costs 5 coins.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Back Button */}
        <div className={cn('mt-8', 'text-center')}>
          <motion.button
            whileHover={{ scale: 1.05, x: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/dashboard")}
            className={cn('inline-flex', 'items-center', 'gap-2', 'text-gray-400', 'hover:text-white', 'transition-all', 'duration-200')}
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </motion.button>
        </div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPayment && (
          <PaymentModal
            plan={selectedPlan}
            billingPeriod={billing}
            onClose={() => setShowPayment(false)}
            onConfirm={handlePayment}
            isMobile={isMobile}
            isIOS={isIOS}
            isAndroid={isAndroid}
            appLinks={APP_LINKS}
            openAppOrMarket={openAppOrMarket}
            copyAccountNumber={copyAccountNumber}
          />
        )}
      </AnimatePresence>
    </div>
  );
}