import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, Users, Video, FileText, Plus, Settings, Mic, Trash2 } from 'lucide-react';
import { ScheduleMeetingDialog } from './ScheduleMeetingDialog';
import { ViewAgendaDialog } from './ViewAgendaDialog';
import { ManageAttendeesDialog } from './ManageAttendeesDialog';
import { MeetingSettingsDialog } from './MeetingSettingsDialog';
import { useMeetings } from '@/hooks/useMeetings';
import { format } from 'date-fns';

export const MeetingsModule: React.FC = () => {
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showAgendaDialog, setShowAgendaDialog] = useState(false);
  const [showAttendeesDialog, setShowAttendeesDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
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

  const handleManageAttendees = (meeting: any) => {
    setSelectedMeeting(meeting);
    setShowAttendeesDialog(true);
  };

  const handleMeetingSettings = (meeting: any) => {
    setSelectedMeeting(meeting);
    setShowSettingsDialog(true);
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    if (confirm('Are you sure you want to delete this meeting?')) {
      await deleteMeeting(meetingId);
    }
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upcoming">Upcoming ({upcomingMeetings.length})</TabsTrigger>
            <TabsTrigger value="past">Past Meetings ({pastMeetings.length})</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
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
                  return (
                    <Card key={meeting.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl">{meeting.title}</CardTitle>
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
                        <div className="flex space-x-2">
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
                            onClick={() => handleManageAttendees(meeting)}
                          >
                            <Users className="h-4 w-4 mr-2" />
                            Attendees
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
                        <CardTitle className="text-xl">{meeting.title}</CardTitle>
                        <CardDescription>{timeInfo.date} • {timeInfo.duration}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-primary">{meeting.attendees?.length || 0}</div>
                            <div className="text-sm text-gray-500">Total Attendees</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-success">100%</div>
                            <div className="text-sm text-gray-500">Attendance Rate</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-warning">✓</div>
                            <div className="text-sm text-gray-500">Completed</div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewAgenda(meeting)}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          {meeting.teams_join_url && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => alert('Recording feature coming soon')}
                            >
                              <Video className="h-4 w-4 mr-2" />
                              Recording
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Meeting Calendar</CardTitle>
                <CardDescription>View all meetings in calendar format</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-secondary/50 rounded-lg p-8 text-center">
                  <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Calendar view will be integrated here</p>
                  <p className="text-sm text-gray-500 mt-2">Full calendar integration with Google Calendar, Outlook</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <div className="grid gap-4">
              {[
                { id: 1, name: 'Monthly Bureau Meeting', description: 'Regular monthly meeting template' },
                { id: 2, name: 'Emergency Meeting', description: 'Urgent matters discussion' },
                { id: 3, name: 'Committee Meeting', description: 'Specialized committee discussions' }
              ].map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-gray-900">{template.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => alert(`Creating meeting from template: ${template.name}`)}
                      >
                        Use Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
      <MeetingSettingsDialog 
        open={showSettingsDialog} 
        onOpenChange={setShowSettingsDialog}
        meeting={selectedMeeting}
      />
    </>
  );
};
