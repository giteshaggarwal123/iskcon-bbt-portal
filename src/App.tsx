
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { MicrosoftCallback } from "./pages/MicrosoftCallback";
import { Layout } from "@/components/Layout";
import { SettingsModule } from "@/components/SettingsModule";
import { MeetingsModule } from "@/components/MeetingsModule";
import { DocumentsModule } from "@/components/DocumentsModule";
import { VotingModule } from "@/components/VotingModule";
import { AttendanceModule } from "@/components/AttendanceModule";
import { EmailModule } from "@/components/EmailModule";
import { MembersModule } from "@/components/MembersModule";
import { ReportsModule } from "@/components/ReportsModule";
import { AuthProvider } from "@/hooks/useAuth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/meetings" element={
              <Layout>
                <MeetingsModule />
              </Layout>
            } />
            <Route path="/documents" element={
              <Layout>
                <DocumentsModule />
              </Layout>
            } />
            <Route path="/voting" element={
              <Layout>
                <VotingModule />
              </Layout>
            } />
            <Route path="/attendance" element={
              <Layout>
                <AttendanceModule />
              </Layout>
            } />
            <Route path="/email" element={
              <Layout>
                <EmailModule />
              </Layout>
            } />
            <Route path="/members" element={
              <Layout>
                <MembersModule />
              </Layout>
            } />
            <Route path="/reports" element={
              <Layout>
                <ReportsModule />
              </Layout>
            } />
            <Route path="/settings" element={
              <Layout>
                <SettingsModule />
              </Layout>
            } />
            <Route path="/microsoft-callback" element={<MicrosoftCallback />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
