
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
    if (!user) return { canVote: false, reason: 'Not logged in' };

    try {
      // Check if poll is active
      const { data: poll, error } = await supabase
        .from('polls')
        .select('status, deadline')
        .eq('id', pollId)
        .single();

      if (error) throw error;

      if (poll.status !== 'active') {
        return { canVote: false, reason: 'Poll is not active' };
      }

      if (new Date(poll.deadline) < new Date()) {
        return { canVote: false, reason: 'Poll deadline has passed' };
      }

      // Check if user has already voted
      const { data: existingVotes } = await supabase
        .from('poll_votes')
        .select('id')
        .eq('poll_id', pollId)
        .eq('user_id', user.id)
        .limit(1);

      if (existingVotes && existingVotes.length > 0) {
        return { canVote: false, reason: 'You have already voted on this poll' };
      }

      return { canVote: true, reason: null };
    } catch (error) {
      console.error('Error checking voting eligibility:', error);
      return { canVote: false, reason: 'Error checking eligibility' };
    }
  };

  return {
    submitVotes,
    getUserVotes,
    checkVotingEligibility,
    submitting
  };
};
