import React, { useState } from 'react';
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
import { Calendar, Clock, Users, Video, FileText, Plus, Trash2, UserCheck, ExternalLink, Copy, CheckSquare, AlertTriangle } from 'lucide-react';
import { ScheduleMeetingDialog } from './ScheduleMeetingDialog';
import { ViewAgendaDialog } from './ViewAgendaDialog';
import { ManageAttendeesDialog } from './ManageAttendeesDialog';
import { CheckInDialog } from './CheckInDialog';
import { CalendarView } from './CalendarView';
import { RSVPResponseDialog } from './RSVPResponseDialog';
import { useMeetings } from '@/hooks/useMeetings';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useAutoTranscript } from '@/hooks/useAutoTranscript';
import { format, parseISO, compareAsc, compareDesc } from 'date-fns';
import { useUserRole } from '@/hooks/useUserRole';
import { RSVPSelector } from './RSVPSelector';

export const MeetingsModule: React.FC = () => {
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showAgendaDialog, setShowAgendaDialog] = useState(false);
  const [showAttendeesDialog, setShowAttendeesDialog] = useState(false);
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [showRSVPDialog, setShowRSVPDialog] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const [preselectedDate, setPreselectedDate] = useState<Date | undefined>(undefined);
  
  const { meetings, loading, deletingMeetings, createMeeting, deleteMeeting, fetchMeetings } = useMeetings();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Add auto-transcript functionality
  useAutoTranscript();

  const { userRole, canDeleteMeetings, canScheduleMeetings } = useUserRole();

  // Filter and sort meetings properly by date and time
  const now = new Date();
  
  // Upcoming meetings: start time is in the future, sorted by nearest first
  const upcomingMeetings = meetings
    .filter(meeting => {
      const startTime = parseISO(meeting.start_time);
      return startTime >= now;
    })
    .sort((a, b) => compareAsc(parseISO(a.start_time), parseISO(b.start_time)));
  
  // Past meetings: start time is in the past, sorted by most recent first
  const pastMeetings = meetings
    .filter(meeting => {
      const startTime = parseISO(meeting.start_time);
      return startTime < now;
    })
    .sort((a, b) => compareDesc(parseISO(a.start_time), parseISO(b.start_time)));

  const handleViewAgenda = (meeting: any) => {
    setSelectedMeeting(meeting);
    setShowAgendaDialog(true);
  };

  const handleCheckIn = (meeting: any) => {
    setSelectedMeeting(meeting);
    setShowCheckInDialog(true);
  };

  const handleViewRSVP = (meeting: any) => {
    setSelectedMeeting(meeting);
    setShowRSVPDialog(true);
  };

  const handleDeleteMeeting = async (meetingId: string) => {
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
    if (deletingMeetings.has(meetingId)) {
      toast({
        title: "Already Deleting",
        description: "This meeting is already being deleted",
        variant: "destructive"
      });
      return;
    }
    
    await deleteMeeting(meetingId);
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
    
    // Auto-refresh if a meeting was created
    if (meetingCreated) {
      fetchMeetings();
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
    // Refresh meetings data when RSVP is updated
    fetchMeetings();
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
            <p className="text-sm sm:text-base text-gray-600 mt-1">Schedule, track, and manage all ISKCON meetings with Teams integration</p>
          </div>
          {canScheduleMeetings && (
            <div className="flex-shrink-0">
              <Button 
                className="w-full sm:w-auto bg-primary hover:bg-primary/90"
                onClick={() => setShowScheduleDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Schedule Meeting
              </Button>
            </div>
          )}
        </div>

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
                  const timeInfo = formatMeetingTime(meeting.start_time, meeting.end_time);
                  const isLive = isLiveMeeting(meeting);
                  const canDoCheckIn = canCheckIn(meeting);
                  const attendeeCount = meeting.attendee_count || meeting.attendees?.length || 0;
                  const isDeleting = deletingMeetings.has(meeting.id);
                  
                  return (
                    <Card key={meeting.id} className={`w-full hover:shadow-md transition-shadow ${isDeleting ? 'opacity-50' : ''}`}>
                      <CardHeader className="pb-3 sm:pb-4">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg sm:text-xl flex flex-wrap items-start gap-2">
                              <span className="break-words">{meeting.title}</span>
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
                              {isDeleting && (
                                <Badge className="bg-orange-500 text-white shrink-0">
                                  Deleting...
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription className="mt-2 break-words text-sm">
                              {meeting.description || 'No description provided'}
                            </CardDescription>
                          </div>
                          <Badge className="bg-green-100 text-green-800 shrink-0 self-start">
                            {meeting.status || 'scheduled'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div className="flex items-center space-x-2 min-w-0">
                            <Calendar className="h-4 w-4 text-gray-500 shrink-0" />
                            <span className="text-sm break-words">{timeInfo.date}</span>
                          </div>
                          <div className="flex items-center space-x-2 min-w-0">
                            <Clock className="h-4 w-4 text-gray-500 shrink-0" />
                            <span className="text-sm break-words">{timeInfo.time} ({timeInfo.duration})</span>
                          </div>
                          <div className="flex items-center space-x-2 min-w-0">
                            <Users className="h-4 w-4 text-gray-500 shrink-0" />
                            <span className="text-sm">{attendeeCount} attendees</span>
                          </div>
                          <div className="flex items-center space-x-2 min-w-0">
                            <Video className="h-4 w-4 text-gray-500 shrink-0" />
                            <span className="text-sm break-words">{meeting.location || 'No location'}</span>
                          </div>
                        </div>

                        <RSVPSelector 
                          meeting={meeting} 
                          onResponseUpdate={handleRSVPUpdate}
                        />

                        {meeting.teams_join_url && (
                          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <div className="flex items-center space-x-2 min-w-0">
                                <Video className="h-4 w-4 text-blue-600 shrink-0" />
                                <span className="text-sm font-medium text-blue-800">Teams Meeting Link</span>
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
                                    onClick={() => handleDeleteMeeting(meeting.id)}
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
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 sm:p-8 text-center">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No upcoming meetings</p>
                  <p className="text-sm text-gray-500 mt-2">Schedule your first Teams meeting to get started</p>
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
                  const timeInfo = formatMeetingTime(meeting.start_time, meeting.end_time);
                  const isDeleting = deletingMeetings.has(meeting.id);
                  
                  return (
                    <Card key={meeting.id} className={`w-full hover:shadow-md transition-shadow ${isDeleting ? 'opacity-50' : ''}`}>
                      <CardHeader className="pb-3 sm:pb-4">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg sm:text-xl flex flex-wrap items-start gap-2">
                              <span className="break-words">{meeting.title}</span>
                              {meeting.teams_join_url && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 shrink-0">
                                  <Video className="h-3 w-3 mr-1" />
                                  Teams
                                </Badge>
                              )}
                              {isDeleting && (
                                <Badge className="bg-orange-500 text-white shrink-0">
                                  Deleting...
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription className="break-words text-sm">
                              {timeInfo.date} • {timeInfo.duration}
                            </CardDescription>
                          </div>
                          <Badge variant="secondary" className="shrink-0 self-start">Completed</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
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
                                    Delete Past Meeting from All Platforms?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to permanently delete the past meeting "<strong>{meeting.title}</strong>"? This will remove all related data including transcripts from all platforms and cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteMeeting(meeting.id)}
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
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4 sm:space-y-6">
            <div className="w-full overflow-hidden">
              <CalendarView 
                meetings={meetings} 
                onMeetingClick={handleViewAgenda}
                onDateClick={handleCalendarDateClick}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

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

      {/* Mobile-specific responsive styles */}
      <style>{`
        @media (max-width: 767px) {
          /* Meeting module container mobile fixes */
          .max-w-7xl {
            max-width: 100vw;
            overflow-x: hidden;
            padding: 0 1rem;
            margin: 0;
          }
          
          /* Header responsive */
          .max-w-7xl h1 {
            font-size: 1.5rem;
            line-height: 1.4;
          }
          
          .max-w-7xl p {
            font-size: 0.875rem;
          }
          
          /* Better header alignment on mobile */
          .max-w-7xl .flex.justify-between.items-center {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
            padding: 0;
            margin: 0;
          }
          
          /* Schedule button mobile alignment */
          .max-w-7xl .flex.justify-between.items-center > button {
            align-self: flex-end;
            width: auto;
          }
          
          /* Tabs mobile responsive */
          .max-w-7xl .grid.w-full.grid-cols-3 {
            grid-template-columns: 1fr 1fr 1fr;
            gap: 0.25rem;
          }
          
          /* Tab triggers mobile text */
          .max-w-7xl .grid.w-full.grid-cols-3 button {
            font-size: 0.75rem;
            padding: 0.5rem 0.25rem;
            text-align: center;
          }
          
          /* Card mobile responsive */
          .max-w-7xl .grid.gap-6 {
            grid-template-columns: 1fr;
            gap: 1.25rem;
            width: 100%;
            max-width: 100%;
          }
          
          /* Card content mobile fixes */
          .max-w-7xl .hover\\:shadow-md {
            width: 100%;
            max-width: 100%;
            min-width: 0;
            overflow: hidden;
            margin: 0;
          }
          
          /* Card header mobile responsive */
          .max-w-7xl .flex.justify-between.items-start {
            flex-wrap: wrap;
            gap: 0.75rem;
            align-items: flex-start;
          }
          
          /* Meeting title mobile */
          .max-w-7xl .text-xl.flex.items-center {
            flex-wrap: wrap;
            gap: 0.5rem;
            align-items: flex-start;
          }
          
          /* Badge mobile responsive */
          .max-w-7xl .shrink-0 {
            flex-shrink: 0;
            min-width: fit-content;
          }
          
          /* Meeting info grid mobile */
          .max-w-7xl .grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4 {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }
          
          /* Teams link section mobile */
          .max-w-7xl .p-3.bg-blue-50 {
            padding: 0.75rem;
            margin: 0;
            width: 100%;
            box-sizing: border-box;
          }
          
          /* Teams link buttons mobile */
          .max-w-7xl .p-3.bg-blue-50 .flex.items-center.justify-between {
            flex-wrap: wrap;
            gap: 0.5rem;
            align-items: flex-start;
          }
          
          /* Action buttons mobile */
          .max-w-7xl .flex.flex-wrap.gap-2 {
            gap: 0.5rem;
            width: 100%;
          }
          
          /* Button mobile sizing */
          .max-w-7xl .flex.flex-wrap.gap-2 button {
            min-height: 44px;
            font-size: 0.875rem;
            padding: 0.5rem 0.75rem;
          }
          
          /* Better mobile spacing */
          .max-w-7xl .space-y-6 > * + * {
            margin-top: 1.5rem;
          }
          
          /* Text truncation mobile */
          .max-w-7xl .break-words {
            word-wrap: break-word;
            overflow-wrap: break-word;
            max-width: 100%;
          }
          
          /* URL text mobile */
          .max-w-7xl .break-all {
            word-break: break-all;
            font-size: 0.75rem;
            line-height: 1.3;
          }
          
          /* Card content spacing */
          .max-w-7xl .space-y-4 {
            gap: 1rem;
          }
          
          /* Calendar view mobile */
          .max-w-7xl .space-y-6 > div {
            width: 100%;
            max-width: 100%;
            overflow-x: auto;
          }
          
          /* Empty state mobile */
          .max-w-7xl .p-8.text-center {
            padding: 2rem 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default MeetingsModule;
