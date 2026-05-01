// frontend/src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";

// ================================
// 🛠 TOKEN VALIDATION
// ================================
const isTokenValid = (token) => {
  if (!token) return false;

  try {
    const decoded = jwtDecode(token);
    if (!decoded.exp) return false;

    return decoded.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

// ================================
// 🧹 CLEAR AUTH
// ================================
const clearAuth = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("role");
  localStorage.removeItem("adminLevel");
  localStorage.removeItem("email");
  localStorage.removeItem("tempRegistration");
  localStorage.removeItem("rememberedEmail");
};

// ================================
// 🔓 DECODE ROLE FROM TOKEN
// ================================
const decodeRoleFromToken = (token) => {
  try {
    const decoded = jwtDecode(token);
    
    console.log("🔓 Decoded token:", decoded);
    
    if (decoded.role === 0 || decoded.role === "admin" || decoded.role === "Admin") {
      console.log("✅ Role detected as Admin (0)");
      return 0;
    }
    if (decoded.role === 1 || decoded.role === "user" || decoded.role === "User") {
      console.log("✅ Role detected as User (1)");
      return 1;
    }
    
    if (decoded.adminLevel === 0) {
      console.log("✅ Admin level detected as Super Admin (0)");
      return 0;
    }
    
    console.log("⚠️ Role defaulting to User (1)");
    return 1;
  } catch (error) {
    console.error("❌ Failed to decode token:", error);
    return null;
  }
};

// ================================
// 🔐 PROTECTED ROUTE
// ================================
export default function ProtectedRoute({
  children,
  adminOnly = false,
  requiredPlan = null,
}) {
  const location = useLocation();
  const [checking, setChecking] = useState(false);
  const [hasRequiredPlan, setHasRequiredPlan] = useState(true);

  const accessToken = localStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");
  const savedRole = localStorage.getItem("role");

  console.log("🛡️ ========== PROTECTED ROUTE ==========");
  console.log("🛡️ Path:", location.pathname);
  console.log("🛡️ adminOnly:", adminOnly);
  console.log("🛡️ accessToken exists:", !!accessToken);
  console.log("🛡️ refreshToken exists:", !!refreshToken);
  console.log("🛡️ saved role in localStorage:", savedRole);

  // ❌ NO TOKENS
  if (!accessToken && !refreshToken) {
    console.log("❌ No tokens found, redirecting to login");
    clearAuth();
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ❌ ACCESS TOKEN INVALID & NO REFRESH
  if (accessToken && !isTokenValid(accessToken) && !refreshToken) {
    console.log("❌ Access token invalid and no refresh token, redirecting to login");
    clearAuth();
    return <Navigate to="/login" replace />;
  }

  // ✅ ACCESS TOKEN INVALID BUT HAVE REFRESH (let interceptor handle it)
  if (accessToken && !isTokenValid(accessToken) && refreshToken) {
    console.log("⚠️ Access token invalid but refresh token exists, letting interceptor handle it");
  }

  // ❌ NO ACCESS TOKEN
  if (!accessToken) {
    console.log("❌ No access token, redirecting to login");
    clearAuth();
    return <Navigate to="/login" replace />;
  }

  // 🔓 DECODE ROLE
  let role = decodeRoleFromToken(accessToken);
  
  if (role === null) {
    console.log("❌ Failed to decode role, redirecting to login");
    clearAuth();
    return <Navigate to="/login" replace />;
  }

  console.log("👤 Decoded role from token:", role);
  localStorage.setItem("role", role);

  // 🔐 ADMIN ONLY CHECK
  if (adminOnly && role !== 0) {
    console.log("🚫 Admin only route but user is not admin (role=" + role + "), redirecting to dashboard");
    return <Navigate to="/dashboard" state={{ from: location, error: "Access denied. Admin only." }} replace />;
  }

  // 🔥 PREVENT ADMIN FROM USER ROUTES
  if (!adminOnly && role === 0) {
    console.log("👑 Admin detected in user route, redirecting to admin dashboard");
    return <Navigate to="/admin" replace />;
  }

  // 💎 PLAN REQUIREMENT CHECK (Optional)
  if (requiredPlan && !checking) {
    setChecking(true);
    
    const checkUserPlan = async () => {
      try {
        console.log("💰 Checking user plan for required plan:", requiredPlan);
        const { getProfileAPI } = await import("../api/user");
        const userData = await getProfileAPI();
        const userPlan = userData?.plan || "free";
        
        const planLevels = { free: 0, pro: 1, premium: 2 };
        const requiredLevel = planLevels[requiredPlan];
        const userLevel = planLevels[userPlan];
        
        console.log("📊 User plan:", userPlan, "Required level:", requiredLevel, "User level:", userLevel);
        
        if (userLevel < requiredLevel) {
          console.log("🚫 User does not have required plan");
          setHasRequiredPlan(false);
        } else {
          console.log("✅ User has required plan");
        }
      } catch (error) {
        console.error("Failed to check user plan:", error);
        setHasRequiredPlan(false);
      } finally {
        setChecking(false);
      }
    };
    
    checkUserPlan();
  }

  if (requiredPlan && checking) {
    console.log("⏳ Checking plan requirement, showing loader");
    return (
      <div className="flex flex-col justify-center items-center bg-gradient-to-br from-gray-900 via-black to-gray-900 min-h-screen">
        <div className="border-4 border-purple-500 border-t-transparent rounded-full w-12 h-12 animate-spin" />
        <p className="mt-4 text-gray-400">Verifying access...</p>
      </div>
    );
  }

  if (requiredPlan && !hasRequiredPlan) {
    console.log("🚫 Plan requirement not met, redirecting to premium");
    return <Navigate to="/premium" state={{ from: location, error: `This page requires ${requiredPlan} plan or higher.` }} replace />;
  }

  // ✅ ALL CHECKS PASSED
  console.log("✅ ALL CHECKS PASSED! Rendering protected content.");
  console.log("=====================================");
  return children;
}

// ================================
// 🧪 HELPER: CHECK AUTH STATUS
// ================================
export const useAuthStatus = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("accessToken");
      const isValid = token && isTokenValid(token);
      
      setIsAuthenticated(!!isValid);
      if (isValid) {
        const role = decodeRoleFromToken(token);
        setUserRole(role);
      } else {
        setUserRole(null);
      }
      setLoading(false);
    };
    
    checkAuth();
    
    window.addEventListener("authChange", checkAuth);
    window.addEventListener("storage", checkAuth);
    
    return () => {
      window.removeEventListener("authChange", checkAuth);
      window.removeEventListener("storage", checkAuth);
    };
  }, []);
  
  return { isAuthenticated, userRole, loading };
};

// ================================
// 🧪 HELPER: CHECK ADMIN STATUS
// ================================
export const useAdminStatus = () => {
  const { isAuthenticated, userRole, loading } = useAuthStatus();
  return {
    isAdmin: isAuthenticated && userRole === 0,
    loading,
  };
};