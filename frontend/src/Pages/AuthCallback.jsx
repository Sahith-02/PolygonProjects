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
        
        // Log detailed debug info
        console.log("URL search params:", location.search);
        console.log("Token found:", !!token);
        if (token) console.log("Token length:", token.length);
        
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

        // Validate token format before storing
        try {
          // Simple JWT validation - make sure it has 3 parts
          const parts = token.split('.');
          if (parts.length !== 3) {
            throw new Error("Invalid token format");
          }
        } catch (tokenErr) {
          console.error("Invalid token format:", tokenErr);
          setError("Authentication failed: Invalid token format");
          setProcessing(false);
          return;
        }
        
        // Store token in localStorage
        localStorage.setItem("token", token);
        
        // Trigger storage event to notify other tabs/components
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'token',
          newValue: token
        }));
        
        try {
          // Verify token is valid with backend
          const response = await fetch(`${API_BASE}/api/check-auth`, {
            headers: { 
              Authorization: `Bearer ${token}`,
              "Cache-Control": "no-cache"
            }
          });
          
          if (!response.ok) {
            throw new Error(`Token validation failed: Server returned ${response.status}`);
          }
          
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
          
          // Add a small delay to ensure state updates
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Use React Router's navigate for a smooth transition
          navigate("/home", { replace: true });
        } catch (authCheckError) {
          console.error("Auth check failed:", authCheckError);
          setError(`Token validation error: ${authCheckError.message}`);
          setDebugInfo(prev => ({ 
            ...prev, 
            authCheckError: authCheckError.message 
          }));
        }
      } catch (err) {
        console.error("Error processing authentication:", err);
        setError(`Authentication error: ${err.message}`);
      } finally {
        setProcessing(false);
      }
    };

    // Process token immediately on component mount
    processToken();
  }, [navigate, location, API_BASE]);

  // Render a more descriptive loading/error UI
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
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
    <div className="flex items-center justify-center min-h-screen p-4">
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