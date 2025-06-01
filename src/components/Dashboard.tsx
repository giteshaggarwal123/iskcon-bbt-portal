
import React from 'react';
import { Calendar, FileText, Users, Mail, Clock, Check, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DocumentsModule } from './DocumentsModule';
import { MeetingsModule } from './MeetingsModule';
import { VotingModule } from './VotingModule';
import { AttendanceModule } from './AttendanceModule';
import { EmailModule } from './EmailModule';
import { MembersModule } from './MembersModule';
import { SettingsModule } from './SettingsModule';
import { ReportsModule } from './ReportsModule';
import { MicrosoftConnectionStatus } from './MicrosoftConnectionStatus';
import { useMeetings } from '@/hooks/useMeetings';
import { useDocuments } from '@/hooks/useDocuments';
import { useEmails } from '@/hooks/useEmails';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

interface DashboardProps {
  currentModule?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ currentModule = 'dashboard' }) => {
  const { meetings } = useMeetings();
  const { documents } = useDocuments();
  const { emails } = useEmails();
  const { user } = useAuth();
  const [pollsCount, setPollsCount] = useState(0);
  const [unreadEmailsCount, setUnreadEmailsCount] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      // Fetch active polls count
      const { data: polls } = await supabase
        .from('polls')
        .select('id')
        .eq('status', 'active');
      setPollsCount(polls?.length || 0);
    };

    fetchDashboardData();
  }, [user]);

  useEffect(() => {
    // Count unread emails
    const unreadCount = emails.filter(email => !email.isRead).length;
    setUnreadEmailsCount(unreadCount);
  }, [emails]);

  // Render specific module based on currentModule prop
  switch (currentModule) {
    case 'documents':
      return <DocumentsModule />;
    case 'meetings':
      return <MeetingsModule />;
    case 'voting':
      return <VotingModule />;
    case 'attendance':
      return <AttendanceModule />;
    case 'email':
      return <EmailModule />;
    case 'members':
      return <MembersModule />;
    case 'settings':
      return <SettingsModule />;
    case 'reports':
      return <ReportsModule />;
    default:
      // Default dashboard content with dynamic data
      const upcomingMeetings = meetings.filter(meeting => 
        new Date(meeting.start_time) > new Date()
      ).length;

      const newDocuments = documents.filter(doc => {
        const docDate = new Date(doc.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return docDate > weekAgo;
      }).length;

      return (
        <div className="space-y-6">
          {/* Header with Microsoft 365 Status */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Bureau Dashboard</h1>
              <p className="text-gray-600">Welcome to ISKCON Bureau Management Platform</p>
            </div>
            <div className="flex items-center space-x-4">
              <MicrosoftConnectionStatus />
              <div className="text-right">
                <p className="text-sm text-gray-500">Last Login</p>
                <p className="font-semibold">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
              </div>
            </div>
          </div>

          {/* Quick Stats with Real Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">{upcomingMeetings}</h3>
                  <p className="text-sm text-gray-500">Upcoming Meetings</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <Check className="w-6 h-6 text-success" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">{pollsCount}</h3>
                  <p className="text-sm text-gray-500">Active Polls</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-warning" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">{newDocuments}</h3>
                  <p className="text-sm text-gray-500">New Documents</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-error/10 rounded-lg flex items-center justify-center">
                  <Mail className="w-6 h-6 text-error" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">{unreadEmailsCount}</h3>
                  <p className="text-sm text-gray-500">Unread Emails</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity with Real Data */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Recent Meetings</h2>
              </div>
              <div className="p-6 space-y-4">
                {meetings.slice(0, 2).map((meeting) => {
                  const isUpcoming = new Date(meeting.start_time) > new Date();
                  return (
                    <div key={meeting.id} className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{meeting.title}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(meeting.start_time).toLocaleDateString()} • {new Date(meeting.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        isUpcoming ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'
                      }`}>
                        {isUpcoming ? 'Upcoming' : 'Completed'}
                      </span>
                    </div>
                  );
                })}
                {meetings.length === 0 && (
                  <p className="text-sm text-gray-500">No meetings scheduled</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Recent Documents</h2>
              </div>
              <div className="p-6 space-y-4">
                {documents.slice(0, 2).map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{doc.name}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(doc.created_at).toLocaleDateString()} • {doc.folder || 'General'}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-blue/10 text-blue text-xs rounded-full">
                      {doc.mime_type?.includes('pdf') ? 'PDF' : 'Document'}
                    </span>
                  </div>
                ))}
                {documents.length === 0 && (
                  <p className="text-sm text-gray-500">No documents uploaded</p>
                )}
              </div>
            </div>
          </div>
        </div>
      );
  }
};
