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
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      
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
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        const data = await response.json();
        setAuthenticated(data.authenticated);
        if (!data.authenticated) {
          localStorage.removeItem("token");
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        localStorage.removeItem("token");
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
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