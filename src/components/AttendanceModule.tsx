
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Users, UserCheck, Calendar, MapPin, Plus } from 'lucide-react';
import { MarkAttendanceDialog } from './MarkAttendanceDialog';
import { AttendanceReportDialog } from './AttendanceReportDialog';
import { useMeetings } from '@/hooks/useMeetings';
import { useAttendance } from '@/hooks/useAttendance';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';

export const AttendanceModule: React.FC = () => {
  const [showMarkAttendanceDialog, setShowMarkAttendanceDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  
  const { meetings, loading } = useMeetings();
  const { fetchAttendanceForMeeting } = useAttendance();
  const userRole = useUserRole();
  const { toast } = useToast();

  // Filter meetings for attendance tracking
  const now = new Date();
  const currentMeetings = meetings.filter(meeting => {
    const startTime = parseISO(meeting.start_time);
    const endTime = parseISO(meeting.end_time);
    return startTime <= now && endTime >= now;
  });

  const recentMeetings = meetings.filter(meeting => {
    const endTime = parseISO(meeting.end_time);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    return endTime < now && endTime >= threeDaysAgo;
  });

  const handleMarkAttendance = async (meeting: any) => {
    if (userRole.canMarkAttendanceOnly && !userRole.canManageMeetings) {
      // Members can only mark their own attendance
      setSelectedMeeting(meeting);
      setShowMarkAttendanceDialog(true);
    } else if (userRole.canManageMeetings) {
      // Admins can mark attendance for others
      setSelectedMeeting(meeting);
      setShowMarkAttendanceDialog(true);
    } else {
      toast({
        title: "Access Denied",
        description: "You don't have permission to mark attendance",
        variant: "destructive"
      });
    }
  };

  const handleViewReport = async (meeting: any) => {
    if (!userRole.canViewReports && !userRole.canManageMeetings) {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 lg:px-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Attendance Tracking</h1>
            <p className="text-gray-600 mt-1">Track and manage meeting attendance</p>
          </div>
        </div>

        <Tabs defaultValue="current" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="current">
              Current Meetings ({currentMeetings.length})
            </TabsTrigger>
            <TabsTrigger value="recent">
              Recent Meetings ({recentMeetings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-6">
            {currentMeetings.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No meetings currently in progress</p>
                  <p className="text-sm text-gray-500 mt-2">Check back when a meeting starts</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {currentMeetings.map((meeting) => (
                  <Card key={meeting.id} className="hover:shadow-md transition-shadow border-l-4 border-green-500">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-xl flex items-center gap-2">
                            {meeting.title}
                            <Badge className="bg-green-500 text-white animate-pulse">
                              LIVE
                            </Badge>
                          </CardTitle>
                          <CardDescription className="mt-2">
                            {meeting.description || 'No description provided'}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            {format(parseISO(meeting.start_time), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            {format(parseISO(meeting.start_time), 'h:mm a')} - {format(parseISO(meeting.end_time), 'h:mm a')}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            {meeting.location || 'No location specified'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          onClick={() => handleMarkAttendance(meeting)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          {userRole.canMarkAttendanceOnly ? 'Mark My Attendance' : 'Mark Attendance'}
                        </Button>
                        
                        {(userRole.canViewReports || userRole.canManageMeetings) && (
                          <Button 
                            variant="outline" 
                            onClick={() => handleViewReport(meeting)}
                          >
                            <Users className="h-4 w-4 mr-2" />
                            View Report
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="recent" className="space-y-6">
            {recentMeetings.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No recent meetings</p>
                  <p className="text-sm text-gray-500 mt-2">Recent meetings will appear here for 3 days after completion</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {recentMeetings.map((meeting) => (
                  <Card key={meeting.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-xl flex items-center gap-2">
                            {meeting.title}
                            <Badge variant="secondary">Completed</Badge>
                          </CardTitle>
                          <CardDescription className="mt-2">
                            Ended {format(parseISO(meeting.end_time), 'MMM dd, yyyy h:mm a')}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {userRole.canManageMeetings && (
                          <Button 
                            variant="outline" 
                            onClick={() => handleMarkAttendance(meeting)}
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            Update Attendance
                          </Button>
                        )}
                        
                        {(userRole.canViewReports || userRole.canManageMeetings) && (
                          <Button 
                            variant="outline" 
                            onClick={() => handleViewReport(meeting)}
                          >
                            <Users className="h-4 w-4 mr-2" />
                            View Report
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <MarkAttendanceDialog 
        open={showMarkAttendanceDialog} 
        onOpenChange={setShowMarkAttendanceDialog}
        meeting={selectedMeeting}
        memberOnly={userRole.canMarkAttendanceOnly && !userRole.canManageMeetings}
      />
      
      {(userRole.canViewReports || userRole.canManageMeetings) && (
        <AttendanceReportDialog 
          open={showReportDialog} 
          onOpenChange={setShowReportDialog}
          meeting={selectedMeeting}
        />
      )}
    </div>
  );
};
