import React, { useState, useEffect } from "react";
import "../styles/LoginPageCss.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState(null);

  // Get API base URL from environment or use default
  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";

  // Check API status on component mount
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        // Add timestamp to prevent caching
        const timestamp = new Date().getTime();
        const url = `${API_BASE}/api/status?t=${timestamp}`;
        console.log(`Checking API status at ${url}`);
        
        // Set longer timeout for fetch
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const res = await fetch(url, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        console.log("API status response code:", res.status);
        
        if (res.ok) {
          // Just set as online if we got any successful response
          setApiStatus({ status: "online" });
        } else {
          setApiStatus({ 
            status: "error", 
            message: `API returned status ${res.status}`
          });
        }
      } catch (err) {
        console.error("API connectivity error:", err);
        setApiStatus({ 
          status: "offline", 
          error: err.name === 'AbortError' ? 'Request timed out' : err.message 
        });
      }
    };

    checkApiStatus();
  }, [API_BASE]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    console.log(`Attempting login to ${API_BASE}/api/login`);
  
    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include"
      });
      
      console.log("Login response status:", res.status);
      
      // Read the response only once as text
      const text = await res.text();
      console.log("Raw login response:", text);
      
      // Then try to parse it
      let data;
      try {
        data = JSON.parse(text);
        console.log("Login parsed data:", data);
      } catch (parseErr) {
        console.error("Failed to parse login response:", parseErr);
        toast.error(`Server returned invalid JSON. Raw response: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
        setIsLoading(false);
        return;
      }
      
      if (res.ok && data.token) {
        localStorage.setItem("token", data.token);
        toast.success("Login successful!");
        onLogin();
      } else {
        toast.error(data.message || "Login failed. Please check your credentials.");
        setPassword("");
      }
    } catch (err) {
      console.error("Login network error:", err);
      toast.error(`Network error: ${err.message}. Please check if the server is running.`);
    } finally {
      setIsLoading(false);
    }
  };

  // In LoginPage.jsx
  const handleOneLoginAuth = () => {
    const returnUrl = encodeURIComponent(
      window.location.origin + "/auth-callback"
    );
    // Make sure API_BASE includes the protocol (https://)
    const samlUrl = `${API_BASE}/api/auth/saml?returnTo=${returnUrl}`;

    console.log("Redirecting to OneLogin SSO:", samlUrl);
    window.location.href = samlUrl;
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
            <div
              style={{
                color: "red",
                backgroundColor: "#ffeeee",
                padding: "10px",
                borderRadius: "4px",
                marginTop: "10px",
              }}
            >
              API Status: {apiStatus.status}
              {apiStatus.error && <p>Error: {apiStatus.error}</p>}
            </div>
          )}
        </div>
        <form
          onSubmit={handleSubmit}
          autoComplete="on"
          method="post"
          align="center"
        >
          <div className="formuptext">
            <br />
            <h1>Sign In</h1>
            <h5>Log in to your secure account</h5>
            <p style={{ fontSize: "12px", color: "#666" }}>
              Using API at: {API_BASE}
            </p>
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

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Signing In..." : "Sign In"}
          </button>

          <div style={{ margin: "20px 0", textAlign: "center" }}>
            <p style={{ marginBottom: "10px" }}>Or sign in with</p>
            <button
              type="button"
              onClick={handleOneLoginAuth}
              disabled={isLoading}
              style={{
                backgroundColor: "#1565C0",
                color: "white",
                width: "100%",
                padding: "10px",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              OneLogin SSO
            </button>
          </div>
        </form>

        <ToastContainer position="top-center" />
      </div>
    </div>
  );
}
