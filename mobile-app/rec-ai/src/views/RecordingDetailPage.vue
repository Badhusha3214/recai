<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="detail-page">
        <!-- Header -->
        <header class="page-header">
          <button class="header-btn" @click="router.back()">
            <ion-icon :icon="chevronBackOutline"></ion-icon>
          </button>
          <span class="header-title">Recording</span>
          <button class="header-btn" @click="showOptions = true">
            <ion-icon :icon="ellipsisHorizontalOutline"></ion-icon>
          </button>
        </header>

        <!-- Loading -->
        <div v-if="loading && !recording" class="loading-state">
          <ion-spinner name="crescent"></ion-spinner>
        </div>

        <!-- Not Found -->
        <div v-else-if="!recording" class="empty-state">
          <div class="empty-icon-wrap">
            <ion-icon :icon="alertCircleOutline"></ion-icon>
          </div>
          <h3>Recording not found</h3>
          <button class="link-btn" @click="router.push('/recordings')">Back to library</button>
        </div>

        <!-- Content -->
        <template v-else>
          <!-- Title Section -->
          <div class="title-section">
            <h1>{{ recording.title }}</h1>
            <div class="meta-row">
              <div class="meta-chip">
                <ion-icon :icon="calendarOutline"></ion-icon>
                <span>{{ formatDate(recording.createdAt) }}</span>
              </div>
              <div class="meta-chip">
                <ion-icon :icon="timeOutline"></ion-icon>
                <span>{{ formatDuration(recording.duration) }}</span>
              </div>
              <div class="status-chip" :class="recording.status">
                {{ formatStatus(recording.status) }}
              </div>
            </div>
          </div>

          <!-- Compact Audio Player -->
          <div class="player-section" v-if="recording.audioUrl">
            <button class="player-btn" @click="togglePlay">
              <ion-icon :icon="isPlaying ? pauseOutline : playOutline"></ion-icon>
            </button>
            <div class="player-body">
              <div class="player-bar" @click="seekAudio">
                <div class="bar-fill" :style="{ width: `${progress}%` }"></div>
                <div class="bar-thumb" :style="{ left: `${progress}%` }"></div>
              </div>
              <div class="player-times">
                <span>{{ currentTime }}</span>
                <span>{{ totalTime }}</span>
              </div>
            </div>
            <audio ref="audioRef" :src="recording.audioUrl" @timeupdate="updateProgress" @loadedmetadata="onLoaded" @ended="isPlaying = false"></audio>
          </div>

          <!-- AI Actions -->
          <div class="ai-section">
            <h2 class="section-label">AI Tools</h2>
            <div class="ai-grid">
              <button
                class="ai-card"
                :class="{ done: recording.transcript, active: processingAction === 'transcribe' || recording.status === 'transcribing' }"
                :disabled="processing || !!recording.transcript || recording.status === 'transcribing'"
                @click="handleTranscribe"
              >
                <div class="ai-card-icon" :class="{ done: recording.transcript }">
                  <ion-spinner v-if="processingAction === 'transcribe' || recording.status === 'transcribing'" name="crescent"></ion-spinner>
                  <ion-icon v-else-if="recording.transcript" :icon="checkmarkOutline"></ion-icon>
                  <ion-icon v-else :icon="textOutline"></ion-icon>
                </div>
                <span class="ai-card-label">{{ recording.status === 'transcribing' ? 'Transcribing...' : recording.transcript ? 'Transcribed' : 'Transcribe' }}</span>
              </button>

              <button
                class="ai-card"
                :class="{ done: recording.summary, active: processingAction === 'summarize' }"
                :disabled="processing || !recording.transcript || !!recording.summary"
                @click="handleSummarize"
              >
                <div class="ai-card-icon" :class="{ done: recording.summary }">
                  <ion-spinner v-if="processingAction === 'summarize'" name="crescent"></ion-spinner>
                  <ion-icon v-else-if="recording.summary" :icon="checkmarkOutline"></ion-icon>
                  <ion-icon v-else :icon="sparklesOutline"></ion-icon>
                </div>
                <span class="ai-card-label">{{ recording.summary ? 'Summarized' : 'Summarize' }}</span>
              </button>

              <button
                class="ai-card"
                :class="{ done: recording.minutes, active: processingAction === 'minutes' }"
                :disabled="processing || !recording.transcript || !!recording.minutes"
                @click="handleMinutes"
              >
                <div class="ai-card-icon" :class="{ done: recording.minutes }">
                  <ion-spinner v-if="processingAction === 'minutes'" name="crescent"></ion-spinner>
                  <ion-icon v-else-if="recording.minutes" :icon="checkmarkOutline"></ion-icon>
                  <ion-icon v-else :icon="listOutline"></ion-icon>
                </div>
                <span class="ai-card-label">{{ recording.minutes ? 'Minutes Ready' : 'Minutes' }}</span>
              </button>

              <button
                class="ai-card"
                :class="{ done: recording.actionItems?.length, active: processingAction === 'actions' }"
                :disabled="processing || !recording.transcript || !!recording.actionItems?.length"
                @click="handleActionItems"
              >
                <div class="ai-card-icon" :class="{ done: recording.actionItems?.length }">
                  <ion-spinner v-if="processingAction === 'actions'" name="crescent"></ion-spinner>
                  <ion-icon v-else-if="recording.actionItems?.length" :icon="checkmarkOutline"></ion-icon>
                  <ion-icon v-else :icon="checkmarkCircleOutline"></ion-icon>
                </div>
                <span class="ai-card-label">{{ recording.actionItems?.length ? 'Tasks Ready' : 'Tasks' }}</span>
              </button>
            </div>
          </div>

          <!-- Content Tabs -->
          <div class="content-section" v-if="recording.transcript || recording.summary || recording.minutes || recording.actionItems?.length">
            <div class="content-tabs">
              <button
                v-for="tab in availableTabs"
                :key="tab.key"
                class="content-tab"
                :class="{ active: activeTab === tab.key }"
                @click="activeTab = tab.key"
              >
                <ion-icon :icon="tab.icon"></ion-icon>
                <span>{{ tab.label }}</span>
              </button>
            </div>

            <!-- Tab Content -->
            <div class="tab-content">
              <div class="tab-header">
                <h3>{{ activeTabLabel }}</h3>
                <div class="tab-actions">
                  <!-- Transcript edit mode: Save / Cancel -->
                  <template v-if="activeTab === 'transcript' && isEditingTranscript">
                    <button class="action-btn save" :disabled="savingTranscript" @click="saveTranscript" title="Save">
                      <ion-spinner v-if="savingTranscript" name="crescent" style="width:16px;height:16px"></ion-spinner>
                      <ion-icon v-else :icon="checkmarkOutline"></ion-icon>
                    </button>
                    <button class="action-btn" @click="cancelEditTranscript" title="Cancel">
                      <ion-icon :icon="closeOutline"></ion-icon>
                    </button>
                  </template>
                  <!-- Normal mode actions -->
                  <template v-else>
                    <button class="action-btn" @click="copyActiveContent" title="Copy">
                      <ion-icon :icon="copyOutline"></ion-icon>
                    </button>
                    <button
                      v-if="activeTab === 'transcript' && recording.transcript && isTranscriptEnglish && !isTranscriptRepetitive"
                      class="action-btn"
                      @click="startEditTranscript"
                      title="Edit transcript"
                    >
                      <ion-icon :icon="pencilOutline"></ion-icon>
                    </button>
                    <button
                      v-if="activeTab === 'summary' || activeTab === 'minutes'"
                      class="action-btn"
                      :disabled="generatingPDF"
                      @click="activeTab === 'minutes' ? downloadMinutesPDF() : downloadSummaryPDF()"
                      title="Download PDF"
                    >
                      <ion-spinner v-if="generatingPDF" name="crescent" style="width:16px;height:16px"></ion-spinner>
                      <ion-icon v-else :icon="shareOutline"></ion-icon>
                    </button>
                  </template>
                </div>
              </div>

              <!-- Template Selector (Minutes only) -->
              <div v-if="activeTab === 'minutes'" class="template-bar">
                <div class="template-selector">
                  <label>Template:</label>
                  <select v-model="selectedTemplate" class="template-select">
                    <option v-for="(tmpl, key) in templates" :key="key" :value="key">{{ tmpl.name }}</option>
                  </select>
                </div>
                <div class="template-actions">
                  <button class="icon-btn" @click="openTemplateEditor(selectedTemplate)" title="Edit">
                    <ion-icon :icon="createOutline"></ion-icon>
                  </button>
                  <button class="icon-btn accent" @click="openTemplateEditor()" title="New">
                    <ion-icon :icon="addOutline"></ion-icon>
                  </button>
                </div>
              </div>

              <!-- Transcript: editor or read-only -->
              <template v-if="activeTab === 'transcript'">
                <template v-if="isTranscriptEnglish && !isTranscriptRepetitive">
                  <textarea
                    v-if="isEditingTranscript"
                    v-model="editedTranscript"
                    class="transcript-editor"
                    placeholder="Edit transcript…"
                  ></textarea>
                  <div v-else class="tab-body formatted" v-html="renderMarkdown(recording.transcript!)"></div>
                </template>
                <div v-else class="non-english-notice">
                  <ion-icon :icon="languageOutline"></ion-icon>
                  <p>Viewing and editing Transcript is only available for English</p>
                </div>
              </template>

              <div class="tab-body formatted" v-else-if="activeTab === 'summary'" v-html="renderMarkdown(recording.summary!)"></div>
              <div class="tab-body formatted" v-else-if="activeTab === 'minutes'" v-html="renderMarkdown(recording.minutes!)"></div>
              <div v-else-if="activeTab === 'actions'" class="todo-list">
                <div class="todo-progress-bar">
                  <div class="todo-progress-fill" :style="{ width: todoProgressPercent + '%' }"></div>
                </div>
                <div class="todo-progress-label">
                  {{ completedCount }} of {{ recording.actionItems!.length }} completed
                </div>
                <div
                  v-for="(item, i) in recording.actionItems"
                  :key="i"
                  class="todo-item"
                  :class="[item.priority, { done: localCompleted[i] }]"
                  @click="toggleTodo(i)"
                >
                  <div class="todo-checkbox" :class="{ checked: localCompleted[i] }">
                    <ion-icon v-if="localCompleted[i]" :icon="checkmarkOutline"></ion-icon>
                  </div>
                  <div class="todo-content">
                    <span class="todo-task" :class="{ done: localCompleted[i] }">{{ item.task }}</span>
                    <div class="todo-meta">
                      <span v-if="item.assignee && item.assignee !== 'Unassigned'" class="todo-badge assignee">
                        <ion-icon :icon="personOutline"></ion-icon>{{ item.assignee }}
                      </span>
                      <span v-if="item.deadline" class="todo-badge deadline">
                        <ion-icon :icon="calendarOutline"></ion-icon>{{ item.deadline }}
                      </span>
                      <span class="todo-badge priority" :class="item.priority">{{ item.priority }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Options Sheet -->
      <ion-action-sheet
        :is-open="showOptions"
        :buttons="optionButtons"
        @didDismiss="showOptions = false"
      ></ion-action-sheet>

      <!-- Delete Alert -->
      <ion-alert
        :is-open="showDeleteAlert"
        header="Delete Recording?"
        message="This action cannot be undone."
        :buttons="deleteButtons"
        @didDismiss="showDeleteAlert = false"
      ></ion-alert>
      <!-- Template Editor Modal -->
      <TemplateEditorModal
        :is-open="showTemplateEditor"
        :template="editingTemplateKey ? templates[editingTemplateKey] || null : null"
        :template-key="editingTemplateKey"
        :is-default="editingTemplateKey ? !!templates[editingTemplateKey]?.isDefault : false"
        :current-logo="logoBase64"
        @close="showTemplateEditor = false"
        @save="handleTemplateSave"
        @delete="handleTemplateDelete"
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { IonPage, IonContent, IonIcon, IonSpinner, IonActionSheet, IonAlert, toastController, onIonViewWillEnter, onIonViewWillLeave } from '@ionic/vue';
import {
  chevronBackOutline, ellipsisHorizontalOutline, playOutline, pauseOutline,
  textOutline, sparklesOutline, listOutline, checkmarkOutline, copyOutline,
  alertCircleOutline, shareOutline, trashOutline, calendarOutline, timeOutline,
  downloadOutline, createOutline, addOutline, pencilOutline, closeOutline, saveOutline,
  checkmarkCircleOutline, personOutline, languageOutline
} from 'ionicons/icons';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

// Native plugin — saves directly to the public Downloads folder via MediaStore
interface DownloaderPlugin {
  downloadFile(options: { data: string; filename: string; mimeType: string }): Promise<{ success: boolean; filename: string }>;
}
const Downloader = registerPlugin<DownloaderPlugin>('Downloader');
import { useRecordingsStore } from '@/stores/recordings';
import { loadTemplates, saveCustomTemplates, loadLogo, saveLogo, removeLogo } from '@/services/pdfTemplates';
import type { PdfTemplate } from '@/services/pdfTemplates';
import { generateMinutesPdf, generateSummaryPdf } from '@/services/pdfGenerator';
import TemplateEditorModal from '@/components/TemplateEditorModal.vue';

const router = useRouter();
const route = useRoute();
const recordingsStore = useRecordingsStore();

const showOptions = ref(false);
const showDeleteAlert = ref(false);
const processingAction = ref('');
const activeTab = ref('transcript');

// Audio
const audioRef = ref<HTMLAudioElement | null>(null);
const isPlaying = ref(false);
const progress = ref(0);
const currentTime = ref('0:00');
const totalTime = ref('0:00');

// Declare these first — used by watches below (avoids temporal dead zone errors)
const recording = computed(() => recordingsStore.currentRecording);
const loading = computed(() => recordingsStore.loading);
const processing = computed(() => recordingsStore.processing);

// Todo list local state
const localCompleted = ref<boolean[]>([]);
const isSavingTodo = ref(false);

const completedCount = computed(() => localCompleted.value.filter(Boolean).length);
const todoProgressPercent = computed(() => {
  const total = recording.value?.actionItems?.length || 0;
  return total ? Math.round((completedCount.value / total) * 100) : 0;
});

// Only re-initialize localCompleted when items are first loaded or count changes, never during a save
watch(() => recording.value?.actionItems, (items) => {
  if (items && !isSavingTodo.value) {
    localCompleted.value = items.map((item: any) => !!item.completed);
  }
}, { immediate: true });

async function toggleTodo(index: number) {
  if (!recording.value?.actionItems) return;
  // Use .map() for proper Vue reactivity instead of direct index mutation
  localCompleted.value = localCompleted.value.map((v, i) => i === index ? !v : v);
  isSavingTodo.value = true;
  try {
    const updated = recording.value.actionItems.map((item, i) => ({
      ...item,
      completed: localCompleted.value[i]
    }));
    await recordingsStore.updateRecording(recording.value._id, { actionItems: updated } as any);
  } finally {
    isSavingTodo.value = false;
  }
}

// Transcript editing
const isEditingTranscript = ref(false);
const editedTranscript = ref('');
const savingTranscript = ref(false);

function startEditTranscript() {
  editedTranscript.value = recording.value?.transcript || '';
  isEditingTranscript.value = true;
}

function cancelEditTranscript() {
  isEditingTranscript.value = false;
  editedTranscript.value = '';
}

async function saveTranscript() {
  if (!recording.value) return;
  savingTranscript.value = true;
  try {
    await recordingsStore.updateRecording(recording.value._id, { transcript: editedTranscript.value });
    isEditingTranscript.value = false;
    editedTranscript.value = '';
    const toast = await toastController.create({
      message: 'Transcript saved',
      duration: 2000,
      position: 'bottom',
      color: 'success'
    });
    await toast.present();
  } catch {
    const toast = await toastController.create({
      message: 'Failed to save transcript',
      duration: 2000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  } finally {
    savingTranscript.value = false;
  }
}

// PDF & Templates
const templates = ref<Record<string, PdfTemplate>>({});
const selectedTemplate = ref('professional');
const generatingPDF = ref(false);
const logoBase64 = ref<string | null>(null);
const showTemplateEditor = ref(false);
const editingTemplateKey = ref<string | null>(null);

const isTranscriptEnglish = computed(() => {
  const text = recording.value?.transcript;
  if (!text || text.trim().length === 0) return true;
  const letters = text.match(/\p{L}/gu) || [];
  if (letters.length === 0) return true;
  const asciiLetters = letters.filter(c => /[a-zA-Z]/.test(c));
  return asciiLetters.length / letters.length > 0.7;
});

const isTranscriptRepetitive = computed(() => {
  const text = recording.value?.transcript;
  if (!text || text.trim().length === 0) return false;
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  if (words.length < 20) return false;
  // Overall frequency check
  const freq: Record<string, number> = {};
  for (const w of words) freq[w] = (freq[w] || 0) + 1;
  const maxFreq = Math.max(...Object.values(freq));
  if (maxFreq / words.length > 0.2) return true;
  // Consecutive repetition check — e.g. "okay okay okay okay..." 10+ times in a row
  let consecutive = 1;
  for (let i = 1; i < words.length; i++) {
    if (words[i] === words[i - 1]) {
      if (++consecutive >= 10) return true;
    } else {
      consecutive = 1;
    }
  }
  return false;
});

const availableTabs = computed(() => {
  const tabs = [];
  if (recording.value?.transcript) tabs.push({ key: 'transcript', label: 'Transcript', icon: textOutline });
  if (recording.value?.summary) tabs.push({ key: 'summary', label: 'Summary', icon: sparklesOutline });
  if (recording.value?.minutes) tabs.push({ key: 'minutes', label: 'Minutes', icon: listOutline });
  if (recording.value?.actionItems?.length) tabs.push({ key: 'actions', label: 'Tasks', icon: checkmarkCircleOutline });
  return tabs;
});

const activeTabLabel = computed(() => {
  return availableTabs.value.find(t => t.key === activeTab.value)?.label || 'Content';
});

const optionButtons = [
  { text: 'Share', icon: shareOutline, handler: handleShare },
  { text: 'Delete', icon: trashOutline, role: 'destructive', handler: () => { showDeleteAlert.value = true; } },
  { text: 'Cancel', role: 'cancel' }
];

const deleteButtons = [
  { text: 'Cancel', role: 'cancel' },
  {
    text: 'Delete',
    role: 'destructive',
    handler: async () => {
      const id = route.params.id as string;
      await recordingsStore.deleteRecording(id);
      router.replace('/recordings');
    }
  }
];

const pollInterval = ref<number | null>(null);

// Tracks which recording id was fetched by onMounted so onIonViewWillEnter
// can skip the duplicate fetch on first entry (avoids double API call + flicker).
// Plain variable — not reactive, only used as a coordination flag.
let mountedFetchId = '';

// onMounted: fires once on first component creation.
// Ionic may mount the component before route params are ready, so we fetch
// only if the id is available here; onIonViewWillEnter is the fallback.
onMounted(() => {
  const id = route.params.id as string;
  if (id) {
    recordingsStore.currentRecording = null;
    recordingsStore.fetchRecording(id);
    mountedFetchId = id; // signal to onIonViewWillEnter that we already fetched
  }
  // Load templates & logo in background — non-critical for page render
  Promise.all([loadTemplates(), loadLogo()])
    .then(([t, l]) => { templates.value = t; logoBase64.value = l; })
    .catch(() => {});
});

// onIonViewWillEnter: fires on EVERY page entry (first mount + cached re-entries).
// This is the primary fetch trigger for re-entries and the fallback for first mount
// when onMounted couldn't get the route params (Ionic timing quirk).
onIonViewWillEnter(() => {
  const id = route.params.id as string;
  if (!id) return;

  // Always reset UI state
  activeTab.value = 'transcript';
  localCompleted.value = [];
  isEditingTranscript.value = false;
  isPlaying.value = false;
  if (audioRef.value) audioRef.value.pause();

  if (mountedFetchId === id) {
    // onMounted already fetched this recording — skip to avoid double call + flicker
    mountedFetchId = ''; // reset so next re-entry always fetches
    // Re-init localCompleted from already-loaded data (the reset above cleared it)
    if (recording.value?.actionItems) {
      localCompleted.value = recording.value.actionItems.map((item: any) => !!item.completed);
    }
    return;
  }

  // Re-entry or onMounted missed the id — fetch fresh data
  recordingsStore.currentRecording = null;
  recordingsStore.fetchRecording(id);
});

// onIonViewWillLeave: clean up transient state without touching currentRecording.
// Clearing currentRecording here causes the page to flash "not found" during
// the leave animation, which makes the page look blank.
onIonViewWillLeave(() => {
  if (pollInterval.value) {
    clearInterval(pollInterval.value);
    pollInterval.value = null;
  }
  isEditingTranscript.value = false;
  if (audioRef.value) {
    audioRef.value.pause();
    isPlaying.value = false;
  }
});

onUnmounted(() => {
  if (pollInterval.value) {
    clearInterval(pollInterval.value);
    pollInterval.value = null;
  }
  recordingsStore.currentRecording = null;
});

// Poll for updates while transcription is in progress
watch(recording, (rec) => {
  if (rec && (rec.status === 'transcribing' || rec.status === 'pending') && !pollInterval.value) {
    pollInterval.value = window.setInterval(async () => {
      const updated = await recordingsStore.fetchRecording(rec._id);
      if (updated && updated.status !== 'transcribing' && updated.status !== 'pending') {
        clearInterval(pollInterval.value!);
        pollInterval.value = null;
      }
    }, 3000);
  } else if (rec && rec.status !== 'transcribing' && rec.status !== 'pending' && pollInterval.value) {
    clearInterval(pollInterval.value);
    pollInterval.value = null;
  }
}, { immediate: true });

// Auto-trigger transcription when a recording is saved with 'pending' status
// (happens when uploaded via presigned URL with autoTranscribe:false)
let autoTranscribeTriggered = false;
watch(recording, (rec) => {
  if (!autoTranscribeTriggered && rec && rec.status === 'pending' && !rec.transcript && (rec as any).audioKey) {
    autoTranscribeTriggered = true;
    handleTranscribe();
  }
});

// Only set the default tab on first load — never override while user is actively on a tab
watch(recording, (rec, oldRec) => {
  if (rec && !oldRec) {
    if (rec.transcript && !rec.summary && !rec.minutes) activeTab.value = 'transcript';
    else if (rec.summary) activeTab.value = 'summary';
    else if (rec.minutes) activeTab.value = 'minutes';
    else if (rec.actionItems?.length) activeTab.value = 'actions';
  }
});

function togglePlay() {
  if (!audioRef.value) return;
  if (isPlaying.value) {
    audioRef.value.pause();
  } else {
    audioRef.value.play();
  }
  isPlaying.value = !isPlaying.value;
}

function updateProgress() {
  if (!audioRef.value) return;
  const { currentTime: ct, duration } = audioRef.value;
  progress.value = (ct / duration) * 100;
  currentTime.value = formatTime(ct);
}

function onLoaded() {
  if (audioRef.value) {
    totalTime.value = formatTime(audioRef.value.duration);
  }
}

function seekAudio(e: MouseEvent) {
  if (!audioRef.value) return;
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const percent = (e.clientX - rect.left) / rect.width;
  audioRef.value.currentTime = percent * audioRef.value.duration;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

async function handleTranscribe() {
  if (!recording.value) return;
  processingAction.value = 'transcribe';
  await recordingsStore.transcribeRecording(recording.value._id);
  processingAction.value = '';
  activeTab.value = 'transcript';
}

async function handleSummarize() {
  if (!recording.value) return;
  processingAction.value = 'summarize';
  await recordingsStore.summarizeRecording(recording.value._id);
  processingAction.value = '';
  activeTab.value = 'summary';
}

async function handleMinutes() {
  if (!recording.value) return;
  processingAction.value = 'minutes';
  await recordingsStore.generateMinutes(recording.value._id);
  processingAction.value = '';
  activeTab.value = 'minutes';
}

async function handleActionItems() {
  if (!recording.value) return;
  processingAction.value = 'actions';
  await recordingsStore.generateActionItems(recording.value._id);
  processingAction.value = '';
  activeTab.value = 'actions';
}

async function handleShare() {
  if (!recording.value) return;
  const text = `${recording.value.title}\n\n${recording.value.summary || recording.value.transcript || ''}`;
  if (navigator.share) {
    navigator.share({ title: recording.value.title, text });
  } else {
    await navigator.clipboard.writeText(text);
  }
}

async function copyActiveContent() {
  if (!recording.value) return;
  let text = '';
  if (activeTab.value === 'transcript') text = recording.value.transcript || '';
  else if (activeTab.value === 'summary') text = recording.value.summary || '';
  else if (activeTab.value === 'minutes') text = recording.value.minutes || '';
  else if (activeTab.value === 'actions') text = (recording.value.actionItems || []).map((item, i) => `${i + 1}. ${item.task}${item.assignee && item.assignee !== 'Unassigned' ? ` (${item.assignee})` : ''}`).join('\n');

  await navigator.clipboard.writeText(text);
  const toast = await toastController.create({
    message: 'Copied to clipboard',
    duration: 1500,
    position: 'bottom',
    color: 'dark'
  });
  await toast.present();
}

// PDF Download
async function downloadMinutesPDF() {
  if (!recording.value?.minutes) return;
  generatingPDF.value = true;
  try {
    const template = templates.value[selectedTemplate.value] || templates.value.professional;
    const blob = await generateMinutesPdf(
      recording.value.title,
      formatDate(recording.value.createdAt),
      recording.value.minutes,
      template,
      logoBase64.value
    );
    await downloadBlob(blob, `${recording.value.title}-minutes.pdf`);
  } catch (err) {
    console.error('PDF generation failed:', err);
    const toast = await toastController.create({ message: 'Failed to generate PDF', duration: 2000, color: 'danger', position: 'bottom' });
    await toast.present();
  } finally {
    generatingPDF.value = false;
  }
}

async function downloadSummaryPDF() {
  if (!recording.value?.summary) return;
  generatingPDF.value = true;
  try {
    const blob = await generateSummaryPdf(
      recording.value.title,
      formatDate(recording.value.createdAt),
      recording.value.summary
    );
    await downloadBlob(blob, `${recording.value.title}-summary.pdf`);
  } catch (err) {
    console.error('PDF generation failed:', err);
    const toast = await toastController.create({ message: 'Failed to generate PDF', duration: 2000, color: 'danger', position: 'bottom' });
    await toast.present();
  } finally {
    generatingPDF.value = false;
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URL prefix (e.g. "data:application/pdf;base64,")
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function downloadBlob(blob: Blob, filename: string) {
  if (Capacitor.isNativePlatform()) {
    try {
      const base64 = await blobToBase64(blob);

      if (Capacitor.getPlatform() === 'android') {
        // Use our native plugin which writes directly to the public Downloads
        // folder via MediaStore.Downloads (Android 10+) or DIRECTORY_DOWNLOADS (Android 9-)
        // — no storage permission needed on Android 10+.
        await Downloader.downloadFile({ data: base64, filename, mimeType: 'application/pdf' });
        const toast = await toastController.create({
          message: `"${filename}" saved to Downloads`,
          duration: 3000,
          position: 'bottom',
          color: 'success'
        });
        await toast.present();
      } else {
        // iOS — save to the app's Documents folder (visible in Files app)
        await Filesystem.writeFile({ path: filename, data: base64, directory: Directory.Documents, recursive: true });
        const toast = await toastController.create({
          message: `"${filename}" saved to Files → On My iPhone → RecAI`,
          duration: 3000,
          position: 'bottom',
          color: 'success'
        });
        await toast.present();
      }
    } catch (err) {
      console.error('Download failed:', err);
      const toast = await toastController.create({
        message: 'Failed to download PDF',
        duration: 2000,
        color: 'danger',
        position: 'bottom'
      });
      await toast.present();
    }
    return;
  }

  // Web browser: try share sheet (mobile) then anchor click (desktop)
  try {
    const file = new File([blob], filename, { type: 'application/pdf' });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: filename });
      return;
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') return;
  }

  // Desktop browser fallback: programmatic anchor click
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  const toast = await toastController.create({
    message: 'PDF downloaded',
    duration: 1500,
    position: 'bottom',
    color: 'dark'
  });
  await toast.present();
}

// Template Management
function openTemplateEditor(key?: string) {
  editingTemplateKey.value = key || null;
  showTemplateEditor.value = true;
}

async function handleTemplateSave(key: string | null, template: PdfTemplate, logo: string | null, logoChanged: boolean) {
  if (key) {
    templates.value[key] = template;
    selectedTemplate.value = key;
  } else {
    const newKey = template.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
    templates.value[newKey] = template;
    selectedTemplate.value = newKey;
  }
  await saveCustomTemplates(templates.value);

  if (logoChanged) {
    if (logo) {
      await saveLogo(logo);
    } else {
      await removeLogo();
    }
    logoBase64.value = logo;
  }

  showTemplateEditor.value = false;
}

async function handleTemplateDelete(key: string) {
  delete templates.value[key];
  if (selectedTemplate.value === key) {
    selectedTemplate.value = 'professional';
  }
  await saveCustomTemplates(templates.value);
  showTemplateEditor.value = false;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatDuration(seconds: number) {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatStatus(status: string) {
  const map: Record<string, string> = {
    pending: 'Pending', transcribing: 'Processing', transcribed: 'Transcribed',
    summarized: 'Summarized', completed: 'Complete', failed: 'Failed'
  };
  return map[status] || status;
}

function renderMarkdown(text: string): string {
  if (!text) return '';

  // Escape HTML to prevent XSS
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Process line by line
  const lines = html.split('\n');
  const result: string[] = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Headings
    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      if (inList) { result.push('</ul>'); inList = false; }
      const level = headingMatch[1].length;
      const content = applyInlineFormatting(headingMatch[2]);
      result.push(`<h${level + 1}>${content}</h${level + 1}>`);
      continue;
    }

    // Bullet points (* or -)
    const bulletMatch = line.match(/^(\s*)[\*\-]\s+(.+)$/);
    if (bulletMatch) {
      if (!inList) { result.push('<ul>'); inList = true; }
      const content = applyInlineFormatting(bulletMatch[2]);
      result.push(`<li>${content}</li>`);
      continue;
    }

    // Close list if we hit a non-bullet line
    if (inList && line.trim() !== '') {
      result.push('</ul>');
      inList = false;
    }

    // Empty line
    if (line.trim() === '') {
      if (inList) { result.push('</ul>'); inList = false; }
      result.push('<br>');
      continue;
    }

    // Regular paragraph
    result.push(`<p>${applyInlineFormatting(line)}</p>`);
  }

  if (inList) result.push('</ul>');
  return result.join('');
}

function applyInlineFormatting(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}
</script>

<style scoped>
.detail-page {
  padding: calc(20px + env(safe-area-inset-top, 0px)) 20px 40px;
}

/* Header */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.header-btn {
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

.header-btn:active { transform: scale(0.93); }
.header-btn ion-icon { font-size: 22px; }

.header-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--app-text);
}

/* Loading */
.loading-state { display: flex; justify-content: center; padding: 64px; }

/* Empty */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 64px 24px;
  text-align: center;
}

.empty-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(245, 158, 11, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.empty-icon-wrap ion-icon { font-size: 28px; color: var(--ion-color-warning); }
.empty-state h3 { font-size: 18px; font-weight: 700; color: var(--app-text); margin: 0 0 12px; }

.link-btn {
  background: none;
  border: none;
  color: var(--app-primary);
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
}

/* Title Section */
.title-section {
  margin-bottom: 20px;
}

.title-section h1 {
  font-size: 24px;
  font-weight: 800;
  color: var(--app-text);
  margin: 0 0 12px;
  line-height: 1.3;
  letter-spacing: -0.3px;
}

.meta-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.meta-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--radius-full);
  font-size: 12px;
  color: var(--app-text-secondary);
  font-weight: 500;
}

.meta-chip ion-icon {
  font-size: 14px;
  color: var(--app-text-muted);
}

.status-chip {
  padding: 5px 12px;
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 700;
}

.status-chip.pending { background: rgba(245, 158, 11, 0.1); color: var(--ion-color-warning); }
.status-chip.transcribed, .status-chip.summarized, .status-chip.completed { background: rgba(34, 197, 94, 0.1); color: var(--ion-color-success); }
.status-chip.failed { background: rgba(239, 68, 68, 0.1); color: var(--ion-color-danger); }

/* Player */
.player-section {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--radius-2xl);
  margin-bottom: 24px;
  box-shadow: var(--shadow-sm);
}

.player-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: var(--app-gradient);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  box-shadow: var(--shadow-primary);
  transition: transform var(--transition-fast);
}

.player-btn:active { transform: scale(0.93); }
.player-btn ion-icon { font-size: 22px; }

.player-body { flex: 1; }

.player-bar {
  position: relative;
  height: 6px;
  background: var(--app-border);
  border-radius: 3px;
  cursor: pointer;
  margin-bottom: 10px;
}

.bar-fill {
  height: 100%;
  background: var(--app-gradient);
  border-radius: 3px;
  transition: width 0.1s;
}

.bar-thumb {
  position: absolute;
  top: 50%;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--app-primary);
  border: 3px solid var(--app-surface);
  box-shadow: var(--shadow-sm);
  transform: translate(-50%, -50%);
  transition: left 0.1s;
}

.player-times {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--app-text-muted);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

/* AI Section */
.ai-section {
  margin-bottom: 24px;
}

.section-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--app-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin: 0 0 12px;
}

.ai-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.ai-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 18px 8px;
  background: var(--app-surface);
  border: 1.5px solid var(--app-border);
  border-radius: var(--radius-xl);
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-xs);
}

.ai-card:active:not(:disabled) { transform: scale(0.96); }
.ai-card:disabled { opacity: 0.45; cursor: not-allowed; }

.ai-card.done {
  border-color: var(--app-primary);
  background: var(--app-primary-ultra-light);
}

.ai-card.active {
  border-color: var(--app-primary);
}

.ai-card-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  background: var(--app-bg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-card-icon ion-icon { font-size: 22px; color: var(--app-primary); }
.ai-card-icon ion-spinner { width: 22px; height: 22px; color: var(--app-primary); }
.ai-card-icon.done { background: var(--app-gradient); }
.ai-card-icon.done ion-icon { color: white; }

.ai-card-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--app-text);
  text-align: center;
}

/* Content Tabs */
.content-section {
  margin-bottom: 20px;
}

.content-tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--radius-lg);
  margin-bottom: 16px;
}

.content-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 8px;
  background: none;
  border: none;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 600;
  color: var(--app-text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.content-tab.active {
  background: var(--app-gradient);
  color: white;
  box-shadow: var(--shadow-primary);
}

.content-tab ion-icon { font-size: 16px; }

/* Tab Content */
.tab-content {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--radius-2xl);
  overflow: hidden;
  box-shadow: var(--shadow-xs);
}

.tab-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-bottom: 1px solid var(--app-border);
}

.tab-header h3 {
  font-size: 15px;
  font-weight: 700;
  color: var(--app-text);
  margin: 0;
}

.tab-actions {
  display: flex;
  gap: 6px;
}

.action-btn {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--app-border);
  background: var(--app-bg);
  color: var(--app-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.action-btn:active:not(:disabled) {
  transform: scale(0.93);
  background: var(--app-primary-ultra-light);
  color: var(--app-primary);
  border-color: var(--app-primary);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn ion-icon { font-size: 16px; }

/* Template Bar */
.template-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 18px;
  border-bottom: 1px solid var(--app-border);
  background: var(--app-bg);
}

.template-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.template-selector label {
  font-size: 12px;
  font-weight: 700;
  color: var(--app-text-muted);
  white-space: nowrap;
}

.template-select {
  flex: 1;
  min-width: 0;
  padding: 7px 10px;
  border: 1px solid var(--app-border);
  border-radius: var(--radius-md);
  background: var(--app-surface);
  font-size: 13px;
  font-weight: 600;
  color: var(--app-text);
  -webkit-appearance: none;
  appearance: none;
}

.template-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.icon-btn {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-md);
  border: 1px solid var(--app-border);
  background: var(--app-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--app-text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.icon-btn:active { transform: scale(0.93); }
.icon-btn ion-icon { font-size: 16px; }

.icon-btn.accent {
  color: var(--app-primary);
  border-color: var(--app-primary);
  background: var(--app-primary-ultra-light);
}

.non-english-notice {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px 24px;
  text-align: center;
  color: var(--app-text-muted);
}

.non-english-notice ion-icon {
  font-size: 36px;
  color: var(--app-primary);
  opacity: 0.6;
}

.non-english-notice p {
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
  max-width: 240px;
}

.transcript-editor {
  display: block;
  width: 100%;
  min-height: 320px;
  padding: 18px;
  font-size: 15px;
  line-height: 1.75;
  color: var(--app-text);
  background: var(--app-bg);
  border: none;
  border-top: 1px solid var(--app-border);
  resize: vertical;
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
}

.action-btn.save {
  color: var(--app-primary);
  border-color: var(--app-primary);
  background: var(--app-primary-ultra-light);
}

.tab-body {
  padding: 18px;
  font-size: 15px;
  line-height: 1.75;
  color: var(--app-text);
  white-space: pre-wrap;
  max-height: 400px;
  overflow-y: auto;
}

.tab-body.formatted {
  white-space: normal;
}

.tab-body.formatted h2 {
  font-size: 18px;
  font-weight: 700;
  color: var(--app-text);
  margin: 20px 0 8px;
}

.tab-body.formatted h2:first-child {
  margin-top: 0;
}

.tab-body.formatted h3 {
  font-size: 16px;
  font-weight: 700;
  color: var(--app-text);
  margin: 16px 0 6px;
}

.tab-body.formatted h4 {
  font-size: 15px;
  font-weight: 700;
  color: var(--app-text-secondary);
  margin: 12px 0 4px;
}

.tab-body.formatted h5 {
  font-size: 14px;
  font-weight: 600;
  color: var(--app-text-secondary);
  margin: 10px 0 4px;
}

.tab-body.formatted p {
  margin: 4px 0;
}

.tab-body.formatted ul {
  margin: 6px 0;
  padding-left: 20px;
  list-style: none;
}

.tab-body.formatted ul li {
  position: relative;
  padding-left: 6px;
  margin: 4px 0;
}

.tab-body.formatted ul li::before {
  content: '';
  position: absolute;
  left: -12px;
  top: 10px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--app-primary);
}

.tab-body.formatted strong {
  font-weight: 700;
  color: var(--app-text);
}

.tab-body.formatted em {
  font-style: italic;
  color: var(--app-text-secondary);
}

.tab-body.formatted code {
  font-family: monospace;
  font-size: 13px;
  background: var(--app-border);
  padding: 2px 6px;
  border-radius: 4px;
}

.tab-body.formatted br {
  display: block;
  content: '';
  margin: 4px 0;
}

/* Todo List */
.todo-list {
  padding: 0;
  white-space: normal;
}

.todo-progress-bar {
  height: 4px;
  background: var(--app-border);
  margin: 16px 18px 6px;
  border-radius: 2px;
  overflow: hidden;
}

.todo-progress-fill {
  height: 100%;
  background: var(--app-gradient);
  border-radius: 2px;
  transition: width 0.4s ease;
}

.todo-progress-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--app-text-muted);
  text-align: right;
  padding: 0 18px 12px;
}

.todo-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--app-border);
  cursor: pointer;
  transition: background var(--transition-fast);
  border-left: 3px solid transparent;
}

.todo-item:last-child { border-bottom: none; }
.todo-item:active { background: var(--app-surface-hover); }

.todo-item.high  { border-left-color: var(--ion-color-danger); }
.todo-item.medium { border-left-color: var(--ion-color-warning); }
.todo-item.low   { border-left-color: var(--ion-color-success); }

.todo-item.done {
  border-left-color: var(--app-border);
  opacity: 0.6;
}

.todo-checkbox {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid var(--app-border);
  background: var(--app-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 1px;
  transition: all var(--transition-fast);
}

.todo-checkbox.checked {
  background: var(--app-gradient);
  border-color: transparent;
}

.todo-checkbox.checked ion-icon {
  font-size: 14px;
  color: white;
}

.todo-content {
  flex: 1;
  min-width: 0;
}

.todo-task {
  display: block;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.5;
  color: var(--app-text);
  margin-bottom: 6px;
  transition: all var(--transition-fast);
}

.todo-task.done {
  text-decoration: line-through;
  color: var(--app-text-muted);
}

.todo-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.todo-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: var(--radius-full);
  background: var(--app-border);
  color: var(--app-text-muted);
  text-transform: capitalize;
}

.todo-badge ion-icon { font-size: 11px; }

.todo-badge.priority.high   { background: rgba(239,68,68,0.1);  color: var(--ion-color-danger); }
.todo-badge.priority.medium { background: rgba(245,158,11,0.1); color: var(--ion-color-warning); }
.todo-badge.priority.low    { background: rgba(34,197,94,0.1);  color: var(--ion-color-success); }
.todo-badge.assignee { background: var(--app-primary-ultra-light); color: var(--app-primary); }
.todo-badge.deadline { background: rgba(99,102,241,0.08); color: var(--ion-color-tertiary); }
</style>
