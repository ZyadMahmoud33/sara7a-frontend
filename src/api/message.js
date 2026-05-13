// frontend/src/api/message.js
import API from "./axios.js";

// ================================
// 📌 ENDPOINTS (متوافقة مع الباك اند)
// ================================
const MESSAGE_ENDPOINTS = {
  SEND: (receiverId) => `/message/send-message/${receiverId}`,
  GET_MY: "/message/get-message",
  REVEAL: (messageId) => `/message/${messageId}/reveal`,
  LIKE: (messageId) => `/message/${messageId}/like`,
  DELETE: (messageId) => `/message/message/${messageId}`,
  RESTORE: (messageId) => `/message/message/${messageId}/restore`,
  FORCE_DELETE: (messageId) => `/message/message/${messageId}/force`,
  GET_ALL: "/message/get-all-messages",
  GET_USER: (receiverId) => `/message/get-message-admin/${receiverId}`,
};

// ================================
// 🛠 HELPER FUNCTIONS
// ================================
const validateId = (id, name = "ID") => {
  if (!id || id === "undefined" || id === "null") {
    throw new Error(`${name} is required ❌`);
  }
  return true;
};

const validateMessageContent = (content) => {
  const text = content?.trim();
  if (!text || text.length < 2) {
    throw new Error("Message must be at least 2 characters ❌");
  }
  if (text.length > 500) {
    throw new Error("Message is too long (max 500 characters) ❌");
  }
  return text;
};

// ================================
// 📩 SEND MESSAGE
// ================================
export const sendMessageAPI = async (receiverId, content) => {
  try {
    validateId(receiverId, "Receiver ID");
    const validatedContent = validateMessageContent(content);
    
    const token = localStorage.getItem("accessToken");
    const role = localStorage.getItem("role");
    console.log("🔑 Token exists:", !!token);
    console.log("👤 Role:", role);
    
    if (!token) {
      throw { status: 401, message: "No token found. Please login." };
    }
    
    const response = await API.post(
      MESSAGE_ENDPOINTS.SEND(receiverId),
      { content: validatedContent }
    );
    
    return response?.data;
  } catch (error) {
    console.error("sendMessageAPI error:", error);
    console.error("Error status:", error?.response?.status);
    console.error("Error message:", error?.response?.data?.message);
    
    if (error?.response?.status === 401 || error?.status === 401) {
      throw {
        status: 401,
        message: "You must be logged in to send messages",
        needLogin: true,
      };
    }
    throw error?.response?.data || error;
  }
};

// ================================
// 📥 GET MY MESSAGES
// ================================
export const getMyMessagesAPI = async () => {
  try {
    const response = await API.get(MESSAGE_ENDPOINTS.GET_MY);
    const data = response?.data?.data || response?.data;
    const messages = Array.isArray(data) ? data : (data?.messages || []);
    
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    
    return messages.map(msg => {
      let senderProfilePic = null;
      const sender = msg.sender || msg.senderId;
      
      if (sender?.profilePic) {
        if (sender.profilePic.startsWith('/uploads')) {
          senderProfilePic = `${baseUrl}${sender.profilePic}`;
        } else if (!sender.profilePic.startsWith('http')) {
          senderProfilePic = `${baseUrl}/${sender.profilePic}`;
        } else {
          senderProfilePic = sender.profilePic;
        }
      }
      
      return {
        ...msg,
        isRevealed: msg.isRevealed || false,
        liked: msg.liked ?? false,
        likes: msg.likes || 0,
        senderId: msg.isRevealed ? msg.senderId : null,
        sender: msg.isRevealed && sender ? {
          _id: sender._id,
          firstName: sender.firstName,
          lastName: sender.lastName,
          username: sender.username,
          profilePic: senderProfilePic,
          email: sender.email,
          plan: sender.plan,
        } : null
      };
    });
  } catch (error) {
    console.error("getMyMessagesAPI error:", error);
    throw error?.response?.data || error;
  }
};

// ================================
// 👀 REVEAL SENDER
// ================================
export const revealSenderAPI = async (messageId) => {
  try {
    validateId(messageId, "Message ID");
    
    const response = await API.patch(MESSAGE_ENDPOINTS.REVEAL(messageId));
    
    console.log("🔓 Reveal sender response:", response.data);
    
    return {
      success: true,
      message: response?.data?.message,
      remainingCoins: response?.data?.data?.remainingCoins || 0,
      sender: response?.data?.data?.sender || null,
      revealedAt: response?.data?.data?.revealedAt || null,
    };
  } catch (error) {
    console.error("revealSenderAPI error:", error);
    throw error?.response?.data || error;
  }
};

// ================================
// ❤️ LIKE MESSAGE
// ================================
export const likeMessageAPI = async (messageId) => {
  try {
    validateId(messageId, "Message ID");
    
    const response = await API.patch(MESSAGE_ENDPOINTS.LIKE(messageId));
    
    return {
      success: true,
      likes: response?.data?.data?.likes || 0,
      liked: response?.data?.data?.liked || false,
      message: response?.data?.message,
    };
  } catch (error) {
    console.error("likeMessageAPI error:", error);
    throw error?.response?.data || error;
  }
};

// ================================
// 🗑 SOFT DELETE MESSAGE
// ================================
export const deleteMessageAPI = async (messageId) => {
  try {
    validateId(messageId, "Message ID");
    
    const response = await API.delete(MESSAGE_ENDPOINTS.DELETE(messageId));
    return response?.data;
  } catch (error) {
    console.error("deleteMessageAPI error:", error);
    throw error?.response?.data || error;
  }
};

// ================================
// ♻️ RESTORE MESSAGE
// ================================
export const restoreMessageAPI = async (messageId) => {
  try {
    validateId(messageId, "Message ID");
    
    const response = await API.patch(MESSAGE_ENDPOINTS.RESTORE(messageId));
    return response?.data;
  } catch (error) {
    console.error("restoreMessageAPI error:", error);
    throw error?.response?.data || error;
  }
};

// ================================
// 💀 PERMANENT DELETE
// ================================
export const forceDeleteMessageAPI = async (messageId) => {
  try {
    validateId(messageId, "Message ID");
    
    const response = await API.delete(MESSAGE_ENDPOINTS.FORCE_DELETE(messageId));
    return response?.data;
  } catch (error) {
    console.error("forceDeleteMessageAPI error:", error);
    throw error?.response?.data || error;
  }
};

// ================================
// 🛠️ ADMIN: GET ALL MESSAGES
// ================================
export const getAllMessagesAPI = async (params = {}) => {
  try {
    const { page = 1, limit = 20, filter = "" } = params;
    
    const queryParams = new URLSearchParams();
    queryParams.append("page", page);
    queryParams.append("limit", limit);
    if (filter) queryParams.append("filter", filter);
    
    const response = await API.get(`${MESSAGE_ENDPOINTS.GET_ALL}?${queryParams.toString()}`);
    
    const data = response?.data?.data || response?.data;
    const messages = Array.isArray(data) ? data : (data?.messages || []);
    
    return {
      messages,
      pagination: response?.data?.pagination || null,
    };
  } catch (error) {
    console.error("getAllMessagesAPI error:", error);
    throw error?.response?.data || error;
  }
};

// ================================
// 🛠️ ADMIN: GET USER MESSAGES
// ================================
export const getUserMessagesAPI = async (receiverId, params = {}) => {
  try {
    validateId(receiverId, "User ID");
    
    const { page = 1, limit = 20 } = params;
    const queryParams = new URLSearchParams();
    queryParams.append("page", page);
    queryParams.append("limit", limit);
    
    const response = await API.get(`${MESSAGE_ENDPOINTS.GET_USER(receiverId)}?${queryParams.toString()}`);
    
    const data = response?.data?.data || response?.data;
    const messages = Array.isArray(data) ? data : (data?.messages || []);
    
    return {
      messages,
      pagination: response?.data?.pagination || null,
    };
  } catch (error) {
    console.error("getUserMessagesAPI error:", error);
    throw error?.response?.data || error;
  }
};

// ================================
// 🪙 COINS & MESSAGE MANAGEMENT
// ================================
export const getUserCoinsBalanceAPI = async () => {
  try {
    const response = await API.get("/user/getuser");
    const userData = response?.data?.data || response?.data;
    return {
      coins: userData?.coins || 0,
      plan: userData?.plan || "free",
    };
  } catch (error) {
    console.error("getUserCoinsBalanceAPI error:", error);
    return { coins: 0, plan: "free" };
  }
};

export const canAffordRevealAPI = async () => {
  try {
    const { coins, plan } = await getUserCoinsBalanceAPI();
    const REVEAL_COST = 5;
    
    if (plan === "premium") return { canReveal: true, reason: null };
    if (plan === "pro" && coins >= REVEAL_COST) return { canReveal: true, reason: null };
    if (plan === "pro" && coins < REVEAL_COST) {
      return { canReveal: false, reason: `Need ${REVEAL_COST - coins} more coins` };
    }
    return { canReveal: false, reason: "Upgrade to Pro or Premium" };
  } catch (error) {
    console.error("canAffordRevealAPI error:", error);
    return { canReveal: false, reason: "Error checking balance" };
  }
};

export const syncUserCoinsAPI = async () => {
  try {
    const { coins, plan } = await getUserCoinsBalanceAPI();
    return { coins, plan };
  } catch (error) {
    console.error("syncUserCoinsAPI error:", error);
    return { coins: 0, plan: "free" };
  }
};

export const getRemainingRevealsCountAPI = async () => {
  try {
    const { plan } = await getUserCoinsBalanceAPI();
    const messages = await getMyMessagesAPI();
    const revealedCount = messages.filter(m => m.isRevealed).length;
    const MAX_PRO_REVEALS = 50;
    
    if (plan === "premium") return "Unlimited";
    if (plan === "pro") {
      const remaining = MAX_PRO_REVEALS - revealedCount;
      return remaining > 0 ? remaining : 0;
    }
    return 0;
  } catch (error) {
    console.error("getRemainingRevealsCountAPI error:", error);
    return 0;
  }
};

// ================================
// 🧪 HELPERS
// ================================
export const formatMessageDate = (date) => {
  if (!date) return "";
  const messageDate = new Date(date);
  const now = new Date();
  const diffMs = now - messageDate;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return messageDate.toLocaleDateString();
};

export const truncateMessage = (content, maxLength = 150) => {
  if (!content) return "";
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + "...";
};

export const canRevealSender = (userPlan, userCoins = 0) => {
  const REVEAL_COST = 5;
  if (userPlan === "premium") return true;
  if (userPlan === "pro" && userCoins >= REVEAL_COST) return true;
  return false;
};

export const getRevealCost = () => 5;