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
    <>
      <style>{`
        @media (max-width: 767px) {
          .attendance-container {
            padding-left: 1rem !important;
            padding-right: 1rem !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
          }
          .attendance-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 1rem !important;
          }
          .attendance-header-text h1 {
            font-size: 1.5rem !important;
            line-height: 2rem !important;
            font-weight: 600 !important;
          }
          .attendance-header-text p {
            font-size: 0.875rem !important;
            line-height: 1.25rem !important;
          }
          .attendance-stats-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          .meeting-card {
            margin-bottom: 1rem !important;
          }
          .meeting-card-content {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 1rem !important;
            padding: 1rem !important;
          }
          .meeting-card-content h3 {
            font-size: 1rem !important;
            line-height: 1.5rem !important;
            font-weight: 600 !important;
            margin-bottom: 0.5rem !important;
          }
          .meeting-info {
            width: 100% !important;
            margin-bottom: 1rem !important;
          }
          .meeting-card-actions {
            width: 100% !important;
            margin-top: 1rem !important;
          }
          .meeting-card-actions .button-group {
            display: flex !important;
            flex-direction: column !important;
            gap: 0.5rem !important;
            width: 100% !important;
          }
          .meeting-card-actions .button-row {
            display: flex !important;
            flex-direction: row !important;
            gap: 0.5rem !important;
            width: 100% !important;
          }
          .meeting-card-actions button {
            flex: 1 !important;
            min-width: 0 !important;
            font-size: 0.75rem !important;
            font-weight: 500 !important;
            padding: 0.5rem 0.75rem !important;
            height: 2rem !important;
            white-space: nowrap !important;
          }
          .meeting-card-actions .full-width-button {
            width: 100% !important;
            flex: none !important;
          }
          .rsvp-selector-mobile {
            margin-top: 1rem !important;
            padding-top: 1rem !important;
            border-top: 1px solid #e5e7eb !important;
          }
          .tabs-content-mobile {
            padding: 0 !important;
          }
          .empty-state-card {
            margin: 1rem 0 !important;
          }
          .attendance-header button {
            font-size: 0.75rem !important;
            font-weight: 500 !important;
            padding: 0.5rem 0.75rem !important;
            height: 2rem !important;
          }
          .stat-card-title {
            font-size: 0.75rem !important;
            font-weight: 500 !important;
          }
          .stat-card-value {
            font-size: 1.25rem !important;
            font-weight: 600 !important;
          }
          .stat-card-description {
            font-size: 0.625rem !important;
          }
          .attendance-badge {
            font-size: 0.75rem !important;
            padding: 0.25rem 0.5rem !important;
          }
          .meeting-meta {
            font-size: 0.75rem !important;
            line-height: 1rem !important;
          }
        }
      `}</style>
      <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 attendance-container">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center attendance-header">
            <div className="attendance-header-text">
              <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
              <p className="text-gray-600 mt-2">Track and manage meeting attendance with detailed analytics</p>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 attendance-stats-grid">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="stat-card-title text-gray-600">This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="stat-card-value text-green-600">0</div>
                <p className="stat-card-description text-gray-500">Meetings Attended</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="stat-card-title text-gray-600">Attendance Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="stat-card-value text-blue-600">0%</div>
                <p className="stat-card-description text-gray-500">Overall Rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="stat-card-title text-gray-600">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="stat-card-value text-yellow-600">0</div>
                <p className="stat-card-description text-gray-500">Check-ins Required</p>
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
            <TabsContent value="upcoming" className="space-y-4 tabs-content-mobile">
              {upcomingMeetings.length > 0 ? (
                upcomingMeetings.map((meeting) => (
                  <Card key={meeting.id} className="meeting-card">
                    <CardContent className="meeting-card-content">
                      <div className="meeting-info">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {meeting.title}
                        </h3>
                        <div className="space-y-1 text-sm text-gray-600 meeting-meta">
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

                      <div className="meeting-card-actions">
                        <div className="button-group">
                          {canMarkAttendance(meeting) && (
                            <Button
                              onClick={() => handleMarkAttendance(meeting)}
                              className="bg-green-600 hover:bg-green-700 full-width-button"
                              size="sm"
                            >
                              <UserCheck className="h-4 w-4 mr-2" />
                              Mark Attendance
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Updated RSVP Selector with new props */}
                      <div className="rsvp-selector-mobile">
                        <RSVPSelector 
                          meeting={meeting} 
                          onResponseUpdate={handleRSVPUpdate}
                          onViewReport={handleViewReport}
                          onViewRSVP={handleViewRSVP}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="empty-state-card">
                  <CardContent className="p-8 text-center">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">No upcoming meetings</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Attendance History */}
            <TabsContent value="history" className="space-y-4 tabs-content-mobile">
              {pastMeetings.length > 0 ? (
                pastMeetings.map((meeting) => {
                  const status = getMeetingAttendanceStatus(meeting);
                  return (
                    <Card key={meeting.id} className="meeting-card">
                      <CardContent className="meeting-card-content">
                        <div className="meeting-info">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {meeting.title}
                          </h3>
                          <div className="space-y-1 text-sm text-gray-600 meeting-meta">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2" />
                              {format(parseISO(meeting.start_time), 'MMM dd, yyyy')} at{' '}
                              {format(parseISO(meeting.start_time), 'h:mm a')}
                            </div>
                          </div>
                          <div className="mt-2">
                            <Badge 
                              variant={
                                status === 'present' ? 'default' : 
                                status === 'absent' ? 'destructive' : 
                                'secondary'
                              }
                              className="flex items-center w-fit attendance-badge"
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

                        <div className="meeting-card-actions">
                          <div className="button-group">
                            {userRole.canViewReports && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadReport(meeting)}
                                className="full-width-button"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download Report
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Updated RSVP Selector for past meetings */}
                        <div className="rsvp-selector-mobile">
                          <RSVPSelector 
                            meeting={meeting} 
                            onResponseUpdate={handleRSVPUpdate}
                            onViewReport={handleViewReport}
                            onViewRSVP={handleViewRSVP}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <Card className="empty-state-card">
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
    </>
  );
};
