
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

  const saveTranscriptToDocuments = async (transcript: MeetingTranscript, meetingTitle: string, meetingEndTime?: string) => {
    if (!user) return;

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

      toast({
        title: "Success",
        description: "Transcript saved to ISKCON Repository > Meeting Transcripts folder"
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
