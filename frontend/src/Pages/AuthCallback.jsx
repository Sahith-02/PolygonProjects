import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log("✅ AuthCallback mounted");
        const params = new URLSearchParams(location.search);
        const token = params.get("token");

        if (!token) {
          throw new Error("No authentication token found in URL");
        }

        // Verify token structure before storing
        if (typeof token !== "string" || token.split('.').length !== 3) {
          throw new Error("Invalid token format");
        }

        // Store token and verify it
        localStorage.setItem("token", token);
        console.log("✅ Token stored");

        // Ensure token is valid before redirect
        try {
          const response = await fetch(`${import.meta.env.VITE_API_BASE || "https://geospatial-ap-backend.onrender.com"}/api/check-auth`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
          });

          const data = await response.json();
          if (!data.authenticated) {
            throw new Error("Token verification failed");
          }

          // Successful auth - redirect to home
          navigate("/home", { replace: true });
        } catch (verifyError) {
          console.error("Token verification error:", verifyError);
          localStorage.removeItem("token");
          throw new Error("Failed to verify token with server");
        }
      } catch (err) {
        console.error("❌ AuthCallback error:", err);
        setError(err.message);
        toast.error(`Authentication failed: ${err.message}`);
        navigate("/", { replace: true });
      }
    };

    handleAuthCallback();
  }, [navigate, location]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        {error ? (
          <>
            <h2 className="text-lg font-bold text-red-600">Authentication Error</h2>
            <p className="text-red-500">{error}</p>
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold">Completing authentication...</h2>
            <p className="animate-pulse">Please wait while we verify your session</p>
          </>
        )}
      </div>
    </div>
  );
}

export default AuthCallback;