
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { clearBrowserCache } from './utils/clearCache'

// Clear cache on app start to fix incognito-only issues
const initApp = async () => {
  // Check if we need to clear cache
  const cacheCleared = sessionStorage.getItem('cacheCleared');
  
  if (!cacheCleared) {
    console.log('Clearing cache on app initialization');
    await clearBrowserCache();
    sessionStorage.setItem('cacheCleared', 'true');
  }
  
  createRoot(document.getElementById("root")!).render(<App />);
};

initApp();
