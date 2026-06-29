import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'rec.ai',
  appName: 'Echobits',
  webDir: 'www',
  server: {
    allowNavigation: ['*'],
  },
  plugins: {
    StatusBar: {
      overlaysWebView: true,
      style: 'DEFAULT',
      backgroundColor: '#00000000',
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '1004219063159-uhcjuruvg9fp6c0ti5rad22gi64am8k4.apps.googleusercontent.com', // Web client ID from Google Console
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
