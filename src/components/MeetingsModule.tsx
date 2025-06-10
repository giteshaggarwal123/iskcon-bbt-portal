import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, MapPin, Video, FileText, Plus, Filter, Search, ExternalLink, Trash2, UserPlus, Settings, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScheduleMeetingDialog } from './ScheduleMeetingDialog';
import { RSVPResponseDialog } from './RSVPResponseDialog';
import { ViewAgendaDialog } from './ViewAgendaDialog';
import { MeetingTranscriptDialog } from './MeetingTranscriptDialog';
import { ManageAttendeesDialog } from './ManageAttendeesDialog';
import { MeetingSettingsDialog } from './MeetingSettingsDialog';
import { MarkAttendanceDialog } from './MarkAttendanceDialog';
import { AttendanceReportDialog } from './AttendanceReportDialog';
import { MeetingDeletionProgress } from './MeetingDeletionProgress';
import { useMeetings } from '@/hooks/useMeetings';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export const MeetingsModule = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const [showRSVPDialog, setShowRSVPDialog] = useState(false);
  const [showAgendaDialog, setShowAgendaDialog] = useState(false);
  const [showTranscriptDialog, setShowTranscriptDialog] = useState(false);
  const [showAttendeesDialog, setShowAttendeesDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showAttendanceDialog, setShowAttendanceDialog] = useState(false);
  const [showAttendanceReportDialog, setShowAttendanceReportDialog] = useState(false);

  const { meetings, loading, createMeeting, deleteMeeting, fetchMeetings, getDeletionProgress, isDeletingMeeting } = useMeetings();
  const { isSuperAdmin, isAdmin, canScheduleMeetings, canDeleteMeetings } = useUserRole();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleJoinMeeting = (meeting: any) => {
    if (!meeting.teams_join_url) {
      toast({
        title: "No Join URL",
        description: "This meeting doesn't have a Teams join URL",
        variant: "destructive"
      });
      return;
    }

    const now = new Date();
    const startTime = new Date(meeting.start_time);
    const endTime = new Date(meeting.end_time);
    const timeDiff = startTime.getTime() - now.getTime();
    const minutesUntilStart = Math.floor(timeDiff / (1000 * 60));

    // Super admins and admins can join anytime
    if (isSuperAdmin || isAdmin) {
      console.log('Admin/Super admin joining meeting:', meeting.title);
      window.open(meeting.teams_join_url, '_blank');
      return;
    }

    // Regular users can join 15 minutes before start time
    if (minutesUntilStart > 15) {
      toast({
        title: "Too Early",
        description: `You can join this meeting ${minutesUntilStart - 15} minutes before it starts (${format(new Date(startTime.getTime() - 15 * 60000), 'HH:mm')})`,
        variant: "destructive"
      });
      return;
    }

    // Check if meeting has ended (for regular users)
    if (now > endTime) {
      toast({
        title: "Meeting Ended",
        description: "This meeting has already ended",
        variant: "destructive"
      });
      return;
    }

    console.log('User joining meeting:', meeting.title);
    window.open(meeting.teams_join_url, '_blank');
  };

  const filteredMeetings = meetings.filter(meeting => {
    const matchesSearch = meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         meeting.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         meeting.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === 'all') return matchesSearch;
    if (filterType === 'upcoming') {
      const now = new Date();
      return matchesSearch && new Date(meeting.start_time) > now;
    }
    if (filterType === 'past') {
      const now = new Date();
      return matchesSearch && new Date(meeting.end_time) < now;
    }
    if (filterType === 'online') return matchesSearch && meeting.meeting_type === 'online';
    if (filterType === 'in-person') return matchesSearch && meeting.meeting_type === 'in-person';
    
    return matchesSearch;
  });

  const upcomingMeetings = filteredMeetings.filter(meeting => {
    const now = new Date();
    return new Date(meeting.start_time) > now;
  });

  const pastMeetings = filteredMeetings.filter(meeting => {
    const now = new Date();
    return new Date(meeting.end_time) < now;
  });

  const formatMeetingTime = (meeting: any) => {
    const start = new Date(meeting.start_time);
    const end = new Date(meeting.end_time);
    const startStr = format(start, 'MMM dd, yyyy • HH:mm');
    const endStr = format(end, 'HH:mm');
    return `${startStr} - ${endStr}`;
  };

  const getMeetingStatus = (meeting: any) => {
    const now = new Date();
    const startTime = new Date(meeting.start_time);
    const endTime = new Date(meeting.end_time);

    if (now < startTime) return 'upcoming';
    if (now >= startTime && now <= endTime) return 'ongoing';
    return 'completed';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Badge variant="outline" className="text-blue-600 border-blue-200">Upcoming</Badge>;
      case 'ongoing':
        return <Badge variant="default" className="bg-green-500">Live</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      default:
        return <Badge variant="outline">Scheduled</Badge>;
    }
  };

  const canJoinMeeting = (meeting: any) => {
    const now = new Date();
    const startTime = new Date(meeting.start_time);
    const endTime = new Date(meeting.end_time);
    
    // Super admins and admins can join anytime
    if (isSuperAdmin || isAdmin) return true;
    
    // Regular users can join 15 minutes before start and until end time
    const timeDiff = startTime.getTime() - now.getTime();
    const minutesUntilStart = Math.floor(timeDiff / (1000 * 60));
    
    return minutesUntilStart <= 15 && now <= endTime;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
          <p className="text-gray-600">Schedule and manage your meetings</p>
        </div>
        
        {canScheduleMeetings && (
          <Button onClick={() => setShowScheduleDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Schedule Meeting
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search meetings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter meetings" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Meetings</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="past">Past</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="in-person">In-Person</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Upcoming Meetings */}
      {upcomingMeetings.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Meetings</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingMeetings.map((meeting) => (
              <Card key={meeting.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg leading-tight">{meeting.title}</CardTitle>
                    {getStatusBadge(getMeetingStatus(meeting))}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>{formatMeetingTime(meeting)}</span>
                    </div>
                    
                    {meeting.location && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4" />
                        <span>{meeting.location}</span>
                      </div>
                    )}
                    
                    {meeting.meeting_type === 'online' && (
                      <div className="flex items-center space-x-2">
                        <Video className="h-4 w-4" />
                        <span>Online Meeting</span>
                      </div>
                    )}
                    
                    {meeting.attendee_count > 0 && (
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>{meeting.attendee_count} attendee(s)</span>
                      </div>
                    )}
                  </div>

                  {meeting.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{meeting.description}</p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {meeting.teams_join_url && canJoinMeeting(meeting) && (
                      <Button 
                        size="sm" 
                        onClick={() => handleJoinMeeting(meeting)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Join
                      </Button>
                    )}
                    
                    {meeting.teams_join_url && !canJoinMeeting(meeting) && !isSuperAdmin && !isAdmin && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        disabled
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        Too Early
                      </Button>
                    )}

                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        setSelectedMeeting(meeting);
                        setShowRSVPDialog(true);
                      }}
                    >
                      RSVP
                    </Button>

                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        setSelectedMeeting(meeting);
                        setShowTranscriptDialog(true);
                      }}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Notes
                    </Button>

                    {(isSuperAdmin || isAdmin) && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            setSelectedMeeting(meeting);
                            setShowAttendeesDialog(true);
                          }}
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Manage
                        </Button>

                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            setSelectedMeeting(meeting);
                            setShowAttendanceDialog(true);
                          }}
                        >
                          <Users className="h-4 w-4 mr-1" />
                          Attendance
                        </Button>
                      </>
                    )}

                    {canDeleteMeetings && meeting.created_by === user?.id && (
                      <>
                        {isDeletingMeeting(meeting.id) ? (
                          <MeetingDeletionProgress 
                            progress={getDeletionProgress(meeting.id)}
                            meetingTitle={meeting.title}
                          />
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => deleteMeeting(meeting.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Past Meetings */}
      {pastMeetings.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Past Meetings</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pastMeetings.map((meeting) => (
              <Card key={meeting.id} className="hover:shadow-lg transition-shadow opacity-90">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg leading-tight">{meeting.title}</CardTitle>
                    {getStatusBadge(getMeetingStatus(meeting))}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>{formatMeetingTime(meeting)}</span>
                    </div>
                    
                    {meeting.location && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4" />
                        <span>{meeting.location}</span>
                      </div>
                    )}
                    
                    {meeting.meeting_type === 'online' && (
                      <div className="flex items-center space-x-2">
                        <Video className="h-4 w-4" />
                        <span>Online Meeting</span>
                      </div>
                    )}
                    
                    {meeting.attendee_count > 0 && (
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>{meeting.attendee_count} attendee(s)</span>
                      </div>
                    )}
                  </div>

                  {meeting.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{meeting.description}</p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        setSelectedMeeting(meeting);
                        setShowTranscriptDialog(true);
                      }}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Notes
                    </Button>

                    {(isSuperAdmin || isAdmin) && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          setSelectedMeeting(meeting);
                          setShowAttendanceReportDialog(true);
                        }}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Report
                      </Button>
                    )}

                    {canDeleteMeetings && meeting.created_by === user?.id && (
                      <>
                        {isDeletingMeeting(meeting.id) ? (
                          <MeetingDeletionProgress 
                            progress={getDeletionProgress(meeting.id)}
                            meetingTitle={meeting.title}
                          />
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => deleteMeeting(meeting.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {filteredMeetings.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No meetings found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? 'Try adjusting your search terms.' : 'Get started by scheduling your first meeting.'}
          </p>
          {canScheduleMeetings && !searchTerm && (
            <Button onClick={() => setShowScheduleDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Meeting
            </Button>
          )}
        </div>
      )}

      {/* Dialogs */}
      <ScheduleMeetingDialog 
        open={showScheduleDialog} 
        onOpenChange={setShowScheduleDialog}
        onMeetingCreated={(meeting) => {
          console.log('Meeting created:', meeting);
          fetchMeetings();
        }}
      />

      <RSVPResponseDialog 
        open={showRSVPDialog} 
        onOpenChange={setShowRSVPDialog}
        meeting={selectedMeeting}
      />

      <ViewAgendaDialog 
        open={showAgendaDialog} 
        onOpenChange={setShowAgendaDialog}
        meeting={selectedMeeting}
      />

      <MeetingTranscriptDialog 
        open={showTranscriptDialog} 
        onOpenChange={setShowTranscriptDialog}
        meeting={selectedMeeting}
      />

      <ManageAttendeesDialog 
        open={showAttendeesDialog} 
        onOpenChange={setShowAttendeesDialog}
        meeting={selectedMeeting}
      />

      <MeetingSettingsDialog 
        open={showSettingsDialog} 
        onOpenChange={setShowSettingsDialog}
        meeting={selectedMeeting}
      />

      <MarkAttendanceDialog 
        open={showAttendanceDialog} 
        onOpenChange={setShowAttendanceDialog}
        meeting={selectedMeeting}
      />

      <AttendanceReportDialog 
        open={showAttendanceReportDialog} 
        onOpenChange={setShowAttendanceReportDialog}
        meeting={selectedMeeting}
      />
    </div>
  );
};
