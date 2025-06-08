
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, MinusCircle, Vote } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useVoting } from '@/hooks/useVoting';
import { Poll } from '@/hooks/usePolls';

interface VotingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poll: Poll | null;
}

interface SubPollVote {
  subPollId: string;
  vote: 'favor' | 'against' | 'abstain';
}

export const VotingDialog: React.FC<VotingDialogProps> = ({ open, onOpenChange, poll }) => {
  const [comment, setComment] = useState('');
  const [subPollVotes, setSubPollVotes] = useState<SubPollVote[]>([]);
  const [eligibility, setEligibility] = useState<{ canVote: boolean; reason: string | null }>({ canVote: true, reason: null });
  
  const { submitVotes, checkVotingEligibility, submitting } = useVoting();

  useEffect(() => {
    if (poll && open) {
      console.log('Checking eligibility for poll:', poll.id);
      checkVotingEligibility(poll.id).then(result => {
        console.log('Eligibility result:', result);
        setEligibility(result);
      });
      setSubPollVotes([]);
      setComment('');
    }
  }, [poll, open, checkVotingEligibility]);

  const handleSubPollVote = (subPollId: string, vote: 'favor' | 'against' | 'abstain') => {
    console.log('Vote selected:', { subPollId, vote });
    setSubPollVotes(prev => {
      const existing = prev.find(v => v.subPollId === subPollId);
      if (existing) {
        return prev.map(v => v.subPollId === subPollId ? { ...v, vote } : v);
      } else {
        return [...prev, { subPollId, vote }];
      }
    });
  };

  const getSubPollVote = (subPollId: string): 'favor' | 'against' | 'abstain' | undefined => {
    return subPollVotes.find(v => v.subPollId === subPollId)?.vote;
  };

  const allSubPollsVoted = poll?.sub_polls?.every(subPoll => 
    subPollVotes.some(vote => vote.subPollId === subPoll.id)
  ) || false;

  const handleSubmit = async () => {
    if (!poll || !allSubPollsVoted) {
      alert('Please vote on all questions before submitting.');
      return;
    }

    console.log('Submitting votes:', { pollId: poll.id, votes: subPollVotes, comment });
    
    const success = await submitVotes({
      pollId: poll.id,
      votes: subPollVotes,
      comment: comment.trim() || undefined
    });

    if (success) {
      onOpenChange(false);
      setSubPollVotes([]);
      setComment('');
    }
  };

  const getVoteIcon = (voteType: string) => {
    switch (voteType) {
      case 'favor':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'against':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'abstain':
        return <MinusCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getVoteStats = () => {
    const favorCount = subPollVotes.filter(v => v.vote === 'favor').length;
    const againstCount = subPollVotes.filter(v => v.vote === 'against').length;
    const abstainCount = subPollVotes.filter(v => v.vote === 'abstain').length;
    return { favorCount, againstCount, abstainCount };
  };

  if (!poll) return null;

  const { favorCount, againstCount, abstainCount } = getVoteStats();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Vote className="h-5 w-5" />
            <span>Cast Your Vote</span>
          </DialogTitle>
          <DialogDescription>
            Vote on each question below. You must vote on all questions.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">{poll.title}</h3>
            <p className="text-sm text-gray-600">{poll.description}</p>
          </div>

          {!eligibility.canVote && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium">Cannot vote: {eligibility.reason}</p>
            </div>
          )}

          {eligibility.canVote && poll.sub_polls && poll.sub_polls.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Questions to Vote On:</h4>
              
              {poll.sub_polls.map((subPoll, index) => {
                const currentVote = getSubPollVote(subPoll.id);
                return (
                  <Card key={subPoll.id} className="border-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center justify-between">
                        <span>Question {index + 1}: {subPoll.title}</span>
                        {currentVote && getVoteIcon(currentVote)}
                      </CardTitle>
                      {subPoll.description && (
                        <p className="text-sm text-gray-600">{subPoll.description}</p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <RadioGroup 
                        value={currentVote || ''} 
                        onValueChange={(value) => {
                          console.log('RadioGroup value changed:', value, 'for subPoll:', subPoll.id);
                          handleSubPollVote(subPoll.id, value as 'favor' | 'against' | 'abstain');
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem 
                            value="favor" 
                            id={`${subPoll.id}-favor`}
                            className="cursor-pointer"
                          />
                          <Label 
                            htmlFor={`${subPoll.id}-favor`} 
                            className="flex items-center space-x-2 cursor-pointer hover:bg-green-50 p-2 rounded"
                          >
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span>For</span>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem 
                            value="against" 
                            id={`${subPoll.id}-against`}
                            className="cursor-pointer"
                          />
                          <Label 
                            htmlFor={`${subPoll.id}-against`} 
                            className="flex items-center space-x-2 cursor-pointer hover:bg-red-50 p-2 rounded"
                          >
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span>Against</span>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem 
                            value="abstain" 
                            id={`${subPoll.id}-abstain`}
                            className="cursor-pointer"
                          />
                          <Label 
                            htmlFor={`${subPoll.id}-abstain`} 
                            className="flex items-center space-x-2 cursor-pointer hover:bg-yellow-50 p-2 rounded"
                          >
                            <MinusCircle className="h-4 w-4 text-yellow-600" />
                            <span>Abstain</span>
                          </Label>
                        </div>
                      </RadioGroup>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {eligibility.canVote && subPollVotes.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Your Vote Summary</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{favorCount}</div>
                  <div className="text-blue-800">For</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-600">{againstCount}</div>
                  <div className="text-blue-800">Against</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-yellow-600">{abstainCount}</div>
                  <div className="text-blue-800">Abstain</div>
                </div>
              </div>
              <div className="mt-2 text-center text-sm text-blue-800">
                {subPollVotes.length} of {poll.sub_polls?.length || 0} questions answered
              </div>
            </div>
          )}

          {eligibility.canVote && (
            <div>
              <Label className="text-sm font-medium">Optional Comment</Label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add any comments about your votes (optional)..."
                rows={3}
                className="mt-2"
              />
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Your votes cannot be changed once submitted. Please review all your selections carefully.
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {eligibility.canVote && (
              <Button 
                onClick={handleSubmit}
                disabled={!allSubPollsVoted || submitting}
                className="bg-primary hover:bg-primary/90"
              >
                <Vote className="h-4 w-4 mr-2" />
                {submitting ? 'Submitting...' : `Submit All Votes (${subPollVotes.length}/${poll.sub_polls?.length || 0})`}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
