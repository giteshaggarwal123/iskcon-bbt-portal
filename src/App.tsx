
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingFallback } from "@/components/LoadingFallback";
import { AppContent } from "@/components/AppContent";
import { MicrosoftCallback } from "@/pages/MicrosoftCallback";
import { NotFound } from "@/pages/NotFound";
import { AuthProvider } from "@/hooks/useAuth";
import React, { Suspense } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App = () => {
  console.log('App component rendering...');
  
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
                  <Route path="/" element={<AppContent />} />
                  <Route path="/dashboard" element={<Navigate to="/" replace />} />
                  <Route path="/meetings" element={<Navigate to="/" replace />} />
                  <Route path="/documents" element={<Navigate to="/" replace />} />
                  <Route path="/attendance" element={<Navigate to="/" replace />} />
                  <Route path="/voting" element={<Navigate to="/" replace />} />
                  <Route path="/members" element={<Navigate to="/" replace />} />
                  <Route path="/reports" element={<Navigate to="/" replace />} />
                  <Route path="/settings" element={<Navigate to="/" replace />} />
                  <Route path="/microsoft/callback" element={<MicrosoftCallback />} />
                  <Route path="*" element={<NotFound />} />
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
