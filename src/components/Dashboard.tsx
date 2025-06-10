
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, FileText, Mail, Vote, ExternalLink, Play } from 'lucide-react';
import { useMeetings } from '@/hooks/useMeetings';
import { useDocuments } from '@/hooks/useDocuments';
import { useEmails } from '@/hooks/useEmails';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { MicrosoftConnectionStatus } from './MicrosoftConnectionStatus';
import { DocumentViewer } from './DocumentViewer';
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
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false);
  const { meetings, loading: meetingsLoading } = useMeetings();
  const { documents, loading: documentsLoading } = useDocuments();
  const { emails, loading: emailsLoading } = useEmails();
  const { user } = useAuth();
  const { profile } = useProfile();
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

  // Extract user name with priority: profile > user metadata > email
  const userName = profile 
    ? `${profile.first_name} ${profile.last_name}`.trim() || profile.email?.split('@')[0] || 'User'
    : user?.user_metadata?.first_name 
      ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim()
      : user?.email?.split('@')[0] || 'User';

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
    console.log('Opening document:', doc);
    setSelectedDocument(doc);
    setIsDocumentViewerOpen(true);
  };

  const handleCloseDocumentViewer = () => {
    setIsDocumentViewerOpen(false);
    setSelectedDocument(null);
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
    <>
      <div className="dashboard-container w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="space-y-4 sm:space-y-6">
          {/* Header Section - Clean and aligned */}
          <div className="dashboard-header space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Bureau Dashboard</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Hare Krishna! {userName} - Here's what's happening today.
            </p>
            
            {/* Microsoft Connection Status - Positioned cleanly */}
            <div className="flex justify-start pt-2">
              <MicrosoftConnectionStatus />
            </div>
          </div>

          {/* Main Grid - Clean Layout */}
          <div className="dashboard-grid grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Recent Emails */}
            <Card className="dashboard-card border border-border bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="dashboard-card-title flex items-center space-x-3 text-lg sm:text-xl">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Mail className="h-5 w-5 text-red-600" />
                  </div>
                  <span>Recent Emails</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {recentEmails.length > 0 ? (
                  <div className="space-y-3">
                    {recentEmails.map((email) => (
                      <div key={email.id} className="dashboard-item p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="dashboard-item-header flex justify-between items-start mb-2">
                          <h4 className="dashboard-item-title font-medium text-sm truncate flex-1 mr-2">{email.subject}</h4>
                          <Button
                            size="sm"
                            variant="outline"
                            className="dashboard-item-button shrink-0 h-7 text-xs"
                            onClick={() => handleOpenEmail(email)}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Open
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">From: {email.from.name}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {new Date(email.receivedDateTime).toLocaleDateString()}
                          </span>
                          <div className="flex items-center space-x-2">
                            {!email.isRead && <div className="w-2 h-2 bg-red-500 rounded-full"></div>}
                            {email.importance === 'high' && (
                              <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full">High</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button 
                      variant="ghost" 
                      className="w-full mt-3 text-red-600 hover:bg-red-50"
                      onClick={() => handleViewMore('email')}
                    >
                      View More →
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No emails found</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Meetings */}
            <Card className="dashboard-card border border-border bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="dashboard-card-title flex items-center space-x-3 text-lg sm:text-xl">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <CalendarDays className="h-5 w-5 text-blue-600" />
                  </div>
                  <span>Upcoming Meetings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {upcomingMeetings.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingMeetings.map((meeting) => (
                      <div key={meeting.id} className="dashboard-item p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="dashboard-item-header flex justify-between items-start mb-2">
                          <h4 className="dashboard-item-title font-medium text-sm truncate flex-1 mr-2">{meeting.title}</h4>
                          {meeting.teams_join_url && (
                            <Button
                              size="sm"
                              className="dashboard-item-button shrink-0 h-7 text-xs bg-blue-600 hover:bg-blue-700"
                              onClick={() => handleJoinMeeting(meeting)}
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Join
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {new Date(meeting.start_time).toLocaleDateString()} at {new Date(meeting.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <span className="inline-block text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full">
                          Upcoming
                        </span>
                      </div>
                    ))}
                    <Button 
                      variant="ghost" 
                      className="w-full mt-3 text-blue-600 hover:bg-blue-50"
                      onClick={() => handleViewMore('meetings')}
                    >
                      View More →
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CalendarDays className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No upcoming meetings</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Important Documents */}
            <Card className="dashboard-card border border-border bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="dashboard-card-title flex items-center space-x-3 text-lg sm:text-xl">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FileText className="h-5 w-5 text-green-600" />
                  </div>
                  <span>Important Documents</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {recentDocuments.length > 0 ? (
                  <div className="space-y-3">
                    {recentDocuments.map((doc) => (
                      <div key={doc.id} className="dashboard-item p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="dashboard-item-header flex justify-between items-start mb-2">
                          <h4 className="dashboard-item-title font-medium text-sm truncate flex-1 mr-2">{doc.name}</h4>
                          <Button
                            size="sm"
                            variant="outline"
                            className="dashboard-item-button shrink-0 h-7 text-xs"
                            onClick={() => handleOpenDocument(doc)}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Open
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {new Date(doc.created_at).toLocaleDateString()} • {doc.folder || 'General'}
                        </p>
                        <span className="inline-block text-xs px-2 py-0.5 bg-green-100 text-green-600 rounded-full">
                          {doc.mime_type?.includes('pdf') ? 'PDF' : 'Document'}
                        </span>
                      </div>
                    ))}
                    <Button 
                      variant="ghost" 
                      className="w-full mt-3 text-green-600 hover:bg-green-50"
                      onClick={() => handleViewMore('documents')}
                    >
                      View More →
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No documents uploaded</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Voting */}
            <Card className="dashboard-card border border-border bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="dashboard-card-title flex items-center space-x-3 text-lg sm:text-xl">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Vote className="h-5 w-5 text-purple-600" />
                  </div>
                  <span>Active Voting</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {sortedPolls.length > 0 ? (
                  <div className="space-y-3">
                    {sortedPolls.map((poll) => (
                      <div key={poll.id} className="dashboard-item p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="dashboard-item-header flex justify-between items-start mb-2">
                          <h4 className="dashboard-item-title font-medium text-sm truncate flex-1 mr-2">{poll.title}</h4>
                          {!isPastDeadline(poll.deadline) && (
                            <Button
                              size="sm"
                              className="dashboard-item-button shrink-0 h-7 text-xs bg-purple-600 hover:bg-purple-700"
                              onClick={() => handleVoteNow(poll)}
                            >
                              <Vote className="h-3 w-3 mr-1" />
                              Vote
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-1 truncate">{poll.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            Deadline: {new Date(poll.deadline).toLocaleDateString()}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            isPastDeadline(poll.deadline) ? 'bg-red-100 text-red-600' : 'bg-purple-100 text-purple-600'
                          }`}>
                            {isPastDeadline(poll.deadline) ? 'Expired' : 'Active'}
                          </span>
                        </div>
                      </div>
                    ))}
                    <Button 
                      variant="ghost" 
                      className="w-full mt-3 text-purple-600 hover:bg-purple-50"
                      onClick={() => handleViewMore('voting')}
                    >
                      View More →
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Vote className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No active polls</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Mobile-specific responsive styles - Fixed spacing issues */}
        <style>{`
          /* Mobile-only styles (max-width: 767px) - Dashboard specific fixes */
          @media (max-width: 767px) {
            /* Dashboard container mobile optimization - FIXED SPACING */
            .dashboard-container {
              width: 100vw;
              max-width: 100vw;
              margin: 0;
              padding: 1rem; /* Balanced padding on both sides */
              overflow-x: hidden;
              box-sizing: border-box;
            }

            /* Ensure main content has proper spacing */
            .dashboard-container > div {
              padding-left: 0;
              padding-right: 0;
              margin-left: 0;
              margin-right: 0;
            }

            /* Dashboard header mobile spacing */
            .dashboard-header {
              margin-bottom: 1rem;
              padding: 0;
            }

            .dashboard-header h1 {
              font-size: 1.5rem;
              line-height: 1.4;
              margin-bottom: 0.5rem;
              word-wrap: break-word;
            }

            .dashboard-header p {
              font-size: 0.875rem;
              line-height: 1.4;
              margin-bottom: 0.5rem;
            }

            /* Dashboard grid mobile layout */
            .dashboard-grid {
              grid-template-columns: 1fr;
              gap: 1rem;
              width: 100%;
              max-width: 100%;
              margin: 0;
              padding: 0;
            }

            /* Dashboard cards mobile optimization */
            .dashboard-card {
              width: 100%;
              max-width: 100%;
              min-width: 0;
              overflow: hidden;
              margin: 0;
              box-sizing: border-box;
            }

            /* Dashboard card titles mobile responsive */
            .dashboard-card-title {
              flex-wrap: wrap;
              gap: 0.5rem;
              align-items: flex-start;
              font-size: 1rem;
              line-height: 1.3;
            }

            .dashboard-card-title span {
              word-wrap: break-word;
              flex: 1;
              min-width: 0;
            }

            /* Dashboard items mobile layout */
            .dashboard-item {
              width: 100%;
              max-width: 100%;
              padding: 0.75rem;
              margin: 0;
              box-sizing: border-box;
            }

            /* Dashboard item headers mobile responsive */
            .dashboard-item-header {
              flex-wrap: wrap;
              gap: 0.5rem;
              align-items: flex-start;
              margin-bottom: 0.5rem;
            }

            /* Dashboard item titles mobile text handling */
            .dashboard-item-title {
              word-wrap: break-word;
              overflow-wrap: break-word;
              hyphens: auto;
              max-width: 100%;
              line-height: 1.3;
              margin-right: 0.5rem;
            }

            /* Dashboard item buttons mobile sizing */
            .dashboard-item-button {
              min-height: 32px;
              min-width: fit-content;
              padding: 0.25rem 0.5rem;
              font-size: 0.75rem;
              flex-shrink: 0;
            }

            /* Better spacing for mobile content */
            .dashboard-card .pt-0 {
              padding-top: 0.5rem;
            }

            .dashboard-card .pb-4 {
              padding-bottom: 0.75rem;
            }

            /* Text and content mobile optimization */
            .dashboard-container .text-xs {
              font-size: 0.75rem;
              line-height: 1.3;
            }

            .dashboard-container .text-sm {
              font-size: 0.875rem;
              line-height: 1.4;
            }

            /* Prevent horizontal overflow */
            .dashboard-container * {
              max-width: 100%;
              box-sizing: border-box;
            }

            /* Ensure proper text wrapping */
            .dashboard-container .truncate {
              white-space: normal;
              overflow: visible;
              text-overflow: unset;
            }

            /* Badge mobile responsive */
            .dashboard-container .rounded-full {
              font-size: 0.75rem;
              padding: 0.125rem 0.5rem;
              white-space: nowrap;
            }

            /* Button mobile improvements */
            .dashboard-container button {
              min-height: 44px;
              font-size: 0.875rem;
              word-wrap: break-word;
            }

            /* Space adjustments for mobile */
            .dashboard-container .space-y-3 > * + * {
              margin-top: 0.75rem;
            }

            .dashboard-container .space-y-4 > * + * {
              margin-top: 1rem;
            }

            /* Microsoft connection status mobile */
            .dashboard-header .flex.justify-start {
              padding-top: 0.5rem;
            }

            /* Empty state mobile */
            .dashboard-container .text-center.py-8 {
              padding: 1.5rem 0.5rem;
            }

            /* Flex improvements for mobile */
            .dashboard-container .flex.items-center.justify-between {
              flex-wrap: wrap;
              gap: 0.5rem;
              align-items: flex-start;
            }

            /* Icon sizing mobile */
            .dashboard-container .h-5.w-5 {
              height: 1.125rem;
              width: 1.125rem;
            }

            .dashboard-container .h-3.w-3 {
              height: 0.75rem;
              width: 0.75rem;
            }

            /* Remove any auto margins that might cause uneven spacing */
            .dashboard-container .mx-auto {
              margin-left: 0;
              margin-right: 0;
            }

            /* Ensure proper viewport handling */
            body {
              overflow-x: hidden;
            }

            /* Override any parent container margins/padding that might affect spacing */
            .dashboard-container {
              margin-left: 0 !important;
              margin-right: 0 !important;
            }
          }

          /* Ensure desktop styles remain unchanged */
          @media (min-width: 768px) {
            .dashboard-container {
              /* Desktop styles remain as they were */
            }
          }
        `}</style>
      </div>

      {/* Document Viewer Modal */}
      <DocumentViewer
        isOpen={isDocumentViewerOpen}
        onClose={handleCloseDocumentViewer}
        document={selectedDocument}
      />
    </>
  );
};
