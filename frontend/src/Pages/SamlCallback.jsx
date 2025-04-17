import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function SamlCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");
    const errorMsg = searchParams.get("message");

    if (error) {
      console.error("SAML Error:", errorMsg || error);
      setError(errorMsg || "Authentication failed");
      setLoading(false);
      toast.error("SAML authentication failed");
      setTimeout(() => navigate("/"), 3000);
      return;
    }

    if (!token) {
      console.error("No token received in SAML callback");
      setError("No authentication token received");
      setLoading(false);
      toast.error("Authentication token missing");
      setTimeout(() => navigate("/"), 3000);
      return;
    }

    // Store token using multiple methods
    try {
      // Primary method - localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("force_auth", "true");
      
      // Fallback methods
      sessionStorage.setItem("token", token);
      document.cookie = `token=${token}; path=/; max-age=36000; SameSite=Lax`;
      document.cookie = `token_alt=${token}; path=/; max-age=36000; SameSite=None; Secure`;
      
      console.log("Token stored successfully");
      navigate("/home");
    } catch (storageError) {
      console.error("Token storage failed:", storageError);
      setError("Failed to store authentication token");
      setLoading(false);
      toast.error("Authentication failed - storage error");
      setTimeout(() => navigate("/"), 3000);
    }
  }, [searchParams, navigate]);

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      flexDirection: "column"
    }}>
      {loading ? (
        <div>
          <h2>Completing Authentication...</h2>
          <p>Please wait while we log you in.</p>
        </div>
      ) : error ? (
        <div style={{ color: "red" }}>
          <h2>Error</h2>
          <p>{error}</p>
          <p>Redirecting to login page...</p>
        </div>
      ) : null}
    </div>
  );
}