import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function SamlCallback() {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("SamlCallback component mounted");
    const token = searchParams.get("token");
    const error = searchParams.get("error");
    console.log("Token present:", !!token);
    console.log("Error present:", !!error);
  
    if (token) {
      console.log("Storing token and navigating to home");
      localStorage.setItem("token", token);
      
      // Add a small delay to ensure localStorage is updated
      setTimeout(() => {
        navigate("/home");
        console.log("Navigation to /home attempted");
      }, 100);
    }
  }, [searchParams, navigate]);
  
  return (
    <div className="saml-callback-container" style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      flexDirection: "column",
      textAlign: "center",
      padding: "20px"
    }}>
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