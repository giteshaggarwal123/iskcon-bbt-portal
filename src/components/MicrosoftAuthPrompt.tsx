
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MicrosoftOAuthButton } from './MicrosoftOAuthButton';
import { useMicrosoftAuth } from '@/hooks/useMicrosoftAuth';
import { useAuth } from '@/hooks/useAuth';

interface MicrosoftAuthPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onSkip: () => void;
}

export const MicrosoftAuthPrompt: React.FC<MicrosoftAuthPromptProps> = ({ 
  isOpen, 
  onClose, 
  onSkip 
}) => {
  const { isConnected, loading } = useMicrosoftAuth();
  const { user } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);

  // Close dialog immediately when Microsoft account gets connected
  useEffect(() => {
    if (isConnected && !loading) {
      console.log('Microsoft connected, closing prompt');
      onClose();
    }
  }, [isConnected, loading, onClose]);

  // Don't show the dialog if user is not authenticated
  if (!user) {
    return null;
  }

  // Don't show the dialog if Microsoft is already connected
  if (isConnected) {
    return null;
  }

  const handleConnect = () => {
    setIsConnecting(true);
  };

  const handleSkip = () => {
    console.log('User skipped Microsoft connection');
    onSkip();
  };

  const handleClose = () => {
    console.log('User closed Microsoft prompt');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
              </svg>
            </div>
          </div>
          <DialogTitle className="text-center">Connect Microsoft 365</DialogTitle>
          <DialogDescription className="text-center">
            To get the full experience of ISKCON Bureau Portal, connect your Microsoft 365 account. This will enable:
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 mb-6">
          <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-blue-800">Access your Outlook emails</span>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-green-800">Create Teams meetings</span>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-sm text-purple-800">Sync SharePoint documents</span>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2">Enhanced Microsoft Integration</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                <span className="text-xs text-blue-700">Automatic token refresh every 30 minutes</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                <span className="text-xs text-blue-700">Persistent connection until manually disconnected</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                <span className="text-xs text-blue-700">Enhanced error handling and recovery</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={handleConnect}
            disabled={loading || isConnecting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading || isConnecting ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Connecting...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
                </svg>
                <span>Connect Microsoft 365</span>
              </div>
            )}
          </Button>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={handleSkip}
              className="flex-1"
              disabled={loading || isConnecting}
            >
              Skip for now
            </Button>
          </div>
        </div>
        
        <p className="text-xs text-gray-500 text-center mt-4">
          You can connect your Microsoft account later in Settings
        </p>
      </DialogContent>
    </Dialog>
  );
};
