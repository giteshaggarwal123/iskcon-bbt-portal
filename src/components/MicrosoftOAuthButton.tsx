
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useMicrosoftAuth } from '@/hooks/useMicrosoftAuth';
import { MicrosoftConnectionStatus } from './MicrosoftConnectionStatus';

interface MicrosoftOAuthButtonProps {
  onSuccess?: () => void;
}

export const MicrosoftOAuthButton: React.FC<MicrosoftOAuthButtonProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { isConnected, disconnectMicrosoft } = useMicrosoftAuth();

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
      
      // Use the exact domain from your current deployment
      const currentDomain = window.location.origin;
      const redirectUri = `${currentDomain}/microsoft/callback`;
      
      console.log('Microsoft OAuth redirect URI:', redirectUri);
      
      const scope = 'https://graph.microsoft.com/User.Read https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Calendars.ReadWrite https://graph.microsoft.com/Files.ReadWrite.All https://graph.microsoft.com/Sites.ReadWrite.All https://graph.microsoft.com/OnlineMeetings.ReadWrite offline_access';
      
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

  // Auto-trigger onSuccess when connection is established
  React.useEffect(() => {
    if (isConnected && onSuccess) {
      console.log('Microsoft connected, calling onSuccess');
      onSuccess();
    }
  }, [isConnected, onSuccess]);

  if (isConnected) {
    return (
      <div className="space-y-4">
        <MicrosoftConnectionStatus />
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <h4 className="font-medium text-green-800 mb-2">Microsoft 365 Connected</h4>
          <p className="text-sm text-green-700 mb-3">
            Your Microsoft account is connected and tokens are automatically refreshed. You can now use Outlook, Teams, and SharePoint features.
          </p>
          <Button 
            onClick={disconnectMicrosoft}
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            Disconnect Microsoft Account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <MicrosoftConnectionStatus />
      
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
    </div>
  );
};
