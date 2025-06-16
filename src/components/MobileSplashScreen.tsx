
import React, { useEffect, useState } from 'react';
import { useDeviceInfo } from '@/hooks/useDeviceInfo';

export const MobileSplashScreen: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const deviceInfo = useDeviceInfo();

  useEffect(() => {
    // Hide splash screen after 2 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
      <div className="flex flex-col items-center space-y-6">
        {/* App Logo */}
        <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center">
          <span className="text-white text-2xl font-bold">IMP</span>
        </div>
        
        {/* App Name */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">ISKCON Management Portal</h1>
          <p className="text-gray-600 mt-1">
            {deviceInfo.isNative ? 'Mobile App' : 'Web Portal'}
          </p>
        </div>
        
        {/* Loading Animation */}
        <div className="flex space-x-2">
          <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
      
      {/* Version info for native apps */}
      {deviceInfo.isNative && (
        <div className="absolute bottom-8 text-center">
          <p className="text-xs text-gray-500">
            {deviceInfo.operatingSystem} {deviceInfo.osVersion}
          </p>
        </div>
      )}
      
      {/* Footer */}
      <div className="absolute bottom-4 text-center">
        <p className="text-xs text-gray-400">
          © 2025 ISKCON Management Platform
        </p>
      </div>
    </div>
  );
};
