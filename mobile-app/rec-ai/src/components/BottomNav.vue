<template>
  <div class="bottom-nav">
    <!-- Sliding active pill indicator -->
    <div class="nav-pill" :style="pillStyle"></div>

    <button
      v-for="tab in tabs"
      :key="tab.name"
      class="nav-item"
      :class="{ active: activeTab === tab.name, 'nav-record-btn': tab.name === 'record' }"
      @click="navigate(tab)"
    >
      <!-- Record button gets special treatment -->
      <template v-if="tab.name === 'record'">
        <div class="nav-record">
          <div class="nav-record-ring ring-1"></div>
          <div class="nav-record-ring ring-2"></div>
          <ion-icon :icon="tab.icon"></ion-icon>
        </div>
      </template>

      <template v-else>
        <div class="nav-icon-wrap">
          <ion-icon :icon="activeTab === tab.name ? tab.activeIcon : tab.icon"></ion-icon>
        </div>
        <span class="nav-label">{{ tab.label }}</span>
      </template>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { IonIcon } from '@ionic/vue';
import { setNavSlideDir } from '@/utils/navDirection';
import {
  home, homeOutline,
  list, listOutline,
  mic,
  search, searchOutline,
  person, personOutline,
} from 'ionicons/icons';

const router = useRouter();
const route = useRoute();

const tabs = [
  { name: 'home',       label: 'Home',    icon: homeOutline,   activeIcon: home,    path: '/home'       },
  { name: 'recordings', label: 'Library', icon: listOutline,   activeIcon: list,    path: '/recordings' },
  { name: 'record',     label: '',        icon: mic,           activeIcon: mic,     path: '/record'     },
  { name: 'search',     label: 'Search',  icon: searchOutline, activeIcon: search,  path: '/search'     },
  { name: 'profile',    label: 'Profile', icon: personOutline, activeIcon: person,  path: '/profile'    },
];

const activeTab = computed(() => {
  const name = route.name as string;
  if (name === 'Home') return 'home';
  if (name === 'Recordings') return 'recordings';
  if (name === 'Search') return 'search';
  if (name === 'Profile') return 'profile';
  return '';
});

// 5 tabs total, each 20% wide. Non-record tabs at visual slots 0,1,3,4.
const NON_RECORD_TABS = tabs.filter(t => t.name !== 'record');
const pillStyle = computed(() => {
  const idx = NON_RECORD_TABS.findIndex(t => t.name === activeTab.value);
  if (idx === -1) return { opacity: '0' };
  // Tab layout: home(0), library(1), record(2), search(3), profile(4)
  // NON_RECORD_TABS → visual slots: home→0, library→1, search→3, profile→4
  const visualSlots = [0, 1, 3, 4];
  const slot = visualSlots[idx];
  const percent = (slot * 20) + 10;
  return { left: `${percent}%`, opacity: '1' };
});

const TAB_ORDER: Record<string, number> = { home: 0, recordings: 1, record: 2, search: 3, profile: 4 };

function navigate(tab: typeof tabs[0]) {
  const from = TAB_ORDER[activeTab.value] ?? -1;
  const to   = TAB_ORDER[tab.name]       ?? -1;
  if (from >= 0 && to >= 0 && to !== from) {
    setNavSlideDir(to > from ? 'left' : 'right');
  } else {
    setNavSlideDir('none');
  }
  router.push(tab.path);
}
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: calc(62px + env(safe-area-inset-bottom, 0px));
  padding-bottom: env(safe-area-inset-bottom, 0px);
  background: var(--app-surface);
  border-top: 1px solid var(--app-border);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  display: flex;
  align-items: center;
  justify-content: space-around;
  z-index: 999;
  /* Slide up on appear */
  animation: navSlideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes navSlideUp {
  from { transform: translateY(100%); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}

/* Sliding active pill */
.nav-pill {
  position: absolute;
  top: 8px;
  width: 50px;
  height: 46px;
  background: rgba(5, 150, 105, 0.18);
  border-radius: var(--radius-md);
  transform: translateX(-50%);
  transition: left 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
              opacity 0.2s ease;
  pointer-events: none;
}

/* Tab buttons */
.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 8px 0 6px;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--app-text-muted);
  transition: color 0.2s ease;
  position: relative;
  z-index: 1;
  -webkit-tap-highlight-color: transparent;
}

.nav-item.active {
  color: var(--app-primary);
}

.nav-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.nav-item.active .nav-icon-wrap {
  transform: scale(1.15) translateY(-1px);
}

.nav-item:not(.active):active .nav-icon-wrap {
  transform: scale(0.88);
}

.nav-item ion-icon {
  font-size: 22px;
}

.nav-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.2px;
  transition: opacity 0.2s ease;
}

/* Record center button */
.nav-record-btn {
  flex: 1;
  color: white;
}

.nav-record {
  position: relative;
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: var(--app-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: -22px;
  box-shadow: 0 4px 20px rgba(5, 150, 105, 0.45);
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.25s ease;
}

.nav-record-btn:active .nav-record {
  transform: scale(0.88);
  box-shadow: 0 2px 10px rgba(5, 150, 105, 0.3);
}

.nav-record ion-icon {
  font-size: 24px;
  color: white;
}

/* Pulse rings on record button */
.nav-record-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid var(--app-primary);
  opacity: 0;
  pointer-events: none;
  animation: recordPulse 2.5s ease-out infinite;
}

.ring-2 {
  animation-delay: 1.25s;
}

@keyframes recordPulse {
  0%   { transform: scale(1);    opacity: 0.5; }
  100% { transform: scale(1.75); opacity: 0;   }
}
</style>
