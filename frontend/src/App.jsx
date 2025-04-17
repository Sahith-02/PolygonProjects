import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useEffect, useState } from "react";
import LoginPage from "./Pages/LoginPage";
import HomePage from "./Pages/HomePage";
import SamlCallback from "./Pages/SamlCallback";
import TokenDebugPage from "./Pages/TokenDebugPage";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";
const IS_PRODUCTION = import.meta.env.MODE === "production";

// Token storage utility
const TokenStorage = {
  getToken: () => {
    // Try localStorage first
    const localStorageToken = localStorage.getItem("token");
    if (localStorageToken) return localStorageToken;
    
    // Try sessionStorage
    const sessionStorageToken = sessionStorage.getItem("token");
    if (sessionStorageToken) return sessionStorageToken;
    
    // Try cookies
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === "token" && value) return value;
      if (name === "token_alt" && value) return value;
    }
    
    // Try window variable
    if (window.AUTH_TOKEN) return window.AUTH_TOKEN;
    
    return null;
  },
  
  isForceAuthEnabled: () => {
    return (
      localStorage.getItem("force_auth") === "true" ||
      sessionStorage.getItem("force_auth") === "true" ||
      document.cookie.split(';').some(c => c.trim() === "force_auth=true") ||
      window.FORCE_AUTH === true
    );
  },
  
  clearToken: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("force_auth");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("force_auth");
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "token_alt=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "force_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    window.AUTH_TOKEN = null;
    window.FORCE_AUTH = false;
  }
};

function App() {
  const [authenticated, setAuthenticated] = useState(null);
  const [allowed, setAllowed] = useState(true);
  const [authDebugInfo, setAuthDebugInfo] = useState({});

  const checkAuthStatus = async (token, forceAuth) => {
    if (!token) {
      setAuthenticated(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/check-auth`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error("Auth check failed");
      
      const data = await response.json();
      setAuthenticated(data.authenticated);
    } catch (err) {
      console.error("Auth check error:", err);
      // If forceAuth is enabled, stay authenticated despite error
      setAuthenticated(forceAuth);
      if (!forceAuth) {
        toast.error("Session expired. Please login again.");
        TokenStorage.clearToken();
      }
    }
  };

  useEffect(() => {
    // Check if mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      setAllowed(false);
      return;
    }

    const token = TokenStorage.getToken();
    const forceAuth = TokenStorage.isForceAuthEnabled();

    // Update debug info
    setAuthDebugInfo({
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      forceAuth,
      localStorage: {
        token: !!localStorage.getItem("token"),
        forceAuth: localStorage.getItem("force_auth") === "true"
      },
      sessionStorage: {
        token: !!sessionStorage.getItem("token"),
        forceAuth: sessionStorage.getItem("force_auth") === "true"
      },
      cookies: document.cookie,
      currentPath: window.location.pathname
    });

    // Immediate auth if we have force_auth flag
    if (forceAuth && token) {
      console.log("Force auth enabled, bypassing check");
      setAuthenticated(true);
      return;
    }

    // If no token but we're on the callback route, wait
    if (!token && window.location.pathname.includes("/saml/callback")) {
      console.log("On SAML callback route, waiting for token");
      return;
    }

    // Normal auth check
    checkAuthStatus(token, forceAuth);
  }, []);

  const handleLogout = () => {
    TokenStorage.clearToken();
    setAuthenticated(false);
    if (IS_PRODUCTION) {
      window.location.href = `${API_BASE}/api/auth/saml/logout`;
    } else {
      toast.success("Logged out successfully");
    }
  };

  if (!allowed) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        textAlign: "center",
      }}>
        <h2>This website is only available on desktops and laptops.</h2>
      </div>
    );
  }

  // Show loading state with debug info
  if (authenticated === null) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        flexDirection: "column"
      }}>
        <p>Loading authentication state...</p>
        <p style={{ fontSize: "14px", color: "#666" }}>
          If you continue to see this screen, please try refreshing the page.
        </p>
        
        {process.env.NODE_ENV === "development" && (
          <div style={{ marginTop: "20px", padding: "15px", background: "#f8f8f8", maxWidth: "600px" }}>
            <h3>Auth Debug Info</h3>
            <pre>{JSON.stringify(authDebugInfo, null, 2)}</pre>
          </div>
        )}
      </div>
    );
  }

  return (
    <Router>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <Routes>
        <Route
          path="/"
          element={
            authenticated ? (
              <Navigate to="/home" />
            ) : (
              <LoginPage 
                onLogin={() => setAuthenticated(true)} 
                useSaml={IS_PRODUCTION}
              />
            )
          }
        />
        <Route
          path="/home"
          element={
            authenticated ? (
              <HomePage onLogout={handleLogout} />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        {/* Debug route - always accessible */}
        <Route path="/debug" element={<TokenDebugPage />} />
        
        {/* SAML callback route */}
        <Route path="/saml/callback" element={<SamlCallback />} />
        
        {/* Catch-all route */}
        <Route path="*" element={<Navigate to={authenticated ? "/home" : "/"} />} />
      </Routes>
    </Router>
  );
}

export default App;