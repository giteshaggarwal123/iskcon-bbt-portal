
import React, { useState, useCallback, useEffect } from 'react';
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
  const { isConnected, disconnectMicrosoft, canAttemptConnection } = useMicrosoftAuth();

  // Enhanced configuration with fallback values
  const getAuthConfig = useCallback(() => {
    const config = {
      clientId: '44391516-babe-4072-8422-a4fc8a79fbde',
      tenantId: 'b2333ef6-3378-4d02-b9b9-d8e66d9dfa3d',
      baseUrl: window.location.origin,
      scope: [
        'https://graph.microsoft.com/User.Read',
        'https://graph.microsoft.com/Mail.ReadWrite',
        'https://graph.microsoft.com/Calendars.ReadWrite',
        'https://graph.microsoft.com/Files.ReadWrite.All',
        'https://graph.microsoft.com/Sites.ReadWrite.All',
        'https://graph.microsoft.com/OnlineMeetings.ReadWrite',
        'offline_access'
      ].join(' ')
    };

    console.log('Microsoft OAuth Configuration:', {
      ...config,
      redirectUri: `${config.baseUrl}/microsoft/callback`
    });

    return config;
  }, []);

  const validateEnvironment = useCallback(() => {
    const issues = [];
    
    if (!user) {
      issues.push('User not authenticated');
    }
    
    if (!window.location.origin) {
      issues.push('Cannot determine application URL');
    }
    
    const config = getAuthConfig();
    if (!config.clientId || !config.tenantId) {
      issues.push('Missing Microsoft OAuth configuration');
    }

    return issues;
  }, [user, getAuthConfig]);

  const handleMicrosoftLogin = useCallback(async () => {
    // Pre-flight validation
    const issues = validateEnvironment();
    if (issues.length > 0) {
      toast({
        title: "Configuration Error",
        description: `Cannot connect: ${issues.join(', ')}`,
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
      const config = getAuthConfig();
      const redirectUri = `${config.baseUrl}/microsoft/callback`;
      
      // Generate a unique state parameter for security
      const state = user.id;
      const nonce = Math.random().toString(36).substring(2, 15);
      
      console.log('Initiating Microsoft OAuth flow:', {
        redirectUri,
        state,
        clientId: config.clientId,
        timestamp: new Date().toISOString()
      });
      
      // Clear any existing session data
      try {
        sessionStorage.removeItem('microsoft_auth_user_id');
        sessionStorage.removeItem('microsoft_auth_nonce');
        localStorage.removeItem('microsoft_auth_error');
      } catch (storageError) {
        console.warn('Storage cleanup warning:', storageError);
      }
      
      // Construct OAuth URL with enhanced parameters
      const authParams = new URLSearchParams({
        client_id: config.clientId,
        response_type: 'code',
        redirect_uri: redirectUri,
        scope: config.scope,
        response_mode: 'query',
        state: state,
        nonce: nonce,
        prompt: 'select_account',
        domain_hint: 'organizations' // Prefer organizational accounts
      });
      
      const authUrl = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/authorize?${authParams.toString()}`;
      
      console.log('Microsoft OAuth URL generated:', authUrl.substring(0, 100) + '...');
      
      // Store session data with error handling
      try {
        sessionStorage.setItem('microsoft_auth_user_id', user.id);
        sessionStorage.setItem('microsoft_auth_nonce', nonce);
        sessionStorage.setItem('microsoft_auth_timestamp', Date.now().toString());
      } catch (storageError) {
        console.error('Failed to store session data:', storageError);
        toast({
          title: "Storage Error",
          description: "Unable to store session data. Please check browser storage permissions.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }
      
      // Add a small delay to ensure all preparations are complete
      setTimeout(() => {
        try {
          window.location.href = authUrl;
        } catch (navigationError) {
          console.error('Navigation error:', navigationError);
          toast({
            title: "Navigation Failed",
            description: "Unable to redirect to Microsoft login. Please try again.",
            variant: "destructive"
          });
          setLoading(false);
        }
      }, 200);
      
    } catch (error: any) {
      console.error('Microsoft OAuth initialization error:', error);
      toast({
        title: "Connection Failed",
        description: `Failed to initialize Microsoft connection: ${error.message}`,
        variant: "destructive"
      });
      setLoading(false);
    }
  }, [user, toast, canAttemptConnection, getAuthConfig, validateEnvironment]);

  // Auto-trigger onSuccess when connection is established
  useEffect(() => {
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
            Your Microsoft account is connected with enhanced reliability. Tokens are automatically refreshed every 15 minutes.
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
      
      {!canAttemptConnection && (
        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-800">
            Connection rate limited. Please wait before trying again.
          </p>
        </div>
      )}
      
      <Button 
        onClick={handleMicrosoftLogin}
        disabled={loading || !canAttemptConnection}
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
