
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, Users, FileText, Mail, TrendingUp, Clock, MessageSquare, Vote, CheckCircle } from 'lucide-react';
import { useMeetings } from '@/hooks/useMeetings';
import { useMembers } from '@/hooks/useMembers';
import { useDocuments } from '@/hooks/useDocuments';
import { useEmails } from '@/hooks/useEmails';
import { MicrosoftConnectionStatus } from './MicrosoftConnectionStatus';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  totalMembers: number;
  activeMeetings: number;
  documentsCount: number;
  emailsCount: number;
  inboxEmailsCount: number;
  pollsCount: number;
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    activeMeetings: 0,
    documentsCount: 0,
    emailsCount: 0,
    inboxEmailsCount: 0,
    pollsCount: 0
  });

  const { meetings, loading: meetingsLoading } = useMeetings();
  const { members, loading: membersLoading } = useMembers();
  const { documents, loading: documentsLoading } = useDocuments();
  const { emails, loading: emailsLoading } = useEmails();

  // Fetch additional stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch emails count from Supabase (sent emails)
        const { count: emailsCount } = await supabase
          .from('emails')
          .select('*', { count: 'exact', head: true });

        // Fetch polls count
        const { count: pollsCount } = await supabase
          .from('polls')
          .select('*', { count: 'exact', head: true });

        // Calculate active meetings (today's meetings)
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
        
        const activeMeetings = meetings.filter(meeting => {
          const meetingDate = new Date(meeting.start_time);
          return meetingDate >= todayStart && meetingDate < todayEnd;
        }).length;

        setStats({
          totalMembers: members.length,
          activeMeetings,
          documentsCount: documents.length,
          emailsCount: emailsCount || 0,
          inboxEmailsCount: emails.length, // Outlook inbox emails
          pollsCount: pollsCount || 0
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };

    if (!meetingsLoading && !membersLoading && !documentsLoading && !emailsLoading) {
      fetchStats();
    }
  }, [meetings, members, documents, emails, meetingsLoading, membersLoading, documentsLoading, emailsLoading]);

  // Set up real-time subscriptions for live updates
  useEffect(() => {
    const channels = [
      supabase
        .channel('meetings-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'meetings' }, () => {
          // Refresh stats when meetings change
          setStats(prev => ({ ...prev }));
        })
        .subscribe(),

      supabase
        .channel('members-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
          // Refresh stats when members change
          setStats(prev => ({ ...prev }));
        })
        .subscribe(),

      supabase
        .channel('documents-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, () => {
          // Refresh stats when documents change
          setStats(prev => ({ ...prev }));
        })
        .subscribe(),

      supabase
        .channel('emails-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'emails' }, async () => {
          const { count } = await supabase.from('emails').select('*', { count: 'exact', head: true });
          setStats(prev => ({ ...prev, emailsCount: count || 0 }));
        })
        .subscribe(),

      supabase
        .channel('polls-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'polls' }, async () => {
          const { count } = await supabase.from('polls').select('*', { count: 'exact', head: true });
          setStats(prev => ({ ...prev, pollsCount: count || 0 }));
        })
        .subscribe()
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, []);

  // Auto-refresh inbox emails every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!emailsLoading) {
        // This will trigger a refresh of the emails hook
        setStats(prev => ({ ...prev, inboxEmailsCount: emails.length }));
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [emails.length, emailsLoading]);

  const recentMeetings = meetings
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .slice(0, 3);

  const recentDocuments = documents
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  const recentEmails = emails
    .sort((a, b) => new Date(b.receivedDateTime).getTime() - new Date(a.receivedDateTime).getTime())
    .slice(0, 3);

  const unreadEmailsCount = emails.filter(email => !email.isRead).length;

  return (
    <div className="space-y-6 p-6">
      {/* Header with Connection Status - Fixed positioning */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Bureau Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex-shrink-0">
          <MicrosoftConnectionStatus />
        </div>
      </div>

      {/* Stats Cards - Improved responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMembers}</div>
            <p className="text-xs text-muted-foreground">Bureau members</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Meetings</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeMeetings}</div>
            <p className="text-xs text-muted-foreground">Scheduled for today</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.documentsCount}</div>
            <p className="text-xs text-muted-foreground">Files stored</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inbox Emails</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inboxEmailsCount}</div>
            <p className="text-xs text-muted-foreground">
              {unreadEmailsCount > 0 ? `${unreadEmailsCount} unread` : 'All read'}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Polls</CardTitle>
            <Vote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pollsCount}</div>
            <p className="text-xs text-muted-foreground">Voting polls</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats with Real Data - Improved responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <CalendarDays className="w-6 h-6 text-primary" />
            </div>
            <div className="ml-4 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900">{stats.activeMeetings}</h3>
              <p className="text-sm text-gray-500">Today's Meetings</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <div className="ml-4 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900">{stats.pollsCount}</h3>
              <p className="text-sm text-gray-500">Active Polls</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-yellow-500" />
            </div>
            <div className="ml-4 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900">{stats.documentsCount}</h3>
              <p className="text-sm text-gray-500">Documents</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Mail className="w-6 h-6 text-red-500" />
            </div>
            <div className="ml-4 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900">{stats.inboxEmailsCount}</h3>
              <p className="text-sm text-gray-500 truncate">
                Inbox ({unreadEmailsCount} unread)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity with Real Data - Improved responsive grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Meetings</h2>
          </div>
          <div className="p-6 space-y-4">
            {recentMeetings.map((meeting) => {
              const isUpcoming = new Date(meeting.start_time) > new Date();
              return (
                <div key={meeting.id} className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-gray-900 truncate">{meeting.title}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(meeting.start_time).toLocaleDateString()} • {new Date(meeting.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ml-2 ${
                    isUpcoming ? 'bg-primary/10 text-primary' : 'bg-green-500/10 text-green-500'
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
            {recentDocuments.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-gray-900 truncate">{doc.name}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(doc.created_at).toLocaleDateString()} • {doc.folder || 'General'}
                  </p>
                </div>
                <span className="px-2 py-1 bg-blue-500/10 text-blue-500 text-xs rounded-full flex-shrink-0 ml-2">
                  {doc.mime_type?.includes('pdf') ? 'PDF' : 'Document'}
                </span>
              </div>
            ))}
            {documents.length === 0 && (
              <p className="text-sm text-gray-500">No documents uploaded</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Emails</h2>
          </div>
          <div className="p-6 space-y-4">
            {recentEmails.map((email) => (
              <div key={email.id} className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-gray-900 truncate">{email.subject}</h3>
                  <p className="text-sm text-gray-500 truncate">
                    {email.from.name} • {new Date(email.receivedDateTime).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                  {!email.isRead && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                  {email.importance === 'high' && (
                    <span className="px-2 py-1 bg-red-500/10 text-red-500 text-xs rounded-full">
                      High
                    </span>
                  )}
                </div>
              </div>
            ))}
            {emails.length === 0 && (
              <p className="text-sm text-gray-500">No emails found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
