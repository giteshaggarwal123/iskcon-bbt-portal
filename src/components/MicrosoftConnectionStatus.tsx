
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const MicrosoftConnectionStatus: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'expired' | 'checking'>('checking');
  const [userInfo, setUserInfo] = useState<{ name?: string; email?: string } | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const checkConnection = async () => {
    if (!user) {
      setConnectionStatus('disconnected');
      return;
    }

    setConnectionStatus('checking');

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('microsoft_access_token, microsoft_user_id, token_expires_at')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (!profile?.microsoft_access_token) {
        setConnectionStatus('disconnected');
        setUserInfo(null);
        return;
      }

      // Check if token is expired
      const expiresAt = new Date(profile.token_expires_at);
      const now = new Date();
      
      if (expiresAt <= now) {
        setConnectionStatus('expired');
        setUserInfo(null);
        return;
      }

      // Test the connection by making a simple API call
      const response = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          'Authorization': `Bearer ${profile.microsoft_access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setConnectionStatus('connected');
        setUserInfo({
          name: userData.displayName,
          email: userData.mail || userData.userPrincipalName
        });
      } else {
        setConnectionStatus('expired');
        setUserInfo(null);
      }
    } catch (error) {
      console.error('Error checking Microsoft connection:', error);
      setConnectionStatus('disconnected');
      setUserInfo(null);
    }
  };

  useEffect(() => {
    checkConnection();
  }, [user]);

  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: CheckCircle,
          color: 'bg-green-100 text-green-800 border-green-200',
          text: 'Microsoft 365 Connected',
          description: userInfo ? `Connected as ${userInfo.name || userInfo.email}` : 'Microsoft 365 services are available'
        };
      case 'expired':
        return {
          icon: AlertCircle,
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          text: 'Token Expired',
          description: 'Please reconnect your Microsoft account in Settings'
        };
      case 'checking':
        return {
          icon: RefreshCw,
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          text: 'Checking...',
          description: 'Verifying Microsoft 365 connection'
        };
      default:
        return {
          icon: XCircle,
          color: 'bg-red-100 text-red-800 border-red-200',
          text: 'Not Connected',
          description: 'Connect your Microsoft account in Settings to access Outlook, Teams, and SharePoint'
        };
    }
  };

  const handleRefresh = () => {
    checkConnection();
    toast({
      title: "Refreshing Connection",
      description: "Checking Microsoft 365 connection status..."
    });
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Badge 
              variant="outline" 
              className={`${config.color} border flex items-center space-x-1 px-2 py-1 max-w-xs`}
            >
              <IconComponent 
                className={`h-3 w-3 flex-shrink-0 ${connectionStatus === 'checking' ? 'animate-spin' : ''}`} 
              />
              <span className="text-xs font-medium truncate">{config.text}</span>
            </Badge>
            {connectionStatus !== 'checking' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="h-6 w-6 p-0 flex-shrink-0"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="text-sm">{config.description}</p>
          {connectionStatus !== 'connected' && (
            <p className="text-xs text-muted-foreground mt-1">
              Go to Settings → Integrations to connect
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
