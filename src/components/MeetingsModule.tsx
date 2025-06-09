import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, Users, Video, FileText, Plus, Trash2, UserCheck, Paperclip, ExternalLink, Copy } from 'lucide-react';
import { ScheduleMeetingDialog } from './ScheduleMeetingDialog';
import { ViewAgendaDialog } from './ViewAgendaDialog';
import { ManageAttendeesDialog } from './ManageAttendeesDialog';
import { CheckInDialog } from './CheckInDialog';
import { PostMeetingDialog } from './PostMeetingDialog';
import { CalendarView } from './CalendarView';
import { useMeetings } from '@/hooks/useMeetings';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { format, parseISO, compareAsc, compareDesc } from 'date-fns';

export const MeetingsModule: React.FC = () => {
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showAgendaDialog, setShowAgendaDialog] = useState(false);
  const [showAttendeesDialog, setShowAttendeesDialog] = useState(false);
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [showPostMeetingDialog, setShowPostMeetingDialog] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const [preselectedDate, setPreselectedDate] = useState<Date | undefined>(undefined);
  
  const { meetings, loading, deleteMeeting, fetchMeetings } = useMeetings();
  const { toast } = useToast();
  const isMobile = useIsMobile();

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

  const handlePostMeeting = (meeting: any) => {
    setSelectedMeeting(meeting);
    setShowPostMeetingDialog(true);
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    if (confirm('Are you sure you want to delete this meeting? This will also remove it from Teams and Outlook calendar.')) {
      await deleteMeeting(meetingId);
    }
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

  const handleAttachFiles = (meeting: any) => {
    // This will be implemented with file attachment functionality
    alert(`Attach files to ${meeting.title}`);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={`w-full mx-auto space-y-4 ${isMobile ? 'px-4 py-4' : 'max-w-7xl px-4 sm:px-6 lg:px-8 py-6'}`}>
      {/* Header Section */}
      <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'justify-between items-center'}`}>
        <div>
          <h1 className={`font-bold text-gray-900 ${isMobile ? 'text-xl' : 'text-3xl'}`}>Meeting Management</h1>
          <p className={`text-gray-600 ${isMobile ? 'text-sm mt-1' : 'text-base'}`}>
            Schedule, track, and manage all ISKCON meetings with Teams integration
          </p>
        </div>
        <Button 
          className={`bg-primary hover:bg-primary/90 ${isMobile ? 'w-full' : ''}`}
          onClick={() => setShowScheduleDialog(true)}
          size={isMobile ? "sm" : "default"}
        >
          <Plus className="h-4 w-4 mr-2" />
          Schedule Meeting
        </Button>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList className={`grid w-full grid-cols-3 ${isMobile ? 'h-9' : ''}`}>
          <TabsTrigger value="upcoming" className={isMobile ? 'text-xs px-2' : ''}>
            Upcoming ({upcomingMeetings.length})
          </TabsTrigger>
          <TabsTrigger value="past" className={isMobile ? 'text-xs px-2' : ''}>
            Past ({pastMeetings.length})
          </TabsTrigger>
          <TabsTrigger value="calendar" className={isMobile ? 'text-xs px-2' : ''}>
            Calendar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingMeetings.length === 0 ? (
            <Card>
              <CardContent className={`text-center ${isMobile ? 'p-6' : 'p-8'}`}>
                <Calendar className={`text-gray-400 mx-auto mb-4 ${isMobile ? 'h-8 w-8' : 'h-12 w-12'}`} />
                <p className={`text-gray-600 ${isMobile ? 'text-sm' : ''}`}>No upcoming meetings</p>
                <p className={`text-gray-500 mt-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  Schedule your first Teams meeting to get started
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {upcomingMeetings.map((meeting) => {
                const timeInfo = formatMeetingTime(meeting.start_time, meeting.end_time);
                const isLive = isLiveMeeting(meeting);
                const canDoCheckIn = canCheckIn(meeting);
                
                return (
                  <Card key={meeting.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className={isMobile ? 'pb-3' : ''}>
                      <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'justify-between items-start'}`}>
                        <div className="flex-1 min-w-0">
                          <CardTitle className={`flex items-center space-x-2 flex-wrap ${
                            isMobile ? 'text-lg' : 'text-xl'
                          }`}>
                            <span className="break-words">{meeting.title}</span>
                            {isLive && (
                              <Badge className="bg-red-500 text-white animate-pulse">
                                LIVE
                              </Badge>
                            )}
                            {meeting.teams_join_url && (
                              <Badge className="bg-blue-500 text-white">
                                <Video className="h-3 w-3 mr-1" />
                                Teams
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription className={`mt-2 break-words ${isMobile ? 'text-sm' : ''}`}>
                            {meeting.description || 'No description provided'}
                          </CardDescription>
                        </div>
                        <Badge className={`bg-green-100 text-green-800 ${isMobile ? 'self-start' : 'ml-4 shrink-0'}`}>
                          {meeting.status || 'scheduled'}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className={`space-y-4 ${isMobile ? 'pt-0' : ''}`}>
                      {/* Meeting Info Grid */}
                      <div className={`grid gap-3 ${
                        isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                      }`}>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-500 shrink-0" />
                          <span className={`break-words ${isMobile ? 'text-sm' : 'text-sm'}`}>
                            {timeInfo.date}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-500 shrink-0" />
                          <span className={`break-words ${isMobile ? 'text-sm' : 'text-sm'}`}>
                            {timeInfo.time} ({timeInfo.duration})
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-gray-500 shrink-0" />
                          <span className={isMobile ? 'text-sm' : 'text-sm'}>
                            {meeting.attendees?.length || 0} attendees
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Video className="h-4 w-4 text-gray-500 shrink-0" />
                          <span className={`break-words ${isMobile ? 'text-sm' : 'text-sm'}`}>
                            {meeting.location || 'No location'}
                          </span>
                        </div>
                      </div>

                      {/* Teams Join Link */}
                      {meeting.teams_join_url && (
                        <div className={`bg-blue-50 rounded-lg border border-blue-200 ${isMobile ? 'p-3' : 'p-3'}`}>
                          <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'items-center justify-between'} gap-2`}>
                            <div className="flex items-center space-x-2">
                              <Video className="h-4 w-4 text-blue-600 shrink-0" />
                              <span className={`font-medium text-blue-800 ${isMobile ? 'text-sm' : 'text-sm'}`}>
                                Teams Meeting Link
                              </span>
                            </div>
                            <div className={`flex items-center space-x-2 ${isMobile ? 'w-full' : ''}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyJoinUrl(meeting.teams_join_url)}
                                className={`text-blue-600 hover:bg-blue-100 ${
                                  isMobile ? 'h-8 px-3 text-xs flex-1' : 'h-7 px-2'
                                }`}
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleJoinNow(meeting)}
                                className={`text-blue-600 hover:bg-blue-100 ${
                                  isMobile ? 'h-8 px-3 text-xs flex-1' : 'h-7 px-2'
                                }`}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Open
                              </Button>
                            </div>
                          </div>
                          {!isMobile && (
                            <p className="text-xs text-blue-600 mt-1 break-all">
                              {meeting.teams_join_url}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {/* Action Buttons */}
                      <div className={`flex flex-wrap gap-2 ${isMobile ? 'grid grid-cols-2' : ''}`}>
                        {meeting.teams_join_url && (
                          <Button 
                            variant="default" 
                            size={isMobile ? "sm" : "sm"}
                            onClick={() => handleJoinNow(meeting)}
                            className={`bg-blue-600 hover:bg-blue-700 text-white ${
                              isMobile ? 'col-span-2 text-xs' : ''
                            }`}
                          >
                            <Video className="h-4 w-4 mr-2" />
                            Join Meeting
                          </Button>
                        )}
                        
                        {canDoCheckIn && (
                          <Button 
                            variant="outline" 
                            size={isMobile ? "sm" : "sm"}
                            onClick={() => handleCheckIn(meeting)}
                            className={`bg-green-50 hover:bg-green-100 text-green-700 ${
                              isMobile ? 'text-xs' : ''
                            }`}
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            Check In
                          </Button>
                        )}
                        
                        <Button 
                          variant="outline" 
                          size={isMobile ? "sm" : "sm"}
                          onClick={() => handleViewAgenda(meeting)}
                          className={isMobile ? 'text-xs' : ''}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Details
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size={isMobile ? "sm" : "sm"}
                          onClick={() => handleAttachFiles(meeting)}
                          className={`bg-purple-50 hover:bg-purple-100 text-purple-700 ${
                            isMobile ? 'text-xs' : ''
                          }`}
                        >
                          <Paperclip className="h-4 w-4 mr-2" />
                          Files
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size={isMobile ? "sm" : "sm"}
                          onClick={() => handleDeleteMeeting(meeting.id)}
                          className={`text-red-600 hover:text-red-700 hover:bg-red-50 ${
                            isMobile ? 'text-xs' : ''
                          }`}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {pastMeetings.length === 0 ? (
            <Card>
              <CardContent className={`text-center ${isMobile ? 'p-6' : 'p-8'}`}>
                <Clock className={`text-gray-400 mx-auto mb-4 ${isMobile ? 'h-8 w-8' : 'h-12 w-12'}`} />
                <p className={`text-gray-600 ${isMobile ? 'text-sm' : ''}`}>No past meetings</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pastMeetings.map((meeting) => {
                const timeInfo = formatMeetingTime(meeting.start_time, meeting.end_time);
                return (
                  <Card key={meeting.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className={isMobile ? 'pb-3' : ''}>
                      <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'justify-between items-start'}`}>
                        <div className="flex-1 min-w-0">
                          <CardTitle className={`flex items-center space-x-2 flex-wrap ${
                            isMobile ? 'text-lg' : 'text-xl'
                          }`}>
                            <span className="break-words">{meeting.title}</span>
                            {meeting.teams_join_url && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                <Video className="h-3 w-3 mr-1" />
                                Teams
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription className={`break-words ${isMobile ? 'text-sm' : ''}`}>
                            {timeInfo.date} • {timeInfo.duration}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary" className={`${isMobile ? 'self-start' : 'ml-4 shrink-0'}`}>
                          Completed
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className={isMobile ? 'pt-0' : ''}>
                      <div className={`flex flex-wrap gap-2 ${isMobile ? 'grid grid-cols-2' : ''}`}>
                        <Button 
                          variant="outline" 
                          size={isMobile ? "sm" : "sm"}
                          onClick={() => handleViewAgenda(meeting)}
                          className={isMobile ? 'text-xs' : ''}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Details
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size={isMobile ? "sm" : "sm"}
                          onClick={() => alert('View meeting transcript and documents')}
                          className={`bg-blue-50 hover:bg-blue-100 text-blue-700 ${
                            isMobile ? 'text-xs' : ''
                          }`}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Transcript
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size={isMobile ? "sm" : "sm"}
                          onClick={() => handlePostMeeting(meeting)}
                          className={`bg-orange-50 hover:bg-orange-100 text-orange-700 ${
                            isMobile ? 'text-xs col-span-2' : ''
                          }`}
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          Update Attendance
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <CalendarView 
            meetings={meetings} 
            onMeetingClick={handleViewAgenda}
            onDateClick={handleCalendarDateClick}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ScheduleMeetingDialog 
        open={showScheduleDialog} 
        onOpenChange={handleScheduleMeetingClose}
        preselectedDate={preselectedDate}
      />
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
      <PostMeetingDialog
        open={showPostMeetingDialog}
        onOpenChange={setShowPostMeetingDialog}
        meeting={selectedMeeting}
      />
    </div>
  );
};
