
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Send, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Member {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  created_at: string;
  roles: string[];
}

interface MemberMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member;
}

export const MemberMessageDialog: React.FC<MemberMessageDialogProps> = ({
  open,
  onOpenChange,
  member
}) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = async () => {
    if (!subject.trim() || !message.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in both subject and message",
        variant: "destructive"
      });
      return;
    }

    setSending(true);
    
    try {
      // TODO: Implement actual message sending functionality
      // This would typically involve calling an API or edge function
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast({
        title: "Message Sent",
        description: `Message sent to ${member.first_name} ${member.last_name} successfully`
      });
      
      setSubject('');
      setMessage('');
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Failed to Send",
        description: "There was an error sending the message",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <span>Send Message</span>
          </DialogTitle>
          <DialogDescription>
            Send a direct message to {member.first_name} {member.last_name} ({member.email})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Enter message subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Type your message here..."
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div className="flex space-x-2 pt-4">
            <Button 
              onClick={handleSendMessage}
              disabled={sending}
              className="flex-1"
            >
              <Send className="h-4 w-4 mr-2" />
              {sending ? 'Sending...' : 'Send Message'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={sending}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
