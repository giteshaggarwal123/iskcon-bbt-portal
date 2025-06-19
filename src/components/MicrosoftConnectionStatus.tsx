
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Unlink } from 'lucide-react';
import { useMicrosoftAuth } from '@/hooks/useMicrosoftAuth';
import { useToast } from '@/hooks/use-toast';

export const MicrosoftConnectionStatus: React.FC = () => {
  const { isConnected, isExpired, loading, disconnectMicrosoft, forceRefresh, lastError } = useMicrosoftAuth();
  const { toast } = useToast();

  const getStatusConfig = () => {
    if (loading) {
      return {
        icon: RefreshCw,
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        text: 'Checking...',
        description: 'Verifying Microsoft 365 connection'
      };
    }

    if (isConnected && !isExpired) {
      return {
        icon: CheckCircle,
        color: 'bg-green-100 text-green-800 border-green-200',
        text: 'Microsoft 365 Connected',
        description: 'Microsoft 365 services are available and tokens are automatically refreshed'
      };
    }

    if (isExpired || (lastError && (lastError.includes('invalid_grant') || lastError.includes('AADSTS50173') || lastError.includes('expired')))) {
      return {
        icon: AlertCircle,
        color: 'bg-red-100 text-red-800 border-red-200',
        text: 'Authentication Expired',
        description: 'Microsoft account authentication has expired and needs to be reconnected. This usually happens after a password change or security policy update.'
      };
    }

    if (lastError) {
      return {
        icon: XCircle,
        color: 'bg-red-100 text-red-800 border-red-200',
        text: 'Connection Error',
        description: lastError
      };
    }

    return {
      icon: XCircle,
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      text: 'Not Connected',
      description: 'Connect your Microsoft account in Settings to access Outlook, Teams, and SharePoint'
    };
  };

  const handleRefresh = () => {
    forceRefresh();
    toast({
      title: "Refreshing Connection",
      description: "Checking and refreshing Microsoft 365 connection..."
    });
  };

  const handleDisconnect = () => {
    disconnectMicrosoft();
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;
  const needsReconnection = isExpired || (lastError && (lastError.includes('invalid_grant') || lastError.includes('AADSTS50173') || lastError.includes('expired')));

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center space-x-2">
            <Badge 
              variant="outline" 
              className={`${config.color} border flex items-center space-x-1 px-2 py-1`}
            >
              <IconComponent 
                className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} 
              />
              <span className="text-xs font-medium">{config.text}</span>
            </Badge>
            {!loading && (
              <div className="flex items-center space-x-1">
                {!needsReconnection && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefresh}
                    className="h-6 w-6 p-0"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                )}
                {(isConnected || lastError) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDisconnect}
                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                  >
                    <Unlink className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm max-w-xs">{config.description}</p>
          {!isConnected && !needsReconnection && (
            <p className="text-xs text-muted-foreground mt-1">
              Go to Settings → Integrations to connect
            </p>
          )}
          {needsReconnection && (
            <div className="mt-2 space-y-1">
              <p className="text-xs text-red-600 font-medium">
                Action Required: Disconnect and reconnect your account
              </p>
              <p className="text-xs text-muted-foreground">
                1. Click the disconnect button above<br/>
                2. Go to Settings → Integrations<br/>
                3. Click "Connect Microsoft 365" again
              </p>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
