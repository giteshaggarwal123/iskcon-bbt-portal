
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useMicrosoftSession } from '@/hooks/useMicrosoftSession';
import { CheckCircle, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';

interface MicrosoftAuthButtonProps {
  onSuccess?: () => void;
}

export const MicrosoftAuthButton: React.FC<MicrosoftAuthButtonProps> = ({ onSuccess }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionTimeout, setConnectionTimeout] = useState(false);
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
    setConnectionTimeout(false);
    
    try {
      // Clear any broken session data first
      clearBrokenSession();
      
      // Clear the session hook state as well
      clearSession();
      
      // Small delay to ensure state is cleared
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('Starting Microsoft authentication...');
      await startAuth();
    } catch (error: any) {
      console.error('Microsoft auth error:', error);
      setIsConnecting(false);
      setConnectionTimeout(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to start Microsoft authentication",
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

      {connectionTimeout && (
        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-yellow-800 font-medium">Connection Timeout</p>
              <p className="text-sm text-yellow-700 mb-2">The connection attempt timed out. This might be due to popup blockers or network issues.</p>
              <Button
                size="sm"
                onClick={handleRetry}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Try Again
              </Button>
            </div>
          </div>
        </div>
      )}

      {isConnecting ? (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <div>
              <h4 className="font-medium text-blue-800">Connecting to Microsoft</h4>
              <p className="text-sm text-blue-700">Redirecting to Microsoft authentication...</p>
              <p className="text-xs text-blue-600 mt-1">This should complete within 15 seconds</p>
            </div>
          </div>
        </div>
      ) : (
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
