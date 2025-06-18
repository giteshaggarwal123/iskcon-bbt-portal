
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMicrosoftSession } from '@/hooks/useMicrosoftSession';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export const MicrosoftCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { storeSession } = useMicrosoftSession();
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

        // Handle OAuth errors
        if (error) {
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

        if (!code || !state) {
          throw new Error('Invalid callback parameters received from Microsoft.');
        }

        setProgress('Validating session...');

        // Validate session data
        const storedUserId = sessionStorage.getItem('microsoft_auth_user_id');
        if (!storedUserId || storedUserId !== state) {
          throw new Error('Authentication session is invalid. Please try again.');
        }

        setProgress('Exchanging authorization code...');

        // Exchange code for tokens
        const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: '44391516-babe-4072-8422-a4fc8a79fbde',
            client_secret: '', // This should be handled server-side in production
            code: code,
            redirect_uri: `${window.location.origin}/microsoft/callback`,
            grant_type: 'authorization_code',
            scope: 'https://graph.microsoft.com/User.Read https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Calendars.ReadWrite https://graph.microsoft.com/Files.ReadWrite.All offline_access'
          })
        });

        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          console.error('Token exchange failed:', errorText);
          throw new Error('Failed to exchange authorization code for tokens');
        }

        const tokenData = await tokenResponse.json();
        setProgress('Fetching user information...');

        // Fetch user info
        const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`
          }
        });

        if (!userResponse.ok) {
          throw new Error('Failed to fetch user information from Microsoft Graph');
        }

        const userInfo = await userResponse.json();
        setProgress('Storing session...');

        // Create session object
        const sessionData = {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresAt: Date.now() + (tokenData.expires_in - 300) * 1000, // 5-minute buffer
          userInfo: {
            displayName: userInfo.displayName,
            mail: userInfo.mail || userInfo.userPrincipalName,
            id: userInfo.id
          }
        };

        // Store the session
        storeSession(sessionData);

        // Clean up session storage
        try {
          sessionStorage.removeItem('microsoft_auth_user_id');
          sessionStorage.removeItem('microsoft_auth_nonce');
          sessionStorage.removeItem('microsoft_auth_timestamp');
        } catch (e) {
          console.warn('Session cleanup warning:', e);
        }

        setProgress('Connection successful!');

        toast({
          title: "Microsoft Account Connected!",
          description: `Successfully connected to ${userInfo.displayName || userInfo.mail}`,
        });

        // Navigate back with success
        setTimeout(() => {
          navigate('/?microsoft_connected=true', { replace: true });
        }, 1500);

      } catch (error: any) {
        console.error('Microsoft callback processing error:', error);
        
        setError(error.message);
        setProgress('Authentication failed');
        
        // Clean up on error
        try {
          sessionStorage.removeItem('microsoft_auth_user_id');
          sessionStorage.removeItem('microsoft_auth_nonce');
          sessionStorage.removeItem('microsoft_auth_timestamp');
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
  }, [searchParams, navigate, toast, storeSession]);

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
      </div>
    </div>
  );
};
