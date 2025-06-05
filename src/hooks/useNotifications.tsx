import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'meeting' | 'voting' | 'document' | 'email';
  read: boolean;
  created_at: string;
  related_id?: string;
  related_type?: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      // Fetch recent meetings (last 7 days)
      const { data: meetings } = await supabase
        .from('meetings')
        .select('*')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(3);

      // Fetch recent documents (last 7 days)
      const { data: documents } = await supabase
        .from('documents')
        .select('*')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(3);

      const notificationList: Notification[] = [];

      // Add meeting notifications
      meetings?.forEach(meeting => {
        const meetingTime = new Date(meeting.start_time);
        const now = new Date();
        const timeDiff = meetingTime.getTime() - now.getTime();
        const hoursUntilMeeting = timeDiff / (1000 * 60 * 60);

        // Add notification for newly created meetings
        notificationList.push({
          id: `meeting-${meeting.id}`,
          title: 'New Meeting Scheduled',
          message: `${meeting.title} scheduled for ${meetingTime.toLocaleDateString()}`,
          type: 'meeting',
          read: false,
          created_at: meeting.created_at,
          related_id: meeting.id,
          related_type: 'meeting'
        });

        // Add reminder for upcoming meetings (within 24 hours)
        if (hoursUntilMeeting > 0 && hoursUntilMeeting <= 24) {
          notificationList.push({
            id: `meeting-reminder-${meeting.id}`,
            title: 'Meeting Reminder',
            message: `${meeting.title} starts in ${Math.round(hoursUntilMeeting)} hours`,
            type: 'meeting',
            read: false,
            created_at: new Date().toISOString(),
            related_id: meeting.id,
            related_type: 'meeting'
          });
        }
      });

      // Add document notifications
      documents?.forEach(doc => {
        notificationList.push({
          id: `document-${doc.id}`,
          title: 'Document Shared',
          message: `New document "${doc.name}" has been uploaded`,
          type: 'document',
          read: false,
          created_at: doc.created_at,
          related_id: doc.id,
          related_type: 'document'
        });
      });

      // Sort by creation date and limit to 6 most recent
      const sortedNotifications = notificationList
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 6);

      // Only show unread notifications
      const unreadNotifications = sortedNotifications.filter(n => !n.read);
      setNotifications(unreadNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = () => {
    // Remove all notifications when marked as read
    setNotifications([]);
    toast({
      title: "Success",
      description: "All notifications marked as read"
    });
  };

  const markAsRead = (notificationId: string) => {
    // Remove the specific notification when marked as read
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    
    // Return navigation info for the parent component to handle
    return {
      type: notification.related_type,
      id: notification.related_id
    };
  };

  const getUnreadCount = () => {
    // Since we only keep unread notifications, the count is just the length
    const unreadCount = notifications.length;
    console.log('Unread notifications count:', unreadCount, 'Total notifications:', notifications.length);
    return unreadCount;
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  return {
    notifications,
    loading,
    markAllAsRead,
    markAsRead,
    handleNotificationClick,
    getUnreadCount,
    getTimeAgo,
    fetchNotifications
  };
};
