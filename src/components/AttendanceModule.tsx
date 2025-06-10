
import React, { useState } from 'react';
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
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { RSVPSelector } from './RSVPSelector';

export const AttendanceModule: React.FC = () => {
  const [showMarkDialog, setShowMarkDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showReportsDialog, setShowReportsDialog] = useState(false);
  const [showRSVPDialog, setShowRSVPDialog] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);

  const { meetings, loading: meetingsLoading } = useMeetings();
  const { attendanceRecords, loading: attendanceLoading, markAttendance } = useAttendance();
  const userRole = useUserRole();
  const { toast } = useToast();

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
    // This would normally check against actual attendance data
    // For now, returning mock status
    return 'not_marked'; // 'present', 'absent', 'not_marked'
  };

  const handleRSVPUpdate = () => {
    // This could trigger a refresh of meeting data if needed
    console.log('RSVP updated');
  };

  if (meetingsLoading || attendanceLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 lg:px-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
            <p className="text-gray-600 mt-1">Track and manage meeting attendance with detailed analytics</p>
          </div>
          <Button 
            onClick={() => setShowReportsDialog(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            View Reports
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">0</div>
              <p className="text-xs text-gray-500">Meetings Attended</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Attendance Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">0%</div>
              <p className="text-xs text-gray-500">Overall Rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">0</div>
              <p className="text-xs text-gray-500">Check-ins Required</p>
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
                <Card key={meeting.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {meeting.title}
                        </h3>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            {format(parseISO(meeting.start_time), 'MMM dd, yyyy')} at{' '}
                            {format(parseISO(meeting.start_time), 'h:mm a')}
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2" />
                            {meeting.attendees?.length || 0} expected attendees
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {canMarkAttendance(meeting) && (
                          <Button
                            onClick={() => handleMarkAttendance(meeting)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            Mark Attendance
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          onClick={() => handleViewRSVP(meeting)}
                        >
                          <CheckSquare className="h-4 w-4 mr-2" />
                          View RSVP
                        </Button>

                        {userRole.canViewReports && (
                          <Button
                            variant="outline"
                            onClick={() => handleViewReport(meeting)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Report
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Add RSVP Selector */}
                    <div className="mt-4">
                      <RSVPSelector 
                        meeting={meeting} 
                        onResponseUpdate={handleRSVPUpdate}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">No upcoming meetings</p>
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
                  <Card key={meeting.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {meeting.title}
                          </h3>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2" />
                              {format(parseISO(meeting.start_time), 'MMM dd, yyyy')} at{' '}
                              {format(parseISO(meeting.start_time), 'h:mm a')}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <Badge 
                            variant={
                              status === 'present' ? 'default' : 
                              status === 'absent' ? 'destructive' : 
                              'secondary'
                            }
                            className="flex items-center"
                          >
                            {status === 'present' && <CheckCircle className="h-3 w-3 mr-1" />}
                            {status === 'absent' && <XCircle className="h-3 w-3 mr-1" />}
                            {status === 'not_marked' && <Clock className="h-3 w-3 mr-1" />}
                            {status === 'present' ? 'Present' : 
                             status === 'absent' ? 'Absent' : 
                             'Not Marked'}
                          </Badge>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewRSVP(meeting)}
                          >
                            <CheckSquare className="h-4 w-4 mr-2" />
                            RSVP
                          </Button>

                          {userRole.canViewReports && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewReport(meeting)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Report
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadReport(meeting)}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Add RSVP Selector for past meetings too */}
                      <div className="mt-4">
                        <RSVPSelector 
                          meeting={meeting} 
                          onResponseUpdate={handleRSVPUpdate}
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
                  <p className="text-gray-600">No meeting history available</p>
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
