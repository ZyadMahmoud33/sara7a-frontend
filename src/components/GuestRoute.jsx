// frontend/src/components/GuestRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useState, useEffect } from "react";

// ================================
// 🛠 HELPERS
// ================================
const isTokenValid = (token) => {
  if (!token) return false;
  
  try {
    const decoded = jwtDecode(token);
    if (!decoded?.exp) return false;
    
    return decoded.exp * 1000 > Date.now();
  } catch {
    return false;
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
};

const decodeRoleFromToken = (token) => {
  try {
    const decoded = jwtDecode(token);
    
    if (decoded.role === 0 || decoded.role === "admin" || decoded.role === "Admin") {
      return 0;
    }
    if (decoded.role === 1 || decoded.role === "user" || decoded.role === "User") {
      return 1;
    }
    
    if (decoded.adminLevel === 0) {
      return 0;
    }
    
    return 1;
  } catch {
    return null;
  }
};

// ================================
// 🚪 GUEST ROUTE
// ================================
export default function GuestRoute({ children, redirectTo = null }) {
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [redirectPath, setRedirectPath] = useState(null);

  const accessToken = localStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");

  useEffect(() => {
    const determineRedirect = async () => {
      // ❌ No tokens → allow access
      if (!accessToken && !refreshToken) {
        setChecking(false);
        setRedirectPath(null);
        return;
      }

      // 🔁 Has refresh token but no access token
      if (!accessToken && refreshToken) {
        setChecking(false);
        setRedirectPath(null);
        return;
      }

      // ❌ Access token expired and no refresh token
      if (accessToken && !isTokenValid(accessToken) && !refreshToken) {
        clearAuth();
        setChecking(false);
        setRedirectPath(null);
        return;
      }

      // ✅ Valid access token → user is logged in
      if (accessToken && isTokenValid(accessToken)) {
        const role = decodeRoleFromToken(accessToken);
        
        if (redirectTo) {
          setRedirectPath(redirectTo);
        } else {
          setRedirectPath(role === 0 ? "/admin" : "/dashboard");
        }
        setChecking(false);
        return;
      }

      // Default: allow access
      setChecking(false);
      setRedirectPath(null);
    };

    determineRedirect();
  }, [accessToken, refreshToken, redirectTo]);

  // Show loading while checking auth status
  if (checking) {
    return (
      <div className="flex flex-col justify-center items-center bg-gradient-to-br from-gray-900 via-black to-gray-900 min-h-screen">
        <div className="border-4 border-purple-500 border-t-transparent rounded-full w-10 h-10 animate-spin" />
        <p className="mt-4 text-gray-400 text-sm">Checking authentication...</p>
      </div>
    );
  }

  // Redirect if user is logged in
  if (redirectPath) {
    return (
      <Navigate
        to={redirectPath}
        state={{ from: location, message: "You are already logged in" }}
        replace
      />
    );
  }

  // User is not logged in, show the guest page
  return children;
}

// ================================
// 🧪 HELPER: CHECK IF USER IS GUEST
// ================================
export const useGuestStatus = () => {
  const [isGuest, setIsGuest] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkGuestStatus = () => {
      const token = localStorage.getItem("accessToken");
      const isValid = token && isTokenValid(token);
      
      setIsGuest(!isValid);
      setLoading(false);
    };
    
    checkGuestStatus();
    
    window.addEventListener("authChange", checkGuestStatus);
    window.addEventListener("storage", checkGuestStatus);
    
    return () => {
      window.removeEventListener("authChange", checkGuestStatus);
      window.removeEventListener("storage", checkGuestStatus);
    };
  }, []);
  
  return { isGuest, loading };
};

// ================================
// 🧪 HELPER: REDIRECT AUTHENTICATED USERS
// ================================
export const RedirectIfAuthenticated = ({ children, fallbackPath = "/dashboard" }) => {
  const token = localStorage.getItem("accessToken");
  const isValid = token && isTokenValid(token);
  
  if (isValid) {
    return <Navigate to={fallbackPath} replace />;
  }
  
  return children;
};