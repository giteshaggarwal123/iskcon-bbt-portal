
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Unlink } from 'lucide-react';
import { useMicrosoftAuth } from '@/hooks/useMicrosoftAuth';
import { useToast } from '@/hooks/use-toast';

export const MicrosoftConnectionStatus: React.FC = () => {
  const { isConnected, isExpired, loading, disconnectMicrosoft, forceRefresh } = useMicrosoftAuth();
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

    if (isConnected && isExpired) {
      return {
        icon: AlertCircle,
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        text: 'Token Refresh Failed',
        description: 'Please reconnect your Microsoft account'
      };
    }

    return {
      icon: XCircle,
      color: 'bg-red-100 text-red-800 border-red-200',
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  className="h-6 w-6 p-0"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
                {isConnected && (
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
          <p className="text-sm">{config.description}</p>
          {!isConnected && (
            <p className="text-xs text-muted-foreground mt-1">
              Go to Settings → Integrations to connect
            </p>
          )}
          {isConnected && !isExpired && (
            <p className="text-xs text-green-600 mt-1">
              Tokens auto-refresh every 30 minutes
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
