
import { useState, useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Device } from '@capacitor/device';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const { user } = useAuth();

  const initializePushNotifications = async () => {
    try {
      const info = await Device.getInfo();
      
      // Check if push notifications are supported
      if (info.platform === 'web') {
        // Web push notifications
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          setIsSupported(true);
        }
      } else {
        // Native push notifications
        setIsSupported(true);
      }

      if (!isSupported) return;

      // Request permission
      const permResult = await PushNotifications.requestPermissions();
      setPermissionStatus(permResult.receive);

      if (permResult.receive === 'granted') {
        // Register for push notifications
        await PushNotifications.register();
        
        // Set up listeners
        PushNotifications.addListener('registration', async (token) => {
          console.log('Push registration success, token: ' + token.value);
          setToken(token.value);
          
          // Save token to database if user is logged in
          if (user && token.value) {
            await savePushToken(token.value);
          }
        });

        PushNotifications.addListener('registrationError', (error) => {
          console.error('Error on registration: ' + JSON.stringify(error));
          toast.error('Failed to register for push notifications');
        });

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Push notification received: ', notification);
          
          // Show local notification if app is in foreground
          toast.success(notification.title || 'New notification', {
            description: notification.body,
          });
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
          console.log('Push notification action performed', notification);
          
          // Handle notification tap - you can navigate to specific screens here
          const data = notification.notification.data;
          if (data?.module) {
            // Navigate to specific module
            window.location.hash = `#/${data.module}${data.id ? `/${data.id}` : ''}`;
          }
        });
      }
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  };

  const savePushToken = async (pushToken: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          push_token: pushToken,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) throw error;
      
      console.log('Push token saved successfully');
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  };

  const requestPermission = async () => {
    try {
      const result = await PushNotifications.requestPermissions();
      setPermissionStatus(result.receive);
      
      if (result.receive === 'granted') {
        await PushNotifications.register();
        toast.success('Push notifications enabled successfully');
      } else {
        toast.error('Push notification permission denied');
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      toast.error('Failed to request notification permission');
    }
  };

  useEffect(() => {
    initializePushNotifications();
  }, [user]);

  return {
    isSupported,
    token,
    permissionStatus,
    requestPermission,
  };
};
