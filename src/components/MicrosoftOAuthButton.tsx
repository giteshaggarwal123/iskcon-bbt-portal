
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useMicrosoftAuth } from '@/hooks/useMicrosoftAuth';
import { MicrosoftConnectionStatus } from './MicrosoftConnectionStatus';
import { SecurityService } from '@/services/securityService';

interface MicrosoftOAuthButtonProps {
  onSuccess?: () => void;
}

export const MicrosoftOAuthButton: React.FC<MicrosoftOAuthButtonProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user, session } = useAuth();
  const { isConnected, disconnectMicrosoft } = useMicrosoftAuth();

  const handleMicrosoftLogin = async () => {
    if (!user || !session) {
      toast({
        title: "Authentication Required",
        description: "Please sign in first before connecting your Microsoft account.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // Get OAuth configuration securely from backend
      const config = await SecurityService.getMicrosoftOAuthConfig();
      
      if (!config) {
        throw new Error('Failed to get OAuth configuration');
      }
      
      console.log('Microsoft OAuth redirect URI:', config.redirectUri);
      
      const scope = 'https://graph.microsoft.com/User.Read https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Calendars.ReadWrite https://graph.microsoft.com/Files.ReadWrite.All https://graph.microsoft.com/Sites.ReadWrite.All https://graph.microsoft.com/OnlineMeetings.ReadWrite offline_access';
      
      const authUrl = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/authorize?` +
        `client_id=${config.clientId}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(config.redirectUri)}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `response_mode=query&` +
        `state=${user.id}`;
      
      // Use secure session storage key
      const sessionKey = SecurityService.generateSessionKey();
      sessionStorage.setItem('microsoft_auth_user_id', user.id);
      sessionStorage.setItem('auth_session_key', sessionKey);
      
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
      
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-medium text-blue-800 mb-2">Enhanced Microsoft Integration</h4>
        <p className="text-sm text-blue-700 mb-2">
          This integration now includes automatic token refresh to keep your connection persistent. Once connected, you won't need to reconnect frequently.
        </p>
        <div className="bg-white p-2 rounded border text-xs font-mono text-gray-800 mb-2">
          ✓ Automatic token refresh every 30 minutes
        </div>
        <div className="bg-white p-2 rounded border text-xs font-mono text-gray-800 mb-2">
          ✓ Persistent connection until manually disconnected
        </div>
        <div className="bg-white p-2 rounded border text-xs font-mono text-gray-800 mb-2">
          ✓ Enhanced error handling and recovery
        </div>
      </div>
      
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
