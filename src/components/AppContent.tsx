
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LoadingFallback } from './LoadingFallback';
import { RealAuthPage } from './RealAuthPage';
import { Layout } from './Layout';
import { Dashboard } from './Dashboard';
import { MeetingsModule } from './MeetingsModule';
import { DocumentsModule } from './DocumentsModule';
import { AttendanceModule } from './AttendanceModule';
import { VotingModule } from './VotingModule';
import { MembersModule } from './MembersModule';
import { ReportsModule } from './ReportsModule';
import { SettingsModule } from './SettingsModule';
import { MicrosoftAuthPrompt } from './MicrosoftAuthPrompt';
import { useMicrosoftAuth } from '@/hooks/useMicrosoftAuth';
import { MobileSplashScreen } from './MobileSplashScreen';
import { useDeviceInfo } from '@/hooks/useDeviceInfo';

export const AppContent = () => {
  const { user, loading: authLoading } = useAuth();
  const { isConnected, isExpired } = useMicrosoftAuth();
  const deviceInfo = useDeviceInfo();
  const [currentModule, setCurrentModule] = useState('dashboard');
  const [showMicrosoftPrompt, setShowMicrosoftPrompt] = useState(false);
  const [showSplash, setShowSplash] = useState(deviceInfo.isNative);
  const [appReady, setAppReady] = useState(false);

  // Handle splash screen for mobile with shorter duration
  useEffect(() => {
    if (deviceInfo.isNative) {
      const timer = setTimeout(() => {
        setShowSplash(false);
        setAppReady(true);
      }, 1200); // Reduced from 2000ms to 1200ms
      return () => clearTimeout(timer);
    } else {
      // For web, set ready immediately
      setAppReady(true);
    }
  }, [deviceInfo.isNative]);

  // Listen for module navigation events
  useEffect(() => {
    const handleNavigateToModule = (event: CustomEvent) => {
      console.log('Navigating to module:', event.detail.module);
      setCurrentModule(event.detail.module);
    };

    window.addEventListener('navigate-to-module', handleNavigateToModule as EventListener);

    return () => {
      window.removeEventListener('navigate-to-module', handleNavigateToModule as EventListener);
    };
  }, []);

  // Show Microsoft prompt if user is authenticated but Microsoft is not connected
  useEffect(() => {
    if (user && !isConnected && !isExpired && appReady) {
      const timer = setTimeout(() => {
        setShowMicrosoftPrompt(true);
      }, 1500); // Reduced delay
      return () => clearTimeout(timer);
    }
  }, [user, isConnected, isExpired, appReady]);

  // Show splash screen on mobile
  if (showSplash && deviceInfo.isNative) {
    return <MobileSplashScreen />;
  }

  // Show loading only if auth is still loading and app is ready
  if (authLoading && appReady) {
    return <LoadingFallback />;
  }

  // If app is not ready yet (for web), show minimal loading
  if (!appReady) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <RealAuthPage />;
  }

  const renderCurrentModule = () => {
    switch (currentModule) {
      case 'dashboard':
        return <Dashboard />;
      case 'meetings':
        return <MeetingsModule />;
      case 'documents':
        return <DocumentsModule />;
      case 'attendance':
        return <AttendanceModule />;
      case 'voting':
        return <VotingModule />;
      case 'members':
        return <MembersModule />;
      case 'reports':
        return <ReportsModule />;
      case 'settings':
      case 'profile':
        return <SettingsModule />;
      default:
        console.warn('Unknown module:', currentModule);
        return <Dashboard />;
    }
  };

  return (
    <>
      <Layout>
        {renderCurrentModule()}
      </Layout>
      
      <MicrosoftAuthPrompt
        isOpen={showMicrosoftPrompt}
        onClose={() => setShowMicrosoftPrompt(false)}
        onSkip={() => setShowMicrosoftPrompt(false)}
      />
    </>
  );
};
