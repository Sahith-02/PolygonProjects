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
  const [allowed, setAllowed] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setAuthenticated(false);
      return;
    }
    if (window.innerWidth < 1024) {
      setAllowed(false);
    }

    fetch(`${API_BASE}/api/check-auth`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setAuthenticated(data.authenticated))
      .catch(() => setAuthenticated(false));
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
              <LoginPage onLogin={() => setAuthenticated(true)} />
            )
          }
        />
        <Route
          path="/home"
          element={
            authenticated ? (
              <HomePage onLogout={() => setAuthenticated(false)} />
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