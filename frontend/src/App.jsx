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

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";
const IS_PRODUCTION = import.meta.env.MODE === "production";

function App() {
  const [authenticated, setAuthenticated] = useState(null);
  const [allowed, setAllowed] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const forceAuth = localStorage.getItem("force_auth");
    console.log("Auth check - token exists:", !!token);
    
    if (forceAuth === "true") {
      console.log("Force auth enabled, bypassing check");
      setAuthenticated(true);
      return;
    }
    
    if (!token) {
      console.log("No token found in localStorage, setting authenticated=false");
      setAuthenticated(false);
      return;
    }
    
    // if (window.innerWidth < 1024) {
    //   setAllowed(false);
    // }

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
          setAuthenticated(false);
        });
    } catch (e) {
      console.error("Error in auth check:", e);
      setAuthenticated(false);
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
          element={
            authenticated ? (
              <HomePage onLogout={() => setAuthenticated(false)} />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        {/* Make SAML callback available regardless of auth state */}
        <Route path="/saml/callback" element={<SamlCallback />} />
      </Routes>
    </Router>
  );
}

export default App;