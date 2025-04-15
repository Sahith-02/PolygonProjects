import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function AuthCallback() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const processToken = async () => {
      try {
        // Extract token from URL query parameters
        const urlParams = new URLSearchParams(location.search);
        const token = urlParams.get("token");
        
        if (!token) {
          setError("No authentication token received");
          setLoading(false);
          return;
        }
        
        console.log("Token received, storing and redirecting...");
        
        // Store token in localStorage
        localStorage.setItem("token", token);
        
        // Redirect to home page
        navigate("/home");
      } catch (error) {
        console.error("Error processing authentication callback:", error);
        setError("Authentication failed. Please try again.");
        setLoading(false);
      }
    };

    processToken();
  }, [navigate, location]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl mb-4">Completing authentication...</h2>
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center p-6 max-w-md bg-white rounded-lg border border-gray-200 shadow-md">
          <h2 className="text-xl text-red-600 mb-4">Authentication Error</h2>
          <p className="mb-4">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default AuthCallback;