import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar, Edit, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePolls, Poll } from '@/hooks/usePolls';
import { toast } from 'sonner';

interface EditPollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poll: Poll | null;
}

export const EditPollDialog: React.FC<EditPollDialogProps> = ({ open, onOpenChange, poll }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
  });

  const [subPolls, setSubPolls] = useState<Array<{ id: string; title: string; description: string }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const { updatePoll } = usePolls();

  useEffect(() => {
    if (poll && open) {
      setFormData({
        title: poll.title,
        description: poll.description || '',
        deadline: new Date(poll.deadline).toISOString().slice(0, 16),
      });
      
      setSubPolls(poll.sub_polls?.map(sp => ({
        id: sp.id,
        title: sp.title,
        description: sp.description || ''
      })) || []);
    }
  }, [poll, open]);

  const updateSubPoll = (index: number, field: 'title' | 'description', value: string) => {
    setSubPolls(prev => prev.map((sp, i) => 
      i === index ? { ...sp, [field]: value } : sp
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!poll) return;

    setSubmitting(true);
    
    try {
      const success = await updatePoll(poll.id, {
        title: formData.title,
        description: formData.description,
        deadline: formData.deadline,
        subPolls: subPolls
      });

      if (success) {
        onOpenChange(false);
        toast.success('Poll updated successfully');
      }
    } catch (error) {
      console.error('Error updating poll:', error);
      toast.error('Failed to update poll');
    } finally {
      setSubmitting(false);
    }
  };

  if (!poll) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto z-50">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Edit className="h-5 w-5" />
            <span>Edit Poll</span>
          </DialogTitle>
          <DialogDescription>
            Update poll details and questions. Note: Changes will affect ongoing voting.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="edit-title">Poll Title</Label>
            <Input
              id="edit-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter poll title..."
              required
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide description of the poll..."
              rows={3}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="edit-deadline">Voting Deadline</Label>
            <div className="relative mt-2">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="edit-deadline"
                type="datetime-local"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-lg font-semibold">Poll Questions</Label>
            
            <div className="space-y-4">
              {subPolls.map((subPoll, index) => (
                <Card key={subPoll.id} className="border-2 border-dashed border-gray-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Question {index + 1}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label htmlFor={`edit-subpoll-title-${index}`}>Question Title</Label>
                      <Input
                        id={`edit-subpoll-title-${index}`}
                        value={subPoll.title}
                        onChange={(e) => updateSubPoll(index, 'title', e.target.value)}
                        placeholder="Enter the question..."
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edit-subpoll-description-${index}`}>Question Description</Label>
                      <Textarea
                        id={`edit-subpoll-description-${index}`}
                        value={subPoll.description}
                        onChange={(e) => updateSubPoll(index, 'description', e.target.value)}
                        placeholder="Additional details about this question..."
                        rows={2}
                        className="mt-1"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-2">Important Notice</h4>
            <p className="text-sm text-yellow-800">
              Editing this poll may affect ongoing voting. Members who have already voted will keep their votes, 
              but changes to questions may cause confusion. Consider creating a new poll instead if major changes are needed.
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="bg-primary hover:bg-primary/90">
              <Save className="h-4 w-4 mr-2" />
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
