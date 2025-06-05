
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface MicrosoftAuthState {
  isConnected: boolean;
  isExpired: boolean;
  accessToken: string | null;
  expiresAt: string | null;
}

export const useMicrosoftAuth = () => {
  const [authState, setAuthState] = useState<MicrosoftAuthState>({
    isConnected: false,
    isExpired: false,
    accessToken: null,
    expiresAt: null
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const checkAndRefreshToken = async () => {
    if (!user) {
      setAuthState({ isConnected: false, isExpired: false, accessToken: null, expiresAt: null });
      setLoading(false);
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('microsoft_access_token, microsoft_refresh_token, token_expires_at')
        .eq('id', user.id)
        .single();

      if (error || !profile?.microsoft_access_token) {
        setAuthState({ isConnected: false, isExpired: false, accessToken: null, expiresAt: null });
        setLoading(false);
        return;
      }

      const expiresAt = new Date(profile.token_expires_at);
      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes buffer

      // If token expires within 5 minutes, refresh it
      if (expiresAt <= fiveMinutesFromNow) {
        console.log('Token expires soon, refreshing...');
        
        const { data, error: refreshError } = await supabase.functions.invoke('refresh-microsoft-token', {
          body: { user_id: user.id }
        });

        if (refreshError || data.error) {
          console.error('Token refresh failed:', refreshError || data.error);
          setAuthState({ 
            isConnected: true, 
            isExpired: true, 
            accessToken: profile.microsoft_access_token, 
            expiresAt: profile.token_expires_at 
          });
          setLoading(false);
          return;
        }

        console.log('Token refreshed successfully');
        setAuthState({ 
          isConnected: true, 
          isExpired: false, 
          accessToken: data.access_token, 
          expiresAt: data.expires_at 
        });
      } else {
        // Token is still valid
        setAuthState({ 
          isConnected: true, 
          isExpired: false, 
          accessToken: profile.microsoft_access_token, 
          expiresAt: profile.token_expires_at 
        });
      }
    } catch (error) {
      console.error('Error checking Microsoft auth:', error);
      setAuthState({ isConnected: false, isExpired: false, accessToken: null, expiresAt: null });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      checkAndRefreshToken();
      
      // Set up automatic token refresh check every 30 minutes
      const interval = setInterval(checkAndRefreshToken, 30 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  const disconnectMicrosoft = async () => {
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

      setAuthState({ isConnected: false, isExpired: false, accessToken: null, expiresAt: null });
      
      toast({
        title: "Microsoft Account Disconnected",
        description: "Your Microsoft account has been disconnected successfully."
      });
    } catch (error: any) {
      console.error('Error disconnecting Microsoft:', error);
      toast({
        title: "Disconnection Failed",
        description: error.message || "Failed to disconnect Microsoft account",
        variant: "destructive"
      });
    }
  };

  const forceRefresh = async () => {
    setLoading(true);
    await checkAndRefreshToken();
  };

  return {
    ...authState,
    loading,
    disconnectMicrosoft,
    forceRefresh,
    checkAndRefreshToken
  };
};
