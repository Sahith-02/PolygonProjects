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
      
      // Also try a different SameSite setting for cross-origin scenarios
      try {
        document.cookie = `token=${token}; path=/; max-age=36000; SameSite=None; Secure`;
        if (additionalData.forceAuth) {
          document.cookie = `force_auth=true; path=/; max-age=36000; SameSite=None; Secure`;
        }
      } catch (e) {
        console.warn("Could not set SameSite=None cookie:", e);
      }
      
      results.methods.cookies = true;
      results.success = true;
    } catch (e) {
      console.error("Cookie error:", e);
      results.methods.cookies = false;
    }
    
    return results;
  }
};

export default function SamlCallback() {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [storageResults, setStorageResults] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleToken = async () => {
      // Get token from URL parameters
      const token = searchParams.get("token");
      const error = searchParams.get("error");
      const errorMsg = searchParams.get("message");
      
      console.log("SAML Callback - Token present:", !!token);
      
      if (error) {
        setError(errorMsg || "Authentication failed. Please try again.");
        setLoading(false);
        setTimeout(() => navigate("/"), 3000);
        return;
      }
      
      if (!token) {
        setError("No authentication token received. Please try again.");
        setLoading(false);
        setTimeout(() => navigate("/"), 3000);
        return;
      }
      
      // Store token with our utility
      const results = TokenStorage.storeToken(token, { forceAuth: true });
      setStorageResults(results);
      
      if (results.success) {
        console.log("Token stored successfully with methods:", results.methods);
        
        // Display success briefly then redirect
        setLoading(false);
        setTimeout(() => {
          // Force a page reload to ensure the app recognizes the new auth state
          window.location.href = '/home';
        }, 1500);
      } else {
        console.error("Failed to store token with any method");
        setError("Failed to store authentication token. Please try direct login.");
        setLoading(false);
        setTimeout(() => navigate("/"), 3000);
      }
    };
    
    handleToken();
  }, [searchParams, navigate]);

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      flexDirection: "column",
      textAlign: "center",
      padding: "20px",
      fontFamily: "Arial, sans-serif"
    }}>
      {loading ? (
        <div className="loading-message">
          <h2>Processing Authentication...</h2>
          <p>Please wait while we complete your login.</p>
          <div style={{ marginTop: "20px", width: "50px", height: "50px", border: "5px solid #f3f3f3", 
                         borderTop: "5px solid #3498db", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : error ? (
        <div className="error-message" style={{ color: "red" }}>
          <h2>Authentication Error</h2>
          <p>{error}</p>
          <p>Redirecting to login page shortly...</p>
        </div>
      ) : (
        <div className="success-message" style={{ color: "green" }}>
          <h2>Authentication Successful</h2>
          <p>You're being logged in now...</p>
        </div>
      )}
      
      {/* Debug information - only shown when authentication has started */}
      {(storageResults || error) && (
        <div style={{ 
          marginTop: "20px", 
          padding: "15px", 
          border: "1px solid #ccc", 
          backgroundColor: "#f8f8f8", 
          maxWidth: "800px", 
          width: "90%",
          maxHeight: "200px",
          overflow: "auto",
          fontSize: "12px",
          textAlign: "left"
        }}>
          <h4>Debug Information:</h4>
          <p><strong>Token Present:</strong> {searchParams.get("token") ? "Yes" : "No"}</p>
          <p><strong>Error:</strong> {searchParams.get("error") || "None"}</p>
          
          {storageResults && (
            <>
              <h5>Storage Results:</h5>
              <pre>{JSON.stringify(storageResults, null, 2)}</pre>
            </>
          )}
        </div>
      )}
    </div>
  );
}