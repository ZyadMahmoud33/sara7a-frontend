// frontend/src/pages/admin/Admin.jsx
import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  Users, CreditCard, CheckCircle, XCircle, 
  Settings, LogOut, Search, ChevronLeft, 
  ChevronRight, Shield, Key, DollarSign,
  TrendingUp, UserPlus, Clock, AlertCircle,
  Eye, EyeOff, RefreshCw, Filter, Download,
  Calendar, Ban, Trash2, Star, Zap, Crown,
  Activity, FileText, MessageCircle, Wallet,
  Award, Sparkles
} from "lucide-react";

import {
  getAllPaymentsAPI,
  approvePaymentAPI,
  rejectPaymentAPI,
  getAllUsersAPI,
  changeAdminPasswordAPI,
  changeUserRoleAPI,
  freezeUserAPI,
  restoreUserAPI,
  hardDeleteUserAPI,
  getAdminStatsAPI,
} from "../../api/admin";

import { logoutAPI } from "../../api/auth";
import { getAllMessagesAPI } from "../../api/message";

// ================================
// 📝 هوك تسجيل أحداث المشرف
// ================================
const useAdminLogger = () => {
  const logAction = useCallback(async (action, details = {}) => {
    try {
      // تخزين محلياً
      const localLog = {
        id: Date.now(),
        action,
        ...details,
        timestamp: new Date().toISOString(),
        page: window.location.pathname,
      };
      
      const existingLogs = JSON.parse(localStorage.getItem('adminActionLogs') || '[]');
      existingLogs.unshift(localLog);
      localStorage.setItem('adminActionLogs', JSON.stringify(existingLogs.slice(0, 200)));
      
      // يمكن إرسال إلى الخادم هنا
      await fetch('/api/admin/logs/local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localLog),
      }).catch(() => {});
      
      return localLog;
    } catch (error) {
      console.error("Failed to log action:", error);
      return null;
    }
  }, []);
  
  return { logAction };
};

// أنواع الأحداث
const ADMIN_ACTIONS = {
  VIEW_DASHBOARD: "VIEW_DASHBOARD",
  VIEW_MESSAGES: "VIEW_MESSAGES",
  REFRESH_DATA: "REFRESH_DATA",
  SEARCH_USERS: "SEARCH_USERS",
  SEARCH_PAYMENTS: "SEARCH_PAYMENTS",
  FILTER_PAYMENTS: "FILTER_PAYMENTS",
  CHANGE_USER_ROLE: "CHANGE_USER_ROLE",
  FREEZE_USER: "FREEZE_USER",
  RESTORE_USER: "RESTORE_USER",
  DELETE_USER: "DELETE_USER",
  APPROVE_PAYMENT: "APPROVE_PAYMENT",
  REJECT_PAYMENT: "REJECT_PAYMENT",
  CHANGE_PASSWORD: "CHANGE_PASSWORD",
};

export default function Admin() {
  const navigate = useNavigate();
  const { logAction } = useAdminLogger();

  // ================================
  // 📊 STATES
  // ================================
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // البيانات
  const [messages, setMessages] = useState([]);
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPayments: 0,
    approvedPayments: 0,
    pendingPayments: 0,
    rejectedPayments: 0,
    totalRevenue: 0,
    totalMessages: 0,
  });

  // البحث والفلترة
  const [search, setSearch] = useState("");
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [usersPage, setUsersPage] = useState(1);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [showUserActions, setShowUserActions] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  // تغيير كلمة المرور
  const [showPassword, setShowPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // حالات التحميل
  const [actionLoading, setActionLoading] = useState(null);
  const [roleLoading, setRoleLoading] = useState(null);

  // إعدادات العرض
  const USERS_PER_PAGE = 6;
  const PAYMENTS_PER_PAGE = 6;

  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  // ================================
  // 📥 جلب البيانات
  // ================================
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [messagesRes, paymentsRes, usersRes, statsRes] = await Promise.all([
        getAllMessagesAPI(),
        getAllPaymentsAPI({ limit: 100 }),
        getAllUsersAPI(),
        getAdminStatsAPI(),
      ]);
      
      // معالجة الرسائل
      const messagesData = messagesRes?.data?.data?.messages || 
                          messagesRes?.data?.data?.message || 
                          messagesRes?.messages || [];
      setMessages(messagesData);
      
      // معالجة المدفوعات
      if (paymentsRes?.success) {
        setPayments(paymentsRes.payments || []);
      }
      
      // معالجة المستخدمين
      if (usersRes?.success) {
        setUsers(usersRes.users || []);
      }
      
      // معالجة الإحصائيات
      if (statsRes?.success) {
        setStats(statsRes.stats);
      }
      
      // تسجيل حدث عرض لوحة التحكم
      await logAction(ADMIN_ACTIONS.VIEW_DASHBOARD, {
        stats: {
          totalUsers: statsRes?.stats?.totalUsers || 0,
          pendingPayments: statsRes?.stats?.pendingPayments || 0,
        }
      });
      
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Error loading data");
    } finally {
      setLoading(false);
    }
  }, [logAction]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // تحديث البيانات
  const refreshData = async () => {
    setRefreshing(true);
    await logAction(ADMIN_ACTIONS.REFRESH_DATA);
    await fetchData();
    setRefreshing(false);
    toast.success("Data refreshed!");
  };

  // ================================
  // 🔍 الفلترة والبحث
  // ================================
  const filteredUsers = useMemo(() => {
    return users.filter((u) =>
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      u.lastName?.toLowerCase().includes(search.toLowerCase())
    );
  }, [users, search]);

  const filteredPayments = useMemo(() => {
    let filtered = payments;
    
    if (paymentFilter !== "all") {
      filtered = filtered.filter((p) => p.status === paymentFilter);
    }
    
    if (paymentSearch) {
      filtered = filtered.filter((p) =>
        p.userId?.email?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
        p.plan?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
        p.method?.toLowerCase().includes(paymentSearch.toLowerCase())
      );
    }
    
    return filtered;
  }, [payments, paymentFilter, paymentSearch]);

  // التقسيم إلى صفحات
  const paginatedUsers = filteredUsers.slice(
    (usersPage - 1) * USERS_PER_PAGE,
    usersPage * USERS_PER_PAGE
  );

  const paginatedPayments = filteredPayments.slice(
    (paymentsPage - 1) * PAYMENTS_PER_PAGE,
    paymentsPage * PAYMENTS_PER_PAGE
  );

  const totalUserPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const totalPaymentPages = Math.ceil(filteredPayments.length / PAYMENTS_PER_PAGE);

  // ================================
  // 🔐 تغيير كلمة مرور المشرف
  // ================================
  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      return toast.error("Please fill all fields ❌");
    }
    if (newPassword !== confirmPassword) {
      return toast.error("New passwords don't match ❌");
    }
    if (newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters ❌");
    }

    try {
      const result = await changeAdminPasswordAPI({ 
        oldPassword, 
        newPassword, 
        confirmNewPassword: confirmPassword 
      });
      
      if (result.success) {
        await logAction(ADMIN_ACTIONS.CHANGE_PASSWORD);
        toast.success("Password updated successfully 🔥");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error(err.message || "Failed to update password");
    }
  };

  // ================================
  // 👑 تغيير دور المستخدم
  // ================================
  const handleChangeRole = async (id, role, userEmail) => {
    try {
      setRoleLoading(id);
      const result = await changeUserRoleAPI(id, role === "admin" ? 0 : 1);
      
      if (result.success) {
        await logAction(ADMIN_ACTIONS.CHANGE_USER_ROLE, {
          userId: id,
          userEmail,
          newRole: role,
        });
        
        setUsers((prev) =>
          prev.map((u) => (u._id === id ? { ...u, role: role === "admin" ? "admin" : "user" } : u))
        );
        toast.success(`Role updated to ${role} ✅`);
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRoleLoading(null);
    }
  };

  // ================================
  // ❄️ تجميد/استعادة المستخدم
  // ================================
  const handleFreezeUser = async (userId, isFrozen, userEmail) => {
    try {
      setActionLoading(userId);
      let result;
      
      if (isFrozen) {
        result = await restoreUserAPI(userId);
        if (result.success) {
          await logAction(ADMIN_ACTIONS.RESTORE_USER, { userId, userEmail });
          setUsers((prev) =>
            prev.map((u) => (u._id === userId ? { ...u, freezedAt: null } : u))
          );
          toast.success("User restored successfully ✅");
        }
      } else {
        result = await freezeUserAPI(userId);
        if (result.success) {
          await logAction(ADMIN_ACTIONS.FREEZE_USER, { userId, userEmail });
          setUsers((prev) =>
            prev.map((u) => (u._id === userId ? { ...u, freezedAt: new Date() } : u))
          );
          toast.success("User frozen successfully ❄️");
        }
      }
      
      if (!result.success) {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
      setShowUserActions(null);
    }
  };

  // ================================
  // 🗑️ حذف المستخدم نهائياً
  // ================================
  const handleDeleteUser = async (userId, userEmail) => {
    if (!window.confirm("⚠️ Are you sure you want to permanently delete this user? This action cannot be undone!")) {
      return;
    }
    
    try {
      setActionLoading(userId);
      const result = await hardDeleteUserAPI(userId);
      
      if (result.success) {
        await logAction(ADMIN_ACTIONS.DELETE_USER, { userId, userEmail });
        setUsers((prev) => prev.filter((u) => u._id !== userId));
        toast.success("User deleted successfully ✅");
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
      setShowUserActions(null);
    }
  };

  // ================================
  // 💳 الموافقة على/رفض الدفع
  // ================================
  const handleApprove = async (id, paymentData) => {
    if (actionLoading) return;
    try {
      setActionLoading(id);
      const result = await approvePaymentAPI(id);
      
      if (result.success) {
        await logAction(ADMIN_ACTIONS.APPROVE_PAYMENT, {
          paymentId: id,
          userId: paymentData?.userId?.email,
          plan: paymentData?.plan,
        });
        
        setPayments((prev) =>
          prev.map((p) => (p._id === id ? { ...p, status: "approved" } : p))
        );
        toast.success("Payment approved ✅");
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error(err.message || "Failed to approve ❌");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id, paymentData) => {
    if (actionLoading) return;
    try {
      setActionLoading(id);
      const result = await rejectPaymentAPI(id);
      
      if (result.success) {
        await logAction(ADMIN_ACTIONS.REJECT_PAYMENT, {
          paymentId: id,
          userId: paymentData?.userId?.email,
          plan: paymentData?.plan,
        });
        
        setPayments((prev) =>
          prev.map((p) => (p._id === id ? { ...p, status: "rejected" } : p))
        );
        toast.success("Payment rejected ❌");
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error(err.message || "Failed to reject ❌");
    } finally {
      setActionLoading(null);
    }
  };

  // ================================
  // 🚪 تسجيل الخروج
  // ================================
  const handleLogout = async () => {
    await logoutAPI();
    navigate("/login");
  };

  // ================================
  // 🎨 دوال مساعدة للعرض
  // ================================
  const getRoleBadge = (role) => {
    if (role === "admin" || role === 0) {
      return { label: "Admin", color: "from-purple-500 to-pink-500" };
    }
    return { label: "User", color: "from-blue-500 to-cyan-500" };
  };

  const getPlanBadge = (plan) => {
    const plans = {
      premium: { label: "Premium", color: "from-yellow-500 to-orange-500", icon: Crown },
      pro: { label: "Pro", color: "from-cyan-500 to-blue-500", icon: Zap },
      free: { label: "Free", color: "from-gray-500 to-gray-600", icon: Star },
    };
    return plans[plan] || plans.free;
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-500/20 text-green-400 border border-green-500/50";
      case "rejected":
        return "bg-red-500/20 text-red-400 border border-red-500/50";
      default:
        return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50";
    }
  };

  // إحصائيات العرض
  const displayStats = [
    { value: stats.totalUsers, icon: Users, color: "from-blue-500 to-cyan-500", label: "Total Users" },
    { value: stats.totalMessages, icon: MessageCircle, color: "from-teal-500 to-emerald-500", label: "Total Messages" },
    { value: stats.totalPayments, icon: CreditCard, color: "from-purple-500 to-pink-500", label: "Total Payments" },
    { value: stats.pendingPayments, icon: Clock, color: "from-yellow-500 to-orange-500", label: "Pending" },
    { value: stats.approvedPayments, icon: CheckCircle, color: "from-green-500 to-emerald-500", label: "Approved" },
    { value: stats.rejectedPayments, icon: XCircle, color: "from-red-500 to-rose-500", label: "Rejected" },
    { value: stats.totalRevenue, icon: DollarSign, color: "from-emerald-500 to-teal-500", label: "Revenue", suffix: " EGP" },
  ];

  // تبديل التبويب مع تسجيل الحدث
  const handleTabChange = async (tab) => {
    setActiveTab(tab);
    if (tab === "dashboard") {
      await logAction(ADMIN_ACTIONS.VIEW_DASHBOARD);
    } else if (tab === "messages") {
      await logAction(ADMIN_ACTIONS.VIEW_MESSAGES);
    }
  };

  // ================================
  // ⏳ شاشة التحميل
  // ================================
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center bg-gradient-to-br from-gray-900 via-black to-gray-900 min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="mb-4"
        >
          <Shield size={48} className="text-purple-500" />
        </motion.div>
        <p className="text-gray-400">Loading Admin Panel...</p>
      </div>
    );
  }

  // ================================
  // 🎨 الواجهة الرئيسية
  // ================================
  return (
    <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 min-h-screen text-white">
      {/* خلفية متحركة */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="-top-40 -right-40 absolute bg-purple-600 opacity-20 blur-3xl rounded-full w-80 h-80 animate-pulse"></div>
        <div className="-bottom-40 -left-40 absolute bg-blue-600 opacity-20 blur-3xl rounded-full w-80 h-80 animate-pulse delay-1000"></div>
        <div className="top-1/2 left-1/2 absolute bg-pink-600 opacity-10 blur-3xl rounded-full w-96 h-96 -translate-x-1/2 -translate-y-1/2 animate-pulse delay-2000"></div>
      </div>

      <div className="z-10 relative mx-auto p-6 lg:p-8 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white/5 shadow-2xl backdrop-blur-xl mb-8 p-6 border border-white/10 rounded-2xl"
        >
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2 rounded-xl">
                <Shield size={28} />
              </div>
              <div>
                <h1 className="bg-clip-text bg-gradient-to-r from-white to-gray-400 font-bold text-transparent text-3xl">
                  Admin Dashboard
                </h1>
                <p className="text-gray-400 text-sm">Manage users, payments, and messages</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={refreshData}
                disabled={refreshing}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 px-4 py-2 rounded-xl"
              >
                <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
                Refresh
              </button>
              
              <button
                onClick={() => handleTabChange("dashboard")}
                className={`px-4 py-2 rounded-xl transition-all ${
                  activeTab === "dashboard"
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg" 
                    : "bg-white/10 hover:bg-white/20"
                }`}
              >
                <TrendingUp size={18} className="inline mr-2" />
                Dashboard
              </button>
              
              <button
                onClick={() => handleTabChange("messages")}
                className={`px-4 py-2 rounded-xl transition-all ${
                  activeTab === "messages"
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg" 
                    : "bg-white/10 hover:bg-white/20"
                }`}
              >
                <MessageCircle size={18} className="inline mr-2" />
                Messages
                {messages.length > 0 && (
                  <span className="bg-white/20 ml-2 px-1.5 py-0.5 rounded-full text-xs">
                    {messages.length}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => setActiveTab("settings")}
                className={`px-4 py-2 rounded-xl transition-all ${
                  activeTab === "settings"
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg" 
                    : "bg-white/10 hover:bg-white/20"
                }`}
              >
                <Settings size={18} className="inline mr-2" />
                Settings
              </button>
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 px-4 py-2 border border-red-500/30 rounded-xl text-red-400"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* ==================== DASHBOARD TAB ==================== */}
          {activeTab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {/* بطاقات الإحصائيات */}
              <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-8">
                {displayStats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    className={`bg-gradient-to-br ${stat.color} p-5 rounded-2xl shadow-xl`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-white/80 text-sm">{stat.label}</p>
                        <p className="mt-1 font-bold text-2xl">
                          {stat.value.toLocaleString()}
                          {stat.suffix && <span className="ml-1 text-sm">{stat.suffix}</span>}
                        </p>
                      </div>
                      <stat.icon size={24} className="text-white/50" />
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* ==================== PAYMENTS SECTION ==================== */}
              <div className="bg-white/5 backdrop-blur-xl mb-8 p-6 border border-white/10 rounded-2xl">
                <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                  <h2 className="flex items-center gap-2 font-bold text-2xl">
                    <CreditCard size={24} />
                    Payment Requests
                    {stats.pendingPayments > 0 && (
                      <span className="bg-yellow-500/30 px-2 py-0.5 rounded-full text-yellow-400 text-sm">
                        {stats.pendingPayments} pending
                      </span>
                    )}
                  </h2>
                  
                  <div className="flex gap-3">
                    <div className="relative">
                      <Search size={18} className="top-1/2 left-3 absolute text-gray-400 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search payments..."
                        value={paymentSearch}
                        onChange={(e) => {
                          setPaymentSearch(e.target.value);
                          setPaymentsPage(1);
                          logAction(ADMIN_ACTIONS.SEARCH_PAYMENTS, { search: e.target.value });
                        }}
                        className="bg-black/40 py-2 pr-4 pl-10 border border-white/10 focus:border-purple-500 rounded-xl outline-none"
                      />
                    </div>
                    
                    <select
                      value={paymentFilter}
                      onChange={(e) => {
                        setPaymentFilter(e.target.value);
                        setPaymentsPage(1);
                        logAction(ADMIN_ACTIONS.FILTER_PAYMENTS, { filter: e.target.value });
                      }}
                      className="bg-black/40 px-4 py-2 border border-white/10 focus:border-purple-500 rounded-xl outline-none"
                    >
                      <option value="all">All</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                {paginatedPayments.length === 0 ? (
                  <div className="py-12 text-gray-400 text-center">
                    <CreditCard size={48} className="opacity-50 mx-auto mb-3" />
                    <p>No payments found</p>
                  </div>
                ) : (
                  <div className="gap-4 grid md:grid-cols-2 lg:grid-cols-3">
                    {paginatedPayments.map((p) => {
                      const planBadge = getPlanBadge(p.plan);
                      const PlanIcon = planBadge.icon;
                      
                      return (
                        <motion.div
                          key={p._id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileHover={{ scale: 1.02 }}
                          className="bg-gradient-to-br from-white/5 to-transparent p-4 border border-white/10 hover:border-purple-500/50 rounded-xl transition-all"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <p className="flex-1 text-sm truncate">
                              👤 {p.userId?.email || "Unknown"}
                            </p>
                            <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${planBadge.color}`}>
                              <PlanIcon size={10} className="inline mr-1" />
                              {planBadge.label}
                            </span>
                          </div>

                          <p className="text-blue-400 text-sm">
                            💎 {p.plan}
                          </p>

                          <p className="text-gray-400 text-sm">
                            💳 {p.method}
                          </p>

                          <span className={`inline-block mt-2 px-2 py-1 text-xs rounded ${getStatusStyle(p.status)}`}>
                            {p.status}
                          </span>

                          <p className="mt-2 text-gray-500 text-xs">
                            {new Date(p.createdAt).toLocaleString()}
                          </p>

                          {p.screenshot && (
                            <img
                              src={`${BASE_URL}/${p.screenshot}`}
                              alt="payment"
                              className="hover:opacity-80 mt-3 border border-gray-600 rounded-lg w-full h-32 object-cover transition cursor-pointer"
                              onClick={() => window.open(`${BASE_URL}/${p.screenshot}`, "_blank")}
                            />
                          )}

                          {p.status === "pending" && (
                            <div className="flex gap-2 mt-3">
                              <button
                                disabled={actionLoading === p._id}
                                onClick={() => handleApprove(p._id, p)}
                                className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 py-1.5 rounded transition"
                              >
                                {actionLoading === p._id ? "..." : "Approve"}
                              </button>
                              <button
                                disabled={actionLoading === p._id}
                                onClick={() => handleReject(p._id, p)}
                                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 py-1.5 rounded transition"
                              >
                                {actionLoading === p._id ? "..." : "Reject"}
                              </button>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* Pagination للمدفوعات */}
                {totalPaymentPages > 1 && (
                  <div className="flex justify-center items-center gap-3 mt-6">
                    <button
                      onClick={() => setPaymentsPage(p => Math.max(1, p - 1))}
                      disabled={paymentsPage === 1}
                      className="bg-white/10 hover:bg-white/20 disabled:opacity-50 p-2 rounded-lg"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <span className="text-sm">Page {paymentsPage} of {totalPaymentPages}</span>
                    <button
                      onClick={() => setPaymentsPage(p => Math.min(totalPaymentPages, p + 1))}
                      disabled={paymentsPage === totalPaymentPages}
                      className="bg-white/10 hover:bg-white/20 disabled:opacity-50 p-2 rounded-lg"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                )}
              </div>

              {/* ==================== USERS SECTION ==================== */}
              <div className="bg-white/5 backdrop-blur-xl p-6 border border-white/10 rounded-2xl">
                <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                  <h2 className="flex items-center gap-2 font-bold text-2xl">
                    <Users size={24} />
                    User Management
                    <span className="bg-white/10 px-2 py-1 rounded-lg text-sm">{users.length} total</span>
                  </h2>
                  
                  <div className="relative w-full lg:w-96">
                    <Search size={18} className="top-1/2 left-3 absolute text-gray-400 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setUsersPage(1);
                        if (e.target.value.length > 2) {
                          logAction(ADMIN_ACTIONS.SEARCH_USERS, { search: e.target.value });
                        }
                      }}
                      className="bg-black/40 py-2 pr-4 pl-10 border border-white/10 focus:border-purple-500 rounded-xl outline-none w-full"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-white/10 border-b">
                      <tr className="text-gray-400 text-left">
                        <th className="pb-3">User</th>
                        <th className="pb-3">Email</th>
                        <th className="pb-3">Plan</th>
                        <th className="pb-3">Role</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedUsers.map((user, index) => {
                        const planBadge = getPlanBadge(user.plan);
                        const PlanIcon = planBadge.icon;
                        const isFrozen = !!user.freezedAt;
                        
                        return (
                          <motion.tr
                            key={user._id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="hover:bg-white/5 border-white/5 border-b transition-all"
                          >
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex justify-center items-center bg-gradient-to-br from-purple-500 to-pink-500 rounded-full w-8 h-8">
                                  <UserPlus size={14} />
                                </div>
                                <span>{user.firstName} {user.lastName}</span>
                              </div>
                             </td>
                            <td className="py-3 text-sm">{user.email}</td>
                            <td className="py-3">
                              <span className={`text-xs px-2 py-1 rounded-full bg-gradient-to-r ${planBadge.color}`}>
                                <PlanIcon size={10} className="inline mr-1" />
                                {planBadge.label}
                              </span>
                             </td>
                            <td className="py-3">
                              <select
                                value={user.role === "admin" || user.role === 0 ? "admin" : "user"}
                                onChange={(e) => handleChangeRole(user._id, e.target.value, user.email)}
                                disabled={roleLoading === user._id}
                                className="bg-white/10 disabled:opacity-50 px-3 py-1 border border-white/10 focus:border-purple-500 rounded-lg outline-none text-sm"
                              >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                              </select>
                             </td>
                            <td className="py-3">
                              {isFrozen ? (
                                <span className="flex items-center gap-1 text-yellow-400 text-xs">
                                  <Ban size={12} /> Frozen
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-green-400 text-xs">
                                  <CheckCircle size={12} /> Active
                                </span>
                              )}
                             </td>
                            <td className="py-3">
                              <div className="relative">
                                <button
                                  onClick={() => setShowUserActions(showUserActions === user._id ? null : user._id)}
                                  className="hover:bg-white/10 p-1 rounded-lg transition-all"
                                >
                                  <Shield size={16} />
                                </button>
                                
                                {showUserActions === user._id && (
                                  <div className="right-0 z-10 absolute bg-gray-800 shadow-xl mt-2 border border-white/10 rounded-xl w-48 overflow-hidden">
                                    <button
                                      onClick={() => handleFreezeUser(user._id, isFrozen, user.email)}
                                      disabled={actionLoading === user._id}
                                      className="flex items-center gap-2 hover:bg-white/10 px-4 py-2 w-full text-sm text-left"
                                    >
                                      {isFrozen ? <RefreshCw size={14} /> : <Ban size={14} />}
                                      {isFrozen ? "Restore User" : "Freeze User"}
                                    </button>
                                    <button
                                      onClick={() => handleDeleteUser(user._id, user.email)}
                                      disabled={actionLoading === user._id}
                                      className="flex items-center gap-2 hover:bg-red-500/10 px-4 py-2 w-full text-red-400 text-sm text-left"
                                    >
                                      <Trash2 size={14} /> Delete User
                                    </button>
                                  </div>
                                )}
                              </div>
                             </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination للمستخدمين */}
                {totalUserPages > 1 && (
                  <div className="flex justify-center items-center gap-3 mt-6">
                    <button
                      onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                      disabled={usersPage === 1}
                      className="bg-white/10 hover:bg-white/20 disabled:opacity-50 p-2 rounded-lg"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <div className="flex gap-2">
                      {Array.from({ length: Math.min(5, totalUserPages) }, (_, i) => {
                        let pageNum;
                        if (totalUserPages <= 5) pageNum = i + 1;
                        else if (usersPage <= 3) pageNum = i + 1;
                        else if (usersPage >= totalUserPages - 2) pageNum = totalUserPages - 4 + i;
                        else pageNum = usersPage - 2 + i;
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setUsersPage(pageNum)}
                            className={`w-9 h-9 rounded-lg transition-all ${
                              usersPage === pageNum
                                ? "bg-gradient-to-r from-purple-500 to-pink-500"
                                : "bg-white/10 hover:bg-white/20"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setUsersPage(p => Math.min(totalUserPages, p + 1))}
                      disabled={usersPage === totalUserPages}
                      className="bg-white/10 hover:bg-white/20 disabled:opacity-50 p-2 rounded-lg"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ==================== MESSAGES TAB ==================== */}
          {activeTab === "messages" && (
            <motion.div
              key="messages"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white/5 backdrop-blur-xl p-6 border border-white/10 rounded-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2 rounded-xl">
                    <MessageCircle size={24} />
                  </div>
                  <div>
                    <h2 className="font-bold text-2xl">All Messages</h2>
                    <p className="text-gray-400 text-sm">View all messages sent on the platform</p>
                  </div>
                </div>

                {messages.length === 0 ? (
                  <div className="py-12 text-gray-400 text-center">
                    <MessageCircle size={48} className="opacity-50 mx-auto mb-3" />
                    <p>No messages found</p>
                  </div>
                ) : (
                  <div className="space-y-3 pr-2 max-h-[600px] overflow-y-auto">
                    {messages.map((msg, index) => (
                      <motion.div
                        key={msg._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="bg-gradient-to-r from-white/5 to-transparent p-4 border border-white/10 hover:border-purple-500/50 rounded-xl transition-all"
                      >
                        <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="bg-white/10 px-2 py-0.5 rounded text-gray-400 text-xs">
                              #{index + 1}
                            </span>
                            {msg.isRevealed ? (
                              <span className="flex items-center gap-1 text-green-400 text-xs">
                                <Eye size={12} /> Revealed
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-yellow-400 text-xs">
                                <Lock size={12} /> Anonymous
                              </span>
                            )}
                          </div>
                          <span className="text-gray-500 text-xs">
                            {new Date(msg.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-200 leading-relaxed">
                          "{msg.content || "No content"}"
                        </p>
                        {msg.isRevealed && msg.senderId && (
                          <div className="mt-2 pt-2 border-white/10 border-t text-gray-400 text-xs">
                            From: {msg.senderId.email || msg.senderId.firstName || "Unknown"}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ==================== SETTINGS TAB ==================== */}
          {activeTab === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="mx-auto max-w-2xl"
            >
              <div className="bg-white/5 backdrop-blur-xl p-8 border border-white/10 rounded-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2 rounded-xl">
                    <Key size={24} />
                  </div>
                  <h2 className="font-bold text-2xl">Change Password</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 text-gray-300 text-sm">Current Password</label>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter current password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="bg-black/40 p-3 border border-white/10 focus:border-purple-500 rounded-xl outline-none w-full"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-gray-300 text-sm">New Password</label>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password (min 6 characters)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-black/40 p-3 border border-white/10 focus:border-purple-500 rounded-xl outline-none w-full"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-gray-300 text-sm">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="bg-black/40 p-3 pr-10 border border-white/10 focus:border-purple-500 rounded-xl outline-none w-full"
                      />
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="top-1/2 right-3 absolute text-gray-400 hover:text-white -translate-y-1/2"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleChangePassword}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 py-3 rounded-xl w-full font-semibold transition-all"
                  >
                    Update Password
                  </button>
                </div>

                <div className="bg-yellow-500/10 mt-6 p-4 border border-yellow-500/30 rounded-xl">
                  <div className="flex gap-3">
                    <AlertCircle size={20} className="text-yellow-400" />
                    <div className="text-yellow-300 text-sm">
                      <p className="mb-1 font-semibold">Password Requirements:</p>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>Minimum 6 characters long</li>
                        <li>Should be different from current password</li>
                        <li>Keep your password secure</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}