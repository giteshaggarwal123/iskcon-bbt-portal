
import { useEffect } from 'react';
import { clearBrowserCache } from '@/utils/clearCache';

export const useCacheBuster = () => {
  useEffect(() => {
    const checkAndClearCache = async () => {
      // Check if this is a fresh session
      const lastClear = localStorage.getItem('lastCacheClear');
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      
      if (!lastClear || (now - parseInt(lastClear)) > oneHour) {
        console.log('Clearing cache for fresh session');
        await clearBrowserCache();
        localStorage.setItem('lastCacheClear', now.toString());
      }
    };
    
    checkAndClearCache();
  }, []);
};
