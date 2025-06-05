
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Check, Clock, Vote, Calendar, FileText } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate?: (module: string, id?: string) => void;
}

export const NotificationsDialog: React.FC<NotificationsDialogProps> = ({ 
  open, 
  onOpenChange,
  onNavigate 
}) => {
  const { 
    notifications, 
    loading, 
    markAllAsRead, 
    handleNotificationClick, 
    getUnreadCount,
    getTimeAgo 
  } = useNotifications();

  const getIcon = (type: string) => {
    switch (type) {
      case 'meeting':
        return <Calendar className="h-5 w-5 text-primary" />;
      case 'voting':
        return <Vote className="h-5 w-5 text-orange-500" />;
      case 'document':
        return <FileText className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const handleNotificationItemClick = (notification: any) => {
    const navInfo = handleNotificationClick(notification);
    
    if (onNavigate && navInfo) {
      let module = 'dashboard';
      
      switch (navInfo.type) {
        case 'meeting':
          module = 'meetings';
          break;
        case 'document':
          module = 'documents';
          break;
        case 'voting':
          module = 'voting';
          break;
        default:
          module = 'dashboard';
      }
      
      onNavigate(module, navInfo.id);
    }
  };

  const unreadCount = getUnreadCount();

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notifications</span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <Badge className="bg-primary text-white">{unreadCount} new</Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Stay updated with all platform activities
          </DialogDescription>
        </DialogHeader>
        
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No notifications yet</p>
            <p className="text-sm">You'll see updates here when activities happen</p>
          </div>
        ) : (
          <>
            <ScrollArea className="h-96 pr-4">
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`p-4 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors ${
                      notification.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                    }`}
                    onClick={() => handleNotificationItemClick(notification)}
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
                            <span className="text-xs text-gray-500">
                              {getTimeAgo(notification.created_at)}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex justify-start pt-4 border-t">
              <Button 
                variant="outline" 
                size="sm"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                <Check className="h-4 w-4 mr-2" />
                Mark All Read
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
