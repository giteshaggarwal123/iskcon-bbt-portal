
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, Users, Calendar, MapPin, Video, Download, UserCheck } from 'lucide-react';

export const AttendanceModule: React.FC = () => {
  const meetings = [
    {
      id: 1,
      title: 'Monthly Bureau Meeting',
      date: '2024-01-20',
      time: '10:00 AM',
      type: 'Physical',
      location: 'Main Conference Room',
      totalMembers: 12,
      present: 10,
      late: 1,
      absent: 1,
      status: 'ongoing'
    },
    {
      id: 2,
      title: 'Temple Construction Committee',
      date: '2024-01-22',
      time: '2:00 PM',
      type: 'Online',
      location: 'Zoom Meeting',
      totalMembers: 8,
      present: 0,
      late: 0,
      absent: 0,
      status: 'upcoming'
    }
  ];

  const memberAttendance = [
    { name: 'Radha Krishna Das', role: 'General Secretary', present: 11, total: 12, percentage: 92, lastMeeting: 'Present' },
    { name: 'Govinda Maharaj', role: 'Bureau Member', present: 10, total: 12, percentage: 83, lastMeeting: 'Present' },
    { name: 'Gauranga Prabhu', role: 'Bureau Member', present: 9, total: 12, percentage: 75, lastMeeting: 'Late' },
    { name: 'Nitai Das', role: 'Bureau Member', present: 8, total: 12, percentage: 67, lastMeeting: 'Absent' }
  ];

  const attendanceHistory = [
    {
      date: '2024-01-15',
      meeting: 'Annual Planning Meeting',
      attendance: 93,
      present: 14,
      total: 15,
      avgDuration: '2h 45m'
    },
    {
      date: '2024-01-10',
      meeting: 'Emergency Committee Meeting',
      attendance: 87,
      present: 7,
      total: 8,
      avgDuration: '1h 30m'
    }
  ];

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-success';
    if (percentage >= 75) return 'text-warning';
    return 'text-error';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ongoing':
        return <Badge className="bg-success text-white">Live</Badge>;
      case 'upcoming':
        return <Badge className="bg-primary text-white">Upcoming</Badge>;
      default:
        return <Badge variant="secondary">Completed</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
          <p className="text-gray-600">Track and manage meeting attendance across all sessions</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <UserCheck className="h-4 w-4 mr-2" />
          Mark Attendance
        </Button>
      </div>

      <Tabs defaultValue="current" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="current">Current Meetings</TabsTrigger>
          <TabsTrigger value="members">Member Records</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-6">
          <div className="grid gap-6">
            {meetings.map((meeting) => (
              <Card key={meeting.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{meeting.title}</CardTitle>
                      <CardDescription className="flex items-center space-x-4 mt-2">
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{meeting.date}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{meeting.time}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          {meeting.type === 'Online' ? (
                            <Video className="h-4 w-4" />
                          ) : (
                            <MapPin className="h-4 w-4" />
                          )}
                          <span>{meeting.location}</span>
                        </span>
                      </CardDescription>
                    </div>
                    {getStatusBadge(meeting.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {meeting.status === 'ongoing' && (
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Current Attendance</span>
                          <span>{Math.round((meeting.present / meeting.totalMembers) * 100)}%</span>
                        </div>
                        <Progress 
                          value={(meeting.present / meeting.totalMembers) * 100} 
                          className="h-3"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-success">{meeting.present}</div>
                        <div className="text-sm text-gray-500">Present</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-warning">{meeting.late}</div>
                        <div className="text-sm text-gray-500">Late</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-error">{meeting.absent}</div>
                        <div className="text-sm text-gray-500">Absent</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{meeting.totalMembers}</div>
                        <div className="text-sm text-gray-500">Total</div>
                      </div>
                    </div>

                    {meeting.status === 'ongoing' && (
                      <div className="flex space-x-2 pt-4 border-t">
                        <Button size="sm" className="bg-success hover:bg-success/90">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Quick Check-in
                        </Button>
                        <Button variant="outline" size="sm">
                          <Users className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        <Button variant="outline" size="sm">
                          <Clock className="h-4 w-4 mr-2" />
                          Late Arrivals
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <div className="grid gap-4">
            {memberAttendance.map((member, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{member.name}</h3>
                        <p className="text-sm text-gray-500">{member.role}</p>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${getAttendanceColor(member.percentage)}`}>
                            {member.percentage}%
                          </div>
                          <div className="text-sm text-gray-500">Attendance</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold">{member.present}/{member.total}</div>
                          <div className="text-sm text-gray-500">Meetings</div>
                        </div>
                        <div className="text-center">
                          <Badge 
                            className={
                              member.lastMeeting === 'Present' ? 'bg-success text-white' :
                              member.lastMeeting === 'Late' ? 'bg-warning text-white' :
                              'bg-error text-white'
                            }
                          >
                            {member.lastMeeting}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <div className="grid gap-6">
            {attendanceHistory.map((record, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{record.meeting}</CardTitle>
                      <CardDescription>{record.date}</CardDescription>
                    </div>
                    <Badge className="bg-primary text-white">{record.attendance}%</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{record.present}/{record.total}</div>
                      <div className="text-sm text-gray-500">Attendance</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-success">{record.attendance}%</div>
                      <div className="text-sm text-gray-500">Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-warning">{record.avgDuration}</div>
                      <div className="text-sm text-gray-500">Avg Duration</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Generate Reports</CardTitle>
                <CardDescription>Export attendance data and analytics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Member Attendance Report
                </Button>
                <Button className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Meeting Attendance Summary
                </Button>
                <Button className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Detailed Analytics
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
                <CardDescription>Overall attendance overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Overall Attendance</span>
                    <span className="font-semibold text-success">87%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Most Attended Meeting</span>
                    <span className="font-semibold">Monthly Bureau (93%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Best Attendee</span>
                    <span className="font-semibold">Radha Krishna Das (92%)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
