
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, MinusCircle, Vote, Clock, Users, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
      setCurrentQuestionIndex(0);
    }
  }, [poll, open, checkVotingEligibility]);

  const handleVoteSelection = (subPollId: string, vote: 'favor' | 'against' | 'abstain') => {
    if (isSubmitted) return;
    
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
    
    setIsSubmitted(true);
    
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
      setIsSubmitted(false);
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

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const getVoteStats = () => {
    const votes = getSubPollVotes();
    const favorCount = votes.filter(v => v.vote === 'favor').length;
    const againstCount = votes.filter(v => v.vote === 'against').length;
    const abstainCount = votes.filter(v => v.vote === 'abstain').length;
    return { favorCount, againstCount, abstainCount };
  };

  const progressPercentage = poll?.sub_polls ? (Object.keys(voteSelections).length / poll.sub_polls.length) * 100 : 0;

  if (!poll) return null;

  const currentQuestion = poll.sub_polls?.[currentQuestionIndex];
  const { favorCount, againstCount, abstainCount } = getVoteStats();
  const votesCount = Object.keys(voteSelections).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="space-y-4">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Vote className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Cast Your Vote</span>
            </div>
            <Badge variant="secondary" className="text-sm">
              {votesCount}/{poll.sub_polls?.length || 0} Completed
            </Badge>
          </DialogTitle>
          
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-lg border">
              <h3 className="font-semibold text-lg text-gray-900 mb-1">{poll.title}</h3>
              <p className="text-sm text-gray-600 mb-2">{poll.description}</p>
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>Ends: {format(new Date(poll.deadline), 'MMM dd, yyyy HH:mm')}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-3 w-3" />
                  <span>{poll.stats?.total_voters || 0} eligible voters</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Progress</span>
                <span className="text-primary font-medium">{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </div>
        </DialogHeader>

        {!eligibility.canVote ? (
          <div className="flex-1 flex items-center justify-center">
            <Card className="w-full max-w-md">
              <CardContent className="p-6 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-800 mb-2">Cannot Vote</h3>
                <p className="text-red-600">{eligibility.reason}</p>
              </CardContent>
            </Card>
          </div>
        ) : isSubmitted ? (
          <div className="flex-1 flex items-center justify-center">
            <Card className="w-full max-w-md">
              <CardContent className="p-6 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-800 mb-2">Vote Submitted!</h3>
                <p className="text-green-600">Your votes have been successfully recorded.</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex-1 flex flex-col space-y-6 overflow-hidden">
            {/* Question Navigation */}
            {poll.sub_polls && poll.sub_polls.length > 1 && (
              <div className="flex flex-wrap gap-2 justify-center p-2 bg-gray-50 rounded-lg">
                {poll.sub_polls.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToQuestion(index)}
                    className={`w-8 h-8 rounded-full text-sm font-medium transition-all ${
                      index === currentQuestionIndex
                        ? 'bg-primary text-white shadow-md'
                        : voteSelections[poll.sub_polls![index].id]
                        ? 'bg-green-500 text-white'
                        : 'bg-white text-gray-400 border-2 border-gray-200 hover:border-primary hover:text-primary'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            )}

            {/* Current Question */}
            {currentQuestion && (
              <div className="flex-1 overflow-y-auto">
                <Card className="h-full">
                  <CardHeader className="text-center">
                    <CardTitle className="text-xl">
                      Question {currentQuestionIndex + 1} of {poll.sub_polls?.length || 0}
                    </CardTitle>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-gray-900">{currentQuestion.title}</h3>
                      {currentQuestion.description && (
                        <p className="text-sm text-gray-600">{currentQuestion.description}</p>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Vote Options */}
                    <div className="space-y-3">
                      {/* For Option */}
                      <button
                        onClick={() => handleVoteSelection(currentQuestion.id, 'favor')}
                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                          voteSelections[currentQuestion.id] === 'favor'
                            ? 'border-green-500 bg-green-50 shadow-md'
                            : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            voteSelections[currentQuestion.id] === 'favor'
                              ? 'border-green-500 bg-green-500'
                              : 'border-gray-300'
                          }`}>
                            {voteSelections[currentQuestion.id] === 'favor' && (
                              <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                            )}
                          </div>
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-semibold text-green-700">For</p>
                            <p className="text-sm text-green-600">I support this proposal</p>
                          </div>
                        </div>
                      </button>

                      {/* Against Option */}
                      <button
                        onClick={() => handleVoteSelection(currentQuestion.id, 'against')}
                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                          voteSelections[currentQuestion.id] === 'against'
                            ? 'border-red-500 bg-red-50 shadow-md'
                            : 'border-gray-200 hover:border-red-300 hover:bg-red-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            voteSelections[currentQuestion.id] === 'against'
                              ? 'border-red-500 bg-red-500'
                              : 'border-gray-300'
                          }`}>
                            {voteSelections[currentQuestion.id] === 'against' && (
                              <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                            )}
                          </div>
                          <XCircle className="h-5 w-5 text-red-600" />
                          <div>
                            <p className="font-semibold text-red-700">Against</p>
                            <p className="text-sm text-red-600">I oppose this proposal</p>
                          </div>
                        </div>
                      </button>

                      {/* Abstain Option */}
                      <button
                        onClick={() => handleVoteSelection(currentQuestion.id, 'abstain')}
                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                          voteSelections[currentQuestion.id] === 'abstain'
                            ? 'border-yellow-500 bg-yellow-50 shadow-md'
                            : 'border-gray-200 hover:border-yellow-300 hover:bg-yellow-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            voteSelections[currentQuestion.id] === 'abstain'
                              ? 'border-yellow-500 bg-yellow-500'
                              : 'border-gray-300'
                          }`}>
                            {voteSelections[currentQuestion.id] === 'abstain' && (
                              <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                            )}
                          </div>
                          <MinusCircle className="h-5 w-5 text-yellow-600" />
                          <div>
                            <p className="font-semibold text-yellow-700">Abstain</p>
                            <p className="text-sm text-yellow-600">I choose not to vote on this</p>
                          </div>
                        </div>
                      </button>
                    </div>

                    {/* Navigation Buttons */}
                    {poll.sub_polls && poll.sub_polls.length > 1 && (
                      <div className="flex justify-between pt-4">
                        <Button
                          variant="outline"
                          onClick={prevQuestion}
                          disabled={currentQuestionIndex === 0}
                        >
                          Previous
                        </Button>
                        <Button
                          onClick={nextQuestion}
                          disabled={currentQuestionIndex === poll.sub_polls.length - 1}
                          className={voteSelections[currentQuestion.id] ? 'bg-primary' : ''}
                        >
                          {currentQuestionIndex === poll.sub_polls.length - 1 ? 'Review' : 'Next'}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Vote Summary */}
            {votesCount > 0 && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-primary mb-3 text-center">Your Vote Summary</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-600">{favorCount}</div>
                      <div className="text-sm text-gray-600">For</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">{againstCount}</div>
                      <div className="text-sm text-gray-600">Against</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-yellow-600">{abstainCount}</div>
                      <div className="text-sm text-gray-600">Abstain</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Comment Section */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Optional Comment</Label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add any comments about your votes (optional)..."
                rows={3}
                className="resize-none"
                disabled={isSubmitted}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!allSubPollsVoted || submitting}
                className="bg-primary hover:bg-primary/90 min-w-[150px]"
              >
                <Vote className="h-4 w-4 mr-2" />
                {submitting ? 'Submitting...' : `Submit All Votes`}
              </Button>
            </div>

            {!allSubPollsVoted && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800 text-center">
                  <AlertCircle className="h-4 w-4 inline mr-1" />
                  Please vote on all {poll.sub_polls?.length || 0} questions before submitting.
                </p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
