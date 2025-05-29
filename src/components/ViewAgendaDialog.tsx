
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, MapPin } from 'lucide-react';

interface ViewAgendaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting: any;
}

export const ViewAgendaDialog: React.FC<ViewAgendaDialogProps> = ({ open, onOpenChange, meeting }) => {
  if (!meeting) return null;

  const agendaItems = [
    { time: '10:00 AM', item: 'Opening Prayer', duration: '5 min' },
    { time: '10:05 AM', item: 'Budget Review', duration: '30 min' },
    { time: '10:35 AM', item: 'New Project Proposals', duration: '45 min' },
    { time: '11:20 AM', item: 'Policy Updates', duration: '20 min' },
    { time: '11:40 AM', item: 'Q&A Session', duration: '15 min' },
    { time: '11:55 AM', item: 'Closing Remarks', duration: '5 min' }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{meeting.title} - Agenda</DialogTitle>
          <DialogDescription>
            Meeting scheduled for {meeting.date} at {meeting.time}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{meeting.duration}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{meeting.attendees} attendees</span>
            </div>
            <div className="flex items-center space-x-1">
              <MapPin className="h-4 w-4" />
              <span>{meeting.location}</span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Agenda Items</h3>
            {agendaItems.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{item.item}</div>
                  <div className="text-sm text-gray-500">{item.time}</div>
                </div>
                <Badge variant="outline">{item.duration}</Badge>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
