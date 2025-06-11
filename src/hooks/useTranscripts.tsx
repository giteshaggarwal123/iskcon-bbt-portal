
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

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
      
      console.log('Saved transcript found:', !!data);
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
      return null;
    }

    try {
      console.log(`Fetching Teams transcript for meeting: ${teamsId}`);
      
      // Get user's Microsoft access token
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('microsoft_access_token, microsoft_refresh_token')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        throw new Error('Failed to fetch user profile');
      }

      if (!profile?.microsoft_access_token) {
        console.error('No Microsoft access token found');
        throw new Error('Microsoft account not connected. Please connect your Microsoft account in Settings.');
      }

      console.log('Microsoft access token found, calling edge function...');

      // Call edge function to fetch Teams data with retry logic
      let lastError = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`Attempt ${attempt} to fetch Teams transcript`);
          
          const { data, error } = await supabase.functions.invoke('fetch-teams-transcript', {
            body: {
              meetingId: teamsId,
              accessToken: profile.microsoft_access_token
            }
          });

          if (error) {
            console.error(`Attempt ${attempt} failed:`, error);
            lastError = error;
            
            // If it's an auth error, try to refresh the token
            if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
              console.log('Attempting to refresh Microsoft token...');
              try {
                const { error: refreshError } = await supabase.functions.invoke('refresh-microsoft-token', {
                  body: { userId: user.id }
                });
                
                if (!refreshError) {
                  console.log('Token refreshed, retrying...');
                  continue;
                } else {
                  console.error('Token refresh failed:', refreshError);
                }
              } catch (refreshErr) {
                console.error('Token refresh error:', refreshErr);
              }
            }
            
            if (attempt === 3) throw error;
            continue;
          }

          console.log('Teams transcript data received:', {
            hasTranscript: !!data?.transcript,
            transcriptCount: data?.transcript?.value?.length || 0,
            hasContent: data?.hasContent,
            contentLength: data?.transcriptContent?.length || 0,
            hasAttendees: !!data?.attendees
          });

          return data;
        } catch (err) {
          console.error(`Attempt ${attempt} error:`, err);
          lastError = err;
          if (attempt === 3) throw err;
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
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

      console.log('Transcript saved successfully');
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
