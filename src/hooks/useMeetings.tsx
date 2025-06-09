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
  teams_meeting_id: string | null;
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

  // Set up realtime subscription for auto-refresh
  useEffect(() => {
    fetchMeetings();

    const meetingsChannel = supabase
      .channel('meetings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meetings'
        },
        (payload) => {
          console.log('Meetings table changed:', payload);
          fetchMeetings();
        }
      )
      .subscribe();

    const attendeesChannel = supabase
      .channel('meeting-attendees-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meeting_attendees'
        },
        (payload) => {
          console.log('Meeting attendees changed:', payload);
          fetchMeetings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(meetingsChannel);
      supabase.removeChannel(attendeesChannel);
    };
  }, []);

  const createMeeting = async (meetingData: {
    title: string;
    description?: string;
    date: Date;
    time: string;
    duration: string;
    type: string;
    location: string;
    attendees?: string;
    attachments?: any[];
    rsvpEnabled?: boolean;
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

      let meeting;

      // Always try to create Teams meeting for online meetings
      if (meetingData.type === 'online') {
        // Check if user has Microsoft connection
        const { data: profile } = await supabase
          .from('profiles')
          .select('microsoft_access_token')
          .eq('id', user.id)
          .single();

        if (profile?.microsoft_access_token) {
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
            // Fall back to regular meeting creation
            toast({
              title: "Teams Meeting Creation Failed",
              description: "Creating regular meeting instead. Connect Microsoft account for Teams integration.",
              variant: "destructive"
            });
          } else {
            meeting = teamsData.meeting;
            
            toast({
              title: "Teams Meeting Created!",
              description: `"${meetingData.title}" created with Teams link and calendar event`,
            });

            // Save transcript reference for future auto-save
            if (meeting) {
              await saveTranscriptReference(meeting.id, teamsData.meetingId);
            }

            fetchMeetings();
            return meeting;
          }
        } else {
          toast({
            title: "Microsoft Account Not Connected",
            description: "Connect your Microsoft account in Settings to create Teams meetings automatically",
            variant: "destructive"
          });
        }
      }

      // Create regular meeting in database (fallback or for non-online meetings)
      const { data: meetingResult, error } = await supabase
        .from('meetings')
        .insert({
          title: meetingData.title,
          description: meetingData.description,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          location: meetingData.location,
          meeting_type: meetingData.type,
          status: 'scheduled',
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      meeting = meetingResult;

      toast({
        title: "Meeting Created",
        description: `"${meetingData.title}" has been scheduled successfully`
      });

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

  const saveTranscriptReference = async (meetingId: string, teamsMeetingId: string) => {
    try {
      await supabase
        .from('meeting_transcripts')
        .insert({
          meeting_id: meetingId,
          teams_transcript_id: teamsMeetingId,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error saving transcript reference:', error);
    }
  };

  const deleteMeeting = async (meetingId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to delete meetings",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Starting deletion process for meeting:', meetingId);
      
      const meeting = meetings.find(m => m.id === meetingId);
      if (!meeting) {
        toast({
          title: "Meeting Not Found",
          description: "The meeting you're trying to delete was not found",
          variant: "destructive"
        });
        return;
      }

      console.log('Found meeting to delete:', meeting);

      // Check if user has permission to delete this meeting
      if (meeting.created_by !== user.id) {
        toast({
          title: "Permission Denied",
          description: "You can only delete meetings you created",
          variant: "destructive"
        });
        return;
      }

      // Optimistically remove from UI
      setMeetings(prev => prev.filter(m => m.id !== meetingId));

      // First delete from database - this is the most critical part
      console.log('Deleting meeting from database first...');
      
      // Delete related records first to avoid foreign key constraints
      console.log('Deleting related records...');
      
      // Use individual queries with proper error handling
      try {
        await supabase.from('meeting_attachments').delete().eq('meeting_id', meetingId);
        await supabase.from('attendance_records').delete().eq('meeting_id', meetingId);
        await supabase.from('meeting_attendees').delete().eq('meeting_id', meetingId);
        await supabase.from('meeting_transcripts').delete().eq('meeting_id', meetingId);
      } catch (relatedError) {
        console.error('Error deleting related records:', relatedError);
        // Continue with main meeting deletion even if related records fail
      }

      // Now delete the main meeting record
      const { error: meetingError } = await supabase
        .from('meetings')
        .delete()
        .eq('id', meetingId)
        .eq('created_by', user.id); // Double check ownership

      if (meetingError) {
        console.error('Failed to delete meeting from database:', meetingError);
        // Restore the meeting in UI since database deletion failed
        setMeetings(prev => [...prev, meeting].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()));
        throw new Error(`Database deletion failed: ${meetingError.message}`);
      }

      console.log('Meeting successfully deleted from database');

      // Now try to delete from Microsoft services (but don't fail if this doesn't work)
      if (meeting.teams_meeting_id || meeting.outlook_event_id) {
        console.log('Attempting to delete from Microsoft services...');
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('microsoft_access_token')
          .eq('id', user.id)
          .maybeSingle();

        if (profile?.microsoft_access_token) {
          try {
            // Delete Teams meeting
            if (meeting.teams_meeting_id) {
              console.log('Deleting Teams meeting:', meeting.teams_meeting_id);
              await fetch(`https://graph.microsoft.com/v1.0/me/onlineMeetings/${meeting.teams_meeting_id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${profile.microsoft_access_token}`,
                }
              });
            }

            // Delete Outlook calendar event
            if (meeting.outlook_event_id) {
              console.log('Deleting Outlook event:', meeting.outlook_event_id);
              await fetch(`https://graph.microsoft.com/v1.0/me/events/${meeting.outlook_event_id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${profile.microsoft_access_token}`,
                }
              });
            }
          } catch (microsoftError) {
            console.error('Error deleting from Microsoft services (non-critical):', microsoftError);
            // Don't fail the whole operation if Microsoft deletion fails
          }
        }
      }

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
      
      // Force a refresh to show the current state
      fetchMeetings();
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

  const autoSaveTranscript = async (meetingId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('microsoft_access_token')
        .eq('id', user?.id)
        .single();

      if (!profile?.microsoft_access_token) return;

      const meeting = meetings.find(m => m.id === meetingId);
      if (!meeting?.teams_meeting_id) return;

      // Fetch transcript from Teams
      const { data: transcriptData, error } = await supabase.functions.invoke('fetch-teams-transcript', {
        body: {
          meetingId: meeting.teams_meeting_id,
          accessToken: profile.microsoft_access_token
        }
      });

      if (error) throw error;

      if (transcriptData?.transcript) {
        // Save transcript to meeting_transcripts table
        await supabase
          .from('meeting_transcripts')
          .upsert({
            meeting_id: meetingId,
            transcript_content: JSON.stringify(transcriptData.transcript),
            participants: transcriptData.attendees,
            teams_transcript_id: meeting.teams_meeting_id
          });

        // Save to documents repository
        const fileName = `${meeting.title}_transcript_${new Date().toISOString().split('T')[0]}.txt`;
        await supabase
          .from('documents')
          .insert({
            name: fileName,
            file_path: `transcripts/${meetingId}/${fileName}`,
            folder: 'Meeting Transcripts',
            uploaded_by: user?.id,
            mime_type: 'text/plain',
            file_size: JSON.stringify(transcriptData.transcript).length
          });

        toast({
          title: "Transcript Saved",
          description: "Meeting transcript has been automatically saved to documents"
        });
      }
    } catch (error: any) {
      console.error('Error auto-saving transcript:', error);
    }
  };

  return {
    meetings,
    loading,
    createMeeting,
    deleteMeeting,
    deletePastMeeting,
    fetchMeetings,
    autoSaveTranscript
  };
};
