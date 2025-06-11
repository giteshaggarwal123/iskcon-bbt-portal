
/// <reference types="vite/client" />

declare global {
  interface Window {
    Capacitor?: {
      platform: string;
      isNative: boolean;
    };
  }
}

export {};
