// frontend/src/api/axios.js
import axios from "axios";

// ================================
// 🌐 BASE URL
// ================================
const BASE_URL =
  import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : "http://localhost:3000/api";

// ================================
// 🔓 PUBLIC API (للاستخدامات العامة)
// ================================
export const PUBLIC_API = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// ================================
// 🔒 PRIVATE API (مع interceptor)
// ================================
const API = axios.create({
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
  }
};

const setRefreshToken = (token) => {
  if (token) {
    localStorage.setItem("refreshToken", token);
  }
};

const clearAuth = () => {
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
  return decoded?.role ?? 1; // Default to User (1)
};

// ================================
// 🧠 GET USER ID FROM TOKEN
// ================================
const getUserIdFromToken = (token) => {
  const decoded = decodeToken(token);
  return decoded?.id || decoded?.userId || null;
};

// ================================
// 📤 REQUEST INTERCEPTOR
// ================================
API.interceptors.request.use(
  (config) => {
    const token = getAccessToken();

    if (token && token !== "null" && token !== "undefined") {
      const role = getRoleFromToken(token);
      // 🔥 Important: Backend expects "Bearer" prefix for all
      config.headers.Authorization = `Bearer ${token}`;
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
  
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  // 🔥 Refresh endpoint: POST /auth/refresh
  const response = await PUBLIC_API.post(
    "/auth/refresh",
    { refreshToken },
    { withCredentials: true }
  );

  const newAccessToken = response?.data?.accessToken;
  const newRefreshToken = response?.data?.refreshToken;

  if (!newAccessToken) {
    throw new Error("Invalid refresh response");
  }

  setAccessToken(newAccessToken);
  if (newRefreshToken) {
    setRefreshToken(newRefreshToken);
  }

  // Update role in localStorage
  const newRole = getRoleFromToken(newAccessToken);
  localStorage.setItem("role", newRole);

  return newAccessToken;
};

// ================================
// 📥 RESPONSE INTERCEPTOR
// ================================
API.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (!error.response) {
      console.error("❌ Network error");
      return Promise.reject(error);
    }

    const status = error.response.status;

    // ❌ Refresh token failed - force logout
    if (originalRequest.url?.includes("/auth/refresh")) {
      clearAuth();
      return Promise.reject(error);
    }

    // =========================
    // 🔁 HANDLE 401 (Unauthorized)
    // =========================
    if (status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue the request while refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return API(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return API(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuth();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // =========================
    // 🚫 403 (Forbidden - insufficient permissions)
    // =========================
    if (status === 403) {
      console.warn("⛔ Forbidden access");
      // Optionally redirect to home or show error
    }

    // =========================
    // 🚫 429 (Too Many Requests)
    // =========================
    if (status === 429) {
      console.warn("🚫 Too many requests, retrying after delay...");
      // Wait 2 seconds and retry
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return API(originalRequest);
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
      await API.post("/auth/logout", { refreshToken });
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
  return getCurrentUserRole() === 0; // RoleEnum.Admin = 0
};

export const getCurrentUserId = () => {
  const token = getAccessToken();
  if (!token) return null;
  return getUserIdFromToken(token);
};

export default API;