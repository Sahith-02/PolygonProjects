import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log("AuthCallback - Location search:", location.search);
    
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const error = params.get("error");

    if (error) {
      console.error("SAML Error:", error);
      toast.error(`Login failed: ${error}`);
      navigate("/", { replace: true });
      return;
    }

    if (!token) {
      console.error("No token found in URL");
      toast.error("Authentication failed: No token received");
      navigate("/", { replace: true });
      return;
    }

    // Verify token structure
    if (token.split('.').length !== 3) {
      console.error("Invalid token format");
      toast.error("Authentication failed: Invalid token format");
      navigate("/", { replace: true });
      return;
    }

    console.log("Storing token...");
    localStorage.setItem("token", token);

    // Immediate redirect to home
    console.log("Redirecting to /home");
    navigate("/home", { replace: true });

  }, [navigate, location]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '2rem',
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h2>Completing Authentication...</h2>
        <p>You will be redirected shortly</p>
      </div>
    </div>
  );
}