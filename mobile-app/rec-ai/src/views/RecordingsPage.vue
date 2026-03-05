<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="recordings-page">
        <!-- Header -->
        <header class="page-header">
          <button class="back-btn" @click="router.back()">
            <ion-icon :icon="chevronBackOutline"></ion-icon>
          </button>
          <h1>Library</h1>
          <span class="count-badge" v-if="recordings.length">{{ recordings.length }}</span>
        </header>

        <!-- Search -->
        <div class="search-wrapper">
          <div class="search-bar" :class="{ focused: searchFocused }">
            <ion-icon :icon="searchOutline" class="search-icon"></ion-icon>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search recordings..."
              @focus="searchFocused = true"
              @blur="searchFocused = false"
            />
            <button v-if="searchQuery" class="clear-btn" @click="searchQuery = ''">
              <ion-icon :icon="closeCircleOutline"></ion-icon>
            </button>
          </div>
        </div>

        <!-- Filter Tabs -->
        <div class="filter-tabs">
          <button
            v-for="tab in filterTabs"
            :key="tab.value"
            class="filter-tab"
            :class="{ active: activeFilter === tab.value }"
            @click="activeFilter = tab.value"
          >
            {{ tab.label }}
            <span class="tab-count" v-if="tab.count">{{ tab.count }}</span>
          </button>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="loading-state">
          <div class="skeleton-card" v-for="i in 4" :key="i">
            <div class="skeleton-icon"></div>
            <div class="skeleton-lines">
              <div class="skeleton-line w70"></div>
              <div class="skeleton-line w50"></div>
            </div>
          </div>
        </div>

        <!-- Empty -->
        <div v-else-if="filteredRecordings.length === 0" class="empty-state">
          <div class="empty-icon-wrap">
            <ion-icon :icon="searchQuery ? searchOutline : micOutline"></ion-icon>
          </div>
          <h3>{{ searchQuery ? 'No results' : 'No recordings yet' }}</h3>
          <p>{{ searchQuery ? 'Try a different search term' : 'Tap the button below to start' }}</p>
        </div>

        <!-- List -->
        <div v-else class="recordings-list">
          <div
            v-for="(recording, index) in filteredRecordings"
            :key="recording._id"
            class="recording-card"
            :style="{ animationDelay: `${index * 50}ms` }"
            @click="router.push(`/recording/${recording._id}`)"
          >
            <div class="card-left">
              <div class="card-icon" :class="getStatusClass(recording.status)">
                <ion-icon :icon="documentTextOutline"></ion-icon>
              </div>
            </div>
            <div class="card-center">
              <h3>{{ recording.title }}</h3>
              <div class="card-meta">
                <span>{{ formatDate(recording.createdAt) }}</span>
                <span class="meta-dot"></span>
                <span>{{ formatDuration(recording.duration) }}</span>
              </div>
            </div>
            <div class="card-right">
              <div class="card-status" :class="getStatusClass(recording.status)">
                {{ getStatusLabel(recording.status) }}
              </div>
              <div class="card-actions">
                <button class="icon-btn" @click.stop="handleShare(recording)" aria-label="Share">
                  <ion-icon :icon="shareOutline"></ion-icon>
                </button>
                <button class="icon-btn danger" @click.stop="confirmDelete(recording)" aria-label="Delete">
                  <ion-icon :icon="trashOutline"></ion-icon>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- FAB -->
      <ion-fab slot="fixed" vertical="bottom" horizontal="end" style="margin-bottom: 16px; margin-right: 16px;">
        <ion-fab-button @click="router.push('/record')">
          <ion-icon :icon="micOutline"></ion-icon>
        </ion-fab-button>
      </ion-fab>

      <!-- Delete Alert -->
      <ion-alert
        :is-open="showDeleteAlert"
        header="Delete Recording?"
        message="This action cannot be undone."
        :buttons="deleteButtons"
        @didDismiss="showDeleteAlert = false"
      ></ion-alert>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonContent, IonIcon, IonFab, IonFabButton,
  IonRefresher, IonRefresherContent, IonAlert, toastController, onIonViewWillEnter
} from '@ionic/vue';
import {
  chevronBackOutline, searchOutline, closeCircleOutline, micOutline,
  documentTextOutline, shareOutline, trashOutline
} from 'ionicons/icons';
import { useRecordingsStore } from '@/stores/recordings';
import type { Recording } from '@/services/api';

const router = useRouter();
const recordingsStore = useRecordingsStore();

const searchQuery = ref('');
const searchFocused = ref(false);
const activeFilter = ref('all');
const showDeleteAlert = ref(false);
const recordingToDelete = ref<Recording | null>(null);

const loading = computed(() => recordingsStore.loading);
const recordings = computed(() => recordingsStore.sortedRecordings);

const filterTabs = computed(() => [
  { label: 'All', value: 'all', count: recordings.value.length },
  { label: 'Pending', value: 'pending', count: recordings.value.filter(r => !r.transcript).length },
  { label: 'Transcribed', value: 'transcribed', count: recordings.value.filter(r => r.transcript && !r.summary).length },
  { label: 'Complete', value: 'complete', count: recordings.value.filter(r => r.summary).length },
]);

const filteredRecordings = computed(() => {
  let list = recordings.value;

  if (activeFilter.value === 'pending') list = list.filter(r => !r.transcript);
  else if (activeFilter.value === 'transcribed') list = list.filter(r => r.transcript && !r.summary);
  else if (activeFilter.value === 'complete') list = list.filter(r => r.summary);

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(r =>
      r.title.toLowerCase().includes(q) || r.transcript?.toLowerCase().includes(q)
    );
  }

  return list;
});

const deleteButtons = [
  { text: 'Cancel', role: 'cancel' },
  {
    text: 'Delete',
    role: 'destructive',
    handler: async () => {
      if (recordingToDelete.value) {
        await recordingsStore.deleteRecording(recordingToDelete.value._id);
        const toast = await toastController.create({
          message: 'Recording deleted',
          duration: 2000,
          position: 'bottom',
          color: 'dark'
        });
        await toast.present();
      }
    }
  }
];

onIonViewWillEnter(() => {
  recordingsStore.fetchRecordings();
});

async function handleRefresh(event: CustomEvent) {
  await recordingsStore.fetchRecordings();
  (event.target as HTMLIonRefresherElement).complete();
}

function confirmDelete(recording: Recording) {
  recordingToDelete.value = recording;
  showDeleteAlert.value = true;
}

async function handleShare(recording: Recording) {
  const text = `${recording.title}\n\n${recording.summary || recording.transcript || ''}`.trim();
  if (navigator.share) {
    try {
      await navigator.share({ title: recording.title, text });
    } catch {}
  } else {
    await navigator.clipboard.writeText(text);
    const toast = await toastController.create({
      message: 'Copied to clipboard',
      duration: 1500,
      position: 'bottom',
      color: 'dark'
    });
    await toast.present();
  }
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

function getStatusLabel(status: string) {
  if (status === 'completed' || status === 'summarized') return 'Done';
  if (status === 'transcribed') return 'Ready';
  return 'New';
}
</script>

<style scoped>
.recordings-page {
  padding: calc(20px + env(safe-area-inset-top, 0px)) 20px 100px;
}

/* Header */
.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.back-btn {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--app-border);
  background: var(--app-surface);
  color: var(--app-text);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: var(--shadow-xs);
  transition: all var(--transition-fast);
}

.back-btn:active { transform: scale(0.93); }
.back-btn ion-icon { font-size: 22px; }

.page-header h1 {
  flex: 1;
  font-size: 26px;
  font-weight: 800;
  color: var(--app-text);
  margin: 0;
  letter-spacing: -0.3px;
}

.count-badge {
  padding: 4px 12px;
  background: var(--app-primary-ultra-light);
  color: var(--app-primary);
  border-radius: var(--radius-full);
  font-size: 13px;
  font-weight: 700;
}

/* Search */
.search-wrapper {
  margin-bottom: 16px;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  height: 50px;
  background: var(--app-surface);
  border: 2px solid transparent;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xs);
  transition: all var(--transition-fast);
}

.search-bar.focused {
  border-color: var(--app-primary);
  box-shadow: 0 0 0 4px var(--app-primary-ultra-light);
}

.search-icon {
  font-size: 20px;
  color: var(--app-text-muted);
  transition: color var(--transition-fast);
}

.search-bar.focused .search-icon {
  color: var(--app-primary);
}

.search-bar input {
  flex: 1;
  border: none;
  background: none;
  font-size: 15px;
  color: var(--app-text);
  outline: none;
}

.search-bar input::placeholder { color: var(--app-text-muted); }

.clear-btn {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  display: flex;
  color: var(--app-text-muted);
}

.clear-btn ion-icon { font-size: 20px; }

/* Filter Tabs */
.filter-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding-bottom: 2px;
}

.filter-tabs::-webkit-scrollbar { display: none; }

.filter-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--radius-full);
  font-size: 13px;
  font-weight: 600;
  color: var(--app-text-secondary);
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--transition-fast);
}

.filter-tab.active {
  background: var(--app-primary);
  border-color: var(--app-primary);
  color: white;
}

.tab-count {
  font-size: 11px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: var(--radius-full);
  background: rgba(0, 0, 0, 0.06);
}

.filter-tab.active .tab-count {
  background: rgba(255, 255, 255, 0.25);
}

/* Loading */
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
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: var(--app-bg);
  animation: shimmer 1.5s ease-in-out infinite;
  flex-shrink: 0;
}

.skeleton-lines { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.skeleton-line { height: 12px; border-radius: 6px; background: var(--app-bg); animation: shimmer 1.5s ease-in-out infinite; }
.skeleton-line.w70 { width: 70%; }
.skeleton-line.w50 { width: 50%; }

@keyframes shimmer {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* Empty */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 24px;
  text-align: center;
}

.empty-icon-wrap {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--app-primary-ultra-light);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.empty-icon-wrap ion-icon {
  font-size: 32px;
  color: var(--app-primary);
}

.empty-state h3 {
  font-size: 18px;
  font-weight: 700;
  color: var(--app-text);
  margin: 0 0 6px;
}

.empty-state p {
  font-size: 14px;
  color: var(--app-text-muted);
  margin: 0;
}

/* Recordings List */
.recordings-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.recording-card {
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

.recording-card:active {
  transform: scale(0.98);
  background: var(--app-surface-hover);
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-icon ion-icon { font-size: 22px; }

.card-icon.complete { background: rgba(34, 197, 94, 0.1); }
.card-icon.complete ion-icon { color: var(--ion-color-success); }

.card-icon.transcribed { background: var(--app-primary-ultra-light); }
.card-icon.transcribed ion-icon { color: var(--app-primary); }

.card-icon.pending { background: rgba(245, 158, 11, 0.08); }
.card-icon.pending ion-icon { color: var(--ion-color-warning); }

.card-center {
  flex: 1;
  min-width: 0;
}

.card-center h3 {
  font-size: 15px;
  font-weight: 600;
  color: var(--app-text);
  margin: 0 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-meta {
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

.card-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.card-status {
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.card-status.complete { background: rgba(34, 197, 94, 0.1); color: var(--ion-color-success); }
.card-status.transcribed { background: var(--app-primary-ultra-light); color: var(--app-primary); }
.card-status.pending { background: rgba(245, 158, 11, 0.08); color: var(--ion-color-warning); }

.card-actions {
  display: flex;
  gap: 4px;
}

.icon-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  border: none;
  background: var(--app-bg);
  color: var(--app-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.icon-btn:active { transform: scale(0.9); }
.icon-btn ion-icon { font-size: 16px; }
.icon-btn.danger:active { color: var(--ion-color-danger); background: rgba(239, 68, 68, 0.08); }

/* FAB */
ion-fab-button {
  --background: var(--app-primary);
  --box-shadow: var(--shadow-primary-lg);
}
</style>
