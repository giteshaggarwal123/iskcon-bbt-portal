
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingFallback } from "@/components/LoadingFallback";
import { Layout } from "@/components/Layout";
import { Dashboard } from "@/components/Dashboard";
import { MeetingsModule } from "@/components/MeetingsModule";
import { VotingModule } from "@/components/VotingModule";
import { MembersModule } from "@/components/MembersModule";
import { DocumentsModule } from "@/components/DocumentsModule";
import { EmailModule } from "@/components/EmailModule";
import { AttendanceModule } from "@/components/AttendanceModule";
import { ReportsModule } from "@/components/ReportsModule";
import { SettingsModule } from "@/components/SettingsModule";
import { RealAuthPage } from "@/components/RealAuthPage";
import { MicrosoftCallback } from "@/pages/MicrosoftCallback";
import { NotFound } from "@/pages/NotFound";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useNotificationIntegration } from "@/hooks/useNotificationIntegration";
import React, { Suspense, useEffect, useRef } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000,
    },
  },
});

// Protected Route Wrapper Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const redirectRef = useRef(false);
  
  useNotificationIntegration();

  // Prevent multiple redirects
  useEffect(() => {
    if (!loading && !user && !redirectRef.current) {
      redirectRef.current = true;
      console.log('No user found, redirecting to auth from:', window.location.pathname);
    }
  }, [user, loading]);

  // Show loading while auth is being determined
  if (loading) {
    return <LoadingFallback />;
  }

  // Redirect to auth if no user
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  console.log('User authenticated, rendering protected content');
  return (
    <Layout>
      {children}
    </Layout>
  );
};

const App = () => {
  const initRef = useRef(false);
  
  useEffect(() => {
    // Prevent multiple initializations
    if (initRef.current) return;
    initRef.current = true;
    
    console.log('App initialized successfully');
    console.log('Environment:', {
      mode: import.meta.env.MODE,
      dev: import.meta.env.DEV,
      prod: import.meta.env.PROD,
      url: window.location.href,
      isNative: window.Capacitor?.isNative || false
    });
    
    if (window.Capacitor?.isNative) {
      console.log('Native app detected - iOS compatibility mode');
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
                  {/* Public routes */}
                  <Route path="/auth" element={<RealAuthPage />} />
                  <Route path="/microsoft/callback" element={<MicrosoftCallback />} />
                  
                  {/* Protected routes - All use the same ProtectedRoute wrapper */}
                  <Route path="/" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/meetings" element={<ProtectedRoute><MeetingsModule /></ProtectedRoute>} />
                  <Route path="/voting" element={<ProtectedRoute><VotingModule /></ProtectedRoute>} />
                  <Route path="/members" element={<ProtectedRoute><MembersModule /></ProtectedRoute>} />
                  <Route path="/documents" element={<ProtectedRoute><DocumentsModule /></ProtectedRoute>} />
                  <Route path="/email" element={<ProtectedRoute><EmailModule /></ProtectedRoute>} />
                  <Route path="/attendance" element={<ProtectedRoute><AttendanceModule /></ProtectedRoute>} />
                  <Route path="/reports" element={<ProtectedRoute><ReportsModule /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><SettingsModule /></ProtectedRoute>} />
                  
                  {/* 404 fallback */}
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
