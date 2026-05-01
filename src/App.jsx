// frontend/src/App.jsx
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";
import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { Toaster } from "react-hot-toast";

// Pages - Auth
import Login from "./pages/auth/login";
import Register from "./pages/auth/Register";
import ConfirmEmail from "./pages/auth/ConfirmEmail";
import ForgetPassword from "./pages/auth/ForgetPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// Pages - App (User)
import Dashboard from "./pages/app/Dashboard";
import Messages from "./pages/app/Messages";
import PublicProfile from "./pages/app/PublicProfile";
import Premium from "./pages/app/Premium";
import PaymentSuccess from "./pages/app/PaymentSuccess";
import ProfileSettings from "./pages/app/ProfileSettings"; // ✅ أضفنا هذا

// Pages - Admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLogs from "./pages/admin/AdminLogs";

// Guards
import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/GuestRoute";

// =========================
// 🧠 VALIDATE OBJECT ID
// =========================
const isValidId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

// =========================
// 🧩 PROFILE WRAPPER
// =========================
const PublicProfileWrapper = () => {
  const { userId, username } = useParams();

  // Check if we have a valid ID or username
  if (userId && !isValidId(userId) && !username) {
    return <Navigate to="/" replace />;
  }

  return <PublicProfile />;
};

// =========================
// 🔥 DECODE TOKEN SAFE
// =========================
const getUserFromToken = (token) => {
  try {
    if (!token) return null;

    const decoded = jwtDecode(token);

    // Check if expired
    if (decoded.exp * 1000 < Date.now()) {
      localStorage.clear();
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
};

// =========================
// 🔥 GET REDIRECT PATH BASED ON ROLE
// =========================
const getRedirectPath = (token) => {
  const user = getUserFromToken(token);

  if (!user) return "/login";

  // Role 0 = Admin, Role 1 = User
  return user.role === 0 ? "/admin" : "/dashboard";
};

// =========================
// 🧪 CHECK IF ADMIN
// =========================
const isAdmin = (token) => {
  const user = getUserFromToken(token);
  return user?.role === 0;
};

// =========================
// 🧪 CHECK IF AUTHENTICATED
// =========================
const isAuthenticated = (token) => {
  return !!token && getUserFromToken(token) !== null;
};

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("accessToken"));
  const [authChecked, setAuthChecked] = useState(false);

  // =========================
  // 🔄 SYNC AUTH STATE WITH STORAGE
  // =========================
  useEffect(() => {
    const syncAuth = () => {
      const newToken = localStorage.getItem("accessToken");
      setToken(newToken);
      setAuthChecked(true);
    };

    // Initial check
    syncAuth();

    // Listen for storage events (when token changes in another tab)
    window.addEventListener("storage", syncAuth);
    
    // Listen for focus events (when tab becomes active)
    window.addEventListener("focus", syncAuth);
    
    // Custom event for login/logout
    window.addEventListener("authChange", syncAuth);

    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("focus", syncAuth);
      window.removeEventListener("authChange", syncAuth);
    };
  }, []);

  // Helper to trigger auth change event
  const triggerAuthChange = () => {
    window.dispatchEvent(new Event("authChange"));
  };

  // Make triggerAuthChange available globally for logout/login
  useEffect(() => {
    window.triggerAuthChange = triggerAuthChange;
    return () => {
      delete window.triggerAuthChange;
    };
  }, []);

  return (
    <BrowserRouter>
      {/* Toast Notifications */}
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          duration: 4000,
          style: {
            background: "#1f2937",
            color: "#fff",
            borderRadius: "12px",
            padding: "12px 16px",
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: "#10b981",
              secondary: "#fff",
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />

      <Routes>
        {/* 🏠 ROOT - Redirect based on auth status */}
        <Route
          path="/"
          element={<Navigate to={getRedirectPath(token)} replace />}
        />

        {/* 🔓 PUBLIC AUTH ROUTES (Guest only) */}
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />

        <Route
          path="/register"
          element={
            <GuestRoute>
              <Register />
            </GuestRoute>
          }
        />

        <Route
          path="/confirm-email"
          element={
            <GuestRoute>
              <ConfirmEmail />
            </GuestRoute>
          }
        />

        <Route
          path="/forget-password"
          element={
            <GuestRoute>
              <ForgetPassword />
            </GuestRoute>
          }
        />

        <Route
          path="/reset-password"
          element={
            <GuestRoute>
              <ResetPassword />
            </GuestRoute>
          }
        />

        {/* 👤 PUBLIC PROFILE (Anyone can view) */}
        <Route path="/profile/:userId" element={<PublicProfileWrapper />} />
        <Route path="/profile/:username" element={<PublicProfileWrapper />} />
        <Route path="/u/:username" element={<PublicProfileWrapper />} />

        {/* 🔒 USER ROUTES (Authenticated only) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          }
        />

        <Route
          path="/premium"
          element={
            <ProtectedRoute>
              <Premium />
            </ProtectedRoute>
          }
        />

        <Route
          path="/payment-success"
          element={
            <ProtectedRoute>
              <PaymentSuccess />
            </ProtectedRoute>
          }
        />

        {/* ✅ PROFİLE SETTINGS (New Route) */}
        <Route
          path="/profile-settings"
          element={
            <ProtectedRoute>
              <ProfileSettings />
            </ProtectedRoute>
          }
        />

        {/* 👑 ADMIN ROUTES (Admin only) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/logs"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminLogs />
            </ProtectedRoute>
          }
        />

        {/* ❌ 404 - Catch all */}
        <Route path="*" element={<Navigate to={getRedirectPath(token)} replace />} />
      </Routes>
    </BrowserRouter>
  );
}