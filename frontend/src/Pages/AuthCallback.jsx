import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const processAuth = async () => {
      try {
        const token = searchParams.get('token');
        const error = searchParams.get('error');
        
        console.log("Auth callback received - Token exists:", !!token);

        if (error) {
          setError(`SSO Failed: ${error}`);
          toast.error(`SSO Failed: ${error}`);
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        if (!token) {
          // Look for SAML errors or response data in URL
          const fullUrl = window.location.href;
          const hasSamlResponse = fullUrl.includes('SAMLResponse') || fullUrl.includes('samlresponse');
          
          if (hasSamlResponse) {
            setError('SAML response received but processing failed. Please try again.');
            toast.error('SSO authentication failed during processing');
          } else {
            setError('Missing authentication token');
            toast.error('SSO authentication failed - No token received');
          }
          
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        // We have a token, process it
        localStorage.setItem('token', token);
        toast.success('SSO Login Successful');
        
        // Short delay to ensure state updates
        setTimeout(() => {
          navigate('/home');
        }, 500);
      } catch (err) {
        console.error("Auth callback error:", err);
        setError(`Authentication error: ${err.message}`);
        toast.error('An error occurred during authentication');
        setTimeout(() => navigate('/'), 3000);
      } finally {
        setProcessing(false);
      }
    };

    processAuth();
  }, [navigate, searchParams]);

  return (
    <div style={{ 
      padding: '2rem', 
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '60vh'
    }}>
      <h2>
        {processing ? 'Processing SSO Authentication...' : 
         error ? 'Authentication Failed' : 
         'Authentication Successful'}
      </h2>
      
      {processing && (
        <p>Please wait while we verify your credentials</p>
      )}
      
      {error && (
        <div>
          <p style={{ color: 'red' }}>{error}</p>
          <p>Redirecting to login page...</p>
        </div>
      )}
      
      {!processing && !error && (
        <p>Login successful! Redirecting to application...</p>
      )}
    </div>
  );
}