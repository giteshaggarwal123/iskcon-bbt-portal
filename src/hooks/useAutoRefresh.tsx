
import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { useMicrosoftAuth } from './useMicrosoftAuth';
import { useToast } from './use-toast';

export const useAutoRefresh = () => {
  const { user, session } = useAuth();
  const { isConnected, isExpired, forceRefresh } = useMicrosoftAuth();
  const { toast } = useToast();
  const refreshAttempts = useRef(0);
  const maxRefreshAttempts = 3;

  useEffect(() => {
    const handleRouteError = () => {
      // Check if current path is 404 or if we're getting auth errors
      const isNotFoundRoute = window.location.pathname.includes('404') || 
                             document.title.includes('404') ||
                             document.body.innerText.includes('Page not found');

      if (isNotFoundRoute && user && refreshAttempts.current < maxRefreshAttempts) {
        console.log('Route error detected, attempting auto-refresh...');
        refreshAttempts.current += 1;
        
        toast({
          title: "Auto-refreshing session",
          description: `Attempt ${refreshAttempts.current} of ${maxRefreshAttempts}`,
        });

        // Navigate back to home
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      }
    };

    const handleTokenExpiration = async () => {
      if (user && isExpired && refreshAttempts.current < maxRefreshAttempts) {
        console.log('Token expired, attempting refresh...');
        refreshAttempts.current += 1;
        
        try {
          await forceRefresh();
          toast({
            title: "Session refreshed",
            description: "Your session has been automatically renewed.",
          });
          refreshAttempts.current = 0; // Reset on success
        } catch (error) {
          console.error('Auto-refresh failed:', error);
          
          if (refreshAttempts.current >= maxRefreshAttempts) {
            toast({
              title: "Session expired",
              description: "Please sign in again to continue.",
              variant: "destructive"
            });
            // Force logout after max attempts
            window.location.href = '/auth';
          }
        }
      }
    };

    // Check for route errors on navigation
    const observer = new MutationObserver(handleRouteError);
    observer.observe(document.body, { childList: true, subtree: true });

    // Check for token expiration periodically
    const tokenCheckInterval = setInterval(handleTokenExpiration, 30000); // Every 30 seconds

    // Handle unhandled promise rejections (often auth-related)
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      if (error && (
        error.message?.includes('401') ||
        error.message?.includes('403') ||
        error.message?.includes('token') ||
        error.message?.includes('unauthorized')
      )) {
        console.log('Unhandled auth error detected, triggering refresh...');
        handleTokenExpiration();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      observer.disconnect();
      clearInterval(tokenCheckInterval);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [user, isExpired, forceRefresh, toast]);

  // Reset attempts when user changes or becomes connected
  useEffect(() => {
    if (user && isConnected) {
      refreshAttempts.current = 0;
    }
  }, [user, isConnected]);

  return {
    refreshAttempts: refreshAttempts.current,
    maxRefreshAttempts
  };
};
