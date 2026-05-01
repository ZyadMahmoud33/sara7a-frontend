// frontend/src/pages/admin/AdminLogs.jsx
import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAdminLogsAPI, getAdminLogsStatsAPI, exportLogsToCSVAPI } from "../../api/adminLogs";
import toast from "react-hot-toast";
import {
  FileText,
  Search,
  Filter,
  Calendar,
  User,
  Target,
  Shield,
  Activity,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Ban,
  Trash2,
  RefreshCw,
  Eye,
  Clock,
  Server,
  Wifi,
  Download,
  X,
  TrendingUp,
  Users,
  CreditCard,
  Settings,
  Key,
  Zap,
  Star,
  Crown,
  AlertCircle,
  Copy,
  Check,
  Printer,
  FileJson,
  FileSpreadsheet,
  Loader,
  MoreVertical,
  Mail,
  Phone
} from "lucide-react";

// ================================
// 📝 تعريفات ثابتة
// ================================
const ITEMS_PER_PAGE = 10;

// أنواع الأحداث وألوانها (موسعة)
const ACTION_CONFIG = {
  // أحداث المستخدمين
  VIEW_USERS: { icon: Users, color: "text-blue-400", bg: "bg-blue-500/20", label: "Viewed Users" },
  SEARCH_USERS: { icon: Search, color: "text-cyan-400", bg: "bg-cyan-500/20", label: "Searched Users" },
  VIEW_USER_DETAILS: { icon: User, color: "text-indigo-400", bg: "bg-indigo-500/20", label: "Viewed User Details" },
  CHANGE_USER_ROLE: { icon: Shield, color: "text-purple-400", bg: "bg-purple-500/20", label: "Changed User Role" },
  FREEZE_USER: { icon: Ban, color: "text-yellow-400", bg: "bg-yellow-500/20", label: "Froze User" },
  RESTORE_USER: { icon: RefreshCw, color: "text-green-400", bg: "bg-green-500/20", label: "Restored User" },
  DELETE_USER: { icon: Trash2, color: "text-red-400", bg: "bg-red-500/20", label: "Deleted User" },
  
  // أحداث المدفوعات
  VIEW_PAYMENTS: { icon: CreditCard, color: "text-indigo-400", bg: "bg-indigo-500/20", label: "Viewed Payments" },
  SEARCH_PAYMENTS: { icon: Search, color: "text-cyan-400", bg: "bg-cyan-500/20", label: "Searched Payments" },
  FILTER_PAYMENTS: { icon: Filter, color: "text-purple-400", bg: "bg-purple-500/20", label: "Filtered Payments" },
  APPROVE_PAYMENT: { icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/20", label: "Approved Payment" },
  REJECT_PAYMENT: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/20", label: "Rejected Payment" },
  
  // أحداث عامة
  VIEW_DASHBOARD: { icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/20", label: "Viewed Dashboard" },
  VIEW_MESSAGES: { icon: FileText, color: "text-teal-400", bg: "bg-teal-500/20", label: "Viewed Messages" },
  VIEW_LOGS: { icon: Activity, color: "text-gray-400", bg: "bg-gray-500/20", label: "Viewed Logs" },
  VIEW_SETTINGS: { icon: Settings, color: "text-gray-400", bg: "bg-gray-500/20", label: "Viewed Settings" },
  CHANGE_PASSWORD: { icon: Key, color: "text-cyan-400", bg: "bg-cyan-500/20", label: "Changed Password" },
  REFRESH_DATA: { icon: RefreshCw, color: "text-blue-400", bg: "bg-blue-500/20", label: "Refreshed Data" },
  EXPORT_LOGS: { icon: Download, color: "text-green-400", bg: "bg-green-500/20", label: "Exported Logs" },
};

export default function AdminLogs() {
  // ================================
  // 📊 STATES
  // ================================
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, page: 1 });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [logsStats, setLogsStats] = useState({
    total: 0,
    byAction: {},
    last24Hours: 0,
    lastWeek: 0,
    lastMonth: 0,
    byAdmin: {},
  });

  // ================================
  // 📥 جلب السجل
  // ================================
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);

      const [logsRes, statsRes] = await Promise.all([
        getAdminLogsAPI({
          page,
          limit: ITEMS_PER_PAGE,
          search,
          action: action === "all" ? "" : action,
          startDate: dateRange.start,
          endDate: dateRange.end,
        }),
        getAdminLogsStatsAPI(),
      ]);

      setLogs(logsRes.logs || []);
      setPagination(logsRes.pagination || { total: 0, pages: 1, page: 1 });
      setLogsStats(statsRes || {
        total: 0,
        byAction: {},
        last24Hours: 0,
        lastWeek: 0,
        lastMonth: 0,
        byAdmin: {},
      });

    } catch (err) {
      console.error("Fetch logs error:", err);
      toast.error(err.message || "Failed to fetch logs");
    } finally {
      setLoading(false);
    }
  }, [page, action, search, dateRange]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchLogs();
      } else {
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search, fetchLogs, page]);

  // ================================
  // 📊 إحصائيات إضافية
  // ================================
  const statsCards = useMemo(() => [
    { label: "Total Actions", value: logsStats.total, icon: Activity, color: "from-blue-500 to-cyan-500" },
    { label: "Last 24 Hours", value: logsStats.last24Hours, icon: Clock, color: "from-indigo-500 to-purple-500" },
    { label: "Last 7 Days", value: logsStats.lastWeek, icon: Calendar, color: "from-green-500 to-emerald-500" },
    { label: "Last 30 Days", value: logsStats.lastMonth, icon: TrendingUp, color: "from-orange-500 to-red-500" },
  ], [logsStats]);

  // ================================
  // 🎨 دوال مساعدة للعرض
  // ================================
  const getActionDetails = (actionType) => {
    return ACTION_CONFIG[actionType] || {
      icon: Activity,
      color: "text-gray-400",
      bg: "bg-gray-500/20",
      label: actionType?.replace(/_/g, " ") || "Unknown Action"
    };
  };

  const getMethodColor = (method) => {
    switch (method?.toUpperCase()) {
      case "GET": return "text-green-400";
      case "POST": return "text-blue-400";
      case "PUT": return "text-yellow-400";
      case "PATCH": return "text-purple-400";
      case "DELETE": return "text-red-400";
      default: return "text-gray-400";
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };

  const formatRelativeTime = (date) => {
    if (!date) return "";
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return past.toLocaleDateString();
  };

  // ================================
  // 📤 تصدير السجل
  // ================================
  const handleExport = async (format = "csv") => {
    try {
      setExporting(true);
      setShowExportMenu(false);
      
      await exportLogsToCSVAPI({
        startDate: dateRange.start,
        endDate: dateRange.end,
        action: action === "all" ? "" : action,
        format,
      });
      
      toast.success(`Logs exported as ${format.toUpperCase()} successfully!`);
    } catch (err) {
      toast.error("Failed to export logs");
    } finally {
      setExporting(false);
    }
  };

  // ================================
  // 📋 نسخ النص
  // ================================
  const handleCopy = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  // ================================
  // 🔄 تحديث
  // ================================
  const handleRefresh = () => {
    fetchLogs();
    toast.success("Logs refreshed!");
  };

  // ================================
  // 🧹 مسح الفلاتر
  // ================================
  const clearFilters = () => {
    setSearch("");
    setAction("all");
    setDateRange({ start: "", end: "" });
    setPage(1);
    toast.success("Filters cleared");
  };

  // ================================
  // ⏳ شاشة التحميل
  // ================================
  if (loading && logs.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center bg-gradient-to-br from-gray-900 via-black to-gray-900 min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="mb-4"
        >
          <FileText size={48} className="text-purple-500" />
        </motion.div>
        <motion.p className="text-gray-400">Loading admin logs...</motion.p>
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
        <div className="top-1/2 left-1/2 absolute bg-cyan-600 opacity-10 blur-3xl rounded-full w-96 h-96 -translate-x-1/2 -translate-y-1/2 animate-pulse delay-2000"></div>
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
                <FileText size={28} />
              </div>
              <div>
                <h1 className="bg-clip-text bg-gradient-to-r from-white to-gray-400 font-bold text-transparent text-3xl">
                  Admin Activity Logs
                </h1>
                <p className="text-gray-400 text-sm">
                  Track all administrative actions and system events
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {/* زر التصدير */}
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  disabled={exporting}
                  className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 px-4 py-2 border border-green-500/30 rounded-xl text-green-400 transition-all"
                >
                  {exporting ? (
                    <Loader size={18} className="animate-spin" />
                  ) : (
                    <Download size={18} />
                  )}
                  Export
                </button>
                
                {showExportMenu && (
                  <div className="top-full right-0 z-10 absolute bg-gray-800 shadow-xl mt-2 border border-white/10 rounded-xl w-48 overflow-hidden">
                    <button
                      onClick={() => handleExport("csv")}
                      className="flex items-center gap-2 hover:bg-white/10 px-4 py-2 w-full text-sm text-left"
                    >
                      <FileSpreadsheet size={14} />
                      Export as CSV
                    </button>
                    <button
                      onClick={() => handleExport("json")}
                      className="flex items-center gap-2 hover:bg-white/10 px-4 py-2 w-full text-sm text-left"
                    >
                      <FileJson size={14} />
                      Export as JSON
                    </button>
                  </div>
                )}
              </div>
              
              {/* زر التحديث */}
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-all"
              >
                <RefreshCw size={18} />
                Refresh
              </button>
              
              {/* زر مسح الفلاتر */}
              {(search || action !== "all" || dateRange.start || dateRange.end) && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 px-4 py-2 border border-red-500/30 rounded-xl text-red-400 transition-all"
                >
                  <X size={18} />
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* بطاقات الإحصائيات المتقدمة */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="gap-4 grid grid-cols-2 md:grid-cols-4 mb-8"
        >
          {statsCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className={`bg-gradient-to-br ${stat.color} p-5 rounded-2xl shadow-xl`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-white/80 text-sm">{stat.label}</p>
                  <p className="mt-1 font-bold text-2xl">{stat.value.toLocaleString()}</p>
                </div>
                <stat.icon size={24} className="text-white/50" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* إحصائيات سريعة حسب نوع الحدث */}
        {Object.keys(logsStats.byAction).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-wrap gap-2 mb-6"
          >
            <span className="mr-2 text-gray-400 text-sm">Top Actions:</span>
            {Object.entries(logsStats.byAction)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 6)
              .map(([actionName, count]) => {
                const config = getActionDetails(actionName);
                const Icon = config.icon;
                return (
                  <span key={actionName} className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${config.bg} ${config.color}`}>
                    <Icon size={12} />
                    {config.label}: {count}
                  </span>
                );
              })}
          </motion.div>
        )}

        {/* البحث والفلاتر */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-xl mb-8 p-6 border border-white/10 rounded-2xl"
        >
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1">
              <Search size={18} className="top-1/2 left-3 absolute text-gray-400 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by admin email, target ID, action, or endpoint..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-black/40 py-3 pr-4 pl-10 border border-white/10 focus:border-purple-500 rounded-xl focus:outline-none w-full transition-all"
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-5 py-3 rounded-xl transition-all"
            >
              <Filter size={18} />
              Filters
              {showFilters ? <ChevronRight size={18} className="rotate-90" /> : <ChevronRight size={18} />}
            </button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-white/10 border-t"
              >
                <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
                  <div>
                    <label className="block mb-2 text-gray-300 text-sm">Date Range</label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        className="flex-1 bg-black/40 px-3 py-2 border border-white/10 focus:border-purple-500 rounded-xl"
                      />
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        className="flex-1 bg-black/40 px-3 py-2 border border-white/10 focus:border-purple-500 rounded-xl"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-gray-300 text-sm">Action Type</label>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                      {[
                        "all",
                        "VIEW_DASHBOARD",
                        "VIEW_MESSAGES",
                        "VIEW_LOGS",
                        "VIEW_SETTINGS",
                        "VIEW_USERS",
                        "VIEW_USER_DETAILS",
                        "VIEW_PAYMENTS",
                        "CHANGE_USER_ROLE",
                        "FREEZE_USER",
                        "RESTORE_USER",
                        "DELETE_USER",
                        "APPROVE_PAYMENT",
                        "REJECT_PAYMENT",
                        "CHANGE_PASSWORD",
                        "REFRESH_DATA",
                        "EXPORT_LOGS",
                      ].map((a) => {
                        const config = getActionDetails(a);
                        const Icon = config.icon;
                        return (
                          <button
                            key={a}
                            onClick={() => setAction(a)}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm transition-all ${
                              action === a
                                ? `bg-gradient-to-r from-purple-500 to-pink-500 text-white`
                                : `bg-white/10 hover:bg-white/20 ${config.color}`
                            }`}
                          >
                            <Icon size={12} />
                            {a === "all" ? "All" : (config.label || a.replace(/_/g, " "))}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* جدول السجل */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-white/10 border-b">
                <tr className="text-gray-400 text-sm text-left">
                  <th className="p-4">#</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Admin</th>
                  <th className="p-4">Target</th>
                  <th className="p-4">Details</th>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4"></th>
                 </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center">
                      <Activity size={48} className="mx-auto mb-3 text-gray-600" />
                      <p className="text-gray-400">No logs found</p>
                      {(search || action !== "all" || dateRange.start || dateRange.end) && (
                        <button onClick={clearFilters} className="mt-3 text-purple-400 text-sm hover:underline">
                          Clear filters to see all logs
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  logs.map((log, index) => {
                    const actionDetails = getActionDetails(log.action);
                    const ActionIcon = actionDetails.icon;
                    const serialNumber = ((pagination.page - 1) * ITEMS_PER_PAGE) + index + 1;
                    
                    return (
                      <motion.tr
                        key={log._id || index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="hover:bg-white/5 border-white/5 border-b transition-all cursor-pointer"
                        onClick={() => setSelectedLog(log)}
                      >
                        <td className="p-4 text-gray-500 text-xs">
                          #{serialNumber}
                        </td>
                        
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className={`p-1 rounded-lg ${actionDetails.bg}`}>
                              <ActionIcon size={14} className={actionDetails.color} />
                            </div>
                            <span className={`text-sm font-medium ${actionDetails.color}`}>
                              {actionDetails.label}
                            </span>
                          </div>
                        </td>
                        
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="flex justify-center items-center bg-purple-500/20 rounded-full w-6 h-6">
                              <span className="font-bold text-purple-400 text-xs">
                                {log.adminId?.email?.charAt(0)?.toUpperCase() || "A"}
                              </span>
                            </div>
                            <span className="max-w-[150px] text-sm truncate" title={log.adminId?.email}>
                              {log.adminId?.email || "Unknown"}
                            </span>
                          </div>
                        </td>
                        
                        <td className="p-4">
                          {log.targetId ? (
                            <div className="flex items-center gap-2">
                              <Target size={14} className="text-gray-500" />
                              <span className="font-mono text-xs">{log.targetId}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(log.targetId, `target-${log._id}`);
                                }}
                                className="text-gray-500 hover:text-white transition-colors"
                              >
                                {copiedId === `target-${log._id}` ? <Check size={12} /> : <Copy size={12} />}
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-600 text-xs">—</span>
                          )}
                        </td>
                        
                        <td className="p-4">
                          <div className="max-w-[250px]">
                            {log.details ? (
                              <div className="space-y-1 text-xs">
                                {log.details.userEmail && (
                                  <div className="flex items-center gap-1 text-gray-300 truncate" title={log.details.userEmail}>
                                    <Mail size={10} /> {log.details.userEmail}
                                  </div>
                                )}
                                {log.details.newRole && (
                                  <div className="flex items-center gap-1 text-purple-400">
                                    <Shield size={10} /> → {log.details.newRole}
                                  </div>
                                )}
                                {log.details.plan && (
                                  <div className="flex items-center gap-1 text-cyan-400">
                                    <CreditCard size={10} /> {log.details.plan}
                                  </div>
                                )}
                                {log.details.searchTerm && (
                                  <div className="flex items-center gap-1 text-yellow-400 truncate">
                                    <Search size={10} /> "{log.details.searchTerm}"
                                  </div>
                                )}
                                {log.details.filter && (
                                  <div className="flex items-center gap-1 text-blue-400">
                                    <Filter size={10} /> {log.details.filter}
                                  </div>
                                )}
                                {log.details.userId && (
                                  <div className="font-mono text-[10px] text-gray-400">
                                    User ID: {log.details.userId}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-600 text-xs">—</span>
                            )}
                          </div>
                        </td>
                        
                        <td className="p-4">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1 text-gray-400 text-xs">
                              <Clock size={12} />
                              {formatRelativeTime(log.createdAt || log.timestamp)}
                            </div>
                            <div className="mt-1 text-[10px] text-gray-500">
                              {formatDate(log.createdAt || log.timestamp)}
                            </div>
                          </div>
                        </td>
                        
                        <td className="p-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLog(log);
                            }}
                            className="bg-white/10 hover:bg-white/20 p-1.5 rounded-lg transition-all"
                            title="View details"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.total > 0 && (
            <div className="flex flex-wrap justify-between items-center gap-4 p-4 border-white/10 border-t">
              <div className="text-gray-400 text-sm">
                Showing {((pagination.page - 1) * ITEMS_PER_PAGE) + 1} to{' '}
                {Math.min(pagination.page * ITEMS_PER_PAGE, pagination.total)} of {pagination.total} logs
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="bg-white/10 hover:bg-white/20 disabled:opacity-50 p-2 rounded-lg"
                >
                  <ChevronLeft size={20} />
                </button>
                
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    let pageNum;
                    if (pagination.pages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= pagination.pages - 2) {
                      pageNum = pagination.pages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-sm transition-all ${
                          page === pageNum
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
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages}
                  className="bg-white/10 hover:bg-white/20 disabled:opacity-50 p-2 rounded-lg"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* نافذة تفاصيل السجل */}
      <AnimatePresence>
        {selectedLog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedLog(null)}
            className="z-50 fixed inset-0 flex justify-center items-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="top-0 sticky bg-gradient-to-r from-purple-600 to-pink-600 p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const details = getActionDetails(selectedLog.action);
                      const Icon = details.icon;
                      return (
                        <div className={`p-1.5 rounded-lg ${details.bg}`}>
                          <Icon size={18} className={details.color} />
                        </div>
                      );
                    })()}
                    <h3 className="font-bold text-lg">Log Details</h3>
                  </div>
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="bg-white/10 hover:bg-white/20 p-1.5 rounded-lg transition-all"
                  >
                    <X size={18} />
                  </button>
                </div>
                <p className="mt-1 text-white/70 text-xs">
                  ID: {selectedLog._id || selectedLog.id}
                </p>
              </div>
              
              {/* Content */}
              <div className="space-y-4 p-6">
                {/* Action */}
                <div className="bg-white/5 p-4 rounded-xl">
                  <label className="block mb-2 text-gray-400 text-xs uppercase tracking-wider">Action</label>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const details = getActionDetails(selectedLog.action);
                      const Icon = details.icon;
                      return (
                        <div className={`p-1.5 rounded-lg ${details.bg}`}>
                          <Icon size={16} className={details.color} />
                        </div>
                      );
                    })()}
                    <span className="font-mono text-sm">{selectedLog.action}</span>
                  </div>
                </div>
                
                {/* Admin Info */}
                <div className="bg-white/5 p-4 rounded-xl">
                  <label className="block mb-2 text-gray-400 text-xs uppercase tracking-wider">Admin</label>
                  <div className="flex items-center gap-3">
                    <div className="flex justify-center items-center bg-purple-500/20 rounded-full w-10 h-10">
                      <span className="font-bold text-purple-400 text-lg">
                        {selectedLog.adminId?.email?.charAt(0)?.toUpperCase() || "A"}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{selectedLog.adminId?.email || "Unknown"}</p>
                      {selectedLog.adminId?.role !== undefined && (
                        <p className="text-gray-400 text-xs">
                          Role: {selectedLog.adminId?.role === 0 ? "Admin" : "User"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Target Info */}
                {selectedLog.targetId && (
                  <div className="bg-white/5 p-4 rounded-xl">
                    <label className="block mb-2 text-gray-400 text-xs uppercase tracking-wider">Target</label>
                    <div className="flex items-center gap-2">
                      <Target size={16} className="text-gray-500" />
                      <span className="font-mono text-sm break-all">{selectedLog.targetId}</span>
                      <button
                        onClick={() => handleCopy(selectedLog.targetId, "modal-target")}
                        className="ml-auto text-gray-400 hover:text-white transition-colors"
                      >
                        {copiedId === "modal-target" ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Request Details */}
                {(selectedLog.method || selectedLog.endpoint || selectedLog.ip) && (
                  <div className="bg-white/5 p-4 rounded-xl">
                    <label className="block mb-2 text-gray-400 text-xs uppercase tracking-wider">Request Details</label>
                    <div className="space-y-2">
                      {selectedLog.method && (
                        <div className="flex items-center gap-2">
                          <Server size={14} className="text-gray-500" />
                          <span className="text-sm">Method:</span>
                          <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${getMethodColor(selectedLog.method)}`}>
                            {selectedLog.method}
                          </span>
                        </div>
                      )}
                      {selectedLog.endpoint && (
                        <div className="flex items-center gap-2">
                          <Wifi size={14} className="text-gray-500" />
                          <span className="text-sm">Endpoint:</span>
                          <span className="font-mono text-gray-300 text-xs break-all">{selectedLog.endpoint}</span>
                        </div>
                      )}
                      {selectedLog.ip && (
                        <div className="flex items-center gap-2">
                          <Shield size={14} className="text-gray-500" />
                          <span className="text-sm">IP Address:</span>
                          <span className="font-mono text-xs">{selectedLog.ip}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Additional Details */}
                {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                  <div className="bg-white/5 p-4 rounded-xl">
                    <label className="block mb-2 text-gray-400 text-xs uppercase tracking-wider">Additional Details</label>
                    <pre className="bg-black/30 p-3 rounded-lg overflow-x-auto text-gray-300 text-xs">
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </div>
                )}
                
                {/* Timestamp */}
                <div className="bg-white/5 p-4 rounded-xl">
                  <label className="block mb-2 text-gray-400 text-xs uppercase tracking-wider">Timestamp</label>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-500" />
                    <span className="text-sm">{formatDate(selectedLog.createdAt || selectedLog.timestamp)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}