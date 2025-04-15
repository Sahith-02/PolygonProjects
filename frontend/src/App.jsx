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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (window.location.pathname === "/auth-callback") {
      setLoading(false); // let AuthCallback render immediately
      return;
    }

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
    return <p>Loading...</p>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={authenticated ? <Navigate to="/home" replace /> : <LoginPage onLogin={() => setAuthenticated(true)} />} />
        <Route path="/home" element={authenticated ? <HomePage onLogout={() => { localStorage.removeItem("token"); setAuthenticated(false); }} /> : <Navigate to="/" replace />} />
        <Route path="/auth-callback" element={<AuthCallback />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
