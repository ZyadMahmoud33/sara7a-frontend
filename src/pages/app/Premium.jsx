// frontend/src/pages/Premium.jsx
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  createCheckoutSessionAPI,
  createManualPaymentAPI,
  upgradePlanAPI,
  getProfileAPI,
} from "../../api/user";
import PaymentModal from "../../components/PaymentModal";
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
  QrCode
} from "lucide-react";

// ================================
// 🔗 تكامل تطبيقات الدفع
// ================================

// روابط التطبيقات
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
    accountNumber: "01098765432",
    accountName: "Sara7a App",
    deepLinkSupported: true,
    instructions: [
      "افتح تطبيق Vodafone Cash",
      "اختر 'تحويل الأموال'",
      "أدخل رقم الحساب: 01098765432",
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
  
  // حالة للكشف عن الجهاز (موبايل/ديسكتوب)
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  // كشف نوع الجهاز
  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const mobile = /android|webos|iphone|ipad|ipod|blackberry|windows phone/i.test(userAgent);
    const ios = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    const android = /Android/.test(userAgent);
    
    setIsMobile(mobile);
    setIsIOS(ios);
    setIsAndroid(android);
  }, []);

  // Fetch current user plan
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

  // Calculate yearly savings
  useEffect(() => {
    const proMonthly = 2.99;
    const proYearly = 28.99;
    const proSavings = (proMonthly * 12) - proYearly;
    
    const premiumMonthly = 5.99;
    const premiumYearly = 59.99;
    const premiumSavings = (premiumMonthly * 12) - premiumYearly;
    
    setSavedAmount(Math.max(proSavings, premiumSavings));
  }, [billing]);

  // دالة لفتح التطبيق أو المتجر
  const openAppOrMarket = useCallback((appKey) => {
    const app = APP_LINKS[appKey];
    if (!app) return;

    // محاولة فتح التطبيق أولاً
    const deepLink = isIOS ? app.ios : app.android;
    
    // إنشاء عنصر iframe مخفي لمحاولة فتح التطبيق
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = deepLink;
    document.body.appendChild(iframe);
    
    // بعد 2 ثانية، إذا لم يتم فتح التطبيق، افتح المتجر أو الموقع
    setTimeout(() => {
      document.body.removeChild(iframe);
      
      // افتح المتجر المناسب
      const marketUrl = isIOS ? app.market.ios : app.market.android;
      if (marketUrl) {
        window.open(marketUrl, '_blank');
      } else {
        window.open(app.webApp, '_blank');
      }
    }, 2000);
  }, [isIOS, isAndroid]);

  // دالة لنسخ رقم الحساب
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
        { text: "Advanced analytics", included: false, icon: BarChart3 },
        { text: "Coins per month", included: false, value: "0", icon: Coins },
      ],
      color: "from-gray-600 to-gray-800",
      borderColor: "border-gray-700",
      buttonColor: "bg-gray-700 hover:bg-gray-600",
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
        { text: "Custom branding", included: false, icon: Palette },
        { text: "Coins per month", included: true, value: "100 coins", icon: Coins, highlight: true },
      ],
      color: "from-cyan-500 to-blue-600",
      borderColor: "border-cyan-500/50",
      buttonColor: "bg-gradient-to-r from-cyan-500 to-blue-600",
      popular: true,
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
        { text: "Custom branding", included: true, icon: Palette },
        { text: "Coins per month", included: true, value: "300 coins", icon: Coins, highlight: true },
      ],
      color: "from-yellow-500 to-orange-600",
      borderColor: "border-yellow-500/50",
      buttonColor: "bg-gradient-to-r from-yellow-500 to-orange-600",
      best: true,
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
        const data = await createCheckoutSessionAPI({
          plan: selectedPlan,
          billingPeriod: billing,
        });

        if (!data?.url) throw new Error("Payment session failed");

        window.location.href = data.url;
        return;
      }

      if (!screenshot) throw new Error("Screenshot is required");

      await createManualPaymentAPI({
        plan: selectedPlan,
        method,
        screenshot,
      });

      toast.success("تم إرسال طلب الدفع بنجاح! في انتظار الموافقة ⏳");
      setShowPayment(false);
      setTimeout(() => navigate("/dashboard"), 2000);

    } catch (err) {
      console.error("Payment error:", err);
      toast.error(
        err?.response?.data?.message ||
        err?.message ||
        "فشل الدفع ❌"
      );
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

  const isCurrentPlan = (planId) => {
    return currentPlan === planId;
  };

  const getButtonText = (planId) => {
    if (loading && selected === planId) return "Processing...";
    if (isCurrentPlan(planId)) return "Current Plan";
    if (planId === "free") return "Switch to Free";
    return "Upgrade Now";
  };

  return (
    <div className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 min-h-screen overflow-hidden text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="-top-40 -right-40 absolute bg-purple-600 opacity-20 blur-3xl rounded-full w-80 h-80 animate-pulse"></div>
        <div className="-bottom-40 -left-40 absolute bg-orange-600 opacity-20 blur-3xl rounded-full w-80 h-80 animate-pulse delay-1000"></div>
        <div className="top-1/2 left-1/2 absolute bg-yellow-600 opacity-10 blur-3xl rounded-full w-96 h-96 -translate-x-1/2 -translate-y-1/2 animate-pulse delay-2000"></div>
      </div>

      <div className="z-10 relative mx-auto p-6 max-w-7xl">
        {/* Current Plan Badge */}
        {currentPlan !== "free" && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-4"
          >
            <div className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${
              currentPlan === "premium" 
                ? "bg-gradient-to-r from-yellow-500 to-orange-500" 
                : "bg-gradient-to-r from-cyan-500 to-blue-500"
            }`}>
              {currentPlan === "premium" ? <Crown size={16} /> : <Rocket size={16} />}
              Current Plan: {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
              {currentPlan === "pro" && (
                <span className="flex items-center gap-1 bg-white/20 ml-1 px-1.5 py-0.5 rounded text-xs">
                  <Coins size={10} />
                  {userCoins} coins
                </span>
              )}
            </div>
          </motion.div>
        )}

        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-12 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="inline-block bg-gradient-to-br from-yellow-500 to-orange-600 mb-4 p-3 rounded-2xl"
          >
            <Crown size={40} />
          </motion.div>
          
          <h1 className="bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 mb-4 font-bold text-transparent text-5xl md:text-6xl">
            Upgrade Your Experience
          </h1>
          
          <p className="mx-auto max-w-2xl text-gray-400 text-lg">
            Choose the perfect plan for your needs and unlock exclusive features
          </p>

          {/* Billing Toggle */}
          <div className="flex justify-center mt-8">
            <div className="relative bg-white/10 backdrop-blur-xl p-1 rounded-full">
              <div className="flex gap-1">
                {["monthly", "yearly"].map((b) => (
                  <button
                    key={b}
                    onClick={() => setBilling(b)}
                    className={`relative px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                      billing === b
                        ? "text-white"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {b === "monthly" ? "Monthly" : "Yearly"}
                    {billing === b && (
                      <motion.div
                        layoutId="billingTab"
                        className="-z-0 absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full"
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-green-500/20 mt-4 px-4 py-2 border border-green-500/50 rounded-full"
            >
              <Sparkles size={16} className="text-green-400" />
              <span className="font-medium text-green-400 text-sm">
                Save up to ${savedAmount.toFixed(2)} per year with annual billing
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* Plans Grid */}
        <div className="gap-8 grid grid-cols-1 lg:grid-cols-3 mb-12">
          {plans.map((plan, index) => {
            const isSelected = selected === plan.id;
            const isHovered = hoveredPlan === plan.id;
            const annualSavings = getAnnualSavings(plan);
            const current = isCurrentPlan(plan.id);
            const buttonText = getButtonText(plan.id);

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                onHoverStart={() => setHoveredPlan(plan.id)}
                onHoverEnd={() => setHoveredPlan(null)}
                onClick={() => handleSelect(plan.id)}
                className={`relative cursor-pointer rounded-2xl transition-all duration-300 ${
                  isSelected ? "scale-105 shadow-2xl" : "hover:scale-102"
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${plan.color} rounded-2xl blur-xl transition-opacity duration-300 ${
                  isHovered || isSelected ? "opacity-30" : "opacity-0"
                }`} />
                
                <div className={`relative bg-gradient-to-br from-white/10 to-transparent backdrop-blur-xl rounded-2xl border ${
                  isSelected ? plan.borderColor : "border-white/10"
                } overflow-hidden h-full transition-all duration-300`}>
                  
                  {current && (
                    <div className="top-4 left-4 z-10 absolute">
                      <div className="bg-green-500/20 backdrop-blur-sm px-2 py-1 border border-green-500/50 rounded-full">
                        <span className="flex items-center gap-1 font-medium text-green-400 text-xs">
                          <Check size={12} />
                          CURRENT
                        </span>
                      </div>
                    </div>
                  )}

                  {plan.popular && !current && (
                    <div className="top-4 right-4 z-10 absolute">
                      <div className="bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-1 rounded-full">
                        <span className="font-bold text-xs">POPULAR</span>
                      </div>
                    </div>
                  )}

                  {plan.best && !current && (
                    <div className="top-4 right-4 z-10 absolute">
                      <div className="bg-gradient-to-r from-yellow-500 to-orange-600 px-3 py-1 rounded-full animate-pulse">
                        <span className="font-bold text-xs">BEST VALUE</span>
                      </div>
                    </div>
                  )}

                  <div className="p-8">
                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${plan.color} mb-4`}>
                      <plan.icon size={28} />
                    </div>

                    <h2 className="mb-2 font-bold text-2xl">{plan.name}</h2>
                    <p className="mb-4 text-gray-400 text-sm">{plan.desc}</p>

                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="font-bold text-4xl">{plan.price[billing]}</span>
                        <span className="text-gray-400">/{billing === "monthly" ? "month" : "year"}</span>
                      </div>
                      {billing === "yearly" && annualSavings > 0 && (
                        <p className="mt-1 text-green-400 text-xs">Save ${annualSavings.toFixed(2)}/year</p>
                      )}
                    </div>

                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm">
                          {feature.included ? (
                            feature.icon === Check ? (
                              <Check size={16} className="flex-shrink-0 text-green-400" />
                            ) : (
                              <feature.icon size={16} className="flex-shrink-0 text-green-400" />
                            )
                          ) : (
                            <X size={16} className="flex-shrink-0 text-gray-500" />
                          )}
                          <span className={feature.included ? "text-gray-200" : "text-gray-500"}>
                            {feature.text}
                            {feature.value && (
                              <span className={`ml-1 font-semibold ${feature.highlight ? 'text-yellow-400' : ''}`}>
                                {feature.value}
                              </span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <button
                      disabled={loading && selected === plan.id}
                      className={`w-full py-3 rounded-xl font-bold transition-all duration-300 ${
                        current
                          ? "bg-white/20 text-white cursor-default"
                          : isSelected
                          ? plan.buttonColor + " text-white shadow-lg"
                          : "bg-white/10 hover:bg-white/20"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {loading && selected === plan.id ? (
                        <div className="flex justify-center items-center gap-2">
                          <div className="border-2 border-white/30 border-t-white rounded-full w-4 h-4 animate-spin" />
                          Processing...
                        </div>
                      ) : (
                        buttonText
                      )}
                    </button>
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
          transition={{ delay: 0.3 }}
          className="mb-12 text-center"
        >
          <p className="mb-3 text-gray-400 text-sm">Secure payment methods</p>
          <div className="flex justify-center items-center gap-6">
            <div className="flex items-center gap-2 text-gray-300">
              <CreditCard size={20} className="text-purple-400" />
              <span>Card</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Smartphone size={20} className="text-red-400" />
              <span>Vodafone Cash</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Building size={20} className="text-green-400" />
              <span>InstaPay</span>
            </div>
          </div>
        </motion.div>

        {/* Feature Comparison Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16 mb-12"
        >
          <div className="mb-8 text-center">
            <h2 className="mb-2 font-bold text-3xl">Compare All Features</h2>
            <p className="text-gray-400">Everything you need to make the right choice</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-white/10 border-b">
                  <tr>
                    <th className="p-4 text-left">Feature</th>
                    <th className="p-4 text-center">Free</th>
                    <th className="p-4 text-center">Pro</th>
                    <th className="p-4 text-center">Premium</th>
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
                    { feature: "API Access", free: false, pro: false, premium: true },
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-white/5 border-white/5 border-b transition-colors">
                      <td className="p-4 font-medium">{row.feature}</td>
                      <td className="p-4 text-center">
                        {typeof row.free === 'boolean' ? (
                          row.free ? <Check size={18} className="mx-auto text-green-400" /> : <X size={18} className="mx-auto text-gray-500" />
                        ) : (
                          <span className="text-sm">{row.free}</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {typeof row.pro === 'boolean' ? (
                          row.pro ? <Check size={18} className="mx-auto text-green-400" /> : <X size={18} className="mx-auto text-gray-500" />
                        ) : (
                          <span className="font-medium text-cyan-400 text-sm">{row.pro}</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {typeof row.premium === 'boolean' ? (
                          row.premium ? <Check size={18} className="mx-auto text-green-400" /> : <X size={18} className="mx-auto text-gray-500" />
                        ) : (
                          <span className="font-medium text-yellow-400 text-sm">{row.premium}</span>
                        )}
                      </td>
                    </tr>
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
          transition={{ delay: 0.5 }}
          className="mt-12 mb-8"
        >
          <div className="mb-8 text-center">
            <h2 className="mb-2 font-bold text-2xl">Frequently Asked Questions</h2>
            <p className="text-gray-400">Got questions? We've got answers</p>
          </div>

          <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
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
                transition={{ delay: 0.6 + idx * 0.05 }}
                className="bg-white/5 backdrop-blur-xl p-4 border border-white/10 hover:border-purple-500/30 rounded-xl transition-all duration-200"
              >
                <h3 className="flex items-center gap-2 mb-2 font-semibold">
                  <span className="text-purple-400">💡</span>
                  {faq.q}
                </h3>
                <p className="text-gray-400 text-sm">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Coin Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 mt-8 p-4 border border-purple-500/30 rounded-xl"
        >
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <Coins size={24} className="text-purple-400" />
              <div>
                <p className="font-semibold">About Coins</p>
                <p className="text-gray-400 text-sm">
                  Coins are used to reveal anonymous senders. Pro users get 100 coins/month, Premium get 300 coins/month.
                  Each reveal costs 5 coins.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </motion.button>
        </div>
      </div>

      {/* Payment Modal with App Integration */}
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