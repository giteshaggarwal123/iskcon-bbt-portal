
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
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());
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

      // Fetch recent polls (last 7 days)
      const { data: polls } = await supabase
        .from('polls')
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

      // Add poll notifications
      polls?.forEach(poll => {
        notificationList.push({
          id: `poll-${poll.id}`,
          title: 'New Poll Available',
          message: `Vote on "${poll.title}" - Deadline: ${new Date(poll.deadline).toLocaleDateString()}`,
          type: 'voting',
          read: false,
          created_at: poll.created_at,
          related_id: poll.id,
          related_type: 'voting'
        });
      });

      // Sort by creation date and limit to 6 most recent
      const sortedNotifications = notificationList
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 6);

      // Filter out notifications that have been marked as read
      const unreadNotifications = sortedNotifications.filter(n => !readNotifications.has(n.id));
      setNotifications(unreadNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendPushNotification = async (title: string, message: string, data?: any, userIds?: string[]) => {
    try {
      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          title,
          body: message,
          data,
          userIds: userIds || [user?.id]
        }
      });

      if (error) throw error;
      console.log('Push notification sent successfully');
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  };

  const markAllAsRead = () => {
    // Add all current notification IDs to read set
    const newReadNotifications = new Set(readNotifications);
    notifications.forEach(n => newReadNotifications.add(n.id));
    setReadNotifications(newReadNotifications);
    
    // Clear notifications list
    setNotifications([]);
    toast({
      title: "Success",
      description: "All notifications marked as read"
    });
  };

  const markAsRead = (notificationId: string) => {
    // Add to read notifications set
    setReadNotifications(prev => new Set([...prev, notificationId]));
    
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
    // The count is the length of currently displayed notifications
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
  }, [user, readNotifications]);

  return {
    notifications,
    loading,
    markAllAsRead,
    markAsRead,
    handleNotificationClick,
    getUnreadCount,
    getTimeAgo,
    fetchNotifications,
    sendPushNotification
  };
};
