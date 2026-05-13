// frontend/src/components/AdModal.jsx
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Coins, Video, Clock, Award, AlertCircle, RefreshCw, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";
import { watchAdAPI } from "../api/user";
import { getProfileAPI } from "../api/user";
import { cn } from "@/lib/utils";

export default function AdModal({ onClose, onCoinsEarned }) {
  const [countdown, setCountdown] = useState(5);
  const [watching, setWatching] = useState(false);
  const [adComplete, setAdComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null); // ✅ تايمر للتجديد
  const [dailyStats, setDailyStats] = useState({
    watched: 0,
    remaining: 5,
    canWatch: true,
    nextReset: null,
  });
  const [fetchingStats, setFetchingStats] = useState(false);

  // ✅ جلب الإحصائيات من getProfileAPI بدل watchAdAPI عشان مايخصمش كوين
  const fetchDailyStats = useCallback(async () => {
    if (fetchingStats) return;
    setFetchingStats(true);
    try {
      const userData = await getProfileAPI();
      const watched = userData?.dailyAdWatched || 0;
      const remaining = Math.max(0, 5 - watched);
      const canWatch = remaining > 0;

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      setDailyStats({
        watched,
        remaining,
        canWatch,
        nextReset: tomorrow,
      });
    } catch (error) {
      console.error("Failed to fetch ad stats:", error);
    } finally {
      setFetchingStats(false);
    }
  }, []);

  useEffect(() => {
    fetchDailyStats();
  }, []);

  // ✅ تايمر للتجديد - بيعد للـ midnight
  useEffect(() => {
    if (!dailyStats.canWatch && dailyStats.nextReset) {
      const interval = setInterval(() => {
        const now = new Date();
        const reset = new Date(dailyStats.nextReset);
        const diff = reset - now;

        if (diff <= 0) {
          // ✅ اتجدد - reset الإحصائيات
          setDailyStats(prev => ({
            ...prev,
            watched: 0,
            remaining: 5,
            canWatch: true,
          }));
          setTimeLeft(null);
          clearInterval(interval);
          return;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [dailyStats.canWatch, dailyStats.nextReset]);

  // تايمر العد التنازلي للإعلان
  useEffect(() => {
    if (watching && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (watching && countdown === 0) {
      setAdComplete(true);
      setWatching(false);
    }
  }, [watching, countdown]);

  const startWatching = () => {
    if (!dailyStats.canWatch) {
      toast.error(`Daily limit reached! Resets in ${timeLeft || "tomorrow"}`);
      return;
    }
    setWatching(true);
    setCountdown(5);
  };

  const claimReward = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const result = await watchAdAPI();

      toast.success(result.message || "You earned 5 coins! 🎉");

      const newWatched = result.dailyAdWatched || dailyStats.watched + 1;
      const remaining = Math.max(0, 5 - newWatched);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      setDailyStats({
        watched: newWatched,
        remaining,
        canWatch: remaining > 0,
        nextReset: tomorrow,
      });

      if (onCoinsEarned) {
        onCoinsEarned(result.coins, newWatched);
      }

      setTimeout(() => onClose(), 1000);

    } catch (error) {
      console.error("Claim reward error:", error);
      toast.error(error.message || "Failed to claim reward. Please try again.");
      await fetchDailyStats();
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = () => (dailyStats.watched / 5) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={cn('z-50', 'fixed', 'inset-0', 'flex', 'justify-center', 'items-center', 'bg-black/80', 'backdrop-blur-md', 'p-4')}
        onClick={(e) => { if (e.target === e.currentTarget && !watching && !loading) onClose(); }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className={cn('relative', 'bg-gradient-to-br', 'from-gray-900', 'to-black', 'shadow-2xl', 'border', 'border-white/10', 'rounded-2xl', 'w-full', 'max-w-md', 'overflow-hidden')}
        >
          {/* Header */}
          <div className={cn('relative', 'bg-gradient-to-r', 'from-purple-600', 'to-pink-600', 'p-5', 'text-center')}>
            <button onClick={onClose} disabled={watching || loading} className={cn('top-3', 'right-3', 'absolute', 'bg-white/10', 'hover:bg-white/20', 'disabled:opacity-50', 'p-1', 'rounded-lg', 'transition-colors')}>
              <X size={18} />
            </button>
            <div className={cn('inline-block', 'bg-white/20', 'mb-2', 'p-3', 'rounded-2xl')}>
              <Video size={28} />
            </div>
            <h2 className={cn('font-bold', 'text-xl')}>Watch Ad & Earn Coins</h2>
            <p className={cn('mt-1', 'text-white/80', 'text-sm')}>Get +5 coins for watching</p>
          </div>

          {/* Content */}
          <div className={cn('p-6', 'text-center')}>
            {/* Daily Progress */}
            <div className={cn('bg-white/5', 'mb-4', 'p-3', 'border', 'border-white/10', 'rounded-xl')}>
              <div className={cn('flex', 'justify-between', 'items-center', 'mb-2', 'text-gray-400', 'text-xs')}>
                <span>Today's Progress</span>
                <span>{dailyStats.watched} / 5 ads</span>
              </div>
              <div className={cn('bg-white/10', 'rounded-full', 'w-full', 'h-2', 'overflow-hidden')}>
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: `${getProgressPercentage()}%` }}
                  className={cn('bg-gradient-to-r', 'from-yellow-500', 'to-orange-500', 'h-full')}
                />
              </div>
              {/* ✅ تايمر للتجديد */}
              {!dailyStats.canWatch && timeLeft && (
                <div className={cn('flex', 'justify-center', 'items-center', 'gap-2', 'bg-yellow-500/10', 'mt-3', 'p-2', 'border', 'border-yellow-500/30', 'rounded-lg')}>
                  <Clock size={14} className="text-yellow-400" />
                  <span className={cn('font-mono', 'font-bold', 'text-yellow-400', 'text-sm')}>Resets in {timeLeft}</span>
                </div>
              )}
            </div>

            {!watching && !adComplete && (
              <>
                <div className={cn('flex', 'justify-center', 'items-center', 'gap-2', 'mb-4')}>
                  <Coins size={32} className="text-yellow-400" />
                  <span className={cn('font-bold', 'text-yellow-400', 'text-3xl')}>+5</span>
                </div>
                <p className={cn('mb-4', 'text-gray-400', 'text-sm')}>Watch a short ad and earn free coins to reveal anonymous senders!</p>

                {!dailyStats.canWatch && (
                  <div className={cn('flex', 'items-center', 'gap-2', 'bg-yellow-500/20', 'mb-4', 'p-3', 'border', 'border-yellow-500/30', 'rounded-lg', 'text-yellow-400', 'text-sm')}>
                    <AlertCircle size={16} className="flex-shrink-0" />
                    <span>Daily limit reached! Come back tomorrow</span>
                  </div>
                )}

                <div className={cn('flex', 'gap-3')}>
                  <button onClick={startWatching} disabled={!dailyStats.canWatch} className={cn("flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 py-3 rounded-xl font-semibold text-black transition-all duration-200", dailyStats.canWatch ? "hover:scale-105" : "opacity-50 cursor-not-allowed")}>
                    Watch Ad 🎬
                  </button>
                  <button onClick={onClose} className={cn('flex-1', 'bg-white/10', 'hover:bg-white/20', 'py-3', 'rounded-xl', 'font-semibold', 'text-white', 'transition-all', 'duration-200')}>
                    Maybe Later
                  </button>
                </div>
              </>
            )}

            {watching && !adComplete && (
              <div className="text-center">
                <div className={cn('bg-black/50', 'mb-4', 'p-8', 'border', 'border-white/10', 'rounded-xl')}>
                  <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                    <Video size={48} className={cn('mx-auto', 'text-purple-400')} />
                  </motion.div>
                  <p className={cn('mt-4', 'text-gray-400', 'text-sm')}>Watching advertisement...</p>
                  <p className={cn('mt-2', 'font-bold', 'text-purple-400', 'text-2xl')}>{countdown}s</p>
                </div>
                <div className={cn('bg-white/10', 'rounded-full', 'w-full', 'h-1', 'overflow-hidden')}>
                  <motion.div initial={{ width: "0%" }} animate={{ width: `${((5 - countdown) / 5) * 100}%` }} className={cn('bg-gradient-to-r', 'from-purple-500', 'to-pink-500', 'h-full')} />
                </div>
                <p className={cn('mt-3', 'text-gray-500', 'text-xs')}>Please wait for the ad to complete</p>
              </div>
            )}

            {adComplete && (
              <div className="text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                  <Award size={48} className={cn('mx-auto', 'mb-3', 'text-green-400')} />
                </motion.div>
                <p className={cn('mb-2', 'font-semibold', 'text-green-400', 'text-lg')}>Ad Completed! 🎉</p>
                <p className={cn('mb-4', 'text-gray-400', 'text-sm')}>You earned 5 coins!</p>
                <button onClick={claimReward} disabled={loading} className={cn('bg-gradient-to-r', 'from-green-500', 'to-emerald-500', 'disabled:opacity-50', 'py-3', 'rounded-xl', 'w-full', 'font-semibold', 'text-white', 'hover:scale-105', 'transition-all', 'duration-200')}>
                  {loading ? (
                    <div className={cn('flex', 'justify-center', 'items-center', 'gap-2')}>
                      <RefreshCw size={18} className="animate-spin" /> Claiming...
                    </div>
                  ) : "Claim Reward"}
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={cn('bg-white/5', 'p-3', 'border-white/10', 'border-t')}>
            <div className={cn('flex', 'justify-center', 'items-center', 'gap-2', 'text-gray-500', 'text-xs')}>
              <TrendingUp size={12} />
              <span>Watch up to 5 ads per day • Each ad gives 5 coins</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}