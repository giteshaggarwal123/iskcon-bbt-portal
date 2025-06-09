
import React from 'react';
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
import { Layout } from '@/components/Layout';
import { AuthProvider, useAuth } from '@/hooks/useAuth';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [currentModule, setCurrentModule] = React.useState('dashboard');
  const [avatarRefreshTrigger, setAvatarRefreshTrigger] = React.useState(0);

  // Listen for navigation events from dashboard
  React.useEffect(() => {
    const handleNavigateToModule = (event: any) => {
      setCurrentModule(event.detail.module);
    };

    const handleNavigateToPoll = (event: any) => {
      setCurrentModule('voting');
    };

    window.addEventListener('navigate-to-module', handleNavigateToModule);
    window.addEventListener('navigate-to-poll', handleNavigateToPoll);

    return () => {
      window.removeEventListener('navigate-to-module', handleNavigateToModule);
      window.removeEventListener('navigate-to-poll', handleNavigateToPoll);
    };
  }, []);

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

  const renderModule = () => {
    switch (currentModule) {
      case 'dashboard':
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
      case 'profile':
        return <SettingsModule onAvatarUpdate={() => setAvatarRefreshTrigger(prev => prev + 1)} />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentModule={currentModule} onModuleChange={setCurrentModule}>
      {renderModule()}
    </Layout>
  );
};

const Index = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default Index;
