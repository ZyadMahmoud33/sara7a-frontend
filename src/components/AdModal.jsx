// frontend/src/components/AdModal.jsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Coins, Video, Clock, Award } from "lucide-react";
import toast from "react-hot-toast";
import { watchAdAPI } from "../api/user";

export default function AdModal({ onClose, onCoinsEarned }) {
  const [countdown, setCountdown] = useState(5);
  const [watching, setWatching] = useState(false);
  const [adComplete, setAdComplete] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (watching && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (watching && countdown === 0) {
      setAdComplete(true);
    }
  }, [watching, countdown]);

  const startWatching = () => {
    setWatching(true);
    setCountdown(5);
  };

  const claimReward = async () => {
    setLoading(true);
    try {
      const result = await watchAdAPI();
      toast.success(result.message);
      onCoinsEarned(result.coins, result.dailyAdWatched);
      onClose();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="z-50 fixed inset-0 flex justify-center items-center bg-black/80 backdrop-blur-md p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget && !watching) onClose();
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative bg-gradient-to-br from-gray-900 to-black shadow-2xl border border-white/10 rounded-2xl w-full max-w-md overflow-hidden"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 p-5 text-center">
            <button
              onClick={onClose}
              disabled={watching}
              className="top-3 right-3 absolute bg-white/10 hover:bg-white/20 p-1 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
            <div className="inline-block bg-white/20 mb-2 p-3 rounded-2xl">
              <Video size={28} />
            </div>
            <h2 className="font-bold text-xl">Watch Ad & Earn Coins</h2>
            <p className="mt-1 text-white/80 text-sm">Get +5 coins for watching</p>
          </div>

          {/* Content */}
          <div className="p-6 text-center">
            {!watching && !adComplete && (
              <>
                <div className="flex justify-center items-center gap-2 mb-4">
                  <Coins size={32} className="text-yellow-400" />
                  <span className="font-bold text-yellow-400 text-3xl">+5</span>
                </div>
                <p className="mb-4 text-gray-400 text-sm">
                  Watch a short ad and earn free coins to reveal anonymous senders!
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={startWatching}
                    className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 py-3 rounded-xl font-semibold text-black hover:scale-105 transition-all duration-200"
                  >
                    Watch Ad 🎬
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 bg-white/10 hover:bg-white/20 py-3 rounded-xl font-semibold text-white transition-all duration-200"
                  >
                    Maybe Later
                  </button>
                </div>
              </>
            )}

            {watching && !adComplete && (
              <div className="text-center">
                <div className="bg-black/50 mb-4 p-8 border border-white/10 rounded-xl">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Video size={48} className="mx-auto text-purple-400" />
                  </motion.div>
                  <p className="mt-4 text-gray-400 text-sm">Watching advertisement...</p>
                  <p className="mt-2 font-bold text-purple-400 text-2xl">{countdown}s</p>
                </div>
                <div className="bg-white/10 rounded-full w-full h-1 overflow-hidden">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: `${((5 - countdown) / 5) * 100}%` }}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-full"
                  />
                </div>
                <p className="mt-3 text-gray-500 text-xs">Please wait for the ad to complete</p>
              </div>
            )}

            {adComplete && (
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring" }}
                >
                  <Award size={48} className="mx-auto mb-3 text-green-400" />
                </motion.div>
                <p className="mb-2 font-semibold text-green-400 text-lg">Ad Completed! 🎉</p>
                <p className="mb-4 text-gray-400 text-sm">You earned 5 coins!</p>
                <button
                  onClick={claimReward}
                  disabled={loading}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 disabled:opacity-50 py-3 rounded-xl w-full font-semibold text-white hover:scale-105 transition-all duration-200"
                >
                  {loading ? "Claiming..." : "Claim Reward"}
                </button>
              </div>
            )}
          </div>

          {/* Footer Note */}
          <div className="bg-white/5 p-3 border-white/10 border-t text-gray-500 text-xs text-center">
            <p>You can watch up to 5 ads per day</p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}