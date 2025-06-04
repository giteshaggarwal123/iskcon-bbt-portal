
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
import { format } from 'date-fns';

export const MeetingsModule: React.FC = () => {
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showAgendaDialog, setShowAgendaDialog] = useState(false);
  const [showAttendeesDialog, setShowAttendeesDialog] = useState(false);
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [showPostMeetingDialog, setShowPostMeetingDialog] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  
  const { meetings, loading, deleteMeeting } = useMeetings();
  const { toast } = useToast();

  // Filter meetings by date - including ALL scheduled meetings
  const now = new Date();
  const upcomingMeetings = meetings.filter(meeting => {
    const startTime = new Date(meeting.start_time);
    return startTime >= now || meeting.status === 'scheduled';
  });
  const pastMeetings = meetings.filter(meeting => {
    const startTime = new Date(meeting.start_time);
    return startTime < now && meeting.status !== 'scheduled';
  });

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
    if (confirm('Are you sure you want to delete this meeting?')) {
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
    // Placeholder for file attachment functionality
    alert(`Attach files to ${meeting.title}`);
  };

  const formatMeetingTime = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
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
    const start = new Date(meeting.start_time);
    const end = new Date(meeting.end_time);
    return now >= start && now <= end;
  };

  const canCheckIn = (meeting: any) => {
    const now = new Date();
    const start = new Date(meeting.start_time);
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
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meeting Management</h1>
            <p className="text-sm text-gray-600">Schedule, track, and manage all ISKCON meetings</p>
          </div>
          <Button 
            className="bg-primary hover:bg-primary/90"
            onClick={() => setShowScheduleDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Schedule Meeting
          </Button>
        </div>

        <Tabs defaultValue="upcoming" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upcoming">Upcoming ({upcomingMeetings.length})</TabsTrigger>
            <TabsTrigger value="past">Past Meetings ({pastMeetings.length})</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingMeetings.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Calendar className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No upcoming meetings</p>
                  <p className="text-sm text-gray-500 mt-1">Schedule your first meeting to get started</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {upcomingMeetings.map((meeting) => {
                  const timeInfo = formatMeetingTime(meeting.start_time, meeting.end_time);
                  const isLive = isLiveMeeting(meeting);
                  const canDoCheckIn = canCheckIn(meeting);
                  
                  return (
                    <Card key={meeting.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg flex items-center space-x-2">
                              <span>{meeting.title}</span>
                              {isLive && (
                                <Badge className="bg-red-500 text-white animate-pulse text-xs">
                                  LIVE
                                </Badge>
                              )}
                              {meeting.teams_join_url && (
                                <Badge className="bg-blue-500 text-white text-xs">
                                  <Video className="h-3 w-3 mr-1" />
                                  Teams
                                </Badge>
                              )}
                            </CardTitle>
                            {meeting.description && (
                              <CardDescription className="mt-1 text-sm">{meeting.description}</CardDescription>
                            )}
                          </div>
                          <Badge variant="secondary" className="text-xs">{meeting.status || 'scheduled'}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                          <div className="flex items-center space-x-2 text-sm">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span>{timeInfo.date}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span>{timeInfo.time} ({timeInfo.duration})</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm">
                            <Users className="h-4 w-4 text-gray-500" />
                            <span>{meeting.attendees?.length || 0} attendees</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm">
                            <Video className="h-4 w-4 text-gray-500" />
                            <span className="truncate">{meeting.location || 'No location'}</span>
                          </div>
                        </div>

                        {meeting.teams_join_url && (
                          <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Video className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-800">Teams Meeting</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCopyJoinUrl(meeting.teams_join_url)}
                                  className="h-6 px-2 text-blue-600 hover:bg-blue-100"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleJoinNow(meeting)}
                                  className="h-6 px-2 text-blue-600 hover:bg-blue-100"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex flex-wrap gap-2">
                          {meeting.teams_join_url && (
                            <Button 
                              size="sm"
                              onClick={() => handleJoinNow(meeting)}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <Video className="h-4 w-4 mr-1" />
                              Join
                            </Button>
                          )}
                          
                          {canDoCheckIn && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleCheckIn(meeting)}
                              className="text-green-700 border-green-200"
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              Check In
                            </Button>
                          )}
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewAgenda(meeting)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleAttachFiles(meeting)}
                            className="text-purple-700 border-purple-200"
                          >
                            <Paperclip className="h-4 w-4 mr-1" />
                            Files
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteMeeting(meeting.id)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
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
                <CardContent className="p-6 text-center">
                  <Clock className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No past meetings</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pastMeetings.map((meeting) => {
                  const timeInfo = formatMeetingTime(meeting.start_time, meeting.end_time);
                  return (
                    <Card key={meeting.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg flex items-center space-x-2">
                              <span>{meeting.title}</span>
                              {meeting.teams_join_url && (
                                <Badge variant="outline" className="text-blue-700 text-xs">
                                  <Video className="h-3 w-3 mr-1" />
                                  Teams
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription className="text-sm">{timeInfo.date} • {timeInfo.duration}</CardDescription>
                          </div>
                          <Badge variant="secondary" className="text-xs">Completed</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex flex-wrap gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewAgenda(meeting)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => alert('View meeting documents')}
                            className="text-blue-700 border-blue-200"
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Documents
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handlePostMeeting(meeting)}
                            className="text-orange-700 border-orange-200"
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Attendance
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
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <ScheduleMeetingDialog 
        open={showScheduleDialog} 
        onOpenChange={setShowScheduleDialog} 
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
    </>
  );
};
