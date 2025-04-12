import React from "react";
import { useEffect, useEffect } from "react";
import "../styles/LoginPageCss.css";
import { toast, ToastContainer } from "react-toastify";
import { useState } from "react";
import { useLocation } from "react-router-dom";

export default function LoginPage({ onLogin,apiBaseUrl  }) {
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
      const res = await fetch(`${apiBaseUrl}/api/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        toast.success("Login successful!");
        onLogin();
      } else {
        throw new Error("Login failed");
      }
    } catch (error) {
      toast.error("Invalid username or password");
      setUsername("");
      setPassword("");
    }
  };

  const handleSamlLogin = () => {
    window.location.href = `${apiBaseUrl}/api/auth/saml`;
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/check-auth`, {
          credentials: "include"
        });
        const data = await response.json();
        
        if (data.authenticated) {
          onLogin();
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      }
    };
    
    checkAuth();
  }, [apiBaseUrl, onLogin]);


  return (
    <div className="container">
      <div className="left">
        <img src="/andhraPradesh.png" alt="" />
      </div>
      <div className="right">
        <div className="title">
          <h1>Land Information Project </h1>
        </div>
        <form onSubmit={handleSubmit} autoComplete="off" align="center">
          <div className="formuptext">
            <br />
            <h1>Sign In</h1>
            <h5>Log in to your secure account</h5>
          </div>
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            autoComplete="off"
            onChange={(e) => setUsername(e.target.value)}
          />
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            autoComplete="new-password"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit">Sign In</button>
        </form>
        <ToastContainer />
      </div>
    </div>
  );
}