
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Calendar, Plus, X, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CreatePollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SubPoll {
  id: string;
  title: string;
  description: string;
}

export const CreatePollDialog: React.FC<CreatePollDialogProps> = ({ open, onOpenChange }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    isSecret: true,
    notifyMembers: true
  });

  const [subPolls, setSubPolls] = useState<SubPoll[]>([
    { id: '1', title: '', description: '' }
  ]);

  const addSubPoll = () => {
    const newSubPoll: SubPoll = {
      id: Date.now().toString(),
      title: '',
      description: ''
    };
    setSubPolls([...subPolls, newSubPoll]);
  };

  const removeSubPoll = (id: string) => {
    if (subPolls.length > 1) {
      setSubPolls(subPolls.filter(poll => poll.id !== id));
    }
  };

  const updateSubPoll = (id: string, field: keyof SubPoll, value: string) => {
    setSubPolls(subPolls.map(poll => 
      poll.id === id ? { ...poll, [field]: value } : poll
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that all sub-polls have titles
    const validSubPolls = subPolls.filter(poll => poll.title.trim() !== '');
    if (validSubPolls.length === 0) {
      alert('Please add at least one sub-poll with a title.');
      return;
    }

    console.log('Creating poll:', {
      ...formData,
      subPolls: validSubPolls
    });
    
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
    setSubPolls([{ id: '1', title: '', description: '' }]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Create New Poll</span>
          </DialogTitle>
          <DialogDescription>
            Create a new poll with multiple questions for committee voting
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="title">Main Poll Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter main poll title..."
              required
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="description">Main Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide overall description of the poll..."
              rows={3}
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
              <Label className="text-lg font-semibold">Poll Questions</Label>
              <Button type="button" variant="outline" size="sm" onClick={addSubPoll}>
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>

            <div className="space-y-4">
              {subPolls.map((subPoll, index) => (
                <Card key={subPoll.id} className="border-2 border-dashed border-gray-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Question {index + 1}</CardTitle>
                      {subPolls.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSubPoll(subPoll.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label htmlFor={`subpoll-title-${subPoll.id}`}>Question Title *</Label>
                      <Input
                        id={`subpoll-title-${subPoll.id}`}
                        value={subPoll.title}
                        onChange={(e) => updateSubPoll(subPoll.id, 'title', e.target.value)}
                        placeholder="Enter the question..."
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`subpoll-description-${subPoll.id}`}>Question Description</Label>
                      <Textarea
                        id={`subpoll-description-${subPoll.id}`}
                        value={subPoll.description}
                        onChange={(e) => updateSubPoll(subPoll.id, 'description', e.target.value)}
                        placeholder="Additional details about this question..."
                        rows={2}
                        className="mt-1"
                      />
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        Members will vote: <strong>For</strong>, <strong>Against</strong>, or <strong>Abstain</strong> on this question
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
              <li>• Members must vote on each question: For, Against, or Abstain</li>
              <li>• Votes cannot be changed once submitted</li>
              <li>• Each question is evaluated independently</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              Create Poll ({subPolls.filter(p => p.title.trim()).length} question{subPolls.filter(p => p.title.trim()).length !== 1 ? 's' : ''})
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
