
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'prompt-with-rationale'>('prompt');
  const [isNative, setIsNative] = useState(false);
  const { user } = useAuth();

  const checkPlatform = () => {
    // Safe check for Capacitor with iOS 18.5 compatibility
    const capacitorNative = typeof window !== 'undefined' && 
                           window.Capacitor && 
                           window.Capacitor.isNative === true;
    setIsNative(capacitorNative);
    console.log('Platform detected:', capacitorNative ? 'Native' : 'Web');
    return capacitorNative;
  };

  const initializeNativePush = async () => {
    try {
      console.log('Initializing native push notifications...');
      
      // Import Capacitor plugins dynamically to avoid iOS crashes
      const { PushNotifications } = await import('@capacitor/push-notifications');
      setIsSupported(true);
      
      // Check permission status first
      const permResult = await PushNotifications.checkPermissions();
      console.log('Push permission status:', permResult.receive);
      setPermissionStatus(permResult.receive);

      if (permResult.receive === 'granted') {
        // Register for push notifications
        await PushNotifications.register();
        
        // Set up listeners with error handling
        PushNotifications.addListener('registration', async (token) => {
          console.log('Native push registration success:', token.value);
          setToken(token.value);
          
          if (user && token.value) {
            await savePushToken(token.value);
          }
        });

        PushNotifications.addListener('registrationError', (error) => {
          console.error('Native push registration error:', error);
          // Don't show error toast for iOS 18.5 compatibility issues
          console.log('Push notifications may not be available on this device');
        });

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Push received:', notification);
          toast.success(notification.title || 'New notification', {
            description: notification.body,
          });
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
          console.log('Push action performed:', notification);
          const data = notification.notification.data;
          if (data?.module) {
            window.location.hash = `#/${data.module}${data.id ? `/${data.id}` : ''}`;
          }
        });
      }
    } catch (error) {
      console.log('Push notifications not available:', error);
      // Fail silently for iOS 18.5 compatibility
      setIsSupported(false);
    }
  };

  const initializeWebPush = async () => {
    try {
      if (typeof window === 'undefined' || typeof navigator === 'undefined') {
        setIsSupported(false);
        return;
      }

      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        console.log('Web Push not supported');
        setIsSupported(false);
        return;
      }

      setIsSupported(true);
      const permission = Notification.permission;
      setPermissionStatus(permission as any);
      
      // Register service worker only for web
      if (!isNative) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('Service Worker registered for web');
          
          if (permission === 'granted') {
            const fallbackToken = `web-${Date.now()}`;
            setToken(fallbackToken);
            if (user) await savePushToken(fallbackToken);
          }
        } catch (error) {
          console.log('Service Worker registration failed:', error);
        }
      }
    } catch (error) {
      console.error('Web push initialization error:', error);
      setIsSupported(false);
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
      console.log('Push token saved');
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  };

  const requestPermission = async () => {
    try {
      if (isNative) {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        const result = await PushNotifications.requestPermissions();
        setPermissionStatus(result.receive);
        
        if (result.receive === 'granted') {
          await PushNotifications.register();
        }
      } else {
        if ('Notification' in window) {
          const permission = await Notification.requestPermission();
          setPermissionStatus(permission as any);
          
          if (permission === 'granted') {
            await initializeWebPush();
          }
        }
      }
    } catch (error) {
      console.error('Permission request error:', error);
    }
  };

  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        const native = checkPlatform();
        if (native) {
          initializeNativePush();
        } else {
          initializeWebPush();
        }
      }, 2000); // Increased delay for iOS 18.5 stability
      
      return () => clearTimeout(timer);
    }
  }, [user]);

  return {
    isSupported,
    token,
    permissionStatus,
    requestPermission,
    isNative
  };
};
