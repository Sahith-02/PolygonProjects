import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function AuthCallback() {
  console.log("✅ AuthCallback rendered");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const processToken = async () => {
      try {
        // Extract token from URL
        const params = new URLSearchParams(location.search);
        const token = params.get("token");
        
        console.log("Token received:", token ? token.substring(0, 20) + "..." : "none");

        if (!token) {
          throw new Error("No authentication token received");
        }

        // Store token in localStorage
        localStorage.setItem("token", token);
        console.log("Token stored successfully");

        // Verify token is valid before redirecting
        try {
          const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";
          const response = await fetch(`${API_BASE}/api/check-auth`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            credentials: "include"
          });

          if (!response.ok) {
            throw new Error("Token validation failed");
          }

          const data = await response.json();
          if (!data.authenticated) {
            throw new Error("Invalid token");
          }

          // Successful validation - redirect to home
          navigate("/home", { replace: true });
        } catch (validationError) {
          console.error("Token validation error:", validationError);
          throw new Error("Invalid token received");
        }
      } catch (err) {
        console.error("AuthCallback Error:", err);
        setError(err.message);
        toast.error(err.message);
        navigate("/", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    processToken();
  }, [navigate, location]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-center p-6 max-w-md bg-white rounded-lg border border-gray-200 shadow-md">
          <h2 className="text-xl mb-4">Completing authentication...</h2>
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Please wait while we complete the authentication process</p>
        </div>
      </div>
    );
  }

  return null;
}

export default AuthCallback;