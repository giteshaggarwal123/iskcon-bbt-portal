
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

interface VoteSelections {
  [questionId: string]: 'favor' | 'against' | 'abstain';
}

export const VotingDialog: React.FC<VotingDialogProps> = ({ open, onOpenChange, poll }) => {
  const [comment, setComment] = useState('');
  const [voteSelections, setVoteSelections] = useState<VoteSelections>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [eligibility, setEligibility] = useState<{ canVote: boolean; reason: string | null }>({ canVote: true, reason: null });
  
  const { submitVotes, checkVotingEligibility, submitting } = useVoting();

  useEffect(() => {
    if (poll && open) {
      console.log('Checking eligibility for poll:', poll.id);
      checkVotingEligibility(poll.id).then(result => {
        console.log('Eligibility result:', result);
        setEligibility(result);
      });
      setVoteSelections({});
      setComment('');
      setIsSubmitted(false);
    }
  }, [poll, open, checkVotingEligibility]);

  const handleVoteSelection = (subPollId: string, vote: 'favor' | 'against' | 'abstain') => {
    if (isSubmitted) return; // Prevent changes after submission
    
    console.log('Vote selected:', { subPollId, vote });
    setVoteSelections(prev => ({
      ...prev,
      [subPollId]: vote
    }));
  };

  // Convert voteSelections object to array format for submission
  const getSubPollVotes = (): SubPollVote[] => {
    return Object.entries(voteSelections).map(([subPollId, vote]) => ({
      subPollId,
      vote
    }));
  };

  const allSubPollsVoted = poll?.sub_polls?.every(subPoll => 
    voteSelections.hasOwnProperty(subPoll.id)
  ) || false;

  const handleSubmit = async () => {
    if (!poll || !allSubPollsVoted) {
      alert('Please vote on all questions before submitting.');
      return;
    }

    const votes = getSubPollVotes();
    console.log('Submitting votes:', { pollId: poll.id, votes, comment });
    
    setIsSubmitted(true); // Lock the form
    
    const success = await submitVotes({
      pollId: poll.id,
      votes: votes,
      comment: comment.trim() || undefined
    });

    if (success) {
      onOpenChange(false);
      setVoteSelections({});
      setComment('');
      setIsSubmitted(false);
    } else {
      setIsSubmitted(false); // Unlock if submission failed
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
    const votes = getSubPollVotes();
    const favorCount = votes.filter(v => v.vote === 'favor').length;
    const againstCount = votes.filter(v => v.vote === 'against').length;
    const abstainCount = votes.filter(v => v.vote === 'abstain').length;
    return { favorCount, againstCount, abstainCount };
  };

  if (!poll) return null;

  const { favorCount, againstCount, abstainCount } = getVoteStats();
  const votesCount = Object.keys(voteSelections).length;

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

          {isSubmitted && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 font-medium">
                Votes submitted! Your selections are now locked.
              </p>
            </div>
          )}

          {eligibility.canVote && poll.sub_polls && poll.sub_polls.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Questions to Vote On:</h4>
              
              {poll.sub_polls.map((subPoll, index) => {
                const currentVote = voteSelections[subPoll.id];
                const isLocked = isSubmitted;
                
                return (
                  <Card key={subPoll.id} className={`border-2 ${currentVote ? 'border-blue-300 bg-blue-50' : 'border-gray-200'} ${isLocked ? 'opacity-75' : ''}`}>
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
                      <div className="space-y-3">
                        {/* For Option */}
                        <div 
                          className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                            currentVote === 'favor' 
                              ? 'border-green-500 bg-green-50' 
                              : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                          } ${isLocked ? 'cursor-not-allowed opacity-60' : ''}`}
                          onClick={() => !isLocked && handleVoteSelection(subPoll.id, 'favor')}
                        >
                          <div 
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              currentVote === 'favor' 
                                ? 'border-green-500 bg-green-500' 
                                : 'border-gray-300'
                            }`}
                          >
                            {currentVote === 'favor' && (
                              <div className="w-2 h-2 rounded-full bg-white"></div>
                            )}
                          </div>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="font-medium flex-1">For</span>
                        </div>

                        {/* Against Option */}
                        <div 
                          className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                            currentVote === 'against' 
                              ? 'border-red-500 bg-red-50' 
                              : 'border-gray-200 hover:border-red-300 hover:bg-red-50'
                          } ${isLocked ? 'cursor-not-allowed opacity-60' : ''}`}
                          onClick={() => !isLocked && handleVoteSelection(subPoll.id, 'against')}
                        >
                          <div 
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              currentVote === 'against' 
                                ? 'border-red-500 bg-red-500' 
                                : 'border-gray-300'
                            }`}
                          >
                            {currentVote === 'against' && (
                              <div className="w-2 h-2 rounded-full bg-white"></div>
                            )}
                          </div>
                          <XCircle className="h-4 w-4 text-red-600" />
                          <span className="font-medium flex-1">Against</span>
                        </div>

                        {/* Abstain Option */}
                        <div 
                          className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                            currentVote === 'abstain' 
                              ? 'border-yellow-500 bg-yellow-50' 
                              : 'border-gray-200 hover:border-yellow-300 hover:bg-yellow-50'
                          } ${isLocked ? 'cursor-not-allowed opacity-60' : ''}`}
                          onClick={() => !isLocked && handleVoteSelection(subPoll.id, 'abstain')}
                        >
                          <div 
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              currentVote === 'abstain' 
                                ? 'border-yellow-500 bg-yellow-500' 
                                : 'border-gray-300'
                            }`}
                          >
                            {currentVote === 'abstain' && (
                              <div className="w-2 h-2 rounded-full bg-white"></div>
                            )}
                          </div>
                          <MinusCircle className="h-4 w-4 text-yellow-600" />
                          <span className="font-medium flex-1">Abstain</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {eligibility.canVote && votesCount > 0 && (
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
                {votesCount} of {poll.sub_polls?.length || 0} questions answered
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
                disabled={isSubmitted}
              />
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Your votes cannot be changed once submitted. Please review all your selections carefully.
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            {eligibility.canVote && (
              <Button 
                onClick={handleSubmit}
                disabled={!allSubPollsVoted || submitting || isSubmitted}
                className="bg-primary hover:bg-primary/90"
              >
                <Vote className="h-4 w-4 mr-2" />
                {submitting ? 'Submitting...' : `Submit All Votes (${votesCount}/${poll.sub_polls?.length || 0})`}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
