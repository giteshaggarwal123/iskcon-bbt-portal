
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, MinusCircle, Vote, Clock, Users, AlertCircle, ChevronLeft, ChevronRight, ThumbsUp, Minus } from 'lucide-react';
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

  const voteOptions = [
    {
      value: 'favor',
      label: 'In Favour',
      description: 'I support this proposal',
      icon: ThumbsUp,
      color: 'bg-green-50 border-green-200 hover:bg-green-100',
      selectedColor: 'bg-green-100 border-green-300',
      iconColor: 'text-green-600',
      textColor: 'text-green-700'
    },
    {
      value: 'against',
      label: 'Abstain',
      description: 'I choose not to vote',
      icon: Minus,
      color: 'bg-gray-50 border-gray-200 hover:bg-gray-100',
      selectedColor: 'bg-gray-100 border-gray-300',
      iconColor: 'text-gray-600',
      textColor: 'text-gray-700'
    },
    {
      value: 'abstain',
      label: 'Abstain',
      description: 'I choose not to vote',
      icon: Minus,
      color: 'bg-gray-50 border-gray-200 hover:bg-gray-100',
      selectedColor: 'bg-gray-100 border-gray-300',
      iconColor: 'text-gray-600',
      textColor: 'text-gray-700'
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-3xl max-h-[95vh] mx-4 overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader className="flex-shrink-0 space-y-4 pb-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3 text-xl font-bold">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Vote className="h-6 w-6 text-primary" />
              </div>
              <span>Cast Your Vote</span>
            </DialogTitle>
            <Badge variant="outline" className="text-sm">
              {votesCount} of {poll.sub_polls?.length || 0} completed
            </Badge>
          </div>
          
          {/* Poll Info Card */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-2">{poll.title}</h3>
              <p className="text-gray-600 text-sm mb-3">{poll.description}</p>
              <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Ends: {format(new Date(poll.deadline), 'MMM dd, yyyy HH:mm')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{poll.stats?.total_voters || 0} eligible voters</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">Voting Progress</span>
              <span className="font-bold text-primary">{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-primary to-blue-600 h-full rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-6">
          {!eligibility.canVote ? (
            <div className="flex items-center justify-center py-12">
              <Card className="max-w-md mx-auto text-center">
                <CardContent className="p-8">
                  <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-red-700 mb-2">Cannot Vote</h3>
                  <p className="text-gray-600">{eligibility.reason}</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Question Navigation */}
              {poll.sub_polls && poll.sub_polls.length > 1 && (
                <div className="flex justify-center">
                  <div className="flex gap-2">
                    {poll.sub_polls.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentQuestionIndex(index)}
                        className={`w-10 h-10 rounded-full text-sm font-medium transition-all duration-200 ${
                          index === currentQuestionIndex
                            ? 'bg-primary text-white shadow-lg scale-110'
                            : voteSelections[poll.sub_polls![index].id]
                            ? 'bg-green-500 text-white shadow-md'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
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
                <div className="space-y-8">
                  <div className="text-center space-y-4">
                    <Badge variant="secondary" className="mb-2">
                      Question {currentQuestionIndex + 1} of {poll.sub_polls?.length || 0}
                    </Badge>
                    <h3 className="text-2xl font-bold text-gray-900 leading-tight">
                      {currentQuestion.title}
                    </h3>
                    {currentQuestion.description && (
                      <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        {currentQuestion.description}
                      </p>
                    )}
                  </div>

                  {/* Vote Options */}
                  <div className="grid gap-4 max-w-2xl mx-auto">
                    {voteOptions.map((option) => {
                      const isSelected = voteSelections[currentQuestion.id] === option.value;
                      const Icon = option.icon;
                      
                      return (
                        <Card
                          key={option.value}
                          className={`cursor-pointer transition-all duration-200 transform hover:scale-[1.02] ${
                            isSelected ? option.selectedColor : option.color
                          } ${isSelected ? 'shadow-lg ring-2 ring-primary/20' : 'hover:shadow-md'}`}
                          onClick={() => handleVoteSelection(currentQuestion.id, option.value as 'favor' | 'against' | 'abstain')}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                              <div className={`p-3 rounded-full ${isSelected ? 'bg-white shadow-sm' : 'bg-white/50'}`}>
                                <Icon className={`h-6 w-6 ${option.iconColor}`} />
                              </div>
                              <div className="flex-1">
                                <h4 className={`font-semibold text-lg ${option.textColor}`}>
                                  {option.label}
                                </h4>
                                <p className="text-gray-600 text-sm">
                                  {option.description}
                                </p>
                              </div>
                              {isSelected && (
                                <CheckCircle className="h-6 w-6 text-primary" />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Navigation Buttons */}
                  {poll.sub_polls && poll.sub_polls.length > 1 && (
                    <div className="flex justify-between items-center max-w-2xl mx-auto pt-4">
                      <Button
                        variant="outline"
                        onClick={prevQuestion}
                        disabled={currentQuestionIndex === 0}
                        className="flex items-center gap-2"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <div className="text-sm text-gray-500">
                        {currentQuestionIndex + 1} of {poll.sub_polls.length}
                      </div>
                      <Button
                        onClick={nextQuestion}
                        disabled={currentQuestionIndex === poll.sub_polls.length - 1}
                        className="flex items-center gap-2"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Comment Section */}
              <Card className="max-w-2xl mx-auto">
                <CardContent className="p-6">
                  <Label className="text-base font-medium mb-3 block">Add Your Comments (Optional)</Label>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your thoughts about this vote..."
                    rows={4}
                    className="resize-none"
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Footer */}
        {eligibility.canVote && (
          <div className="flex-shrink-0 space-y-4 pt-6 border-t border-gray-100">
            {/* Warning Message */}
            {!allSubPollsVoted && (
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 text-amber-800">
                    <AlertCircle className="h-5 w-5" />
                    <p className="text-sm font-medium">
                      Please vote on all {poll.sub_polls?.length || 0} questions before submitting your votes.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)} 
                disabled={submitting}
                className="min-w-[100px]"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!allSubPollsVoted || submitting}
                className="min-w-[150px] bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
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
