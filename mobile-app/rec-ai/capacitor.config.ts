import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'rec.ai',
  appName: 'Echobit',
  webDir: 'www',
  server: {
    cleartext: true,
    allowNavigation: ['*'],
    // Uncomment below for live reload debugging (run 'npm run dev' first)
    // url: 'http://192.168.1.6:5173',
    // cleartext: true
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '1004219063159-uhcjuruvg9fp6c0ti5rad22gi64am8k4.apps.googleusercontent.com', // Web client ID from Google Console
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
