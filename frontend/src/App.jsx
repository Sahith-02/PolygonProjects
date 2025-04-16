import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import LoginPage from "./Pages/LoginPage";
import HomePage from "./Pages/HomePage";
import AuthCallback from "./Pages/AuthCallback";

const API_BASE = import.meta.env.VITE_API_BASE || "https://geospatial-ap-backend.onrender.com";

function App() {
  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [user, setUser] = useState(null);

  // Create a reusable auth checking function
  const checkAuth = useCallback(async () => {
    try {
      console.log("Checking authentication status...");
      const token = localStorage.getItem("token");
      
      if (!token) {
        console.log("No token found in localStorage");
        setAuthenticated(false);
        setUser(null);
        setLoading(false);
        return false;
      }
  
      console.log("Token found, validating with server...");
      
      const res = await fetch(`${API_BASE}/api/check-auth`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache"
        }
      });
  
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}: ${res.statusText}`);
      }
  
      const data = await res.json();
      console.log("Auth check response:", data);
      
      if (data.authenticated && data.user) {
        setUser(data.user);
        setAuthenticated(true);
        console.log("User authenticated successfully:", data.user);
        return true;
      } else {
        console.log("Token invalid or expired, removing from localStorage");
        localStorage.removeItem("token");
        setAuthError("Authentication expired or invalid");
        setAuthenticated(false);
        setUser(null);
        return false;
      }
    } catch (err) {
      console.error("Auth check failed:", err);
      setAuthError(err.message);
      // Only remove token if there's a clear authentication error,
      // not for network errors which might be temporary
      if (err.message.includes("Authentication") || err.message.includes("token")) {
        localStorage.removeItem("token");
      }
      setAuthenticated(false);
      setUser(null);
      return false;
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);
  useEffect(() => {
    const path = window.location.pathname;

    // Skip auth check if we're on the callback page to avoid redirect loops
    if (path === "/auth-callback") {
      console.log("On auth-callback page, skipping initial auth check");
      setLoading(false);
      return;
    }

    checkAuth();
  }, [checkAuth]);

  // Listen for token changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        console.log("Token changed in storage, updating auth state");
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [checkAuth]);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await fetch(`${API_BASE}/api/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("token");
      setAuthenticated(false);
      setUser(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4">Loading app...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            authenticated ? (
              <Navigate to="/home" replace />
            ) : (
              <LoginPage 
                onLogin={() => setAuthenticated(true)} 
                authError={authError}
              />
            )
          }
        />
        <Route 
          path="/auth-callback" 
          element={<AuthCallback />} 
        />
        <Route
          path="/home"
          element={
            authenticated ? (
              <HomePage
                user={user}
                onLogout={handleLogout}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;