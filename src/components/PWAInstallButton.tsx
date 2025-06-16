
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Smartphone } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isStandalone, promptInstall } = usePWA();

  // Don't show button if already installed or not installable
  if (isInstalled || isStandalone || !isInstallable) {
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
      className="bg-primary hover:bg-primary/90 text-white shadow-lg"
      size="lg"
    >
      <Download className="h-4 w-4 mr-2" />
      Install App
    </Button>
  );
};
