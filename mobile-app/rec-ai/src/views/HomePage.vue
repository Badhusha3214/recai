<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="home-page">
        <!-- Header -->
        <header class="home-header">
          <div class="greeting">
            <p class="greeting-label">{{ greetingText }}</p>
            <h1 class="greeting-name">{{ userName }}</h1>
          </div>
          <button class="avatar-btn" @click="router.push('/profile')">
            <span>{{ userInitials }}</span>
            <div class="online-dot"></div>
          </button>
        </header>

        <!-- Hero Record Card -->
        <section class="hero-card" @click="router.push('/record')">
          <div class="hero-bg">
            <div class="hero-circle hero-circle-1"></div>
            <div class="hero-circle hero-circle-2"></div>
          </div>
          <div class="hero-content">
            <div class="hero-icon-wrap">
              <div class="hero-icon">
                <ion-icon :icon="mic"></ion-icon>
              </div>
              <div class="hero-pulse"></div>
              <div class="hero-pulse hero-pulse-2"></div>
            </div>
            <div class="hero-text">
              <h2>New Recording</h2>
              <p>Tap to start recording your voice</p>
            </div>
          </div>
          <div class="hero-arrow">
            <ion-icon :icon="arrowForwardOutline"></ion-icon>
          </div>
        </section>

        <!-- Quick Stats -->
        <section class="stats-section">
          <div class="stat-card">
            <div class="stat-icon-wrap" style="background: var(--app-primary-ultra-light);">
              <ion-icon :icon="layersOutline" style="color: var(--app-primary);"></ion-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.total }}</span>
              <span class="stat-label">Total</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon-wrap" style="background: rgba(34, 197, 94, 0.08);">
              <ion-icon :icon="checkmarkDoneOutline" style="color: var(--ion-color-success);"></ion-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.transcribed }}</span>
              <span class="stat-label">Done</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon-wrap" style="background: rgba(99, 102, 241, 0.08);">
              <ion-icon :icon="timeOutline" style="color: var(--ion-color-tertiary);"></ion-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.duration }}</span>
              <span class="stat-label">Min</span>
            </div>
          </div>
        </section>

        <!-- Recent Recordings -->
        <section class="recent-section">
          <div class="section-header">
            <h3>Recent</h3>
            <button class="view-all-btn" @click="router.push('/recordings')">
              <span>View all</span>
              <ion-icon :icon="arrowForwardOutline"></ion-icon>
            </button>
          </div>

          <div v-if="loading" class="loading-state">
            <div class="skeleton-card" v-for="i in 3" :key="i">
              <div class="skeleton-icon"></div>
              <div class="skeleton-lines">
                <div class="skeleton-line w60"></div>
                <div class="skeleton-line w40"></div>
              </div>
            </div>
          </div>

          <div v-else-if="recentRecordings.length === 0" class="empty-state">
            <div class="empty-illustration">
              <div class="empty-circle">
                <ion-icon :icon="micOutline"></ion-icon>
              </div>
              <div class="empty-wave"></div>
            </div>
            <h4>No recordings yet</h4>
            <p>Create your first recording to get started</p>
            <button class="empty-cta" @click="router.push('/record')">
              <ion-icon :icon="addOutline"></ion-icon>
              <span>Record Now</span>
            </button>
          </div>

          <div v-else class="recordings-list">
            <div
              v-for="(recording, index) in recentRecordings"
              :key="recording._id"
              class="recording-item"
              :style="{ animationDelay: `${index * 60}ms` }"
              @click="router.push(`/recording/${recording._id}`)"
            >
              <div class="item-icon" :class="getStatusClass(recording.status)">
                <ion-icon :icon="getStatusIcon(recording.status)"></ion-icon>
              </div>
              <div class="item-body">
                <h4>{{ recording.title }}</h4>
                <div class="item-meta">
                  <span>{{ formatDate(recording.createdAt) }}</span>
                  <span class="meta-dot"></span>
                  <span>{{ formatDuration(recording.duration) }}</span>
                </div>
              </div>
              <div class="item-badge" :class="getStatusClass(recording.status)">
                <span>{{ getStatusLabel(recording.status) }}</span>
              </div>
            </div>
          </div>
        </section>
      </div>

    </ion-content>

    <!-- Bottom Navigation sits at ion-page level so it is never inside the scroll container -->
    <div class="bottom-nav">
      <button class="nav-item active" @click="router.push('/home')">
        <ion-icon :icon="homeOutline"></ion-icon>
        <span>Home</span>
      </button>
      <button class="nav-item" @click="router.push('/recordings')">
        <ion-icon :icon="listOutline"></ion-icon>
        <span>Library</span>
      </button>
      <button class="nav-record" @click="router.push('/record')">
        <ion-icon :icon="mic"></ion-icon>
      </button>
      <button class="nav-item" @click="router.push('/recordings')">
        <ion-icon :icon="searchOutline"></ion-icon>
        <span>Search</span>
      </button>
      <button class="nav-item" @click="router.push('/profile')">
        <ion-icon :icon="personOutline"></ion-icon>
        <span>Profile</span>
      </button>
    </div>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonContent, IonIcon, IonRefresher, IonRefresherContent, onIonViewWillEnter } from '@ionic/vue';
import {
  mic, micOutline, arrowForwardOutline, layersOutline, checkmarkDoneOutline,
  timeOutline, documentTextOutline, checkmarkCircleOutline, ellipseOutline,
  addOutline, homeOutline, listOutline, searchOutline, personOutline
} from 'ionicons/icons';
import { useAuthStore } from '@/stores/auth';
import { useRecordingsStore } from '@/stores/recordings';

const router = useRouter();
const auth = useAuthStore();
const recordingsStore = useRecordingsStore();

const loading = computed(() => recordingsStore.loading);
const userName = computed(() => auth.user?.name?.split(' ')[0] || 'User');

const userInitials = computed(() => {
  const name = auth.user?.name || 'U';
  return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
});

const greetingText = computed(() => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
});

const recentRecordings = computed(() => recordingsStore.sortedRecordings.slice(0, 5));

const stats = computed(() => {
  const recordings = recordingsStore.recordings;
  const total = recordings.length;
  const transcribed = recordings.filter(r => r.transcript).length;
  const totalSeconds = recordings.reduce((sum, r) => sum + (r.duration || 0), 0);
  const duration = Math.round(totalSeconds / 60);
  return { total, transcribed, duration };
});

onIonViewWillEnter(() => {
  recordingsStore.fetchRecordings();
});

async function handleRefresh(event: CustomEvent) {
  await recordingsStore.fetchRecordings();
  (event.target as HTMLIonRefresherElement).complete();
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDuration(seconds: number) {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getStatusClass(status: string) {
  if (status === 'completed' || status === 'summarized') return 'complete';
  if (status === 'transcribed') return 'transcribed';
  return 'pending';
}

function getStatusIcon(status: string) {
  if (status === 'completed' || status === 'summarized' || status === 'transcribed') return checkmarkCircleOutline;
  return ellipseOutline;
}

function getStatusLabel(status: string) {
  if (status === 'completed' || status === 'summarized') return 'Done';
  if (status === 'transcribed') return 'Ready';
  return 'New';
}
</script>

<style scoped>
.home-page {
  padding: calc(20px + env(safe-area-inset-top, 0px)) 20px 100px;
}

/* Header */
.home-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.greeting-label {
  font-size: 14px;
  color: var(--app-text-muted);
  margin: 0 0 2px;
  font-weight: 500;
}

.greeting-name {
  font-size: 26px;
  font-weight: 800;
  color: var(--app-text);
  margin: 0;
  letter-spacing: -0.3px;
}

.avatar-btn {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  border: none;
  background: var(--app-gradient);
  color: white;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: var(--shadow-primary);
  transition: transform var(--transition-fast);
}

.avatar-btn:active {
  transform: scale(0.93);
}

.online-dot {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--ion-color-success);
  border: 3px solid var(--app-bg);
}

/* Hero Card */
.hero-card {
  position: relative;
  padding: 24px;
  background: var(--app-gradient);
  border-radius: var(--radius-2xl);
  margin-bottom: 20px;
  cursor: pointer;
  overflow: hidden;
  box-shadow: var(--shadow-primary-lg);
  display: flex;
  align-items: center;
  transition: transform var(--transition-fast);
}

.hero-card:active {
  transform: scale(0.98);
}

.hero-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.hero-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
}

.hero-circle-1 {
  width: 200px;
  height: 200px;
  top: -60px;
  right: -40px;
}

.hero-circle-2 {
  width: 120px;
  height: 120px;
  bottom: -30px;
  left: -20px;
}

.hero-content {
  display: flex;
  align-items: center;
  gap: 18px;
  flex: 1;
  position: relative;
  z-index: 1;
}

.hero-icon-wrap {
  position: relative;
  flex-shrink: 0;
}

.hero-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
}

.hero-icon ion-icon {
  font-size: 28px;
  color: white;
}

.hero-pulse {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  animation: hero-ping 2.5s ease-out infinite;
}

.hero-pulse-2 {
  animation-delay: 1.25s;
}

@keyframes hero-ping {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.8); opacity: 0; }
}

.hero-text h2 {
  font-size: 20px;
  font-weight: 700;
  color: white;
  margin: 0 0 4px;
}

.hero-text p {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
  margin: 0;
}

.hero-arrow {
  position: relative;
  z-index: 1;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.hero-arrow ion-icon {
  font-size: 20px;
  color: white;
}

/* Stats */
.stats-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 28px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 18px 12px;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xs);
  transition: transform var(--transition-fast);
}

.stat-card:active {
  transform: scale(0.97);
}

.stat-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon-wrap ion-icon {
  font-size: 20px;
}

.stat-info {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 22px;
  font-weight: 800;
  color: var(--app-text);
  line-height: 1;
}

.stat-label {
  display: block;
  font-size: 11px;
  color: var(--app-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 4px;
  font-weight: 600;
}

/* Recent Section */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-header h3 {
  font-size: 20px;
  font-weight: 700;
  color: var(--app-text);
  margin: 0;
}

.view-all-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: var(--app-primary);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  padding: 6px 0;
}

.view-all-btn ion-icon {
  font-size: 16px;
}

/* Loading Skeleton */
.loading-state {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
  background: var(--app-surface);
  border-radius: var(--radius-xl);
  border: 1px solid var(--app-border);
}

.skeleton-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  background: var(--app-bg);
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-lines {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-line {
  height: 12px;
  border-radius: 6px;
  background: var(--app-bg);
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-line.w60 { width: 60%; }
.skeleton-line.w40 { width: 40%; }

@keyframes shimmer {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 24px;
  text-align: center;
}

.empty-illustration {
  position: relative;
  margin-bottom: 20px;
}

.empty-circle {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--app-primary-ultra-light);
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-circle ion-icon {
  font-size: 32px;
  color: var(--app-primary);
}

.empty-wave {
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  border: 2px dashed var(--app-border);
  animation: spin 15s linear infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

.empty-state h4 {
  font-size: 17px;
  font-weight: 700;
  color: var(--app-text);
  margin: 0 0 6px;
}

.empty-state p {
  font-size: 14px;
  color: var(--app-text-muted);
  margin: 0 0 20px;
}

.empty-cta {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: var(--app-gradient);
  border: none;
  border-radius: var(--radius-full);
  color: white;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: var(--shadow-primary);
}

.empty-cta ion-icon {
  font-size: 18px;
}

/* Recordings List */
.recordings-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.recording-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--radius-xl);
  cursor: pointer;
  transition: all var(--transition-fast);
  animation: slideUp 0.3s ease-out both;
  box-shadow: var(--shadow-xs);
}

.recording-item:active {
  transform: scale(0.98);
  background: var(--app-surface-hover);
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.item-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.item-icon ion-icon {
  font-size: 20px;
}

.item-icon.complete {
  background: rgba(34, 197, 94, 0.1);
}
.item-icon.complete ion-icon { color: var(--ion-color-success); }

.item-icon.transcribed {
  background: var(--app-primary-ultra-light);
}
.item-icon.transcribed ion-icon { color: var(--app-primary); }

.item-icon.pending {
  background: rgba(245, 158, 11, 0.1);
}
.item-icon.pending ion-icon { color: var(--ion-color-warning); }

.item-body {
  flex: 1;
  min-width: 0;
}

.item-body h4 {
  font-size: 15px;
  font-weight: 600;
  color: var(--app-text);
  margin: 0 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--app-text-muted);
}

.meta-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--app-text-muted);
}

.item-badge {
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  flex-shrink: 0;
}

.item-badge.complete {
  background: rgba(34, 197, 94, 0.1);
  color: var(--ion-color-success);
}

.item-badge.transcribed {
  background: var(--app-primary-ultra-light);
  color: var(--app-primary);
}

.item-badge.pending {
  background: rgba(245, 158, 11, 0.08);
  color: var(--ion-color-warning);
}

/* Bottom Navigation */
.bottom-nav {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 8px 12px;
  padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px));
  background: var(--app-surface);
  border-top: 1px solid var(--app-border);
  backdrop-filter: blur(20px);
  flex-shrink: 0;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 6px 12px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--app-text-muted);
  transition: color var(--transition-fast);
}

.nav-item.active {
  color: var(--app-primary);
}

.nav-item ion-icon {
  font-size: 22px;
}

.nav-item span {
  font-size: 10px;
  font-weight: 600;
}

.nav-record {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: none;
  background: var(--app-gradient);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-top: -24px;
  box-shadow: var(--shadow-primary);
  transition: transform var(--transition-spring);
}

.nav-record:active {
  transform: scale(0.9);
}

.nav-record ion-icon {
  font-size: 24px;
}
</style>
