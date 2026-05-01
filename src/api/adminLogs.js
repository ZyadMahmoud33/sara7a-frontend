// frontend/src/api/adminLogs.js
import API from "./axios.js";

// ================================
// 📌 ENDPOINT
// ================================
const ADMIN_LOGS_ENDPOINT = "/admin/logs";

// ================================
// 📥 GET LOGS (مع فلترة وباجينيشن)
// ================================
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

    const response = await API.get(`${ADMIN_LOGS_ENDPOINT}?${queryParams.toString()}`);

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

// ================================
// 📥 GET LOGS BY ADMIN ID
// ================================
export const getAdminLogsByAdminIdAPI = async (adminId, params = {}) => {
  try {
    const { page = 1, limit = 20, action = "" } = params;
    const queryParams = new URLSearchParams();
    queryParams.append("page", page);
    queryParams.append("limit", limit);
    if (action) queryParams.append("action", action);

    const response = await API.get(`${ADMIN_LOGS_ENDPOINT}/admin/${adminId}?${queryParams.toString()}`);
    return {
      logs: response?.data?.data || [],
      pagination: response?.data?.pagination || {},
    };
  } catch (error) {
    console.error("Get admin logs by admin ID error:", error);
    throw new Error(error?.response?.data?.message || "Failed to fetch admin logs ❌");
  }
};

// ================================
// 📥 GET LOGS BY ACTION TYPE
// ================================
export const getAdminLogsByActionAPI = async (action, params = {}) => {
  try {
    const { page = 1, limit = 20, search = "" } = params;
    const queryParams = new URLSearchParams();
    queryParams.append("page", page);
    queryParams.append("limit", limit);
    if (search) queryParams.append("search", search);

    const response = await API.get(`${ADMIN_LOGS_ENDPOINT}/action/${action}?${queryParams.toString()}`);
    return {
      logs: response?.data?.data || [],
      pagination: response?.data?.pagination || {},
    };
  } catch (error) {
    console.error("Get admin logs by action error:", error);
    throw new Error(error?.response?.data?.message || "Failed to fetch admin logs ❌");
  }
};

// ================================
// 📥 GET LOGS BY DATE RANGE
// ================================
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

    const response = await API.get(`${ADMIN_LOGS_ENDPOINT}/date-range?${queryParams.toString()}`);
    return {
      logs: response?.data?.data || [],
      pagination: response?.data?.pagination || {},
    };
  } catch (error) {
    console.error("Get admin logs by date range error:", error);
    throw new Error(error?.response?.data?.message || "Failed to fetch admin logs ❌");
  }
};

// ================================
// 📊 GET LOGS STATISTICS (محدثة)
// ================================
export const getAdminLogsStatsAPI = async () => {
  try {
    const response = await API.get(`${ADMIN_LOGS_ENDPOINT}/stats`);
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

// ================================
// 🗑️ DELETE OLD LOGS (Admin only)
// ================================
export const deleteOldLogsAPI = async (days = 30) => {
  try {
    const response = await API.delete(`${ADMIN_LOGS_ENDPOINT}`, { params: { days } });
    return {
      deletedCount: response?.data?.deletedCount || 0,
      message: response?.data?.message || "Old logs deleted successfully",
    };
  } catch (error) {
    console.error("Delete old logs error:", error);
    throw new Error(error?.response?.data?.message || "Failed to delete old logs ❌");
  }
};

// ================================
// 📤 EXPORT LOGS TO CSV/JSON
// ================================
export const exportLogsToCSVAPI = async (params = {}) => {
  try {
    const { startDate = "", endDate = "", action = "", format = "csv" } = params;
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append("startDate", startDate);
    if (endDate) queryParams.append("endDate", endDate);
    if (action) queryParams.append("action", action);
    if (format) queryParams.append("format", format);

    const response = await API.get(`${ADMIN_LOGS_ENDPOINT}/export?${queryParams.toString()}`, {
      responseType: "blob",
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

// ================================
// 🔍 GET SINGLE LOG BY ID
// ================================
export const getLogByIdAPI = async (logId) => {
  try {
    const response = await API.get(`${ADMIN_LOGS_ENDPOINT}/${logId}`);
    return response?.data?.data || null;
  } catch (error) {
    console.error("Get log by ID error:", error);
    throw new Error(error?.response?.data?.message || "Failed to fetch log details ❌");
  }
};

// ================================
// 🧪 HELPER: VALID ACTIONS (محدث)
// ================================
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

// ================================
// 🧪 HELPER: GET ACTION COLOR (محدث)
// ================================
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

// ================================
// 🧪 HELPER: GET ACTION ICON (محدث)
// ================================
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