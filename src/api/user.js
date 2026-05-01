// frontend/src/api/user.js
import API from "./axios.js";

// ================================
// 📌 ENDPOINTS (متوافقة مع الباك)
// ================================
const USER_ENDPOINTS = {
  // 👤 Profile
  PROFILE: "/user/getuser",
  GET_BY_ID: (id) => `/user/${id}`,
  GET_BY_USERNAME: (username) => `/user/profile/${username}`,
  
  // 🔐 Security
  UPDATE_PASSWORD: "/user/update-password",
  
  // 🖼️ Media
  UPDATE_PROFILE_PIC: "/user/update-profile-pic",
  UPDATE_COVER_PIC: "/user/update-cover-pic",
  
  // ✏️ Profile Settings
  UPDATE_PROFILE: "/user/update-profile",
  UPDATE_PERSONAL_INFO: "/user/update-personal-info",
  
  // 💰 Plans & Payment
  CREATE_CHECKOUT: "/user/checkout",
  MANUAL_PAYMENT: "/user/manual-payment",
  UPGRADE_PLAN: "/user/upgrade",
  
  // 🎬 Ads
  WATCH_AD: "/user/watch-ad",
};

// ================================
// 🛠 HELPER FUNCTIONS
// ================================
const validateId = (id, name = "User ID") => {
  if (!id || id === "undefined" || id === "null") {
    throw new Error(`${name} is missing ❌`);
  }
  return true;
};

const handleResponse = (response) => {
  return response?.data?.data || response?.data || response;
};

const getUserIdFromToken = () => {
  const token = localStorage.getItem("accessToken");
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.id || payload.userId || payload._id || null;
  } catch {
    return null;
  }
};

// ================================
// 👤 GET PROFILE
// ================================
export const getProfileAPI = async () => {
  try {
    const response = await API.get(USER_ENDPOINTS.PROFILE);
    const userData = handleResponse(response);
    
    let genderString = "";
    if (userData?.gender === 0) genderString = "male";
    else if (userData?.gender === 1) genderString = "female";
    else if (userData?.gender === 2) genderString = "other";
    
    let profilePicUrl = userData?.profilePic || null;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    
    if (profilePicUrl && profilePicUrl.startsWith('/uploads')) {
      profilePicUrl = `${baseUrl}${profilePicUrl}`;
    } else if (profilePicUrl && !profilePicUrl.startsWith('http')) {
      profilePicUrl = `${baseUrl}/${profilePicUrl}`;
    }
    
    return {
      ...userData,
      profilePic: profilePicUrl,
      genderLabel: genderString,
      plan: userData?.plan || "free",
      coins: userData?.coins || 0,
      isPremium: userData?.isPremium || userData?.plan === "premium",
      dailyAdWatched: userData?.dailyAdWatched || 0,
      lastAdWatchDate: userData?.lastAdWatchDate || null,
    };
  } catch (error) {
    console.error("Get profile error:", error);
    throw new Error(error?.response?.data?.message || "Failed to get profile ❌");
  }
};

// ================================
// 👤 GET USER BY ID (معدل)
// ================================
export const getUserByIdAPI = async (id) => {
  try {
    validateId(id);
    const response = await API.get(USER_ENDPOINTS.GET_BY_ID(id));
    const userData = handleResponse(response);
    
    // ✅ تصحيح مسار الصورة
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    if (userData?.profilePic && userData.profilePic.startsWith('/uploads')) {
      userData.profilePic = `${baseUrl}${userData.profilePic}`;
    }
    
    return userData;
  } catch (error) {
    console.error("Get user by ID error:", error);
    throw new Error(error?.response?.data?.message || "Failed to get user ❌");
  }
};

// ================================
// 👤 GET USER BY USERNAME (معدل)
// ================================
export const getUserByUsernameAPI = async (username) => {
  try {
    if (!username) throw new Error("Username is required ❌");
    const response = await API.get(USER_ENDPOINTS.GET_BY_USERNAME(username));
    const userData = handleResponse(response);
    
    // ✅ تصحيح مسار الصورة
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    if (userData?.profilePic && userData.profilePic.startsWith('/uploads')) {
      userData.profilePic = `${baseUrl}${userData.profilePic}`;
    }
    
    return userData;
  } catch (error) {
    console.error("Get user by username error:", error);
    throw new Error(error?.response?.data?.message || "Failed to get user ❌");
  }
};

// ================================
// 🔐 UPDATE PASSWORD
// ================================
export const updatePasswordAPI = async ({ oldPassword, newPassword, confirmNewPassword }) => {
  try {
    const response = await API.patch(USER_ENDPOINTS.UPDATE_PASSWORD, {
      oldPassword,
      newPassword,
      confirmNewPassword,
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Update password error:", error);
    throw new Error(error?.response?.data?.message || "Failed to update password ❌");
  }
};

// ================================
// 🖼️ UPLOAD PROFILE PICTURE (معدل)
// ================================
export const uploadProfilePicAPI = async (file) => {
  try {
    if (!file) throw new Error("File is required ❌");
    
    const formData = new FormData();
    formData.append("attachments", file);

    const response = await API.patch(USER_ENDPOINTS.UPDATE_PROFILE_PIC, formData);
    
    return handleResponse(response);
  } catch (error) {
    console.error("Upload profile pic error:", error);
    throw new Error(error?.response?.data?.message || "Failed to upload profile picture ❌");
  }
};

// ================================
// 🖼️ UPLOAD COVER PICTURES
// ================================
export const uploadCoverPicsAPI = async (files) => {
  try {
    if (!files || (Array.isArray(files) && files.length === 0)) {
      throw new Error("At least one file is required ❌");
    }
    
    const formData = new FormData();
    
    if (Array.isArray(files)) {
      files.forEach((file) => formData.append("attachments", file));
      formData.append("attachments", files);
    } else {
      formData.append("attachments", files);
    }

    const response = await API.patch(USER_ENDPOINTS.UPDATE_COVER_PIC, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Upload cover pics error:", error);
    throw new Error(error?.response?.data?.message || "Failed to upload cover pictures ❌");
  }
};

// ================================
// ✏️ UPDATE PROFILE (جميع البيانات)
// ================================
export const updateProfileAPI = async (profileData) => {
  try {
    const cleanedData = {};
    
    for (const [key, value] of Object.entries(profileData)) {
      if (value !== undefined && value !== null && value !== "") {
        cleanedData[key] = value;
      }
    }
    
    if (Object.keys(cleanedData).length === 0) {
      throw new Error("No data to update");
    }
    
    const response = await API.patch(USER_ENDPOINTS.UPDATE_PROFILE, cleanedData);
    return handleResponse(response);
  } catch (error) {
    console.error("Update profile error:", error);
    throw new Error(error?.response?.data?.message || "Failed to update profile ❌");
  }
};

// ================================
// ✏️ UPDATE PERSONAL INFO (الاسم فقط)
// ================================
export const updatePersonalInfoAPI = async ({ firstName, lastName }) => {
  try {
    const response = await API.patch(USER_ENDPOINTS.UPDATE_PERSONAL_INFO, { firstName, lastName });
    return handleResponse(response);
  } catch (error) {
    console.error("Update personal info error:", error);
    throw new Error(error?.response?.data?.message || "Failed to update info ❌");
  }
};

// ================================
// 💎 UPGRADE/DOWNGRADE PLAN
// ================================
export const upgradePlanAPI = async ({ plan, userId }) => {
  try {
    if (!plan) throw new Error("Plan is required ❌");
    
    const targetUserId = userId || getUserIdFromToken();
    
    if (!targetUserId) {
      throw new Error("User ID is required");
    }
    
    const response = await API.patch(`${USER_ENDPOINTS.UPGRADE_PLAN}/${targetUserId}`, { plan });
    return response?.data;
  } catch (error) {
    console.error("Upgrade plan error:", error);
    throw new Error(error?.response?.data?.message || "Failed to upgrade plan ❌");
  }
};

// ================================
// 💳 CREATE STRIPE CHECKOUT SESSION
// ================================
export const createCheckoutSessionAPI = async ({ plan, billingPeriod = "monthly" }) => {
  try {
    if (!plan) throw new Error("Plan is required ❌");
    
    const response = await API.post(USER_ENDPOINTS.CREATE_CHECKOUT, { plan, billingPeriod });
    return response?.data;
  } catch (error) {
    console.error("Create checkout session error:", error);
    throw new Error(error?.response?.data?.message || "Failed to create checkout session ❌");
  }
};

// ================================
// 💵 CREATE MANUAL PAYMENT
// ================================
export const createManualPaymentAPI = async ({ plan, method, screenshot }) => {
  try {
    if (!plan) throw new Error("Plan is required ❌");
    if (!method) throw new Error("Payment method is required ❌");
    if (!screenshot) throw new Error("Screenshot is required ❌");
    
    const formData = new FormData();
    formData.append("plan", plan);
    formData.append("method", method);
    formData.append("screenshot", screenshot);

    const response = await API.post(USER_ENDPOINTS.MANUAL_PAYMENT, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Create manual payment error:", error);
    throw new Error(error?.response?.data?.message || "Failed to submit manual payment ❌");
  }
};

// ================================
// 🎬 WATCH AD TO EARN COINS
// ================================
export const watchAdAPI = async () => {
  try {
    const response = await API.post(USER_ENDPOINTS.WATCH_AD);
    return {
      success: true,
      coins: response?.data?.data?.coins || response?.data?.coins || 0,
      dailyAdWatched: response?.data?.data?.dailyAdWatched || 0,
      message: response?.data?.message || "You earned 5 coins! 🎉",
    };
  } catch (error) {
    console.error("Watch ad error:", error);
    throw new Error(error?.response?.data?.message || "Failed to earn coins ❌");
  }
};

// ================================
// 📊 GET USER COINS & AD STATUS
// ================================
export const getUserCoinsStatusAPI = async () => {
  try {
    const userData = await getProfileAPI();
    return {
      coins: userData?.coins || 0,
      dailyAdWatched: userData?.dailyAdWatched || 0,
      lastAdWatchDate: userData?.lastAdWatchDate || null,
    };
  } catch (error) {
    console.error("Get coins status error:", error);
    return { coins: 0, dailyAdWatched: 0, lastAdWatchDate: null };
  }
};

// ================================
// 🧪 HELPER FUNCTIONS
// ================================
export const getPlanDetails = (plan) => {
  const plans = {
    free: {
      name: "Free",
      price: 0,
      monthlyPrice: 0,
      yearlyPrice: 0,
      coins: 0,
      features: [
        "Receive unlimited messages",
        "Anonymous replies",
        "Basic support",
      ],
    },
    pro: {
      name: "Pro",
      price: 2.99,
      monthlyPrice: 2.99,
      yearlyPrice: 28.99,
      coins: 100,
      revealCost: 5,
      revealLimit: "50/month",
      features: [
        "Everything in Free",
        "Reveal sender (50/month)",
        "Priority email support",
        "Message analytics",
        "100 coins per month",
      ],
    },
    premium: {
      name: "Premium",
      price: 5.99,
      monthlyPrice: 5.99,
      yearlyPrice: 59.99,
      coins: 300,
      revealCost: 5,
      revealLimit: "Unlimited",
      features: [
        "Everything in Pro",
        "Unlimited reveal sender",
        "24/7 Priority support",
        "Remove all ads",
        "Advanced analytics",
        "Custom branding",
        "300 coins per month",
      ],
    },
  };
  return plans[plan] || plans.free;
};

export const canRevealSender = (userPlan, userCoins = 0) => {
  const REVEAL_COST = 5;
  if (userPlan === "premium") return true;
  if (userPlan === "pro" && userCoins >= REVEAL_COST) return true;
  return false;
};

export const getRevealCost = () => {
  return 5;
};

export const getRevealMessage = (userPlan, userCoins = 0) => {
  const REVEAL_COST = 5;
  
  if (userPlan === "premium") {
    return "Reveal sender (Unlimited)";
  }
  if (userPlan === "pro") {
    if (userCoins >= REVEAL_COST) {
      return `Reveal sender (${REVEAL_COST} coins)`;
    }
    return `Not enough coins! Need ${REVEAL_COST - userCoins} more coins`;
  }
  return "Upgrade to Pro or Premium to reveal sender";
};

export const formatPrice = (price, currency = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

export const getAnnualSavings = (plan) => {
  const planDetails = getPlanDetails(plan);
  if (planDetails.monthlyPrice && planDetails.yearlyPrice) {
    const monthlyTotal = planDetails.monthlyPrice * 12;
    const savings = monthlyTotal - planDetails.yearlyPrice;
    return Math.round(savings * 100) / 100;
  }
  return 0;
};

export const getCoinsNeededForReveal = (userCoins = 0) => {
  const REVEAL_COST = 5;
  const needed = REVEAL_COST - userCoins;
  return needed > 0 ? needed : 0;
};

export const hasEnoughCoins = (userCoins = 0) => {
  const REVEAL_COST = 5;
  return userCoins >= REVEAL_COST;
};

export const getPlanPrice = (plan, billingPeriod = "monthly") => {
  const planDetails = getPlanDetails(plan);
  if (billingPeriod === "yearly") {
    return planDetails.yearlyPrice || planDetails.price * 12;
  }
  return planDetails.monthlyPrice || planDetails.price;
};

export default API;