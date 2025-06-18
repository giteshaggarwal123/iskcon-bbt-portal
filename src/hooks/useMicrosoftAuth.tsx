
import { useMicrosoftSession } from './useMicrosoftSession';
import { useToast } from './use-toast';

// Legacy compatibility wrapper for existing components
export const useMicrosoftAuth = () => {
  const { session, loading, error, isConnected, clearSession } = useMicrosoftSession();
  const { toast } = useToast();

  const disconnectMicrosoft = async () => {
    clearSession();
    toast({
      title: "Microsoft Account Disconnected",
      description: "Your Microsoft account has been disconnected successfully."
    });
  };

  const checkAndRefreshToken = async () => {
    // This is now handled automatically by useMicrosoftSession
    return isConnected;
  };

  return {
    isConnected,
    isExpired: false, // Automatically handled by session management
    accessToken: session?.accessToken || null,
    expiresAt: session ? new Date(session.expiresAt).toISOString() : null,
    lastError: error,
    loading,
    disconnectMicrosoft,
    forceRefresh: checkAndRefreshToken,
    checkAndRefreshToken,
    canAttemptConnection: true, // No rate limiting needed with proper session management
    connectionAttempts: 0
  };
};
