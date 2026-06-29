<template>
  <ion-app>
    <ion-router-outlet />
    <BottomNav v-if="showNav" />
  </ion-app>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { IonApp, IonRouterOutlet, alertController } from '@ionic/vue';
import BottomNav from '@/components/BottomNav.vue';
import { App } from '@capacitor/app';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const showNav = computed(() =>
  ['Home', 'Recordings', 'Search', 'Profile', 'RecordingDetail'].includes(route.name as string)
);

let backButtonHandler: any = null;
let appStateHandler: any = null;

async function showWelcomeToPro(plan: string) {
  const label = plan === 'team' ? 'Team' : 'Pro';
  const alert = await alertController.create({
    header: `🎉 Welcome to ${label}!`,
    message: `Your ${label} plan is now active. Enjoy unlimited recordings, all languages, PDF export and more.`,
    buttons: [{ text: 'Let\'s go!', role: 'confirm' }],
    cssClass: 'welcome-alert',
  });
  await alert.present();
}

onMounted(() => {
  backButtonHandler = App.addListener('backButton', ({ canGoBack }) => {
    const currentRoute = router.currentRoute.value;
    if (currentRoute.name === 'Home' || currentRoute.name === 'Splash') {
      App.exitApp();
    } else if (canGoBack) {
      router.back();
    } else {
      App.exitApp();
    }
  });

  // Refresh user plan when app comes back to foreground (e.g. after paying on web)
  appStateHandler = App.addListener('appStateChange', async ({ isActive }) => {
    if (isActive && authStore.isAuthenticated) {
      const planBefore = authStore.user?.plan ?? 'free';
      await authStore.fetchUser();
      const planAfter = authStore.user?.plan ?? 'free';
      if (planBefore === 'free' && planAfter !== 'free') {
        await showWelcomeToPro(planAfter);
      }
    }
  });

});

onUnmounted(() => {
  backButtonHandler?.remove();
  appStateHandler?.remove();
});
</script>
