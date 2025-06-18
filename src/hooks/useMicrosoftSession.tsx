
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

interface MicrosoftSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  userInfo: {
    displayName: string;
    mail: string;
    id: string;
  };
}

export const useMicrosoftSession = () => {
  const [session, setSession] = useState<MicrosoftSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Check for existing browser session
  const checkBrowserSession = useCallback(async () => {
    if (!user) return null;

    try {
      // Check localStorage for cached session
      const cachedSession = localStorage.getItem(`ms_session_${user.id}`);
      if (cachedSession) {
        const parsed: MicrosoftSession = JSON.parse(cachedSession);
        
        // Check if token is still valid (with 5-minute buffer)
        if (parsed.expiresAt > Date.now() + 5 * 60 * 1000) {
          return parsed;
        }
        
        // Try to refresh if expired
        if (parsed.refreshToken) {
          return await refreshToken(parsed.refreshToken);
        }
      }
    } catch (error) {
      console.warn('Failed to check browser session:', error);
    }
    
    return null;
  }, [user]);

  // Silent token refresh
  const refreshToken = useCallback(async (refreshToken: string): Promise<MicrosoftSession | null> => {
    if (!user) return null;

    try {
      const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: '44391516-babe-4072-8422-a4fc8a79fbde',
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          scope: 'https://graph.microsoft.com/User.Read https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Calendars.ReadWrite https://graph.microsoft.com/Files.ReadWrite.All offline_access'
        })
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      
      // Fetch user info with new token
      const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          'Authorization': `Bearer ${data.access_token}`
        }
      });

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user info');
      }

      const userInfo = await userResponse.json();

      const newSession: MicrosoftSession = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken,
        expiresAt: Date.now() + (data.expires_in - 300) * 1000, // 5-minute buffer
        userInfo: {
          displayName: userInfo.displayName,
          mail: userInfo.mail || userInfo.userPrincipalName,
          id: userInfo.id
        }
      };

      // Cache the session
      localStorage.setItem(`ms_session_${user.id}`, JSON.stringify(newSession));
      
      return newSession;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Clear invalid session
      localStorage.removeItem(`ms_session_${user.id}`);
      return null;
    }
  }, [user]);

  // Initialize session on mount
  useEffect(() => {
    const initializeSession = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const existingSession = await checkBrowserSession();
        if (existingSession) {
          setSession(existingSession);
          // Schedule next refresh
          scheduleTokenRefresh(existingSession);
        }
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    initializeSession();
  }, [user, checkBrowserSession]);

  // Schedule automatic token refresh
  const scheduleTokenRefresh = useCallback((currentSession: MicrosoftSession) => {
    const now = Date.now();
    const timeUntilRefresh = currentSession.expiresAt - now - 5 * 60 * 1000; // 5 minutes before expiry

    if (timeUntilRefresh > 0) {
      setTimeout(async () => {
        const refreshed = await refreshToken(currentSession.refreshToken);
        if (refreshed) {
          setSession(refreshed);
          scheduleTokenRefresh(refreshed);
        } else {
          setSession(null);
          setError('Session expired. Please sign in again.');
        }
      }, timeUntilRefresh);
    }
  }, [refreshToken]);

  // Start new authentication flow
  const startAuth = useCallback(async () => {
    if (!user) {
      setError('User must be signed in first');
      return;
    }

    // Clear any existing session
    localStorage.removeItem(`ms_session_${user.id}`);
    setSession(null);
    setError(null);

    // Prepare auth parameters
    const state = user.id;
    const nonce = Math.random().toString(36).substring(2, 15);
    const redirectUri = `${window.location.origin}/microsoft/callback`;

    // Store session data
    sessionStorage.setItem('microsoft_auth_user_id', state);
    sessionStorage.setItem('microsoft_auth_nonce', nonce);
    sessionStorage.setItem('microsoft_auth_timestamp', Date.now().toString());

    const authParams = new URLSearchParams({
      client_id: '44391516-babe-4072-8422-a4fc8a79fbde',
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: 'https://graph.microsoft.com/User.Read https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Calendars.ReadWrite https://graph.microsoft.com/Files.ReadWrite.All offline_access openid profile email',
      response_mode: 'query',
      state: state,
      nonce: nonce,
      prompt: 'consent'
    });

    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${authParams.toString()}`;
    window.location.href = authUrl;
  }, [user]);

  // Store session after successful auth
  const storeSession = useCallback((sessionData: MicrosoftSession) => {
    if (!user) return;

    setSession(sessionData);
    setError(null);
    localStorage.setItem(`ms_session_${user.id}`, JSON.stringify(sessionData));
    scheduleTokenRefresh(sessionData);
  }, [user, scheduleTokenRefresh]);

  // Clear session
  const clearSession = useCallback(() => {
    if (user) {
      localStorage.removeItem(`ms_session_${user.id}`);
    }
    setSession(null);
    setError(null);
  }, [user]);

  return {
    session,
    loading,
    error,
    isConnected: !!session,
    startAuth,
    storeSession,
    clearSession,
    refreshToken: session ? () => refreshToken(session.refreshToken) : null
  };
};
