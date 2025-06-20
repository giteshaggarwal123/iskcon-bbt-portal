
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useMicrosoftAuth } from './useMicrosoftAuth';

interface MeetingTranscript {
  id: string;
  meeting_id: string;
  transcript_content?: string;
  summary?: string;
  action_items?: any;
  participants?: any;
  teams_transcript_id?: string;
  created_at: string;
  updated_at: string;
}

export const useTranscripts = () => {
  const [transcripts, setTranscripts] = useState<MeetingTranscript[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { accessToken, isConnected, checkAndRefreshToken } = useMicrosoftAuth();
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

  const fetchTranscriptForMeeting = async (meetingId: string) => {
    try {
      console.log(`Fetching saved transcript for meeting: ${meetingId}`);
      const { data, error } = await supabase
        .from('meeting_transcripts')
        .select('*')
        .eq('meeting_id', meetingId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching transcript:', error);
        throw error;
      }
      
      console.log('Saved transcript found:', !!data, 'Has content:', !!data?.transcript_content);
      return data;
    } catch (error: any) {
      if (error.code === 'PGRST116') {
        // No transcript found, this is expected
        console.log('No saved transcript found for meeting:', meetingId);
        return null;
      }
      console.error('Error fetching transcript:', error);
      return null;
    }
  };

  const fetchTeamsTranscript = async (meetingId: string, teamsId: string) => {
    if (!user) {
      console.error('No authenticated user found');
      throw new Error('No authenticated user found');
    }

    if (!isConnected || !accessToken) {
      console.error('Microsoft account not connected or no access token');
      throw new Error('Microsoft account not connected. Please connect your Microsoft account in Settings.');
    }

    try {
      console.log(`Fetching Teams transcript for meeting: ${teamsId}`);
      console.log('Using access token:', accessToken ? 'Present' : 'Missing');

      // Ensure we have a fresh token
      await checkAndRefreshToken();

      // Call edge function to fetch Teams data with enhanced retry logic
      let lastError = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`Attempt ${attempt} to fetch Teams transcript`);
          
          const { data, error } = await supabase.functions.invoke('fetch-teams-transcript', {
            body: {
              meetingId: teamsId,
              accessToken: accessToken
            }
          });

          if (error) {
            console.error(`Attempt ${attempt} failed:`, error);
            lastError = error;
            
            // If it's an auth error, try to refresh the token
            if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
              console.log('Token may be expired, attempting refresh...');
              try {
                await checkAndRefreshToken();
                console.log('Token refreshed, retrying...');
                // Continue to next attempt with refreshed token
                continue;
              } catch (refreshErr) {
                console.error('Token refresh failed:', refreshErr);
                throw new Error('Microsoft authentication expired. Please reconnect your Microsoft account in Settings.');
              }
            }
            
            if (attempt === 3) throw error;
            
            // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
            continue;
          }

          console.log('Teams transcript response received:', {
            hasTranscript: !!data?.transcript,
            transcriptCount: data?.transcript?.value?.length || 0,
            hasContent: data?.hasContent,
            contentLength: data?.transcriptContent?.length || 0,
            hasAttendees: !!data?.attendees,
            attendeesCount: data?.attendees?.value?.[0]?.attendanceRecords?.length || 0,
            hasError: !!data?.error
          });

          // The edge function now returns 200 status even for errors, so check the data
          if (data?.error) {
            // This is an expected error (like PreconditionFailed), not a system error
            throw new Error(data.error);
          }

          // Validate that we got meaningful data
          if (!data || (!data.transcript && !data.transcriptContent)) {
            console.warn('No transcript data received from Teams API');
            if (attempt < 3) {
              await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
              continue;
            }
          }

          return data;
        } catch (err: any) {
          console.error(`Attempt ${attempt} error:`, err);
          lastError = err;
          
          if (attempt === 3) throw err;
          
          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
        }
      }

      throw lastError;
    } catch (error: any) {
      console.error('Error fetching Teams transcript:', error);
      
      let errorMessage = 'Failed to fetch Teams transcript';
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        errorMessage = 'Microsoft authentication expired. Please reconnect your Microsoft account in Settings.';
      } else if (error.message?.includes('404') || error.message?.includes('Not Found')) {
        errorMessage = 'Meeting transcript not found in Teams. Ensure the meeting was recorded and transcription was enabled.';
      } else if (error.message?.includes('403')) {
        errorMessage = 'Access denied. Please ensure you have permission to access this meeting\'s transcript.';
      } else if (error.message?.includes('Transcript not supported')) {
        errorMessage = 'This meeting type does not support automatic transcript extraction. It was likely created as an instant meeting rather than a scheduled calendar event.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  };

  const saveTranscript = async (
    meetingId: string,
    transcriptData: {
      content?: string;
      summary?: string;
      actionItems?: any[];
      participants?: any[];
      teamsTranscriptId?: string;
    }
  ) => {
    try {
      console.log(`Saving transcript for meeting: ${meetingId}`);
      console.log('Transcript data length:', transcriptData.content?.length || 0);
      
      const { data, error } = await supabase
        .from('meeting_transcripts')
        .upsert({
          meeting_id: meetingId,
          transcript_content: transcriptData.content,
          summary: transcriptData.summary,
          action_items: transcriptData.actionItems,
          participants: transcriptData.participants,
          teams_transcript_id: transcriptData.teamsTranscriptId
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving transcript:', error);
        throw error;
      }

      console.log('Transcript saved successfully:', data.id);
      return data;
    } catch (error: any) {
      console.error('Error saving transcript:', error);
      throw new Error('Failed to save transcript to database');
    }
  };

  const saveTranscriptToDocuments = async (transcript: MeetingTranscript, meetingTitle: string, meetingEndTime?: string) => {
    if (!user) return false;

    try {
      const meetingTranscriptsFolderId = await getMeetingTranscriptsFolderId();
      
      // Format the date for the filename
      const meetingDate = meetingEndTime 
        ? new Date(meetingEndTime).toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }).replace(/\//g, '-')
        : new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }).replace(/\//g, '-');
      
      const fileName = `${meetingTitle}_${meetingDate}_transcript.txt`;
      
      const transcriptText = `
Meeting: ${meetingTitle}
Date: ${meetingEndTime ? new Date(meetingEndTime).toLocaleDateString() : new Date().toLocaleDateString()}
Time: ${meetingEndTime ? new Date(meetingEndTime).toLocaleTimeString() : new Date().toLocaleTimeString()}

TRANSCRIPT:
${transcript.transcript_content || 'No transcript content available'}

PARTICIPANTS:
${transcript.participants?.map((p: any) => `- ${p.identity?.displayName || p.identity?.user?.displayName || p.emailAddress || 'Unknown'}`).join('\n') || 'No participants listed'}

SUMMARY:
${transcript.summary || 'No summary available'}

ACTION ITEMS:
${transcript.action_items?.map((item: any, index: number) => `${index + 1}. ${item.text || item}`).join('\n') || 'No action items'}
      `.trim();
      
      const { error } = await supabase
        .from('documents')
        .insert({
          name: fileName,
          file_path: `transcripts/${transcript.meeting_id}/${fileName}`,
          folder_id: meetingTranscriptsFolderId,
          uploaded_by: user.id,
          mime_type: 'text/plain',
          file_size: transcriptText.length
        });

      if (error) throw error;

      return true;
    } catch (error: any) {
      console.error('Error saving transcript to documents:', error);
      throw new Error('Failed to save transcript to documents');
    }
  };

  return {
    transcripts,
    loading,
    fetchTranscriptForMeeting,
    fetchTeamsTranscript,
    saveTranscript,
    saveTranscriptToDocuments
  };
};
