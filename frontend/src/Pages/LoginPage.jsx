import React, { useState, useEffect } from "react";
import "../styles/LoginPageCss.css";
import { toast, ToastContainer } from "react-toastify";
import { useLocation } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";
const IS_PRODUCTION = window.location.origin === "https://indgeos.onrender.com";

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const location = useLocation();

  useEffect(() => {
    // Handle token from SAML redirect
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    
    if (token) {
      localStorage.setItem("token", token);
      toast.success("SAML login successful!");
      onLogin();
    }
  }, [location, onLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("token", data.token);
        toast.success("Login successful!");
        onLogin();
      } else {
        toast.error("Invalid username or password");
        setUsername("");
        setPassword("");
      }
    } catch (err) {
      toast.error("Network error");
    }
  };

  const handleSamlLogin = () => {
    if (IS_PRODUCTION) {
      window.location.href = `${API_BASE}/api/auth/saml?returnUrl=/home`;
    } else {
      toast.info("SAML login is only available in production");
    }
  };

  return (
    <div className="container">
      <div className="left">
        <img src="/andhraPradesh.png" alt="" />
      </div>
      <div className="right">
        <div className="title">
          <h1>Parcel Information Project</h1>
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
          </div>

          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={username}
            autoComplete="username"
            onChange={(e) => setUsername(e.target.value)}
          />

          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit">Sign In</button>
          
          {IS_PRODUCTION && (
            <div className="saml-login">
              <div className="divider">
                <span>OR</span>
              </div>
              <button 
                type="button" 
                className="saml-button"
                onClick={handleSamlLogin}
              >
                Sign in with OneLogin
              </button>
            </div>
          )}
        </form>

        <ToastContainer />
      </div>
    </div>
  );
}