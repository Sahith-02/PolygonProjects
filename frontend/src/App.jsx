import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { useEffect, useState } from "react";
import LoginPage from "./Pages/LoginPage";
import HomePage from "./Pages/HomePage";


const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";

function App() {
  const [authenticated, setAuthenticated] = useState(null);

  // Determine API base URL based on environment
  const getApiBaseUrl = () => {
    if (import.meta.env.VITE_API_BASE) {
      return import.meta.env.VITE_API_BASE;
    }
    return window.location.hostname === 'localhost' 
      ? 'http://localhost:5001' 
      : 'https://polygonprojects.onrender.com';
  };

  useEffect(() => {
    const authCheckURL = `${getApiBaseUrl()}/api/check-auth`;

    fetch(authCheckURL, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setAuthenticated(data.authenticated))
      .catch((error) => {
        console.error("Authentication check failed:", error);
        setAuthenticated(false);
      });
  }, []);
  
  if (!allowed) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          textAlign: "center",
        }}
      >
        <h2>This website is only available on desktops and laptops.</h2>
      </div>
    );
  }

  if (authenticated === null) return <p>Loading...</p>;

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            authenticated ? (
              <Navigate to="/home" />
            ) : (
              <LoginPage 
                onLogin={() => setAuthenticated(true)} 
                apiBaseUrl={getApiBaseUrl()}
              />
            )
          }
        />
        <Route
          path="/home"
          element={
            authenticated ? (
              <HomePage 
                onLogout={() => setAuthenticated(false)} 
                apiBaseUrl={getApiBaseUrl()}
              />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/saml-success"
          element={<LoginPage onLogin={() => setAuthenticated(true)} />}
        />
      </Routes>
    </Router>
  );
}

export default App;