import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const API_BASE = import.meta.env.VITE_API_BASE || "https://geospatial-ap-backend.onrender.com";

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (error) {
      toast.error(`SSO Login failed: ${error}`);
      navigate("/");
      return;
    }

    if (!token) {
      toast.error("No authentication token received");
      navigate("/");
      return;
    }

    // Verify token structure before storing
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      toast.error("Invalid token format");
      navigate("/");
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/check-auth`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include"
        });

        if (!response.ok) throw new Error("Token verification failed");

        localStorage.setItem("token", token);
        navigate("/home", { replace: true });
      } catch (err) {
        toast.error("Session verification failed");
        navigate("/");
      }
    };

    verifyToken();
  }, [navigate, searchParams, API_BASE]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-2">Completing Authentication</h2>
        <p>Please wait while we secure your session...</p>
        <div className="mt-4 animate-spin w-10 h-10 border-4 border-blue-500 rounded-full border-t-transparent mx-auto"></div>
      </div>
    </div>
  );
}