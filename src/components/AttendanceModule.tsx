
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
import { format } from 'date-fns';

export const AttendanceModule: React.FC = () => {
  const [showMarkAttendanceDialog, setShowMarkAttendanceDialog] = useState(false);
  const [attendanceData, setAttendanceData] = useState<any>({});
  const { generateAttendanceReport, fetchAttendanceForMeeting } = useAttendance();
  const { meetings } = useMeetings();

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
      return <Badge className="bg-green-500 text-white text-xs">Live</Badge>;
    } else if (now < start) {
      return <Badge className="bg-blue-500 text-white text-xs">Upcoming</Badge>;
    } else {
      return <Badge variant="secondary" className="text-xs">Completed</Badge>;
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
      <div className="min-h-screen bg-background overflow-x-hidden">
        <div className="w-full max-w-none px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
          {/* Header Section */}
          <div className="flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="space-y-1 sm:space-y-2">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">Attendance Management</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Track and manage meeting attendance</p>
            </div>
            <Button 
              className="w-full sm:w-auto bg-primary hover:bg-primary/90"
              size="sm"
              onClick={() => setShowMarkAttendanceDialog(true)}
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Mark Attendance
            </Button>
          </div>

          <Tabs defaultValue="current" className="w-full">
            <div className="w-full overflow-x-auto">
              <TabsList className="grid w-full grid-cols-4 h-auto min-w-[320px]">
                <TabsTrigger value="current" className="text-xs sm:text-sm px-2 py-2">Current</TabsTrigger>
                <TabsTrigger value="members" className="text-xs sm:text-sm px-2 py-2">Members</TabsTrigger>
                <TabsTrigger value="history" className="text-xs sm:text-sm px-2 py-2">History</TabsTrigger>
                <TabsTrigger value="reports" className="text-xs sm:text-sm px-2 py-2">Reports</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="current" className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
              <div className="space-y-4 sm:space-y-6">
                {meetings.map((meeting) => {
                  const meetingInfo = formatMeetingInfo(meeting);
                  const attendance = attendanceData[meeting.id] || { present: 0, late: 0, absent: 0, totalMembers: 0 };
                  
                  return (
                    <Card key={meeting.id} className="w-full border-border/50">
                      <CardHeader className="space-y-3 sm:space-y-4 pb-3 sm:pb-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <CardTitle className="text-base sm:text-lg lg:text-xl font-semibold leading-tight break-words flex-1 min-w-0">
                              {meeting.title}
                            </CardTitle>
                            <div className="shrink-0">
                              {getStatusBadge(meeting)}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 gap-2 text-xs sm:text-sm text-muted-foreground">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                              <span className="truncate">{meetingInfo.date}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                              <span className="truncate">{meetingInfo.time}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {meetingInfo.type === 'online' ? (
                                <Video className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                              ) : (
                                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                              )}
                              <span className="truncate text-xs sm:text-sm">{meetingInfo.location}</span>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4 sm:space-y-6">
                        {isOngoingMeeting(meeting) && attendance.totalMembers > 0 && (
                          <div className="space-y-2 sm:space-y-3">
                            <div className="flex justify-between text-xs sm:text-sm">
                              <span className="font-medium">Current Attendance</span>
                              <span className="font-semibold text-primary">
                                {Math.round((attendance.present / attendance.totalMembers) * 100)}%
                              </span>
                            </div>
                            <Progress 
                              value={(attendance.present / attendance.totalMembers) * 100} 
                              className="h-2 sm:h-3"
                            />
                          </div>
                        )}

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                          <div className="text-center p-3 sm:p-4 bg-green-50 rounded-xl border border-green-100">
                            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">{attendance.present}</div>
                            <div className="text-xs sm:text-sm text-green-700 font-medium">Present</div>
                          </div>
                          <div className="text-center p-3 sm:p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-600">{attendance.late}</div>
                            <div className="text-xs sm:text-sm text-yellow-700 font-medium">Late</div>
                          </div>
                          <div className="text-center p-3 sm:p-4 bg-red-50 rounded-xl border border-red-100">
                            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600">{attendance.absent}</div>
                            <div className="text-xs sm:text-sm text-red-700 font-medium">Absent</div>
                          </div>
                          <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">{attendance.totalMembers}</div>
                            <div className="text-xs sm:text-sm text-blue-700 font-medium">Total</div>
                          </div>
                        </div>

                        {isOngoingMeeting(meeting) && (
                          <div className="flex flex-col gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-border/50">
                            <Button 
                              size="sm" 
                              className="w-full bg-green-500 hover:bg-green-600 text-white"
                              onClick={() => setShowMarkAttendanceDialog(true)}
                            >
                              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                              <span className="text-xs sm:text-sm">Quick Check-in</span>
                            </Button>
                            <div className="grid grid-cols-2 gap-2 sm:gap-3">
                              <Button variant="outline" size="sm" className="w-full">
                                <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                <span className="text-xs sm:text-sm">Details</span>
                              </Button>
                              <Button variant="outline" size="sm" className="w-full">
                                <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                <span className="text-xs sm:text-sm">Late</span>
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="members" className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
              <div className="space-y-3 sm:space-y-4">
                {memberAttendance.map((member, index) => (
                  <Card key={index} className="w-full border-border/50">
                    <CardContent className="p-4 sm:p-6">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3 sm:space-x-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-foreground text-sm sm:text-base lg:text-lg truncate">{member.name}</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">{member.role}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 sm:gap-6">
                          <div className="text-center">
                            <div className={`text-lg sm:text-xl lg:text-2xl font-bold ${getAttendanceColor(member.percentage)}`}>
                              {member.percentage}%
                            </div>
                            <div className="text-xs text-muted-foreground font-medium">Attendance</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm sm:text-base lg:text-lg font-semibold text-foreground">{member.present}/{member.total}</div>
                            <div className="text-xs text-muted-foreground font-medium">Meetings</div>
                          </div>
                          <div className="text-center">
                            <Badge 
                              className={`${
                                member.lastMeeting === 'Present' ? 'bg-green-500 text-white' :
                                member.lastMeeting === 'Late' ? 'bg-yellow-500 text-white' :
                                'bg-red-500 text-white'
                              } text-xs px-2 py-1`}
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

            <TabsContent value="history" className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
              <div className="space-y-4 sm:space-y-6">
                {attendanceHistory.map((record, index) => (
                  <Card key={index} className="w-full border-border/50">
                    <CardHeader className="space-y-2 sm:space-y-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm sm:text-base lg:text-lg font-semibold break-words">{record.meeting}</CardTitle>
                          <CardDescription className="text-xs sm:text-sm font-medium">{record.date}</CardDescription>
                        </div>
                        <Badge className="bg-primary text-white w-fit text-xs px-2 sm:px-3 py-1">{record.attendance}%</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                        <div className="text-center p-3 sm:p-4 bg-primary/5 rounded-xl border border-primary/10">
                          <div className="text-lg sm:text-xl lg:text-2xl font-bold text-primary">{record.present}/{record.total}</div>
                          <div className="text-xs sm:text-sm text-primary/80 font-medium">Attendance</div>
                        </div>
                        <div className="text-center p-3 sm:p-4 bg-green-50 rounded-xl border border-green-100">
                          <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">{record.attendance}%</div>
                          <div className="text-xs sm:text-sm text-green-700 font-medium">Rate</div>
                        </div>
                        <div className="text-center p-3 sm:p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                          <div className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-600">{record.avgDuration}</div>
                          <div className="text-xs sm:text-sm text-yellow-700 font-medium">Avg Duration</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="reports" className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                <Card className="w-full border-border/50">
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg lg:text-xl font-semibold">Generate Reports</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Export attendance data and analytics</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <Button 
                      className="w-full justify-start h-10 sm:h-12" 
                      variant="outline"
                      onClick={() => handleDownloadReport('member')}
                    >
                      <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-2 sm:mr-3 shrink-0" />
                      <span className="text-xs sm:text-sm font-medium">Member Attendance Report</span>
                    </Button>
                    <Button 
                      className="w-full justify-start h-10 sm:h-12" 
                      variant="outline"
                      onClick={() => handleDownloadReport('meeting')}
                    >
                      <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-2 sm:mr-3 shrink-0" />
                      <span className="text-xs sm:text-sm font-medium">Meeting Attendance Summary</span>
                    </Button>
                    <Button 
                      className="w-full justify-start h-10 sm:h-12" 
                      variant="outline"
                      onClick={() => handleDownloadReport('detailed')}
                    >
                      <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-2 sm:mr-3 shrink-0" />
                      <span className="text-xs sm:text-sm font-medium">Detailed Analytics</span>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="w-full border-border/50">
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg lg:text-xl font-semibold">Quick Stats</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Overall attendance overview</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex justify-between items-center py-2 sm:py-3 border-b border-border/30">
                        <span className="text-xs sm:text-sm text-muted-foreground font-medium">Overall Attendance</span>
                        <span className="font-semibold text-green-600 text-sm sm:text-base lg:text-lg">87%</span>
                      </div>
                      <div className="flex justify-between items-center py-2 sm:py-3 border-b border-border/30">
                        <span className="text-xs sm:text-sm text-muted-foreground font-medium">Most Attended</span>
                        <span className="font-semibold text-right text-xs sm:text-sm">Monthly Bureau (93%)</span>
                      </div>
                      <div className="flex justify-between items-center py-2 sm:py-3 border-b border-border/30">
                        <span className="text-xs sm:text-sm text-muted-foreground font-medium">Best Attendee</span>
                        <span className="font-semibold text-right text-xs sm:text-sm">Radha Krishna Das</span>
                      </div>
                      <div className="flex justify-between items-center py-2 sm:py-3">
                        <span className="text-xs sm:text-sm text-muted-foreground font-medium">Auto-Tracked</span>
                        <span className="font-semibold text-blue-600 text-xs sm:text-sm">12 Sessions</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <MarkAttendanceDialog 
        open={showMarkAttendanceDialog} 
        onOpenChange={setShowMarkAttendanceDialog} 
      />
    </>
  );
};
