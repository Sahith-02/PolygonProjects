import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const processToken = async () => {
      try {
        console.log("AuthCallback mounted, processing token...");
        const params = new URLSearchParams(location.search);
        const token = params.get("token");

        if (!token) {
          console.error("No token found in URL");
          setError("Authentication failed: No token received from server");
          setProcessing(false);
          return;
        }

        console.log("Token received (length):", token.length);
        console.log("Token preview:", token.substring(0, 20) + "...");

        // Store token in localStorage
        localStorage.setItem("token", token);
        
        // Verify token is valid by making a test request
        const API_BASE = import.meta.env.VITE_API_BASE || "https://geospatial-ap-backend.onrender.com";
        const response = await fetch(`${API_BASE}/api/check-auth`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include"
        });
        
        const data = await response.json();
        console.log("Auth check response:", data);
        
        if (!data.authenticated) {
          throw new Error("Token validation failed");
        }
        
        // Navigate to home page
        console.log("Token validated successfully, redirecting to home");
        navigate("/home", { replace: true });
      } catch (err) {
        console.error("Error processing authentication:", err);
        setError(`Authentication error: ${err.message}`);
        setProcessing(false);
      }
    };

    processToken();
  }, [navigate, location]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
          <h2 className="text-lg font-semibold mb-2">Authentication Error</h2>
          <p>{error}</p>
          <button 
            onClick={() => navigate("/")} 
            className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold">Completing login...</h2>
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mt-4 mx-auto" />
        <p className="mt-4">Processing authentication response...</p>
      </div>
    </div>
  );
}

export default AuthCallback;