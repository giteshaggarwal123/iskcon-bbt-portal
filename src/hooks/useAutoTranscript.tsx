
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useMicrosoftAuth } from './useMicrosoftAuth';

export const useAutoTranscript = () => {
  const { user } = useAuth();
  const { accessToken, isConnected } = useMicrosoftAuth();
  const { toast } = useToast();

  const getMeetingTranscriptsFolderId = async () => {
    try {
      // Find the "Meeting Transcripts" folder inside "ISKCON Repository"
      const { data: folders, error } = await supabase
        .from('folders')
        .select('id, name, parent_folder_id')
        .in('name', ['ISKCON Repository', 'Meeting Transcripts']);

      if (error) throw error;

      const iskconRepo = folders?.find(f => f.name === 'ISKCON Repository' && f.parent_folder_id === null);
      const meetingTranscriptsFolder = folders?.find(f => f.name === 'Meeting Transcripts' && f.parent_folder_id === iskconRepo?.id);

      return meetingTranscriptsFolder?.id || null;
    } catch (error) {
      console.error('Error finding Meeting Transcripts folder:', error);
      return null;
    }
  };

  const processExpiredMeetings = async () => {
    if (!user || !isConnected || !accessToken) return;

    try {
      // Find meetings that ended in the last 2 hours and have Teams meeting IDs
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const now = new Date().toISOString();

      const { data: meetings, error } = await supabase
        .from('meetings')
        .select(`
          id,
          title,
          teams_meeting_id,
          end_time,
          meeting_transcripts(id)
        `)
        .not('teams_meeting_id', 'is', null)
        .gte('end_time', twoHoursAgo)
        .lte('end_time', now);

      if (error) {
        console.error('Error fetching meetings:', error);
        return;
      }

      // Process meetings that don't have transcripts yet
      const meetingsToProcess = meetings?.filter(meeting => 
        !meeting.meeting_transcripts || meeting.meeting_transcripts.length === 0
      ) || [];

      console.log(`Found ${meetingsToProcess.length} meetings to process for transcripts`);

      for (const meeting of meetingsToProcess) {
        await processMeetingTranscript(meeting);
        // Add delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } catch (error) {
      console.error('Error processing expired meetings:', error);
    }
  };

  const processMeetingTranscript = async (meeting: any) => {
    try {
      console.log(`Processing transcript for meeting: ${meeting.title}`);

      // Fetch transcript from Teams
      const { data: transcriptData, error } = await supabase.functions.invoke('fetch-teams-transcript', {
        body: {
          meetingId: meeting.teams_meeting_id,
          accessToken: accessToken
        }
      });

      if (error) {
        console.error(`Error fetching transcript for meeting ${meeting.id}:`, error);
        return;
      }

      if (!transcriptData || !transcriptData.hasContent) {
        console.log(`No transcript content available yet for meeting: ${meeting.title}`);
        return;
      }

      // Process and save the transcript
      const processedTranscript = {
        transcript_content: transcriptData.transcriptContent || '',
        summary: 'AI-generated summary will be available soon',
        action_items: [],
        participants: transcriptData.attendees?.value?.[0]?.attendanceRecords || [],
        teams_transcript_id: transcriptData.transcript?.value?.[0]?.id
      };

      // Save transcript to database
      const { data: savedTranscript, error: saveError } = await supabase
        .from('meeting_transcripts')
        .upsert({
          meeting_id: meeting.id,
          ...processedTranscript
        })
        .select()
        .single();

      if (saveError) {
        console.error(`Error saving transcript for meeting ${meeting.id}:`, saveError);
        return;
      }

      console.log(`Successfully saved transcript for meeting: ${meeting.title}`);

      // Auto-save to documents repository in Meeting Transcripts folder
      try {
        const meetingTranscriptsFolderId = await getMeetingTranscriptsFolderId();
        const meetingDate = new Date(meeting.end_time).toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).replace(/\//g, '-');
        
        const fileName = `${meeting.title}_${meetingDate}_transcript.txt`;
        
        const transcriptText = `
Meeting: ${meeting.title}
Date: ${new Date(meeting.end_time).toLocaleDateString()}
Time: ${new Date(meeting.end_time).toLocaleTimeString()}

TRANSCRIPT:
${processedTranscript.transcript_content}

PARTICIPANTS:
${processedTranscript.participants?.map((p: any) => `- ${p.identity?.displayName || p.identity?.user?.displayName || 'Unknown'}`).join('\n') || 'No participants listed'}

SUMMARY:
${processedTranscript.summary}
        `.trim();

        await supabase
          .from('documents')
          .insert({
            name: fileName,
            file_path: `transcripts/${meeting.id}/${fileName}`,
            folder_id: meetingTranscriptsFolderId,
            uploaded_by: user.id,
            mime_type: 'text/plain',
            file_size: transcriptText.length
          });

        console.log(`Transcript saved to Meeting Transcripts folder for meeting: ${meeting.title}`);

      } catch (docError) {
        console.error('Error saving transcript to documents:', docError);
      }

      // Show success notification
      toast({
        title: "Transcript Auto-Saved",
        description: `Meeting transcript for "${meeting.title}" has been automatically saved to ISKCON Repository > Meeting Transcripts.`
      });

    } catch (error) {
      console.error(`Error processing transcript for meeting ${meeting.id}:`, error);
    }
  };

  // Set up automatic checking every 30 minutes
  useEffect(() => {
    if (!user || !isConnected) return;

    // Initial check
    processExpiredMeetings();

    // Set up interval to check every 30 minutes
    const interval = setInterval(processExpiredMeetings, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, isConnected, accessToken]);

  return {
    processExpiredMeetings,
    processMeetingTranscript
  };
};
