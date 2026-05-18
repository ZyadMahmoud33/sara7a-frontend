// frontend/src/hooks/useAuth.js
import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

const isTokenValid = (token) => {
  if (!token) return false;
  try {
    const decoded = jwtDecode(token);
    return decoded?.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

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
        try {
          const decoded = jwtDecode(token);
          const role = decoded.role === 0 ? 0 : 1;
          setUserRole(role);
        } catch {
          setUserRole(null);
        }
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