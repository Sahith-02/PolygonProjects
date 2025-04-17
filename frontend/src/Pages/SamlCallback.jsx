import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function SamlCallback() {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (error) {
      setError("Authentication failed. Please try again.");
      setTimeout(() => navigate("/"), 3000);
      return;
    }

    if (token) {
      // Store the token and redirect to home
      localStorage.setItem("token", token);
      navigate("/home");
    } else {
      setError("No authentication token received. Please try again.");
      setTimeout(() => navigate("/"), 3000);
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
      {error ? (
        <div className="error-message" style={{ color: "red" }}>
          <h2>Authentication Error</h2>
          <p>{error}</p>
          <p>Redirecting to login page...</p>
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