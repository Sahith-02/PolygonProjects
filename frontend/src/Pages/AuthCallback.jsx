import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';

function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const error = params.get('error');

    if (error) {
      toast.error(`SSO Failed: ${error}`);
      navigate('/login');
      return;
    }

    if (token) {
      localStorage.setItem('token', token);
      toast.success('Login successful via SSO');
      navigate('/home');
    } else {
      toast.error('No authentication token received');
      navigate('/login');
    }
  }, [navigate, location]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh'
    }}>
      <h2>Processing SSO authentication...</h2>
    </div>
  );
}

export default AuthCallback;