import { createApp } from 'vue'
import App from './App.vue'
import router from './router';
import { pinia } from './stores';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

import { IonicVue } from '@ionic/vue';

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';

/* Theme variables — must come before app mount so dark class is set first */
import './theme/variables.css';

// Restore persisted theme before the app renders to avoid flash.
// We use both body.dark and body.light classes so the manual preference
// beats the system @media (prefers-color-scheme: dark) query (body.* has
// higher specificity than :root inside a media query).
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  document.body.classList.add('dark');
  document.body.classList.remove('light');
} else if (savedTheme === 'light') {
  document.body.classList.add('light');
  document.body.classList.remove('dark');
}
// No saved preference → both classes absent, system preference applies via @media

const app = createApp(App)
  .use(IonicVue)
  .use(pinia)
  .use(router);

router.isReady().then(async () => {
  app.mount('#app');

  if (Capacitor.isNativePlatform()) {
    GoogleAuth.initialize();
  }

  if (Capacitor.isNativePlatform()) {
    // Let the web view extend under the status bar so that
    // env(safe-area-inset-top) is correctly populated per device.
    await StatusBar.setOverlaysWebView({ overlay: true });

    // Match status bar style to current theme
    const isDark = document.body.classList.contains('dark') ||
      (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
  }
});
