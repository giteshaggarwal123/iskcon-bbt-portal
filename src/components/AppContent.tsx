
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LoadingFallback } from './LoadingFallback';
import { AuthPage } from './AuthPage';
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

  // Handle splash screen for mobile
  useEffect(() => {
    if (deviceInfo.isNative) {
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 2000);
      return () => clearTimeout(timer);
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
    if (user && !isConnected && !isExpired) {
      const timer = setTimeout(() => {
        setShowMicrosoftPrompt(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user, isConnected, isExpired]);

  // Show splash screen on mobile
  if (showSplash) {
    return <MobileSplashScreen />;
  }

  if (authLoading) {
    return <LoadingFallback />;
  }

  if (!user) {
    return <AuthPage />;
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
