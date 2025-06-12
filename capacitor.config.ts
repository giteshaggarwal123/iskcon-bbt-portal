
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.6a0fd4efa0294c9d95ed74a4fa947c60',
  appName: 'ISKCON BUREAU PORTAL',
  webDir: 'dist',
  server: {
    url: 'https://6a0fd4ef-a029-4c9d-95ed-74a4fa947c60.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      showSpinner: false
    },
    StatusBar: {
      style: 'default',
      backgroundColor: '#ffffff'
    }
  }
};

export default config;
