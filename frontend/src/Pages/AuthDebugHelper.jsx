import React, { useState, useEffect } from 'react';

// This component can be temporarily added to any page to help debug auth issues
function AuthDebugHelper() {
  const [debugInfo, setDebugInfo] = useState({
    token: null,
    tokenLength: 0,
    decodedToken: null,
    tokenExpiry: null,
    tokenIsValid: false,
  });
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    const debugData = {
      token: token ? `${token.substring(0, 10)}...${token.substring(token.length - 10)}` : null,
      tokenLength: token?.length || 0,
      tokenExists: !!token,
      timestamp: new Date().toISOString()
    };
    
    // Try to decode JWT to check expiration
    if (token) {
      try {
        // Simple JWT decoding (without verification)
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const payload = JSON.parse(jsonPayload);
        debugData.decodedToken = payload;
        
        if (payload.exp) {
          const expiryDate = new Date(payload.exp * 1000);
          debugData.tokenExpiry = expiryDate.toLocaleString();
          debugData.tokenIsValid = expiryDate > new Date();
        }
      } catch (e) {
        debugData.decodeError = e.message;
      }
    }
    
    setDebugInfo(debugData);
  }, []);

  if (!debugInfo.tokenExists && window.location.pathname !== '/') {
    // Critical auth issue detected
    return (
      <div className="fixed bottom-0 right-0 bg-red-700 text-white p-3 m-4 rounded shadow-lg z-50">
        <p className="font-bold">⚠️ Auth Error: No token found!</p>
        <p>You should be redirected to login.</p>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 bg-gray-800 text-white p-3 m-4 rounded shadow-lg z-50 max-w-md">
      <div className="flex justify-between items-center">
        <span className={debugInfo.tokenIsValid ? "text-green-400" : "text-red-400"}>
          {debugInfo.tokenIsValid ? "✓ Token Valid" : "✗ Token Invalid or Missing"}
        </span>
        <button 
          className="ml-4 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? "Hide Details" : "Show Details"}
        </button>
      </div>
      
      {showDetails && (
        <div className="mt-2 text-xs overflow-auto max-h-60">
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
          <div className="mt-2 flex space-x-2">
            <button 
              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded"
              onClick={() => {
                localStorage.removeItem('token');
                window.location.href = '/';
              }}
            >
              Clear Token & Logout
            </button>
            <button 
              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AuthDebugHelper;