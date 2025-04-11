import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { useEffect, useState } from "react";
import LoginPage from "./Pages/LoginPage";
import HomePage from "./Pages/HomePage";

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
      </Routes>
    </Router>
  );
}

export default App;