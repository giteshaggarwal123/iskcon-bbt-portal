
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface MicrosoftAuthState {
  isConnected: boolean;
  isExpired: boolean;
  accessToken: string | null;
  expiresAt: string | null;
  lastError: string | null;
}

interface ConnectionAttempt {
  timestamp: number;
  success: boolean;
  error?: string;
}

export const useMicrosoftAuth = () => {
  const [authState, setAuthState] = useState<MicrosoftAuthState>({
    isConnected: false,
    isExpired: false,
    accessToken: null,
    expiresAt: null,
    lastError: null
  });
  const [loading, setLoading] = useState(true);
  const [connectionAttempts, setConnectionAttempts] = useState<ConnectionAttempt[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  // Rate limiting: max 3 attempts per 5 minutes
  const canAttemptConnection = useCallback(() => {
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    const recentAttempts = connectionAttempts.filter(attempt => attempt.timestamp > fiveMinutesAgo);
    return recentAttempts.length < 3;
  }, [connectionAttempts]);

  const recordConnectionAttempt = useCallback((success: boolean, error?: string) => {
    setConnectionAttempts(prev => [...prev.slice(-9), { // Keep last 10 attempts
      timestamp: Date.now(),
      success,
      error
    }]);
  }, []);

  const checkAndRefreshToken = useCallback(async (retryCount = 0): Promise<boolean> => {
    if (!user) {
      setAuthState(prev => ({ ...prev, isConnected: false, isExpired: false, accessToken: null, expiresAt: null, lastError: null }));
      setLoading(false);
      return false;
    }

    try {
      console.log(`Microsoft auth check attempt ${retryCount + 1}`);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('microsoft_access_token, microsoft_refresh_token, token_expires_at')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Profile fetch error:', error);
        if (retryCount < 2) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return checkAndRefreshToken(retryCount + 1);
        }
        throw new Error(`Profile fetch failed: ${error.message}`);
      }

      if (!profile?.microsoft_access_token) {
        console.log('No Microsoft token found');
        setAuthState(prev => ({ ...prev, isConnected: false, isExpired: false, accessToken: null, expiresAt: null, lastError: null }));
        setLoading(false);
        return false;
      }

      const expiresAt = new Date(profile.token_expires_at);
      const now = new Date();
      const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);

      // If token expires within 10 minutes, try to refresh it
      if (expiresAt <= tenMinutesFromNow) {
        console.log('Token expires soon, attempting refresh...');
        
        try {
          const { data, error: refreshError } = await supabase.functions.invoke('refresh-microsoft-token', {
            body: { user_id: user.id }
          });

          if (refreshError) {
            console.error('Token refresh error:', refreshError);
            // If refresh fails due to invalid grant, clear the tokens and mark as disconnected
            if (refreshError.message?.includes('invalid_grant') || refreshError.message?.includes('AADSTS50173')) {
              await disconnectMicrosoft();
              setAuthState(prev => ({ 
                ...prev, 
                isConnected: false, 
                isExpired: true, 
                accessToken: null, 
                expiresAt: null,
                lastError: 'Microsoft account needs to be reconnected. Please sign in again.'
              }));
              
              toast({
                title: "Microsoft Account Disconnected",
                description: "Your Microsoft tokens have expired. Please reconnect your account in Settings.",
                variant: "destructive"
              });
              
              setLoading(false);
              return false;
            }
            throw new Error(`Token refresh failed: ${refreshError.message}`);
          }

          if (data?.error) {
            console.error('Token refresh API error:', data.error);
            
            // Handle specific Microsoft errors
            if (data.error.includes('invalid_grant') || data.error.includes('AADSTS50173')) {
              await disconnectMicrosoft();
              setAuthState(prev => ({ 
                ...prev, 
                isConnected: false, 
                isExpired: true, 
                accessToken: null, 
                expiresAt: null,
                lastError: 'Microsoft account needs to be reconnected due to security policy or password change.'
              }));
              
              toast({
                title: "Microsoft Account Needs Reconnection",
                description: "Please reconnect your Microsoft account. This usually happens after a password change or security policy update.",
                variant: "destructive"
              });
              
              setLoading(false);
              return false;
            }
            
            // For other errors, mark as expired but still connected
            setAuthState(prev => ({ 
              ...prev, 
              isConnected: true, 
              isExpired: true, 
              accessToken: profile.microsoft_access_token, 
              expiresAt: profile.token_expires_at,
              lastError: `Token refresh failed: ${data.error}`
            }));
            setLoading(false);
            return false;
          }

          console.log('Token refreshed successfully');
          setAuthState(prev => ({ 
            ...prev, 
            isConnected: true, 
            isExpired: false, 
            accessToken: data.access_token, 
            expiresAt: data.expires_at,
            lastError: null
          }));
          setLoading(false);
          return true;
        } catch (refreshError: any) {
          console.error('Token refresh exception:', refreshError);
          
          // Handle token refresh failures more gracefully
          if (refreshError.message?.includes('invalid_grant') || refreshError.message?.includes('AADSTS50173')) {
            await disconnectMicrosoft();
            setAuthState(prev => ({ 
              ...prev, 
              isConnected: false, 
              isExpired: true, 
              accessToken: null, 
              expiresAt: null,
              lastError: 'Microsoft account disconnected due to expired credentials'
            }));
          } else {
            setAuthState(prev => ({ 
              ...prev, 
              isConnected: true, 
              isExpired: true, 
              accessToken: profile.microsoft_access_token, 
              expiresAt: profile.token_expires_at,
              lastError: refreshError.message
            }));
          }
          setLoading(false);
          return false;
        }
      } else {
        // Token is still valid
        console.log('Token is valid');
        setAuthState(prev => ({ 
          ...prev, 
          isConnected: true, 
          isExpired: false, 
          accessToken: profile.microsoft_access_token, 
          expiresAt: profile.token_expires_at,
          lastError: null
        }));
        setLoading(false);
        return true;
      }
    } catch (error: any) {
      console.error('Error checking Microsoft auth:', error);
      setAuthState(prev => ({ 
        ...prev, 
        isConnected: false, 
        isExpired: false, 
        accessToken: null, 
        expiresAt: null,
        lastError: error.message
      }));
      setLoading(false);
      return false;
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      checkAndRefreshToken();
      
      // Set up automatic token refresh check every 15 minutes
      const interval = setInterval(() => {
        checkAndRefreshToken();
      }, 15 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [user, checkAndRefreshToken]);

  const disconnectMicrosoft = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          microsoft_user_id: null,
          microsoft_access_token: null,
          microsoft_refresh_token: null,
          token_expires_at: null
        })
        .eq('id', user.id);

      if (error) throw error;

      setAuthState({
        isConnected: false,
        isExpired: false,
        accessToken: null,
        expiresAt: null,
        lastError: null
      });
      
      // Clear connection attempts history
      setConnectionAttempts([]);
      
      console.log('Microsoft account disconnected successfully');
    } catch (error: any) {
      console.error('Error disconnecting Microsoft:', error);
      toast({
        title: "Disconnection Failed",
        description: error.message || "Failed to disconnect Microsoft account",
        variant: "destructive"
      });
    }
  }, [user, toast]);

  const forceRefresh = useCallback(async () => {
    if (!canAttemptConnection()) {
      toast({
        title: "Rate Limited",
        description: "Too many connection attempts. Please wait 5 minutes before trying again.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    const success = await checkAndRefreshToken();
    recordConnectionAttempt(success, authState.lastError || undefined);
  }, [canAttemptConnection, checkAndRefreshToken, toast, authState.lastError, recordConnectionAttempt]);

  return {
    ...authState,
    loading,
    disconnectMicrosoft,
    forceRefresh,
    checkAndRefreshToken,
    canAttemptConnection: canAttemptConnection(),
    connectionAttempts: connectionAttempts.length
  };
};
