
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Paperclip, Users, Mail } from 'lucide-react';

interface ComposeEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ComposeEmailDialog: React.FC<ComposeEmailDialogProps> = ({ open, onOpenChange }) => {
  const [formData, setFormData] = useState({
    to: '',
    template: '',
    subject: '',
    message: '',
    attachments: [] as File[]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Sending email:', formData);
    // Send email logic here
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5" />
            <span>Compose Email</span>
          </DialogTitle>
          <DialogDescription>
            Send emails with document attachments and tracking
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="to">Recipients</Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="to"
                  value={formData.to}
                  onChange={(e) => setFormData({...formData, to: e.target.value})}
                  placeholder="Select recipients or enter emails"
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="template">Template</Label>
              <Select value={formData.template} onValueChange={(value) => setFormData({...formData, template: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select template (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting-invitation">Meeting Invitation</SelectItem>
                  <SelectItem value="document-review">Document Review Request</SelectItem>
                  <SelectItem value="voting-reminder">Voting Reminder</SelectItem>
                  <SelectItem value="attendance-followup">Attendance Follow-up</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({...formData, subject: e.target.value})}
              placeholder="Enter email subject"
              required
            />
          </div>

          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              placeholder="Type your message here..."
              rows={8}
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <Button type="button" variant="outline">
              <Paperclip className="h-4 w-4 mr-2" />
              Attach Files
            </Button>
            <div className="flex space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Save Draft
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                <Send className="h-4 w-4 mr-2" />
                Send Email
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
