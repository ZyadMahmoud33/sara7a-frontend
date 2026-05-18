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

// 🔐 LOGIN
export const loginAPI = async (credentials) => {
  console.log("🔐 Sending login request with:", credentials);

  const response = await API.post(AUTH_ENDPOINTS.LOGIN, credentials);

  console.log("✅ Login response status:", response.status);
  console.log("📦 Login response data:", response.data);

  const responseData = response.data?.data || response.data || {};
  
  const accessToken = responseData?.accessToken || response.data?.accessToken;
  const refreshToken = responseData?.refreshToken || response.data?.refreshToken;
  const user = responseData?.user || response.data?.user;

  console.log("🔑 Extracted accessToken:", accessToken);
  console.log("🔄 Extracted refreshToken:", refreshToken);
  console.log("👤 Extracted user:", user);

  if (accessToken) {
    localStorage.setItem("accessToken", accessToken);
    console.log("🔑 Access token saved");
  } else {
    console.warn("⚠️ No access token received!");
  }
  
  if (refreshToken) {
    localStorage.setItem("refreshToken", refreshToken);
    console.log("🔄 Refresh token saved");
  }

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

// ✅ Google Login API (يقبل access_token من @react-oauth/google)
export const googleLoginAPI = async (accessToken) => {
  try {
    const response = await API.post("/auth/google-login", { idToken: accessToken });
    
    const accessTokenRes = response.data?.accessToken || response.data?.data?.accessToken;
    const refreshTokenRes = response.data?.refreshToken || response.data?.data?.refreshToken;
    const user = response.data?.user || response.data?.data?.user;

    if (accessTokenRes) {
      localStorage.setItem("accessToken", accessTokenRes);
    }
    if (refreshTokenRes) {
      localStorage.setItem("refreshToken", refreshTokenRes);
    }
    if (user?.role !== undefined) {
      localStorage.setItem("role", user.role);
    }
    if (user?._id) {
      localStorage.setItem("userId", user._id);
    }

    return response.data;
  } catch (error) {
    console.error("Google login error:", error);
    throw error;
  }
};

// ✅ Facebook Login API
export const facebookLoginAPI = async (accessToken) => {
  try {
    const response = await API.post("/auth/facebook-login", { accessToken });
    
    const accessTokenRes = response.data?.accessToken || response.data?.data?.accessToken;
    const refreshTokenRes = response.data?.refreshToken || response.data?.data?.refreshToken;
    const user = response.data?.user || response.data?.data?.user;

    if (accessTokenRes) {
      localStorage.setItem("accessToken", accessTokenRes);
    }
    if (refreshTokenRes) {
      localStorage.setItem("refreshToken", refreshTokenRes);
    }
    if (user?.role !== undefined) {
      localStorage.setItem("role", user.role);
    }
    if (user?._id) {
      localStorage.setItem("userId", user._id);
    }

    return response.data;
  } catch (error) {
    console.error("Facebook login error:", error);
    throw error;
  }
};

// ✅ GitHub Login API
export const githubLoginAPI = async (code) => {
  try {
    const response = await API.post("/auth/github-login", { code });
    
    const accessToken = response.data?.accessToken || response.data?.data?.accessToken;
    const refreshToken = response.data?.refreshToken || response.data?.data?.refreshToken;
    const user = response.data?.user || response.data?.data?.user;

    if (accessToken) {
      localStorage.setItem("accessToken", accessToken);
    }
    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    }
    if (user?.role !== undefined) {
      localStorage.setItem("role", user.role);
    }
    if (user?._id) {
      localStorage.setItem("userId", user._id);
    }

    return response.data;
  } catch (error) {
    console.error("GitHub login error:", error);
    throw error;
  }
};

// ✅ Apple Login API
export const appleLoginAPI = async (authorizationCode) => {
  try {
    const response = await API.post("/auth/apple-login", { authorizationCode });
    
    const accessToken = response.data?.accessToken || response.data?.data?.accessToken;
    const refreshToken = response.data?.refreshToken || response.data?.data?.refreshToken;
    const user = response.data?.user || response.data?.data?.user;

    if (accessToken) {
      localStorage.setItem("accessToken", accessToken);
    }
    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    }
    if (user?.role !== undefined) {
      localStorage.setItem("role", user.role);
    }
    if (user?._id) {
      localStorage.setItem("userId", user._id);
    }

    return response.data;
  } catch (error) {
    console.error("Apple login error:", error);
    throw error;
  }
};

// ✅ X (Twitter) Login API
export const twitterLoginAPI = async (oauthToken, oauthVerifier) => {
  try {
    const response = await API.post("/auth/twitter-login", { 
      oauthToken, 
      oauthVerifier 
    });
    
    const accessToken = response.data?.accessToken || response.data?.data?.accessToken;
    const refreshToken = response.data?.refreshToken || response.data?.data?.refreshToken;
    const user = response.data?.user || response.data?.data?.user;

    if (accessToken) {
      localStorage.setItem("accessToken", accessToken);
    }
    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    }
    if (user?.role !== undefined) {
      localStorage.setItem("role", user.role);
    }
    if (user?._id) {
      localStorage.setItem("userId", user._id);
    }

    return response.data;
  } catch (error) {
    console.error("X (Twitter) login error:", error);
    throw error;
  }
};

// 🚪 LOGOUT
export const logoutAPI = async () => {
  try {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      await API.post(AUTH_ENDPOINTS.LOGOUT, { refreshToken });
    }
  } catch (error) {
    console.error("Logout API error:", error);
  } finally {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("role");
    localStorage.removeItem("adminLevel");
    localStorage.removeItem("email");
    localStorage.removeItem("tempRegistration");
    localStorage.removeItem("rememberedEmail");
    localStorage.removeItem("userId");
    localStorage.removeItem("redirectAfterLogin");
    localStorage.removeItem("pendingMessage");
    localStorage.removeItem("pendingReceiverId");
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
  return response.data;
};

// 🔁 RESEND OTP
export const resendOtpAPI = async ({ email }) => {
  const response = await API.patch(AUTH_ENDPOINTS.RESEND_OTP, { email });
  return response.data;
};

// 🔐 FORGET PASSWORD
export const forgetPasswordAPI = async ({ email }) => {
  const response = await API.patch(AUTH_ENDPOINTS.FORGET_PASSWORD, { email });
  return response.data;
};

// 🔑 RESET PASSWORD
export const resetPasswordAPI = async ({ email, otp, newPassword }) => {
  const response = await API.patch(AUTH_ENDPOINTS.RESET_PASSWORD, { 
    email, 
    otp, 
    newPassword 
  });
  return response.data;
};

// ================================
// 🧪 HELPER FUNCTIONS
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
  localStorage.removeItem("userId");
  localStorage.removeItem("redirectAfterLogin");
  localStorage.removeItem("pendingMessage");
  localStorage.removeItem("pendingReceiverId");
};

// ✅ Redirect Functions
export const setRedirectAfterLogin = (url) => {
  if (url && !url.includes("/login") && !url.includes("/register")) {
    localStorage.setItem("redirectAfterLogin", url);
  }
};

export const getRedirectAfterLogin = () => {
  return localStorage.getItem("redirectAfterLogin");
};

export const clearRedirectAfterLogin = () => {
  localStorage.removeItem("redirectAfterLogin");
};

export const getRedirectPath = () => {
  const redirect = getRedirectAfterLogin();
  if (redirect && !redirect.includes("/login") && !redirect.includes("/register")) {
    clearRedirectAfterLogin();
    return redirect;
  }
  
  const role = getUserRole();
  return role === 0 ? "/admin" : "/dashboard";
};

// ✅ Remember Email
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

// ✅ Pending Message
export const setPendingMessage = (receiverId, content) => {
  if (receiverId && content) {
    localStorage.setItem("pendingMessage", content);
    localStorage.setItem("pendingReceiverId", receiverId);
  }
};

export const getPendingMessage = (receiverId) => {
  const storedMessage = localStorage.getItem("pendingMessage");
  const storedReceiverId = localStorage.getItem("pendingReceiverId");
  
  if (storedMessage && storedReceiverId === receiverId) {
    return storedMessage;
  }
  return null;
};

export const clearPendingMessage = () => {
  localStorage.removeItem("pendingMessage");
  localStorage.removeItem("pendingReceiverId");
};