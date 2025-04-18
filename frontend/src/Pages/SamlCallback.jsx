import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function SamlCallback() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("Loading...");
  const navigate = useNavigate();

  useEffect(() => {
    // Extract token from URL
    const token = searchParams.get("token");
    const error = searchParams.get("error");
    const errorMsg = searchParams.get("message");
    
    console.log("SAML Callback - Token present:", !!token);

    if (error) {
      setStatus(`Error: ${errorMsg || "Authentication failed"}`);
      setTimeout(() => navigate("/"), 3000);
      return;
    }

    if (!token) {
      setStatus("Error: No authentication token received");
      setTimeout(() => navigate("/"), 3000);
      return;
    }
    
    try {
      // Store token in localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("force_auth", "true");
      console.log("Token stored successfully in localStorage");
      
      // Also try sessionStorage as backup
      try {
        sessionStorage.setItem("token", token);
        sessionStorage.setItem("force_auth", "true");
      } catch (e) {
        console.warn("Could not store in sessionStorage:", e);
      }
      
      // Also try cookies as backup
      try {
        document.cookie = `token=${token}; path=/; max-age=36000; SameSite=Lax`;
        document.cookie = `force_auth=true; path=/; max-age=36000; SameSite=Lax`;
      } catch (e) {
        console.warn("Could not set cookies:", e);
      }
      
      setStatus("Authentication successful! Redirecting...");
      
      // Redirect to home page
      setTimeout(() => {
        navigate('/home');
      }, 1000);
      
    } catch (e) {
      console.error("Error storing token:", e);
      setStatus(`Error storing token: ${e.message}`);
      setTimeout(() => navigate("/"), 3000);
    }
  }, [searchParams, navigate]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      textAlign: "center",
      padding: "20px",
      fontFamily: "Arial, sans-serif"
    }}>
      <h2>SAML Authentication</h2>
      <p>{status}</p>
      
      {status.includes("Error") ? (
        <div style={{ color: "red", marginTop: "20px" }}>
          <p>Redirecting to login page...</p>
        </div>
      ) : (
        <div style={{ marginTop: "20px" }}>
          <div style={{ 
            width: "40px", 
            height: "40px", 
            border: "5px solid #f3f3f3",
            borderTop: "5px solid #3498db", 
            borderRadius: "50%", 
            animation: "spin 1s linear infinite" 
          }}></div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
      
      {/* Debug information */}
      <div style={{ 
        marginTop: "40px", 
        padding: "15px", 
        backgroundColor: "#f8f8f8", 
        border: "1px solid #ddd",
        borderRadius: "4px",
        maxWidth: "600px", 
        width: "90%",
        textAlign: "left",
        fontSize: "12px" 
      }}>
        <h4>Debug Information:</h4>
        <p><strong>Token Present:</strong> {searchParams.get("token") ? "Yes" : "No"}</p>
        <p><strong>Token Length:</strong> {searchParams.get("token")?.length || 0}</p>
        <p><strong>Error:</strong> {searchParams.get("error") || "None"}</p>
        <p><strong>localStorage Available:</strong> {typeof window.localStorage !== 'undefined' ? 'Yes' : 'No'}</p>
        <p><strong>sessionStorage Available:</strong> {typeof window.sessionStorage !== 'undefined' ? 'Yes' : 'No'}</p>
        <p><strong>Cookies Enabled:</strong> {navigator.cookieEnabled ? 'Yes' : 'No'}</p>
      </div>
    </div>
  );
}