
import React from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Dashboard } from '@/components/Dashboard';
import { MeetingsModule } from '@/components/MeetingsModule';
import { DocumentsModule } from '@/components/DocumentsModule';
import { VotingModule } from '@/components/VotingModule';
import { AttendanceModule } from '@/components/AttendanceModule';
import { EmailModule } from '@/components/EmailModule';
import { MembersModule } from '@/components/MembersModule';
import { ReportsModule } from '@/components/ReportsModule';
import { SettingsModule } from '@/components/SettingsModule';
import { RealAuthPage } from '@/components/RealAuthPage';
import { MobileResponsiveLayout } from '@/components/MobileResponsiveLayout';
import { MicrosoftAuthPrompt } from '@/components/MicrosoftAuthPrompt';
import { useAuth } from '@/hooks/useAuth';
import { useMicrosoftAuth } from '@/hooks/useMicrosoftAuth';

export const AppContent = () => {
  const { user, loading } = useAuth();
  const { isConnected, loading: msLoading } = useMicrosoftAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [avatarRefreshTrigger, setAvatarRefreshTrigger] = React.useState(0);
  const [showMicrosoftPrompt, setShowMicrosoftPrompt] = React.useState(false);

  // Get current module from URL path
  const getCurrentModule = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'dashboard';
    if (path.startsWith('/meetings')) return 'meetings';
    if (path.startsWith('/documents')) return 'documents';
    if (path.startsWith('/voting')) return 'voting';
    if (path.startsWith('/attendance')) return 'attendance';
    if (path.startsWith('/email')) return 'email';
    if (path.startsWith('/members')) return 'members';
    if (path.startsWith('/reports')) return 'reports';
    if (path.startsWith('/settings')) return 'settings';
    return 'dashboard';
  };

  const currentModule = getCurrentModule();

  // Check if this is first time user or session reset
  React.useEffect(() => {
    console.log('Microsoft auth check:', { user: !!user, loading, msLoading, isConnected });
    
    if (user && !loading && !msLoading) {
      const hasShownPrompt = localStorage.getItem('microsoft_prompt_shown');
      const lastUserId = localStorage.getItem('last_user_id');
      
      console.log('Microsoft prompt logic:', { 
        hasShownPrompt, 
        lastUserId, 
        currentUserId: user.id, 
        isConnected 
      });
      
      // Show prompt if:
      // 1. Never shown before for this user, OR
      // 2. Different user (session reset), OR  
      // 3. Not connected to Microsoft
      const shouldShowPrompt = !hasShownPrompt || 
                              lastUserId !== user.id || 
                              !isConnected;
      
      console.log('Should show Microsoft prompt:', shouldShowPrompt);
      
      if (shouldShowPrompt) {
        setShowMicrosoftPrompt(true);
      }
      
      // Store current user ID
      localStorage.setItem('last_user_id', user.id);
    }
  }, [user, loading, msLoading, isConnected]);

  const handleMicrosoftPromptClose = () => {
    console.log('Microsoft prompt closed');
    setShowMicrosoftPrompt(false);
    localStorage.setItem('microsoft_prompt_shown', 'true');
  };

  const handleMicrosoftPromptSkip = () => {
    console.log('Microsoft prompt skipped');
    setShowMicrosoftPrompt(false);
    localStorage.setItem('microsoft_prompt_shown', 'true');
  };

  // Listen for navigation events from dashboard and handle URL navigation
  React.useEffect(() => {
    const handleNavigateToModule = (event: any) => {
      const module = event.detail.module;
      const path = module === 'dashboard' ? '/' : `/${module}`;
      navigate(path);
    };

    const handleNavigateToPoll = (event: any) => {
      navigate('/voting');
    };

    const handleProfileUpdate = () => {
      setAvatarRefreshTrigger(prev => prev + 1);
    };

    window.addEventListener('navigate-to-module', handleNavigateToModule);
    window.addEventListener('navigate-to-poll', handleNavigateToPoll);
    window.addEventListener('profileUpdated', handleProfileUpdate);

    return () => {
      window.removeEventListener('navigate-to-module', handleNavigateToModule);
      window.removeEventListener('navigate-to-poll', handleNavigateToPoll);
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <RealAuthPage />;
  }

  return (
    <>
      <MobileResponsiveLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/meetings" element={<MeetingsModule />} />
          <Route path="/documents" element={<DocumentsModule />} />
          <Route path="/voting" element={<VotingModule />} />
          <Route path="/attendance" element={<AttendanceModule />} />
          <Route path="/email" element={<EmailModule />} />
          <Route path="/members" element={<MembersModule />} />
          <Route path="/reports" element={<ReportsModule />} />
          <Route path="/settings" element={<SettingsModule onAvatarUpdate={() => setAvatarRefreshTrigger(prev => prev + 1)} />} />
          {/* Catch all other routes and redirect to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MobileResponsiveLayout>
      
      <MicrosoftAuthPrompt
        isOpen={showMicrosoftPrompt}
        onClose={handleMicrosoftPromptClose}
        onSkip={handleMicrosoftPromptSkip}
      />
    </>
  );
};
