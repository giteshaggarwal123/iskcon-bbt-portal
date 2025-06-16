
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
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useDeviceInfo } from "./hooks/useDeviceInfo";
import { useAutoRefresh } from "./hooks/useAutoRefresh";
import { useState, useEffect } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on auth errors, let auto-refresh handle it
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

const AppWrapper = () => {
  useAutoRefresh(); // Initialize auto-refresh functionality
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
    <>
      <Toaster />
      <Sonner />
      {showSplash && <MobileSplashScreen />}
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<RealAuthPage />} />
          <Route path="/microsoft/callback" element={<MicrosoftCallback />} />
          <Route path="/*" element={<AppContent />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ErrorBoundary>
          <AuthProvider>
            <AppWrapper />
          </AuthProvider>
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
