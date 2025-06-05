
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Poll {
  id: string;
  title: string;
  description: string | null;
  deadline: string;
  status: 'active' | 'completed' | 'cancelled';
  is_secret: boolean;
  notify_members: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  sub_polls?: SubPoll[];
  attachments?: PollAttachment[];
  stats?: PollStats;
}

export interface SubPoll {
  id: string;
  poll_id: string;
  title: string;
  description: string | null;
  order_index: number;
  created_at: string;
}

export interface PollAttachment {
  id: string;
  poll_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by: string;
  created_at: string;
}

export interface PollStats {
  total_voters: number;
  voted_count: number;
  pending_count: number;
  sub_poll_count: number;
}

export interface CreatePollData {
  title: string;
  description: string;
  deadline: string;
  notify_members: boolean;
  subPolls: Array<{ title: string; description: string }>;
  attachment?: File;
}

export const usePolls = () => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchPolls = async () => {
    try {
      setLoading(true);
      
      // Fetch polls with sub_polls and attachments
      const { data: pollsData, error } = await supabase
        .from('polls')
        .select(`
          *,
          sub_polls (*),
          poll_attachments (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get stats for each poll and transform the data to match our interface
      const pollsWithStats = await Promise.all(
        pollsData.map(async (poll) => {
          const { data: stats } = await supabase.rpc('get_poll_stats', {
            poll_id_param: poll.id
          });
          
          return {
            id: poll.id,
            title: poll.title,
            description: poll.description,
            deadline: poll.deadline,
            status: poll.status as 'active' | 'completed' | 'cancelled',
            is_secret: poll.is_secret,
            notify_members: poll.notify_members,
            created_by: poll.created_by,
            created_at: poll.created_at,
            updated_at: poll.updated_at,
            sub_polls: poll.sub_polls || [],
            attachments: poll.poll_attachments || [],
            stats: stats?.[0] || { total_voters: 0, voted_count: 0, pending_count: 0, sub_poll_count: 0 }
          } as Poll;
        })
      );

      setPolls(pollsWithStats);
    } catch (error) {
      console.error('Error fetching polls:', error);
      toast.error('Failed to fetch polls');
    } finally {
      setLoading(false);
    }
  };

  const createPoll = async (pollData: CreatePollData) => {
    if (!user) {
      toast.error('You must be logged in to create a poll');
      return null;
    }

    try {
      // Create the main poll
      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .insert({
          title: pollData.title,
          description: pollData.description,
          deadline: pollData.deadline,
          notify_members: pollData.notify_members,
          created_by: user.id
        })
        .select()
        .single();

      if (pollError) throw pollError;

      // Create sub-polls
      const subPollsToInsert = pollData.subPolls
        .filter(sp => sp.title.trim())
        .map((subPoll, index) => ({
          poll_id: poll.id,
          title: subPoll.title,
          description: subPoll.description,
          order_index: index
        }));

      if (subPollsToInsert.length > 0) {
        const { error: subPollError } = await supabase
          .from('sub_polls')
          .insert(subPollsToInsert);

        if (subPollError) throw subPollError;
      }

      // Handle file upload if attachment exists
      if (pollData.attachment) {
        await uploadPollAttachment(poll.id, pollData.attachment);
      }

      // Send notifications if enabled
      if (pollData.notify_members) {
        await sendPollNotifications(poll.id);
      }

      toast.success('Poll created successfully');
      await fetchPolls(); // Refresh the polls list
      return poll;
    } catch (error) {
      console.error('Error creating poll:', error);
      toast.error('Failed to create poll');
      return null;
    }
  };

  const uploadPollAttachment = async (pollId: string, file: File) => {
    if (!user) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${pollId}/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('poll-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Save attachment record to database
      const { error: dbError } = await supabase
        .from('poll_attachments')
        .insert({
          poll_id: pollId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: user.id
        });

      if (dbError) throw dbError;

      return filePath;
    } catch (error) {
      console.error('Error uploading attachment:', error);
      toast.error('Failed to upload attachment');
      return null;
    }
  };

  const sendPollNotifications = async (pollId: string) => {
    try {
      // Call edge function to send notifications
      const { error } = await supabase.functions.invoke('send-poll-notifications', {
        body: { pollId, notificationType: 'initial' }
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending notifications:', error);
      // Don't toast error for notifications as poll creation was successful
    }
  };

  const deletePoll = async (pollId: string) => {
    try {
      const { error } = await supabase
        .from('polls')
        .delete()
        .eq('id', pollId);

      if (error) throw error;

      toast.success('Poll deleted successfully');
      await fetchPolls();
    } catch (error) {
      console.error('Error deleting poll:', error);
      toast.error('Failed to delete poll');
    }
  };

  const updatePollStatus = async (pollId: string, status: 'active' | 'completed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('polls')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', pollId);

      if (error) throw error;

      toast.success(`Poll ${status === 'completed' ? 'completed' : status} successfully`);
      await fetchPolls();
    } catch (error) {
      console.error('Error updating poll status:', error);
      toast.error('Failed to update poll status');
    }
  };

  const downloadAttachment = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('poll-attachments')
        .download(filePath);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading attachment:', error);
      toast.error('Failed to download attachment');
    }
  };

  useEffect(() => {
    fetchPolls();
  }, []);

  return {
    polls,
    loading,
    createPoll,
    deletePoll,
    updatePollStatus,
    downloadAttachment,
    refetch: fetchPolls
  };
};
