// frontend/src/utils/api.js
import axios from "axios";

// ================================
// 🌐 BASE URL
// ================================
const BASE_URL =
  import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : "http://localhost:3000/api";

// ================================
// 🔓 PUBLIC API (no interceptors)
// ================================
export const PUBLIC_API = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// ================================
// 🔒 PRIVATE API (with interceptors)
// ================================
const PRIVATE_API = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// ================================
// 🔑 TOKEN HELPERS
// ================================
const getAccessToken = () => localStorage.getItem("accessToken");
const getRefreshToken = () => localStorage.getItem("refreshToken");

const setAccessToken = (token) => {
  if (token) {
    localStorage.setItem("accessToken", token);
    console.log("🔐 Access token saved to localStorage");
  }
};

const setRefreshToken = (token) => {
  if (token) {
    localStorage.setItem("refreshToken", token);
    console.log("🔄 Refresh token saved to localStorage");
  }
};

const clearAuth = () => {
  console.log("🧹 Clearing auth data from localStorage");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("role");
  localStorage.removeItem("adminLevel");
  localStorage.removeItem("email");
  localStorage.removeItem("tempRegistration");
  localStorage.removeItem("rememberedEmail");
  
  // Redirect to login if not already there
  if (!window.location.pathname.includes("/login") && 
      !window.location.pathname.includes("/register") &&
      !window.location.pathname.includes("/forget-password") &&
      !window.location.pathname.includes("/reset-password")) {
    window.location.href = "/login";
  }
};

// ================================
// 🧠 DECODE TOKEN
// ================================
const decodeToken = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
};

// ================================
// 🧠 GET ROLE FROM TOKEN
// ================================
const getRoleFromToken = (token) => {
  const decoded = decodeToken(token);
  return decoded?.role ?? 1;
};

// ================================
// 📤 REQUEST INTERCEPTOR
// ================================
PRIVATE_API.interceptors.request.use(
  (config) => {
    const token = getAccessToken();

    console.log(`📤 Request: ${config.method?.toUpperCase()} ${config.url}`);
    console.log(`🔑 Token exists: ${!!token}`);

    if (token && token !== "null" && token !== "undefined") {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`✅ Authorization header set: Bearer ${token.substring(0, 30)}...`);
    } else {
      console.warn("⚠️ No token available for request");
    }

    // Don't set Content-Type for FormData (let browser set it with boundary)
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ================================
// 🔁 REFRESH QUEUE
// ================================
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// ================================
// 🔁 REFRESH FUNCTION
// ================================
const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  
  console.log("🔄 Attempting to refresh access token...");
  
  if (!refreshToken) {
    console.error("❌ No refresh token available");
    throw new Error("No refresh token available");
  }

  const response = await PUBLIC_API.post(
    "/auth/refresh-token",
    {},
    {
      headers: {
        Authorization: `Bearer ${refreshToken}`
      },
      withCredentials: true,
    }
  );

  const newAccessToken = response?.data?.accessToken;
  const newRefreshToken = response?.data?.refreshToken;

  if (!newAccessToken) {
    console.error("❌ Invalid refresh response - no access token");
    throw new Error("Invalid refresh response");
  }

  console.log("✅ Access token refreshed successfully");
  setAccessToken(newAccessToken);
  if (newRefreshToken) {
    setRefreshToken(newRefreshToken);
  }

  const newRole = getRoleFromToken(newAccessToken);
  localStorage.setItem("role", newRole);

  return newAccessToken;
};

// ================================
// 📥 RESPONSE INTERCEPTOR
// ================================
PRIVATE_API.interceptors.response.use(
  (response) => {
    console.log(`📥 Response: ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (!error.response) {
      console.error("❌ Network error");
      return Promise.reject(error);
    }

    const status = error.response.status;
    const url = originalRequest.url;

    console.log(`❌ Response error: ${status} - ${url}`);

    // ❌ Refresh token failed - force logout
    if (url?.includes("/auth/refresh-token")) {
      console.error("❌ Refresh token failed, clearing auth");
      clearAuth();
      return Promise.reject(error);
    }

    // =========================
    // 🔁 HANDLE 401 (Unauthorized)
    // =========================
    if (status === 401 && !originalRequest._retry) {
      console.log("🔁 401 Unauthorized, attempting to refresh token...");
      
      if (isRefreshing) {
        console.log("⏳ Refresh already in progress, queueing request");
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return PRIVATE_API(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        console.log("✅ Token refreshed, retrying original request");
        return PRIVATE_API(originalRequest);
      } catch (refreshError) {
        console.error("❌ Token refresh failed");
        processQueue(refreshError, null);
        clearAuth();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // =========================
    // 🚫 403 (Forbidden)
    // =========================
    if (status === 403) {
      console.warn("⛔ Forbidden access, clearing auth");
      clearAuth();
      return Promise.reject(error);
    }

    // =========================
    // 🚫 429 (Too Many Requests)
    // =========================
    if (status === 429) {
      console.warn("🚫 Too many requests, retrying after delay...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return PRIVATE_API(originalRequest);
    }

    return Promise.reject(error);
  }
);

// ================================
// 🚪 LOGOUT FUNCTION
// ================================
export const logoutUser = async () => {
  try {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      console.log("🚪 Logging out...");
      await PRIVATE_API.post("/auth/logout", { refreshToken });
    }
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    clearAuth();
  }
};

// ================================
// 🧪 HELPER FUNCTIONS
// ================================
export const isAuthenticated = () => {
  const token = getAccessToken();
  if (!token) return false;

  const decoded = decodeToken(token);
  if (!decoded) return false;

  return decoded.exp * 1000 > Date.now();
};

export const getCurrentUserRole = () => {
  const role = localStorage.getItem("role");
  return role !== null ? parseInt(role) : 1;
};

export const isAdmin = () => {
  return getCurrentUserRole() === 0;
};

export const getCurrentUserId = () => {
  const token = getAccessToken();
  if (!token) return null;
  
  const decoded = decodeToken(token);
  return decoded?.id || decoded?.userId || null;
};

// ================================
// 🔥 EXPORT (default is PRIVATE_API)
// ================================
export default PRIVATE_API;