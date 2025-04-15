import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log("✅ AuthCallback mounted");

    const token = new URLSearchParams(location.search).get("token");
    if (!token) {
      console.error("❌ No token in URL");
      navigate("/", { replace: true });
      return;
    }

    localStorage.setItem("token", token);
    console.log("✅ Token stored:", token.substring(0, 25) + "...");
    navigate("/home", { replace: true });
  }, [navigate, location]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h2 className="text-lg font-bold">Completing authentication...</h2>
      </div>
    </div>
  );
}

export default AuthCallback;
