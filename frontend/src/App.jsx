import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useEffect, useState } from "react";
import LoginPage from "./Pages/LoginPage";
import HomePage from "./Pages/HomePage";


const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";
const IS_PRODUCTION = import.meta.env.MODE === "production";

// Enhanced token storage utility
const TokenStorage = {
  getToken: () => {
    // Try localStorage first
    const localStorageToken = localStorage.getItem("token");
    if (localStorageToken) return localStorageToken;

    // Try sessionStorage
    const sessionStorageToken = sessionStorage.getItem("token");
    if (sessionStorageToken) return sessionStorageToken;

    // Try cookies
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split("=");
      if (name === "token" && value) return value;
    }

    return null;
  },

  isForceAuthEnabled: () => {
    return (
      localStorage.getItem("force_auth") === "true" ||
      sessionStorage.getItem("force_auth") === "true" ||
      document.cookie
        .split(";")
        .some((c) => c.trim().startsWith("force_auth=true"))
    );
  },

  clearToken: () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("force_auth");
    } catch (e) {
      console.error("Error clearing localStorage:", e);
    }

    try {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("force_auth");
    } catch (e) {
      console.error("Error clearing sessionStorage:", e);
    }

    try {
      document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie =
        "force_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    } catch (e) {
      console.error("Error clearing cookies:", e);
    }
  },
};

function App() {
  const [authenticated, setAuthenticated] = useState(null);
  const [allowed, setAllowed] = useState(true);
  const [authDebugInfo, setAuthDebugInfo] = useState({});

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = () => {
    const token = TokenStorage.getToken();
    const forceAuth = TokenStorage.isForceAuthEnabled();
    
    // Store debug info
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
      cookies: document.cookie
    });
    
    console.log("Auth check - token exists:", !!token);
    console.log("Force auth enabled:", forceAuth);
    
    if (forceAuth && token) {
      console.log("Force auth enabled, bypassing check");
      setAuthenticated(true);
      return;
    }
    
    if (!token) {
      console.log("No token found, setting authenticated=false");
      setAuthenticated(false);
      return;
    }
    
    // Verify token with backend
    fetch(`${API_BASE}/api/check-auth`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Auth check response:", data);
        if (data.authenticated) {
          setAuthenticated(true);
        } else {
          // If token is invalid, clear it and set unauthenticated
          TokenStorage.clearToken();
          setAuthenticated(false);
        }
      })
      .catch((err) => {
        console.error("Auth check error:", err);
        // If force auth is enabled, still authenticate despite error
        if (forceAuth) {
          setAuthenticated(true);
        } else {
          TokenStorage.clearToken();
          setAuthenticated(false);
        }
      });
  };

  const handleLogin = () => {
    setAuthenticated(true);
  };

  const handleLogout = () => {
    console.log("Logout handler in App.jsx called");
    
    // Clear all tokens and auth flags
    TokenStorage.clearToken();
    
    // Also check if this is an SSO session and need to logout from OneLogin
    const useSaml = IS_PRODUCTION && localStorage.getItem("useSaml") === "true";
    
    // Update authenticated state
    setAuthenticated(false);
    
    // If using SAML/SSO in production, redirect to SAML logout endpoint
    if (useSaml && IS_PRODUCTION) {
      console.log("Redirecting to SAML logout endpoint");
      window.location.href = `${API_BASE}/api/auth/saml/logout`;
      return;
    }
    
    console.log("Logout successful");
  };

  if (!allowed) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          textAlign: "center",
        }}
      >
        <h2>This website is only available on desktops and laptops.</h2>
      </div>
    );
  }

  // Show loading state with more details and debug info
  if (authenticated === null) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          flexDirection: "column",
        }}
      >
        <p>Loading authentication state...</p>
        <p style={{ fontSize: "14px", color: "#666" }}>
          If you continue to see this screen, please try refreshing the page.
        </p>

        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            background: "#f8f8f8",
            maxWidth: "600px",
          }}
        >
          <h3>Auth Debug Info</h3>
          <pre>{JSON.stringify(authDebugInfo, null, 2)}</pre>
        </div>
      </div>
    );
  }

  console.log("Rendering routes with authenticated =", authenticated);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            authenticated ? (
              <Navigate to="/home" />
            ) : (
              <LoginPage 
                onLogin={handleLogin} 
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
       
      </Routes>
    </Router>
  );
}

export default App;