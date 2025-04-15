import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function AuthCallback() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const processToken = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const token = params.get("token");

        console.log("✅ AuthCallback rendered");
        console.log("Token from URL:", token ? token.substring(0, 30) + "..." : "null");

        if (!token) {
          throw new Error("No authentication token received");
        }

        // Store token in localStorage
        localStorage.setItem("token", token);
        console.log("Token stored");

        // IMPORTANT: Use absolute backend URL
        const API_BASE = "https://geospatial-ap-backend.onrender.com";
        const response = await fetch(`${API_BASE}/api/check-auth`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Auth check failed: ${response.status}`);
        }

        const data = await response.json();
        if (!data.authenticated) {
          throw new Error("Token validation failed");
        }

        console.log("✅ Token is valid, redirecting to /home");
        navigate("/home", { replace: true });
      } catch (err) {
        console.error("❌ AuthCallback Error:", err);
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
        <h2 className="text-xl mb-2">Completing authentication...</h2>
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Please wait...</p>
      </div>
    );
  }

  return error ? (
    <div className="flex flex-col items-center justify-center h-screen text-red-600">
      <h2>Authentication Failed</h2>
      <p>{error}</p>
    </div>
  ) : null;
}

export default AuthCallback;
