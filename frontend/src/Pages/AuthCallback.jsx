import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function AuthCallback() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const processToken = async () => {
      try {
        // Extract token from URL
        const urlParams = new URLSearchParams(location.search);
        const token = urlParams.get("token");
        
        // Debug information
        const debug = {
          hasToken: !!token,
          tokenLength: token ? token.length : 0,
          search: location.search,
          pathname: location.pathname
        };
        setDebugInfo(debug);
        console.log("AuthCallback: Debug info", debug);
        
        if (!token) {
          setError("No authentication token received");
          setLoading(false);
          return;
        }
        
        // Store token in localStorage
        localStorage.setItem("token", token);
        console.log("AuthCallback: Token stored successfully");
        
        // Verify token is stored before continuing
        const storedToken = localStorage.getItem("token");
        if (!storedToken) {
          throw new Error("Token storage failed");
        }
        
        // Force a short delay to ensure token is committed to storage
        setTimeout(() => {
          // Force reload the application to ensure authentication state is updated
          window.location.href = "/home";
        }, 1000);
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
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-center p-6 max-w-md bg-white rounded-lg border border-gray-200 shadow-md">
          <h2 className="text-xl mb-4">Completing authentication...</h2>
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Please wait while we complete the authentication process</p>
          {debugInfo.hasToken && (
            <p className="mt-2 text-green-600">✓ Token received successfully</p>
          )}
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
          <div className="mb-4 p-2 bg-gray-100 rounded text-left">
            <code className="text-xs">Debug info: {JSON.stringify(debugInfo, null, 2)}</code>
          </div>
          <button
            onClick={() => window.location.href = "/"}
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
      <div className="text-center p-6 max-w-md bg-white rounded-lg border border-gray-200 shadow-md">
        <h2 className="text-xl mb-4">Authentication successful!</h2>
        <p className="mb-4">Redirecting to home page...</p>
        <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
}

export default AuthCallback;