import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import LoginPage from './Pages/LoginPage';
import HomePage from './Pages/HomePage';
import AuthCallback from './Pages/AuthCallback';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function AppWrapper() {
  return (
    <BrowserRouter>
      <ToastContainer position="top-center" autoClose={5000} />
      <App />
    </BrowserRouter>
  );
}

function App() {
  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const API_BASE = import.meta.env.VITE_API_BASE || "https://geospatial-ap-backend.onrender.com";

  useEffect(() => {
    const checkAuth = async () => {
      // Skip auth check for callback route
      if (location.pathname === '/auth-callback') {
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token');

        const response = await fetch(`${API_BASE}/api/check-auth`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include'
        });

        const data = await response.json();
        setAuthenticated(data.authenticated);
        if (!data.authenticated) localStorage.removeItem('token');
      } catch (err) {
        setAuthenticated(false);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [location.pathname, API_BASE]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-lg font-bold">Loading...</h2>
          <p>Checking authentication status</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={
        authenticated ? <Navigate to="/home" replace /> : <LoginPage onLogin={() => setAuthenticated(true)} />
      } />
      <Route path="/home" element={
        authenticated ? <HomePage onLogout={() => {
          localStorage.removeItem('token');
          setAuthenticated(false);
        }} /> : <Navigate to="/" replace />
      } />
      <Route path="/auth-callback" element={<AuthCallback />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppWrapper;