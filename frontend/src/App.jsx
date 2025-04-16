import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useEffect, useState } from "react";
import LoginPage from "./Pages/LoginPage";
import HomePage from "./Pages/HomePage";
import AuthCallback from "./Pages/AuthCallback";

const API_BASE = import.meta.env.VITE_API_BASE || "https://geospatial-ap-backend.onrender.com";

function App() {
  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const path = window.location.pathname;

    // Skip auth check if we're on the callback page to avoid redirect loops
    if (path === "/auth-callback") {
      console.log("On auth-callback page, skipping auth check");
      setLoading(false);
      return;
    }

    const checkAuth = async () => {
      try {
        console.log("Checking authentication status...");
        const token = localStorage.getItem("token");
        
        if (!token) {
          console.log("No token found in localStorage");
          setAuthenticated(false);
          setLoading(false);
          return;
        }

        console.log("Token found, validating with server...");
        
        const res = await fetch(`${API_BASE}/api/check-auth`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache"  // Prevent caching of auth responses
          },
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error(`Server returned ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        console.log("Auth check response:", data);
        
        setAuthenticated(data.authenticated);
        
        if (!data.authenticated) {
          console.log("Token invalid, removing from localStorage");
          localStorage.removeItem("token");
          setAuthError("Authentication expired or invalid");
        } else {
          console.log("User authenticated successfully");
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        setAuthError(err.message);
        localStorage.removeItem("token");
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Force re-check of authentication when local storage changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        console.log("Token changed in storage, updating auth state");
        window.location.reload();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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
        <Route path="/auth-callback" element={<AuthCallback />} />
        <Route
          path="/home"
          element={
            authenticated ? (
              <HomePage
                onLogout={() => {
                  localStorage.removeItem("token");
                  setAuthenticated(false);
                }}
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