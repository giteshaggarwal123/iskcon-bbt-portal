
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, FileText, Mail, Vote, ExternalLink, Play } from 'lucide-react';
import { useMeetings } from '@/hooks/useMeetings';
import { useMembers } from '@/hooks/useMembers';
import { useDocuments } from '@/hooks/useDocuments';
import { useEmails } from '@/hooks/useEmails';
import { MicrosoftConnectionStatus } from './MicrosoftConnectionStatus';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Poll {
  id: string;
  title: string;
  description: string;
  status: string;
  deadline: string;
  created_at: string;
}

export const Dashboard: React.FC = () => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const { meetings, loading: meetingsLoading } = useMeetings();
  const { documents, loading: documentsLoading } = useDocuments();
  const { emails, loading: emailsLoading } = useEmails();
  const { toast } = useToast();

  // Fetch active polls
  useEffect(() => {
    const fetchActivePolls = async () => {
      try {
        const { data, error } = await supabase
          .from('polls')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(3);

        if (error) throw error;
        setPolls(data || []);
      } catch (error) {
        console.error('Error fetching polls:', error);
      }
    };

    fetchActivePolls();
  }, []);

  // Filter and sort meetings - only upcoming meetings, sorted by nearest first
  const upcomingMeetings = meetings
    .filter(meeting => new Date(meeting.start_time) > new Date())
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .slice(0, 3);

  // Sort documents by newest first
  const recentDocuments = documents
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  // Sort emails by newest first
  const recentEmails = emails
    .sort((a, b) => new Date(b.receivedDateTime).getTime() - new Date(a.receivedDateTime).getTime())
    .slice(0, 3);

  // Sort polls by newest deadline first
  const sortedPolls = polls
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 3);

  const handleJoinMeeting = (meeting: any) => {
    if (meeting.teams_join_url) {
      window.open(meeting.teams_join_url, '_blank');
    } else {
      toast({
        title: "No Teams Link",
        description: "This meeting doesn't have a Teams link available",
        variant: "destructive"
      });
    }
  };

  const handleOpenDocument = (doc: any) => {
    // Simulate opening document - in real implementation this would open the actual document
    toast({
      title: "Opening Document",
      description: `Opening ${doc.name}...`
    });
  };

  const handleOpenEmail = (email: any) => {
    // Open Outlook web with the specific email
    const outlookUrl = `https://outlook.office.com/mail/inbox/id/${email.id}`;
    window.open(outlookUrl, '_blank');
  };

  const handleVoteNow = (poll: Poll) => {
    // Navigate to voting module with specific poll
    const event = new CustomEvent('navigate-to-poll', { detail: { pollId: poll.id } });
    window.dispatchEvent(event);
  };

  const handleViewMore = (module: string) => {
    const event = new CustomEvent('navigate-to-module', { detail: { module } });
    window.dispatchEvent(event);
  };

  const isPastDeadline = (deadline: string) => new Date(deadline) < new Date();

  return (
    <div className="space-y-6">
      {/* Header with Connection Status */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bureau Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening today.</p>
        </div>
        <MicrosoftConnectionStatus />
      </div>

      {/* Main Grid - 4 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Upcoming Meetings */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <CalendarDays className="h-5 w-5 text-primary" />
              <span>Upcoming Meetings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingMeetings.length > 0 ? (
              <>
                {upcomingMeetings.map((meeting) => (
                  <div key={meeting.id} className="border-b pb-2 last:border-b-0">
                    <h4 className="font-medium text-sm text-gray-900 truncate">{meeting.title}</h4>
                    <p className="text-xs text-gray-500">
                      {new Date(meeting.start_time).toLocaleDateString()} • {new Date(meeting.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <div className="mt-1 flex space-x-2">
                      {meeting.teams_join_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-xs"
                          onClick={() => handleJoinMeeting(meeting)}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Join Now
                        </Button>
                      )}
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                        Upcoming
                      </span>
                    </div>
                  </div>
                ))}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full mt-2 text-xs"
                  onClick={() => handleViewMore('meetings')}
                >
                  View More
                </Button>
              </>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No upcoming meetings</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Documents */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <FileText className="h-5 w-5 text-yellow-500" />
              <span>Recent Documents</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentDocuments.length > 0 ? (
              <>
                {recentDocuments.map((doc) => (
                  <div key={doc.id} className="border-b pb-2 last:border-b-0">
                    <h4 className="font-medium text-sm text-gray-900 truncate">{doc.name}</h4>
                    <p className="text-xs text-gray-500">
                      {new Date(doc.created_at).toLocaleDateString()} • {doc.folder || 'General'}
                    </p>
                    <div className="mt-1 flex justify-between items-center">
                      <span className="text-xs px-2 py-1 bg-blue-500/10 text-blue-500 rounded-full">
                        {doc.mime_type?.includes('pdf') ? 'PDF' : 'Document'}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-xs"
                        onClick={() => handleOpenDocument(doc)}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Open
                      </Button>
                    </div>
                  </div>
                ))}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full mt-2 text-xs"
                  onClick={() => handleViewMore('documents')}
                >
                  View More
                </Button>
              </>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No documents uploaded</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Emails */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Mail className="h-5 w-5 text-red-500" />
              <span>Recent Emails</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentEmails.length > 0 ? (
              <>
                {recentEmails.map((email) => (
                  <div key={email.id} className="border-b pb-2 last:border-b-0">
                    <h4 className="font-medium text-sm text-gray-900 truncate">{email.subject}</h4>
                    <p className="text-xs text-gray-500">
                      {email.from.name} • {new Date(email.receivedDateTime).toLocaleDateString()}
                    </p>
                    <div className="mt-1 flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        {!email.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                        {email.importance === 'high' && (
                          <span className="text-xs px-2 py-1 bg-red-500/10 text-red-500 rounded-full">
                            High
                          </span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-xs"
                        onClick={() => handleOpenEmail(email)}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Open
                      </Button>
                    </div>
                  </div>
                ))}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full mt-2 text-xs"
                  onClick={() => handleViewMore('email')}
                >
                  View More
                </Button>
              </>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No emails found</p>
            )}
          </CardContent>
        </Card>

        {/* Active Polls */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Vote className="h-5 w-5 text-green-500" />
              <span>Active Polls</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sortedPolls.length > 0 ? (
              <>
                {sortedPolls.map((poll) => (
                  <div key={poll.id} className="border-b pb-2 last:border-b-0">
                    <h4 className="font-medium text-sm text-gray-900 truncate">{poll.title}</h4>
                    <p className="text-xs text-gray-500 truncate">{poll.description}</p>
                    <p className="text-xs text-gray-500">
                      Deadline: {new Date(poll.deadline).toLocaleDateString()}
                    </p>
                    <div className="mt-1 flex justify-between items-center">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        isPastDeadline(poll.deadline) ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
                      }`}>
                        {isPastDeadline(poll.deadline) ? 'Expired' : 'Active'}
                      </span>
                      {!isPastDeadline(poll.deadline) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-xs"
                          onClick={() => handleVoteNow(poll)}
                        >
                          <Vote className="h-3 w-3 mr-1" />
                          Vote Now
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full mt-2 text-xs"
                  onClick={() => handleViewMore('voting')}
                >
                  View More
                </Button>
              </>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No active polls</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
