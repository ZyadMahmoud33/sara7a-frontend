// frontend/src/pages/PaymentSuccess.jsx
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, } from "framer-motion";
import toast from "react-hot-toast";
import { getProfileAPI } from "../../api/user";
import {
  CheckCircle,
  Crown,
  Sparkles,
  ArrowRight,
  Download,
  Share2,   

  Mail,
  Gift,
  Star,
  Rocket,
  Zap,
  Shield,
  Clock,
  Coins,
  Award,
  Home,
  TrendingUp
} from "lucide-react";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [showConfetti, setShowConfetti] = useState(false);
  const [userData, setUserData] = useState(null);
  const [transactionDetails, setTransactionDetails] = useState({
    id: null,
    amount: null,
    plan: null,
  });

  const plan = params.get("plan");
  const sessionId = params.get("session_id");
  const paymentIntent = params.get("payment_intent");

  // Confetti animation effect
  useEffect(() => {
    if (success) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Countdown timer
  useEffect(() => {
    if (!loading && success && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
    if (countdown === 0) {
      navigate("/dashboard");
    }
  }, [loading, success, countdown, navigate]);

  // Handle payment verification
  useEffect(() => {
    const handleSuccess = async () => {
      try {
        if (!plan) {
          throw new Error("Invalid payment information");
        }

        // Verify payment and update user profile
        const userResponse = await getProfileAPI();
        const user = userResponse?.data?.data || userResponse?.data || userResponse;
        
        setUserData(user);
        setTransactionDetails({
          id: sessionId || paymentIntent || "TXN" + Date.now(),
          amount: plan === "premium" ? "5.99" : plan === "pro" ? "2.99" : "0",
          plan: plan,
        });
        
        setSuccess(true);
        toast.success("Payment verified successfully! 🎉");
        toast.success(`Welcome to ${plan === "premium" ? "Premium" : "Pro"} plan!`);

      } catch (err) {
        console.error("Payment verification error:", err);
        
        toast.error(
          err?.response?.data?.message ||
          err?.message ||
          "Payment verification failed. Please contact support."
        );
        
        setTimeout(() => {
          navigate("/dashboard");
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    // Simulate processing time for better UX
    const timer = setTimeout(handleSuccess, 1500);
    return () => clearTimeout(timer);
  }, [plan, navigate, sessionId, paymentIntent]);

  // Get plan details
  const getPlanDetails = () => {
    const plans = {
      premium: {
        name: "Premium",
        icon: Crown,
        color: "from-yellow-500 to-orange-500",
        features: [
          "Unlimited message reveals",
          "24/7 Priority support",
          "Remove all ads",
          "Advanced analytics dashboard",
          "Custom branding options",
          "API access",
          "300 coins per month",
        ]
      },
      pro: {
        name: "Pro",
        icon: Rocket,
        color: "from-cyan-500 to-blue-500",
        features: [
          "50 message reveals/month",
          "Priority email support",
          "Message analytics",
          "No ads on messages",
          "Basic branding options",
          "100 coins per month",
        ]
      }
    };
    return plans[plan?.toLowerCase()] || plans.premium;
  };

  const planDetails = getPlanDetails();
  const PlanIcon = planDetails.icon;

  // Confetti component
  const Confetti = () => {
    const particles = Array.from({ length: 80 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      animationDuration: Math.random() * 3 + 2,
      delay: Math.random() * 2,
      color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFB347', '#6B5B95'][i % 7]
    }));

    return (
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{ y: -100, x: `${particle.left}%`, opacity: 1, rotate: 0 }}
            animate={{ y: "100vh", opacity: 0, rotate: 360 }}
            transition={{
              duration: particle.animationDuration,
              delay: particle.delay,
              ease: "linear"
            }}
            className="absolute rounded-full w-2 h-2"
            style={{ backgroundColor: particle.color, left: `${particle.left}%` }}
          />
        ))}
      </div>
    );
  };

  const handleShare = (platform) => {
    const text = `I just upgraded to ${planDetails.name} plan on Sara7a! 🚀 Anonymous messaging just got better!`;
    const url = window.location.origin;
    
    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      email: `mailto:?subject=${encodeURIComponent("Check out Sara7a!")}&body=${encodeURIComponent(text + "\n\n" + url)}`
    };
    
    window.open(shareUrls[platform], "_blank", "width=600,height=400");
    toast.success(`Sharing on ${platform}!`);
  };

  const handleDownloadReceipt = () => {
    const receipt = {
      date: new Date().toISOString(),
      plan: planDetails.name,
      transactionId: transactionDetails.id,
      status: "Completed",
      amount: `$${transactionDetails.amount}`,
      email: userData?.email || "customer@sara7a.com",
    };
    
    const receiptText = `
╔════════════════════════════════════════╗
║         SARA7A PAYMENT RECEIPT         ║
╠════════════════════════════════════════╣
║ Date: ${new Date(receipt.date).toLocaleString()}
║ Transaction ID: ${receipt.transactionId}
║ Plan: ${receipt.plan}
║ Amount: ${receipt.amount}
║ Status: ${receipt.status}
║ Email: ${receipt.email}
╠════════════════════════════════════════╣
║   Thank you for choosing Sara7a!       ║
║   Anonymous Messaging Platform         ║
╚════════════════════════════════════════╝
    `;
    
    const blob = new Blob([receiptText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sara7a-receipt-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success("Receipt downloaded!");
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center bg-gradient-to-br from-gray-900 via-black to-gray-900 min-h-screen">
        {/* Animated Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="-top-40 -right-40 absolute bg-green-600 opacity-20 blur-3xl rounded-full w-80 h-80 animate-pulse mix-blend-multiply filter"></div>
          <div className="-bottom-40 -left-40 absolute bg-emerald-600 opacity-20 blur-3xl rounded-full w-80 h-80 animate-pulse delay-1000 mix-blend-multiply filter"></div>
        </div>

        <div className="z-10 relative text-center">
          <motion.div
            animate={{ rotate: 360, scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mb-6"
          >
            <Shield size={64} className="text-green-500" />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-2 font-bold text-2xl"
          >
            Verifying Your Payment
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-400"
          >
            Please wait while we confirm your transaction...
          </motion.p>

          <div className="mx-auto mt-6 w-64">
            <div className="relative">
              <div className="flex bg-white/10 rounded-full h-2 overflow-hidden text-xs">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, ease: "linear" }}
                  className="flex flex-col justify-center bg-gradient-to-r from-green-500 to-emerald-500 shadow-none text-white text-center whitespace-nowrap"
                />
              </div>
            </div>
          </div>
          
          <p className="mt-4 text-gray-500 text-xs animate-pulse">
            This will only take a moment...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex justify-center items-center bg-gradient-to-br from-gray-900 via-black to-gray-900 min-h-screen overflow-hidden">
      {/* Confetti Animation */}
      {showConfetti && <Confetti />}

      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="-top-40 -right-40 absolute bg-green-600 opacity-20 blur-3xl rounded-full w-80 h-80 animate-pulse mix-blend-multiply filter"></div>
        <div className="-bottom-40 -left-40 absolute bg-emerald-600 opacity-20 blur-3xl rounded-full w-80 h-80 animate-pulse delay-1000 mix-blend-multiply filter"></div>
        <div className="top-1/2 left-1/2 absolute bg-teal-600 opacity-10 blur-3xl rounded-full w-96 h-96 -translate-x-1/2 -translate-y-1/2 animate-pulse delay-2000 transform mix-blend-multiply filter"></div>
        
        {/* Floating particles */}
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-white/20 rounded-full w-1 h-1"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              y: [null, -60, 60, -60],
              x: [null, 60, -60, 60],
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

      <div className="z-10 relative mx-auto p-6 w-full max-w-2xl">
        {/* Success Card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="bg-white/5 shadow-2xl backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden"
        >
          {/* Success Header */}
          <div className={`relative bg-gradient-to-br ${planDetails.color} p-8 text-center`}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-block bg-white/20 mb-4 p-4 rounded-full"
            >
              <CheckCircle size={48} className="text-white" />
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-2 font-bold text-3xl"
            >
              Payment Successful! 🎉
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-white/90"
            >
              Thank you for upgrading to {planDetails.name} Plan
            </motion.p>

            {/* Sparkle Effects */}
            <div className="top-4 right-4 absolute">
              <Sparkles size={24} className="text-yellow-400 animate-pulse" />
            </div>
            <div className="bottom-4 left-4 absolute">
              <Star size={20} className="text-yellow-400 animate-pulse delay-1000" />
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Welcome Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-6 text-center"
            >
              <p className="text-gray-300">
                Welcome to the Sara7a community! Your account has been successfully upgraded.
              </p>
            </motion.div>

            {/* Transaction Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white/5 mb-6 p-4 border border-white/10 rounded-xl"
            >
              <div className="flex items-center gap-2 mb-3">
                <Shield size={16} className="text-green-400" />
                <p className="font-semibold">Transaction Details</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Transaction ID:</span>
                  <span className="font-mono text-xs">
                    {transactionDetails.id?.slice(0, 24)}...
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Date:</span>
                  <span>{new Date().toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Plan:</span>
                  <span className="flex items-center gap-1 capitalize">
                    <PlanIcon size={14} className={plan === "premium" ? "text-yellow-400" : "text-cyan-400"} />
                    {planDetails.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount:</span>
                  <span className="font-semibold text-green-400">
                    ${transactionDetails.amount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className="flex items-center gap-1 text-green-400">
                    <CheckCircle size={12} />
                    Completed
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Features Highlight */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mb-6"
            >
              <div className="flex items-center gap-2 mb-3">
                <Award size={16} className="text-yellow-400" />
                <p className="font-semibold">What's included in {planDetails.name} Plan</p>
              </div>
              <div className="gap-2 grid grid-cols-1 md:grid-cols-2">
                {planDetails.features.map((feature, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + idx * 0.05 }}
                    className="flex items-center gap-2 text-gray-300 text-sm"
                  >
                    <CheckCircle size={14} className="flex-shrink-0 text-green-400" />
                    <span>{feature}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Coin Info for Pro/Premium */}
            {(plan === "pro" || plan === "premium") && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 mb-6 p-3 border border-purple-500/30 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <Coins size={18} className="text-purple-400" />
                  <p className="text-gray-300 text-sm">
                    You've received <strong className="text-purple-400">{plan === "premium" ? "300" : "100"} coins</strong> as part of your {planDetails.name} plan!
                  </p>
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="space-y-3"
            >
              <div className="flex gap-3">
                <button
                  onClick={handleDownloadReceipt}
                  className="flex flex-1 justify-center items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-all duration-200"
                >
                  <Download size={18} />
                  Download Receipt
                </button>
                
                <button
                  onClick={() => navigate("/dashboard")}
                  className="flex flex-1 justify-center items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 px-4 py-2 rounded-xl transition-all duration-200"
                >
                  <Home size={18} />
                  Go to Dashboard
                  <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>

            {/* Share Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="mt-6 pt-6 border-white/10 border-t"
            >
              <p className="flex justify-center items-center gap-2 mb-3 text-gray-400 text-sm text-center">
                <Share2 size={14} />
                Share your success
              </p>
              <div className="flex justify-center gap-3">
        
                <button
                  onClick={() => handleShare("email")}
                  className="bg-black/40 hover:bg-white/10 p-2 rounded-lg transition-all duration-200"
                >
                  <Mail size={20} className="text-gray-400" />
                </button>
              </div>
            </motion.div>

            {/* Auto-redirect Counter */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="mt-6 text-center"
            >
              <div className="inline-flex items-center gap-2 text-gray-500 text-sm">
                <Clock size={14} />
                <span>
                  Redirecting to dashboard in {countdown} second{countdown !== 1 ? 's' : ''}...
                </span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Floating Elements */}
        <motion.div
          animate={{
            y: [0, -25, 0],
            rotate: [0, 10, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="hidden lg:block -top-10 -left-10 absolute opacity-20 pointer-events-none"
        >
          <Rocket size={56} className="text-purple-500" />
        </motion.div>

        <motion.div
          animate={{
            y: [0, 25, 0],
            rotate: [0, -10, 0],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="hidden lg:block -right-10 -bottom-10 absolute opacity-20 pointer-events-none"
        >
          <Zap size={56} className="text-yellow-500" />
        </motion.div>
      </div>
    </div>
  );
}