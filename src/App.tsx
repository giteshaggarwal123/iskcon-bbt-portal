
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingFallback } from "@/components/LoadingFallback";
import { AppContent } from "@/components/AppContent";
import { RealAuthPage } from "@/components/RealAuthPage";
import { MicrosoftCallback } from "@/pages/MicrosoftCallback";
import { NotFound } from "@/pages/NotFound";
import { AuthProvider } from "@/hooks/useAuth";
import React, { Suspense, useEffect } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000,
    },
  },
});

const App = () => {
  console.log('App component rendering...');
  
  // iOS 18.5 compatibility - ensure proper initialization
  useEffect(() => {
    console.log('App initialized successfully');
    console.log('Environment:', {
      mode: import.meta.env.MODE,
      dev: import.meta.env.DEV,
      prod: import.meta.env.PROD,
      url: window.location.href,
      isNative: window.Capacitor?.isNative || false
    });
    
    // Handle iOS app launch
    if (window.Capacitor?.isNative) {
      console.log('Native app detected - iOS compatibility mode');
      // Ensure proper routing for native apps
      if (window.location.hash && !window.location.pathname.includes(window.location.hash.substring(1))) {
        const hashRoute = window.location.hash.substring(1);
        console.log('Handling hash route:', hashRoute);
      }
    }
  }, []);
  
  return (
    <ErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  <Route path="/auth" element={<RealAuthPage />} />
                  <Route path="/microsoft/callback" element={<MicrosoftCallback />} />
                  <Route path="*" element={<AppContent />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
