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

  // Get the current origin dynamically
  const getCurrentOrigin = useCallback(() => {
    return window.location.origin;
  }, []);

  // Get the correct redirect URI
  const getRedirectUri = useCallback(() => {
    const origin = getCurrentOrigin();
    const redirectUri = `${origin}/microsoft/callback`;
    console.log('Microsoft redirect URI:', redirectUri);
    return redirectUri;
  }, [getCurrentOrigin]);

  // Check for existing browser session
  const checkBrowserSession = useCallback(async () => {
    if (!user) return null;

    try {
      const cachedSession = localStorage.getItem(`ms_session_${user.id}`);
      if (cachedSession) {
        const parsed: MicrosoftSession = JSON.parse(cachedSession);
        
        if (parsed.expiresAt > Date.now() + 5 * 60 * 1000) {
          console.log('Found valid cached Microsoft session');
          return parsed;
        }
        
        if (parsed.refreshToken) {
          const refreshed = await refreshToken(parsed.refreshToken);
          if (refreshed) {
            return refreshed;
          }
        }
        
        localStorage.removeItem(`ms_session_${user.id}`);
      }
    } catch (error) {
      console.warn('Failed to check browser session:', error);
      try {
        localStorage.removeItem(`ms_session_${user.id}`);
      } catch (e) {
        console.warn('Failed to clear corrupted session:', e);
      }
    }
    
    return null;
  }, [user]);

  // Token refresh function
  const refreshToken = useCallback(async (refreshToken: string): Promise<MicrosoftSession | null> => {
    if (!user) return null;

    try {
      console.log('Attempting to refresh Microsoft token');
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
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const data = await response.json();
      
      const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          'Authorization': `Bearer ${data.access_token}`
        }
      });

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user info after token refresh');
      }

      const userInfo = await userResponse.json();

      const newSession: MicrosoftSession = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken,
        expiresAt: Date.now() + (data.expires_in - 300) * 1000,
        userInfo: {
          displayName: userInfo.displayName,
          mail: userInfo.mail || userInfo.userPrincipalName,
          id: userInfo.id
        }
      };

      localStorage.setItem(`ms_session_${user.id}`, JSON.stringify(newSession));
      console.log('Microsoft token refreshed successfully');
      
      return newSession;
    } catch (error) {
      console.error('Token refresh failed:', error);
      try {
        localStorage.removeItem(`ms_session_${user.id}`);
      } catch (e) {
        console.warn('Failed to clear invalid session after refresh failure:', e);
      }
      return null;
    }
  }, [user]);

  // Initialize session on mount
  useEffect(() => {
    const initializeSession = async () => {
      if (!user) {
        setLoading(false);
        setSession(null);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log('Initializing Microsoft session for user:', user.id);
        const existingSession = await checkBrowserSession();
        if (existingSession) {
          setSession(existingSession);
          scheduleTokenRefresh(existingSession);
        } else {
          setSession(null);
        }
      } catch (error: any) {
        console.error('Session initialization error:', error);
        setError(error.message);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    initializeSession();
  }, [user, checkBrowserSession]);

  // Schedule automatic token refresh
  const scheduleTokenRefresh = useCallback((currentSession: MicrosoftSession) => {
    const now = Date.now();
    const timeUntilRefresh = currentSession.expiresAt - now - 5 * 60 * 1000;

    if (timeUntilRefresh > 0) {
      console.log(`Scheduling Microsoft token refresh in ${Math.round(timeUntilRefresh / 1000)} seconds`);
      setTimeout(async () => {
        console.log('Executing scheduled Microsoft token refresh');
        const refreshed = await refreshToken(currentSession.refreshToken);
        if (refreshed) {
          setSession(refreshed);
          scheduleTokenRefresh(refreshed);
        } else {
          console.log('Scheduled refresh failed, clearing session');
          setSession(null);
          setError('Session expired. Please sign in again.');
        }
      }, timeUntilRefresh);
    }
  }, [refreshToken]);

  // Updated startAuth function with better CSP handling
  const startAuth = useCallback(async () => {
    if (!user) {
      setError('User must be signed in first');
      return;
    }

    try {
      localStorage.removeItem(`ms_session_${user.id}`);
    } catch (e) {
      console.warn('Failed to clear existing session:', e);
    }
    
    setSession(null);
    setError(null);

    const state = user.id;
    const nonce = Math.random().toString(36).substring(2, 15);
    const redirectUri = getRedirectUri();

    console.log('Microsoft auth configuration:', {
      clientId: '44391516-babe-4072-8422-a4fc8a79fbde',
      redirectUri,
      state,
      origin: getCurrentOrigin(),
      timestamp: new Date().toISOString()
    });

    try {
      sessionStorage.setItem('microsoft_auth_user_id', state);
      sessionStorage.setItem('microsoft_auth_nonce', nonce);
      sessionStorage.setItem('microsoft_auth_timestamp', Date.now().toString());
    } catch (e) {
      console.error('Failed to store session data:', e);
      throw new Error('Unable to store session data. Please enable cookies and try again.');
    }

    // Build auth URL with proper parameters
    const authParams = new URLSearchParams({
      client_id: '44391516-babe-4072-8422-a4fc8a79fbde',
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: 'openid profile email offline_access https://graph.microsoft.com/User.Read https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Calendars.ReadWrite https://graph.microsoft.com/Files.ReadWrite.All',
      response_mode: 'query',
      state: state,
      nonce: nonce,
      prompt: 'select_account'
    });

    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${authParams.toString()}`;
    
    console.log('Microsoft OAuth URL:', authUrl);
    
    // Use window.location.assign for better compatibility
    try {
      window.location.assign(authUrl);
    } catch (error) {
      console.error('Navigation failed:', error);
      // Fallback to href
      try {
        window.location.href = authUrl;
      } catch (hrefError) {
        console.error('All navigation methods failed:', hrefError);
        setError('Failed to redirect to Microsoft login. Please try opening the link in a new tab.');
      }
    }
  }, [user, getRedirectUri, getCurrentOrigin]);

  // Store session after successful auth
  const storeSession = useCallback((sessionData: MicrosoftSession) => {
    if (!user) return;

    console.log('Storing Microsoft session for user:', user.id);
    setSession(sessionData);
    setError(null);
    
    try {
      localStorage.setItem(`ms_session_${user.id}`, JSON.stringify(sessionData));
      scheduleTokenRefresh(sessionData);
    } catch (e) {
      console.error('Failed to store session:', e);
      setError('Failed to store session data');
    }
  }, [user, scheduleTokenRefresh]);

  // Clear session with proper cleanup
  const clearSession = useCallback(() => {
    console.log('Clearing Microsoft session');
    if (user) {
      try {
        localStorage.removeItem(`ms_session_${user.id}`);
      } catch (e) {
        console.warn('Failed to remove session from localStorage:', e);
      }
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
