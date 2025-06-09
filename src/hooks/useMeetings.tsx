
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
  attendee_count?: number;
}

export const useMeetings = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
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
      
      // Process the data to include attendee count
      const processedMeetings = (data || []).map(meeting => ({
        ...meeting,
        attendees: meeting.meeting_attendees || [],
        attendee_count: meeting.meeting_attendees ? meeting.meeting_attendees.length : 0
      }));
      
      console.log('Fetched meetings with attendee counts:', processedMeetings);
      setMeetings(processedMeetings);
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
          // Only refetch if it's not a deletion we initiated
          if (payload.eventType === 'DELETE' && isDeleting === payload.old?.id) {
            console.log('Ignoring delete event for meeting we just deleted');
            setIsDeleting(null);
            return;
          }
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
  }, [isDeleting]);

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

            // Add attendees to meeting_attendees table
            if (meetingData.attendees && meeting) {
              await addAttendeesToMeeting(meeting.id, meetingData.attendees);
            }

            // Send email invitations with attachments
            if (meetingData.attendees && meeting) {
              await sendMeetingInvitations(meeting, meetingData.attendees, meetingData.attachments);
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

      // Add attendees to meeting_attendees table
      if (meetingData.attendees && meeting) {
        await addAttendeesToMeeting(meeting.id, meetingData.attendees);
      }

      // Send email invitations with attachments
      if (meetingData.attendees && meeting) {
        await sendMeetingInvitations(meeting, meetingData.attendees, meetingData.attachments);
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

  const sendMeetingInvitations = async (meeting: any, attendeeEmails: string, attachments?: any[]) => {
    try {
      const emails = attendeeEmails.split(',').map(email => email.trim());
      
      // Get meeting attachments from database if any were uploaded
      let meetingAttachments = [];
      if (attachments && attachments.length > 0) {
        const { data: dbAttachments } = await supabase
          .from('meeting_attachments')
          .select('*')
          .eq('meeting_id', meeting.id);
        
        meetingAttachments = dbAttachments || [];
      }

      // Format meeting time
      const startTime = new Date(meeting.start_time);
      const endTime = new Date(meeting.end_time);
      const meetingDate = startTime.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const timeRange = `${startTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })} - ${endTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })}`;

      // Create email body
      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb; margin-bottom: 20px;">Meeting Invitation</h2>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 15px 0; color: #1e293b;">${meeting.title}</h3>
            
            <div style="margin-bottom: 10px;">
              <strong>📅 Date:</strong> ${meetingDate}
            </div>
            
            <div style="margin-bottom: 10px;">
              <strong>🕒 Time:</strong> ${timeRange}
            </div>
            
            <div style="margin-bottom: 10px;">
              <strong>📍 Location:</strong> ${meeting.location || 'TBD'}
            </div>
            
            ${meeting.teams_join_url ? `
              <div style="margin-bottom: 10px;">
                <strong>💻 Join Online:</strong> 
                <a href="${meeting.teams_join_url}" style="color: #2563eb;">Click to join Teams meeting</a>
              </div>
            ` : ''}
            
            ${meeting.description ? `
              <div style="margin-top: 15px;">
                <strong>📋 Description:</strong>
                <p style="margin: 5px 0 0 0; color: #64748b;">${meeting.description}</p>
              </div>
            ` : ''}
          </div>
          
          ${meetingAttachments.length > 0 ? `
            <div style="margin-bottom: 20px;">
              <strong>📎 Attachments:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                ${meetingAttachments.map(att => `<li>${att.name}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          
          <p style="color: #64748b; font-size: 14px;">
            Please mark your calendar and let us know if you cannot attend.
          </p>
          
          <hr style="border: none; height: 1px; background-color: #e2e8f0; margin: 20px 0;">
          
          <p style="color: #94a3b8; font-size: 12px;">
            This invitation was sent automatically by the meeting management system.
          </p>
        </div>
      `;

      // Send email with attachments
      const { data, error } = await supabase.functions.invoke('send-outlook-email', {
        body: {
          subject: `Meeting Invitation: ${meeting.title}`,
          body: emailBody,
          recipients: emails,
          attachments: meetingAttachments,
          meetingId: meeting.id
        }
      });

      if (error) {
        console.error('Error sending invitations:', error);
        toast({
          title: "Invitation Email Failed",
          description: "Meeting created but email invitations could not be sent",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Invitations Sent",
          description: `Meeting invitations sent to ${emails.length} attendee(s)${meetingAttachments.length > 0 ? ` with ${meetingAttachments.length} attachment(s)` : ''}`,
        });
      }
    } catch (error) {
      console.error('Error sending meeting invitations:', error);
    }
  };

  const addAttendeesToMeeting = async (meetingId: string, attendeeEmails: string) => {
    try {
      const emails = attendeeEmails.split(',').map(email => email.trim());
      
      // For each email, try to find the user and add them as attendee
      for (const email of emails) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email)
          .maybeSingle();

        if (profile) {
          await supabase
            .from('meeting_attendees')
            .insert({
              meeting_id: meetingId,
              user_id: profile.id,
              status: 'pending'
            });
        }
      }
    } catch (error) {
      console.error('Error adding attendees:', error);
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
      setIsDeleting(meetingId);
      
      const meeting = meetings.find(m => m.id === meetingId);
      if (!meeting) {
        toast({
          title: "Meeting Not Found",
          description: "The meeting you're trying to delete was not found",
          variant: "destructive"
        });
        setIsDeleting(null);
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
        setIsDeleting(null);
        return;
      }

      // Optimistically remove from UI immediately
      setMeetings(prev => prev.filter(m => m.id !== meetingId));

      // Delete from Microsoft services first (if applicable)
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
              const teamsResponse = await fetch(`https://graph.microsoft.com/v1.0/me/onlineMeetings/${meeting.teams_meeting_id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${profile.microsoft_access_token}`,
                }
              });
              
              if (!teamsResponse.ok) {
                console.error('Failed to delete Teams meeting:', teamsResponse.status, teamsResponse.statusText);
              }
            }

            // Delete Outlook calendar event
            if (meeting.outlook_event_id) {
              console.log('Deleting Outlook event:', meeting.outlook_event_id);
              const outlookResponse = await fetch(`https://graph.microsoft.com/v1.0/me/events/${meeting.outlook_event_id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${profile.microsoft_access_token}`,
                }
              });
              
              if (!outlookResponse.ok) {
                console.error('Failed to delete Outlook event:', outlookResponse.status, outlookResponse.statusText);
              }
            }
          } catch (microsoftError) {
            console.error('Error deleting from Microsoft services:', microsoftError);
            // Continue with database deletion even if Microsoft deletion fails
          }
        }
      }

      // Delete related records in proper order to avoid foreign key constraints
      console.log('Deleting related records...');
      
      const deleteOperations = [
        supabase.from('meeting_attachments').delete().eq('meeting_id', meetingId),
        supabase.from('attendance_records').delete().eq('meeting_id', meetingId),
        supabase.from('meeting_attendees').delete().eq('meeting_id', meetingId),
        supabase.from('meeting_transcripts').delete().eq('meeting_id', meetingId)
      ];

      // Execute all delete operations in parallel
      await Promise.allSettled(deleteOperations);

      // Finally delete the main meeting record
      console.log('Deleting main meeting record...');
      const { error: meetingError } = await supabase
        .from('meetings')
        .delete()
        .eq('id', meetingId)
        .eq('created_by', user.id); // Double check ownership

      if (meetingError) {
        console.error('Failed to delete meeting from database:', meetingError);
        // Restore the meeting in UI since database deletion failed
        setMeetings(prev => [...prev, meeting].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()));
        setIsDeleting(null);
        throw new Error(`Database deletion failed: ${meetingError.message}`);
      }

      console.log('Meeting successfully deleted from database');

      toast({
        title: "Success",
        description: "Meeting deleted successfully"
      });

      // Clear the deletion flag after a short delay
      setTimeout(() => {
        setIsDeleting(null);
      }, 1000);

    } catch (error: any) {
      console.error('Error deleting meeting:', error);
      setIsDeleting(null);
      
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
