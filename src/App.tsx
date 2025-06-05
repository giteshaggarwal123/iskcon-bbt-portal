
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { MicrosoftCallback } from "./pages/MicrosoftCallback";
import { useCacheBuster } from "./hooks/useCacheBuster";
import { useSessionManager } from "./hooks/useSessionManager";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Disable caching for fresh data
      staleTime: 0,
      gcTime: 0,
    },
  },
});

const AppContent = () => {
  // Initialize session management
  useSessionManager();
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/microsoft-callback" element={<MicrosoftCallback />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => {
  // Clear cache on app load
  useCacheBuster();
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
