// frontend/src/components/PaymentModal.jsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  CreditCard,
  Smartphone,
  Building,
  X,
  Upload,
  CheckCircle,
  AlertCircle,
  Shield,
  Clock,
  Banknote,
  ArrowRight,
  Loader,
  Copy,
  ExternalLink
} from "lucide-react";

export default function PaymentModal({ plan, onClose, onConfirm }) {
  const [loadingMethod, setLoadingMethod] = useState(null);
  const [screenshot, setScreenshot] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState({
    phone: "",
    amount: "",
    reference: "",
  });
  const [copySuccess, setCopySuccess] = useState(false);
  const [countdown, setCountdown] = useState(null);

  // Payment methods with app integration
  const paymentMethods = {
    card: {
      name: "Credit / Debit Card",
      icon: CreditCard,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-500",
      description: "Secure payment via Stripe",
      appUrl: null,
    },
    vodafone: {
      name: "Vodafone Cash",
      icon: Smartphone,
      color: "from-red-500 to-red-600",
      bgColor: "bg-red-500",
      description: "Instant payment via Vodafone Cash",
      accountNumber: "01098765432",
      accountName: "Sara7a App",
      appUrl: "https://vodafonecash.vodafone.com.eg/",
      deepLink: "vodafonecash://",
    },
    instapay: {
      name: "InstaPay",
      icon: Building,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-500",
      description: "Fast bank transfers via InstaPay",
      accountNumber: "instapay@sara7a.com",
      accountName: "Sara7a App",
      appUrl: "https://instapay.gov.eg/",
      deepLink: "instapay://",
    },
  };

  // Auto-redirect to app when method is selected
  useEffect(() => {
    if (selectedMethod && paymentMethods[selectedMethod]?.deepLink && countdown === null) {
      const method = paymentMethods[selectedMethod];
      setCountdown(5);
      
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            window.location.href = method.deepLink;
            setTimeout(() => {
              window.open(method.appUrl, "_blank");
            }, 1000);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [selectedMethod, countdown]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, JPEG) ❌");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB ❌");
      return;
    }

    setScreenshot(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    toast.success("Screenshot uploaded successfully ✅");
  };

  const handlePaymentSubmit = async (method) => {
    if (loadingMethod) return;

    if (method !== "card" && !screenshot) {
      toast.error("Please upload payment screenshot first 📸");
      return;
    }

    if (method !== "card" && !paymentDetails.reference) {
      toast.error("Please enter transaction reference number");
      return;
    }

    setLoadingMethod(method);

    try {
      const paymentData = {
        method,
        screenshot,
        reference: paymentDetails.reference,
        phone: paymentDetails.phone,
        amount: paymentDetails.amount,
      };

      await onConfirm(method, screenshot, paymentData);
      
      toast.success("Payment submitted successfully! 🎉");
      toast.success("We'll notify you once approved");

      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err) {
      console.error("Payment error:", err);
      toast.error(
        err?.response?.data?.message ||
        err?.message ||
        "Payment failed. Please try again ❌"
      );
    } finally {
      setLoadingMethod(null);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  const handleMethodSelect = (methodId) => {
    setSelectedMethod(methodId);
    if (methodId === "card") {
      handlePaymentSubmit(methodId);
    }
  };

  const getPlanPrice = () => {
    const prices = {
      free: 0,
      pro: 2.99,
      premium: 5.99,
    };
    return prices[plan?.toLowerCase()] || 0;
  };

  const calculateTotal = () => {
    const price = getPlanPrice();
    const tax = price * 0.14;
    const total = price + tax;
    return { price, tax, total };
  };

  const { price, tax, total } = calculateTotal();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="z-50 fixed inset-0 flex justify-center items-center bg-black/80 backdrop-blur-md p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget && !loadingMethod) onClose();
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative bg-gradient-to-br from-gray-900 to-black shadow-2xl border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 p-6">
            <button
              onClick={onClose}
              disabled={!!loadingMethod}
              className="top-4 right-4 absolute bg-white/10 hover:bg-white/20 p-1 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="text-center">
              <div className="inline-block bg-white/20 mb-3 p-3 rounded-2xl">
                <Banknote size={32} />
              </div>
              <h2 className="font-bold text-2xl">Complete Payment</h2>
              <p className="mt-1 text-white/80 text-sm">
                Upgrade to {plan} Plan
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {/* Order Summary */}
            <div className="bg-white/5 mb-6 p-4 border border-white/10 rounded-xl">
              <h3 className="flex items-center gap-2 mb-3 font-semibold">
                <Shield size={16} />
                Order Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Plan Price</span>
                  <span>${price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">VAT (14%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="mt-2 pt-2 border-white/10 border-t">
                  <div className="flex justify-between font-bold">
                    <span>Total Amount</span>
                    <span className="text-green-400">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-4 mb-6">
              <h3 className="flex items-center gap-2 font-semibold">
                <CreditCard size={16} />
                Select Payment Method
              </h3>

              {Object.entries(paymentMethods).map(([key, method]) => (
                <motion.button
                  key={key}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleMethodSelect(key)}
                  disabled={!!loadingMethod}
                  className={`w-full p-4 text-left rounded-xl border transition-all duration-200 ${
                    selectedMethod === key
                      ? `bg-gradient-to-r ${method.color} border-transparent shadow-lg`
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  } ${loadingMethod ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${selectedMethod === key ? "bg-white/20" : "bg-white/10"}`}>
                      <method.icon size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{method.name}</p>
                      <p className="text-gray-400 text-xs">{method.description}</p>
                    </div>
                    {selectedMethod === key && (
                      <CheckCircle size={20} className="text-white" />
                    )}
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Payment Details (when method selected) */}
            <AnimatePresence>
              {selectedMethod && selectedMethod !== "card" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 mb-6"
                >
                  <div className="bg-cyan-500/10 p-4 border border-cyan-500/30 rounded-xl">
                    <div className="flex items-start gap-3">
                      <AlertCircle size={20} className="flex-shrink-0 mt-0.5 text-cyan-400" />
                      <div className="flex-1">
                        <p className="mb-2 font-semibold text-cyan-400 text-sm">
                          Send payment to:
                        </p>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300 text-sm">Account:</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm">
                                {paymentMethods[selectedMethod].accountNumber}
                              </span>
                              <button
                                onClick={() => copyToClipboard(paymentMethods[selectedMethod].accountNumber)}
                                className="hover:bg-white/10 p-1 rounded"
                              >
                                <Copy size={14} />
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300 text-sm">Amount:</span>
                            <span className="font-bold text-green-400">
                              ${total.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reference Number Input */}
                  <div>
                    <label className="block mb-2 font-medium text-sm">
                      Transaction Reference Number *
                    </label>
                    <input
                      type="text"
                      value={paymentDetails.reference}
                      onChange={(e) => setPaymentDetails({ ...paymentDetails, reference: e.target.value })}
                      placeholder="Enter transaction ID or reference number"
                      className="bg-black/40 px-4 py-2 border border-white/10 focus:border-purple-500 rounded-xl focus:outline-none w-full transition-all duration-200"
                    />
                    <p className="mt-1 text-gray-500 text-xs">
                      Please enter the reference number from your payment
                    </p>
                  </div>

                  {/* File Upload */}
                  <div>
                    <label className="block mb-2 font-medium text-sm">
                      Upload Payment Screenshot *
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={!!loadingMethod}
                        className="hidden"
                        id="screenshot-upload"
                      />
                      <label
                        htmlFor="screenshot-upload"
                        className="flex justify-center items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-3 border border-white/10 rounded-xl w-full transition-all duration-200 cursor-pointer"
                      >
                        <Upload size={18} />
                        {screenshot ? "Change Screenshot" : "Upload Screenshot"}
                      </label>
                    </div>
                    
                    {previewUrl && (
                      <div className="mt-3">
                        <img
                          src={previewUrl}
                          alt="Payment preview"
                          className="rounded-lg w-full h-32 object-cover"
                        />
                      </div>
                    )}
                  </div>

                  {/* Open App Button */}
                  {paymentMethods[selectedMethod].deepLink && countdown === null && (
                    <button
                      onClick={() => window.open(paymentMethods[selectedMethod].appUrl, "_blank")}
                      className="flex justify-center items-center gap-2 bg-white/5 hover:bg-white/10 py-2 rounded-lg w-full transition-all duration-200"
                    >
                      <ExternalLink size={16} />
                      Open {paymentMethods[selectedMethod].name} App
                    </button>
                  )}

                  {/* Countdown Timer */}
                  {countdown !== null && (
                    <div className="bg-blue-500/20 p-4 border border-blue-500/30 rounded-lg text-center">
                      <p className="text-sm">Redirecting to app in {countdown} seconds...</p>
                      <div className="bg-white/10 mt-2 rounded-full w-full h-1 overflow-hidden">
                        <motion.div
                          initial={{ width: "100%" }}
                          animate={{ width: "0%" }}
                          transition={{ duration: 5, ease: "linear" }}
                          className="bg-blue-500 rounded-full h-full"
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            {selectedMethod && selectedMethod !== "card" && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePaymentSubmit(selectedMethod)}
                disabled={loadingMethod || !screenshot || !paymentDetails.reference}
                className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                  loadingMethod === selectedMethod
                    ? "bg-gray-600"
                    : `bg-gradient-to-r ${paymentMethods[selectedMethod].color} hover:opacity-90`
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loadingMethod === selectedMethod ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Confirm Payment
                    <ArrowRight size={18} />
                  </>
                )}
              </motion.button>
            )}

            {/* Security Note */}
            <div className="bg-yellow-500/10 mt-6 p-3 border border-yellow-500/30 rounded-lg">
              <div className="flex items-start gap-2 text-yellow-400 text-xs">
                <Shield size={14} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="mb-1 font-semibold">Payment Security</p>
                  <p>Your payment information is encrypted and secure. We'll notify you once your payment is approved.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-black/30 p-4 border-white/10 border-t">
            <div className="flex justify-center gap-4 text-gray-500 text-xs">
              <span>🔒 Secure Payment</span>
              <span>⚡ Instant Processing</span>
              <span>🛡️ Fraud Protection</span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </AnimatePresence>
  );
}