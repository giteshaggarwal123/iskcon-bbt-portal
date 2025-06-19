
import React from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout } from './Layout';
import { Dashboard } from './Dashboard';
import { MeetingsModule } from './MeetingsModule';
import { VotingModule } from './VotingModule';
import { MembersModule } from './MembersModule';
import { DocumentsModule } from './DocumentsModule';
import { EmailModule } from './EmailModule';
import { AttendanceModule } from './AttendanceModule';
import { ReportsModule } from './ReportsModule';
import { SettingsModule } from './SettingsModule';
import { NotFound } from '@/pages/NotFound';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationIntegration } from '@/hooks/useNotificationIntegration';

export const AppContent: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  console.log('AppContent rendered', {
    user: !!user,
    currentPath: location.pathname,
    timestamp: new Date().toISOString()
  });
  
  // Initialize notification integration
  useNotificationIntegration();

  if (!user) {
    console.log('No user found, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  const handleNavigate = (module: string, id?: string) => {
    console.log('AppContent navigating to:', module, id);
    try {
      const path = module === 'dashboard' ? '/' : `/${module}`;
      navigate(path);
      console.log('Navigation successful to:', path);
    } catch (error) {
      console.error('Navigation error in AppContent:', error);
    }
  };

  return (
    <Layout onNavigate={handleNavigate}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/meetings" element={<MeetingsModule />} />
        <Route path="/voting" element={<VotingModule />} />
        <Route path="/members" element={<MembersModule />} />
        <Route path="/documents" element={<DocumentsModule />} />
        <Route path="/email" element={<EmailModule />} />
        <Route path="/attendance" element={<AttendanceModule />} />
        <Route path="/reports" element={<ReportsModule />} />
        <Route path="/settings" element={<SettingsModule />} />
        {/* 404 fallback for unknown routes */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
};
