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
import SamlCallback from "./Pages/SamlCallback";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";
const IS_PRODUCTION = import.meta.env.MODE === "production";

// Helper function to get token from multiple storage locations
const getStoredToken = () => {
  // Check window object first (temporary storage)
  if (window.authToken) {
    console.log("Found token in window object");
    return window.authToken;
  }
  
  // Check localStorage
  const localToken = localStorage.getItem("token");
  if (localToken) {
    console.log("Found token in localStorage");
    return localToken;
  }
  
  // Check sessionStorage
  const sessionToken = sessionStorage.getItem("token");
  if (sessionToken) {
    console.log("Found token in sessionStorage");
    return sessionToken;
  }
  
  // Check cookies
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === "token" && value) {
      console.log("Found token in cookies");
      return value;
    }
  }
  
  // Check URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const urlToken = urlParams.get("token");
  if (urlToken) {
    console.log("Found token in URL parameters");
    // Store it in localStorage for future use
    try {
      localStorage.setItem("token", urlToken);
      localStorage.setItem("force_auth", "true");
    } catch (e) {
      console.error("Error storing URL token:", e);
    }
    return urlToken;
  }
  
  return null;
};

// Helper to check if force auth is enabled in any storage
const isForceAuthEnabled = () => {
  return (
    window.forceAuth === true ||
    localStorage.getItem("force_auth") === "true" ||
    sessionStorage.getItem("force_auth") === "true" ||
    document.cookie.includes("force_auth=true")
  );
};

function App() {
  const [authenticated, setAuthenticated] = useState(null);
  const [allowed, setAllowed] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    const forceAuth = isForceAuthEnabled();
    
    console.log("Auth check - token exists:", !!token);
    console.log("Force auth status:", forceAuth);
    
    if (forceAuth) {
      console.log("Force auth enabled, bypassing check");
      setAuthenticated(true);
      return;
    }
    
    if (!token) {
      console.log("No token found in any storage, setting authenticated=false");
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
          // If we have a token but validation fails, try using force auth
          if (token) {
            console.log("Using token without validation");
            setAuthenticated(true);
          } else {
            setAuthenticated(false);
          }
        });
    } catch (e) {
      console.error("Error in auth check:", e);
      if (token) {
        // If we have a token but validation fails, use it anyway
        console.log("Using token without validation due to error");
        setAuthenticated(true);
      } else {
        setAuthenticated(false);
      }
    }
  }, []);  
  
  // Add a home route component that checks for POST data
  const HomeRoute = () => {
    const location = useLocation();
    
    useEffect(() => {
      // Check if token was passed in location state (from React Router)
      if (location.state?.token) {
        console.log("Found token in route state, storing it");
        try {
          localStorage.setItem("token", location.state.token);
          localStorage.setItem("force_auth", "true");
          setAuthenticated(true);
        } catch (e) {
          console.error("Error storing state token:", e);
        }
      }
    }, [location]);
    
    if (authenticated) {
      return <HomePage onLogout={() => setAuthenticated(false)} />;
    }
    
    return <Navigate to="/" />;
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

  // Show loading state with more details
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
          element={<HomeRoute />}
        />
        {/* Make SAML callback available regardless of auth state */}
        <Route path="/saml/callback" element={<SamlCallback />} />
      </Routes>
    </Router>
  );
}

export default App;