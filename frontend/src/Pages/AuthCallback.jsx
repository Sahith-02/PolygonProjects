import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      toast.error(`SSO Failed: ${error}`);
      navigate('/login');
      return;
    }

    if (token) {
      localStorage.setItem('token', token);
      toast.success('SSO Login Successful');
      navigate('/home');
    } else {
      // Check for SAML errors in URL
      const samlError = window.location.href.includes('SAMLResponse') 
        ? 'Invalid SAML response from provider'
        : 'Missing authentication token';
      
      toast.error(samlError);
      navigate('/login');
    }
  }, [navigate, searchParams]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>Processing SSO Authentication...</h2>
      <p>Please wait while we verify your credentials</p>
    </div>
  );
}