
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
          meeting_attendees!inner(user_id, status)
        `)
        .order('start_time', { ascending: true });

      if (error) throw error;
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

      const { data: meeting, error } = await supabase
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

      // Add attendees if provided
      if (meetingData.attendees) {
        const emails = meetingData.attendees.split(',').map(email => email.trim());
        // For now, we'll just log the attendees. In production, you'd look up user IDs by email
        console.log('Meeting attendees:', emails);
      }

      toast({
        title: "Success",
        description: `Meeting "${meetingData.title}" created successfully`
      });

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
      const { error } = await supabase
        .from('meetings')
        .delete()
        .eq('id', meetingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Meeting deleted successfully"
      });

      fetchMeetings();
    } catch (error: any) {
      console.error('Error deleting meeting:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete meeting",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  return {
    meetings,
    loading,
    createMeeting,
    deleteMeeting,
    fetchMeetings
  };
};
