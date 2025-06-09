
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, FileText, Vote, Clock, Plus, ChevronRight, Bell, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  totalMembers: number;
  totalDocuments: number;
  upcomingMeetings: number;
  activePreviousPolls: number;
  recentActivity: Array<{
    id: string;
    type: 'meeting' | 'document' | 'poll' | 'member';
    title: string;
    description: string;
    timestamp: string;
    user?: string;
  }>;
}

interface Meeting {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  status: string;
}

interface Poll {
  id: string;
  title: string;
  status: string;
  created_at: string;
  deadline: string;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const userRole = useUserRole();
  const isMobile = useIsMobile();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    totalDocuments: 0,
    upcomingMeetings: 0,
    activePreviousPolls: 0,
    recentActivity: []
  });
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [activePolls, setActivePolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch total counts
        const { data: membersData, error: membersError } = await supabase
          .from('profiles')
          .select('count', { count: 'exact' });

        const { data: documentsData, error: documentsError } = await supabase
          .from('documents')
          .select('count', { count: 'exact' });

        // Fetch upcoming meetings
        const { data: meetingsData, error: meetingsError } = await supabase
          .from('meetings')
          .select('*')
          .gte('start_time', new Date().toISOString())
          .order('start_time', { ascending: true })
          .limit(5);

        // Fetch active polls
        const { data: pollsData, error: pollsError } = await supabase
          .from('polls')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(5);

        // Create some sample recent activity since we don't have an activity_log table
        const recentActivity = [
          {
            id: '1',
            type: 'meeting' as const,
            title: 'Board Meeting Scheduled',
            description: 'Monthly board meeting scheduled for next week',
            timestamp: new Date().toISOString(),
            user: 'Admin'
          },
          {
            id: '2',
            type: 'document' as const,
            title: 'New Document Uploaded',
            description: 'Financial report for Q1 uploaded',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            user: 'Secretary'
          }
        ];

        if (membersError || documentsError || meetingsError || pollsError) {
          console.error('Error fetching data:', membersError, documentsError, meetingsError, pollsError);
        }

        setStats(prev => ({
          ...prev,
          totalMembers: membersData ? membersData[0].count : 0,
          totalDocuments: documentsData ? documentsData[0].count : 0,
          upcomingMeetings: meetingsData ? meetingsData.length : 0,
          activePreviousPolls: pollsData ? pollsData.length : 0,
          recentActivity: recentActivity
        }));

        setUpcomingMeetings(meetingsData || []);
        setActivePolls(pollsData || []);

      } catch (error) {
        console.error('Unexpected error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const navigateToModule = (module: string) => {
    const event = new CustomEvent('navigate-to-module', { detail: { module } });
    window.dispatchEvent(event);
  };

  const navigateToPoll = (pollId: string) => {
    const event = new CustomEvent('navigate-to-poll', { detail: { pollId } });
    window.dispatchEvent(event);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6 p-4 lg:p-6">
      {/* Welcome Header - Mobile optimized */}
      <div className="space-y-2">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
          Welcome back, {user?.user_metadata?.first_name || user?.email}!
        </h1>
        <p className="text-sm lg:text-base text-gray-600">
          Here's what's happening in your organization today.
        </p>
      </div>

      {/* Quick Stats - Mobile optimized grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigateToModule('members')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl lg:text-2xl font-bold">{stats.totalMembers}</div>
            <p className="text-xs text-muted-foreground">Active members</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigateToModule('documents')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl lg:text-2xl font-bold">{stats.totalDocuments}</div>
            <p className="text-xs text-muted-foreground">Total files</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigateToModule('meetings')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium">Meetings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl lg:text-2xl font-bold">{stats.upcomingMeetings}</div>
            <p className="text-xs text-muted-foreground">Upcoming</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigateToModule('voting')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium">Active Polls</CardTitle>
            <Vote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl lg:text-2xl font-bold">{stats.activePreviousPolls}</div>
            <p className="text-xs text-muted-foreground">Awaiting votes</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid - Mobile responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Upcoming Meetings - Mobile optimized */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg lg:text-xl">Upcoming Meetings</CardTitle>
                <CardDescription className="text-sm">Next scheduled meetings</CardDescription>
              </div>
              {userRole.canManageMeetings && (
                <Button 
                  size="sm" 
                  onClick={() => navigateToModule('meetings')}
                  className="h-8 lg:h-9 text-xs lg:text-sm"
                >
                  <Plus className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                  New
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingMeetings.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No upcoming meetings</p>
              </div>
            ) : (
              upcomingMeetings.slice(0, isMobile ? 2 : 3).map((meeting) => (
                <div key={meeting.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm lg:text-base truncate">{meeting.title}</h4>
                    <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-2 space-y-1 lg:space-y-0">
                      <p className="text-xs lg:text-sm text-gray-500">
                        {new Date(meeting.start_time).toLocaleDateString()}
                      </p>
                      <p className="text-xs lg:text-sm text-gray-500">
                        {new Date(meeting.start_time).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                </div>
              ))
            )}
            {upcomingMeetings.length > 0 && (
              <Button 
                variant="ghost" 
                className="w-full text-sm" 
                onClick={() => navigateToModule('meetings')}
              >
                View All Meetings
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Active Polls - Mobile optimized */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg lg:text-xl">Active Polls</CardTitle>
                <CardDescription className="text-sm">Polls awaiting your vote</CardDescription>
              </div>
              {userRole.canCreateContent && (
                <Button 
                  size="sm" 
                  onClick={() => navigateToModule('voting')}
                  className="h-8 lg:h-9 text-xs lg:text-sm"
                >
                  <Plus className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                  New
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {activePolls.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Vote className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No active polls</p>
              </div>
            ) : (
              activePolls.slice(0, isMobile ? 2 : 3).map((poll) => (
                <div 
                  key={poll.id} 
                  className="p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => navigateToPoll(poll.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm lg:text-base line-clamp-2">{poll.title}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {poll.status}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Ends {new Date(poll.deadline).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
                  </div>
                </div>
              ))
            )}
            {activePolls.length > 0 && (
              <Button 
                variant="ghost" 
                className="w-full text-sm" 
                onClick={() => navigateToModule('voting')}
              >
                View All Polls
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity - Mobile optimized */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg lg:text-xl">Recent Activity</CardTitle>
          <CardDescription className="text-sm">Latest updates and changes</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentActivity.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentActivity.slice(0, isMobile ? 3 : 5).map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0 mt-0.5">
                    {activity.type === 'meeting' && <Calendar className="h-4 w-4 text-blue-500" />}
                    {activity.type === 'document' && <FileText className="h-4 w-4 text-green-500" />}
                    {activity.type === 'poll' && <Vote className="h-4 w-4 text-purple-500" />}
                    {activity.type === 'member' && <Users className="h-4 w-4 text-orange-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm lg:text-base">{activity.title}</h4>
                    <p className="text-xs lg:text-sm text-gray-500 line-clamp-2">{activity.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(activity.timestamp).toLocaleDateString()} at{' '}
                      {new Date(activity.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
