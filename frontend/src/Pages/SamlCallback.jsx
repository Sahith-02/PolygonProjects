import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function SamlCallback() {
    const [searchParams] = useSearchParams();
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [debugInfo, setDebugInfo] = useState({});
    const navigate = useNavigate();
  
    useEffect(() => {
      // Capture all important info
      const token = searchParams.get("token");
      const error = searchParams.get("error");
      const errorMsg = searchParams.get("message");
      
      console.log("SAML Callback - Token present:", !!token);
      
      // Store debug info
      setDebugInfo({
        hasToken: !!token,
        tokenLength: token ? token.length : 0,
        error: error || "none",
        errorMsg: errorMsg || "none",
        url: window.location.href
      });
  
      if (error) {
        setError(errorMsg || "Authentication failed. Please try again.");
        setLoading(false);
        setTimeout(() => navigate("/"), 5000);
        return;
      }
  
      if (token) {
        // Store the token and redirect to home
        try {
          // Clear existing token first
          localStorage.removeItem("token");
          
          // Add a small delay before setting the token
          setTimeout(() => {
            try {
              localStorage.setItem("token", token);
              console.log("Token stored successfully:", token.substring(0, 10) + "...");
              
              // Force auth flag to bypass token verification
              localStorage.setItem("force_auth", "true");
              
              // Reload the page instead of navigating to ensure App.jsx re-checks auth
              window.location.href = "/home";
            } catch (innerErr) {
              console.error("Inner token storage error:", innerErr);
              setError("Error storing token (inner): " + innerErr.message);
              setLoading(false);
            }
          }, 300);
        } catch (e) {
          console.error("Outer token storage error:", e);
          setError("Error storing token (outer): " + e.message);
          setLoading(false);
        }
      } else {
        setError("No authentication token received. Please try again.");
        setLoading(false);
        setTimeout(() => navigate("/"), 5000);
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
        {/* Always show debug info */}
        <div style={{ marginBottom: "20px", padding: "15px", border: "1px solid #ccc", backgroundColor: "#f8f8f8" }}>
          <h3>Debug Information</h3>
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
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