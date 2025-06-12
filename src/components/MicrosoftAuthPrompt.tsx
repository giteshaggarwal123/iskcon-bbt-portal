
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
  const { isConnected } = useMicrosoftAuth();
  const { user } = useAuth();

  useEffect(() => {
    if (isConnected) {
      onClose();
    }
  }, [isConnected, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" hideCloseButton>
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

        <div className="space-y-3">
          <MicrosoftOAuthButton onSuccess={onClose} />
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={onSkip}
              className="flex-1"
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
