<template>
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <div class="mb-6 sm:mb-8">
      <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">New Recording</h1>
      <p class="text-gray-600 mt-1 text-sm sm:text-base">Record your voice or upload an existing audio file for AI transcription.</p>
    </div>

    <!-- Duration warning banner -->
    <div v-if="isRecording && nearingLimit && !atLimit" class="mb-6 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
      <svg class="w-5 h-5 text-amber-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
      <p class="text-amber-800 text-sm font-semibold">Less than 1 minute left on your {{ planLabel }} plan limit — recording will auto-save when time is up.</p>
    </div>

    <!-- Plan limit banner -->
    <div v-if="limitReached" class="mb-6 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
      <svg class="w-5 h-5 text-amber-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
      <div class="flex-1">
        <p class="font-semibold text-amber-800 text-sm">Recording limit reached</p>
        <p class="text-amber-700 text-sm mt-0.5">
          You've used {{ usageCount }}/{{ limitCount }} recordings this month on the {{ planLabel }} plan.
        </p>
      </div>
      <router-link to="/pricing" class="shrink-0 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition">
        Upgrade
      </router-link>
    </div>

    <!-- Tab Selection -->
    <div class="flex space-x-2 mb-4 sm:mb-6">
      <button
        @click="mode = 'record'"
        :class="[
          'flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl font-medium transition flex items-center justify-center space-x-2 text-sm sm:text-base',
          mode === 'record' 
            ? 'bg-emerald-600 text-white' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        ]"
      >
        <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
        <span>Record Live</span>
      </button>
      <button
        @click="mode = 'upload'"
        :class="[
          'flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl font-medium transition flex items-center justify-center space-x-2 text-sm sm:text-base',
          mode === 'upload' 
            ? 'bg-emerald-600 text-white' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        ]"
      >
        <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <span>Upload File</span>
      </button>
    </div>

    <!-- Recording Card -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8">
      <!-- LIVE RECORDING MODE -->
      <div v-if="mode === 'record'" class="text-center py-4 sm:py-8">
        <!-- Waveform Visualization -->
        <div class="mb-6 sm:mb-8">
          <div class="flex items-center justify-center space-x-0.5 sm:space-x-1 h-16 sm:h-24">
            <div 
              v-for="i in 20" 
              :key="i" 
              class="w-1 sm:w-1 bg-emerald-500 rounded-full transition-all duration-150"
              :style="{ height: getBarHeight(i) + 'px' }"
            ></div>
          </div>
        </div>

        <!-- Timer -->
        <div class="mb-4 sm:mb-6">
          <span class="text-3xl sm:text-4xl font-mono font-bold text-gray-900">{{ formatTime(recordingTime) }}</span>
        </div>

        <!-- Controls -->
        <div class="flex items-center justify-center space-x-4">
          <button
            v-if="!isRecording && !isFinalizingChunks && !audioBlob && !isRecordingReady"
            @click="startRecording"
            :disabled="limitReached"
            class="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
          >
            <svg class="w-6 h-6 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          </button>

          <button
            v-if="isRecording"
            @click="stopRecording"
            class="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all animate-pulse"
          >
            <svg class="w-6 h-6 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2"/>
            </svg>
          </button>

          <!-- Spinner shown while the last chunk(s) finish uploading after stop -->
          <div v-if="isFinalizingChunks" class="flex items-center space-x-2 text-gray-400">
            <svg class="animate-spin w-6 h-6 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
          </div>

          <button
            v-if="(audioBlob || isRecordingReady) && !isRecording && !isFinalizingChunks"
            @click="resetRecording"
            class="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-300 transition"
          >
            <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        <p class="text-gray-500 mt-4 text-xs sm:text-sm">
          {{ isRecording ? 'Recording in progress... Click to stop' : isFinalizingChunks ? 'Saving last chunks...' : (audioBlob || isRecordingReady) ? 'Recording complete' : 'Click to start recording' }}
        </p>
      </div>

      <!-- FILE UPLOAD MODE -->
      <div v-else class="py-4 sm:py-8">
        <!-- Drop Zone -->
        <div
          @dragover.prevent="!limitReached && (isDragging = true)"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="!limitReached && handleFileDrop($event)"
          @click="!limitReached && $refs.fileInput.click()"
          :class="[
            'border-2 border-dashed rounded-2xl p-6 sm:p-12 text-center transition',
            limitReached ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
            isDragging 
              ? 'border-emerald-500 bg-emerald-50' 
              : uploadedFile 
                ? 'border-emerald-300 bg-emerald-50' 
                : 'border-gray-300 hover:border-emerald-400 hover:bg-gray-50'
          ]"
        >
          <input
            ref="fileInput"
            type="file"
            accept="audio/*,video/*,.mp3,.wav,.m4a,.ogg,.webm,.mp4,.mov,.avi"
            @change="handleFileSelect"
            class="hidden"
          />
          
          <div v-if="!uploadedFile">
            <div class="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <svg class="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p class="text-base sm:text-lg font-medium text-gray-700">Drop your audio or video file here</p>
            <p class="text-gray-500 mt-2 text-sm">or click to browse</p>
            <p class="text-xs sm:text-sm text-gray-400 mt-3 sm:mt-4">Supports MP3, WAV, M4A, OGG, WebM, MP4, MOV (max 100MB)</p>
          </div>
          
          <div v-else class="flex items-center justify-center space-x-4">
            <div class="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <div class="text-left">
              <p class="font-medium text-gray-900">{{ uploadedFile.name }}</p>
              <p class="text-sm text-gray-500">{{ formatFileSize(uploadedFile.size) }}</p>
            </div>
            <button
              @click.stop="removeUploadedFile"
              class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Audio Playback -->
      <div v-if="audioUrl" class="mt-6 p-4 bg-gray-50 rounded-xl">
        <p class="text-sm font-medium text-gray-700 mb-2">Preview Recording</p>
        <audio :src="audioUrl" controls class="w-full"></audio>
      </div>

      <!-- Info Message -->
      <div v-if="(isRecordingReady || uploadedFile) && !isFinalizingChunks" class="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
        <div class="flex items-center space-x-3">
          <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-sm text-emerald-700">Click save to upload and transcribe with AI. You'll see the transcript immediately.</p>
        </div>
      </div>

      <!-- Upload Progress Bar -->
      <div v-if="saving && uploadProgress > 0 && uploadProgress < 100" class="mt-6">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-gray-700">{{ savingStatus }}</span>
          <span class="text-sm text-gray-500">{{ uploadProgress }}%</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            class="bg-emerald-600 h-2.5 rounded-full transition-all duration-300"
            :style="{ width: uploadProgress + '%' }"
          ></div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="mt-8 flex items-center justify-end space-x-4">
        <button
          @click="showCrashLog"
          class="px-3 py-2 text-xs text-gray-400 hover:text-gray-600 transition"
          title="Show crash log"
        >
          [debug]
        </button>
        <button
          @click="$router.push('/dashboard')"
          class="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition"
        >
          Cancel
        </button>
        <button
          @click="saveRecording"
          :disabled="saving || isFinalizingChunks || (!isRecordingReady && !uploadedFile) || limitReached"
          class="px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <svg v-if="saving" class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>{{ saving ? (savingStatus || 'Saving...') : 'Save & Transcribe' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { recordingsApi } from '../api';

const router = useRouter();

// ── Crash diagnostics ──────────────────────────────────────────────────────
// Writes timestamped markers to localStorage so they survive a tab kill.
// Read them from the browser console after a crash: JSON.parse(localStorage.getItem('eb_crash'))
const dbg = (msg) => {
  try {
    const logs = JSON.parse(localStorage.getItem('eb_crash') || '[]');
    logs.push(`${new Date().toISOString().slice(11,23)} ${msg}`);
    if (logs.length > 80) logs.splice(0, logs.length - 80);
    localStorage.setItem('eb_crash', JSON.stringify(logs));
  } catch {}
};

// Plan limits
const usageCount = ref(0);
const limitCount = ref(null);
const maxDurationSecs = ref(null);
const planLabel = ref('Free');
const limitReached = computed(() =>
  limitCount.value !== null && usageCount.value >= limitCount.value
);
const nearingLimit = computed(() =>
  maxDurationSecs.value !== null && recordingTime.value >= maxDurationSecs.value - 60
);
const atLimit = computed(() =>
  maxDurationSecs.value !== null && recordingTime.value >= maxDurationSecs.value
);

onMounted(async () => {
  try {
    const data = await recordingsApi.getLimits();
    usageCount.value = data.usage.recordingsThisMonth;
    limitCount.value = data.limits.recordingsPerMonth;
    maxDurationSecs.value = data.limits.maxDurationSecs ?? null;
    planLabel.value = data.plan.charAt(0).toUpperCase() + data.plan.slice(1);
  } catch {
    // non-critical — page still works, backend will block at save
  }
});

// Mode: 'record' or 'upload'
const mode = ref('record');

const isRecording = ref(false);
const recordingTime = ref(0);
const audioBlob = ref(null);
const audioUrl = ref(null);
const saving = ref(false);
const savingStatus = ref('');
const uploadProgress = ref(0);
const audioLevels = ref(Array(30).fill(10));

// File upload
const uploadedFile = ref(null);
const isDragging = ref(false);
const isRecordingReady = ref(false);
// true while we wait for the last in-flight chunk uploads after stop()
const isFinalizingChunks = ref(false);

let mediaRecorder = null;
let timerInterval = null;
let analyserInterval = null;

// Per-session streaming state (not reactive — never needed in template)
let liveUploadId = null;
let liveChunkIdx = 0;
let liveChunkPromises = [];

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const getBarHeight = (index) => {
  if (isRecording.value) {
    return audioLevels.value[index] || 10;
  }
  return 10;
};

const startRecording = async () => {
  dbg('startRecording');
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: { ideal: 1 }, echoCancellation: true, noiseSuppression: true }
    });
    dbg('getUserMedia ok');
    mediaRecorder = new MediaRecorder(stream, { audioBitsPerSecond: 32000 });
    isRecordingReady.value = false;

    // Init per-session streaming state
    liveUploadId = Date.now().toString(36) + Math.random().toString(36).slice(2);
    liveChunkIdx = 0;
    liveChunkPromises = [];
    dbg(`session ${liveUploadId}`);

    // Audio visualization
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 64;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    analyserInterval = setInterval(() => {
      try {
        analyser.getByteFrequencyData(dataArray);
        audioLevels.value = Array.from(dataArray.slice(0, 30)).map(v => Math.max(10, v / 3));
      } catch (e) {
        clearInterval(analyserInterval);
      }
    }, 100);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size === 0) return;
      const idx = liveChunkIdx++;
      dbg(`chunk ${idx} size=${event.data.size}`);
      // FileReader is the safe cross-browser way to base64-encode a Blob without
      // blowing the call stack (String.fromCharCode spread fails on large chunks)
      const p = new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result.split(',')[1];
          dbg(`chunk ${idx} encoded len=${base64.length}`);
          recordingsApi.uploadChunk(liveUploadId, idx, base64)
            .then(() => { dbg(`chunk ${idx} uploaded ok`); resolve(); })
            .catch(err => { dbg(`chunk ${idx} UPLOAD FAILED: ${err.message}`); resolve(); });
        };
        reader.onerror = () => { dbg(`chunk ${idx} FileReader error`); resolve(); };
        reader.readAsDataURL(event.data);
      });
      liveChunkPromises.push(p);
    };

    // Synchronous onstop — returning a Promise here would be an unhandled rejection
    // in the browser's event system and can trigger a page reload in some WebViews.
    mediaRecorder.onstop = () => {
      dbg('onstop fired');
      clearInterval(analyserInterval);
      dbg('onstop: clearInterval done');
      try { stream.getTracks().forEach(t => t.stop()); } catch (e) { dbg(`onstop: track.stop err ${e.message}`); }
      dbg('onstop: tracks stopped');
      audioContext.close().catch(() => {});
      dbg('onstop: audioContext.close() called');
      // Flip out of recording immediately so the pulsing stop-button disappears.
      // isFinalizingChunks keeps us from flashing back to "start recording" state.
      isRecording.value = false;
      isFinalizingChunks.value = true;
      audioLevels.value = Array(30).fill(10);
      dbg(`onstop: state updated, waiting for ${liveChunkPromises.length} promises`);
      // Snapshot the promise array — resetRecording() can replace the reference
      const pending = liveChunkPromises.slice();
      Promise.all(pending)
        .catch(() => {})
        .then(() => {
          dbg('onstop: all chunks settled, isRecordingReady=true');
          isFinalizingChunks.value = false;
          isRecordingReady.value = true;
        });
    };

    mediaRecorder.start(5000); // 5-second slices — browser releases PCM after each emit
    isRecording.value = true;
    recordingTime.value = 0;
    
    timerInterval = setInterval(() => {
      recordingTime.value++;
      if (maxDurationSecs.value !== null && recordingTime.value >= maxDurationSecs.value) {
        dbg(`auto-stop at ${recordingTime.value}s (limit=${maxDurationSecs.value}s)`);
        stopRecording();
      }
    }, 1000);
  } catch (error) {
    console.error('Error accessing microphone:', error);
    alert('Could not access microphone. Please check permissions.');
  }
};

const stopRecording = () => {
  dbg(`stopRecording called state=${mediaRecorder?.state} time=${recordingTime.value}s chunks=${liveChunkIdx}`);
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    dbg('mediaRecorder.stop() returned');
    clearInterval(timerInterval);
    // isRecording stays true until onstop fires so the template
    // never flashes back to the "start recording" state mid-transition
  }
};

const resetRecording = () => {
  liveUploadId = null;
  liveChunkIdx = 0;
  liveChunkPromises = [];
  isRecordingReady.value = false;
  isFinalizingChunks.value = false;
  audioBlob.value = null;
  audioUrl.value = null;
  recordingTime.value = 0;
  uploadedFile.value = null;
};

// File upload functions
const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
    processFile(file);
  }
};

const handleFileDrop = (event) => {
  isDragging.value = false;
  const file = event.dataTransfer.files[0];
  if (file) {
    processFile(file);
  }
};

const processFile = (file) => {
  // Check file size (max 100MB)
  if (file.size > 100 * 1024 * 1024) {
    alert('File is too large. Maximum size is 100MB.');
    return;
  }
  
  // Check file type
  const validTypes = ['audio/', 'video/'];
  if (!validTypes.some(type => file.type.startsWith(type))) {
    alert('Invalid file type. Please upload an audio or video file.');
    return;
  }
  
  uploadedFile.value = file;
  audioBlob.value = file;
  audioUrl.value = URL.createObjectURL(file);
};

const removeUploadedFile = () => {
  uploadedFile.value = null;
  audioBlob.value = null;
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value);
    audioUrl.value = null;
  }
};

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const saveRecording = async () => {
  saving.value = true;
  uploadProgress.value = 0;

  try {
    if (isRecordingReady.value && !uploadedFile.value) {
      // Live recording path: chunks already on the server, just finalize
      savingStatus.value = 'Processing and transcribing...';
      const now = new Date();
      const title = `Recording ${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      const result = await recordingsApi.finalizeUpload(liveUploadId, {
        duration: recordingTime.value || 0,
        mimeType: 'audio/webm',
        title,
      });
      const recordingId = result.recording._id || result.recording.id;
      if (!recordingId) throw new Error('No recording ID returned from server');
      router.push(`/dashboard/recordings/${recordingId}`);
      return;
    }

    // File upload path (unchanged)
    if (!audioBlob.value) return;
    const mimeType = audioBlob.value.type || 'audio/webm';

    savingStatus.value = 'Preparing upload...';
    const { uploadUrl, key } = await recordingsApi.getUploadUrl(mimeType);

    savingStatus.value = 'Uploading audio...';
    await recordingsApi.uploadToR2(uploadUrl, audioBlob.value, (percent) => {
      uploadProgress.value = percent;
      savingStatus.value = `Uploading... ${percent}%`;
    });

    savingStatus.value = 'Processing and transcribing...';
    const now = new Date();
    const result = await recordingsApi.create({
      title: uploadedFile.value
        ? uploadedFile.value.name.replace(/\.[^/.]+$/, '')
        : `Recording ${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      audioKey: key,
      mimeType,
      duration: recordingTime.value || 0,
      audioSize: audioBlob.value?.size || 0,
    });
    const recordingId = result.recording._id || result.recording.id;
    if (!recordingId) throw new Error('No recording ID returned from server');
    router.push(`/dashboard/recordings/${recordingId}`);
  } catch (error) {
    console.error('Error saving recording:', error);
    alert(error.message || 'Failed to save recording. Please try again.');
  } finally {
    saving.value = false;
    savingStatus.value = '';
    uploadProgress.value = 0;
  }
};

const showCrashLog = () => {
  const raw = localStorage.getItem('eb_crash');
  if (!raw) { alert('No crash log found.'); return; }
  const logs = JSON.parse(raw);
  alert('Last ' + logs.length + ' events:\n\n' + logs.join('\n'));
};

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
  if (analyserInterval) clearInterval(analyserInterval);
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  if (audioUrl.value) URL.revokeObjectURL(audioUrl.value);
  liveChunkPromises = []; // abandon in-flight uploads on unmount
});
</script>
