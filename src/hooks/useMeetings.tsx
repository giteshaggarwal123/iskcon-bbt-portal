
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  meeting_type: string | null;
  status: string | null;
  created_by: string;
  created_at: string;
  teams_join_url: string | null;
  outlook_event_id: string | null;
  attendees?: { user_id: string; status: string }[];
}

export const useMeetings = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchMeetings = async () => {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select(`
          *,
          meeting_attendees(user_id, status)
        `)
        .order('start_time', { ascending: true });

      if (error) throw error;
      console.log('Fetched meetings:', data);
      setMeetings(data || []);
    } catch (error: any) {
      console.error('Error fetching meetings:', error);
      toast({
        title: "Error",
        description: "Failed to load meetings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createMeeting = async (meetingData: {
    title: string;
    description?: string;
    date: Date;
    time: string;
    duration: string;
    type: string;
    location: string;
    attendees?: string;
  }) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create meetings",
        variant: "destructive"
      });
      return;
    }

    try {
      // Calculate end time based on duration
      const startDateTime = new Date(`${meetingData.date.toISOString().split('T')[0]}T${meetingData.time}`);
      const durationMinutes = parseInt(meetingData.duration.replace(/\D/g, '')) * (meetingData.duration.includes('hour') ? 60 : 1);
      const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

      console.log('Creating meeting with data:', {
        title: meetingData.title,
        description: meetingData.description,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        location: meetingData.location,
        meeting_type: meetingData.type,
        created_by: user.id
      });

      // Check if user has Microsoft connection for Teams meetings
      const { data: profile } = await supabase
        .from('profiles')
        .select('microsoft_access_token')
        .eq('id', user.id)
        .single();

      let meeting;

      if (profile?.microsoft_access_token && meetingData.type === 'online') {
        // Create Teams meeting using edge function
        const { data: teamsData, error: teamsError } = await supabase.functions.invoke('create-teams-meeting', {
          body: {
            title: meetingData.title,
            description: meetingData.description,
            startTime: startDateTime.toISOString(),
            endTime: endDateTime.toISOString(),
            attendees: meetingData.attendees ? meetingData.attendees.split(',').map(email => email.trim()) : []
          }
        });

        if (teamsError) {
          console.error('Teams meeting creation failed:', teamsError);
          throw new Error('Failed to create Teams meeting: ' + teamsError.message);
        }

        meeting = teamsData.meeting;
        
        toast({
          title: "Success",
          description: `Teams meeting "${meetingData.title}" created successfully`,
        });
      } else {
        // Create regular meeting in database
        const { data: meetingResult, error } = await supabase
          .from('meetings')
          .insert({
            title: meetingData.title,
            description: meetingData.description,
            start_time: startDateTime.toISOString(),
            end_time: endDateTime.toISOString(),
            location: meetingData.location,
            meeting_type: meetingData.type,
            created_by: user.id
          })
          .select()
          .single();

        if (error) throw error;
        meeting = meetingResult;

        toast({
          title: "Success",
          description: `Meeting "${meetingData.title}" created successfully`
        });
      }

      // Add attendees if provided
      if (meetingData.attendees && meeting) {
        const emails = meetingData.attendees.split(',').map(email => email.trim());
        console.log('Meeting attendees:', emails);
        // For now, we'll just log the attendees. In production, you'd look up user IDs by email
      }

      fetchMeetings();
      return meeting;
    } catch (error: any) {
      console.error('Error creating meeting:', error);
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create meeting",
        variant: "destructive"
      });
    }
  };

  const deleteMeeting = async (meetingId: string) => {
    try {
      // Delete related attendance records first
      await supabase
        .from('attendance_records')
        .delete()
        .eq('meeting_id', meetingId);

      // Delete meeting attendees
      await supabase
        .from('meeting_attendees')
        .delete()
        .eq('meeting_id', meetingId);

      // Delete the meeting
      const { error } = await supabase
        .from('meetings')
        .delete()
        .eq('id', meetingId);

      if (error) throw error;

      // Update local state immediately
      setMeetings(prev => prev.filter(meeting => meeting.id !== meetingId));

      toast({
        title: "Success",
        description: "Meeting deleted successfully"
      });

    } catch (error: any) {
      console.error('Error deleting meeting:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete meeting",
        variant: "destructive"
      });
    }
  };

  const deletePastMeeting = async (meetingId: string) => {
    const meeting = meetings.find(m => m.id === meetingId);
    if (!meeting) return;

    const now = new Date();
    const endTime = new Date(meeting.end_time);

    if (endTime > now) {
      toast({
        title: "Cannot Delete",
        description: "Can only delete past meetings",
        variant: "destructive"
      });
      return;
    }

    await deleteMeeting(meetingId);
  };

  useEffect(() => {
    if (user) {
      fetchMeetings();
    }
  }, [user]);

  return {
    meetings,
    loading,
    createMeeting,
    deleteMeeting,
    deletePastMeeting,
    fetchMeetings
  };
};
