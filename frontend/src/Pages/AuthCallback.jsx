import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState('Processing authentication...');
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get token from URL query parameters
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    
    console.log('AuthCallback: URL contains token?', !!token);

    if (token) {
      try {
        // Store the token in localStorage
        localStorage.setItem('token', token);
        setStatus('Authentication successful! Redirecting...');
        
        // Redirect to home page after a short delay
        setTimeout(() => {
          navigate('/home');
        }, 1000);
      } catch (err) {
        console.error('AuthCallback error storing token:', err);
        setError(`Error storing authentication token: ${err.message}`);
        
        // If error, redirect to login after a delay
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    } else {
      setStatus('No authentication token found.');
      setError('Authentication failed. Redirecting to login page...');
      
      // If no token, redirect to login after a delay
      setTimeout(() => {
        navigate('/');
      }, 3000);
    }
  }, [navigate, location]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h2>{status}</h2>
      {error && (
        <div style={{ 
          color: 'red', 
          marginTop: '20px',
          padding: '10px',
          backgroundColor: '#ffeeee',
          borderRadius: '4px',
          maxWidth: '80%'
        }}>
          {error}
        </div>
      )}
    </div>
  );
}

export default AuthCallback;