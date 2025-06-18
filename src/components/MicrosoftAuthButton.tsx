
import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useMicrosoftAuth } from '@/hooks/useMicrosoftAuth';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface MicrosoftAuthButtonProps {
  onSuccess?: () => void;
}

export const MicrosoftAuthButton: React.FC<MicrosoftAuthButtonProps> = ({ onSuccess }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { isConnected, disconnectMicrosoft, canAttemptConnection, lastError } = useMicrosoftAuth();

  // Auto-trigger onSuccess when connection is established
  useEffect(() => {
    if (isConnected && onSuccess) {
      console.log('Microsoft connected, calling onSuccess');
      onSuccess();
    }
  }, [isConnected, onSuccess]);

  const handleMicrosoftAuth = useCallback(async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in first before connecting your Microsoft account.",
        variant: "destructive"
      });
      return;
    }

    if (!canAttemptConnection) {
      toast({
        title: "Rate Limited",
        description: "Too many connection attempts. Please wait before trying again.",
        variant: "destructive"
      });
      return;
    }

    setIsConnecting(true);
    
    try {
      // Clear any existing session data and errors first
      try {
        localStorage.removeItem('microsoft_auth_error');
        localStorage.removeItem('microsoft_auth_success');
        sessionStorage.removeItem('microsoft_auth_user_id');
        sessionStorage.removeItem('microsoft_auth_nonce');
        sessionStorage.removeItem('microsoft_auth_timestamp');
      } catch (e) {
        console.warn('Session cleanup warning:', e);
      }

      const clientId = '44391516-babe-4072-8422-a4fc8a79fbde';
      const baseUrl = window.location.origin;
      const redirectUri = `${baseUrl}/microsoft/callback`;
      const state = user.id;
      const nonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      // Store session data with error handling
      try {
        sessionStorage.setItem('microsoft_auth_user_id', state);
        sessionStorage.setItem('microsoft_auth_nonce', nonce);
        sessionStorage.setItem('microsoft_auth_timestamp', Date.now().toString());
      } catch (storageError) {
        console.error('Session storage error:', storageError);
        setIsConnecting(false);
        toast({
          title: "Storage Error",
          description: "Unable to store session data. Please enable cookies and try again.",
          variant: "destructive"
        });
        return;
      }

      // Force fresh consent to ensure we get new tokens
      const scope = [
        'openid',
        'profile',
        'email',
        'offline_access',
        'https://graph.microsoft.com/User.Read',
        'https://graph.microsoft.com/Mail.ReadWrite',
        'https://graph.microsoft.com/Calendars.ReadWrite',
        'https://graph.microsoft.com/Files.ReadWrite.All'
      ].join(' ');

      const authParams = new URLSearchParams({
        client_id: clientId,
        response_type: 'code',
        redirect_uri: redirectUri,
        scope: scope,
        response_mode: 'query',
        state: state,
        nonce: nonce,
        prompt: 'consent' // Force consent to get fresh tokens
      });

      const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${authParams.toString()}`;
      
      console.log('Redirecting to Microsoft OAuth:', { authUrl, timestamp: new Date().toISOString() });
      
      // Use window.location.href for reliable redirection
      window.location.href = authUrl;
      
    } catch (error: any) {
      console.error('Microsoft OAuth initialization error:', error);
      setIsConnecting(false);
      toast({
        title: "Connection Failed",
        description: `Failed to initialize Microsoft connection: ${error.message}`,
        variant: "destructive"
      });
    }
  }, [user, toast, canAttemptConnection]);

  const handleRetry = useCallback(() => {
    setIsConnecting(false);
    // Small delay before retry
    setTimeout(handleMicrosoftAuth, 1000);
  }, [handleMicrosoftAuth]);

  if (isConnected) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <h4 className="font-medium text-green-800 mb-2">Microsoft 365 Connected</h4>
          <p className="text-sm text-green-700 mb-3">
            Your Microsoft account is connected and ready to use.
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
      {lastError && (
        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-red-800 font-medium">Connection Error</p>
              <p className="text-sm text-red-700">{lastError}</p>
            </div>
          </div>
        </div>
      )}

      {!canAttemptConnection && (
        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-800">
            Connection rate limited. Please wait before trying again.
          </p>
        </div>
      )}

      {isConnecting ? (
        <div className="space-y-3">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-3">
              <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <div>
                <h4 className="font-medium text-blue-800">Connecting to Microsoft</h4>
                <p className="text-sm text-blue-700">Redirecting to Microsoft authentication...</p>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              onClick={handleRetry}
              variant="outline"
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Connection
            </Button>
            <Button 
              onClick={() => setIsConnecting(false)}
              variant="ghost"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button 
          onClick={handleMicrosoftAuth}
          disabled={!canAttemptConnection}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
            </svg>
            <span>Connect Microsoft 365</span>
          </div>
        </Button>
      )}
    </div>
  );
};
