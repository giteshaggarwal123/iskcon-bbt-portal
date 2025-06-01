import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, Users, Calendar, MapPin, Video, Download, UserCheck } from 'lucide-react';
import { MarkAttendanceDialog } from './MarkAttendanceDialog';
import { useAttendance } from '@/hooks/useAttendance';
import { useMeetings } from '@/hooks/useMeetings';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { format } from 'date-fns';

export const AttendanceModule: React.FC = () => {
  const [showMarkAttendanceDialog, setShowMarkAttendanceDialog] = useState(false);
  const [attendanceData, setAttendanceData] = useState<any>({});
  const { generateAttendanceReport, fetchAttendanceForMeeting } = useAttendance();
  const { meetings } = useMeetings();
  const { user } = useAuth();
  const { canManageMembers } = useUserRole();

  // Fetch attendance data for each meeting with real-time updates
  useEffect(() => {
    const fetchAllAttendance = async () => {
      const data: any = {};
      for (const meeting of meetings) {
        const records = await fetchAttendanceForMeeting(meeting.id);
        data[meeting.id] = {
          present: records.filter((r: any) => r.attendance_status === 'present').length,
          late: records.filter((r: any) => r.attendance_status === 'late').length,
          absent: records.filter((r: any) => r.attendance_status === 'absent').length,
          totalMembers: records.length || 0,
          userAttendance: records.find((r: any) => r.user_id === user?.id) || null
        };
      }
      setAttendanceData(data);
    };

    if (meetings.length > 0) {
      fetchAllAttendance();
    }
  }, [meetings, fetchAttendanceForMeeting, user?.id]);

  const handleDownloadReport = async (type: string) => {
    const data = await generateAttendanceReport();
    
    let csvContent = '';
    
    switch (type) {
      case 'member':
        csvContent = 'Name,Email,Total Meetings,Present,Attendance Rate,Last Meeting Status\n';
        // Group by member and calculate stats
        break;
      case 'meeting':
        csvContent = 'Meeting,Date,Type,Total Attendees,Present,Late,Absent,Attendance Rate\n';
        meetings.forEach((meeting: any) => {
          const attendance = attendanceData[meeting.id] || { present: 0, late: 0, absent: 0, totalMembers: 0 };
          const rate = attendance.totalMembers > 0 ? Math.round((attendance.present / attendance.totalMembers) * 100) : 0;
          csvContent += `${meeting.title},${format(new Date(meeting.start_time), 'yyyy-MM-dd')},${meeting.meeting_type},${attendance.totalMembers},${attendance.present},${attendance.late},${attendance.absent},${rate}%\n`;
        });
        break;
      case 'detailed':
        csvContent = 'Date,Meeting,Member,Email,Status,Type,Join Time,Leave Time,Duration (min)\n';
        data.forEach((record: any) => {
          csvContent += `${new Date(record.created_at).toLocaleDateString()},${record.meetings?.title || 'Unknown'},${record.profiles?.first_name || ''} ${record.profiles?.last_name || ''},${record.profiles?.email || ''},${record.attendance_status},${record.attendance_type},${record.join_time || ''},${record.leave_time || ''},${record.duration_minutes || 0}\n`;
        });
        break;
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${type}_report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (meeting: any) => {
    const now = new Date();
    const start = new Date(meeting.start_time);
    const end = new Date(meeting.end_time);
    
    if (now >= start && now <= end) {
      return <Badge className="bg-green-500 text-white">Live</Badge>;
    } else if (now < start) {
      return <Badge className="bg-blue-500 text-white">Upcoming</Badge>;
    } else {
      return <Badge variant="secondary">Completed</Badge>;
    }
  };

  const formatMeetingInfo = (meeting: any) => {
    const start = new Date(meeting.start_time);
    return {
      date: format(start, 'MMM dd, yyyy'),
      time: format(start, 'h:mm a'),
      type: meeting.meeting_type || 'online',
      location: meeting.location || 'Online Meeting'
    };
  };

  const isOngoingMeeting = (meeting: any) => {
    const now = new Date();
    const start = new Date(meeting.start_time);
    const end = new Date(meeting.end_time);
    return now >= start && now <= end;
  };

  const getUserAttendanceStatus = (meetingId: string) => {
    const attendance = attendanceData[meetingId];
    if (!attendance || !attendance.userAttendance) {
      return null;
    }
    return attendance.userAttendance.attendance_status;
  };

  const canMarkAttendance = (meeting: any) => {
    const userStatus = getUserAttendanceStatus(meeting.id);
    const isLive = isOngoingMeeting(meeting);
    
    // Admins can always mark attendance
    if (canManageMembers) return true;
    
    // Members can only mark their own attendance if they haven't already and meeting is live or recent
    return !userStatus && (isLive || new Date().getTime() - new Date(meeting.end_time).getTime() < 3600000); // 1 hour after meeting
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
            <p className="text-gray-600">
              {canManageMembers 
                ? 'Track and manage meeting attendance across all sessions'
                : 'View meetings and mark your attendance'
              }
            </p>
          </div>
          <Button 
            className="bg-primary hover:bg-primary/90"
            onClick={() => setShowMarkAttendanceDialog(true)}
          >
            <UserCheck className="h-4 w-4 mr-2" />
            {canManageMembers ? 'Mark Attendance' : 'Mark My Attendance'}
          </Button>
        </div>

        <Tabs defaultValue="current" className="space-y-6">
          <TabsList className={`grid w-full ${canManageMembers ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <TabsTrigger value="current">Current Meetings</TabsTrigger>
            <TabsTrigger value="history">My Attendance</TabsTrigger>
            {canManageMembers && (
              <TabsTrigger value="reports">Reports</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="current" className="space-y-6">
            <div className="grid gap-6">
              {meetings.map((meeting) => {
                const meetingInfo = formatMeetingInfo(meeting);
                const attendance = attendanceData[meeting.id] || { present: 0, late: 0, absent: 0, totalMembers: 0 };
                const userStatus = getUserAttendanceStatus(meeting.id);
                
                return (
                  <Card key={meeting.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">{meeting.title}</CardTitle>
                          <CardDescription className="flex items-center space-x-4 mt-2">
                            <span className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{meetingInfo.date}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{meetingInfo.time}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              {meetingInfo.type === 'online' ? (
                                <Video className="h-4 w-4" />
                              ) : (
                                <MapPin className="h-4 w-4" />
                              )}
                              <span>{meetingInfo.location}</span>
                            </span>
                          </CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(meeting)}
                          {userStatus && (
                            <Badge 
                              className={
                                userStatus === 'present' ? 'bg-green-500 text-white' :
                                userStatus === 'late' ? 'bg-yellow-500 text-white' :
                                'bg-red-500 text-white'
                              }
                            >
                              My Status: {userStatus.charAt(0).toUpperCase() + userStatus.slice(1)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {(canManageMembers || isOngoingMeeting(meeting)) && attendance.totalMembers > 0 && (
                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span>Current Attendance</span>
                              <span>{Math.round((attendance.present / attendance.totalMembers) * 100)}%</span>
                            </div>
                            <Progress 
                              value={(attendance.present / attendance.totalMembers) * 100} 
                              className="h-3"
                            />
                          </div>
                        )}

                        {canManageMembers && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">{attendance.present}</div>
                              <div className="text-sm text-gray-500">Present</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-yellow-600">{attendance.late}</div>
                              <div className="text-sm text-gray-500">Late</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-red-600">{attendance.absent}</div>
                              <div className="text-sm text-gray-500">Absent</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">{attendance.totalMembers}</div>
                              <div className="text-sm text-gray-500">Total</div>
                            </div>
                          </div>
                        )}

                        <div className="flex space-x-2 pt-4 border-t">
                          {canMarkAttendance(meeting) && (
                            <Button 
                              size="sm" 
                              className="bg-green-500 hover:bg-green-600"
                              onClick={() => setShowMarkAttendanceDialog(true)}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              {canManageMembers ? 'Mark Attendance' : 'Check In'}
                            </Button>
                          )}
                          {canManageMembers && (
                            <>
                              <Button variant="outline" size="sm">
                                <Users className="h-4 w-4 mr-2" />
                                View Details
                              </Button>
                              <Button variant="outline" size="sm">
                                <Clock className="h-4 w-4 mr-2" />
                                Late Arrivals
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <div className="grid gap-4">
              {meetings.map((meeting) => {
                const userStatus = getUserAttendanceStatus(meeting.id);
                const meetingInfo = formatMeetingInfo(meeting);
                
                return (
                  <Card key={meeting.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <Calendar className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{meeting.title}</h3>
                            <p className="text-sm text-gray-500">{meetingInfo.date} at {meetingInfo.time}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {userStatus ? (
                            <Badge 
                              className={
                                userStatus === 'present' ? 'bg-green-500 text-white' :
                                userStatus === 'late' ? 'bg-yellow-500 text-white' :
                                'bg-red-500 text-white'
                              }
                            >
                              {userStatus.charAt(0).toUpperCase() + userStatus.slice(1)}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Not Marked</Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {canManageMembers && (
            <TabsContent value="reports" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Generate Reports</CardTitle>
                    <CardDescription>Export attendance data and analytics</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => handleDownloadReport('member')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Member Attendance Report
                    </Button>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => handleDownloadReport('meeting')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Meeting Attendance Summary
                    </Button>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => handleDownloadReport('detailed')}
                    >
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
                        <span className="font-semibold text-green-600">87%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Most Attended Meeting</span>
                        <span className="font-semibold">Monthly Bureau (93%)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Best Attendee</span>
                        <span className="font-semibold">Radha Krishna Das (92%)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Auto-Tracked Sessions</span>
                        <span className="font-semibold text-blue-600">12 Teams meetings</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      <MarkAttendanceDialog 
        open={showMarkAttendanceDialog} 
        onOpenChange={setShowMarkAttendanceDialog} 
      />
    </>
  );
};
