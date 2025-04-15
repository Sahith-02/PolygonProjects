import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = new URLSearchParams(location.search).get("token");

    if (!token) {
      console.error("No token in callback URL");
      return navigate("/", { replace: true });
    }

    localStorage.setItem("token", token);
    console.log("✅ Token saved:", token.substring(0, 20) + "...");

    navigate("/home", { replace: true });
  }, [navigate, location]);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="text-center">
        <h2 className="text-lg font-semibold">Completing login...</h2>
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mt-4" />
      </div>
    </div>
  );
}

export default AuthCallback;
