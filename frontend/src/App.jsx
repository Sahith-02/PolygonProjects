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
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_BASE = import.meta.env.VITE_API_BASE || "https://geospatial-ap-backend.onrender.com";

function App() {
  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const syncAuthState = async () => {
      const token = localStorage.getItem("token");
      
      // Skip auth check if we're on callback route
      if (window.location.pathname === "/auth-callback") {
        setLoading(false);
        return;
      }
  
      if (!token) {
        setAuthenticated(false);
        setLoading(false);
        return;
      }
  
      try {
        const response = await fetch(`${API_BASE}/api/check-auth`, {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
  
        if (!response.ok) throw new Error('Auth check failed');
        
        const data = await response.json();
        setAuthenticated(data.authenticated);
      } catch (err) {
        console.error("Auth check error:", err);
        localStorage.removeItem("token");
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
  
    syncAuthState();
  
    // Add event listener for storage changes
    const handleStorageChange = (e) => {
      if (e.key === "token") {
        syncAuthState();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-lg font-bold">Loading application...</h2>
          <p>Checking authentication status</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              authenticated ? (
                <Navigate to="/home" replace />
              ) : (
                <LoginPage onLogin={() => setAuthenticated(true)} />
              )
            }
          />
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
          <Route path="/auth-callback" element={<AuthCallback />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      <ToastContainer position="top-center" autoClose={5000} />
    </>
  );
}

export default App;