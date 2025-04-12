import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SAMLCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we're returning from SAML login
    const urlParams = new URLSearchParams(window.location.search);
    const samlToken = urlParams.get('token');
    
    if (samlToken) {
      console.log("SAMLCallback: Found SAML token in URL");
      localStorage.setItem("token", samlToken);
      
      // Navigate to home page
      navigate('/', { replace: true });
    } else {
      console.error("SAMLCallback: No token found in URL");
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="saml-callback-container" style={{ 
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100%' 
    }}>
      <div className="loading-spinner" style={{
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #3498db',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        animation: 'spin 2s linear infinite',
        marginBottom: '20px'
      }}></div>
      <p>Completing authentication, please wait...</p>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}