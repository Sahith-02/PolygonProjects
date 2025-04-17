import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function TokenDebugPage() {
  const [searchParams] = useSearchParams();
  const [storageTests, setStorageTests] = useState({});
  const [token, setToken] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const urlToken = searchParams.get("token");
    if (urlToken) {
      setToken(urlToken);
      runStorageTests(urlToken);
    }
  }, [searchParams]);

  const runStorageTests = (testToken) => {
    const results = {};
    
    // Test localStorage
    try {
      localStorage.setItem("test_key", "test_value");
      const testRead = localStorage.getItem("test_key");
      results.localStorageWorks = testRead === "test_value";
      localStorage.removeItem("test_key");
      
      // Try with actual token
      try {
        localStorage.setItem("token", testToken);
        const tokenRead = localStorage.getItem("token");
        results.localStorageTokenTest = tokenRead === testToken;
      } catch (e) {
        results.localStorageTokenError = e.toString();
      }
    } catch (e) {
      results.localStorageError = e.toString();
    }
    
    // Test sessionStorage
    try {
      sessionStorage.setItem("test_key", "test_value");
      const testRead = sessionStorage.getItem("test_key");
      results.sessionStorageWorks = testRead === "test_value";
      sessionStorage.removeItem("test_key");
      
      // Try with actual token
      try {
        sessionStorage.setItem("token", testToken);
        const tokenRead = sessionStorage.getItem("token");
        results.sessionStorageTokenTest = tokenRead === testToken;
      } catch (e) {
        results.sessionStorageTokenError = e.toString();
      }
    } catch (e) {
      results.sessionStorageError = e.toString();
    }
    
    // Test cookies
    try {
      document.cookie = "test_cookie=test_value; path=/";
      results.cookiesWork = document.cookie.includes("test_cookie=test_value");
      document.cookie = "test_cookie=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      
      // Try with actual token
      try {
        document.cookie = `token=${testToken}; path=/`;
        results.cookieTokenTest = document.cookie.includes(`token=${testToken}`);
      } catch (e) {
        results.cookieTokenError = e.toString();
      }
    } catch (e) {
      results.cookieError = e.toString();
    }
    
    // Get browser info
    results.userAgent = navigator.userAgent;
    results.storageAvailable = {
      localStorage: typeof window.localStorage !== 'undefined',
      sessionStorage: typeof window.sessionStorage !== 'undefined',
      cookies: navigator.cookieEnabled
    };
    
    // Test iframes for third-party cookie blocking
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    try {
      iframe.contentWindow.localStorage.setItem('iframe_test', 'test');
      results.iframeStorageWorks = true;
    } catch (e) {
      results.iframeStorageWorks = false;
      results.iframeStorageError = e.toString();
    }
    
    document.body.removeChild(iframe);
    
    setStorageTests(results);
  };

  const handleManualStore = () => {
    try {
      localStorage.setItem("token", token);
      localStorage.setItem("force_auth", "true");
      alert("Token stored in localStorage!");
    } catch (e) {
      alert("Error storing in localStorage: " + e.toString());
    }
    
    try {
      sessionStorage.setItem("token", token);
      sessionStorage.setItem("force_auth", "true");
      alert("Token stored in sessionStorage!");
    } catch (e) {
      alert("Error storing in sessionStorage: " + e.toString());
    }
    
    try {
      document.cookie = `token=${token}; path=/; max-age=36000`;
      document.cookie = `force_auth=true; path=/; max-age=36000`;
      alert("Token stored in cookies!");
    } catch (e) {
      alert("Error storing in cookies: " + e.toString());
    }
  };

  const checkStoredValues = () => {
    const result = {
      localStorage: localStorage.getItem("token"),
      sessionStorage: sessionStorage.getItem("token"),
      cookies: document.cookie.split(';').find(c => c.trim().startsWith('token='))
    };
    alert(JSON.stringify(result, null, 2));
  };

  const goToHome = () => {
    navigate("/home");
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Token Storage Debug Page</h1>
      
      <div style={{ marginBottom: "20px" }}>
        <h2>Current Token</h2>
        <textarea 
          value={token} 
          onChange={(e) => setToken(e.target.value)} 
          style={{ width: "100%", height: "60px" }}
        />
      </div>
      
      <div style={{ marginBottom: "20px" }}>
        <button 
          onClick={handleManualStore}
          style={{ padding: "10px", marginRight: "10px", background: "#4CAF50", color: "white", border: "none" }}
        >
          Manually Store Token
        </button>
        
        <button 
          onClick={checkStoredValues}
          style={{ padding: "10px", marginRight: "10px", background: "#2196F3", color: "white", border: "none" }}
        >
          Check Stored Values
        </button>
        
        <button 
          onClick={() => runStorageTests(token)}
          style={{ padding: "10px", marginRight: "10px", background: "#FF9800", color: "white", border: "none" }}
        >
          Run Storage Tests
        </button>
        
        <button 
          onClick={goToHome}
          style={{ padding: "10px", background: "#9C27B0", color: "white", border: "none" }}
        >
          Go To Home
        </button>
      </div>
      
      <div>
        <h2>Storage Test Results</h2>
        <pre style={{ background: "#f0f0f0", padding: "15px", overflow: "auto" }}>
          {JSON.stringify(storageTests, null, 2)}
        </pre>
      </div>
    </div>
  );
}