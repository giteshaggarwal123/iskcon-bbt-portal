
import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
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
import { AuthProvider, useAuth } from '@/hooks/useAuth';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [currentModule, setCurrentModule] = React.useState('dashboard');

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
        return <SettingsModule />;
      default:
        return <Dashboard />;
    }
  };

  const handleNavigateFromNotification = (module: string, id?: string) => {
    setCurrentModule(module);
    // You can use the id here to scroll to or highlight specific items
    console.log(`Navigating to ${module}${id ? ` with ID: ${id}` : ''}`);
  };

  const handleProfileClick = () => {
    setCurrentModule('settings');
  };

  const handleSettingsClick = () => {
    setCurrentModule('settings');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        currentModule={currentModule}
        onModuleChange={setCurrentModule}
      />
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <Header 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          onProfileClick={handleProfileClick}
          onSettingsClick={handleSettingsClick}
          onNavigate={handleNavigateFromNotification}
        />
        <main className="p-6">
          {renderModule()}
        </main>
      </div>
    </div>
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
