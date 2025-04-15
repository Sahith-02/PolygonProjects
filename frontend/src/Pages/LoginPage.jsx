import React, { useState, useEffect } from "react";
import "../styles/LoginPageCss.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState(null);
  const [ssoLoading, setSsoLoading] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";

  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const timestamp = new Date().getTime();
        const url = `${API_BASE}/api/status?t=${timestamp}`;
        
        const res = await fetch(url, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include"
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        const data = await res.json();
        setApiStatus({ status: "online", data });
        console.log("API Status:", data);
      } catch (err) {
        setApiStatus({ 
          status: "offline", 
          error: err.message,
          suggestion: "Please check your backend server is running"
        });
        console.error("API status check failed:", err);
      }
    };

    checkApiStatus();
    const interval = setInterval(checkApiStatus, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
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
        body: JSON.stringify({ username, password }),
        credentials: "include"
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Login failed");
      }

      const data = await res.json();
      
      if (data.token) {
        localStorage.setItem("token", data.token);
        toast.success("Login successful!");
        onLogin();
      } else {
        throw new Error("No token received");
      }
    } catch (err) {
      toast.error(err.message || "Login failed. Please try again.");
      setPassword("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOneLoginAuth = () => {
    setSsoLoading(true);
    try {
      const returnUrl = encodeURIComponent(
        window.location.origin + "/auth-callback"
      );
      
      // Make sure the URL is properly formatted
      const samlUrl = `${API_BASE}/api/auth/saml?returnTo=${returnUrl}`;
      console.log("Redirecting to SAML auth:", samlUrl);
      
      // Use setTimeout to make sure the user sees the loading state
      setTimeout(() => {
        window.location.href = samlUrl;
      }, 500);
    } catch (err) {
      console.error("SSO redirect error:", err);
      toast.error("SSO login failed. Please try again.");
      setSsoLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="left">
        <img src="/andhraPradesh.png" alt="Andhra Pradesh logo" />
      </div>
      <div className="right">
        <div className="title">
          <h1>Parcel Information Project</h1>
          {apiStatus && apiStatus.status !== "online" && (
            <div className="api-status-error">
              API Status: {apiStatus.status}
              {apiStatus.error && <p>Error: {apiStatus.error}</p>}
            </div>
          )}
        </div>
        <form onSubmit={handleSubmit} autoComplete="on">
          <div className="formuptext">
            <br />
            <h1>Sign In</h1>
            <h5>Log in to your secure account</h5>
            <p className="api-url">Using API at: {API_BASE}</p>
          </div>

          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={username}
            autoComplete="username"
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
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
              onClick={handleOneLoginAuth}
              disabled={isLoading || ssoLoading}
              className="sso-button"
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