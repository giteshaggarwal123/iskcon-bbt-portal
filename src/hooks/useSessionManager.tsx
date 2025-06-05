
import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useSessionManager = () => {
  const { user } = useAuth();

  // Generate a unique session ID for this browser session
  const getSessionId = useCallback(() => {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  }, []);

  // Get device and browser information
  const getDeviceInfo = useCallback(() => {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screen: {
        width: screen.width,
        height: screen.height
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }, []);

  // Register or update current session
  const registerSession = useCallback(async () => {
    if (!user) return;

    try {
      const sessionId = getSessionId();
      const deviceInfo = getDeviceInfo();
      
      console.log('Registering session for user:', user.id);
      
      // Call the enforce_session_limit function
      const { error } = await supabase.rpc('enforce_session_limit', {
        _user_id: user.id,
        _session_id: sessionId,
        _device_info: deviceInfo,
        _ip_address: null, // IP will be handled by the server
        _user_agent: navigator.userAgent
      });

      if (error) {
        console.error('Error registering session:', error);
      } else {
        console.log('Session registered successfully');
      }
    } catch (error) {
      console.error('Session registration error:', error);
    }
  }, [user, getSessionId, getDeviceInfo]);

  // Update session activity
  const updateSessionActivity = useCallback(async () => {
    if (!user) return;

    try {
      const sessionId = getSessionId();
      
      const { error } = await supabase
        .from('user_sessions')
        .update({ 
          last_active: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        })
        .eq('user_id', user.id)
        .eq('session_id', sessionId);

      if (error) {
        console.error('Error updating session activity:', error);
      }
    } catch (error) {
      console.error('Session activity update error:', error);
    }
  }, [user, getSessionId]);

  // Get active sessions for current user
  const getActiveSessions = useCallback(async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gt('expires_at', new Date().toISOString())
        .order('last_active', { ascending: false });

      if (error) {
        console.error('Error fetching active sessions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Session fetch error:', error);
      return [];
    }
  }, [user]);

  // Register session when user logs in
  useEffect(() => {
    if (user) {
      registerSession();
    }
  }, [user, registerSession]);

  // Update session activity periodically
  useEffect(() => {
    if (!user) return;

    // Update activity immediately
    updateSessionActivity();

    // Set up periodic updates every 5 minutes
    const interval = setInterval(updateSessionActivity, 5 * 60 * 1000);

    // Update activity on page visibility change
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateSessionActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, updateSessionActivity]);

  return {
    registerSession,
    updateSessionActivity,
    getActiveSessions,
    getSessionId
  };
};
