
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Clock, UserCheck, AlertCircle } from 'lucide-react';
import { useAttendance } from '@/hooks/useAttendance';
import { useAuth } from '@/hooks/useAuth';

interface PostMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting: any;
}

export const PostMeetingDialog: React.FC<PostMeetingDialogProps> = ({ open, onOpenChange, meeting }) => {
  const [status, setStatus] = useState<'present' | 'left_early' | 'absent'>('present');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { markAttendance } = useAttendance();
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!user || !meeting) return;

    setLoading(true);
    try {
      const now = new Date();
      const meetingStart = new Date(meeting.start_time);
      
      const success = await markAttendance({
        meetingId: meeting.id,
        userId: user.id,
        status,
        type: meeting.meeting_type === 'online' ? 'online' : 'physical',
        joinTime: status !== 'absent' ? meetingStart : undefined,
        leaveTime: status === 'left_early' ? now : new Date(meeting.end_time),
        notes
      });

      if (success) {
        onOpenChange(false);
        setNotes('');
      }
    } catch (error) {
      console.error('Post-meeting attendance error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!meeting) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Post-Meeting Attendance</span>
          </DialogTitle>
          <DialogDescription>
            Please confirm your attendance for: {meeting.title}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-orange-700">
                This meeting has ended. Please confirm your attendance status.
              </span>
            </div>
          </div>

          {/* Status Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Did you attend this meeting?</label>
            <div className="space-y-2">
              <Button
                variant={status === 'present' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatus('present')}
                className={`w-full justify-start ${status === 'present' ? 'bg-success hover:bg-success/90' : ''}`}
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Yes, I attended the full meeting
              </Button>
              <Button
                variant={status === 'left_early' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatus('left_early')}
                className={`w-full justify-start ${status === 'left_early' ? 'bg-warning hover:bg-warning/90' : ''}`}
              >
                <Clock className="h-4 w-4 mr-2" />
                I attended but left early
              </Button>
              <Button
                variant={status === 'absent' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatus('absent')}
                className={`w-full justify-start ${status === 'absent' ? 'bg-error hover:bg-error/90' : ''}`}
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                No, I was absent
              </Button>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {status === 'absent' ? 'Reason for absence (Optional)' : 'Additional Notes (Optional)'}
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                status === 'absent' 
                  ? "Please provide a reason for your absence..." 
                  : status === 'left_early'
                  ? "What time did you leave and why?"
                  : "Any additional notes about the meeting..."
              }
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={loading}
              className="bg-primary hover:bg-primary/90"
            >
              {loading ? 'Submitting...' : 'Submit Attendance'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
