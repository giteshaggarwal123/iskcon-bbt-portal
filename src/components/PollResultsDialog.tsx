
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, MinusCircle, Users, Calendar } from 'lucide-react';
import { Poll } from '@/hooks/usePolls';
import { format } from 'date-fns';

interface PollResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poll: Poll | null;
}

export const PollResultsDialog: React.FC<PollResultsDialogProps> = ({ open, onOpenChange, poll }) => {
  if (!poll) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Poll Results</span>
          </DialogTitle>
          <DialogDescription>
            View voting results and statistics for this poll
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Poll Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{poll.title}</CardTitle>
              {poll.description && (
                <p className="text-sm text-muted-foreground">{poll.description}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {poll.stats?.voted_count || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Votes Cast</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-muted-foreground">
                    {poll.stats?.total_voters || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Voters</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(((poll.stats?.voted_count || 0) / (poll.stats?.total_voters || 1)) * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Participation</div>
                </div>
                <div className="text-center">
                  <Badge variant={poll.status === 'active' ? 'default' : 'secondary'}>
                    {poll.status}
                  </Badge>
                  <div className="text-sm text-muted-foreground mt-1">Status</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Deadline: {format(new Date(poll.deadline), 'MMM dd, yyyy HH:mm')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Question Results */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Question Results</h3>
            {poll.sub_polls && poll.sub_polls.length > 0 ? (
              poll.sub_polls.map((subPoll, index) => (
                <Card key={subPoll.id}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Question {index + 1}: {subPoll.title}
                    </CardTitle>
                    {subPoll.description && (
                      <p className="text-sm text-muted-foreground">{subPoll.description}</p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* For Votes */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium">For</span>
                        </div>
                        <span className="text-sm text-muted-foreground">0 votes (0%)</span>
                      </div>
                      <Progress value={0} className="h-2" />
                    </div>

                    {/* Against Votes */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <XCircle className="h-4 w-4 text-red-600" />
                          <span className="text-sm font-medium">Against</span>
                        </div>
                        <span className="text-sm text-muted-foreground">0 votes (0%)</span>
                      </div>
                      <Progress value={0} className="h-2" />
                    </div>

                    {/* Abstain Votes */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <MinusCircle className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm font-medium">Abstain</span>
                        </div>
                        <span className="text-sm text-muted-foreground">0 votes (0%)</span>
                      </div>
                      <Progress value={0} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No questions found for this poll</p>
                </CardContent>
              </Card>
            )}
          </div>

          {poll.is_secret && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Secret Ballot:</strong> Individual votes are anonymous and cannot be traced back to specific voters.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
