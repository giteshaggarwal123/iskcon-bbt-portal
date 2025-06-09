
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, Users, UserCheck, FileText, MapPin, Plus } from 'lucide-react';
import { AttendanceReportDialog } from './AttendanceReportDialog';
import { MarkAttendanceDialog } from './MarkAttendanceDialog';
import { useMeetings } from '@/hooks/useMeetings';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, compareAsc, compareDesc } from 'date-fns';

export const AttendanceModule: React.FC = () => {
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showMarkAttendanceDialog, setShowMarkAttendanceDialog] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  
  const { meetings, loading } = useMeetings();
  const userRole = useUserRole();
  const { toast } = useToast();

  // Filter meetings
  const now = new Date();
  const upcomingMeetings = meetings.filter(meeting => {
    const startTime = parseISO(meeting.start_time);
    return startTime >= now;
  }).sort((a, b) => compareAsc(parseISO(a.start_time), parseISO(b.start_time)));

  const pastMeetings = meetings.filter(meeting => {
    const startTime = parseISO(meeting.start_time);
    return startTime < now;
  }).sort((a, b) => compareDesc(parseISO(a.start_time), parseISO(b.start_time)));

  const handleViewReport = (meeting: any) => {
    if (!userRole.canViewReports) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to view attendance reports",
        variant: "destructive"
      });
      return;
    }
    setSelectedMeeting(meeting);
    setShowReportDialog(true);
  };

  const handleMarkAttendance = (meeting: any) => {
    setSelectedMeeting(meeting);
    setShowMarkAttendanceDialog(true);
  };

  const formatMeetingTime = (startTime: string, endTime: string) => {
    const start = parseISO(startTime);
    const end = parseISO(endTime);
    return {
      date: format(start, 'MMM dd, yyyy'),
      time: format(start, 'h:mm a'),
      duration: `${Math.round((end.getTime() - start.getTime()) / (1000 * 60))}m`
    };
  };

  const isLiveMeeting = (meeting: any) => {
    const now = new Date();
    const start = parseISO(meeting.start_time);
    const end = parseISO(meeting.end_time);
    return now >= start && now <= end;
  };

  const canMarkAttendance = (meeting: any) => {
    const now = new Date();
    const start = parseISO(meeting.start_time);
    const hourBeforeStart = new Date(start.getTime() - 60 * 60 * 1000);
    const hourAfterStart = new Date(start.getTime() + 60 * 60 * 1000);
    return now >= hourBeforeStart && now <= hourAfterStart;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">
              Attendance Tracking
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Track attendance for meetings and events
            </p>
          </div>
        </div>

        <Tabs defaultValue="upcoming" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 h-auto">
            <TabsTrigger value="upcoming" className="text-xs sm:text-sm">
              Upcoming ({upcomingMeetings.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="text-xs sm:text-sm">
              Past ({pastMeetings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4 sm:space-y-6">
            {upcomingMeetings.length === 0 ? (
              <Card>
                <CardContent className="p-6 sm:p-8 text-center">
                  <Calendar className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No upcoming meetings</p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-2">
                    Schedule a meeting to start tracking attendance
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:gap-6">
                {upcomingMeetings.map((meeting) => {
                  const timeInfo = formatMeetingTime(meeting.start_time, meeting.end_time);
                  const isLive = isLiveMeeting(meeting);
                  const canMark = canMarkAttendance(meeting);

                  return (
                    <Card key={meeting.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg sm:text-xl flex flex-wrap items-center gap-2">
                              <span className="break-words">{meeting.title}</span>
                              {isLive && (
                                <Badge className="bg-red-500 text-white text-xs">Live</Badge>
                              )}
                            </CardTitle>
                            {meeting.description && (
                              <CardDescription className="mt-2 text-sm">
                                {meeting.description}
                              </CardDescription>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            <span className="text-sm truncate">{timeInfo.date}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            <span className="text-sm truncate">
                              {timeInfo.time} ({timeInfo.duration})
                            </span>
                          </div>
                          {meeting.location && (
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
                              <span className="text-sm truncate">{meeting.location}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {canMark && (
                            <Button 
                              onClick={() => handleMarkAttendance(meeting)}
                              className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm"
                            >
                              <UserCheck className="h-4 w-4 mr-2" />
                              Mark Attendance
                            </Button>
                          )}
                          
                          {userRole.canViewReports && (
                            <Button 
                              variant="outline" 
                              onClick={() => handleViewReport(meeting)}
                              className="text-xs sm:text-sm"
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              View Report
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

          <TabsContent value="past" className="space-y-4 sm:space-y-6">
            {pastMeetings.length === 0 ? (
              <Card>
                <CardContent className="p-6 sm:p-8 text-center">
                  <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No past meetings</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:gap-6">
                {pastMeetings.map((meeting) => {
                  const timeInfo = formatMeetingTime(meeting.start_time, meeting.end_time);

                  return (
                    <Card key={meeting.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg sm:text-xl break-words">
                              {meeting.title}
                            </CardTitle>
                            <CardDescription className="mt-2 text-sm">
                              Completed on {timeInfo.date}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {userRole.canViewReports && (
                          <Button 
                            variant="outline" 
                            onClick={() => handleViewReport(meeting)}
                            className="text-xs sm:text-sm"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            View Report
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <AttendanceReportDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        meeting={selectedMeeting}
      />
      
      <MarkAttendanceDialog
        open={showMarkAttendanceDialog}
        onOpenChange={setShowMarkAttendanceDialog}
        memberOnly={userRole.canMarkAttendanceOnly}
      />
    </div>
  );
};
