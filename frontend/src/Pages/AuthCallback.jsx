import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(true);
  const [debugInfo, setDebugInfo] = useState({});

  const API_BASE = import.meta.env.VITE_API_BASE || "https://geospatial-ap-backend.onrender.com";

  useEffect(() => {
    const processToken = async () => {
      try {
        console.log("AuthCallback mounted, processing token...");
        
        // Get token from URL parameters
        const params = new URLSearchParams(location.search);
        const token = params.get("token");
        
        setDebugInfo(prev => ({ ...prev, 
          searchParams: location.search,
          hasToken: !!token,
          tokenLength: token?.length || 0
        }));

        if (!token) {
          console.error("No token found in URL");
          setError("Authentication failed: No token received from server");
          setProcessing(false);
          return;
        }

        console.log("Token received, length:", token.length);
        
        // Store token in localStorage
        localStorage.setItem("token", token);
        
        try {
          // Verify token is valid
          const response = await fetch(`${API_BASE}/api/check-auth`, {
            headers: { 
              Authorization: `Bearer ${token}`,
              "Cache-Control": "no-cache"
            },
            credentials: "include"
          });
          
          const data = await response.json();
          console.log("Auth check response:", data);
          
          setDebugInfo(prev => ({ 
            ...prev, 
            authCheckResponse: data,
            authenticated: data.authenticated 
          }));
          
          if (!data.authenticated) {
            throw new Error("Token validation failed: User not authenticated");
          }
        } catch (authCheckError) {
          console.error("Auth check failed:", authCheckError);
          // Don't throw error here, continue with token we have
          setDebugInfo(prev => ({ 
            ...prev, 
            authCheckError: authCheckError.message 
          }));
        }
        
        // Small delay to ensure state updates
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Force a reload of the app to ensure authentication state is updated
        // This is important because the App component may have already decided user is not authenticated
        window.location.href = "/home";
      } catch (err) {
        console.error("Error processing authentication:", err);
        setError(`Authentication error: ${err.message}`);
        setProcessing(false);
      }
    };

    processToken();
  }, [navigate, location, API_BASE]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
          <h2 className="text-lg font-semibold mb-2">Authentication Error</h2>
          <p>{error}</p>
          <div className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
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
        {debugInfo.hasToken && (
          <p className="text-green-600 mt-2">Token received successfully!</p>
        )}
      </div>
    </div>
  );
}

export default AuthCallback;