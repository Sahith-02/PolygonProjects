import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

// Helper function to store token using multiple methods
const storeTokenSecurely = (token) => {
  const storageSuccess = {
    localStorage: false,
    sessionStorage: false,
    cookie: false
  };
  
  // Try localStorage
  try {
    localStorage.setItem("token", token);
    localStorage.setItem("force_auth", "true");
    storageSuccess.localStorage = true;
  } catch (e) {
    console.error("localStorage storage failed:", e);
  }
  
  // Try sessionStorage as fallback
  try {
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("force_auth", "true");
    storageSuccess.sessionStorage = true;
  } catch (e) {
    console.error("sessionStorage storage failed:", e);
  }
  
  // Try cookies as another fallback (works across page reloads)
  try {
    document.cookie = `token=${token}; path=/; max-age=36000; SameSite=Lax`;
    document.cookie = `force_auth=true; path=/; max-age=36000; SameSite=Lax`;
    storageSuccess.cookie = true;
  } catch (e) {
    console.error("Cookie storage failed:", e);
  }
  
  return storageSuccess;
};

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
      // Add the token to the window object first
      try {
        window.authToken = token;
        window.forceAuth = true;
        console.log("Token stored in window object");
      } catch (e) {
        console.error("Window object storage error:", e);
      }
      
      // Store the token using our helper function
      const storageResults = storeTokenSecurely(token);
      
      console.log("Storage results:", storageResults);
      
      if (Object.values(storageResults).some(success => success)) {
        // At least one storage method worked
        console.log("Token stored through at least one method");
        
        // Create a hidden form to POST the token to the home page
        // This is a fallback method if all else fails
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/home';
        form.style.display = 'none';
        
        const tokenInput = document.createElement('input');
        tokenInput.type = 'hidden';
        tokenInput.name = 'token';
        tokenInput.value = token;
        
        form.appendChild(tokenInput);
        document.body.appendChild(form);
        
        // Wait a bit then redirect in different ways
        setTimeout(() => {
          try {
            // Method 1: Navigate using React Router
            navigate('/home', { state: { token, forceAuth: true } });
            
            // Method 2: Direct page load after a short delay
            setTimeout(() => {
              window.location.href = "/home?token=" + encodeURIComponent(token);
            }, 500);
            
            // Method 3: Submit the form as a last resort
            setTimeout(() => {
              try {
                form.submit();
              } catch (e) {
                console.error("Form submission error:", e);
              }
            }, 1000);
          } catch (e) {
            console.error("Navigation error:", e);
            // Force reload as last resort
            window.location.reload();
          }
        }, 500);
      } else {
        setError("Failed to store authentication token. Please try again or contact support.");
        setLoading(false);
        setTimeout(() => navigate("/"), 5000);
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
      {/* Debug info section */}
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