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
import { useIsMobile } from '@/hooks/use-mobile';
import { format } from 'date-fns';

export const AttendanceModule: React.FC = () => {
  const [showMarkAttendanceDialog, setShowMarkAttendanceDialog] = useState(false);
  const [attendanceData, setAttendanceData] = useState<any>({});
  const { generateAttendanceReport, fetchAttendanceForMeeting } = useAttendance();
  const { meetings } = useMeetings();
  const isMobile = useIsMobile();

  // Fetch attendance data for each meeting
  useEffect(() => {
    const fetchAllAttendance = async () => {
      const data: any = {};
      for (const meeting of meetings) {
        const records = await fetchAttendanceForMeeting(meeting.id);
        data[meeting.id] = {
          present: records.filter((r: any) => r.attendance_status === 'present').length,
          late: records.filter((r: any) => r.attendance_status === 'late').length,
          absent: records.filter((r: any) => r.attendance_status === 'absent').length,
          totalMembers: records.length || 0
        };
      }
      setAttendanceData(data);
    };

    if (meetings.length > 0) {
      fetchAllAttendance();
    }
  }, [meetings, fetchAttendanceForMeeting]);

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
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-red-600';
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

  return (
    <>
      <div className={`w-full mx-auto space-y-4 ${isMobile ? 'px-4 py-4' : 'max-w-7xl px-4 sm:px-6 lg:px-8 py-6'}`}>
        <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'justify-between items-center'}`}>
          <div>
            <h1 className={`font-bold text-gray-900 ${isMobile ? 'text-xl' : 'text-3xl'}`}>Attendance Management</h1>
            <p className={`text-gray-600 ${isMobile ? 'text-sm mt-1' : 'text-base'}`}>Track and manage meeting attendance across all sessions</p>
          </div>
          <Button 
            className={`bg-primary hover:bg-primary/90 ${isMobile ? 'w-full' : ''}`}
            onClick={() => setShowMarkAttendanceDialog(true)}
            size={isMobile ? "sm" : "default"}
          >
            <UserCheck className="h-4 w-4 mr-2" />
            Mark Attendance
          </Button>
        </div>

        <Tabs defaultValue="current" className="space-y-4">
          <TabsList className={`grid w-full grid-cols-4 ${isMobile ? 'h-9' : ''}`}>
            <TabsTrigger value="current" className={isMobile ? 'text-xs px-2' : ''}>
              Current ({meetings.length})
            </TabsTrigger>
            <TabsTrigger value="members" className={isMobile ? 'text-xs px-2' : ''}>
              Members
            </TabsTrigger>
            <TabsTrigger value="history" className={isMobile ? 'text-xs px-2' : ''}>
              History
            </TabsTrigger>
            <TabsTrigger value="reports" className={isMobile ? 'text-xs px-2' : ''}>
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4">
            {meetings.length === 0 ? (
              <Card>
                <CardContent className={`text-center ${isMobile ? 'p-6' : 'p-8'}`}>
                  <Calendar className={`text-gray-400 mx-auto mb-4 ${isMobile ? 'h-8 w-8' : 'h-12 w-12'}`} />
                  <p className={`text-gray-600 ${isMobile ? 'text-sm' : ''}`}>No meetings found</p>
                  <p className={`text-gray-500 mt-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    Schedule your first meeting to track attendance
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {meetings.map((meeting) => {
                  const meetingInfo = formatMeetingInfo(meeting);
                  const attendance = attendanceData[meeting.id] || { present: 0, late: 0, absent: 0, totalMembers: 0 };
                  
                  return (
                    <Card key={meeting.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className={isMobile ? 'pb-3' : ''}>
                        <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'justify-between items-start'}`}>
                          <div className="flex-1 min-w-0">
                            <CardTitle className={`flex items-center space-x-2 flex-wrap ${
                              isMobile ? 'text-lg' : 'text-xl'
                            }`}>
                              <span className="break-words">{meeting.title}</span>
                              {getStatusBadge(meeting)}
                            </CardTitle>
                            <CardDescription className={`mt-2 break-words ${isMobile ? 'text-sm' : ''}`}>
                              {meeting.description || 'No description provided'}
                            </CardDescription>
                          </div>
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
                              {meetingInfo.date}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-500 shrink-0" />
                            <span className={`break-words ${isMobile ? 'text-sm' : 'text-sm'}`}>
                              {meetingInfo.time}
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

                        {isOngoingMeeting(meeting) && attendance.totalMembers > 0 && (
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

                        <div className={`grid gap-4 ${
                          isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'
                        }`}>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{attendance.present}</div>
                            <div className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-sm'}`}>Present</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-600">{attendance.late}</div>
                            <div className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-sm'}`}>Late</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">{attendance.absent}</div>
                            <div className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-sm'}`}>Absent</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{attendance.totalMembers}</div>
                            <div className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-sm'}`}>Total</div>
                          </div>
                        </div>

                        {isOngoingMeeting(meeting) && (
                          <div className={`flex pt-4 border-t gap-2 ${
                            isMobile ? 'grid grid-cols-1' : 'flex-wrap'
                          }`}>
                            <Button 
                              size={isMobile ? "sm" : "sm"}
                              className={`bg-green-500 hover:bg-green-600 ${
                                isMobile ? 'text-xs w-full' : ''
                              }`}
                              onClick={() => setShowMarkAttendanceDialog(true)}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Quick Check-in
                            </Button>
                            <Button 
                              variant="outline" 
                              size={isMobile ? "sm" : "sm"}
                              className={isMobile ? 'text-xs' : ''}
                            >
                              <Users className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                            <Button 
                              variant="outline" 
                              size={isMobile ? "sm" : "sm"}
                              className={isMobile ? 'text-xs' : ''}
                            >
                              <Clock className="h-4 w-4 mr-2" />
                              Late Arrivals
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            <div className="space-y-4">
              {memberAttendance.map((member, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className={isMobile ? 'p-4' : 'p-6'}>
                    <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'}`}>
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className={`font-semibold text-gray-900 ${isMobile ? 'text-base' : 'text-lg'}`}>{member.name}</h3>
                          <p className={`text-gray-500 ${isMobile ? 'text-sm' : 'text-base'}`}>{member.role}</p>
                        </div>
                      </div>
                      <div className={`${isMobile ? 'grid grid-cols-3 gap-4 w-full' : 'flex items-center space-x-4'}`}>
                        <div className="text-center">
                          <div className={`font-bold ${getAttendanceColor(member.percentage)} ${
                            isMobile ? 'text-xl' : 'text-2xl'
                          }`}>
                            {member.percentage}%
                          </div>
                          <div className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-sm'}`}>Attendance</div>
                        </div>
                        <div className="text-center">
                          <div className={`font-semibold ${isMobile ? 'text-base' : 'text-lg'}`}>{member.present}/{member.total}</div>
                          <div className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-sm'}`}>Meetings</div>
                        </div>
                        <div className="text-center">
                          <Badge 
                            className={`${
                              member.lastMeeting === 'Present' ? 'bg-green-500 text-white' :
                              member.lastMeeting === 'Late' ? 'bg-yellow-500 text-white' :
                              'bg-red-500 text-white'
                            } ${isMobile ? 'text-xs' : ''}`}
                          >
                            {member.lastMeeting}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="space-y-4">
              {attendanceHistory.map((record, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader className={isMobile ? 'pb-3' : ''}>
                    <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'justify-between items-start'}`}>
                      <div>
                        <CardTitle className={isMobile ? 'text-lg' : 'text-xl'}>{record.meeting}</CardTitle>
                        <CardDescription className={isMobile ? 'text-sm' : ''}>{record.date}</CardDescription>
                      </div>
                      <Badge className={`bg-primary text-white ${isMobile ? 'self-start' : ''}`}>{record.attendance}%</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className={isMobile ? 'pt-0' : ''}>
                    <div className={`grid gap-4 ${
                      isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'
                    }`}>
                      <div className="text-center">
                        <div className={`font-bold text-primary ${isMobile ? 'text-xl' : 'text-2xl'}`}>{record.present}/{record.total}</div>
                        <div className={`text-gray-500 ${isMobile ? 'text-sm' : 'text-sm'}`}>Attendance</div>
                      </div>
                      <div className="text-center">
                        <div className={`font-bold text-green-600 ${isMobile ? 'text-xl' : 'text-2xl'}`}>{record.attendance}%</div>
                        <div className={`text-gray-500 ${isMobile ? 'text-sm' : 'text-sm'}`}>Rate</div>
                      </div>
                      <div className="text-center">
                        <div className={`font-bold text-yellow-600 ${isMobile ? 'text-xl' : 'text-2xl'}`}>{record.avgDuration}</div>
                        <div className={`text-gray-500 ${isMobile ? 'text-sm' : 'text-sm'}`}>Avg Duration</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
              <Card>
                <CardHeader>
                  <CardTitle className={isMobile ? 'text-lg' : 'text-xl'}>Generate Reports</CardTitle>
                  <CardDescription className={isMobile ? 'text-sm' : ''}>Export attendance data and analytics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    className="w-full" 
                    variant="outline"
                    size={isMobile ? "sm" : "default"}
                    onClick={() => handleDownloadReport('member')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Member Attendance Report
                  </Button>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    size={isMobile ? "sm" : "default"}
                    onClick={() => handleDownloadReport('meeting')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Meeting Attendance Summary
                  </Button>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    size={isMobile ? "sm" : "default"}
                    onClick={() => handleDownloadReport('detailed')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Detailed Analytics
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className={isMobile ? 'text-lg' : 'text-xl'}>Quick Stats</CardTitle>
                  <CardDescription className={isMobile ? 'text-sm' : ''}>Overall attendance overview</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className={isMobile ? 'text-sm' : ''}>Overall Attendance</span>
                      <span className={`font-semibold text-green-600 ${isMobile ? 'text-sm' : ''}`}>87%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isMobile ? 'text-sm' : ''}>Most Attended Meeting</span>
                      <span className={`font-semibold ${isMobile ? 'text-sm' : ''}`}>Monthly Bureau (93%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isMobile ? 'text-sm' : ''}>Best Attendee</span>
                      <span className={`font-semibold ${isMobile ? 'text-sm' : ''}`}>Radha Krishna Das (92%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isMobile ? 'text-sm' : ''}>Auto-Tracked Sessions</span>
                      <span className={`font-semibold text-blue-600 ${isMobile ? 'text-sm' : ''}`}>12 Teams meetings</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <MarkAttendanceDialog 
        open={showMarkAttendanceDialog} 
        onOpenChange={setShowMarkAttendanceDialog} 
      />
    </>
  );
};
