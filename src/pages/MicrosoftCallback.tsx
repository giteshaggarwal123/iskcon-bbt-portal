
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const MicrosoftCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      console.log('Microsoft callback received:', { 
        code: code ? 'present' : 'missing', 
        state: state ? 'present' : 'missing', 
        error, 
        errorDescription 
      });

      if (error) {
        console.error('Microsoft OAuth error:', error, errorDescription);
        toast({
          title: "Authentication Failed",
          description: errorDescription || "Microsoft authentication was cancelled or failed.",
          variant: "destructive"
        });
        navigate('/', { replace: true });
        return;
      }

      if (!code || !state) {
        console.error('Missing callback parameters:', { code: !!code, state: !!state });
        toast({
          title: "Authentication Failed", 
          description: "Invalid callback parameters from Microsoft.",
          variant: "destructive"
        });
        navigate('/', { replace: true });
        return;
      }

      try {
        // Get the stored user ID with better error handling
        const storedUserId = sessionStorage.getItem('microsoft_auth_user_id');
        console.log('Stored user ID:', storedUserId ? 'present' : 'missing');
        console.log('State from URL:', state);
        
        if (!storedUserId) {
          throw new Error('No stored user ID found in session');
        }
        
        if (storedUserId !== state) {
          throw new Error('Invalid state parameter - possible CSRF attack');
        }

        console.log('Calling Microsoft auth edge function...');

        // Call the Microsoft auth edge function with retry logic
        const { data, error: authError } = await supabase.functions.invoke('microsoft-auth', {
          body: {
            code,
            user_id: state
          }
        });

        if (authError) {
          console.error('Edge function error:', authError);
          throw authError;
        }

        if (data.error) {
          console.error('Microsoft auth error:', data.error);
          throw new Error(data.error);
        }

        console.log('Microsoft auth successful:', data.user?.displayName || data.user?.mail);

        // Clean up session storage
        sessionStorage.removeItem('microsoft_auth_user_id');

        // Mark prompt as shown to prevent it from appearing again
        localStorage.setItem('microsoft_prompt_shown', 'true');

        toast({
          title: "Microsoft Account Connected!",
          description: `Successfully connected ${data.user.displayName || data.user.mail}. You can now use Outlook, Teams, and SharePoint features.`
        });

        // Navigate back to home
        navigate('/', { replace: true });

        // Force a page reload to ensure all components refresh their Microsoft auth state
        setTimeout(() => {
          window.location.reload();
        }, 1000);

      } catch (error: any) {
        console.error('Microsoft callback error:', error);
        
        // Clean up session storage on error
        sessionStorage.removeItem('microsoft_auth_user_id');
        
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting your Microsoft account...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait while we complete the setup.</p>
        </div>
      </div>
    );
  }

  return null;
};
