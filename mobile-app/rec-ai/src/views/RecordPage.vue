<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="record-container">
        <!-- Header -->
        <header class="record-header">
          <button class="header-btn" @click="handleClose">
            <ion-icon :icon="closeOutline"></ion-icon>
          </button>
          <div class="header-center">
            <div class="header-dot" :class="{ active: isRecording }"></div>
            <span class="header-title">{{ headerTitle }}</span>
          </div>
          <div class="header-btn-spacer"></div>
        </header>

        <!-- Main -->
        <main class="record-main">
          <!-- Timer -->
          <div class="timer-section">
            <div class="timer-ring" :class="{ recording: isRecording, preview: showPreview }">
              <svg viewBox="0 0 200 200" class="timer-svg">
                <circle cx="100" cy="100" r="90" class="ring-bg" />
                <circle
                  v-if="isRecording"
                  cx="100" cy="100" r="90"
                  class="ring-progress"
                  :style="{ strokeDashoffset: ringOffset }"
                />
              </svg>
              <div class="timer-inner">
                <div class="timer-display">{{ formattedTime }}</div>
                <p class="timer-label">{{ statusLabel }}</p>
              </div>
            </div>
          </div>

          <!-- Waveform -->
          <div class="waveform-container" :class="{ active: isRecording || isPlaying }">
            <div class="waveform">
              <div
                v-for="(h, i) in waveformBars"
                :key="i"
                class="bar"
                :style="{ height: `${h}%`, animationDelay: `${i * 20}ms` }"
              ></div>
            </div>
          </div>

          <!-- Preview Player -->
          <div class="preview-player" v-if="showPreview && audioUrl">
            <button class="player-play-btn" @click="togglePlayback">
              <ion-icon :icon="isPlaying ? pauseOutline : playOutline"></ion-icon>
            </button>
            <div class="player-track">
              <div class="track-bar" @click="seekAudio">
                <div class="track-fill" :style="{ width: `${playbackProgress}%` }"></div>
                <div class="track-thumb" :style="{ left: `${playbackProgress}%` }"></div>
              </div>
              <div class="track-times">
                <span>{{ playbackCurrentTime }}</span>
                <span>{{ playbackTotalTime }}</span>
              </div>
            </div>
          </div>

          <!-- Processing Overlay -->
          <div class="processing-overlay" v-if="isProcessing">
            <div class="processing-spinner">
              <ion-spinner name="crescent" color="primary"></ion-spinner>
            </div>
            <h3>{{ processingTitle }}</h3>
            <p>{{ processingStatus }}</p>
            <div v-if="uploadProgress > 0 && uploadProgress < 100" class="upload-progress-bar">
              <div class="upload-progress-fill" :style="{ width: uploadProgress + '%' }"></div>
            </div>
            <div class="processing-dots" v-else>
              <span></span><span></span><span></span>
            </div>
          </div>
        </main>

        <!-- Controls -->
        <footer class="record-footer" v-if="!isProcessing">
          <!-- Record Button -->
          <div class="controls" v-if="!showPreview">
            <div class="record-btn-wrap">
              <button class="record-btn" :class="{ recording: isRecording }" @click="toggleRecording">
                <div class="btn-inner">
                  <div v-if="isRecording" class="stop-icon"></div>
                  <ion-icon v-else :icon="mic"></ion-icon>
                </div>
              </button>
              <div class="pulse-ring" v-if="isRecording"></div>
              <div class="pulse-ring pulse-ring-2" v-if="isRecording"></div>
            </div>
            <p class="hint">{{ isRecording ? 'Tap to stop' : 'Tap to record' }}</p>
            <p class="lang-notice" v-if="!isRecording">English is the only supported language in this version.<br> We appreciate your patience.</p>

            <!-- Upload Option -->
            <div class="upload-divider" v-if="!isRecording">
              <span class="divider-line"></span>
              <span class="divider-text">or</span>
              <span class="divider-line"></span>
            </div>
            <button class="upload-btn" v-if="!isRecording" @click="triggerFileUpload">
              <ion-icon :icon="cloudUploadOutline"></ion-icon>
              <span>Upload Audio File</span>
            </button>
            <input
              ref="fileInputRef"
              type="file"
              accept="audio/*,.mp3,.wav,.m4a,.ogg,.webm,.flac,.aac"
              class="file-input-hidden"
              @change="handleFileUpload"
            />
          </div>

          <!-- Preview Controls -->
          <div class="preview-controls" v-else>
            <button class="ctrl-btn discard" @click="discardRecording">
              <div class="ctrl-icon">
                <ion-icon :icon="trashOutline"></ion-icon>
              </div>
              <span>Discard</span>
            </button>
            <button class="ctrl-btn save" @click="saveRecording">
              <div class="ctrl-icon">
                <ion-icon :icon="checkmarkOutline"></ion-icon>
              </div>
              <span>Save</span>
            </button>
          </div>
        </footer>

        <!-- Error -->
        <transition name="toast">
          <div class="error-toast" v-if="error" @click="error = ''">
            <ion-icon :icon="alertCircleOutline"></ion-icon>
            <span>{{ error }}</span>
            <ion-icon :icon="closeOutline" class="toast-close"></ion-icon>
          </div>
        </transition>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonContent, IonIcon, IonSpinner, alertController } from '@ionic/vue';
import { closeOutline, mic, playOutline, pauseOutline, trashOutline, checkmarkOutline, alertCircleOutline, cloudUploadOutline } from 'ionicons/icons';
import { Capacitor } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';
import { CapacitorVoiceRecorder } from '@lgicc/capacitor-voice-recorder';
import { useRecordingsStore } from '@/stores/recordings';
import { api } from '@/services/api';

const router = useRouter();
const recordingsStore = useRecordingsStore();

// State
const isRecording = ref(false);
const isProcessing = ref(false);
const showPreview = ref(false);
const error = ref('');
const recordingTime = ref(0);
const processingTitle = ref('Processing');
const processingStatus = ref('');
const uploadProgress = ref(0);

// Audio
const mediaRecorder = ref<MediaRecorder | null>(null);
const audioChunks = ref<Blob[]>([]);
const audioBlob = ref<Blob | null>(null);
const audioUrl = ref<string | null>(null);
const audioContext = ref<AudioContext | null>(null);
const analyser = ref<AnalyserNode | null>(null);
const mediaStream = ref<MediaStream | null>(null);

// Native recorder
const voiceRecorderListener = ref<PluginListenerHandle | null>(null);

// File Upload
const fileInputRef = ref<HTMLInputElement | null>(null);
const uploadedFileDuration = ref(0);

// Playback
const audioElement = ref<HTMLAudioElement | null>(null);
const isPlaying = ref(false);
const playbackProgress = ref(0);
const playbackCurrentTime = ref('0:00');
const playbackTotalTime = ref('0:00');

// Visualization
const waveformBars = ref<number[]>(Array(40).fill(12));
const animationFrame = ref<number | null>(null);
const timerInterval = ref<number | null>(null);

const MAX_RECORDING_TIME = 600; // 10 minutes

const headerTitle = computed(() => {
  if (isRecording.value) return 'Recording';
  if (isProcessing.value) return 'Processing';
  if (showPreview.value) return 'Preview';
  return 'New Recording';
});

const statusLabel = computed(() => {
  if (isRecording.value) return 'Recording in progress';
  if (isProcessing.value) return processingStatus.value;
  if (showPreview.value) return uploadedFileDuration.value ? 'Review your audio' : 'Review your recording';
  return 'Ready to record';
});

const formattedTime = computed(() => {
  const t = showPreview.value && audioElement.value ? Math.floor(audioElement.value.currentTime) : recordingTime.value;
  const m = Math.floor(t / 60);
  const s = t % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
});

const ringOffset = computed(() => {
  const circumference = 2 * Math.PI * 90;
  const progress = Math.min(recordingTime.value / MAX_RECORDING_TIME, 1);
  return circumference * (1 - progress);
});

onUnmounted(cleanup);

function showPermissionAlert(): Promise<boolean> {
  return new Promise(async (resolve) => {
    const alert = await alertController.create({
      header: 'Microphone Permission Required',
      message: 'Go to Settings \u2192 Apps \u2192 RecAI \u2192 Permissions \u2192 Microphone and enable it, then tap Retry.',
      buttons: [
        { text: 'Cancel', role: 'cancel', handler: () => resolve(false) },
        { text: 'Retry', handler: () => resolve(true) }
      ]
    });
    await alert.present();
  });
}

function cleanup() {
  stopTimer();
  stopVisualization();
  voiceRecorderListener.value?.remove();
  voiceRecorderListener.value = null;
  if (Capacitor.isNativePlatform() && isRecording.value) {
    CapacitorVoiceRecorder.stopRecording().catch(() => {});
  }
  mediaRecorder.value?.state !== 'inactive' && mediaRecorder.value?.stop();
  mediaStream.value?.getTracks().forEach(t => t.stop());
  mediaStream.value = null;
  audioContext.value?.close().catch(() => {});
  audioContext.value = null;
  audioUrl.value && URL.revokeObjectURL(audioUrl.value);
  audioElement.value?.pause();
}

async function handleClose() {
  if (isRecording.value || showPreview.value) {
    const alert = await alertController.create({
      header: 'Discard Recording?',
      message: 'Your recording will be lost.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Discard', role: 'destructive', handler: () => { cleanup(); router.back(); } }
      ]
    });
    await alert.present();
  } else if (!isProcessing.value) {
    router.back();
  }
}

async function toggleRecording() {
  isRecording.value ? await stopRecording() : await startRecording();
}

async function startRecording(retryCount = 0) {
  error.value = '';
  audioChunks.value = [];
  recordingTime.value = 0;

  if (Capacitor.isNativePlatform()) {
    // Native path: use CapacitorVoiceRecorder to bypass WebView getUserMedia.
    // startRecording() triggers the OS permission dialog via requestPermissionForAlias.
    // If doesUserGaveAudioRecordingPermission() returns false despite permission being
    // granted (Capacitor 8 compat issue), fall back to beginRecording() which bypasses
    // that check and calls AudioRecord directly.
    try {
      await CapacitorVoiceRecorder.startRecording();
    } catch (startErr: any) {
      const msg: string = startErr?.message ?? String(startErr ?? '');
      if (msg === 'MISSING_MICROPHONE_PERMISSION') {
        try {
          await (CapacitorVoiceRecorder as any).beginRecording();
          // fall through -- recording started via direct path
        } catch (directErr: any) {
          const dm: string = directErr?.message ?? String(directErr ?? '');
          if (dm === 'MICROPHONE_IN_USE') {
            error.value = 'Microphone is in use by another app. Close it and try again.';
          } else {
            // SecurityException = OS permission truly not granted
            const retry = await showPermissionAlert();
            if (retry) setTimeout(() => startRecording(), 400);
          }
          return;
        }
      } else if (msg === 'MICROPHONE_IN_USE') {
        error.value = 'Microphone is in use by another app. Close it and try again.';
        return;
      } else if (msg === 'DEVICE_NOT_SUPPORTED') {
        error.value = 'This device does not support audio recording.';
        return;
      } else {
        error.value = msg || 'Failed to start recording';
        return;
      }
    }

    isRecording.value = true;
    startTimer();

    voiceRecorderListener.value = await CapacitorVoiceRecorder.addListener(
      'frequencyData',
      ({ base64 }: { base64: string }) => {
        const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        const step = Math.max(1, Math.floor(bytes.length / 40));
        waveformBars.value = Array.from({ length: 40 }, (_, i) =>
          Math.max(12, ((bytes[i * step] ?? 0) / 255) * 100)
        );
      }
    );
    return;
  }

  // Web path
  try {
    if (mediaStream.value) {
      mediaStream.value.getTracks().forEach(t => t.stop());
      mediaStream.value = null;
    }
    if (audioContext.value) {
      await audioContext.value.close().catch(() => {});
      audioContext.value = null;
    }

    const audioConstraints: boolean | MediaTrackConstraints = retryCount > 0
      ? { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
      : true;
    mediaStream.value = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });

    audioContext.value = new AudioContext();
    analyser.value = audioContext.value.createAnalyser();
    analyser.value.fftSize = 128;
    const source = audioContext.value.createMediaStreamSource(mediaStream.value);
    source.connect(analyser.value);

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
    mediaRecorder.value = new MediaRecorder(mediaStream.value, { mimeType });

    mediaRecorder.value.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.value.push(e.data);
    };

    mediaRecorder.value.onstop = () => {
      const mime = mediaRecorder.value?.mimeType || 'audio/webm';
      audioBlob.value = new Blob(audioChunks.value, { type: mime });
      audioUrl.value = URL.createObjectURL(audioBlob.value);

      audioElement.value = new Audio(audioUrl.value);
      audioElement.value.onloadedmetadata = () => {
        playbackTotalTime.value = formatTime(audioElement.value!.duration);
      };
      audioElement.value.ontimeupdate = () => {
        playbackProgress.value = (audioElement.value!.currentTime / audioElement.value!.duration) * 100;
        playbackCurrentTime.value = formatTime(audioElement.value!.currentTime);
      };
      audioElement.value.onended = () => {
        isPlaying.value = false;
        playbackProgress.value = 0;
        playbackCurrentTime.value = '0:00';
        stopVisualization();
      };

      showPreview.value = true;
    };

    mediaRecorder.value.start(100);
    isRecording.value = true;
    startTimer();
    startVisualization();
  } catch (err: any) {
    const errName = err?.name;
    if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
      const retry = await showPermissionAlert();
      if (retry) setTimeout(() => startRecording(), 400);
    } else if (errName === 'NotReadableError' || errName === 'AbortError') {
      if (retryCount < 1) {
        await new Promise(r => setTimeout(r, 700));
        return startRecording(retryCount + 1);
      }
      error.value = 'Could not access the microphone. Close any other apps using it, then tap Record again.';
    } else {
      error.value = err.message || 'Failed to start recording';
    }
  }
}

async function stopRecording() {
  if (Capacitor.isNativePlatform() && isRecording.value) {
    stopTimer();
    stopVisualization();
    isRecording.value = false;
    voiceRecorderListener.value?.remove();
    voiceRecorderListener.value = null;
    try {
      const result = await CapacitorVoiceRecorder.stopRecording();
      const base64: string = (result as any).base64 ?? (result as any).recordDataBase64 ?? '';
      const msDuration: number = (result as any).msDuration ?? 0;
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      audioBlob.value = new Blob([bytes], { type: 'audio/wav' });
      audioUrl.value = URL.createObjectURL(audioBlob.value);
      const secs = Math.round(msDuration / 1000);
      uploadedFileDuration.value = secs;
      recordingTime.value = secs;

      audioElement.value = new Audio(audioUrl.value);
      audioElement.value.onloadedmetadata = () => {
        playbackTotalTime.value = formatTime(audioElement.value!.duration);
      };
      audioElement.value.ontimeupdate = () => {
        playbackProgress.value = (audioElement.value!.currentTime / audioElement.value!.duration) * 100;
        playbackCurrentTime.value = formatTime(audioElement.value!.currentTime);
      };
      audioElement.value.onended = () => {
        isPlaying.value = false;
        playbackProgress.value = 0;
        playbackCurrentTime.value = '0:00';
        stopVisualization();
      };

      showPreview.value = true;
    } catch (err: any) {
      error.value = err.message || 'Failed to finish recording';
    }
    return;
  }

  // Web path
  if (mediaRecorder.value?.state !== 'inactive') {
    stopTimer();
    stopVisualization();
    isRecording.value = false;
    mediaRecorder.value?.stop();
    mediaStream.value?.getTracks().forEach(t => t.stop());
    mediaStream.value = null;
    await audioContext.value?.close().catch(() => {});
    audioContext.value = null;
  }
}

function togglePlayback() {
  if (!audioElement.value) return;
  if (isPlaying.value) {
    audioElement.value.pause();
    isPlaying.value = false;
    stopVisualization();
  } else {
    audioElement.value.play();
    isPlaying.value = true;
    startPlaybackVisualization();
  }
}

function seekAudio(e: MouseEvent) {
  if (!audioElement.value) return;
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const percent = (e.clientX - rect.left) / rect.width;
  audioElement.value.currentTime = percent * audioElement.value.duration;
}

function discardRecording() {
  cleanup();
  showPreview.value = false;
  audioBlob.value = null;
  audioUrl.value = null;
  recordingTime.value = 0;
  uploadedFileDuration.value = 0;
  waveformBars.value = Array(40).fill(12);
}

async function saveRecording() {
  if (!audioBlob.value) return;

  isProcessing.value = true;
  processingTitle.value = 'Saving';
  showPreview.value = false;

  const duration = uploadedFileDuration.value || recordingTime.value;
  const mimeType = audioBlob.value.type || 'audio/webm';

  try {
    let recording;

    if (Capacitor.isNativePlatform()) {
      // Android/iOS: R2 presigned PUT is blocked by Android WebView/carrier proxies.
      // Send base64 through backend which uploads to R2 server-side.
      processingStatus.value = 'Processing audio...';
      const base64 = await blobToBase64(audioBlob.value);
      const sizeMB = ((base64.length * 0.75) / 1024 / 1024).toFixed(1);
      console.log(`[Upload] Native — base64 ~${sizeMB} MB → backend`);
      recording = await recordingsStore.createRecording({
        audioData: base64,
        duration,
        mimeType,
        autoTranscribe: false,
      });
    } else {
      // Web: direct R2 presigned URL upload
      uploadProgress.value = 0;
      processingStatus.value = 'Uploading audio... 0%';
      const { uploadUrl, key } = await api.getUploadUrl(mimeType);
      await api.uploadToR2(uploadUrl, audioBlob.value, mimeType, (pct) => {
        uploadProgress.value = pct;
        processingStatus.value = `Uploading audio... ${pct}%`;
      });
      processingStatus.value = 'Saving...';
      recording = await recordingsStore.createRecording({
        audioKey: key,
        duration,
        mimeType,
        autoTranscribe: false,
      });
    }

    if (recording) {
      router.replace(`/recording/${recording._id}`);
    } else {
      error.value = recordingsStore.error || 'Failed to save';
      isProcessing.value = false;
      showPreview.value = true;
    }
  } catch (err: any) {
    error.value = err.message || 'Processing failed';
    isProcessing.value = false;
    showPreview.value = true;
  }
}

function triggerFileUpload() {
  fileInputRef.value?.click();
}

async function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a', 'audio/ogg', 'audio/webm', 'audio/flac', 'audio/aac', 'audio/mp3'];
  if (!file.type.startsWith('audio/') && !allowedTypes.includes(file.type)) {
    error.value = 'Please select a valid audio file';
    input.value = '';
    return;
  }

  const MAX_FILE_SIZE = 100 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    error.value = 'File size must be less than 100MB';
    input.value = '';
    return;
  }

  try {
    error.value = '';
    audioBlob.value = file;
    audioUrl.value = URL.createObjectURL(file);

    await new Promise<void>((resolve, reject) => {
      const tempAudio = new Audio(audioUrl.value!);
      tempAudio.onloadedmetadata = () => {
        if (isFinite(tempAudio.duration)) {
          uploadedFileDuration.value = Math.floor(tempAudio.duration);
          recordingTime.value = Math.floor(tempAudio.duration);
          resolve();
        } else {
          tempAudio.currentTime = 1e10;
          tempAudio.ontimeupdate = () => {
            tempAudio.ontimeupdate = null;
            uploadedFileDuration.value = Math.floor(tempAudio.duration);
            recordingTime.value = Math.floor(tempAudio.duration);
            tempAudio.currentTime = 0;
            resolve();
          };
        }
      };
      tempAudio.onerror = () => reject(new Error('Could not read audio file'));
    });

    audioElement.value = new Audio(audioUrl.value);
    audioElement.value.onloadedmetadata = () => {
      playbackTotalTime.value = formatTime(audioElement.value!.duration);
    };
    audioElement.value.ontimeupdate = () => {
      playbackProgress.value = (audioElement.value!.currentTime / audioElement.value!.duration) * 100;
      playbackCurrentTime.value = formatTime(audioElement.value!.currentTime);
    };
    audioElement.value.onended = () => {
      isPlaying.value = false;
      playbackProgress.value = 0;
      playbackCurrentTime.value = '0:00';
      stopVisualization();
    };

    showPreview.value = true;
  } catch (err: any) {
    error.value = err.message || 'Failed to load audio file';
  }

  input.value = '';
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function startTimer() {
  timerInterval.value = window.setInterval(() => recordingTime.value++, 1000);
}

function stopTimer() {
  if (timerInterval.value) {
    clearInterval(timerInterval.value);
    timerInterval.value = null;
  }
}

function startVisualization() {
  if (!analyser.value) return;
  const dataArray = new Uint8Array(analyser.value.frequencyBinCount);

  function animate() {
    if (!analyser.value) return;
    analyser.value.getByteFrequencyData(dataArray);
    const bars: number[] = [];
    for (let i = 0; i < 40; i++) {
      const val = dataArray[i] || 0;
      bars.push(Math.max(12, (val / 255) * 100));
    }
    waveformBars.value = bars;
    animationFrame.value = requestAnimationFrame(animate);
  }
  animate();
}

function startPlaybackVisualization() {
  function animate() {
    const bars: number[] = [];
    const t = Date.now() / 100;
    for (let i = 0; i < 40; i++) {
      const h = isPlaying.value ? Math.max(12, 35 + Math.sin(t + i * 0.3) * 25 + Math.sin(t * 1.5 + i * 0.5) * 15) : 12;
      bars.push(h);
    }
    waveformBars.value = bars;
    if (isPlaying.value) animationFrame.value = requestAnimationFrame(animate);
  }
  animate();
}

function stopVisualization() {
  if (animationFrame.value) {
    cancelAnimationFrame(animationFrame.value);
    animationFrame.value = null;
  }
  waveformBars.value = Array(40).fill(12);
}
</script>

<style scoped>
.record-container {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  background: var(--app-bg);
  padding: env(safe-area-inset-top) 0 env(safe-area-inset-bottom);
}

/* Header */
.record-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
}

.header-btn {
  width: 44px;
  height: 44px;
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
.header-btn-spacer { width: 44px; }

.header-center {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--app-text-muted);
  transition: background var(--transition-fast);
}

.header-dot.active {
  background: var(--ion-color-danger);
  animation: dot-blink 1s ease-in-out infinite;
}

@keyframes dot-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.header-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--app-text);
}

/* Main */
.record-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  position: relative;
}

/* Timer Ring */
.timer-ring {
  position: relative;
  width: min(220px, 55vw);
  height: min(220px, 55vw);
  margin-bottom: 24px;
}

.timer-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring-bg {
  fill: none;
  stroke: var(--app-border);
  stroke-width: 4;
}

.ring-progress {
  fill: none;
  stroke: var(--ion-color-danger);
  stroke-width: 4;
  stroke-linecap: round;
  stroke-dasharray: 565.48;
  transition: stroke-dashoffset 1s linear;
}

.timer-inner {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.timer-display {
  font-size: 52px;
  font-weight: 200;
  font-variant-numeric: tabular-nums;
  color: var(--app-text);
  letter-spacing: 3px;
  line-height: 1;
}

.timer-label {
  font-size: 13px;
  color: var(--app-text-muted);
  margin: 10px 0 0;
  font-weight: 500;
}

/* Waveform */
.waveform-container {
  width: 100%;
  max-width: 320px;
  opacity: 0.25;
  transition: opacity var(--transition-base);
}

.waveform-container.active {
  opacity: 1;
}

.waveform {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2.5px;
  height: 72px;
}

.bar {
  width: 3.5px;
  background: var(--app-gradient);
  border-radius: 2px;
  transition: height 0.06s ease-out;
  min-height: 4px;
}

/* Preview Player */
.preview-player {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 20px;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--radius-2xl);
  width: 100%;
  max-width: 320px;
  margin-top: 28px;
  box-shadow: var(--shadow-md);
}

.player-play-btn {
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

.player-play-btn:active { transform: scale(0.93); }
.player-play-btn ion-icon { font-size: 22px; }

.player-track { flex: 1; }

.track-bar {
  position: relative;
  height: 6px;
  background: var(--app-border);
  border-radius: 3px;
  cursor: pointer;
  margin-bottom: 10px;
}

.track-fill {
  height: 100%;
  background: var(--app-gradient);
  border-radius: 3px;
  transition: width 0.1s;
}

.track-thumb {
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

.track-times {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--app-text-muted);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

/* Processing */
.processing-overlay {
  position: absolute;
  inset: 0;
  background: var(--app-bg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.processing-spinner {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.processing-spinner ion-spinner { width: 48px; height: 48px; }
.processing-overlay h3 { font-size: 22px; font-weight: 700; color: var(--app-text); margin: 0; }
.processing-overlay p { font-size: 15px; color: var(--app-text-secondary); margin: 0; }

.upload-progress-bar {
  width: 220px;
  height: 6px;
  background: var(--app-border, #e0e0e0);
  border-radius: 3px;
  overflow: hidden;
}
.upload-progress-fill {
  height: 100%;
  background: var(--ion-color-primary, #6c63ff);
  border-radius: 3px;
  transition: width 0.2s ease;
}

.processing-dots {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.processing-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--app-primary);
  animation: bounce-dot 1.4s ease-in-out infinite;
}

.processing-dots span:nth-child(2) { animation-delay: 0.2s; }
.processing-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce-dot {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

/* Footer */
.record-footer {
  padding: 20px 24px;
  padding-bottom: calc(20px + env(safe-area-inset-bottom));
}

.controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.record-btn-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.record-btn {
  position: relative;
  z-index: 2;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: none;
  background: var(--app-gradient);
  cursor: pointer;
  box-shadow: var(--shadow-primary-lg);
  transition: all var(--transition-fast);
}

.record-btn:active { transform: scale(0.93); }

.record-btn.recording {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  box-shadow: 0 8px 32px rgba(239, 68, 68, 0.35);
}

.btn-inner {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.btn-inner ion-icon { font-size: 34px; }
.stop-icon { width: 24px; height: 24px; background: white; border-radius: 6px; }

.pulse-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(239, 68, 68, 0.4);
  animation: pulse-expand 2s ease-out infinite;
  z-index: 1;
}

.pulse-ring-2 {
  animation-delay: 1s;
}

@keyframes pulse-expand {
  0% { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(1.6); opacity: 0; }
}

.hint {
  font-size: 14px;
  color: var(--app-text-muted);
  margin: 0;
  font-weight: 500;
}

.lang-notice {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  border: 1px solid var(--app-border);
  border-radius: var(--radius-sm);
  padding: 8px 12px;
  font-size: 11px;
  color: var(--app-text-muted);
  margin: 6px 18px 0;
  opacity: 0.6;
  letter-spacing: 0.2px;
}

/* Upload */
.upload-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 260px;
  margin-top: 8px;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: var(--app-border);
}

.divider-text {
  font-size: 13px;
  color: var(--app-text-muted);
  font-weight: 500;
}

.upload-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 28px;
  border-radius: var(--radius-xl);
  border: 1.5px dashed var(--app-border);
  background: var(--app-surface);
  color: var(--app-text-secondary);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  width: 100%;
  max-width: 260px;
}

.upload-btn:active {
  transform: scale(0.97);
  border-color: var(--app-primary);
  color: var(--app-primary);
}

.upload-btn ion-icon {
  font-size: 20px;
}

.file-input-hidden {
  display: none;
}

/* Preview Controls */
.preview-controls {
  display: flex;
  gap: 16px;
}

.ctrl-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 18px 16px;
  border-radius: var(--radius-xl);
  border: none;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.ctrl-btn:active { transform: scale(0.97); }

.ctrl-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ctrl-icon ion-icon { font-size: 22px; }

.ctrl-btn.discard {
  background: rgba(239, 68, 68, 0.08);
  color: var(--ion-color-danger);
}

.ctrl-btn.discard .ctrl-icon {
  background: rgba(239, 68, 68, 0.12);
}

.ctrl-btn.discard .ctrl-icon ion-icon { color: var(--ion-color-danger); }

.ctrl-btn.save {
  background: var(--app-primary-ultra-light);
  color: var(--app-primary);
}

.ctrl-btn.save .ctrl-icon {
  background: var(--app-gradient);
}

.ctrl-btn.save .ctrl-icon ion-icon { color: white; }

/* Error Toast */
.error-toast {
  position: fixed;
  bottom: calc(120px + env(safe-area-inset-bottom));
  left: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  background: var(--ion-color-danger);
  color: white;
  border-radius: var(--radius-xl);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  z-index: 100;
  box-shadow: 0 8px 24px rgba(239, 68, 68, 0.3);
}

.error-toast ion-icon { font-size: 20px; flex-shrink: 0; }
.error-toast span { flex: 1; }
.toast-close { opacity: 0.7; }

.toast-enter-active { animation: slide-up-fade 0.3s ease-out; }
.toast-leave-active { animation: slide-up-fade 0.3s ease-in reverse; }

@keyframes slide-up-fade {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Compact layout for short screens */
@media (max-height: 680px) {
  .timer-ring {
    width: min(160px, 45vw);
    height: min(160px, 45vw);
    margin-bottom: 12px;
  }
  .record-main {
    padding: 12px 24px;
  }
  .waveform-container {
    height: 40px;
    margin-bottom: 8px;
  }
  .record-footer {
    padding: 12px 24px;
    padding-bottom: calc(12px + env(safe-area-inset-bottom));
  }
  .controls {
    gap: 10px;
  }
}
</style>
