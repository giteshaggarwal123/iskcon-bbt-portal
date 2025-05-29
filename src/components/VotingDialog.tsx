
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, MinusCircle, Vote } from 'lucide-react';

interface VotingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poll: any;
  voteType: 'favor' | 'against' | 'abstain';
}

export const VotingDialog: React.FC<VotingDialogProps> = ({ open, onOpenChange, poll, voteType }) => {
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    console.log('Vote submitted:', { pollId: poll?.id, voteType, comment });
    // Submit vote logic here
    onOpenChange(false);
  };

  const getVoteIcon = () => {
    switch (voteType) {
      case 'favor':
        return <CheckCircle className="h-8 w-8 text-success" />;
      case 'against':
        return <XCircle className="h-8 w-8 text-error" />;
      case 'abstain':
        return <MinusCircle className="h-8 w-8 text-warning" />;
    }
  };

  const getVoteTitle = () => {
    switch (voteType) {
      case 'favor':
        return 'Vote in Favor';
      case 'against':
        return 'Vote Against';
      case 'abstain':
        return 'Abstain from Voting';
    }
  };

  const getVoteDescription = () => {
    switch (voteType) {
      case 'favor':
        return 'You are voting in favor of this proposal';
      case 'against':
        return 'You are voting against this proposal';
      case 'abstain':
        return 'You are choosing to abstain from this vote';
    }
  };

  if (!poll) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Vote className="h-5 w-5" />
            <span>{getVoteTitle()}</span>
          </DialogTitle>
          <DialogDescription>
            {getVoteDescription()}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">{poll.title}</h3>
            <p className="text-sm text-gray-600">{poll.description}</p>
          </div>

          <div className="flex items-center justify-center py-6">
            {getVoteIcon()}
          </div>

          <div>
            <label className="text-sm font-medium">Optional Comment</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add any comments about your vote (optional)..."
              rows={3}
              className="mt-2"
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Your vote cannot be changed once submitted. Please review your decision carefully.
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              className={
                voteType === 'favor' ? 'bg-success hover:bg-success/90' :
                voteType === 'against' ? 'bg-error hover:bg-error/90' :
                'bg-warning hover:bg-warning/90'
              }
            >
              {voteType === 'favor' && <CheckCircle className="h-4 w-4 mr-2" />}
              {voteType === 'against' && <XCircle className="h-4 w-4 mr-2" />}
              {voteType === 'abstain' && <MinusCircle className="h-4 w-4 mr-2" />}
              Confirm Vote
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
