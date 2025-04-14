import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Get token from URL query parameters
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      // Store the token in localStorage
      localStorage.setItem('token', token);
      
      // Redirect to home page
      navigate('/home');
    } else {
      // If no token, redirect to login
      navigate('/');
    }
  }, [navigate, location]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh' 
    }}>
      <h2>Authenticating...</h2>
    </div>
  );
}

export default AuthCallback;