
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Smartphone } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isStandalone, promptInstall } = usePWA();

  // Don't show button if already installed or running as standalone PWA
  if (isInstalled || isStandalone) {
    return null;
  }

  // Only show if installable
  if (!isInstallable) {
    return null;
  }

  const handleInstall = () => {
    if (promptInstall) {
      promptInstall();
    }
  };

  return (
    <Button
      onClick={handleInstall}
      variant="outline"
      size="sm"
      className="flex items-center gap-2 text-sm bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
      title="Install this app on your device"
    >
      <Smartphone className="h-4 w-4" />
      <span className="hidden sm:inline">Install App</span>
    </Button>
  );
};
