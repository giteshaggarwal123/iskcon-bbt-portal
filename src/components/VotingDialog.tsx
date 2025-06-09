
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, MinusCircle, Vote, Clock, Users, AlertCircle } from 'lucide-react';
import { useVoting } from '@/hooks/useVoting';
import { Poll } from '@/hooks/usePolls';
import { format } from 'date-fns';

interface VotingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poll: Poll | null;
}

interface VoteSelections {
  [questionId: string]: 'favor' | 'against' | 'abstain';
}

export const VotingDialog: React.FC<VotingDialogProps> = ({ open, onOpenChange, poll }) => {
  const [comment, setComment] = useState('');
  const [voteSelections, setVoteSelections] = useState<VoteSelections>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
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
      setCurrentQuestionIndex(0);
    }
  }, [poll, open, checkVotingEligibility]);

  const handleVoteSelection = (subPollId: string, vote: 'favor' | 'against' | 'abstain') => {
    console.log('Vote selected:', { subPollId, vote });
    setVoteSelections(prev => ({
      ...prev,
      [subPollId]: vote
    }));
  };

  const getSubPollVotes = () => {
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
    
    const success = await submitVotes({
      pollId: poll.id,
      votes: votes,
      comment: comment.trim() || undefined
    });

    if (success) {
      onOpenChange(false);
      setVoteSelections({});
      setComment('');
    }
  };

  const nextQuestion = () => {
    if (poll?.sub_polls && currentQuestionIndex < poll.sub_polls.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const progressPercentage = poll?.sub_polls ? (Object.keys(voteSelections).length / poll.sub_polls.length) * 100 : 0;

  if (!poll) return null;

  const currentQuestion = poll.sub_polls?.[currentQuestionIndex];
  const votesCount = Object.keys(voteSelections).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl max-h-[90vh] mx-4 overflow-hidden flex flex-col">
        {/* Header Section - Fixed */}
        <DialogHeader className="flex-shrink-0 space-y-4 pb-4 border-b">
          <DialogTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Vote className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="text-lg font-semibold truncate">Cast Your Vote</span>
            </div>
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {votesCount}/{poll.sub_polls?.length || 0} Completed
            </span>
          </DialogTitle>
          
          {/* Poll Info */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <div>
              <h3 className="font-semibold text-base sm:text-lg mb-1 leading-tight">{poll.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{poll.description}</p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">Ends: {format(new Date(poll.deadline), 'MMM dd, yyyy HH:mm')}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 flex-shrink-0" />
                <span className="whitespace-nowrap">{poll.stats?.total_voters || 0} eligible voters</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="text-primary font-medium">{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </DialogHeader>

        {/* Content Section - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {!eligibility.canVote ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center max-w-sm mx-auto">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-destructive mb-2">Cannot Vote</h3>
                <p className="text-sm text-muted-foreground">{eligibility.reason}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {/* Question Navigation */}
              {poll.sub_polls && poll.sub_polls.length > 1 && (
                <div className="flex justify-center">
                  <div className="flex flex-wrap justify-center gap-2 max-w-full">
                    {poll.sub_polls.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentQuestionIndex(index)}
                        className={`w-8 h-8 rounded-full text-sm font-medium transition-all flex-shrink-0 ${
                          index === currentQuestionIndex
                            ? 'bg-primary text-primary-foreground'
                            : voteSelections[poll.sub_polls![index].id]
                            ? 'bg-green-500 text-white'
                            : 'bg-muted text-muted-foreground hover:bg-primary/20'
                        }`}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Current Question */}
              {currentQuestion && (
                <div className="space-y-6">
                  <div className="text-center space-y-3">
                    <h4 className="text-sm text-muted-foreground">
                      Question {currentQuestionIndex + 1} of {poll.sub_polls?.length || 0}
                    </h4>
                    <h3 className="text-lg font-semibold leading-tight">{currentQuestion.title}</h3>
                    {currentQuestion.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                        {currentQuestion.description}
                      </p>
                    )}
                  </div>

                  {/* Vote Options */}
                  <div className="space-y-3">
                    {/* For Option */}
                    <div
                      onClick={() => handleVoteSelection(currentQuestion.id, 'favor')}
                      className={`w-full p-4 rounded-lg border-2 transition-all cursor-pointer ${
                        voteSelections[currentQuestion.id] === 'favor'
                          ? 'border-green-500 bg-green-50'
                          : 'border-border hover:border-green-300 hover:bg-green-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          voteSelections[currentQuestion.id] === 'favor'
                            ? 'border-green-500 bg-green-500'
                            : 'border-muted-foreground'
                        }`}>
                          {voteSelections[currentQuestion.id] === 'favor' && (
                            <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                          )}
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-green-700">For</p>
                          <p className="text-sm text-green-600">I support this proposal</p>
                        </div>
                      </div>
                    </div>

                    {/* Against Option */}
                    <div
                      onClick={() => handleVoteSelection(currentQuestion.id, 'against')}
                      className={`w-full p-4 rounded-lg border-2 transition-all cursor-pointer ${
                        voteSelections[currentQuestion.id] === 'against'
                          ? 'border-red-500 bg-red-50'
                          : 'border-border hover:border-red-300 hover:bg-red-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          voteSelections[currentQuestion.id] === 'against'
                            ? 'border-red-500 bg-red-500'
                            : 'border-muted-foreground'
                        }`}>
                          {voteSelections[currentQuestion.id] === 'against' && (
                            <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                          )}
                        </div>
                        <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-red-700">Against</p>
                          <p className="text-sm text-red-600">I oppose this proposal</p>
                        </div>
                      </div>
                    </div>

                    {/* Abstain Option */}
                    <div
                      onClick={() => handleVoteSelection(currentQuestion.id, 'abstain')}
                      className={`w-full p-4 rounded-lg border-2 transition-all cursor-pointer ${
                        voteSelections[currentQuestion.id] === 'abstain'
                          ? 'border-yellow-500 bg-yellow-50'
                          : 'border-border hover:border-yellow-300 hover:bg-yellow-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          voteSelections[currentQuestion.id] === 'abstain'
                            ? 'border-yellow-500 bg-yellow-500'
                            : 'border-muted-foreground'
                        }`}>
                          {voteSelections[currentQuestion.id] === 'abstain' && (
                            <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                          )}
                        </div>
                        <MinusCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-yellow-700">Abstain</p>
                          <p className="text-sm text-yellow-600">I choose not to vote on this</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Navigation Buttons */}
                  {poll.sub_polls && poll.sub_polls.length > 1 && (
                    <div className="flex justify-between pt-4">
                      <Button
                        variant="outline"
                        onClick={prevQuestion}
                        disabled={currentQuestionIndex === 0}
                        className="w-24"
                      >
                        Previous
                      </Button>
                      <Button
                        onClick={nextQuestion}
                        disabled={currentQuestionIndex === poll.sub_polls.length - 1}
                        className="w-24"
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Comment Section */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Optional Comment</Label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add any comments about your votes (optional)..."
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Section - Fixed */}
        {eligibility.canVote && (
          <div className="flex-shrink-0 space-y-4 pt-4 border-t">
            {/* Warning Message */}
            {!allSubPollsVoted && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800 text-center">
                  <AlertCircle className="h-4 w-4 inline mr-1" />
                  Please vote on all {poll.sub_polls?.length || 0} questions before submitting.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)} 
                disabled={submitting}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!allSubPollsVoted || submitting}
                className="w-full sm:w-auto sm:min-w-[150px] order-1 sm:order-2"
              >
                <Vote className="h-4 w-4 mr-2" />
                {submitting ? 'Submitting...' : 'Submit All Votes'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
