
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface VoteData {
  subPollId: string;
  vote: 'favor' | 'against' | 'abstain';
}

export interface SubmitVotesData {
  pollId: string;
  votes: VoteData[];
  comment?: string;
}

export const useVoting = () => {
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  const submitVotes = async (data: SubmitVotesData) => {
    if (!user) {
      toast.error('You must be logged in to vote');
      return false;
    }

    try {
      setSubmitting(true);

      // Check if user has already voted on any of these sub-polls
      const { data: existingVotes, error: checkError } = await supabase
        .from('poll_votes')
        .select('sub_poll_id')
        .eq('user_id', user.id)
        .in('sub_poll_id', data.votes.map(v => v.subPollId));

      if (checkError) throw checkError;

      if (existingVotes && existingVotes.length > 0) {
        toast.error('You have already voted on some of these questions');
        return false;
      }

      // Prepare vote records
      const voteRecords = data.votes.map(vote => ({
        poll_id: data.pollId,
        sub_poll_id: vote.subPollId,
        user_id: user.id,
        vote: vote.vote,
        comment: data.comment || null
      }));

      // Insert all votes
      const { error: insertError } = await supabase
        .from('poll_votes')
        .insert(voteRecords);

      if (insertError) throw insertError;

      // Send notification emails to all members
      try {
        const { error: notificationError } = await supabase.functions.invoke('send-poll-notifications', {
          body: { 
            pollId: data.pollId, 
            notificationType: 'vote_cast',
            voterName: user.email
          }
        });

        if (notificationError) {
          console.error('Error sending vote notifications:', notificationError);
          // Don't fail the vote submission if notifications fail
        }
      } catch (notifError) {
        console.error('Failed to send vote notifications:', notifError);
      }

      toast.success('Your votes have been submitted successfully');
      return true;
    } catch (error) {
      console.error('Error submitting votes:', error);
      toast.error('Failed to submit votes');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const getUserVotes = async (pollId: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('poll_votes')
        .select('*')
        .eq('poll_id', pollId)
        .eq('user_id', user.id);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user votes:', error);
      return null;
    }
  };

  const checkVotingEligibility = async (pollId: string) => {
    console.log('Checking voting eligibility for poll:', pollId, 'user:', user?.id);
    
    if (!user) {
      console.log('No user found');
      return { canVote: false, reason: 'Not logged in' };
    }

    try {
      // Check if poll is active
      const { data: poll, error } = await supabase
        .from('polls')
        .select('status, deadline')
        .eq('id', pollId)
        .single();

      if (error) {
        console.error('Error fetching poll:', error);
        throw error;
      }

      console.log('Poll data:', poll);

      if (poll.status !== 'active') {
        return { canVote: false, reason: 'Poll is not active' };
      }

      if (new Date(poll.deadline) < new Date()) {
        return { canVote: false, reason: 'Poll deadline has passed' };
      }

      // Check if user has already voted
      const { data: existingVotes, error: voteError } = await supabase
        .from('poll_votes')
        .select('id')
        .eq('poll_id', pollId)
        .eq('user_id', user.id)
        .limit(1);

      if (voteError) {
        console.error('Error checking existing votes:', voteError);
        throw voteError;
      }

      console.log('Existing votes:', existingVotes);

      if (existingVotes && existingVotes.length > 0) {
        return { canVote: false, reason: 'You have already voted on this poll' };
      }

      console.log('User can vote');
      return { canVote: true, reason: null };
    } catch (error) {
      console.error('Error checking voting eligibility:', error);
      return { canVote: false, reason: 'Error checking eligibility' };
    }
  };

  const getPollResults = async (pollId: string) => {
    try {
      const { data: results, error } = await supabase
        .from('poll_votes')
        .select(`
          vote,
          sub_poll_id,
          sub_polls!inner(title, order_index)
        `)
        .eq('poll_id', pollId);

      if (error) throw error;

      // Group votes by sub-poll and vote type
      const resultsBySubPoll = results.reduce((acc: any, vote: any) => {
        const subPollId = vote.sub_poll_id;
        if (!acc[subPollId]) {
          acc[subPollId] = {
            title: vote.sub_polls.title,
            order_index: vote.sub_polls.order_index,
            favor: 0,
            against: 0,
            abstain: 0,
            total: 0
          };
        }
        acc[subPollId][vote.vote]++;
        acc[subPollId].total++;
        return acc;
      }, {});

      return Object.values(resultsBySubPoll).sort((a: any, b: any) => a.order_index - b.order_index);
    } catch (error) {
      console.error('Error fetching poll results:', error);
      return [];
    }
  };

  return {
    submitVotes,
    getUserVotes,
    checkVotingEligibility,
    getPollResults,
    submitting
  };
};
