import React, { useState } from "react";
import "../styles/LoginPageCss.css";
import { toast, ToastContainer } from "react-toastify";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

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

  const handleOneLoginAuth = () => {
    // Redirect to the SAML authentication endpoint
    const returnUrl = encodeURIComponent(window.location.origin + "/auth-callback");
    window.location.href = `${API_BASE}/api/auth/saml?returnTo=${returnUrl}`;
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
          
          <div style={{ margin: "20px 0", textAlign: "center" }}>
            <p style={{ marginBottom: "10px" }}>Or sign in with</p>
            <button 
              type="button" 
              onClick={handleOneLoginAuth}
              style={{
                backgroundColor: "#1565C0",
                color: "white",
                width: "100%",
                padding: "10px",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              OneLogin SSO
            </button>
          </div>
        </form>

        <ToastContainer />
      </div>
    </div>
  );
}