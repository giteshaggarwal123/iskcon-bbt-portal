
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Users, Search, RefreshCw, Copy, Edit, Trash2, ExternalLink, Clock, UserPlus, Eye, FileText, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useMeetings, Meeting } from '@/hooks/useMeetings';
import { useDeepLinking } from '@/hooks/useDeepLinking';
import { RSVPSelector } from '@/components/RSVPSelector';

export const MeetingsModule: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { meetings, loading, fetchMeetings, createMeeting, updateMeeting, deleteMeeting } = useMeetings();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false)
  const [editMeeting, setEditMeeting] = useState<Meeting | null>(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [attendees, setAttendees] = useState('0');
  const [teamsMeetingUrl, setTeamsMeetingUrl] = useState('');
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [rsvpDialogOpen, setRsvpDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const { openTeamsLink } = useDeepLinking();

  useEffect(() => {
    if (editMeeting) {
      setTitle(editMeeting.title);
      setDate(editMeeting.date);
      setTime(editMeeting.time);
      setLocation(editMeeting.location || '');
      setDescription(editMeeting.description || '');
      setAttendees(String(editMeeting.attendee_count || 0));
      setTeamsMeetingUrl(editMeeting.teams_meeting_url || '');
    } else {
      setTitle('');
      setDate('');
      setTime('');
      setLocation('');
      setDescription('');
      setAttendees('0');
      setTeamsMeetingUrl('');
    }
  }, [editMeeting]);

  const filteredMeetings = meetings.filter(meeting =>
    meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (meeting.location && meeting.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (meeting.description && meeting.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const now = new Date();
  const upcomingMeetings = filteredMeetings.filter(meeting => new Date(meeting.start_time) > now);
  const pastMeetings = filteredMeetings.filter(meeting => new Date(meeting.start_time) <= now);

  const handleCreateMeeting = async () => {
    try {
      await createMeeting({
        title,
        date: new Date(date),
        time,
        duration: '60 minutes',
        type: 'online',
        location,
        description,
        attendees: '',
        rsvpEnabled: true
      });
      setOpen(false);
      toast({
        title: "Meeting Created",
        description: "Your meeting has been created successfully",
      });
    } catch (error: any) {
      console.error('Error creating meeting:', error);
      toast({
        title: "Failed to Create Meeting",
        description: error.message || "Failed to create meeting",
        variant: "destructive"
      });
    }
  };

  const handleUpdateMeeting = async () => {
    if (!editMeeting) return;
    try {
      await updateMeeting(editMeeting.id, {
        title,
        date,
        time,
        location,
        description,
        attendees: parseInt(attendees) || 0,
        teams_meeting_url: teamsMeetingUrl
      });
      setEditMeeting(null);
      setOpen(false);
      toast({
        title: "Meeting Updated",
        description: "Your meeting has been updated successfully",
      });
    } catch (error: any) {
      console.error('Error updating meeting:', error);
      toast({
        title: "Failed to Update Meeting",
        description: error.message || "Failed to update meeting",
        variant: "destructive"
      });
    }
  };

  const handleDeleteMeeting = async (id: string) => {
    try {
      await deleteMeeting(id);
      toast({
        title: "Meeting Deleted",
        description: "Your meeting has been deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting meeting:', error);
      toast({
        title: "Failed to Delete Meeting",
        description: error.message || "Failed to delete meeting",
        variant: "destructive"
      });
    }
  };

  const handleJoinMeeting = (meeting: Meeting) => {
    if (meeting.teams_meeting_url) {
      openTeamsLink(meeting.teams_meeting_url);
    } else {
      toast({
        title: "No Meeting Link",
        description: "This meeting doesn't have a Teams link available.",
        variant: "destructive"
      });
    }
  };

  const handleCopyTeamsLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copied",
      description: "Teams meeting link copied to clipboard",
    });
  };

  const handleOpenRSVP = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setRsvpDialogOpen(true);
  };

  const handleViewReport = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setReportDialogOpen(true);
  };

  const formatMeetingDateTime = (meeting: Meeting) => {
    const startTime = new Date(meeting.start_time);
    const dateStr = startTime.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const timeStr = startTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    return { dateStr, timeStr };
  };

  const getDuration = (meeting: Meeting) => {
    const start = new Date(meeting.start_time);
    const end = new Date(meeting.end_time);
    const diffInMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    const hours = Math.floor(diffInMinutes / 60);
    const minutes = diffInMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`;
    }
    return `${minutes}m`;
  };

  const MeetingCard = ({ meeting }: { meeting: Meeting }) => {
    const { dateStr, timeStr } = formatMeetingDateTime(meeting);
    const duration = getDuration(meeting);
    const isUpcoming = new Date(meeting.start_time) > now;

    return (
      <div className="space-y-4">
        <Card className="w-full hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{meeting.title}</h3>
                  {meeting.teams_meeting_url && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      Teams
                    </Badge>
                  )}
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    scheduled
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{dateStr} at {timeStr}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>({duration})</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
                  <Users className="h-4 w-4" />
                  <span>{meeting.attendee_count || 0} expected attendees</span>
                </div>

                {meeting.description && (
                  <p className="text-sm text-gray-600 mb-3">{meeting.description}</p>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenRSVP(meeting)}
                  className="text-purple-600 border-purple-600 hover:bg-purple-50"
                >
                  RSVP
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewReport(meeting)}
                  className="text-gray-600 border-gray-600 hover:bg-gray-50"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Report
                </Button>
              </div>
              
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditMeeting(meeting);
                    setOpen(true);
                  }}
                  className="text-gray-600 hover:bg-gray-100"
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteMeeting(meeting.id)}
                  className="text-red-600 hover:bg-red-100"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RSVP Section */}
        <RSVPSelector 
          meeting={meeting} 
          onResponseUpdate={fetchMeetings}
          onViewReport={handleViewReport}
          onViewRSVP={handleOpenRSVP}
        />

        {/* Teams Meeting Link Section */}
        {meeting.teams_meeting_url && (
          <Card className="w-full">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Teams Meeting Link Available
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyTeamsLink(meeting.teams_meeting_url)}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openTeamsLink(meeting.teams_meeting_url)}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Open
                  </Button>
                </div>
              </div>
              <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600 break-all">
                {meeting.teams_meeting_url}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons Section */}
        <Card className="w-full">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              {isUpcoming && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleJoinMeeting(meeting)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Join Meeting
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
              >
                <FileText className="h-3 w-3 mr-1" />
                View Details
              </Button>
              <Button
                variant="outline"
                size="sm"
              >
                <FileText className="h-3 w-3 mr-1" />
                Transcript
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenRSVP(meeting)}
              >
                <Users className="h-3 w-3 mr-1" />
                View RSVP
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteMeeting(meeting.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900">Meeting Management</h1>
        <p className="text-sm text-gray-600">Schedule, track, and manage all ISKCON meetings with Teams integration</p>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search meetings"
              className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchMeetings}
            disabled={loading}
            className="flex items-center gap-2 border-gray-300 hover:bg-gray-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-red-500 hover:bg-red-600">
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Meeting
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editMeeting ? 'Edit Meeting' : 'Schedule Meeting'}</DialogTitle>
                <DialogDescription>
                  {editMeeting ? 'Update meeting details.' : 'Create a new meeting.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Title
                  </Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">
                    Date
                  </Label>
                  <Input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="time" className="text-right">
                    Time
                  </Label>
                  <Input type="time" id="time" value={time} onChange={(e) => setTime(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="location" className="text-right">
                    Location
                  </Label>
                  <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="attendees" className="text-right">
                    Attendees
                  </Label>
                  <Input
                    type="number"
                    id="attendees"
                    value={attendees}
                    onChange={(e) => setAttendees(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="teams_meeting_url" className="text-right">
                    Teams Meeting URL
                  </Label>
                  <Input
                    id="teams_meeting_url"
                    value={teamsMeetingUrl}
                    onChange={(e) => setTeamsMeetingUrl(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="description" className="text-right mt-2">
                    Description
                  </Label>
                  <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" onClick={editMeeting ? handleUpdateMeeting : handleCreateMeeting}>
                  {editMeeting ? 'Update Meeting' : 'Create Meeting'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming">Upcoming ({upcomingMeetings.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({pastMeetings.length})</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming" className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="text-sm text-gray-500">Loading meetings...</p>
              </div>
            </div>
          ) : upcomingMeetings.length > 0 ? (
            <div className="space-y-6">
              {upcomingMeetings.map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-8 w-8 text-gray-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-gray-900">No upcoming meetings</h3>
                  <p className="text-sm text-gray-500 max-w-sm">
                    Schedule a meeting to get started.
                  </p>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="past" className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="text-sm text-gray-500">Loading meetings...</p>
              </div>
            </div>
          ) : pastMeetings.length > 0 ? (
            <div className="space-y-6">
              {pastMeetings.map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-8 w-8 text-gray-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-gray-900">No past meetings</h3>
                  <p className="text-sm text-gray-500 max-w-sm">
                    Past meetings will appear here.
                  </p>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="calendar" className="mt-6">
          <div className="text-center py-16">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <Calendar className="h-8 w-8 text-gray-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-gray-900">Calendar View</h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  Calendar view will be implemented soon.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* RSVP Dialog */}
      <Dialog open={rsvpDialogOpen} onOpenChange={setRsvpDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>RSVP Details</DialogTitle>
            <DialogDescription>
              View and manage RSVP responses for this meeting.
            </DialogDescription>
          </DialogHeader>
          {selectedMeeting && (
            <RSVPSelector 
              meeting={selectedMeeting} 
              onResponseUpdate={() => {
                fetchMeetings();
                setRsvpDialogOpen(false);
              }}
              onViewReport={handleViewReport}
              onViewRSVP={handleOpenRSVP}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Meeting Report</DialogTitle>
            <DialogDescription>
              View detailed report for this meeting.
            </DialogDescription>
          </DialogHeader>
          {selectedMeeting && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold">Meeting Title</h4>
                  <p className="text-sm text-gray-600">{selectedMeeting.title}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Status</h4>
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    {selectedMeeting.status || 'scheduled'}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-semibold">Expected Attendees</h4>
                  <p className="text-sm text-gray-600">{selectedMeeting.attendee_count || 0}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Duration</h4>
                  <p className="text-sm text-gray-600">{getDuration(selectedMeeting)}</p>
                </div>
              </div>
              {selectedMeeting.description && (
                <div>
                  <h4 className="font-semibold">Description</h4>
                  <p className="text-sm text-gray-600">{selectedMeeting.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
