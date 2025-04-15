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
        // Extract token from URL
        const urlParams = new URLSearchParams(location.search);
        const token = urlParams.get("token");
        
        console.log("AuthCallback: Processing token", token ? "Token present" : "No token");
        
        if (!token) {
          setError("No authentication token received");
          setLoading(false);
          return;
        }
        
        // Store token
        console.log("AuthCallback: Storing token in localStorage");
        localStorage.setItem("token", token);
        
        // Wait briefly to ensure token is stored before navigation
        console.log("AuthCallback: Preparing to navigate to /home");
        
        // Use a more robust navigation approach
        setTimeout(() => {
          console.log("AuthCallback: Navigating to /home now");
          navigate("/home", { replace: true });
        }, 500);
      } catch (error) {
        console.error("AuthCallback Error:", error);
        setError(`Authentication error: ${error.message}`);
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
          <p className="mt-4 text-gray-600">Please wait while we complete the authentication process</p>
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

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h2 className="text-xl mb-4">Authentication successful!</h2>
        <p>Redirecting to home page...</p>
      </div>
    </div>
  );
}

export default AuthCallback;