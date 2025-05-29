
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, Users, Video, FileText, Plus, Settings, Mic } from 'lucide-react';

export const MeetingsModule: React.FC = () => {
  const [selectedView, setSelectedView] = useState('upcoming');

  const upcomingMeetings = [
    {
      id: 1,
      title: 'Monthly Bureau Meeting',
      date: '2024-01-20',
      time: '10:00 AM',
      duration: '2 hours',
      type: 'Physical',
      location: 'Main Conference Room',
      attendees: 12,
      agenda: 'Budget Review, New Projects, Policy Updates',
      status: 'scheduled'
    },
    {
      id: 2,
      title: 'Temple Construction Committee',
      date: '2024-01-22',
      time: '2:00 PM',
      duration: '1.5 hours',
      type: 'Online',
      location: 'Zoom Meeting',
      attendees: 8,
      agenda: 'Progress Review, Contractor Updates',
      status: 'scheduled'
    }
  ];

  const pastMeetings = [
    {
      id: 3,
      title: 'Annual Planning Meeting',
      date: '2024-01-15',
      time: '9:00 AM',
      duration: '3 hours',
      type: 'Hybrid',
      attendees: 15,
      momGenerated: true,
      recordingAvailable: true,
      attendanceRate: 93
    }
  ];

  const meetingTemplates = [
    { id: 1, name: 'Monthly Bureau Meeting', description: 'Regular monthly meeting template' },
    { id: 2, name: 'Emergency Meeting', description: 'Urgent matters discussion' },
    { id: 3, name: 'Committee Meeting', description: 'Specialized committee discussions' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meeting Management</h1>
          <p className="text-gray-600">Schedule, track, and manage all ISKCON meetings</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Schedule Meeting
        </Button>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past Meetings</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-6">
          <div className="grid gap-6">
            {upcomingMeetings.map((meeting) => (
              <Card key={meeting.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{meeting.title}</CardTitle>
                      <CardDescription className="mt-2">{meeting.agenda}</CardDescription>
                    </div>
                    <Badge className="bg-primary text-white">{meeting.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{meeting.date}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{meeting.time}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{meeting.attendees} attendees</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {meeting.type === 'Online' ? (
                        <Video className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Calendar className="h-4 w-4 text-gray-500" />
                      )}
                      <span className="text-sm">{meeting.location}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      View Agenda
                    </Button>
                    <Button variant="outline" size="sm">
                      <Users className="h-4 w-4 mr-2" />
                      Manage Attendees
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="past" className="space-y-6">
          <div className="grid gap-6">
            {pastMeetings.map((meeting) => (
              <Card key={meeting.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-xl">{meeting.title}</CardTitle>
                  <CardDescription>{meeting.date} • {meeting.duration}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{meeting.attendees}</div>
                      <div className="text-sm text-gray-500">Total Attendees</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-success">{meeting.attendanceRate}%</div>
                      <div className="text-sm text-gray-500">Attendance Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-warning">
                        {meeting.momGenerated ? '✓' : '✗'}
                      </div>
                      <div className="text-sm text-gray-500">MOM Generated</div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      View Minutes
                    </Button>
                    {meeting.recordingAvailable && (
                      <Button variant="outline" size="sm">
                        <Video className="h-4 w-4 mr-2" />
                        Watch Recording
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      <Mic className="h-4 w-4 mr-2" />
                      Transcription
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
            {meetingTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                    </div>
                    <Button variant="outline" size="sm">Use Template</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
