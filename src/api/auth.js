// frontend/src/api/auth.js
import API from "./axios.js";

// ================================
// 📌 ENDPOINTS (متوافقة مع الباك)
// ================================
const AUTH_ENDPOINTS = {
  LOGIN: "/auth/login",
  REGISTER: "/auth/signup",
  CONFIRM_EMAIL: "/auth/confirm-email",
  RESEND_OTP: "/auth/resend-otp",
  FORGET_PASSWORD: "/auth/forget-password",
  RESET_PASSWORD: "/auth/reset-password",
  LOGOUT: "/auth/logout",
  REFRESH: "/auth/refresh-token",
};

// ================================
// 🔐 AUTH APIs
// ================================

// 📝 REGISTER
export const registerAPI = async (userData) => {
  const response = await API.post(AUTH_ENDPOINTS.REGISTER, userData);
  
  if (response.data?.user?.email) {
    localStorage.setItem("email", response.data.user.email);
  }
  if (response.data?.email) {
    localStorage.setItem("email", response.data.email);
  }
  
  return response.data;
};

// 🔐 LOGIN (معدل)
export const loginAPI = async (credentials) => {
  console.log("🔐 Sending login request with:", credentials);

  const response = await API.post(AUTH_ENDPOINTS.LOGIN, credentials);

  console.log("✅ Login response status:", response.status);
  console.log("📦 Login response data:", response.data);

  const { accessToken, refreshToken, user } = response.data?.data || {};

  if (accessToken) {
    localStorage.setItem("accessToken", accessToken);
    console.log("🔑 Access token saved");
  }
  if (refreshToken) {
    localStorage.setItem("refreshToken", refreshToken);
    console.log("🔄 Refresh token saved");
  }

  // ✅ حفظ userId
  if (user?._id) {
    localStorage.setItem("userId", user._id);
    console.log("👤 User ID saved:", user._id);
  } else if (user?.id) {
    localStorage.setItem("userId", user.id);
    console.log("👤 User ID saved:", user.id);
  }

  if (accessToken) {
    try {
      const payload = JSON.parse(atob(accessToken.split(".")[1]));
      if (payload.role !== undefined) {
        localStorage.setItem("role", payload.role);
        console.log("👤 Role saved:", payload.role);
      }
      // ✅ حفظ userId من التوكن إذا لم يكن موجود في user
      if (!user?._id && !user?.id && payload.userId) {
        localStorage.setItem("userId", payload.userId);
        console.log("👤 User ID from token saved:", payload.userId);
      }
    } catch (e) {
      console.error("Failed to decode token:", e);
    }
  }

  return response.data;
};

// 🚪 LOGOUT (معدل)
export const logoutAPI = async () => {
  try {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      await API.post(AUTH_ENDPOINTS.LOGOUT, { refreshToken });
    }
  } catch (error) {
    console.error("Logout API error:", error);
  } finally {
    // ✅ مسح جميع البيانات من localStorage
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("role");
    localStorage.removeItem("adminLevel");
    localStorage.removeItem("email");
    localStorage.removeItem("tempRegistration");
    localStorage.removeItem("rememberedEmail");
    localStorage.removeItem("userId"); // ✅ إضافة userId
    localStorage.removeItem("redirectAfterLogin"); // ✅ إضافة redirect
    localStorage.removeItem("pendingMessage"); // ✅ إضافة رسالة معلقة
    localStorage.removeItem("pendingReceiverId"); // ✅ إضافة مستقبل معلق
  }
};

// 🔄 REFRESH TOKEN
export const refreshTokenAPI = async () => {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }
  
  const response = await API.post(AUTH_ENDPOINTS.REFRESH, {});
  
  if (response.data?.accessToken) {
    localStorage.setItem("accessToken", response.data.accessToken);
  }
  
  return response.data;
};

// ✅ CONFIRM EMAIL
export const confirmEmailAPI = async ({ email, otp }) => {
  const response = await API.post(AUTH_ENDPOINTS.CONFIRM_EMAIL, { email, otp });
  
  if (response.data?.success) {
    localStorage.removeItem("tempRegistration");
  }
  
  return response.data;
};

// 🔁 RESEND OTP (PATCH method)
export const resendOtpAPI = async ({ email }) => {
  const response = await API.patch(AUTH_ENDPOINTS.RESEND_OTP, { email });
  return response.data;
};

// 🔐 FORGET PASSWORD (PATCH method)
export const forgetPasswordAPI = async ({ email }) => {
  const response = await API.patch(AUTH_ENDPOINTS.FORGET_PASSWORD, { email });
  return response.data;
};

// 🔑 RESET PASSWORD (PATCH method)
export const resetPasswordAPI = async ({ email, otp, newPassword }) => {
  const response = await API.patch(AUTH_ENDPOINTS.RESET_PASSWORD, { 
    email, 
    otp, 
    newPassword 
  });
  return response.data;
};

// ================================
// 🧪 HELPER FUNCTIONS (معدلة)
// ================================

export const isAuthenticated = () => {
  const token = localStorage.getItem("accessToken");
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const isValid = payload.exp * 1000 > Date.now();
    
    if (!isValid) {
      clearAuthData();
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
};

export const getUserRole = () => {
  const role = localStorage.getItem("role");
  return role !== null ? parseInt(role) : 1;
};

export const isAdmin = () => {
  return getUserRole() === 0;
};

export const isSuperAdmin = () => {
  const adminLevel = localStorage.getItem("adminLevel");
  return adminLevel === "0";
};

export const getUserIdFromToken = () => {
  const token = localStorage.getItem("accessToken");
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.id || payload.userId || payload._id || null;
  } catch {
    return null;
  }
};

export const getUserId = () => {
  // ✅ جلب userId من localStorage مباشرة
  const userId = localStorage.getItem("userId");
  if (userId) return userId;
  return getUserIdFromToken();
};

export const getUserEmailFromToken = () => {
  const token = localStorage.getItem("accessToken");
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.email || null;
  } catch {
    return null;
  }
};

export const clearAuthData = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("role");
  localStorage.removeItem("adminLevel");
  localStorage.removeItem("email");
  localStorage.removeItem("tempRegistration");
  localStorage.removeItem("rememberedEmail");
  localStorage.removeItem("userId"); // ✅ إضافة
  localStorage.removeItem("redirectAfterLogin"); // ✅ إضافة
  localStorage.removeItem("pendingMessage"); // ✅ إضافة
  localStorage.removeItem("pendingReceiverId"); // ✅ إضافة
};

// ✅ دالة لحفظ redirect بعد تسجيل الدخول
export const setRedirectAfterLogin = (url) => {
  if (url && !url.includes("/login") && !url.includes("/register")) {
    localStorage.setItem("redirectAfterLogin", url);
  }
};

// ✅ دالة لجلب redirect بعد تسجيل الدخول
export const getRedirectAfterLogin = () => {
  return localStorage.getItem("redirectAfterLogin");
};

// ✅ دالة لمسح redirect بعد تسجيل الدخول
export const clearRedirectAfterLogin = () => {
  localStorage.removeItem("redirectAfterLogin");
};

export const getRedirectPath = () => {
  // ✅ التحقق من وجود redirect أولاً
  const redirect = getRedirectAfterLogin();
  if (redirect && !redirect.includes("/login") && !redirect.includes("/register")) {
    clearRedirectAfterLogin();
    return redirect;
  }
  
  const role = getUserRole();
  return role === 0 ? "/admin" : "/dashboard";
};

export const setRememberedEmail = (email) => {
  if (email) {
    localStorage.setItem("rememberedEmail", email);
  } else {
    localStorage.removeItem("rememberedEmail");
  }
};

export const getRememberedEmail = () => {
  return localStorage.getItem("rememberedEmail");
};

// ✅ دالة لحفظ رسالة معلقة
export const setPendingMessage = (receiverId, content) => {
  if (receiverId && content) {
    localStorage.setItem("pendingMessage", content);
    localStorage.setItem("pendingReceiverId", receiverId);
  }
};

// ✅ دالة لجلب رسالة معلقة
export const getPendingMessage = (receiverId) => {
  const storedMessage = localStorage.getItem("pendingMessage");
  const storedReceiverId = localStorage.getItem("pendingReceiverId");
  
  if (storedMessage && storedReceiverId === receiverId) {
    return storedMessage;
  }
  return null;
};

// ✅ دالة لمسح رسالة معلقة
export const clearPendingMessage = () => {
  localStorage.removeItem("pendingMessage");
  localStorage.removeItem("pendingReceiverId");
};