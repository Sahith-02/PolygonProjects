import React, { useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);
  const API_BASE = import.meta.env.VITE_API_BASE || "https://geospatial-ap-backend.onrender.com";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include"
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Login failed");
      }

      const { token } = await res.json();
      localStorage.setItem("token", token);
      onLogin();
    } catch (err) {
      toast.error(err.message || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSSOLogin = () => {
    setSsoLoading(true);
    localStorage.removeItem("token");
    
    const returnTo = encodeURIComponent(
      `${window.location.origin}/auth-callback?t=${Date.now()}`
    );
    
    window.location.href = `${API_BASE}/api/auth/saml?returnTo=${returnTo}`;
  };

  return (
    <div className="container">
      <div className="left">
        <img src="/andhraPradesh.png" alt="AP Logo" />
      </div>
      <div className="right">
        <div className="title">
          <h1>Parcel Information Project</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="formuptext">
            <h1>Sign In</h1>
            <h5>Log in to your secure account</h5>
          </div>

          <label htmlFor="username">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            type="password"
            value={password}
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
              disabled={isLoading || ssoLoading}
            >
              {ssoLoading ? "Redirecting to SSO..." : "OneLogin SSO"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}