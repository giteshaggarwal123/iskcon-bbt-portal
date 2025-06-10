
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

      // Call edge function to fetch Teams data
      const { data, error } = await supabase.functions.invoke('fetch-teams-transcript', {
        body: {
          meetingId: teamsId,
          accessToken: profile.microsoft_access_token
        }
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching Teams transcript:', error);
      toast({
        title: "Error",
        description: "Failed to fetch Teams transcript",
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

      toast({
        title: "Success",
        description: "Meeting transcript saved successfully"
      });

      return data;
    } catch (error: any) {
      console.error('Error saving transcript:', error);
      toast({
        title: "Error",
        description: "Failed to save transcript",
        variant: "destructive"
      });
      return null;
    }
  };

  const saveTranscriptToDocuments = async (transcript: MeetingTranscript, meetingTitle: string) => {
    if (!user) return;

    try {
      // Create a document entry for the transcript
      const fileName = `${meetingTitle}_transcript_${new Date().toISOString().split('T')[0]}.txt`;
      
      const { error } = await supabase
        .from('documents')
        .insert({
          name: fileName,
          file_path: `transcripts/${transcript.meeting_id}/${fileName}`,
          folder: 'Meeting Transcripts',
          uploaded_by: user.id,
          mime_type: 'text/plain',
          file_size: transcript.transcript_content?.length || 0
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Transcript saved to documents folder"
      });

      return true;
    } catch (error: any) {
      console.error('Error saving transcript to documents:', error);
      toast({
        title: "Error",
        description: "Failed to save transcript to documents",
        variant: "destructive"
      });
      return false;
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
