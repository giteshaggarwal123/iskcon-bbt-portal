
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const MicrosoftCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(true);
  const [progress, setProgress] = useState('Initializing...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setProgress('Validating callback parameters...');
        
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        console.log('Microsoft callback received:', { 
          code: code ? 'present' : 'missing', 
          state: state ? 'present' : 'missing', 
          error, 
          errorDescription,
          timestamp: new Date().toISOString()
        });

        // Handle Microsoft OAuth errors
        if (error) {
          console.error('Microsoft OAuth error:', error, errorDescription);
          
          const errorMessages = {
            'access_denied': 'Microsoft authentication was cancelled by user',
            'invalid_request': 'Invalid authentication request to Microsoft',
            'invalid_client': 'Microsoft application configuration error',
            'invalid_grant': 'Authentication grant expired or invalid',
            'unauthorized_client': 'Application not authorized for Microsoft access'
          };
          
          const friendlyMessage = errorMessages[error as keyof typeof errorMessages] || errorDescription || `Microsoft authentication failed: ${error}`;
          
          toast({
            title: "Authentication Failed",
            description: friendlyMessage,
            variant: "destructive"
          });
          navigate('/', { replace: true });
          return;
        }

        // Validate required parameters
        if (!code) {
          console.error('Missing authorization code');
          toast({
            title: "Authentication Failed", 
            description: "No authorization code received from Microsoft. Please try again.",
            variant: "destructive"
          });
          navigate('/', { replace: true });
          return;
        }

        if (!state) {
          console.error('Missing state parameter');
          toast({
            title: "Authentication Failed", 
            description: "Invalid callback state. Please try again.",
            variant: "destructive"
          });
          navigate('/', { replace: true });
          return;
        }

        setProgress('Verifying session data...');

        // Enhanced session validation
        let storedUserId: string | null = null;
        let sessionTimestamp: string | null = null;
        
        try {
          storedUserId = sessionStorage.getItem('microsoft_auth_user_id');
          sessionTimestamp = sessionStorage.getItem('microsoft_auth_timestamp');
        } catch (storageError) {
          console.error('Session storage access error:', storageError);
        }
        
        console.log('Session validation:', { 
          storedUserId: storedUserId ? 'present' : 'missing',
          stateFromUrl: state,
          sessionAge: sessionTimestamp ? Date.now() - parseInt(sessionTimestamp) : 'unknown'
        });
        
        if (!storedUserId) {
          console.error('No stored user ID found in session');
          toast({
            title: "Session Error",
            description: "Authentication session expired. Please try connecting again.",
            variant: "destructive"
          });
          navigate('/', { replace: true });
          return;
        }
        
        if (storedUserId !== state) {
          console.error('State parameter mismatch - possible CSRF attack', { storedUserId, state });
          toast({
            title: "Security Error",
            description: "Invalid authentication state. This may indicate a security issue.",
            variant: "destructive"
          });
          navigate('/', { replace: true });
          return;
        }

        // Check session age (should not be older than 30 minutes)
        if (sessionTimestamp) {
          const sessionAge = Date.now() - parseInt(sessionTimestamp);
          const maxAge = 30 * 60 * 1000; // 30 minutes
          
          if (sessionAge > maxAge) {
            console.error('Authentication session too old:', sessionAge);
            toast({
              title: "Session Expired",
              description: "Authentication session expired. Please try again.",
              variant: "destructive"
            });
            navigate('/', { replace: true });
            return;
          }
        }

        setProgress('Exchanging authorization code...');

        console.log('Calling Microsoft auth edge function...');

        // Call the Microsoft auth edge function with retry logic
        let authResult;
        let lastError;
        
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            console.log(`Microsoft auth attempt ${attempt}/3`);
            
            const { data, error: authError } = await supabase.functions.invoke('microsoft-auth', {
              body: {
                code,
                user_id: state
              }
            });

            if (authError) {
              throw authError;
            }

            if (data.error) {
              throw new Error(data.error);
            }

            authResult = data;
            break;
            
          } catch (error: any) {
            console.error(`Microsoft auth attempt ${attempt} failed:`, error);
            lastError = error;
            
            if (attempt < 3) {
              setProgress(`Retrying authentication (${attempt}/3)...`);
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
          }
        }

        if (!authResult) {
          throw lastError || new Error('Authentication failed after 3 attempts');
        }

        console.log('Microsoft auth successful:', authResult.user?.displayName || authResult.user?.mail);

        setProgress('Completing setup...');

        // Clean up session storage
        try {
          sessionStorage.removeItem('microsoft_auth_user_id');
          sessionStorage.removeItem('microsoft_auth_nonce');
          sessionStorage.removeItem('microsoft_auth_timestamp');
        } catch (storageError) {
          console.warn('Session cleanup warning:', storageError);
        }

        // Mark prompt as shown to prevent it from appearing again
        try {
          localStorage.setItem('microsoft_prompt_shown', 'true');
        } catch (storageError) {
          console.warn('Local storage warning:', storageError);
        }

        toast({
          title: "Microsoft Account Connected!",
          description: `Successfully connected ${authResult.user.displayName || authResult.user.mail}. Enhanced reliability features are now active.`
        });

        // Navigate back to home
        navigate('/', { replace: true });

        // Force a page reload to ensure all components refresh their Microsoft auth state
        setTimeout(() => {
          window.location.reload();
        }, 1000);

      } catch (error: any) {
        console.error('Microsoft callback error:', error);
        
        setProgress('Error occurred...');
        
        // Clean up session storage on error
        try {
          sessionStorage.removeItem('microsoft_auth_user_id');
          sessionStorage.removeItem('microsoft_auth_nonce');
          sessionStorage.removeItem('microsoft_auth_timestamp');
        } catch (storageError) {
          console.warn('Session cleanup error:', storageError);
        }
        
        // Store error for debugging
        try {
          localStorage.setItem('microsoft_auth_last_error', JSON.stringify({
            message: error.message,
            timestamp: new Date().toISOString(),
            code: searchParams.get('code') ? 'present' : 'missing',
            state: searchParams.get('state') ? 'present' : 'missing'
          }));
        } catch (storageError) {
          console.warn('Error storage warning:', storageError);
        }
        
        toast({
          title: "Connection Failed",
          description: error.message || "Failed to complete Microsoft authentication. Please try again.",
          variant: "destructive"
        });
        navigate('/', { replace: true });
      } finally {
        setProcessing(false);
      }
    };

    handleCallback();
  }, [searchParams, navigate, toast]);

  if (processing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Connecting Microsoft Account</h2>
          <p className="text-gray-600 mb-4">{progress}</p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
          <p className="text-sm text-gray-500 mt-4">This may take a few moments...</p>
        </div>
      </div>
    );
  }

  return null;
};
