
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

// Auth Guard Component - NO nested Routes
const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  
  // Initialize notification integration
  useNotificationIntegration();

  console.log('AuthGuard rendered', {
    user: !!user,
    timestamp: new Date().toISOString()
  });

  if (!user) {
    console.log('No user found, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

// Layout Wrapper for Protected Pages
const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  const handleNavigate = (module: string, id?: string) => {
    console.log('Navigation request:', module, id);
    // Navigation is handled by React Router, so this is mainly for logging
  };

  return (
    <AuthGuard>
      <Layout onNavigate={handleNavigate}>
        {children}
      </Layout>
    </AuthGuard>
  );
};

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
                  {/* Public routes - NO auth guard */}
                  <Route path="/auth" element={<RealAuthPage />} />
                  <Route path="/microsoft/callback" element={<MicrosoftCallback />} />
                  
                  {/* Protected routes - All wrapped with ProtectedLayout */}
                  <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
                  <Route path="/meetings" element={<ProtectedLayout><MeetingsModule /></ProtectedLayout>} />
                  <Route path="/voting" element={<ProtectedLayout><VotingModule /></ProtectedLayout>} />
                  <Route path="/members" element={<ProtectedLayout><MembersModule /></ProtectedLayout>} />
                  <Route path="/documents" element={<ProtectedLayout><DocumentsModule /></ProtectedLayout>} />
                  <Route path="/email" element={<ProtectedLayout><EmailModule /></ProtectedLayout>} />
                  <Route path="/attendance" element={<ProtectedLayout><AttendanceModule /></ProtectedLayout>} />
                  <Route path="/reports" element={<ProtectedLayout><ReportsModule /></ProtectedLayout>} />
                  <Route path="/settings" element={<ProtectedLayout><SettingsModule /></ProtectedLayout>} />
                  
                  {/* 404 route */}
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
