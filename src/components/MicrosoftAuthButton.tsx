
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useMicrosoftSession } from '@/hooks/useMicrosoftSession';
import { CheckCircle, AlertCircle, RefreshCw, Loader2, ExternalLink } from 'lucide-react';

interface MicrosoftAuthButtonProps {
  onSuccess?: () => void;
}

export const MicrosoftAuthButton: React.FC<MicrosoftAuthButtonProps> = ({ onSuccess }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionTimeout, setConnectionTimeout] = useState(false);
  const [showManualLink, setShowManualLink] = useState(false);
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { session, loading, error, isConnected, startAuth, clearSession } = useMicrosoftSession();

  // Auto-trigger onSuccess when connection is established
  useEffect(() => {
    if (isConnected && session && onSuccess) {
      console.log('Microsoft connected, calling onSuccess');
      setIsConnecting(false);
      setConnectionTimeout(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      onSuccess();
    }
  }, [isConnected, session, onSuccess]);

  // Handle connection timeout
  useEffect(() => {
    if (isConnecting) {
      timeoutRef.current = setTimeout(() => {
        console.log('Microsoft connection timeout after 15 seconds');
        setConnectionTimeout(true);
        setIsConnecting(false);
        toast({
          title: "Connection Timeout",
          description: "Microsoft authentication is taking too long. Please try again.",
          variant: "destructive"
        });
      }, 15000); // 15 second timeout

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };
    }
  }, [isConnecting, toast]);

  // Clear timeout when component unmounts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const generateAuthUrl = () => {
    if (!user) return null;

    const state = user.id;
    const nonce = Math.random().toString(36).substring(2, 15);
    const redirectUri = `${window.location.origin}/microsoft/callback`;

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

    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${authParams.toString()}`;
  };

  const clearBrokenSession = () => {
    try {
      // Clear all Microsoft-related storage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('ms_session_') || key.includes('microsoft_') || key.includes('msal'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Clear session storage
      const sessionKeysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.includes('microsoft_')) {
          sessionKeysToRemove.push(key);
        }
      }
      sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));

      console.log('Cleared broken Microsoft session data');
    } catch (error) {
      console.warn('Error clearing broken session:', error);
    }
  };

  const handleConnect = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in first before connecting your Microsoft account.",
        variant: "destructive"
      });
      return;
    }

    setIsConnecting(true);
    setShowManualLink(false);
    
    try {
      clearBrokenSession();
      clearSession();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('Starting Microsoft authentication...');
      
      // Generate the auth URL for manual fallback
      const url = generateAuthUrl();
      setAuthUrl(url);
      
      // Try automatic redirect first
      await startAuth();
      
      // If we reach here, automatic redirect failed
      setTimeout(() => {
        if (isConnecting) {
          console.log('Automatic redirect may have failed, showing manual option');
          setShowManualLink(true);
        }
      }, 2000);
      
    } catch (error: any) {
      console.error('Microsoft auth error:', error);
      setIsConnecting(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Show manual link as fallback
      const url = generateAuthUrl();
      setAuthUrl(url);
      setShowManualLink(true);
      
      toast({
        title: "Connection Issue",
        description: "Automatic redirect failed. Please try the manual link below.",
        variant: "destructive"
      });
    }
  };

  const handleDisconnect = () => {
    clearSession();
    clearBrokenSession();
    setIsConnecting(false);
    setConnectionTimeout(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    toast({
      title: "Microsoft Account Disconnected",
      description: "Your Microsoft account has been disconnected successfully."
    });
  };

  const handleRetry = () => {
    setConnectionTimeout(false);
    handleConnect();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="ml-2">Checking Microsoft connection...</span>
      </div>
    );
  }

  if (isConnected && session) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h4 className="font-medium text-green-800">Microsoft 365 Connected</h4>
          </div>
          <p className="text-sm text-green-700 mb-2">
            Connected as: {session.userInfo.displayName} ({session.userInfo.mail})
          </p>
          <p className="text-xs text-green-600 mb-3">
            Token expires: {new Date(session.expiresAt).toLocaleString()}
          </p>
          <Button 
            onClick={handleDisconnect}
            variant="outline"
            size="sm"
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            Disconnect Account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-red-800 font-medium">Connection Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {(isConnecting || showManualLink) && (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start space-x-3">
            {!showManualLink && <Loader2 className="h-5 w-5 animate-spin text-blue-600 mt-0.5" />}
            <div className="flex-1">
              <h4 className="font-medium text-blue-800">
                {showManualLink ? 'Manual Connection Required' : 'Connecting to Microsoft'}
              </h4>
              {!showManualLink ? (
                <>
                  <p className="text-sm text-blue-700">Redirecting to Microsoft authentication...</p>
                  <p className="text-xs text-blue-600 mt-1">This should complete within 15 seconds</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-blue-700 mb-3">
                    Automatic redirect didn't work. Please click the link below to continue:
                  </p>
                  {authUrl && (
                    <a
                      href={authUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Open Microsoft Login</span>
                    </a>
                  )}
                  <p className="text-xs text-blue-600 mt-2">
                    After logging in, you'll be redirected back to this page.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {!isConnecting && !showManualLink && (
        <Button 
          onClick={handleConnect}
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
