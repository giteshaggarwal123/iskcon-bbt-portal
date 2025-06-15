
import { useEffect, useState } from 'react';
import { useDeviceInfo } from './useDeviceInfo';

export const useDeepLinking = () => {
  const deviceInfo = useDeviceInfo();
  const [isNativeApp, setIsNativeApp] = useState(false);

  useEffect(() => {
    // Check if we're running in a Capacitor native app
    setIsNativeApp(deviceInfo.isNative || window.Capacitor?.isNative || false);
  }, [deviceInfo]);

  const openTeamsLink = (meetingUrl: string) => {
    if (isNativeApp || deviceInfo.platform === 'android' || deviceInfo.platform === 'ios') {
      // Try to open in Teams app first
      const teamsAppUrl = `msteams://teams.microsoft.com/l/meetup-join/${encodeURIComponent(meetingUrl)}`;
      
      // For native app, try to open Teams app directly
      if (window.Capacitor?.isNative) {
        window.open(teamsAppUrl, '_system');
        return;
      }
      
      // For mobile web, create a fallback mechanism
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = teamsAppUrl;
      document.body.appendChild(iframe);
      
      // Fallback to web version after a short delay if app doesn't open
      setTimeout(() => {
        document.body.removeChild(iframe);
        window.open(meetingUrl, '_blank');
      }, 2000);
    } else {
      // Desktop - open in new tab
      window.open(meetingUrl, '_blank');
    }
  };

  const openOutlookLink = (emailId?: string) => {
    const baseOutlookUrl = 'https://outlook.office.com/mail/inbox';
    const fullUrl = emailId ? `${baseOutlookUrl}/id/${emailId}` : baseOutlookUrl;
    
    if (isNativeApp || deviceInfo.platform === 'android' || deviceInfo.platform === 'ios') {
      // Try to open in Outlook app first
      const outlookAppUrl = `ms-outlook://emails/${emailId || ''}`;
      
      // For native app, try to open Outlook app directly
      if (window.Capacitor?.isNative) {
        window.open(outlookAppUrl, '_system');
        return;
      }
      
      // For mobile web, create a fallback mechanism
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = outlookAppUrl;
      document.body.appendChild(iframe);
      
      // Fallback to web version after a short delay if app doesn't open
      setTimeout(() => {
        document.body.removeChild(iframe);
        window.open(fullUrl, '_blank');
      }, 2000);
    } else {
      // Desktop - open in new tab
      window.open(fullUrl, '_blank');
    }
  };

  return {
    openTeamsLink,
    openOutlookLink,
    isNativeApp
  };
};
