
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Calendar, Plus } from 'lucide-react';

interface CreatePollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreatePollDialog: React.FC<CreatePollDialogProps> = ({ open, onOpenChange }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    isSecret: true,
    notifyMembers: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating poll:', formData);
    // Poll creation logic here
    onOpenChange(false);
    // Reset form
    setFormData({
      title: '',
      description: '',
      deadline: '',
      isSecret: true,
      notifyMembers: true
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Create New Poll</span>
          </DialogTitle>
          <DialogDescription>
            Create a new poll for committee voting
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Poll Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter poll title..."
              required
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide detailed description of the proposal..."
              rows={3}
              required
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="deadline">Voting Deadline</Label>
            <div className="relative mt-2">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="deadline"
                type="datetime-local"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="secret">Secret Ballot</Label>
                <p className="text-sm text-gray-500">Hide individual votes from other members</p>
              </div>
              <Switch
                id="secret"
                checked={formData.isSecret}
                onCheckedChange={(checked) => setFormData({ ...formData, isSecret: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notify">Notify Members</Label>
                <p className="text-sm text-gray-500">Send notification to all eligible voters</p>
              </div>
              <Switch
                id="notify"
                checked={formData.notifyMembers}
                onCheckedChange={(checked) => setFormData({ ...formData, notifyMembers: checked })}
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Voting Rules</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Minimum 75% participation required for validity</li>
              <li>• Members can vote: Favor, Against, or Abstain</li>
              <li>• Votes cannot be changed once submitted</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              Create Poll
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
