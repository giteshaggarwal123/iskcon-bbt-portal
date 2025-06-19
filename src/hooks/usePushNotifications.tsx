
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'prompt-with-rationale'>('prompt');
  const { user } = useAuth();

  const initializePushNotifications = async () => {
    try {
      // Check if we're in a Capacitor native app
      const isNative = window.Capacitor?.isNative;
      
      if (isNative) {
        // Native mobile app - use Capacitor push notifications
        try {
          const { PushNotifications } = await import('@capacitor/push-notifications');
          setIsSupported(true);
          
          // Request permission
          const permResult = await PushNotifications.requestPermissions();
          setPermissionStatus(permResult.receive);

          if (permResult.receive === 'granted') {
            await PushNotifications.register();
            
            // Set up listeners
            PushNotifications.addListener('registration', async (token) => {
              console.log('Push registration success, token: ' + token.value);
              setToken(token.value);
              
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
              
              toast.success(notification.title || 'New notification', {
                description: notification.body,
              });
            });

            PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
              console.log('Push notification action performed', notification);
              
              const data = notification.notification.data;
              if (data?.module) {
                window.location.hash = `#/${data.module}${data.id ? `/${data.id}` : ''}`;
              }
            });
          }
        } catch (error) {
          console.log('Capacitor PushNotifications not available:', error);
          setIsSupported(false);
        }
      } else {
        // Web browser - use Web Push API
        if ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) {
          setIsSupported(true);
          
          // Check current permission status
          const permission = Notification.permission;
          setPermissionStatus(permission as any);
          
          if (permission === 'granted') {
            await registerServiceWorker();
          }
        } else {
          console.log('Web Push API not supported');
          setIsSupported(false);
        }
      }
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      setIsSupported(false);
    }
  };

  const registerServiceWorker = async () => {
    try {
      // Register service worker for web push
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
      
      // You would typically get a push subscription here
      // For now, we'll just set a placeholder token
      const mockToken = `web-push-${Date.now()}`;
      setToken(mockToken);
      
      if (user) {
        await savePushToken(mockToken);
      }
    } catch (error) {
      console.error('Service Worker registration failed:', error);
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
      const isNative = window.Capacitor?.isNative;
      
      if (isNative) {
        // Native app permission request
        try {
          const { PushNotifications } = await import('@capacitor/push-notifications');
          const result = await PushNotifications.requestPermissions();
          setPermissionStatus(result.receive);
          
          if (result.receive === 'granted') {
            await PushNotifications.register();
            toast.success('Push notifications enabled successfully');
          } else {
            toast.error('Push notification permission denied');
          }
        } catch (error) {
          console.error('Error requesting native permission:', error);
          toast.error('Failed to request notification permission');
        }
      } else {
        // Web browser permission request
        if ('Notification' in window) {
          const permission = await Notification.requestPermission();
          setPermissionStatus(permission as any);
          
          if (permission === 'granted') {
            await registerServiceWorker();
            toast.success('Push notifications enabled successfully');
          } else {
            toast.error('Push notification permission denied');
          }
        } else {
          toast.error('Notifications not supported in this browser');
        }
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
