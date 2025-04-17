import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import "../styles/LoginPageCss.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";
const IS_PRODUCTION = import.meta.env.MODE === "production";

export default function LoginPage({ onLogin, useSaml = false }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check for error parameters in URL
    const error = searchParams.get("error");
    if (error === "saml") {
      toast.error("SAML authentication failed. Please try again or use password login.");
    } else if (error === "nouser") {
      toast.error("User not found. Please try again.");
    }
  }, [searchParams]);

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
    window.location.href = `${API_BASE}/api/auth/saml`;
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
          
          {useSaml && (
            <div style={{ marginTop: "20px", textAlign: "center" }}>
              <div style={{ margin: "10px 0", color: "#555" }}>OR</div>
              <button 
                type="button" 
                onClick={handleSamlLogin}
                style={{
                  backgroundColor: "#0747A6",
                  color: "white",
                  padding: "10px 15px",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  width: "100%",
                  fontWeight: "bold"
                }}
              >
                Sign in with SSO
              </button>
            </div>
          )}
        </form>

        <ToastContainer />
      </div>
    </div>
  );
}