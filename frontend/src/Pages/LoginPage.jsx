import React, { useState, useEffect } from "react";
import "../styles/LoginPageCss.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState(null);

  const API_BASE = import.meta.env.VITE_API_BASE || "https://geospatial-ap-backend.onrender.com";

  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/status`, {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();
        setApiStatus({ status: "online", data });
        console.log("API Status:", data);
      } catch (err) {
        setApiStatus({
          status: "offline",
          error: err.message,
        });
        console.error("API Status check failed:", err);
      }
    };

    checkApiStatus();
  }, [API_BASE]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Login failed");
      }

      const data = await res.json();
      localStorage.setItem("token", data.token);
      toast.success("Login successful!");
      setTimeout(() => onLogin(), 1000);
    } catch (err) {
      toast.error(err.message || "Invalid login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSSOLogin = () => {
    setSsoLoading(true);
    // Clear any existing token
    localStorage.removeItem("token");
    
    // Generate return URL with cache-busting
    const returnTo = encodeURIComponent(
      `${window.location.origin}/auth-callback?t=${Date.now()}`
    );
    
    // Construct SAML URL
    const samlUrl = `${API_BASE}/api/auth/saml?returnTo=${returnTo}`;
    
    // For debugging
    console.log("Initiating SSO redirect to:", samlUrl);
    
    // Redirect to SAML provider
    window.location.href = samlUrl;
  };

  return (
    <div className="container">
      <div className="left">
        <img src="/andhraPradesh.png" alt="AP Logo" />
      </div>
      <div className="right">
        <div className="title">
          <h1>Parcel Information Project</h1>
          {apiStatus?.status !== "online" && (
            <div className="api-status-error">
              API Status: {apiStatus?.status}
              {apiStatus?.error && <p>Error: {apiStatus.error}</p>}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="formuptext">
            <h1>Sign In</h1>
            <h5>Log in to your secure account</h5>
            <p className="api-url">Using API at: {API_BASE}</p>
          </div>

          <label htmlFor="username">Username</label>
          <input
            type="text"
            value={username}
            autoComplete="username"
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            type="password"
            value={password}
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" disabled={isLoading || ssoLoading}>
            {isLoading ? "Signing In..." : "Sign In"}
          </button>

          <div className="sso-container">
            <p>Or sign in with</p>
            <button
              type="button"
              onClick={handleSSOLogin}
              className="sso-button"
              disabled={isLoading || ssoLoading}
            >
              {ssoLoading ? "Connecting to OneLogin..." : "OneLogin SSO"}
            </button>
          </div>
        </form>

        <ToastContainer position="top-center" />
      </div>
    </div>
  );
}