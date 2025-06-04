
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, Users, Video, FileText, Plus, Trash2, UserCheck, Paperclip } from 'lucide-react';
import { ScheduleMeetingDialog } from './ScheduleMeetingDialog';
import { ViewAgendaDialog } from './ViewAgendaDialog';
import { ManageAttendeesDialog } from './ManageAttendeesDialog';
import { CheckInDialog } from './CheckInDialog';
import { PostMeetingDialog } from './PostMeetingDialog';
import { CalendarView } from './CalendarView';
import { useMeetings } from '@/hooks/useMeetings';
import { format } from 'date-fns';

export const MeetingsModule: React.FC = () => {
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showAgendaDialog, setShowAgendaDialog] = useState(false);
  const [showAttendeesDialog, setShowAttendeesDialog] = useState(false);
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [showPostMeetingDialog, setShowPostMeetingDialog] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  
  const { meetings, loading, deleteMeeting } = useMeetings();

  // Filter meetings by date
  const now = new Date();
  const upcomingMeetings = meetings.filter(meeting => new Date(meeting.start_time) >= now);
  const pastMeetings = meetings.filter(meeting => new Date(meeting.start_time) < now);

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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Meeting Management</h1>
            <p className="text-gray-600">Schedule, track, and manage all ISKCON meetings</p>
          </div>
          <Button 
            className="bg-primary hover:bg-primary/90"
            onClick={() => setShowScheduleDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Schedule Meeting
          </Button>
        </div>

        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upcoming">Upcoming ({upcomingMeetings.length})</TabsTrigger>
            <TabsTrigger value="past">Past Meetings ({pastMeetings.length})</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-6">
            {upcomingMeetings.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No upcoming meetings</p>
                  <p className="text-sm text-gray-500 mt-2">Schedule your first meeting to get started</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {upcomingMeetings.map((meeting) => {
                  const timeInfo = formatMeetingTime(meeting.start_time, meeting.end_time);
                  const isLive = isLiveMeeting(meeting);
                  const canDoCheckIn = canCheckIn(meeting);
                  
                  return (
                    <Card key={meeting.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl flex items-center space-x-2">
                              <span>{meeting.title}</span>
                              {isLive && (
                                <Badge className="bg-red-500 text-white animate-pulse">
                                  LIVE
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription className="mt-2">{meeting.description || 'No description provided'}</CardDescription>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className="bg-primary text-white">{meeting.status || 'scheduled'}</Badge>
                            {meeting.teams_join_url && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700">Teams</Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">{timeInfo.date}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">{timeInfo.time} ({timeInfo.duration})</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">{meeting.attendees?.length || 0} attendees</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {meeting.meeting_type === 'online' ? (
                              <Video className="h-4 w-4 text-gray-500" />
                            ) : (
                              <Calendar className="h-4 w-4 text-gray-500" />
                            )}
                            <span className="text-sm">{meeting.location || 'No location'}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {meeting.teams_join_url && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.open(meeting.teams_join_url, '_blank')}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-700"
                            >
                              <Video className="h-4 w-4 mr-2" />
                              Join Teams
                            </Button>
                          )}
                          
                          {canDoCheckIn && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleCheckIn(meeting)}
                              className="bg-green-50 hover:bg-green-100 text-green-700"
                            >
                              <UserCheck className="h-4 w-4 mr-2" />
                              Check In
                            </Button>
                          )}
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewAgenda(meeting)}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleAttachFiles(meeting)}
                            className="bg-purple-50 hover:bg-purple-100 text-purple-700"
                          >
                            <Paperclip className="h-4 w-4 mr-2" />
                            Attach Files
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteMeeting(meeting.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
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

          <TabsContent value="past" className="space-y-6">
            {pastMeetings.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No past meetings</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {pastMeetings.map((meeting) => {
                  const timeInfo = formatMeetingTime(meeting.start_time, meeting.end_time);
                  return (
                    <Card key={meeting.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl">{meeting.title}</CardTitle>
                            <CardDescription>{timeInfo.date} • {timeInfo.duration}</CardDescription>
                          </div>
                          <Badge variant="secondary">Completed</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2 mb-4">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewAgenda(meeting)}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => alert('View meeting documents')}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            View Document
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handlePostMeeting(meeting)}
                            className="bg-orange-50 hover:bg-orange-100 text-orange-700"
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

          <TabsContent value="calendar" className="space-y-6">
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
