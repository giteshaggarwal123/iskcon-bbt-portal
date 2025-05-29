
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Check, Clock, Vote, Calendar, FileText } from 'lucide-react';

interface NotificationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NotificationsDialog: React.FC<NotificationsDialogProps> = ({ open, onOpenChange }) => {
  const notifications = [
    {
      id: 1,
      title: 'New Meeting Scheduled',
      message: 'Monthly Bureau Meeting scheduled for Jan 25, 2024',
      type: 'meeting',
      time: '2 hours ago',
      read: false
    },
    {
      id: 2,
      title: 'Voting Reminder',
      message: 'Temple Expansion Budget voting closes in 2 days',
      type: 'voting',
      time: '4 hours ago',
      read: false
    },
    {
      id: 3,
      title: 'Document Shared',
      message: 'New policy document has been shared with you',
      type: 'document',
      time: '1 day ago',
      read: true
    },
    {
      id: 4,
      title: 'Meeting Reminder',
      message: 'Emergency Committee meeting in 30 minutes',
      type: 'meeting',
      time: '1 day ago',
      read: true
    }
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'meeting':
        return <Calendar className="h-5 w-5 text-primary" />;
      case 'voting':
        return <Vote className="h-5 w-5 text-warning" />;
      case 'document':
        return <FileText className="h-5 w-5 text-success" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Notifications</span>
            <Badge className="bg-primary text-white">7 new</Badge>
          </DialogTitle>
          <DialogDescription>
            Stay updated with all platform activities
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {notifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`p-4 rounded-lg border ${notification.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'}`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className={`text-sm font-medium ${!notification.read ? 'font-semibold' : ''}`}>
                      {notification.title}
                    </h4>
                    <div className="flex items-center space-x-2">
                      {!notification.read && (
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                      )}
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">{notification.time}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" size="sm">
            <Check className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
