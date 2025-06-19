
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
import { useAuth } from '@/hooks/useAuth';
import { useNotificationIntegration } from '@/hooks/useNotificationIntegration';

export const AppContent: React.FC = () => {
  const { user } = useAuth();
  
  // Initialize notification integration
  useNotificationIntegration();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Layout>
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
      </Routes>
    </Layout>
  );
};
