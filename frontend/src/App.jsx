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

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";

function App() {
  const [authenticated, setAuthenticated] = useState(null);
  const [allowed, setAllowed] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const path = window.location.pathname;

    // Allow /auth-callback to render immediately without auth check
    if (path === "/auth-callback") {
      setLoading(false);
      return;
    }

    const checkAuthentication = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setAuthenticated(false);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/check-auth`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        if (!res.ok) throw new Error(`Server returned ${res.status}`);

        const data = await res.json();
        setAuthenticated(data.authenticated);

        if (!data.authenticated) {
          localStorage.removeItem("token");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        localStorage.removeItem("token");
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    if (window.innerWidth < 1024) {
      setAllowed(false);
      setLoading(false);
    } else {
      checkAuthentication();
    }

    const handleStorageChange = (e) => {
      if (e.key === "token") checkAuthentication();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  if (!allowed) {
    return (
      <div className="flex justify-center items-center h-screen text-center p-4">
        <div>
          <h2 className="text-xl font-bold">
            This website is only available on desktops and laptops.
          </h2>
          <p className="mt-2">
            Please access this site from a device with a larger screen.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4">Loading application...</p>
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
  );
}

export default App;
