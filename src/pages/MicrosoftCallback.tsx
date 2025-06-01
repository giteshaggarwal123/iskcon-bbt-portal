
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

      if (error) {
        console.error('Microsoft OAuth error:', error);
        toast({
          title: "Authentication Failed",
          description: "Microsoft authentication was cancelled or failed.",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      if (!code || !state) {
        toast({
          title: "Authentication Failed", 
          description: "Invalid callback parameters from Microsoft.",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      try {
        // Get the stored user ID
        const storedUserId = sessionStorage.getItem('microsoft_auth_user_id');
        if (storedUserId !== state) {
          throw new Error('Invalid state parameter');
        }

        // Call the Microsoft auth edge function
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

        // Clean up session storage
        sessionStorage.removeItem('microsoft_auth_user_id');

        toast({
          title: "Microsoft Account Connected!",
          description: `Successfully connected ${data.user.displayName || data.user.mail}. You can now use Outlook, Teams, and SharePoint features.`
        });

        navigate('/');

      } catch (error: any) {
        console.error('Microsoft callback error:', error);
        toast({
          title: "Connection Failed",
          description: error.message || "Failed to complete Microsoft authentication.",
          variant: "destructive"
        });
        navigate('/');
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
        </div>
      </div>
    );
  }

  return null;
};
