
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
import { useDeviceInfo } from '@/hooks/useDeviceInfo';

export const AppContent = () => {
  const { user, loading } = useAuth();
  const { isConnected, loading: msLoading } = useMicrosoftAuth();
  const deviceInfo = useDeviceInfo();
  const [currentModule, setCurrentModule] = React.useState('dashboard');
  const [avatarRefreshTrigger, setAvatarRefreshTrigger] = React.useState(0);
  const [showMicrosoftPrompt, setShowMicrosoftPrompt] = React.useState(false);

  // Add mobile-specific error handling
  React.useEffect(() => {
    if (deviceInfo.isNative) {
      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        console.error('Unhandled promise rejection on mobile:', event.reason);
        event.preventDefault();
      };

      window.addEventListener('unhandledrejection', handleUnhandledRejection);
      return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    }
  }, [deviceInfo.isNative]);

  // Improved Microsoft prompt logic
  React.useEffect(() => {
    console.log('Microsoft auth check:', { 
      user: !!user, 
      loading, 
      msLoading, 
      isConnected,
      showMicrosoftPrompt 
    });
    
    if (user && !loading && !msLoading) {
      const hasShownPrompt = localStorage.getItem('microsoft_prompt_shown');
      const lastUserId = localStorage.getItem('last_user_id');
      
      console.log('Microsoft prompt logic:', { 
        hasShownPrompt, 
        lastUserId, 
        currentUserId: user.id, 
        isConnected,
        isNewUser: lastUserId !== user.id
      });
      
      // Show prompt only if:
      // 1. User is not already connected to Microsoft AND
      // 2. (Never shown before OR different user) AND
      // 3. Not currently showing the prompt
      const shouldShowPrompt = !isConnected && 
                              (!hasShownPrompt || lastUserId !== user.id) &&
                              !showMicrosoftPrompt;
      
      console.log('Should show Microsoft prompt:', shouldShowPrompt);
      
      if (shouldShowPrompt) {
        // Small delay to ensure UI is ready
        setTimeout(() => {
          setShowMicrosoftPrompt(true);
        }, 1000);
      }
      
      // Store current user ID
      localStorage.setItem('last_user_id', user.id);
    }
  }, [user, loading, msLoading, isConnected, showMicrosoftPrompt]);

  // Hide prompt when Microsoft gets connected
  React.useEffect(() => {
    if (isConnected && showMicrosoftPrompt) {
      console.log('Microsoft connected, hiding prompt');
      setShowMicrosoftPrompt(false);
      localStorage.setItem('microsoft_prompt_shown', 'true');
    }
  }, [isConnected, showMicrosoftPrompt]);

  const handleMicrosoftPromptClose = () => {
    console.log('Microsoft prompt closed by user');
    setShowMicrosoftPrompt(false);
    localStorage.setItem('microsoft_prompt_shown', 'true');
  };

  const handleMicrosoftPromptSkip = () => {
    console.log('Microsoft prompt skipped by user');
    setShowMicrosoftPrompt(false);
    localStorage.setItem('microsoft_prompt_shown', 'true');
  };

  // Listen for navigation events from dashboard
  React.useEffect(() => {
    const handleNavigateToModule = (event: any) => {
      setCurrentModule(event.detail.module);
    };

    const handleNavigateToPoll = (event: any) => {
      setCurrentModule('voting');
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
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ISKCON Portal...</p>
          {deviceInfo.isNative && (
            <p className="text-sm text-gray-500 mt-2">Mobile App Loading</p>
          )}
        </div>
      </div>
    );
  }

  if (!user) {
    return <RealAuthPage />;
  }

  const renderModule = () => {
    try {
      switch (currentModule) {
        case 'dashboard':
        default:
          return <Dashboard />;
        case 'meetings':
          return <MeetingsModule />;
        case 'documents':
          return <DocumentsModule />;
        case 'voting':
          return <VotingModule />;
        case 'attendance':
          return <AttendanceModule />;
        case 'email':
          return <EmailModule />;
        case 'members':
          return <MembersModule />;
        case 'reports':
          return <ReportsModule />;
        case 'settings':
          return <SettingsModule onAvatarUpdate={() => setAvatarRefreshTrigger(prev => prev + 1)} />;
      }
    } catch (error) {
      console.error('Error rendering module:', error);
      return (
        <div className="p-6 text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Module Error</h2>
          <p className="text-gray-600 mb-4">There was an error loading this module.</p>
          <button 
            onClick={() => setCurrentModule('dashboard')}
            className="bg-primary text-white px-4 py-2 rounded"
          >
            Return to Dashboard
          </button>
        </div>
      );
    }
  };

  return (
    <>
      <MobileResponsiveLayout>
        {renderModule()}
      </MobileResponsiveLayout>
      
      <MicrosoftAuthPrompt
        isOpen={showMicrosoftPrompt}
        onClose={handleMicrosoftPromptClose}
        onSkip={handleMicrosoftPromptSkip}
      />
    </>
  );
};
