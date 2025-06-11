
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { RealAuthPage } from "./components/RealAuthPage";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { MicrosoftCallback } from "./pages/MicrosoftCallback";
import { MobileSplashScreen } from "./components/MobileSplashScreen";
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

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          {showSplash && <MobileSplashScreen />}
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<RealAuthPage />} />
              <Route path="/microsoft/callback" element={<MicrosoftCallback />} />
              <Route path="/" element={<Index />} />
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
