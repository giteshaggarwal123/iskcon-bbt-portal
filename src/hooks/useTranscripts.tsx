
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface MeetingTranscript {
  id: string;
  meeting_id: string;
  transcript_content?: string;
  summary?: string;
  action_items?: any[];
  participants?: any[];
  teams_transcript_id?: string;
  created_at: string;
  updated_at: string;
}

export const useTranscripts = () => {
  const [transcripts, setTranscripts] = useState<MeetingTranscript[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTranscriptForMeeting = async (meetingId: string) => {
    try {
      const { data, error } = await supabase
        .from('meeting_transcripts')
        .select('*')
        .eq('meeting_id', meetingId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching transcript:', error);
      return null;
    }
  };

  const fetchTeamsTranscript = async (meetingId: string, teamsId: string) => {
    if (!user) return null;

    try {
      console.log('Fetching Teams transcript for meeting:', meetingId, 'Teams ID:', teamsId);
      
      // Get user's Microsoft access token
      const { data: profile } = await supabase
        .from('profiles')
        .select('microsoft_access_token')
        .eq('id', user.id)
        .single();

      if (!profile?.microsoft_access_token) {
        toast({
          title: "Microsoft Account Required",
          description: "Please connect your Microsoft account to fetch transcripts",
          variant: "destructive"
        });
        return null;
      }

      console.log('Calling fetch-teams-transcript edge function...');
      
      // Call edge function to fetch Teams data
      const { data, error } = await supabase.functions.invoke('fetch-teams-transcript', {
        body: {
          meetingId: teamsId,
          accessToken: profile.microsoft_access_token
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      console.log('Teams transcript data received:', data);
      return data;
    } catch (error: any) {
      console.error('Error fetching Teams transcript:', error);
      toast({
        title: "Error",
        description: `Failed to fetch Teams transcript: ${error.message}`,
        variant: "destructive"
      });
      return null;
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
      console.log('Saving transcript for meeting:', meetingId, transcriptData);
      
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

      if (error) throw error;

      console.log('Transcript saved successfully:', data);

      toast({
        title: "Success",
        description: "Meeting transcript saved successfully"
      });

      return data;
    } catch (error: any) {
      console.error('Error saving transcript:', error);
      toast({
        title: "Error",
        description: `Failed to save transcript: ${error.message}`,
        variant: "destructive"
      });
      return null;
    }
  };

  const saveTranscriptToDocuments = async (transcript: MeetingTranscript, meetingTitle: string) => {
    if (!user) return;

    try {
      console.log('Saving transcript to documents for meeting:', meetingTitle);
      
      // Create a document entry for the transcript
      const fileName = `${meetingTitle}_transcript_${new Date().toISOString().split('T')[0]}.txt`;
      
      const transcriptText = `
Meeting: ${meetingTitle}
Date: ${new Date().toLocaleDateString()}

SUMMARY:
${transcript.summary || 'No summary available'}

PARTICIPANTS:
${transcript.participants?.map((p: any) => `- ${p.identity?.displayName || p.identity?.user?.displayName || p.emailAddress || 'Unknown'}`).join('\n') || 'No participants listed'}

TRANSCRIPT:
${transcript.transcript_content || 'No transcript content available'}

ACTION ITEMS:
${transcript.action_items?.map((item: any, index: number) => `${index + 1}. ${item.text || item}`).join('\n') || 'No action items'}
      `.trim();

      const { error } = await supabase
        .from('documents')
        .insert({
          name: fileName,
          file_path: `transcripts/${transcript.meeting_id}/${fileName}`,
          folder: 'Meeting Transcripts',
          uploaded_by: user.id,
          mime_type: 'text/plain',
          file_size: transcriptText.length
        });

      if (error) throw error;

      console.log('Transcript saved to documents successfully');

      toast({
        title: "Success",
        description: "Transcript saved to documents folder"
      });

      return true;
    } catch (error: any) {
      console.error('Error saving transcript to documents:', error);
      toast({
        title: "Error",
        description: `Failed to save transcript to documents: ${error.message}`,
        variant: "destructive"
      });
      return false;
    }
  };

  const autoSaveTranscript = async (meetingId: string, teamsId: string, meetingTitle: string) => {
    if (!user) return false;

    setLoading(true);
    try {
      console.log('Auto-saving transcript for meeting:', meetingTitle);
      
      // First check if we already have a transcript
      const existingTranscript = await fetchTranscriptForMeeting(meetingId);
      if (existingTranscript && existingTranscript.transcript_content) {
        console.log('Transcript already exists, saving to documents...');
        await saveTranscriptToDocuments(existingTranscript, meetingTitle);
        return true;
      }

      // Fetch from Teams
      const teamsData = await fetchTeamsTranscript(meetingId, teamsId);
      
      if (teamsData && teamsData.hasContent) {
        // Process and save the transcript
        const processedTranscript = {
          content: teamsData.transcriptContent || '',
          summary: 'AI-generated summary will be available soon',
          actionItems: [],
          participants: teamsData.attendees?.value?.[0]?.attendanceRecords || [],
          teamsTranscriptId: teamsData.transcript?.value?.[0]?.id
        };

        const saved = await saveTranscript(meetingId, processedTranscript);
        if (saved) {
          await saveTranscriptToDocuments(saved, meetingTitle);
          return true;
        }
      } else {
        toast({
          title: "No Transcript Available",
          description: "Transcript may not be ready yet. Please try again in a few minutes.",
          variant: "destructive"
        });
      }

      return false;
    } catch (error: any) {
      console.error('Error in auto-save transcript:', error);
      toast({
        title: "Error",
        description: `Failed to auto-save transcript: ${error.message}`,
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    transcripts,
    loading,
    fetchTranscriptForMeeting,
    fetchTeamsTranscript,
    saveTranscript,
    saveTranscriptToDocuments,
    autoSaveTranscript
  };
};
