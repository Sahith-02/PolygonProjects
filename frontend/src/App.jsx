import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useEffect, useState } from "react";
import LoginPage from "./Pages/LoginPage";
import HomePage from "./Pages/HomePage";

const API_BASE =
  import.meta.env.VITE_API_BASE || "https://geospatial-ap-backend.onrender.com";

function App() {
  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);

  // Handle SSO token from URL (https://...?token=XYZ)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromURL = urlParams.get("token");

    if (tokenFromURL) {
      console.log("✅ Token found in URL");
      localStorage.setItem("token", tokenFromURL);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setAuthenticated(false);
      setLoading(false);
      return;
    }

    fetch(`${API_BASE}/api/check-auth`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setAuthenticated(data.authenticated);
        if (!data.authenticated) localStorage.removeItem("token");
      })
      .catch(() => {
        localStorage.removeItem("token");
        setAuthenticated(false);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <h2>Loading application...</h2>
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
          path="/auth-callback"
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
