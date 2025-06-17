
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useDeviceInfo } from "@/hooks/useDeviceInfo";

export const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const deviceInfo = useDeviceInfo();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
    
    // Auto-redirect to home on mobile after 3 seconds
    if (deviceInfo.isNative) {
      const timer = setTimeout(() => {
        navigate("/", { replace: true });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, navigate, deviceInfo.isNative]);

  const handleGoHome = () => {
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="text-center p-8 max-w-md w-full">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📱</span>
        </div>
        <h1 className="text-4xl font-bold mb-4 text-gray-800">404</h1>
        <p className="text-xl text-gray-600 mb-6">Page not found</p>
        <p className="text-sm text-gray-500 mb-6">
          The page you're looking for doesn't exist or has been moved.
          {deviceInfo.isNative && (
            <span className="block mt-2 text-blue-600">
              Redirecting to home in 3 seconds...
            </span>
          )}
        </p>
        <Button onClick={handleGoHome} className="mb-4 w-full">
          Return to Home
        </Button>
        {!deviceInfo.isNative && (
          <div className="text-xs text-gray-400 break-all">
            Path: {location.pathname}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotFound;
