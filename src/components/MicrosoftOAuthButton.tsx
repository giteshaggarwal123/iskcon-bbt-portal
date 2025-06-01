
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface MicrosoftOAuthButtonProps {
  onSuccess?: () => void;
}

export const MicrosoftOAuthButton: React.FC<MicrosoftOAuthButtonProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleMicrosoftLogin = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in first before connecting your Microsoft account.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // Generate Microsoft OAuth URL
      const clientId = '44391516-babe-4072-8422-a4fc8a79fbde';
      const tenantId = 'b2333ef6-3378-4d02-b9b9-d8e66d9dfa3d';
      const redirectUri = `${window.location.origin}/microsoft-callback`;
      const scope = 'https://graph.microsoft.com/User.Read https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Calendars.ReadWrite https://graph.microsoft.com/Files.ReadWrite.All https://graph.microsoft.com/Sites.ReadWrite.All https://graph.microsoft.com/OnlineMeetings.ReadWrite';
      
      const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?` +
        `client_id=${clientId}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `response_mode=query&` +
        `state=${user.id}`;
      
      // Store user ID in session storage for callback
      sessionStorage.setItem('microsoft_auth_user_id', user.id);
      
      // Redirect to Microsoft OAuth
      window.location.href = authUrl;
      
    } catch (error: any) {
      console.error('Microsoft OAuth error:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Microsoft. Please try again.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleMicrosoftLogin}
      disabled={loading}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
    >
      {loading ? (
        <div className="flex items-center space-x-2">
          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
          <span>Connecting...</span>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
          </svg>
          <span>Connect Microsoft 365</span>
        </div>
      )}
    </Button>
  );
};
