
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
    // Check if we're in a Capacitor native app
    const capacitorNative = !!(window.Capacitor && window.Capacitor.isNative);
    setIsNative(capacitorNative);
    return capacitorNative;
  };

  const initializeWebPush = async () => {
    try {
      // Check if browser supports all required APIs
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        console.log('Web Push API not fully supported');
        setIsSupported(false);
        return;
      }

      setIsSupported(true);
      
      // Check current permission status
      const permission = Notification.permission;
      setPermissionStatus(permission as any);
      
      // Register service worker
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully:', registration);
        
        if (permission === 'granted') {
          await createWebPushSubscription(registration);
        }
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        // Still mark as supported, user can try to enable manually
      }
    } catch (error) {
      console.error('Error initializing web push:', error);
      setIsSupported(false);
    }
  };

  const createWebPushSubscription = async (registration: ServiceWorkerRegistration) => {
    try {
      // Create a simple subscription (in production, you'd use VAPID keys)
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: null // In production, use your VAPID public key
      });
      
      const webToken = `web-push-${btoa(JSON.stringify(subscription.endpoint)).substring(0, 20)}-${Date.now()}`;
      setToken(webToken);
      
      if (user) {
        await savePushToken(webToken);
      }
    } catch (error) {
      console.error('Failed to create push subscription:', error);
      // Create a fallback token for testing
      const fallbackToken = `web-fallback-${Date.now()}`;
      setToken(fallbackToken);
      
      if (user) {
        await savePushToken(fallbackToken);
      }
    }
  };

  const initializeNativePush = async () => {
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      setIsSupported(true);
      
      // Check permission status
      const permResult = await PushNotifications.checkPermissions();
      setPermissionStatus(permResult.receive);

      if (permResult.receive === 'granted') {
        await PushNotifications.register();
        
        // Set up listeners
        PushNotifications.addListener('registration', async (token) => {
          console.log('Native push registration success:', token.value);
          setToken(token.value);
          
          if (user && token.value) {
            await savePushToken(token.value);
          }
        });

        PushNotifications.addListener('registrationError', (error) => {
          console.error('Native push registration error:', JSON.stringify(error));
          toast.error('Failed to register for push notifications');
        });

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Push notification received:', notification);
          
          toast.success(notification.title || 'New notification', {
            description: notification.body,
          });
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
          console.log('Push notification action performed:', notification);
          
          const data = notification.notification.data;
          if (data?.module) {
            window.location.hash = `#/${data.module}${data.id ? `/${data.id}` : ''}`;
          }
        });
      }
    } catch (error) {
      console.error('Capacitor PushNotifications not available:', error);
      setIsSupported(false);
    }
  };

  const initializePushNotifications = async () => {
    try {
      const native = checkPlatform();
      console.log('Platform detected:', native ? 'Native' : 'Web');
      
      if (native) {
        await initializeNativePush();
      } else {
        await initializeWebPush();
      }
    } catch (error) {
      console.error('Error initializing push notifications:', error);
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
      
      console.log('Push token saved successfully');
      toast.success('Push notifications enabled successfully');
    } catch (error) {
      console.error('Error saving push token:', error);
      toast.error('Failed to save notification settings');
    }
  };

  const requestPermission = async () => {
    try {
      if (isNative) {
        // Native app permission request
        try {
          const { PushNotifications } = await import('@capacitor/push-notifications');
          const result = await PushNotifications.requestPermissions();
          setPermissionStatus(result.receive);
          
          if (result.receive === 'granted') {
            await PushNotifications.register();
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
            // Re-initialize web push after permission granted
            await initializeWebPush();
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
    if (user) {
      initializePushNotifications();
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
