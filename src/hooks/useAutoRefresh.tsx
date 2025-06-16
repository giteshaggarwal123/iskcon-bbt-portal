
import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { useMicrosoftAuth } from './useMicrosoftAuth';
import { useToast } from './use-toast';
import { useLocation, useNavigate } from 'react-router-dom';

export const useAutoRefresh = () => {
  const { user, session } = useAuth();
  const { isConnected, isExpired, forceRefresh } = useMicrosoftAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const refreshAttempts = useRef(0);
  const maxRefreshAttempts = 3;
  const lastRefreshTime = useRef(0);

  useEffect(() => {
    const handleRouteError = () => {
      // More aggressive detection of route errors
      const currentTime = Date.now();
      const timeSinceLastRefresh = currentTime - lastRefreshTime.current;
      
      // Check multiple indicators of "not found" or routing issues
      const isNotFoundRoute = 
        window.location.pathname.includes('404') || 
        document.title.includes('404') ||
        document.body.innerText.includes('Page not found') ||
        document.body.innerText.includes('not found') ||
        document.body.innerText.includes('Not Found') ||
        // Check if we're on an unexpected route
        (location.pathname !== '/' && location.pathname !== '/dashboard' && 
         !location.pathname.startsWith('/meetings') && 
         !location.pathname.startsWith('/documents') &&
         !location.pathname.startsWith('/voting') &&
         !location.pathname.startsWith('/attendance') &&
         !location.pathname.startsWith('/email') &&
         !location.pathname.startsWith('/members') &&
         !location.pathname.startsWith('/reports') &&
         !location.pathname.startsWith('/settings') &&
         !location.pathname.startsWith('/auth') &&
         !location.pathname.startsWith('/microsoft'));

      if (isNotFoundRoute && user && refreshAttempts.current < maxRefreshAttempts && timeSinceLastRefresh > 5000) {
        console.log('Route error detected, attempting auto-refresh...', { 
          pathname: location.pathname,
          attempt: refreshAttempts.current + 1 
        });
        
        refreshAttempts.current += 1;
        lastRefreshTime.current = currentTime;
        
        toast({
          title: "Navigation issue detected",
          description: `Redirecting to dashboard... (Attempt ${refreshAttempts.current}/${maxRefreshAttempts})`,
        });

        // Try navigating back to dashboard first
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 1000);

        // If navigation doesn't work, force reload
        setTimeout(() => {
          if (window.location.pathname === location.pathname) {
            console.log('Navigation failed, forcing page reload...');
            window.location.href = '/';
          }
        }, 3000);
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

    // Immediate check on mount
    handleRouteError();

    // Check for route errors on navigation and DOM changes
    const observer = new MutationObserver(handleRouteError);
    observer.observe(document.body, { childList: true, subtree: true });

    // More frequent token checks
    const tokenCheckInterval = setInterval(handleTokenExpiration, 15000); // Every 15 seconds

    // Handle unhandled promise rejections (often auth-related)
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      console.error('Unhandled rejection:', error);
      
      if (error && (
        error.message?.includes('401') ||
        error.message?.includes('403') ||
        error.message?.includes('token') ||
        error.message?.includes('unauthorized') ||
        error.message?.includes('not found') ||
        error.status === 401 ||
        error.status === 403 ||
        error.status === 404
      )) {
        console.log('Auth/routing error detected, triggering refresh...');
        handleTokenExpiration();
        handleRouteError();
      }
    };

    // Handle general errors
    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error);
      if (event.error && event.error.message?.includes('not found')) {
        handleRouteError();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      observer.disconnect();
      clearInterval(tokenCheckInterval);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, [user, isExpired, forceRefresh, toast, location.pathname, navigate]);

  // Reset attempts when user changes or becomes connected
  useEffect(() => {
    if (user && isConnected) {
      refreshAttempts.current = 0;
      lastRefreshTime.current = 0;
    }
  }, [user, isConnected]);

  // Handle location changes - if we end up on an invalid route, redirect
  useEffect(() => {
    if (user && location.pathname && location.pathname !== '/' && location.pathname !== '/dashboard') {
      // Check if current route is valid for authenticated users
      const validRoutes = ['/meetings', '/documents', '/voting', '/attendance', '/email', '/members', '/reports', '/settings'];
      const isValidRoute = validRoutes.some(route => location.pathname.startsWith(route));
      
      if (!isValidRoute && !location.pathname.startsWith('/auth') && !location.pathname.startsWith('/microsoft')) {
        console.log('Invalid route detected:', location.pathname, 'redirecting to dashboard');
        navigate('/', { replace: true });
      }
    }
  }, [location.pathname, user, navigate]);

  return {
    refreshAttempts: refreshAttempts.current,
    maxRefreshAttempts
  };
};
