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
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header with Connection Status */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bureau Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back! Here's what's happening today.</p>
        </div>
        <MicrosoftConnectionStatus />
      </div>

      {/* Main Grid - Enhanced Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Emails - Top Left */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-red-50 to-white">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between text-xl">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Mail className="h-6 w-6 text-red-600" />
                </div>
                <span className="text-gray-800">Recent Emails</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentEmails.length > 0 ? (
              <>
                {recentEmails.map((email) => (
                  <div key={email.id} className="bg-white p-4 rounded-lg border border-red-100 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-900 truncate flex-1 mr-2">{email.subject}</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => handleOpenEmail(email)}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Open
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">From: {email.from.name}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {new Date(email.receivedDateTime).toLocaleDateString()}
                      </span>
                      <div className="flex items-center space-x-2">
                        {!email.isRead && <div className="w-2 h-2 bg-red-500 rounded-full"></div>}
                        {email.importance === 'high' && (
                          <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded-full">High</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <Button 
                  variant="ghost" 
                  className="w-full mt-4 text-red-600 hover:bg-red-50"
                  onClick={() => handleViewMore('email')}
                >
                  View More →
                </Button>
              </>
            ) : (
              <div className="text-center py-8">
                <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">No emails found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Meetings - Top Right */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between text-xl">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CalendarDays className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-gray-800">Upcoming Meetings</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingMeetings.length > 0 ? (
              <>
                {upcomingMeetings.map((meeting) => (
                  <div key={meeting.id} className="bg-white p-4 rounded-lg border border-blue-100 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-900 truncate flex-1 mr-2">{meeting.title}</h4>
                      {meeting.teams_join_url && (
                        <Button
                          size="sm"
                          className="shrink-0 bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleJoinMeeting(meeting)}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Join Now
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {new Date(meeting.start_time).toLocaleDateString()} at {new Date(meeting.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <span className="inline-block text-xs px-3 py-1 bg-blue-100 text-blue-600 rounded-full">
                      Upcoming
                    </span>
                  </div>
                ))}
                <Button 
                  variant="ghost" 
                  className="w-full mt-4 text-blue-600 hover:bg-blue-50"
                  onClick={() => handleViewMore('meetings')}
                >
                  View More →
                </Button>
              </>
            ) : (
              <div className="text-center py-8">
                <CalendarDays className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">No upcoming meetings</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Important Documents - Bottom Left */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between text-xl">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <span className="text-gray-800">Important Documents</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentDocuments.length > 0 ? (
              <>
                {recentDocuments.map((doc) => (
                  <div key={doc.id} className="bg-white p-4 rounded-lg border border-green-100 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-900 truncate flex-1 mr-2">{doc.name}</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 text-green-600 border-green-200 hover:bg-green-50"
                        onClick={() => handleOpenDocument(doc)}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Open
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {new Date(doc.created_at).toLocaleDateString()} • {doc.folder || 'General'}
                    </p>
                    <span className="inline-block text-xs px-3 py-1 bg-green-100 text-green-600 rounded-full">
                      {doc.mime_type?.includes('pdf') ? 'PDF' : 'Document'}
                    </span>
                  </div>
                ))}
                <Button 
                  variant="ghost" 
                  className="w-full mt-4 text-green-600 hover:bg-green-50"
                  onClick={() => handleViewMore('documents')}
                >
                  View More →
                </Button>
              </>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">No documents uploaded</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Voting - Bottom Right */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-white">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between text-xl">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Vote className="h-6 w-6 text-purple-600" />
                </div>
                <span className="text-gray-800">Active Voting</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sortedPolls.length > 0 ? (
              <>
                {sortedPolls.map((poll) => (
                  <div key={poll.id} className="bg-white p-4 rounded-lg border border-purple-100 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-900 truncate flex-1 mr-2">{poll.title}</h4>
                      {!isPastDeadline(poll.deadline) && (
                        <Button
                          size="sm"
                          className="shrink-0 bg-purple-600 hover:bg-purple-700"
                          onClick={() => handleVoteNow(poll)}
                        >
                          <Vote className="h-3 w-3 mr-1" />
                          Vote Now
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2 truncate">{poll.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Deadline: {new Date(poll.deadline).toLocaleDateString()}
                      </span>
                      <span className={`text-xs px-3 py-1 rounded-full ${
                        isPastDeadline(poll.deadline) ? 'bg-red-100 text-red-600' : 'bg-purple-100 text-purple-600'
                      }`}>
                        {isPastDeadline(poll.deadline) ? 'Expired' : 'Active'}
                      </span>
                    </div>
                  </div>
                ))}
                <Button 
                  variant="ghost" 
                  className="w-full mt-4 text-purple-600 hover:bg-purple-50"
                  onClick={() => handleViewMore('voting')}
                >
                  View More →
                </Button>
              </>
            ) : (
              <div className="text-center py-8">
                <Vote className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">No active polls</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mobile-specific responsive styles */}
      <style>{`
        @media (max-width: 767px) {
          /* Dashboard container mobile fixes */
          .space-y-8 {
            max-width: 100vw;
            overflow-x: hidden;
            padding: 0 1rem;
            margin: 0;
          }
          
          /* Header responsive */
          .space-y-8 h1 {
            font-size: 1.5rem;
            line-height: 1.4;
          }
          
          .space-y-8 p {
            font-size: 0.875rem;
          }
          
          /* Grid mobile adjustments */
          .grid.grid-cols-1.lg\\:grid-cols-2 {
            grid-template-columns: 1fr;
            gap: 1.25rem;
            width: 100%;
            max-width: 100%;
          }
          
          /* Card mobile responsive */
          .grid > .shadow-lg {
            width: 100%;
            max-width: 100%;
            min-width: 0;
            overflow: hidden;
            margin: 0;
          }
          
          /* Card content mobile fixes - Better email spacing */
          .grid .bg-white.p-4 {
            padding: 1rem;
            margin: 0 0 1rem 0;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
          }
          
          /* Email cards spacing improvement */
          .grid .space-y-4 > .bg-white + .bg-white {
            margin-top: 1.25rem;
          }
          
          /* Button spacing mobile */
          .grid .flex.justify-between.items-start {
            flex-wrap: wrap;
            gap: 0.75rem;
            align-items: flex-start;
          }
          
          .grid .shrink-0 {
            flex-shrink: 0;
            min-width: fit-content;
          }
          
          /* Text truncation mobile - Better alignment */
          .grid .truncate {
            max-width: 65%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          
          /* Card header mobile */
          .grid .flex.items-center.space-x-3 {
            max-width: 100%;
            overflow: hidden;
          }
          
          /* Better header alignment on mobile */
          .flex.justify-between.items-center {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
            padding: 0;
            margin: 0;
          }
          
          /* Microsoft connection status mobile alignment */
          .flex.justify-between.items-center > div:last-child {
            align-self: flex-end;
            width: auto;
          }
          
          /* Better mobile spacing */
          .space-y-8 > * + * {
            margin-top: 1.5rem;
          }
          
          /* Email content better spacing */
          .grid .space-y-4 {
            gap: 1.25rem;
          }
          
          /* Card content padding adjustment */
          .shadow-lg .p-6 {
            padding: 1rem;
          }
          
          /* Better button alignment in cards */
          .grid .bg-white .flex.justify-between {
            align-items: flex-start;
            gap: 0.5rem;
          }
          
          /* Email subject and content better spacing */
          .grid .bg-white .mb-2 {
            margin-bottom: 0.75rem;
          }
          
          /* Perfect card alignment */
          .grid > .shadow-lg .bg-white {
            border-radius: 0.5rem;
            box-shadow: none;
            border: 1px solid #e5e7eb;
          }
        }
      `}</style>
    </div>
  );
};
