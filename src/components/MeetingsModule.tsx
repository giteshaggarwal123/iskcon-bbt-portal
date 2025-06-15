
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Users, Search, RefreshCw, Copy, Edit, Trash2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  const { openTeamsLink } = useDeepLinking();

  useEffect(() => {
    if (editMeeting) {
      setTitle(editMeeting.title);
      setDate(editMeeting.date);
      setTime(editMeeting.time);
      setLocation(editMeeting.location || '');
      setDescription(editMeeting.description || '');
      setAttendees(String(editMeeting.attendee_count || 0));
      setTeamsMeetingUrl(editMeeting.teams_join_url || '');
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
    if (meeting.teams_join_url) {
      openTeamsLink(meeting.teams_join_url);
    } else {
      toast({
        title: "No Meeting Link",
        description: "This meeting doesn't have a Teams link available.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900">Meetings</h1>
        <p className="text-sm text-gray-600">Manage your meetings and events</p>
      </div>

      {/* Search and Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
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
            <Button>
              <Calendar className="mr-2 h-4 w-4" />
              Add Meeting
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editMeeting ? 'Edit Meeting' : 'Create Meeting'}</DialogTitle>
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

      {/* Meeting List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="text-sm text-gray-500">Loading meetings...</p>
            </div>
          </div>
        ) : filteredMeetings.length > 0 ? (
          <Table>
            <TableCaption>A list of your meetings.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMeetings.map((meeting) => (
                <TableRow key={meeting.id}>
                  <TableCell>{meeting.title}</TableCell>
                  <TableCell>{meeting.date}</TableCell>
                  <TableCell>{meeting.time}</TableCell>
                  <TableCell>{meeting.location}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleJoinMeeting(meeting)}
                        className="text-blue-600 hover:bg-blue-100"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Join Now
                      </Button>
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-16">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-gray-900">No meetings scheduled</h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  Schedule a meeting to get started.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
