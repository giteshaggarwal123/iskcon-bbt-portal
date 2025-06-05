
import React, { Suspense } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { RealAuthPage } from '@/components/RealAuthPage';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { AuthProvider, useAuth } from '@/hooks/useAuth';

// Lazy load heavy components
const Dashboard = React.lazy(() => import('@/components/Dashboard').then(module => ({ default: module.Dashboard })));
const MeetingsModule = React.lazy(() => import('@/components/MeetingsModule').then(module => ({ default: module.MeetingsModule })));
const DocumentsModule = React.lazy(() => import('@/components/DocumentsModule').then(module => ({ default: module.DocumentsModule })));
const VotingModule = React.lazy(() => import('@/components/VotingModule').then(module => ({ default: module.VotingModule })));
const AttendanceModule = React.lazy(() => import('@/components/AttendanceModule').then(module => ({ default: module.AttendanceModule })));
const EmailModule = React.lazy(() => import('@/components/EmailModule').then(module => ({ default: module.EmailModule })));
const MembersModule = React.lazy(() => import('@/components/MembersModule').then(module => ({ default: module.MembersModule })));
const ReportsModule = React.lazy(() => import('@/components/ReportsModule').then(module => ({ default: module.ReportsModule })));
const SettingsModule = React.lazy(() => import('@/components/SettingsModule').then(module => ({ default: module.SettingsModule })));

const AppContent = () => {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [currentModule, setCurrentModule] = React.useState('dashboard');

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <RealAuthPage />;
  }

  const renderModule = () => {
    const ModuleComponent = (() => {
      switch (currentModule) {
        case 'dashboard':
          return Dashboard;
        case 'meetings':
          return MeetingsModule;
        case 'documents':
          return DocumentsModule;
        case 'voting':
          return VotingModule;
        case 'attendance':
          return AttendanceModule;
        case 'email':
          return EmailModule;
        case 'members':
          return MembersModule;
        case 'reports':
          return ReportsModule;
        case 'settings':
          return SettingsModule;
        default:
          return Dashboard;
      }
    })();

    return (
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }>
        <ModuleComponent />
      </Suspense>
    );
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
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
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
