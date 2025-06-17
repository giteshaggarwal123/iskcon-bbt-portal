
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { RealAuthPage } from "./components/RealAuthPage";
import { AppContent } from "./components/AppContent";
import { MicrosoftCallback } from "./pages/MicrosoftCallback";
import { MobileSplashScreen } from "./components/MobileSplashScreen";
import { NotFound } from "./pages/NotFound";
import { useDeviceInfo } from "./hooks/useDeviceInfo";
import { useState, useEffect } from "react";

const queryClient = new QueryClient();

const App = () => {
  const deviceInfo = useDeviceInfo();
  const [showSplash, setShowSplash] = useState(deviceInfo.isNative);

  useEffect(() => {
    if (deviceInfo.isNative) {
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [deviceInfo.isNative]);

  // Add error boundary for mobile
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error);
      if (deviceInfo.isNative) {
        // Prevent app crashes on mobile
        event.preventDefault();
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [deviceInfo.isNative]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          {showSplash && <MobileSplashScreen />}
          <BrowserRouter basename="/">
            <Routes>
              <Route path="/auth" element={<RealAuthPage />} />
              <Route path="/microsoft/callback" element={<MicrosoftCallback />} />
              <Route path="/" element={<AppContent />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
