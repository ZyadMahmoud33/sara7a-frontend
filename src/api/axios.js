// frontend/src/api/axios.js
import axios from "axios";

// ================================
// 🌐 CONFIG
// ================================
// ✅ استخدام متغير البيئة أولاً، ثم localhost كـ fallback
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const API_BASE_URL = `${BASE_URL}/api`;

// ✅ منع console.log في الإنتاج
const isDev = import.meta.env.DEV;
const log = (...args) => {
  if (isDev) console.log(...args);
};

const ENDPOINTS = {
  REFRESH: "/auth/refresh-token",
  LOGIN: "/auth/login",
  LOGOUT: "/auth/logout",
};

// ================================
// 🔐 TOKEN HELPERS
// ================================
const getAccessToken = () => localStorage.getItem("accessToken");
const getRefreshToken = () => localStorage.getItem("refreshToken");
const getUserRole = () => localStorage.getItem("role");

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
  localStorage.removeItem("userId");
  localStorage.removeItem("redirectAfterLogin");

  if (!window.location.pathname.includes("/login") && 
      !window.location.pathname.includes("/register") &&
      !window.location.pathname.includes("/forget-password") &&
      !window.location.pathname.includes("/reset-password")) {
    window.location.href = "/login";
  }
};

// ================================
// 🔒 API INSTANCE
// ================================
const API = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ================================
// 📤 REQUEST INTERCEPTOR
// ================================
API.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    const role = getUserRole();

    if (token && token !== "null" && token !== "undefined") {
      const prefix = role === "0" ? "Admin" : "Bearer";
      config.headers.Authorization = `${prefix} ${token}`;
      log(`🔑 Auth header: ${prefix} ${token.substring(0, 20)}...`);
    }

    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ================================
// 🔁 REFRESH CONTROL
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
  const role = getUserRole();
  
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const prefix = role === "0" ? "Admin" : "Bearer";

  const response = await axios.post(
    `${API_BASE_URL}${ENDPOINTS.REFRESH}`,
    {},
    { 
      headers: {
        Authorization: `${prefix} ${refreshToken}`
      },
      withCredentials: true 
    }
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

  return newAccessToken;
};

// ================================
// 📥 RESPONSE INTERCEPTOR
// ================================
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!error.response || !originalRequest) {
      return Promise.reject(error);
    }

    const status = error.response.status;

    if (originalRequest.url?.includes(ENDPOINTS.REFRESH)) {
      clearAuth();
      return Promise.reject(error);
    }

    if (status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            const role = getUserRole();
            const prefix = role === "0" ? "Admin" : "Bearer";
            originalRequest.headers.Authorization = `${prefix} ${token}`;
            return API(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        processQueue(null, newToken);
        const role = getUserRole();
        const prefix = role === "0" ? "Admin" : "Bearer";
        originalRequest.headers.Authorization = `${prefix} ${newToken}`;
        return API(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuth();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (status === 403) {
      log("⛔ Access forbidden:", error.response?.data?.message);
    }

    if (status === 429) {
      log("🚫 Rate limit exceeded");
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
      await API.post(ENDPOINTS.LOGOUT, { refreshToken });
    }
  } catch (error) {
    log("Logout error:", error);
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

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

export const getCurrentUserRole = () => {
  const role = localStorage.getItem("role");
  return role !== null ? parseInt(role) : null;
};

export const isAdmin = () => {
  const role = getCurrentUserRole();
  return role === 0;
};

export default API;