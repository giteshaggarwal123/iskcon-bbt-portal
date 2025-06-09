
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, MapPin, Video, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';

interface ViewAgendaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting: any;
}

export const ViewAgendaDialog: React.FC<ViewAgendaDialogProps> = ({ open, onOpenChange, meeting }) => {
  const isMobile = useIsMobile();
  
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
      <DialogContent className={`${
        isMobile 
          ? 'w-[95vw] h-[90vh] max-w-none max-h-none m-2 p-4' 
          : 'sm:max-w-[600px] max-h-[90vh]'
      } overflow-y-auto`}>
        <DialogHeader className={isMobile ? 'space-y-2' : ''}>
          <DialogTitle className={isMobile ? 'text-lg' : ''}>{meeting.title}</DialogTitle>
          <DialogDescription className={isMobile ? 'text-sm' : ''}>
            Meeting scheduled for {format(startTime, 'MMMM dd, yyyy')} at {format(startTime, 'h:mm a')}
          </DialogDescription>
        </DialogHeader>
        
        <div className={`space-y-4 ${isMobile ? 'text-sm' : ''}`}>
          <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'items-center space-x-4'} text-sm text-gray-600`}>
            <div className="flex items-center space-x-1">
              <Clock className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
              <span>{durationText.trim() || '0m'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
              <span>{meeting.attendees?.length || 0} attendees</span>
            </div>
            <div className="flex items-center space-x-1">
              <MapPin className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
              <span className={isMobile ? 'text-xs' : ''}>{meeting.location || 'No location specified'}</span>
            </div>
            {meeting.meeting_type && (
              <Badge variant="outline" className={isMobile ? 'text-xs' : ''}>{meeting.meeting_type}</Badge>
            )}
          </div>

          {meeting.description && (
            <div className="space-y-2">
              <h3 className={`font-semibold text-gray-900 ${isMobile ? 'text-sm' : ''}`}>Description</h3>
              <p className={`text-gray-700 bg-gray-50 rounded-lg ${isMobile ? 'p-2 text-xs' : 'p-3'}`}>{meeting.description}</p>
            </div>
          )}

          {meeting.teams_join_url && (
            <div className="space-y-2">
              <h3 className={`font-semibold text-gray-900 ${isMobile ? 'text-sm' : ''}`}>Meeting Link</h3>
              <div className={`flex items-center space-x-2 bg-blue-50 rounded-lg ${isMobile ? 'p-2' : 'p-3'}`}>
                <Video className={`text-blue-600 ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                <a 
                  href={meeting.teams_join_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`text-blue-600 hover:text-blue-800 underline break-all ${isMobile ? 'text-xs' : ''}`}
                >
                  Join Microsoft Teams Meeting
                </a>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h3 className={`font-semibold text-gray-900 ${isMobile ? 'text-sm' : ''}`}>Meeting Details</h3>
            <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-4'} text-sm`}>
              <div>
                <span className={`text-gray-500 ${isMobile ? 'text-xs' : ''}`}>Start Time:</span>
                <div className={`font-medium ${isMobile ? 'text-xs' : ''}`}>{format(startTime, 'MMMM dd, yyyy h:mm a')}</div>
              </div>
              <div>
                <span className={`text-gray-500 ${isMobile ? 'text-xs' : ''}`}>End Time:</span>
                <div className={`font-medium ${isMobile ? 'text-xs' : ''}`}>{format(endTime, 'MMMM dd, yyyy h:mm a')}</div>
              </div>
              <div>
                <span className={`text-gray-500 ${isMobile ? 'text-xs' : ''}`}>Status:</span>
                <div className={`font-medium ${isMobile ? 'text-xs' : ''}`}>{meeting.status || 'Scheduled'}</div>
              </div>
              <div>
                <span className={`text-gray-500 ${isMobile ? 'text-xs' : ''}`}>Type:</span>
                <div className={`font-medium ${isMobile ? 'text-xs' : ''}`}>{meeting.meeting_type || 'Not specified'}</div>
              </div>
            </div>
          </div>

          {meeting.outlook_event_id && (
            <div className={`bg-green-50 rounded-lg ${isMobile ? 'p-2' : 'p-3'}`}>
              <div className="flex items-center space-x-2">
                <Calendar className={`text-green-600 ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                <span className={`text-green-700 ${isMobile ? 'text-xs' : 'text-sm'}`}>This meeting has been added to your Outlook calendar</span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
