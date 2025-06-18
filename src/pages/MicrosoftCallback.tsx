
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export const MicrosoftCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(true);
  const [progress, setProgress] = useState('Initializing...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setProgress('Processing Microsoft callback...');
        
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        console.log('Microsoft callback received:', { 
          hasCode: !!code, 
          hasState: !!state, 
          error, 
          errorDescription,
          timestamp: new Date().toISOString()
        });

        // Handle OAuth errors from Microsoft
        if (error) {
          console.error('Microsoft OAuth error:', error, errorDescription);
          
          const errorMessages: Record<string, string> = {
            'access_denied': 'You cancelled the Microsoft authentication process.',
            'invalid_request': 'Invalid authentication request. Please try again.',
            'invalid_client': 'Microsoft application configuration error.',
            'invalid_grant': 'Authentication expired. Please try again.',
            'server_error': 'Microsoft server error. Please try again later.',
            'temporarily_unavailable': 'Microsoft services temporarily unavailable.'
          };
          
          const friendlyMessage = errorMessages[error] || errorDescription || `Authentication failed: ${error}`;
          throw new Error(friendlyMessage);
        }

        // Validate required parameters
        if (!code) {
          throw new Error('No authorization code received from Microsoft. Please try connecting again.');
        }

        if (!state) {
          throw new Error('Security validation failed. Please try connecting again.');
        }

        setProgress('Validating session...');

        // Validate session data
        let storedUserId: string | null = null;
        try {
          storedUserId = sessionStorage.getItem('microsoft_auth_user_id');
        } catch (e) {
          console.error('Session storage access error:', e);
        }
        
        if (!storedUserId || storedUserId !== state) {
          throw new Error('Authentication session is invalid. Please try connecting again.');
        }

        setProgress('Exchanging authorization code...');

        // Call Microsoft auth edge function with timeout handling
        try {
          console.log('Calling microsoft-auth function...');
          
          // Set a promise-based timeout
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout after 60 seconds')), 60000);
          });

          const authPromise = supabase.functions.invoke('microsoft-auth', {
            body: { code, user_id: state },
            headers: {
              'Content-Type': 'application/json'
            }
          });

          const { data, error: authError } = await Promise.race([authPromise, timeoutPromise]) as any;

          if (authError) {
            throw new Error(`Authentication service error: ${authError.message}`);
          }

          if (data?.error) {
            throw new Error(data.error);
          }

          if (!data?.success) {
            throw new Error('Authentication failed - no success response');
          }

          setProgress('Connection successful!');

          // Clean up session storage
          try {
            sessionStorage.removeItem('microsoft_auth_user_id');
            sessionStorage.removeItem('microsoft_auth_nonce');
            sessionStorage.removeItem('microsoft_auth_timestamp');
          } catch (e) {
            console.warn('Session cleanup warning:', e);
          }

          // Store success marker
          try {
            localStorage.setItem('microsoft_auth_success', 'true');
            localStorage.setItem('microsoft_auth_timestamp', Date.now().toString());
          } catch (e) {
            console.warn('Local storage warning:', e);
          }

          toast({
            title: "Microsoft Account Connected!",
            description: `Successfully connected to ${data.user?.displayName || data.user?.mail || 'Microsoft 365'}`,
          });

          // Navigate back with success state
          setTimeout(() => {
            navigate('/?microsoft_connected=true', { replace: true });
          }, 1500);

        } catch (fetchError: any) {
          if (fetchError.message?.includes('timeout')) {
            throw new Error('Authentication request timed out. Please try again.');
          }
          throw fetchError;
        }

      } catch (error: any) {
        console.error('Microsoft callback processing error:', error);
        
        setError(error.message);
        setProgress('Authentication failed');
        
        // Clean up on error
        try {
          sessionStorage.removeItem('microsoft_auth_user_id');
          sessionStorage.removeItem('microsoft_auth_nonce');
          sessionStorage.removeItem('microsoft_auth_timestamp');
          localStorage.setItem('microsoft_auth_error', error.message);
        } catch (e) {
          console.warn('Error cleanup warning:', e);
        }
        
        toast({
          title: "Connection Failed",
          description: error.message || "Failed to complete Microsoft authentication.",
          variant: "destructive"
        });
        
        // Navigate back after showing error
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 3000);
      } finally {
        setProcessing(false);
      }
    };

    handleCallback();
  }, [searchParams, navigate, toast]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="mb-6">
          {error ? (
            <XCircle className="h-16 w-16 text-red-500 mx-auto" />
          ) : processing ? (
            <Loader2 className="h-16 w-16 text-blue-600 mx-auto animate-spin" />
          ) : (
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          )}
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {error ? 'Connection Failed' : processing ? 'Connecting Microsoft Account' : 'Connection Successful'}
        </h2>
        
        <p className="text-gray-600 mb-6">
          {error || progress}
        </p>

        {processing && !error && (
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse transition-all duration-300" style={{ width: '70%' }}></div>
          </div>
        )}

        {error && (
          <p className="text-sm text-gray-500">
            Redirecting back to the main page...
          </p>
        )}

        {!error && processing && (
          <p className="text-sm text-gray-500">
            Please wait while we complete the connection...
          </p>
        )}
      </div>
    </div>
  );
};
