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
import TokenDebugPage from "./Pages/TokenDebugPage"; // Add this new import

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";
const IS_PRODUCTION = import.meta.env.MODE === "production";

// Token storage utility from SamlCallback.jsx
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
  }
};

function App() {
  const [authenticated, setAuthenticated] = useState(null);
  const [allowed, setAllowed] = useState(true);
  const [authDebugInfo, setAuthDebugInfo] = useState({});

  useEffect(() => {
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
    
    try {
      console.log("Attempting to verify token");
      fetch(`${API_BASE}/api/check-auth`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => {
          console.log("Auth check response status:", res.status);
          return res.json();
        })
        .then((data) => {
          console.log("Auth check response data:", data);
          setAuthenticated(data.authenticated);
        })
        .catch((err) => {
          console.error("Auth check error:", err);
          // If force auth is enabled, still authenticate despite error
          if (forceAuth) {
            setAuthenticated(true);
          } else {
            setAuthenticated(false);
          }
        });
    } catch (e) {
      console.error("Error in auth check:", e);
      // If force auth is enabled, still authenticate despite error
      if (forceAuth) {
        setAuthenticated(true);
      } else {
        setAuthenticated(false);
      }
    }
  }, []);  

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
        
        <div style={{ marginTop: "20px", padding: "15px", background: "#f8f8f8", maxWidth: "600px" }}>
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
              <HomePage onLogout={() => setAuthenticated(false)} />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        {/* Debug route - always accessible */}
        <Route path="/debug" element={<TokenDebugPage />} />
        
        {/* Make SAML callback available regardless of auth state */}
        <Route path="/saml/callback" element={<SamlCallback />} />
      </Routes>
    </Router>
  );
}

export default App;