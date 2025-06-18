
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

  // Get the correct redirect URI based on environment
  const getRedirectUri = () => {
    // Use the production domain if available, otherwise fall back to current origin
    const productionDomain = 'https://iskconbureau.in';
    const currentOrigin = window.location.origin;
    
    // Check if we're on the production domain
    if (currentOrigin.includes('iskconbureau.in')) {
      return `${productionDomain}/microsoft/callback`;
    }
    
    // For development and preview environments
    return `${currentOrigin}/microsoft/callback`;
  };

  useEffect(() => {
    const handleCallback = async () => {
      // Set a timeout for the entire callback process
      const timeoutId = setTimeout(() => {
        if (processing) {
          console.error('Microsoft callback processing timeout');
          setError('Connection timeout. Please try again.');
          setProgress('Connection timeout');
          setProcessing(false);
        }
      }, 30000); // 30 second timeout

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

        // Handle OAuth errors with better error messages
        if (error) {
          clearTimeout(timeoutId);
          const errorMessages: Record<string, string> = {
            'access_denied': 'You cancelled the Microsoft authentication process.',
            'invalid_request': 'The authentication request was invalid. This usually means the redirect URI doesn\'t match what\'s configured in Azure. Please contact your administrator.',
            'invalid_client': 'Microsoft application configuration error. Please contact your administrator.',
            'invalid_grant': 'Authentication expired. Please try again.',
            'server_error': 'Microsoft server error. Please try again later.',
            'temporarily_unavailable': 'Microsoft services temporarily unavailable.',
            'interaction_required': 'Additional authentication required. Please try signing in again.',
            'login_required': 'Please sign in to your Microsoft account.',
            'consent_required': 'Additional permissions required. Please try again.'
          };
          
          const friendlyMessage = errorMessages[error] || errorDescription || `Authentication failed: ${error}`;
          throw new Error(friendlyMessage);
        }

        if (!code || !state) {
          clearTimeout(timeoutId);
          throw new Error('Invalid callback parameters received from Microsoft.');
        }

        setProgress('Validating session...');

        // Validate session data
        const storedUserId = sessionStorage.getItem('microsoft_auth_user_id');
        const storedTimestamp = sessionStorage.getItem('microsoft_auth_timestamp');
        
        if (!storedUserId || storedUserId !== state) {
          clearTimeout(timeoutId);
          throw new Error('Authentication session is invalid. Please try again.');
        }

        // Check if the session is too old (more than 10 minutes)
        if (storedTimestamp) {
          const timestamp = parseInt(storedTimestamp);
          const age = Date.now() - timestamp;
          if (age > 10 * 60 * 1000) { // 10 minutes
            clearTimeout(timeoutId);
            throw new Error('Authentication session expired. Please try again.');
          }
        }

        setProgress('Exchanging authorization code...');

        const redirectUri = getRedirectUri();
        console.log('Using redirect URI for token exchange:', redirectUri);

        // Exchange code for tokens with timeout
        const tokenController = new AbortController();
        const tokenTimeoutId = setTimeout(() => tokenController.abort(), 15000); // 15 second timeout

        try {
          const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              client_id: '44391516-babe-4072-8422-a4fc8a79fbde',
              code: code,
              redirect_uri: redirectUri,
              grant_type: 'authorization_code',
              scope: 'https://graph.microsoft.com/User.Read https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Calendars.ReadWrite https://graph.microsoft.com/Files.ReadWrite.All offline_access'
            }),
            signal: tokenController.signal
          });

          clearTimeout(tokenTimeoutId);

          if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('Token exchange failed:', tokenResponse.status, errorText);
            
            // Handle specific token exchange errors
            if (tokenResponse.status === 400) {
              try {
                const errorData = JSON.parse(errorText);
                if (errorData.error === 'invalid_grant') {
                  throw new Error('The authorization code is invalid or expired. Please try authenticating again.');
                }
                if (errorData.error === 'invalid_request' && errorData.error_description?.includes('redirect_uri')) {
                  throw new Error('Redirect URI mismatch. Please contact your administrator to update the Azure App Registration.');
                }
              } catch (parseError) {
                // Continue with generic error handling
              }
            }
            
            throw new Error(`Failed to exchange authorization code: ${tokenResponse.status}`);
          }

          const tokenData = await tokenResponse.json();
          setProgress('Fetching user information...');

          // Fetch user info with timeout
          const userController = new AbortController();
          const userTimeoutId = setTimeout(() => userController.abort(), 10000); // 10 second timeout

          try {
            const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
              headers: {
                'Authorization': `Bearer ${tokenData.access_token}`
              },
              signal: userController.signal
            });

            clearTimeout(userTimeoutId);

            if (!userResponse.ok) {
              throw new Error(`Failed to fetch user information: ${userResponse.status}`);
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

            setProgress('Connection successful!');

            toast({
              title: "Microsoft Account Connected!",
              description: `Successfully connected to ${userInfo.displayName || userInfo.mail}`,
            });

            // Navigate back with success
            setTimeout(() => {
              navigate('/?microsoft_connected=true', { replace: true });
            }, 1500);

          } catch (userError) {
            clearTimeout(userTimeoutId);
            if (userError.name === 'AbortError') {
              throw new Error('Timeout fetching user information. Please try again.');
            }
            throw userError;
          }

        } catch (tokenError) {
          clearTimeout(tokenTimeoutId);
          if (tokenError.name === 'AbortError') {
            throw new Error('Timeout exchanging authorization code. Please try again.');
          }
          throw tokenError;
        }

        clearTimeout(timeoutId);

      } catch (error: any) {
        console.error('Microsoft callback processing error:', error);
        
        setError(error.message);
        setProgress('Authentication failed');
        
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
        // Clean up session storage
        try {
          sessionStorage.removeItem('microsoft_auth_user_id');
          sessionStorage.removeItem('microsoft_auth_nonce');
          sessionStorage.removeItem('microsoft_auth_timestamp');
        } catch (e) {
          console.warn('Session cleanup warning:', e);
        }
        
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

        {error && error.includes('redirect URI') && (
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-800">
              <strong>Administrator Note:</strong> The redirect URI needs to be added to the Azure App Registration. 
              Please add <code className="bg-yellow-100 px-1 rounded">{getRedirectUri()}</code> to the list of redirect URIs.
            </p>
          </div>
        )}

        {error && (
          <p className="text-sm text-gray-500 mt-4">
            Redirecting back to the main page...
          </p>
        )}
      </div>
    </div>
  );
};
