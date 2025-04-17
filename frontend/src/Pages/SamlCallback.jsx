import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

// Token storage utility with multiple fallbacks
const TokenStorage = {
  // Store token with all available methods
  storeToken: (token, additionalData = {}) => {
    const results = { success: false, methods: {} };
    
    // Try localStorage
    try {
      localStorage.setItem("token", token);
      if (additionalData.forceAuth) localStorage.setItem("force_auth", "true");
      results.methods.localStorage = true;
      results.success = true;
    } catch (e) {
      console.error("localStorage error:", e);
      results.methods.localStorage = false;
    }
    
    // Try sessionStorage
    try {
      sessionStorage.setItem("token", token);
      if (additionalData.forceAuth) sessionStorage.setItem("force_auth", "true");
      results.methods.sessionStorage = true;
      results.success = true;
    } catch (e) {
      console.error("sessionStorage error:", e);
      results.methods.sessionStorage = false;
    }
    
    // Try cookies with different approaches
    try {
      // Standard cookie
      document.cookie = `token=${token}; path=/; max-age=36000; SameSite=Lax`;
      if (additionalData.forceAuth) {
        document.cookie = `force_auth=true; path=/; max-age=36000; SameSite=Lax`;
      }
      
      // Also try a different SameSite setting
      document.cookie = `token_alt=${token}; path=/; max-age=36000; SameSite=None; Secure`;
      
      results.methods.cookies = true;
      results.success = true;
    } catch (e) {
      console.error("Cookie error:", e);
      results.methods.cookies = false;
    }
    
    // Create a global variable as last resort
    try {
      window.AUTH_TOKEN = token;
      window.FORCE_AUTH = additionalData.forceAuth;
      results.methods.window = true;
      results.success = true;
    } catch (e) {
      console.error("Window variable error:", e);
      results.methods.window = false;
    }
    
    return results;
  },
  
  // Get the token from any available source
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
  
  // Check if force auth is enabled
  isForceAuthEnabled: () => {
    return (
      localStorage.getItem("force_auth") === "true" ||
      sessionStorage.getItem("force_auth") === "true" ||
      document.cookie.split(';').some(c => c.trim() === "force_auth=true") ||
      window.FORCE_AUTH === true
    );
  }
};

export default function SamlCallback() {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [storageResults, setStorageResults] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Capture all important info
    const token = searchParams.get("token");
    const error = searchParams.get("error");
    const errorMsg = searchParams.get("message");
    
    console.log("SAML Callback - Token present:", !!token);

    if (error) {
      setError(errorMsg || "Authentication failed. Please try again.");
      setLoading(false);
      setTimeout(() => navigate("/"), 5000);
      return;
    }

    if (!token) {
      setError("No authentication token received. Please try again.");
      setLoading(false);
      setTimeout(() => navigate("/"), 5000);
      return;
    }
    
    // Store token with our utility
    const results = TokenStorage.storeToken(token, { forceAuth: true });
    setStorageResults(results);
    
    if (results.success) {
      console.log("Token stored successfully with methods:", results.methods);
      
      // Let's see if redirecting to debug page instead of home helps diagnose
      navigate(`/debug?token=${encodeURIComponent(token)}`);
      
      /* 
      // This is the original navigation that we'll eventually use
      setTimeout(() => {
        navigate('/home');
      }, 1000);
      */
    } else {
      console.error("Failed to store token with any method");
      setError("Failed to store token. Please try direct login.");
      setLoading(false);
    }
  }, [searchParams, navigate]);

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      flexDirection: "column",
      textAlign: "center",
      padding: "20px"
    }}>
      {/* Debug info section */}
      <div style={{ marginBottom: "20px", padding: "15px", border: "1px solid #ccc", backgroundColor: "#f8f8f8", maxWidth: "800px", width: "100%" }}>
        <h3>Debug Information</h3>
        <p><strong>Token Present:</strong> {searchParams.get("token") ? "Yes" : "No"}</p>
        <p><strong>Error:</strong> {searchParams.get("error") || "None"}</p>
        
        {storageResults && (
          <>
            <h4>Storage Results:</h4>
            <pre>{JSON.stringify(storageResults, null, 2)}</pre>
          </>
        )}
      </div>

      {loading ? (
        <div className="loading-message">
          <h2>Processing Authentication...</h2>
          <p>Please wait while we complete the authentication process.</p>
        </div>
      ) : error ? (
        <div className="error-message" style={{ color: "red" }}>
          <h2>Authentication Error</h2>
          <p>{error}</p>
          <p>Redirecting to login page in 5 seconds...</p>
        </div>
      ) : (
        <div className="success-message">
          <h2>Authentication Successful</h2>
          <p>Logging you in...</p>
        </div>
      )}
    </div>
  );
}