// frontend/src/api/admin.js
import API from "./axios.js";

// ================================
// 📌 ENDPOINTS (متوافقة مع الباك)
// ================================
const ADMIN_ENDPOINTS = {
  // 👤 Admin Profile
  GET_PROFILE: "/admin/profile",
  
  // 👥 User Management
  GET_USERS: "/admin/users",
  FREEZE_USER: (userId) => `/admin/${userId}/freeze-account`,
  RESTORE_USER: (userId) => `/admin/${userId}/restore-account`,
  HARD_DELETE_USER: (userId) => `/admin/${userId}/hard-delete`,
  CHANGE_ROLE: (userId) => `/admin/${userId}/change-role`,
  
  // 💳 Payment Management
  GET_PAYMENTS: "/admin/payments",
  APPROVE_PAYMENT: (paymentId) => `/admin/payments/${paymentId}/approve`,
  REJECT_PAYMENT: (paymentId) => `/admin/payments/${paymentId}/reject`,
  
  // 📊 Stats
  GET_STATS: "/admin/stats",
  
  // 📜 Logs
  GET_LOGS: "/admin/logs",
  GET_LOGS_STATS: "/admin/logs/stats",
  GET_LOGS_BY_ADMIN: (adminId) => `/admin/logs/admin/${adminId}`,
  GET_LOGS_BY_ACTION: (action) => `/admin/logs/action/${action}`,
  GET_LOGS_BY_DATE_RANGE: "/admin/logs/date-range",
  EXPORT_LOGS: "/admin/logs/export",
  DELETE_OLD_LOGS: "/admin/logs",
  GET_LOG_BY_ID: (logId) => `/admin/logs/${logId}`,
  
  // 🔐 Security
  CHANGE_PASSWORD: "/admin/change-password",
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

const handleResponse = (response) => {
  return {
    success: true,
    message: response?.data?.message || "Success",
    data: response?.data?.data || response?.data,
    pagination: response?.data?.pagination || null,
  };
};

const handleError = (error) => {
  const status = error?.response?.status;
  const message = error?.response?.data?.message || error?.message || "Something went wrong ❌";

  if (status === 401) {
    localStorage.clear();
    window.location.href = "/login";
    return { success: false, message: "Session expired. Please login again." };
  }

  if (status === 403) {
    return { success: false, message: "You don't have permission to perform this action ❌" };
  }

  if (status === 429) {
    return { success: false, message: "Too many requests. Please try again later ❌" };
  }

  return { success: false, message };
};

// ================================
// 👤 GET ADMIN PROFILE
// ================================
export const getAdminProfileAPI = async () => {
  try {
    const response = await API.get(ADMIN_ENDPOINTS.GET_PROFILE);
    return handleResponse(response);
  } catch (error) {
    return handleError(error);
  }
};

// ================================
// 👥 GET ALL USERS
// ================================
export const getAllUsersAPI = async (params = {}) => {
  try {
    const { page = 1, limit = 20, search = "" } = params;
    
    const queryParams = new URLSearchParams();
    queryParams.append("page", page);
    queryParams.append("limit", limit);
    if (search) queryParams.append("search", search);
    
    const response = await API.get(`${ADMIN_ENDPOINTS.GET_USERS}?${queryParams.toString()}`);
    
    return {
      success: true,
      users: response?.data?.data?.users || response?.data?.users || [],
      pagination: response?.data?.pagination || null,
    };
  } catch (error) {
    return handleError(error);
  }
};

// ================================
// ❄️ FREEZE USER ACCOUNT
// ================================
export const freezeUserAPI = async (userId) => {
  try {
    validateId(userId, "User ID");
    
    const response = await API.delete(ADMIN_ENDPOINTS.FREEZE_USER(userId));
    return handleResponse(response);
  } catch (error) {
    return handleError(error);
  }
};

// ================================
// 🔄 RESTORE USER ACCOUNT
// ================================
export const restoreUserAPI = async (userId) => {
  try {
    validateId(userId, "User ID");
    
    const response = await API.patch(ADMIN_ENDPOINTS.RESTORE_USER(userId));
    return handleResponse(response);
  } catch (error) {
    return handleError(error);
  }
};

// ================================
// ❌ HARD DELETE USER (Permanent)
// ================================
export const hardDeleteUserAPI = async (userId) => {
  try {
    validateId(userId, "User ID");
    
    const response = await API.delete(ADMIN_ENDPOINTS.HARD_DELETE_USER(userId));
    return handleResponse(response);
  } catch (error) {
    return handleError(error);
  }
};

// ================================
// 👑 CHANGE USER ROLE
// ================================
export const changeUserRoleAPI = async (userId, role) => {
  try {
    validateId(userId, "User ID");
    
    if (role === undefined || (role !== 0 && role !== 1)) {
      throw new Error("Role must be 0 (Admin) or 1 (User) ❌");
    }
    
    const response = await API.patch(ADMIN_ENDPOINTS.CHANGE_ROLE(userId), { role });
    return handleResponse(response);
  } catch (error) {
    return handleError(error);
  }
};

// ================================
// 💳 GET ALL PAYMENTS (With filters)
// ================================
export const getAllPaymentsAPI = async (params = {}) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = "",
      search = "",
      startDate = "",
      endDate = "",
    } = params;
    
    const queryParams = new URLSearchParams();
    queryParams.append("page", page);
    queryParams.append("limit", limit);
    if (status) queryParams.append("status", status);
    if (search) queryParams.append("search", search);
    if (startDate) queryParams.append("startDate", startDate);
    if (endDate) queryParams.append("endDate", endDate);
    
    const response = await API.get(`${ADMIN_ENDPOINTS.GET_PAYMENTS}?${queryParams.toString()}`);
    
    return {
      success: true,
      payments: response?.data?.data || response?.data?.payments || [],
      pagination: response?.data?.pagination || null,
    };
  } catch (error) {
    return handleError(error);
  }
};

// ================================
// 💳 GET PENDING PAYMENTS ONLY
// ================================
export const getPendingPaymentsAPI = async (params = {}) => {
  return getAllPaymentsAPI({ ...params, status: "pending" });
};

// ================================
// ✅ APPROVE PAYMENT
// ================================
export const approvePaymentAPI = async (paymentId) => {
  try {
    validateId(paymentId, "Payment ID");
    
    const response = await API.patch(ADMIN_ENDPOINTS.APPROVE_PAYMENT(paymentId));
    return handleResponse(response);
  } catch (error) {
    return handleError(error);
  }
};

// ================================
// ❌ REJECT PAYMENT
// ================================
export const rejectPaymentAPI = async (paymentId, reason = "") => {
  try {
    validateId(paymentId, "Payment ID");
    
    const response = await API.patch(ADMIN_ENDPOINTS.REJECT_PAYMENT(paymentId), { reason });
    return handleResponse(response);
  } catch (error) {
    return handleError(error);
  }
};

// ================================
// 🔐 CHANGE ADMIN PASSWORD
// ================================
export const changeAdminPasswordAPI = async ({ oldPassword, newPassword, confirmNewPassword }) => {
  try {
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      throw new Error("All password fields are required ❌");
    }
    
    if (newPassword !== confirmNewPassword) {
      throw new Error("New passwords do not match ❌");
    }
    
    if (oldPassword === newPassword) {
      throw new Error("New password must be different from old password ❌");
    }
    
    const response = await API.patch(ADMIN_ENDPOINTS.CHANGE_PASSWORD, {
      oldPassword,
      newPassword,
      confirmNewPassword,
    });
    
    return handleResponse(response);
  } catch (error) {
    return handleError(error);
  }
};

// ================================
// 📊 GET ADMIN DASHBOARD STATS
// ================================
export const getAdminStatsAPI = async () => {
  try {
    const response = await API.get(ADMIN_ENDPOINTS.GET_STATS);
    
    const statsData = response?.data?.data || response?.data || {};
    
    return {
      success: true,
      stats: {
        totalUsers: statsData.totalUsers || 0,
        totalPayments: statsData.totalPayments || 0,
        pendingPayments: statsData.pendingPayments || 0,
        approvedPayments: statsData.approvedPayments || 0,
        rejectedPayments: statsData.rejectedPayments || 0,
        totalRevenue: statsData.totalRevenue || 0,
        totalMessages: statsData.totalMessages || 0,
      },
    };
  } catch (error) {
    console.warn("Stats endpoint not available yet");
    return {
      success: false,
      stats: {
        totalUsers: 0,
        totalPayments: 0,
        pendingPayments: 0,
        approvedPayments: 0,
        rejectedPayments: 0,
        totalRevenue: 0,
        totalMessages: 0,
      },
    };
  }
};

// ================================
// 📜 ADMIN LOGS APIs
// ================================

// 📥 GET LOGS (مع فلترة وباجينيشن)
export const getAdminLogsAPI = async (params = {}) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      action = "",
      startDate = "",
      endDate = "",
    } = params;

    const queryParams = new URLSearchParams();
    queryParams.append("page", page);
    queryParams.append("limit", limit);
    if (search) queryParams.append("search", search);
    if (action) queryParams.append("action", action);
    if (startDate) queryParams.append("startDate", startDate);
    if (endDate) queryParams.append("endDate", endDate);

    const response = await API.get(`${ADMIN_ENDPOINTS.GET_LOGS}?${queryParams.toString()}`);

    return {
      logs: response?.data?.data || [],
      pagination: response?.data?.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0,
      },
    };
  } catch (error) {
    console.error("Get admin logs error:", error);
    throw new Error(error?.response?.data?.message || "Failed to fetch admin logs ❌");
  }
};

// 📥 GET LOGS BY ADMIN ID
export const getAdminLogsByAdminIdAPI = async (adminId, params = {}) => {
  try {
    const { page = 1, limit = 20, action = "" } = params;
    const queryParams = new URLSearchParams();
    queryParams.append("page", page);
    queryParams.append("limit", limit);
    if (action) queryParams.append("action", action);

    const response = await API.get(`${ADMIN_ENDPOINTS.GET_LOGS_BY_ADMIN(adminId)}?${queryParams.toString()}`);
    return {
      logs: response?.data?.data || [],
      pagination: response?.data?.pagination || {},
    };
  } catch (error) {
    console.error("Get admin logs by admin ID error:", error);
    throw new Error(error?.response?.data?.message || "Failed to fetch admin logs ❌");
  }
};

// 📥 GET LOGS BY ACTION TYPE
export const getAdminLogsByActionAPI = async (action, params = {}) => {
  try {
    const { page = 1, limit = 20, search = "" } = params;
    const queryParams = new URLSearchParams();
    queryParams.append("page", page);
    queryParams.append("limit", limit);
    if (search) queryParams.append("search", search);

    const response = await API.get(`${ADMIN_ENDPOINTS.GET_LOGS_BY_ACTION(action)}?${queryParams.toString()}`);
    return {
      logs: response?.data?.data || [],
      pagination: response?.data?.pagination || {},
    };
  } catch (error) {
    console.error("Get admin logs by action error:", error);
    throw new Error(error?.response?.data?.message || "Failed to fetch admin logs ❌");
  }
};

// 📥 GET LOGS BY DATE RANGE
export const getAdminLogsByDateRangeAPI = async (startDate, endDate, params = {}) => {
  try {
    const { page = 1, limit = 20, action = "", search = "" } = params;
    const queryParams = new URLSearchParams();
    queryParams.append("page", page);
    queryParams.append("limit", limit);
    queryParams.append("startDate", startDate);
    queryParams.append("endDate", endDate);
    if (action) queryParams.append("action", action);
    if (search) queryParams.append("search", search);

    const response = await API.get(`${ADMIN_ENDPOINTS.GET_LOGS_BY_DATE_RANGE}?${queryParams.toString()}`);
    return {
      logs: response?.data?.data || [],
      pagination: response?.data?.pagination || {},
    };
  } catch (error) {
    console.error("Get admin logs by date range error:", error);
    throw new Error(error?.response?.data?.message || "Failed to fetch admin logs ❌");
  }
};

// 📊 GET LOGS STATISTICS (محدثة)
export const getAdminLogsStatsAPI = async () => {
  try {
    const response = await API.get(ADMIN_ENDPOINTS.GET_LOGS_STATS);
    const data = response?.data?.data || response?.data || {};
    return {
      total: data.total || 0,
      byAction: data.byAction || {},
      last24Hours: data.last24Hours || 0,
      lastWeek: data.lastWeek || 0,
      lastMonth: data.lastMonth || 0,
      byAdmin: data.byAdmin || {},
    };
  } catch (error) {
    console.error("Get admin logs stats error:", error);
    return {
      total: 0,
      byAction: {},
      last24Hours: 0,
      lastWeek: 0,
      lastMonth: 0,
      byAdmin: {},
    };
  }
};

// 🗑️ DELETE OLD LOGS
export const deleteOldLogsAPI = async (days = 30) => {
  try {
    const response = await API.delete(ADMIN_ENDPOINTS.DELETE_OLD_LOGS, { params: { days } });
    return {
      deletedCount: response?.data?.deletedCount || 0,
      message: response?.data?.message || "Old logs deleted successfully",
    };
  } catch (error) {
    console.error("Delete old logs error:", error);
    throw new Error(error?.response?.data?.message || "Failed to delete old logs ❌");
  }
};

// 📤 EXPORT LOGS TO CSV
export const exportLogsToCSVAPI = async (params = {}) => {
  try {
    const { startDate = "", endDate = "", action = "", format = "csv" } = params;
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append("startDate", startDate);
    if (endDate) queryParams.append("endDate", endDate);
    if (action) queryParams.append("action", action);
    if (format) queryParams.append("format", format);

    const response = await API.get(`${ADMIN_ENDPOINTS.EXPORT_LOGS}?${queryParams.toString()}`, { 
      responseType: "blob" 
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `admin-logs-${new Date().toISOString()}.${format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    return { success: true };
  } catch (error) {
    console.error("Export logs error:", error);
    throw new Error(error?.response?.data?.message || "Failed to export logs ❌");
  }
};

// 🔍 GET SINGLE LOG BY ID
export const getLogByIdAPI = async (logId) => {
  try {
    const response = await API.get(ADMIN_ENDPOINTS.GET_LOG_BY_ID(logId));
    return response?.data?.data || null;
  } catch (error) {
    console.error("Get log by ID error:", error);
    throw new Error(error?.response?.data?.message || "Failed to fetch log details ❌");
  }
};

// ================================
// 🧪 HELPER FUNCTIONS
// ================================
export const getRoleLabel = (role) => {
  return role === 0 ? "Admin" : "User";
};

export const getPaymentStatusStyle = (status) => {
  switch (status) {
    case "approved":
      return { bg: "bg-green-500/20", text: "text-green-400", border: "border-green-500/30" };
    case "rejected":
      return { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30" };
    default:
      return { bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500/30" };
  }
};

export const getPlanLabel = (plan) => {
  const plans = { free: "Free", pro: "Pro", premium: "Premium" };
  return plans[plan] || plan || "Unknown";
};

export const formatCurrency = (amount, currency = "USD") => {
  if (!amount && amount !== 0) return "$0";
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
};

export const getValidActions = () => {
  return [
    "APPROVE_PAYMENT",
    "REJECT_PAYMENT",
    "FREEZE_USER",
    "RESTORE_USER",
    "DELETE_USER",
    "CHANGE_ROLE",
    "CHANGE_PASSWORD",
    "VIEW_PENDING_PAYMENTS",
    "VIEW_DASHBOARD",
    "VIEW_MESSAGES",
    "VIEW_SETTINGS",
    "VIEW_LOGS",
    "VIEW_USER_DETAILS",
    "REFRESH_DATA",
    "SEARCH_USERS",
    "SEARCH_PAYMENTS",
    "FILTER_PAYMENTS",
    "EXPORT_LOGS",
  ];
};

export const getActionColor = (action) => {
  const colors = {
    APPROVE_PAYMENT: "text-green-400 bg-green-500/20",
    REJECT_PAYMENT: "text-red-400 bg-red-500/20",
    FREEZE_USER: "text-yellow-400 bg-yellow-500/20",
    RESTORE_USER: "text-cyan-400 bg-cyan-500/20",
    DELETE_USER: "text-red-500 bg-red-500/20",
    CHANGE_ROLE: "text-blue-400 bg-blue-500/20",
    CHANGE_PASSWORD: "text-purple-400 bg-purple-500/20",
    VIEW_PENDING_PAYMENTS: "text-gray-400 bg-gray-500/20",
    VIEW_DASHBOARD: "text-emerald-400 bg-emerald-500/20",
    VIEW_MESSAGES: "text-teal-400 bg-teal-500/20",
    VIEW_SETTINGS: "text-gray-400 bg-gray-500/20",
    VIEW_LOGS: "text-indigo-400 bg-indigo-500/20",
    VIEW_USER_DETAILS: "text-purple-400 bg-purple-500/20",
    REFRESH_DATA: "text-blue-400 bg-blue-500/20",
    SEARCH_USERS: "text-cyan-400 bg-cyan-500/20",
    SEARCH_PAYMENTS: "text-cyan-400 bg-cyan-500/20",
    FILTER_PAYMENTS: "text-purple-400 bg-purple-500/20",
    EXPORT_LOGS: "text-green-400 bg-green-500/20",
  };
  return colors[action] || "text-gray-400 bg-gray-500/20";
};

export const getActionIcon = (action) => {
  const icons = {
    APPROVE_PAYMENT: "CheckCircle",
    REJECT_PAYMENT: "XCircle",
    FREEZE_USER: "Ban",
    RESTORE_USER: "RefreshCw",
    DELETE_USER: "Trash2",
    CHANGE_ROLE: "Shield",
    CHANGE_PASSWORD: "Key",
    VIEW_PENDING_PAYMENTS: "Eye",
    VIEW_DASHBOARD: "TrendingUp",
    VIEW_MESSAGES: "MessageCircle",
    VIEW_SETTINGS: "Settings",
    VIEW_LOGS: "Activity",
    VIEW_USER_DETAILS: "User",
    REFRESH_DATA: "RefreshCw",
    SEARCH_USERS: "Search",
    SEARCH_PAYMENTS: "Search",
    FILTER_PAYMENTS: "Filter",
    EXPORT_LOGS: "Download",
  };
  return icons[action] || "Activity";
};

export default API;