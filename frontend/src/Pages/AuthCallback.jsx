import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = new URLSearchParams(location.search).get("token");

    console.log("✅ AuthCallback mounted");
    console.log("Token from URL:", token?.substring(0, 30) + "...");

    if (!token) {
      console.error("❌ No token found in URL");
      navigate("/", { replace: true });
      return;
    }

    localStorage.setItem("token", token);
    console.log("✅ Token saved to localStorage");
    navigate("/home", { replace: true });
  }, [navigate, location]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold">Completing login...</h2>
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mt-4 mx-auto" />
      </div>
    </div>
  );
}

export default AuthCallback;
