import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserCheck, Calendar, Download, Eye, CheckCircle, XCircle, Clock, CheckSquare, BarChart3 } from 'lucide-react';
import { MarkAttendanceDialog } from './MarkAttendanceDialog';
import { AttendanceReportDialog } from './AttendanceReportDialog';  
import { AttendanceReportsDialog } from './AttendanceReportsDialog';
import { RSVPResponseDialog } from './RSVPResponseDialog';
import { useMeetings } from '@/hooks/useMeetings';
import { useAttendance } from '@/hooks/useAttendance';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { RSVPSelector } from './RSVPSelector';

export const AttendanceModule: React.FC = () => {
  console.log('AttendanceModule - Component rendering');
  
  const [showMarkDialog, setShowMarkDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showReportsDialog, setShowReportsDialog] = useState(false);
  const [showRSVPDialog, setShowRSVPDialog] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);

  const { meetings = [], loading: meetingsLoading } = useMeetings();
  const { attendanceRecords = [], loading: attendanceLoading, generateAttendanceReport } = useAttendance();
  const { user } = useAuth();
  const userRole = useUserRole();
  const { toast } = useToast();

  console.log('AttendanceModule - Data state:', {
    meetingsCount: meetings.length,
    meetingsLoading,
    attendanceLoading,
    userRole
  });

  // Calculate dynamic statistics
  const statistics = useMemo(() => {
    if (!user || meetingsLoading || attendanceLoading) {
      return {
        thisMonthAttended: 0,
        attendanceRate: 0,
        pendingCheckIns: 0
      };
    }

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // Filter meetings for this month that have ended
    const thisMonthMeetings = meetings.filter(meeting => {
      const meetingDate = parseISO(meeting.start_time);
      return meetingDate >= monthStart && meetingDate <= monthEnd && meetingDate <= now;
    });

    // Get attendance records for current user this month
    const userAttendanceThisMonth = attendanceRecords.filter(record => 
      record.user_id === user.id && 
      record.attendance_status === 'present' &&
      thisMonthMeetings.some(meeting => meeting.id === record.meeting_id)
    );

    // Calculate attendance rate
    const totalMeetingsThisMonth = thisMonthMeetings.length;
    const attendedMeetings = userAttendanceThisMonth.length;
    const attendanceRate = totalMeetingsThisMonth > 0 ? Math.round((attendedMeetings / totalMeetingsThisMonth) * 100) : 0;

    // Calculate pending check-ins (meetings that can be checked into now)
    const pendingCheckIns = meetings.filter(meeting => {
      const start = parseISO(meeting.start_time);
      const end = parseISO(meeting.end_time);
      const hourBefore = new Date(start.getTime() - 60 * 60 * 1000);
      
      // Meeting is within check-in window and user hasn't marked attendance yet
      const canCheckIn = now >= hourBefore && now <= end;
      const hasAttendance = attendanceRecords.some(record => 
        record.meeting_id === meeting.id && record.user_id === user.id
      );
      
      return canCheckIn && !hasAttendance;
    }).length;

    return {
      thisMonthAttended: attendedMeetings,
      attendanceRate,
      pendingCheckIns
    };
  }, [meetings, attendanceRecords, user, meetingsLoading, attendanceLoading]);

  // Filter meetings for attendance tracking
  const now = new Date();
  const upcomingMeetings = meetings
    .filter(meeting => new Date(meeting.start_time) > now)
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const pastMeetings = meetings
    .filter(meeting => new Date(meeting.start_time) <= now)
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

  const handleMarkAttendance = (meeting: any) => {
    setSelectedMeeting(meeting);
    setShowMarkDialog(true);
  };

  const handleViewReport = (meeting: any) => {
    setSelectedMeeting(meeting);
    setShowReportDialog(true);
  };

  const handleViewRSVP = (meeting: any) => {
    setSelectedMeeting(meeting);
    setShowRSVPDialog(true);
  };

  const handleDownloadReport = (meeting: any) => {
    // Simulate downloading attendance report
    toast({
      title: "Report Downloaded",
      description: `Attendance report for "${meeting.title}" has been downloaded.`
    });
  };

  const canMarkAttendance = (meeting: any) => {
    const start = new Date(meeting.start_time);
    const end = new Date(meeting.end_time);
    const hourBefore = new Date(start.getTime() - 60 * 60 * 1000);
    const now = new Date();
    return now >= hourBefore && now <= end;
  };

  const getMeetingAttendanceStatus = (meeting: any) => {
    if (!user) return 'not_marked';
    
    const userAttendance = attendanceRecords.find(record => 
      record.meeting_id === meeting.id && record.user_id === user.id
    );
    
    if (!userAttendance) return 'not_marked';
    
    switch (userAttendance.attendance_status) {
      case 'present':
      case 'late':
        return 'present';
      case 'absent':
        return 'absent';
      default:
        return 'not_marked';
    }
  };

  const handleRSVPUpdate = () => {
    // This could trigger a refresh of meeting data if needed
    console.log('RSVP updated');
  };

  if (meetingsLoading || attendanceLoading) {
    console.log('AttendanceModule - Still loading data');
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  console.log('AttendanceModule - Rendering main content');

  return (
    <div className="w-full max-w-7xl mx-auto px-4 lg:px-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Attendance Management</h1>
            <p className="text-muted-foreground mt-2">Track and manage meeting attendance with detailed analytics</p>
          </div>
          <Button 
            onClick={() => setShowReportsDialog(true)}
            className="bg-primary hover:bg-primary/90 shrink-0"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            View Reports
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statistics.thisMonthAttended}</div>
              <p className="text-xs text-muted-foreground">Meetings Attended</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Attendance Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{statistics.attendanceRate}%</div>
              <p className="text-xs text-muted-foreground">Overall Rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{statistics.pendingCheckIns}</div>
              <p className="text-xs text-muted-foreground">Check-ins Required</p>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Tabs */}
        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upcoming">Upcoming Meetings ({upcomingMeetings.length})</TabsTrigger>
            <TabsTrigger value="history">Attendance History ({pastMeetings.length})</TabsTrigger>
          </TabsList>

          {/* Upcoming Meetings */}
          <TabsContent value="upcoming" className="space-y-4">
            {upcomingMeetings.length > 0 ? (
              upcomingMeetings.map((meeting) => (
                <Card key={meeting.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-foreground mb-2 break-words">
                          {meeting.title}
                        </h3>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 shrink-0" />
                            <span>
                              {format(parseISO(meeting.start_time), 'MMM dd, yyyy')} at{' '}
                              {format(parseISO(meeting.start_time), 'h:mm a')}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2 shrink-0" />
                            <span>{meeting.attendees?.length || 0} expected attendees</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                        {canMarkAttendance(meeting) && (
                          <Button
                            onClick={() => handleMarkAttendance(meeting)}
                            className="bg-green-600 hover:bg-green-700"
                            size="sm"
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            Mark Attendance
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewReport(meeting)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Report
                        </Button>
                      </div>
                    </div>

                    {/* RSVP Selector */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <RSVPSelector 
                        meeting={meeting} 
                        onResponseUpdate={handleRSVPUpdate}
                        onViewRSVP={handleViewRSVP}
                        hideReportButton={true}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-muted-foreground">No upcoming meetings</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Attendance History */}
          <TabsContent value="history" className="space-y-4">
            {pastMeetings.length > 0 ? (
              pastMeetings.map((meeting) => {
                const status = getMeetingAttendanceStatus(meeting);
                return (
                  <Card key={meeting.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-foreground mb-2 break-words">
                            {meeting.title}
                          </h3>
                          <div className="space-y-2">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4 mr-2 shrink-0" />
                              <span>
                                {format(parseISO(meeting.start_time), 'MMM dd, yyyy')} at{' '}
                                {format(parseISO(meeting.start_time), 'h:mm a')}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <Badge 
                                variant={
                                  status === 'present' ? 'default' : 
                                  status === 'absent' ? 'destructive' : 
                                  'secondary'
                                }
                                className="flex items-center w-fit"
                              >
                                {status === 'present' && <CheckCircle className="h-3 w-3 mr-1" />}
                                {status === 'absent' && <XCircle className="h-3 w-3 mr-1" />}
                                {status === 'not_marked' && <Clock className="h-3 w-3 mr-1" />}
                                {status === 'present' ? 'Present' : 
                                 status === 'absent' ? 'Absent' : 
                                 'Not Marked'}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                          {userRole.canViewReports && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadReport(meeting)}
                              className="flex items-center gap-2"
                            >
                              <Download className="h-4 w-4" />
                              Download Report
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewReport(meeting)}
                            className="flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            Report
                          </Button>
                        </div>
                      </div>

                      {/* RSVP Selector for past meetings */}
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <RSVPSelector 
                          meeting={meeting} 
                          onResponseUpdate={handleRSVPUpdate}
                          onViewRSVP={handleViewRSVP}
                          hideReportButton={true}
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-muted-foreground">No meeting history available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <MarkAttendanceDialog
        open={showMarkDialog}
        onOpenChange={setShowMarkDialog}
      />

      <AttendanceReportDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        meeting={selectedMeeting}
      />

      <AttendanceReportsDialog
        open={showReportsDialog}
        onOpenChange={setShowReportsDialog}
      />

      <RSVPResponseDialog
        open={showRSVPDialog}
        onOpenChange={setShowRSVPDialog}
        meeting={selectedMeeting}
      />
    </div>
  );
};
