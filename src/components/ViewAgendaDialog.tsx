
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, MapPin, Video, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface ViewAgendaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting: any;
}

export const ViewAgendaDialog: React.FC<ViewAgendaDialogProps> = ({ open, onOpenChange, meeting }) => {
  if (!meeting) return null;

  const startTime = new Date(meeting.start_time);
  const endTime = new Date(meeting.end_time);
  const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  
  let durationText = '';
  if (hours > 0) durationText += `${hours}h `;
  if (minutes > 0) durationText += `${minutes}m`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{meeting.title}</DialogTitle>
          <DialogDescription>
            Meeting scheduled for {format(startTime, 'MMMM dd, yyyy')} at {format(startTime, 'h:mm a')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{durationText.trim() || '0m'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{meeting.attendees?.length || 0} attendees</span>
            </div>
            <div className="flex items-center space-x-1">
              <MapPin className="h-4 w-4" />
              <span>{meeting.location || 'No location specified'}</span>
            </div>
            {meeting.meeting_type && (
              <Badge variant="outline">{meeting.meeting_type}</Badge>
            )}
          </div>

          {meeting.description && (
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">Description</h3>
              <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{meeting.description}</p>
            </div>
          )}

          {meeting.teams_join_url && (
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">Meeting Link</h3>
              <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                <Video className="h-4 w-4 text-blue-600" />
                <a 
                  href={meeting.teams_join_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Join Microsoft Teams Meeting
                </a>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Meeting Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Start Time:</span>
                <div className="font-medium">{format(startTime, 'MMMM dd, yyyy h:mm a')}</div>
              </div>
              <div>
                <span className="text-gray-500">End Time:</span>
                <div className="font-medium">{format(endTime, 'MMMM dd, yyyy h:mm a')}</div>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>
                <div className="font-medium">{meeting.status || 'Scheduled'}</div>
              </div>
              <div>
                <span className="text-gray-500">Type:</span>
                <div className="font-medium">{meeting.meeting_type || 'Not specified'}</div>
              </div>
            </div>
          </div>

          {meeting.outlook_event_id && (
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-green-600" />
                <span className="text-green-700 text-sm">This meeting has been added to your Outlook calendar</span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
