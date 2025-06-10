
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Vote, Clock, Users, AlertCircle, ThumbsUp, ThumbsDown, Minus, CheckCircle } from 'lucide-react';
import { useVoting } from '@/hooks/useVoting';
import { Poll } from '@/hooks/usePolls';
import { format } from 'date-fns';

interface SimpleVotingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poll: Poll | null;
}

interface VoteSelections {
  [questionId: string]: 'favor' | 'against' | 'abstain';
}

export const SimpleVotingDialog: React.FC<SimpleVotingDialogProps> = ({ open, onOpenChange, poll }) => {
  const [comment, setComment] = useState('');
  const [voteSelections, setVoteSelections] = useState<VoteSelections>({});
  const [eligibility, setEligibility] = useState<{ canVote: boolean; reason: string | null }>({ canVote: true, reason: null });
  
  const { submitVotes, checkVotingEligibility, submitting } = useVoting();

  useEffect(() => {
    if (poll && open) {
      checkVotingEligibility(poll.id).then(setEligibility);
      setVoteSelections({});
      setComment('');
    }
  }, [poll, open, checkVotingEligibility]);

  const handleVoteSelection = (subPollId: string, vote: 'favor' | 'against' | 'abstain') => {
    setVoteSelections(prev => ({
      ...prev,
      [subPollId]: vote
    }));
  };

  const allQuestionsAnswered = poll?.sub_polls?.every(subPoll => 
    voteSelections.hasOwnProperty(subPoll.id)
  ) || false;

  const handleSubmit = async () => {
    if (!poll || !allQuestionsAnswered) {
      return;
    }

    const votes = Object.entries(voteSelections).map(([subPollId, vote]) => ({
      subPollId,
      vote
    }));
    
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

  if (!poll) return null;

  const voteOptions = [
    {
      value: 'favor',
      label: 'In Favour',
      icon: ThumbsUp,
      color: 'bg-green-50 border-green-200 hover:bg-green-100 text-green-700',
      selectedColor: 'bg-green-100 border-green-400 ring-2 ring-green-200'
    },
    {
      value: 'against',
      label: 'Against',
      icon: ThumbsDown,
      color: 'bg-red-50 border-red-200 hover:bg-red-100 text-red-700',
      selectedColor: 'bg-red-100 border-red-400 ring-2 ring-red-200'
    },
    {
      value: 'abstain',
      label: 'Abstain',
      icon: Minus,
      color: 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700',
      selectedColor: 'bg-gray-100 border-gray-400 ring-2 ring-gray-200'
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Vote className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">{poll.title}</DialogTitle>
              <DialogDescription className="text-sm mt-1">
                {poll.description}
              </DialogDescription>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Deadline: {format(new Date(poll.deadline), 'MMM dd, yyyy HH:mm')}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{poll.stats?.total_voters || 0} eligible voters</span>
            </div>
            <Badge variant={poll.status === 'active' ? 'default' : 'secondary'}>
              {poll.status}
            </Badge>
          </div>
        </DialogHeader>

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
          <div className="space-y-6 py-4">
            {/* Questions List */}
            <div className="space-y-6">
              {poll.sub_polls?.map((question, index) => (
                <Card key={question.id} className="border-2">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-2">
                            Question {index + 1}: {question.title}
                          </h3>
                          {question.description && (
                            <p className="text-gray-600 text-sm mb-4">{question.description}</p>
                          )}
                        </div>
                        {voteSelections[question.id] && (
                          <CheckCircle className="h-5 w-5 text-green-600 ml-4 flex-shrink-0" />
                        )}
                      </div>

                      {/* Vote Options */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {voteOptions.map((option) => {
                          const isSelected = voteSelections[question.id] === option.value;
                          const Icon = option.icon;
                          
                          return (
                            <button
                              key={option.value}
                              onClick={() => handleVoteSelection(question.id, option.value as 'favor' | 'against' | 'abstain')}
                              className={`p-4 border-2 rounded-lg transition-all duration-200 text-left ${
                                isSelected ? option.selectedColor : option.color
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <Icon className="h-5 w-5" />
                                <span className="font-medium">{option.label}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Progress Summary */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-blue-900">
                    Progress: {Object.keys(voteSelections).length} of {poll.sub_polls?.length || 0} questions answered
                  </span>
                  <Badge variant={allQuestionsAnswered ? "default" : "secondary"}>
                    {allQuestionsAnswered ? "Ready to Submit" : "In Progress"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Comment Section */}
            <Card>
              <CardContent className="p-6">
                <Label className="text-base font-medium mb-3 block">
                  Additional Comments (Optional)
                </Label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts about this vote..."
                  rows={3}
                  className="resize-none"
                />
              </CardContent>
            </Card>

            {/* Submit Section */}
            <div className="space-y-4 pt-4 border-t">
              {!allQuestionsAnswered && (
                <Card className="bg-amber-50 border-amber-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 text-amber-800">
                      <AlertCircle className="h-5 w-5" />
                      <p className="text-sm font-medium">
                        Please answer all {poll.sub_polls?.length || 0} questions before submitting your vote.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-3 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => onOpenChange(false)} 
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={!allQuestionsAnswered || submitting}
                  className="min-w-[150px]"
                >
                  <Vote className="h-4 w-4 mr-2" />
                  {submitting ? 'Submitting...' : 'Submit All Votes'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
