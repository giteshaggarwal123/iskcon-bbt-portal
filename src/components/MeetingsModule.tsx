import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar, Clock, Users, Video, FileText, Plus, Trash2, UserCheck, ExternalLink, Copy, CheckSquare, AlertTriangle, RefreshCw } from 'lucide-react';
import { ScheduleMeetingDialog } from './ScheduleMeetingDialog';
import { ViewAgendaDialog } from './ViewAgendaDialog';
import { ManageAttendeesDialog } from './ManageAttendeesDialog';
import { CheckInDialog } from './CheckInDialog';
import { CalendarView } from './CalendarView';
import { RSVPResponseDialog } from './RSVPResponseDialog';
import { MeetingDeletionProgress } from './MeetingDeletionProgress';
import { MeetingTranscriptDialog } from './MeetingTranscriptDialog';
import { useMeetings } from '@/hooks/useMeetings';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useAutoTranscript } from '@/hooks/useAutoTranscript';
import { useOutlookSync } from '@/hooks/useOutlookSync';
import { format, parseISO, compareAsc, compareDesc } from 'date-fns';
import { useUserRole } from '@/hooks/useUserRole';
import { RSVPSelector } from './RSVPSelector';
import { useIsMobile } from '@/hooks/use-mobile';

export const MeetingsModule: React.FC = () => {
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showAgendaDialog, setShowAgendaDialog] = useState(false);
  const [showAttendeesDialog, setShowAttendeesDialog] = useState(false);
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [showRSVPDialog, setShowRSVPDialog] = useState(false);
  const [showTranscriptDialog, setShowTranscriptDialog] = useState(false);
  const [showDeletionProgress, setShowDeletionProgress] = useState<string | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const [preselectedDate, setPreselectedDate] = useState<Date | undefined>(undefined);
  
  const { 
    meetings, 
    loading, 
    deletingMeetings, 
    createMeeting, 
    deleteMeeting, 
    fetchMeetings,
    getDeletionProgress,
    isDeletingMeeting
  } = useMeetings();
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Add Outlook sync functionality
  const { syncing, lastSyncTime, syncOutlookMeetings } = useOutlookSync();
  
  // Add auto-transcript functionality
  useAutoTranscript();

  const { userRole, canDeleteMeetings, canScheduleMeetings } = useUserRole();

  // Auto-refresh meetings when sync completes - but prevent infinite loops
  useEffect(() => {
    if (!syncing && lastSyncTime) {
      console.log('Refreshing meetings after sync...');
      // Add a small delay to prevent rapid successive calls
      const timeoutId = setTimeout(() => {
        fetchMeetings();
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [syncing, lastSyncTime]);

  // Filter and sort meetings properly by date and time
  const now = new Date();
  
  // Remove duplicates by outlook_event_id and teams_meeting_id to prevent duplicate display
  const uniqueMeetings = meetings.reduce((acc, meeting) => {
    const isDuplicate = acc.some(existing => 
      (meeting.outlook_event_id && existing.outlook_event_id === meeting.outlook_event_id) ||
      (meeting.teams_meeting_id && existing.teams_meeting_id === meeting.teams_meeting_id) ||
      existing.id === meeting.id
    );
    
    if (!isDuplicate) {
      acc.push(meeting);
    }
    
    return acc;
  }, [] as any[]);
  
  // Upcoming meetings: start time is in the future, sorted by nearest first
  const upcomingMeetings = uniqueMeetings
    .filter(meeting => {
      const startTime = parseISO(meeting.start_time);
      return startTime >= now;
    })
    .sort((a, b) => compareAsc(parseISO(a.start_time), parseISO(b.start_time)));
  
  // Past meetings: start time is in the past, sorted by most recent first
  const pastMeetings = uniqueMeetings
    .filter(meeting => {
      const startTime = parseISO(meeting.start_time);
      return startTime < now;
    })
    .sort((a, b) => compareDesc(parseISO(a.start_time), parseISO(b.start_time)));

  const handleViewAgenda = (meeting: any) => {
    setSelectedMeeting(meeting);
    setShowAgendaDialog(true);
  };

  const handleViewTranscript = (meeting: any) => {
    setSelectedMeeting(meeting);
    setShowTranscriptDialog(true);
  };

  const handleCheckIn = (meeting: any) => {
    setSelectedMeeting(meeting);
    setShowCheckInDialog(true);
  };

  const handleViewRSVP = (meeting: any) => {
    setSelectedMeeting(meeting);
    setShowRSVPDialog(true);
  };

  const handleDeleteMeeting = async (meetingId: string, meetingTitle: string) => {
    // Check if user role allows deletion (admin check)
    if (!canDeleteMeetings) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to delete meetings",
        variant: "destructive"
      });
      return;
    }

    // Check if meeting is currently being deleted
    if (isDeletingMeeting(meetingId)) {
      toast({
        title: "Already Deleting",
        description: "This meeting is already being deleted",
        variant: "destructive"
      });
      return;
    }
    
    // Show progress dialog
    setShowDeletionProgress(meetingId);
    
    // Start deletion process
    await deleteMeeting(meetingId);
    
    // Hide progress dialog after completion
    setTimeout(() => {
      setShowDeletionProgress(null);
    }, 3000);
  };

  const handleCopyJoinUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copied",
      description: "Teams meeting link copied to clipboard"
    });
  };

  const handleJoinNow = (meeting: any) => {
    if (meeting.teams_join_url) {
      // Allow super admins and admins to join anytime
      if (userRole === 'super_admin' || userRole === 'admin') {
        window.open(meeting.teams_join_url, '_blank', 'noopener,noreferrer');
        return;
      }

      // For regular users, check if it's too early
      const now = new Date();
      const start = parseISO(meeting.start_time);
      const hourBeforeStart = new Date(start.getTime() - 60 * 60 * 1000);
      
      if (now < hourBeforeStart) {
        toast({
          title: "Too Early",
          description: "You can join the meeting up to 1 hour before the start time",
          variant: "destructive"
        });
        return;
      }

      window.open(meeting.teams_join_url, '_blank', 'noopener,noreferrer');
    } else {
      toast({
        title: "No Join Link",
        description: "This meeting doesn't have a Teams join link",
        variant: "destructive"
      });
    }
  };

  const handleScheduleMeetingClose = (meetingCreated: boolean) => {
    setShowScheduleDialog(false);
    setPreselectedDate(undefined);
    
    // Auto-refresh if a meeting was created, but with debounce
    if (meetingCreated) {
      setTimeout(() => {
        fetchMeetings();
      }, 500);
    }
  };

  const handleCalendarDateClick = (date: Date) => {
    setPreselectedDate(date);
    setShowScheduleDialog(true);
  };

  const formatMeetingTime = (startTime: string, endTime: string) => {
    const start = parseISO(startTime);
    const end = parseISO(endTime);
    const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    
    let durationText = '';
    if (hours > 0) durationText += `${hours}h `;
    if (minutes > 0) durationText += `${minutes}m`;
    
    return {
      date: format(start, 'MMM dd, yyyy'),
      time: format(start, 'h:mm a'),
      duration: durationText.trim() || '0m'
    };
  };

  const isLiveMeeting = (meeting: any) => {
    const now = new Date();
    const start = parseISO(meeting.start_time);
    const end = parseISO(meeting.end_time);
    return now >= start && now <= end;
  };

  const canCheckIn = (meeting: any) => {
    const now = new Date();
    const start = parseISO(meeting.start_time);
    const hourBeforeStart = new Date(start.getTime() - 60 * 60 * 1000);
    return now >= hourBeforeStart && now <= start;
  };

  const handleRSVPUpdate = () => {
    // Refresh meetings data when RSVP is updated, but with debounce
    setTimeout(() => {
      fetchMeetings();
    }, 500);
  };

  // Manual sync handler with debounce to prevent multiple calls
  const handleManualSync = async () => {
    if (syncing) return; // Prevent multiple simultaneous sync calls
    await syncOutlookMeetings();
  };

  const renderMeetingCard = (meeting: any, isPast = false) => {
    const timeInfo = formatMeetingTime(meeting.start_time, meeting.end_time);
    const isLive = !isPast && isLiveMeeting(meeting);
    const canDoCheckIn = !isPast && canCheckIn(meeting);
    const attendeeCount = meeting.attendee_count || meeting.attendees?.length || 0;
    const isDeleting = isDeletingMeeting(meeting.id);
    
    return (
      <Card key={`meeting-${meeting.id}`} className={`w-full hover:shadow-md transition-shadow ${isDeleting ? 'opacity-50' : ''}`}>
        <CardHeader className="pb-4 sm:pb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="flex-1 min-w-0 space-y-3">
              <CardTitle className="text-xl sm:text-2xl flex flex-wrap items-start gap-2">
                <span className="break-words leading-tight">{meeting.title}</span>
                {isLive && (
                  <Badge className="bg-red-500 text-white animate-pulse shrink-0">
                    LIVE
                  </Badge>
                )}
                {meeting.teams_join_url && (
                  <Badge className="bg-blue-500 text-white shrink-0">
                    <Video className="h-3 w-3 mr-1" />
                    Teams
                  </Badge>
                )}
                {meeting.outlook_event_id && (
                  <Badge className="bg-green-500 text-white shrink-0">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Outlook
                  </Badge>
                )}
                {isDeleting && (
                  <Badge className="bg-orange-500 text-white shrink-0">
                    Deleting...
                  </Badge>
                )}
              </CardTitle>
              
              {/* Better spaced meeting info */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-medium">{timeInfo.date} at {timeInfo.time}</span>
                  <span className="text-xs text-gray-500">({timeInfo.duration})</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Users className="h-4 w-4 shrink-0" />
                  <span className="text-sm">{attendeeCount} expected attendees</span>
                </div>
              </div>
              
              <CardDescription className="break-words text-sm mt-2">
                {meeting.description || 'No description provided'}
              </CardDescription>
            </div>
            <Badge className={isPast ? "bg-gray-100 text-gray-800" : "bg-green-100 text-green-800"} variant="secondary">
              {isPast ? 'Completed' : (meeting.status || 'scheduled')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <RSVPSelector 
            meeting={meeting} 
            onResponseUpdate={handleRSVPUpdate}
            onViewRSVP={handleViewRSVP}
          />

          {/* Only show Teams link once and prevent duplicates */}
          {meeting.teams_join_url && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center space-x-2 min-w-0">
                  <Video className="h-4 w-4 text-blue-600 shrink-0" />
                  <span className="text-sm font-medium text-blue-800">Teams Meeting Link Available</span>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyJoinUrl(meeting.teams_join_url)}
                    className="h-7 px-2 text-blue-600 hover:bg-blue-100"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleJoinNow(meeting)}
                    className="h-7 px-2 text-blue-600 hover:bg-blue-100"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Open
                  </Button>
                </div>
              </div>
              <p className="text-xs text-blue-600 mt-1 break-all">
                {meeting.teams_join_url}
              </p>
            </div>
          )}
          
          <div className="flex flex-wrap gap-2">
            {meeting.teams_join_url && (
              <Button 
                variant="default" 
                size="sm"
                onClick={() => handleJoinNow(meeting)}
                disabled={isDeleting}
                className="bg-blue-600 hover:bg-blue-700 text-white min-h-[40px]"
              >
                <Video className="h-4 w-4 mr-2" />
                Join Meeting
              </Button>
            )}
            
            {canDoCheckIn && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleCheckIn(meeting)}
                disabled={isDeleting}
                className="bg-green-50 hover:bg-green-100 text-green-700 min-h-[40px]"
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Check In
              </Button>
            )}
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleViewAgenda(meeting)}
              disabled={isDeleting}
              className="min-h-[40px]"
            >
              <FileText className="h-4 w-4 mr-2" />
              View Details
            </Button>

            {/* Only show Transcript button for past meetings */}
            {isPast && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleViewTranscript(meeting)}
                disabled={isDeleting}
                className="bg-purple-50 hover:bg-purple-100 text-purple-700 min-h-[40px]"
              >
                <FileText className="h-4 w-4 mr-2" />
                Transcript
              </Button>
            )}

            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleViewRSVP(meeting)}
              disabled={isDeleting}
              className="bg-purple-50 hover:bg-purple-100 text-purple-700 min-h-[40px]"
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              View RSVP
            </Button>
            
            {canDeleteMeetings && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={isDeleting}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 min-h-[40px]"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      Delete Meeting from All Platforms?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                      <p>Are you sure you want to delete "<strong>{meeting.title}</strong>"?</p>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                        <p className="font-medium text-yellow-800 mb-1">This action will permanently:</p>
                        <ul className="text-yellow-700 space-y-1 ml-4 list-disc">
                          <li>Remove the meeting from Microsoft Teams</li>
                          <li>Delete the Outlook calendar event</li>
                          <li>Remove all attendee records and RSVPs</li>
                          <li>Delete meeting attachments and transcripts</li>
                          <li>Cannot be undone</li>
                        </ul>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDeleteMeeting(meeting.id, meeting.title)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete from All Platforms
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">Meeting Management</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Schedule, track, and manage all your meetings</p>
            {lastSyncTime && (
              <p className="text-xs text-gray-500 mt-1">
                Last synced: {format(lastSyncTime, 'MMM dd, yyyy h:mm a')}
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button 
              variant="outline"
              size="sm"
              onClick={handleManualSync}
              disabled={syncing}
              className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
            >
              {syncing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Outlook
                </>
              )}
            </Button>
            {canScheduleMeetings && (
              <Button 
                className="bg-primary hover:bg-primary/90"
                onClick={() => setShowScheduleDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Schedule Meeting
              </Button>
            )}
          </div>
        </div>

        {/* Fixed scroll container to prevent auto-scrolling */}
        <div className="w-full" style={{ overflowX: 'visible', overflowY: 'visible' }}>
          <Tabs defaultValue="upcoming" className="space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-3 h-auto">
              <TabsTrigger value="upcoming" className="text-xs sm:text-sm px-2 py-2">
                Upcoming ({upcomingMeetings.length})
              </TabsTrigger>
              <TabsTrigger value="past" className="text-xs sm:text-sm px-2 py-2">
                Past ({pastMeetings.length})
              </TabsTrigger>
              <TabsTrigger value="calendar" className="text-xs sm:text-sm px-2 py-2">
                Calendar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4 sm:space-y-6">
              {upcomingMeetings.length > 0 ? (
                <div className="space-y-4 sm:space-y-6">
                  {upcomingMeetings.map((meeting) => {
                    return renderMeetingCard(meeting);
                  })}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 sm:p-8 text-center">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No upcoming meetings</p>
                    <p className="text-sm text-gray-500 mt-2">Schedule your first Teams meeting or sync from Outlook to get started</p>
                    <div className="mt-4 space-y-2">
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={handleManualSync}
                        disabled={syncing}
                        className="mr-2"
                      >
                        {syncing ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Syncing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Sync from Outlook
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4 sm:space-y-6">
              {pastMeetings.length === 0 ? (
                <Card>
                  <CardContent className="p-6 sm:p-8 text-center">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No past meetings</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {pastMeetings.map((meeting) => {
                    return renderMeetingCard(meeting, true);
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="calendar" className="space-y-4 sm:space-y-6">
              <div className="w-full overflow-hidden">
                <CalendarView 
                  meetings={uniqueMeetings} 
                  onMeetingClick={handleViewAgenda}
                  onDateClick={handleCalendarDateClick}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Deletion Progress Dialog */}
      <Dialog open={!!showDeletionProgress} onOpenChange={() => setShowDeletionProgress(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Deleting Meeting</DialogTitle>
          </DialogHeader>
          {showDeletionProgress && (
            <MeetingDeletionProgress
              progress={getDeletionProgress(showDeletionProgress)}
              meetingTitle={meetings.find(m => m.id === showDeletionProgress)?.title || 'Meeting'}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialogs */}
      {canScheduleMeetings && (
        <ScheduleMeetingDialog 
          open={showScheduleDialog} 
          onOpenChange={handleScheduleMeetingClose}
          preselectedDate={preselectedDate}
        />
      )}
      <ViewAgendaDialog 
        open={showAgendaDialog} 
        onOpenChange={setShowAgendaDialog}
        meeting={selectedMeeting}
      />
      <ManageAttendeesDialog 
        open={showAttendeesDialog} 
        onOpenChange={setShowAttendeesDialog}
        meeting={selectedMeeting}
      />
      <CheckInDialog
        open={showCheckInDialog}
        onOpenChange={setShowCheckInDialog}
        meeting={selectedMeeting}
      />
      <RSVPResponseDialog
        open={showRSVPDialog}
        onOpenChange={setShowRSVPDialog}
        meeting={selectedMeeting}
      />
      <MeetingTranscriptDialog
        open={showTranscriptDialog}
        onOpenChange={setShowTranscriptDialog}
        meeting={selectedMeeting}
      />
    </div>
  );
};

export default MeetingsModule;
