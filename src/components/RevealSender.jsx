// frontend/src/components/RevealSender.jsx
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Coins, Crown, AlertCircle, Lock, User, AtSign, Mail, X, Clock, Hash, Heart, Copy, Check, Trash2, MessageCircle, Zap } from "lucide-react";
import { revealSenderAPI } from "../api/message";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

const REVEAL_COST = 5;

export default function RevealSender({ 
  message, 
  onRevealSuccess, 
  onUpgradeClick,
  onWatchAdClick,
  userPlan,
  userCoins,
  className 
}) {
  const [revealingId, setRevealingId] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(message);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingMessageId, setPendingMessageId] = useState(null);

  // ✅ التحقق من إمكانية الكشف
  const canReveal = useCallback(() => {
    const token = localStorage.getItem("accessToken");
    console.log("🔍 canReveal check:", { 
      hasToken: !!token, 
      userPlan, 
      userCoins, 
      REVEAL_COST,
      isPremium: userPlan === "premium",
      isProWithCoins: userPlan === "pro" && userCoins >= REVEAL_COST
    });
    
    if (!token) return false;
    if (userPlan === "premium") return true;
    if (userCoins >= REVEAL_COST) return true; // pro و free كمان لو عندهم كوين كافية
    return false;
  }, [userPlan, userCoins]);

  // ✅ رسالة الكشف حسب الخطة
  const getRevealButtonText = useCallback(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return "Login to Reveal 🔒";
    if (userPlan === "premium") return "Reveal (Unlimited) ✨";
    if (userCoins >= REVEAL_COST) return `Reveal with ${REVEAL_COST} Coins 🪙`;
    return `Reveal with coin 🪙`;
  }, [userPlan, userCoins]);

  // ✅ دالة الكشف الأساسية
  const handleReveal = async (id) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Please login first to reveal sender 🔒");
      onUpgradeClick?.();
      return;
    }
    
    if (!canReveal()) {
      toast.error(`Not enough coins! Need ${REVEAL_COST - userCoins} more coins to reveal sender 💰`);
      onWatchAdClick?.();
      return;
    }

    setRevealingId(id);
    try {
      const result = await revealSenderAPI(id);
      
      console.log("🔓 Reveal result:", result);
      
      onRevealSuccess?.({
        messageId: id,
        sender: result.sender,
        revealedAt: result.revealedAt,
        remainingCoins: result.remainingCoins
      });
      
      if (selectedMessage?._id === id) {
        setSelectedMessage({
          ...selectedMessage,
          isRevealed: true,
          sender: result.sender,
          revealedAt: result.revealedAt
        });
      }
      
      if (showMessageModal) {
        setTimeout(() => closeModal(), 1500);
      }
      
      const successMsg = userPlan === "premium" 
        ? "Sender revealed successfully! ✨" 
        : `Sender revealed! -${REVEAL_COST} coins 💰`;
      
      toast.success(result.message || successMsg);
      
    } catch (err) {
      console.error("❌ Reveal error:", err);
      const errorMsg = err?.response?.data?.message || err?.message;
      const status = err?.response?.status;
      
      if (status === 400 && errorMsg?.includes("coins")) {
        toast.error(`Not enough coins! Need ${REVEAL_COST} coins to reveal sender 💰`);
        onWatchAdClick?.();
      } else if (status === 400 && errorMsg?.includes("already revealed")) {
        toast.error("This sender has already been revealed! 🔓");
        onRevealSuccess?.({
          messageId: id,
          sender: selectedMessage?.sender,
          revealedAt: selectedMessage?.revealedAt,
          remainingCoins: userCoins
        });
      } else if (status === 400 && errorMsg?.includes("guest")) {
        toast.error("This message was sent before login. Sender cannot be revealed. 📝");
      } else if (status === 403) {
        toast.error("You don't have permission to reveal this sender ❌");
      } else if (status === 404) {
        toast.error("Message not found or has been deleted 🗑️");
      } else {
        toast.error(errorMsg || "Failed to reveal sender. Please try again.");
      }
    } finally {
      setRevealingId(null);
      setShowConfirmModal(false);
      setPendingMessageId(null);
    }
  };

  const formatFullDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleString('en-US', { 
      dateStyle: 'full', 
      timeStyle: 'medium' 
    });
  };

  const getImageUrl = (profilePic) => {
    if (!profilePic) return null;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    if (profilePic.startsWith('/uploads')) return `${baseUrl}${profilePic}`;
    if (profilePic.startsWith('http')) return profilePic;
    return `${baseUrl}/${profilePic}`;
  };

  const openMessageModal = () => {
    setSelectedMessage(message);
    setShowMessageModal(true);
  };

  const closeModal = () => {
    setShowMessageModal(false);
    setSelectedMessage(null);
  };

  // ✅ زر الكشف الرئيسي - يفتح مودال التأكيد
  const RevealButton = () => (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={(e) => {
        e.stopPropagation();
        setPendingMessageId(message._id);
        setShowConfirmModal(true);
      }}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold transition-all duration-200",
        userPlan === "premium"
          ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-black shadow-lg shadow-yellow-500/30"
          : userCoins >= REVEAL_COST
          ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30"
          : "bg-gray-600/50 text-gray-400 cursor-not-allowed",
        "disabled:opacity-50"
      )}
      disabled={userPlan !== "premium" && userCoins < REVEAL_COST}
    >
      {userPlan === "premium" ? (
        <Crown size={16} className="text-yellow-300" />
      ) : userCoins >= REVEAL_COST ? (
        <Coins size={16} />
      ) : (
        <Lock size={16} />
      )}
      <span>{getRevealButtonText()}</span>
      {userPlan !== "premium" && userCoins >= REVEAL_COST && (
        <span className={cn('ml-1', 'text-xs', 'bg-white/20', 'px-1.5', 'py-0.5', 'rounded')}>
          {REVEAL_COST}
        </span>
      )}
    </motion.button>
  );

  // ✅ مودال التأكيد قبل الخصم
  const ConfirmModal = () => (
    <AnimatePresence>
      {showConfirmModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn('z-[100]', 'fixed', 'inset-0', 'flex', 'justify-center', 'items-center', 'bg-black/80', 'backdrop-blur-md', 'p-4')}
          onClick={() => setShowConfirmModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={cn('relative', 'bg-gradient-to-br', 'from-gray-900', 'to-black', 'shadow-2xl', 'border', 'border-yellow-500/30', 'rounded-2xl', 'w-full', 'max-w-md', 'overflow-hidden')}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={cn('p-6', 'text-center')}>
              {/* Icon */}
              <div className={cn('bg-yellow-500/20', 'mx-auto', 'mb-4', 'p-3', 'rounded-full', 'w-16', 'h-16')}>
                <Coins size={32} className={cn('mx-auto', 'text-yellow-400')} />
              </div>

              <h3 className={cn('font-bold', 'text-white', 'text-xl')}>Confirm Reveal Sender</h3>
              <p className={cn('mt-1', 'text-gray-400', 'text-sm')}>
                Are you sure you want to reveal who sent this message?
              </p>
              
              {/* Cost Details */}
              <div className={cn('bg-white/5', 'mt-4', 'p-4', 'rounded-xl')}>
                <div className={cn('flex', 'justify-between', 'items-center', 'mb-2')}>
                  <span className="text-gray-400">Reveal Cost</span>
                  <div className={cn('flex', 'items-center', 'gap-1')}>
                    <Coins size={16} className="text-yellow-400" />
                    <span className={cn('font-bold', 'text-yellow-400')}>{REVEAL_COST} Coins</span>
                  </div>
                </div>
                
                <div className={cn('flex', 'justify-between', 'items-center')}>
                  <span className="text-gray-400">Your Balance</span>
                  <div className={cn('flex', 'items-center', 'gap-1')}>
                    <Coins size={16} className="text-yellow-400" />
                    <span className={`font-bold ${userCoins >= REVEAL_COST ? 'text-green-400' : 'text-red-400'}`}>
                      {userCoins} Coins
                    </span>
                  </div>
                </div>

                {userPlan === "premium" && (
                  <div className={cn('mt-2', 'text-green-400', 'text-sm')}>
                    ✨ Premium users reveal for free!
                  </div>
                )}

                {userPlan === "pro" && userCoins >= REVEAL_COST && (
                  <div className={cn('mt-2', 'pt-2', 'border-white/10', 'border-t', 'text-gray-400', 'text-xs')}>
                    After reveal: {userCoins - REVEAL_COST} coins remaining
                  </div>
                )}

                {userPlan === "pro" && userCoins < REVEAL_COST && (
                  <div className={cn('mt-2', 'text-red-400', 'text-sm')}>
                    ⚠️ Insufficient balance! Need {REVEAL_COST - userCoins} more coins
                  </div>
                )}
              </div>

              {/* Warning Note */}
              <div className={cn('bg-yellow-500/10', 'mt-4', 'p-3', 'border', 'border-yellow-500/30', 'rounded-lg')}>
                <div className={cn('flex', 'items-center', 'gap-2', 'text-yellow-400', 'text-xs')}>
                  <AlertCircle size={14} />
                  <span>This action cannot be undone. The sender's identity will be permanently revealed.</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className={cn('flex', 'gap-3', 'mt-6')}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowConfirmModal(false)}
                  className={cn('flex-1', 'bg-white/10', 'hover:bg-white/20', 'py-2.5', 'rounded-lg', 'font-semibold', 'text-white', 'transition-all', 'duration-200')}
                >
                  Cancel
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleReveal(pendingMessageId)}
                  disabled={revealingId === pendingMessageId || !canReveal()}
                  className={cn(
                    "flex-1 bg-gradient-to-r from-purple-500 to-pink-500 py-2.5 rounded-lg font-bold text-white transition-all duration-200",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {revealingId === pendingMessageId ? (
                    <div className={cn('flex', 'justify-center', 'items-center', 'gap-2')}>
                      <div className={cn('border-2', 'border-white', 'border-t-transparent', 'rounded-full', 'w-4', 'h-4', 'animate-spin')} />
                      Revealing...
                    </div>
                  ) : (
                    <div className={cn('flex', 'justify-center', 'items-center', 'gap-2')}>
                      <Coins size={16} />
                      Confirm & Reveal
                    </div>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ✅ Coins Section Component
  const CoinsSection = () => (
    <div className={cn('bg-gradient-to-r', 'from-yellow-500/10', 'to-orange-500/10', 'mb-4', 'p-4', 'border', 'border-yellow-500/30', 'rounded-xl')}>
      <div className={cn('flex', 'justify-between', 'items-center')}>
        <div className={cn('flex', 'items-center', 'gap-3')}>
          <div className={cn('bg-yellow-500/20', 'p-2', 'rounded-lg')}>
            <Coins size={20} className="text-yellow-400" />
          </div>
          <div>
            <p className={cn('font-semibold', 'text-yellow-400', 'text-sm')}>Reveal Cost</p>
            <p className={cn('font-bold', 'text-white', 'text-xl')}>{REVEAL_COST} Coins</p>
          </div>
        </div>
        
        <div className="text-right">
          <p className={cn('text-gray-400', 'text-xs')}>Your Balance</p>
          <div className={cn('flex', 'items-center', 'gap-2')}>
            <Coins size={16} className="text-yellow-400" />
            <span className={cn('font-bold', 'text-white', 'text-xl')}>{userCoins || 0}</span>
          </div>
        </div>
      </div>
      
      {userPlan !== "premium" && (userCoins || 0) < REVEAL_COST && (
        <div className="mt-3">
          <div className={cn('flex', 'justify-between', 'mb-1', 'text-gray-400', 'text-xs')}>
            <span>Need {REVEAL_COST - (userCoins || 0)} more coins</span>
            <span>Watch ads to earn</span>
          </div>
          <div className={cn('bg-white/10', 'rounded-full', 'h-1.5', 'overflow-hidden')}>
            <div 
              className={cn('bg-gradient-to-r', 'from-yellow-500', 'to-orange-500', 'rounded-full', 'h-full')}
              style={{ width: `${((userCoins || 0) / REVEAL_COST) * 100}%` }}
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              closeModal();
              onWatchAdClick?.();
            }}
            className={cn('flex', 'items-center', 'justify-center', 'gap-2', 'bg-yellow-500/20', 'hover:bg-yellow-500/30', 'mt-3', 'py-2', 'rounded-lg', 'w-full', 'text-yellow-400', 'text-sm', 'transition-all', 'duration-200')}
          >
            <Zap size={14} /> Watch Ad to Earn +5 Coins
          </motion.button>
        </div>
      )}
    </div>
  );

  // ✅ زر الكشف داخل المودال
  const RevealInModalButton = () => (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        setPendingMessageId(selectedMessage._id);
        setShowConfirmModal(true);
      }}
      disabled={!canReveal()}
      className={cn(
        "flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold transition-all duration-200",
        canReveal()
          ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30"
          : "bg-gray-500/20 text-gray-400 cursor-not-allowed",
        "disabled:opacity-50"
      )}
    >
      <Eye size={18} />
      {userPlan === "premium" 
        ? "Reveal Sender (Unlimited)"
        : `Reveal Sender (${REVEAL_COST} Coins)`
      }
    </motion.button>
  );

  // ✅ Modal Component
  const MessageModal = () => (
    <AnimatePresence>
      {showMessageModal && selectedMessage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn('z-50', 'fixed', 'inset-0', 'flex', 'justify-center', 'items-center', 'bg-black/80', 'backdrop-blur-md', 'p-4')}
          onClick={closeModal}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={cn('relative', 'bg-gradient-to-br', 'from-gray-900', 'to-black', 'shadow-2xl', 'border', 'border-purple-500/30', 'rounded-2xl', 'w-full', 'max-w-2xl', 'max-h-[90vh]', 'overflow-y-auto')}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={closeModal} className={cn('top-4', 'right-4', 'absolute', 'bg-white/10', 'hover:bg-white/20', 'p-2', 'rounded-lg', 'transition-all', 'duration-200', 'z-10')}>
              <X size={20} />
            </button>

            <div className="p-6">
              {/* Header Badges */}
              <div className={cn('flex', 'flex-wrap', 'justify-between', 'items-start', 'gap-3', 'mb-6')}>
                <div className={cn('flex', 'flex-wrap', 'gap-2')}>
                  <span className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                    selectedMessage.isRevealed
                      ? "bg-green-500/20 text-green-400 border border-green-500/50"
                      : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50"
                  }`}>
                    {selectedMessage.isRevealed ? <Eye size={14} /> : <Lock size={14} />}
                    {selectedMessage.isRevealed ? "Sender Revealed" : "Anonymous"}
                  </span>
                  {selectedMessage.liked && (
                    <span className={cn('flex', 'items-center', 'gap-2', 'bg-pink-500/20', 'px-3', 'py-1.5', 'border', 'border-pink-500/50', 'rounded-full', 'text-pink-400', 'text-sm')}>
                      <Heart size={14} fill="currentColor" /> Liked
                    </span>
                  )}
                </div>
                <div className={cn('flex', 'items-center', 'gap-2', 'text-gray-500', 'text-sm')}>
                  <Hash size={14} /><span>ID: {selectedMessage._id?.slice(-8)}</span>
                </div>
              </div>

              {/* Message Content */}
              <div className={cn('bg-white/5', 'mb-6', 'p-6', 'border', 'border-white/10', 'rounded-xl')}>
                <div className={cn('flex', 'items-center', 'gap-2', 'mb-4', 'text-purple-400')}>
                  <MessageCircle size={18} /><span className="font-semibold">Message Content</span>
                </div>
                <p className={cn('text-gray-200', 'leading-relaxed', 'whitespace-pre-wrap', 'text-lg')}>
                  "{selectedMessage.content || "No content"}"
                </p>
                <div className={cn('mt-3', 'pt-3', 'border-white/10', 'border-t', 'text-gray-500', 'text-xs')}>
                  {selectedMessage.content?.length || 0} characters
                </div>
              </div>

              {/* Sender Info - Revealed */}
              {selectedMessage.isRevealed && selectedMessage.sender ? (
                <div className={cn('bg-gradient-to-r', 'from-green-500/10', 'to-emerald-500/10', 'mb-6', 'p-6', 'border', 'border-green-500/30', 'rounded-xl')}>
                  <div className={cn('flex', 'items-center', 'gap-2', 'mb-4', 'text-green-400')}>
                    <User size={18} /><span className="font-semibold">Sender Information</span>
                  </div>
                  <div className={cn('flex', 'items-start', 'gap-4')}>
                    <div className="flex-shrink-0">
                      {selectedMessage.sender.profilePic ? (
                        <img src={getImageUrl(selectedMessage.sender.profilePic)} alt={selectedMessage.sender.firstName} className={cn('border-2', 'border-green-500', 'rounded-full', 'w-16', 'h-16', 'object-cover')} />
                      ) : (
                        <div className={cn('flex', 'justify-center', 'items-center', 'bg-gradient-to-br', 'from-green-500', 'to-emerald-500', 'rounded-full', 'w-16', 'h-16')}>
                          <User size={32} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className={cn('font-bold', 'text-green-400', 'text-xl')}>
                        {selectedMessage.sender.firstName} {selectedMessage.sender.lastName || ""}
                      </h3>
                      <div className={cn('space-y-1', 'mt-2', 'text-sm')}>
                        {selectedMessage.sender.username && (
                          <div className={cn('flex', 'items-center', 'gap-2', 'text-gray-300')}>
                            <AtSign size={14} className="text-gray-500" />
                            <span>@{selectedMessage.sender.username}</span>
                          </div>
                        )}
                        {selectedMessage.sender.email && (
                          <div className={cn('flex', 'items-center', 'gap-2', 'text-gray-300')}>
                            <Mail size={14} className="text-gray-500" />
                            <span>{selectedMessage.sender.email}</span>
                          </div>
                        )}
                        {selectedMessage.sender.plan && (
                          <div className={cn('flex', 'items-center', 'gap-2', 'text-gray-300')}>
                            {selectedMessage.sender.plan === "premium" ? <Crown size={14} className="text-yellow-500" /> : <Zap size={14} className="text-cyan-400" />}
                            <span className="capitalize">{selectedMessage.sender.plan} Member</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={cn('bg-yellow-500/10', 'mb-6', 'p-6', 'border', 'border-yellow-500/30', 'rounded-xl')}>
                  <div className={cn('flex', 'items-center', 'gap-3')}>
                    <div className={cn('flex', 'justify-center', 'items-center', 'bg-gradient-to-br', 'from-yellow-500', 'to-orange-500', 'rounded-full', 'w-12', 'h-12')}>
                      <Lock size={20} />
                    </div>
                    <div className="flex-1">
                      <p className={cn('font-semibold', 'text-yellow-400')}>Anonymous Sender</p>
                      <p className={cn('mt-1', 'text-gray-400', 'text-sm')}>
                        {userPlan === "premium" 
                          ? "Click the reveal button below to see who sent this message" 
                          : userPlan === "pro"
                          ? `Reveal sender for ${REVEAL_COST} coins. You have ${userCoins} coins available.`
                          : "Upgrade to Pro or Premium to reveal the sender"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Coins Section */}
              {!selectedMessage.isRevealed && <CoinsSection />}

              {/* Message Details */}
              <div className={cn('bg-white/5', 'mb-6', 'p-6', 'border', 'border-white/10', 'rounded-xl')}>
                <div className={cn('flex', 'items-center', 'gap-2', 'mb-4', 'text-gray-400')}>
                  <Clock size={18} /><span className="font-semibold">Message Details</span>
                </div>
                <div className={cn('gap-4', 'grid', 'grid-cols-2', 'text-sm')}>
                  <div>
                    <p className="text-gray-500">Sent</p>
                    <p className="text-gray-300">{formatFullDate(selectedMessage.createdAt)}</p>
                  </div>
                  {selectedMessage.revealedAt && (
                    <div>
                      <p className="text-gray-500">Revealed</p>
                      <p className="text-gray-300">{formatFullDate(selectedMessage.revealedAt)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-500">Message Length</p>
                    <p className="text-gray-300">{selectedMessage.content?.length || 0} characters</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Quality Score</p>
                    <p className="text-gray-300">
                      {selectedMessage.content?.length > 200 ? "Excellent" : selectedMessage.content?.length > 100 ? "Good" : "Short"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons in Modal */}
              <div className={cn('flex', 'flex-wrap', 'gap-3', 'justify-center')}>
                {!selectedMessage.isRevealed && <RevealInModalButton />}
                {selectedMessage.isRevealed && (
                  <div className={cn('text-center', 'text-green-400', 'py-3')}>
                    <Eye size={20} className={cn('inline', 'mr-2')} />
                    Sender revealed on {new Date(selectedMessage.revealedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <RevealButton />
      <ConfirmModal />
      <MessageModal />
    </>
  );
}