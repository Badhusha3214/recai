<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="profile-page">
        <!-- Header -->
        <header class="page-header">
          <button class="back-btn" @click="router.back()">
            <ion-icon :icon="chevronBackOutline"></ion-icon>
          </button>
          <h1>Profile</h1>
          <div style="width: 42px;"></div>
        </header>

        <!-- Profile Hero -->
        <div class="profile-hero">
          <!-- <div class="hero-bg-pattern"></div> -->
          <div class="avatar-wrapper">
            <div class="avatar-ring">
              <div class="avatar-large">
                <span>{{ userInitials }}</span>
              </div>
            </div>
          </div>
          <h2>{{ user?.name || 'User' }}</h2>
          <p class="user-email">{{ user?.email || '' }}</p>
        </div>

        <!-- Stats Row -->
        <div class="stats-row">
          <div class="stat-pill">
            <span class="pill-value">{{ totalRecordings }}</span>
            <span class="pill-label">Recordings</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-pill">
            <span class="pill-value">{{ totalTranscribed }}</span>
            <span class="pill-label">Transcribed</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-pill">
            <span class="pill-value">{{ totalMinutes }}</span>
            <span class="pill-label">Minutes</span>
          </div>
        </div>

        <!-- Settings Sections -->
        <div class="settings-group">
          <h3 class="group-label">Account</h3>
          <div class="settings-card">
            <button class="setting-item" @click="showEditProfile = true">
              <div class="setting-icon" style="background: var(--app-primary-ultra-light);">
                <ion-icon :icon="personOutline" style="color: var(--app-primary);"></ion-icon>
              </div>
              <div class="setting-body">
                <span class="setting-title">Edit Profile</span>
                <span class="setting-desc">Change your name</span>
              </div>
              <ion-icon :icon="chevronForwardOutline" class="setting-chevron"></ion-icon>
            </button>

            <!-- <button class="setting-item" @click="showStorage = true">
              <div class="setting-icon" style="background: rgba(99, 102, 241, 0.08);">
                <ion-icon :icon="cloudOutline" style="color: var(--ion-color-tertiary);"></ion-icon>
              </div>
              <div class="setting-body">
                <span class="setting-title">Storage</span>
                <span class="setting-desc">{{ storageUsed }} used</span>
              </div>
              <ion-icon :icon="chevronForwardOutline" class="setting-chevron"></ion-icon>
            </button> -->
          </div>
        </div>

        <div class="settings-group">
          <h3 class="group-label">Preferences</h3>
          <div class="settings-card">
            <button class="setting-item" @click="toggleTheme">
              <div class="setting-icon" style="background: rgba(245, 158, 11, 0.08);">
                <ion-icon :icon="isDark ? moonOutline : sunnyOutline" style="color: var(--ion-color-warning);"></ion-icon>
              </div>
              <div class="setting-body">
                <span class="setting-title">Theme</span>
                <span class="setting-desc">{{ isDark ? 'Dark mode' : 'Light mode' }}</span>
              </div>
              <div class="theme-toggle" :class="{ dark: isDark }">
                <div class="toggle-thumb"></div>
              </div>
            </button>

            <div class="setting-item">
              <div class="setting-icon" style="background: rgba(239, 68, 68, 0.08);">
                <ion-icon :icon="notificationsOutline" style="color: var(--ion-color-danger);"></ion-icon>
              </div>
              <div class="setting-body">
                <span class="setting-title">Notifications</span>
                <span class="setting-desc">Push alerts</span>
              </div>
              <ion-toggle :checked="notifications" @ionChange="notifications = $event.detail.checked" mode="ios"></ion-toggle>
            </div>
          </div>
        </div>

        <div class="settings-group">
          <h3 class="group-label">Support</h3>
          <div class="settings-card">
            <button class="setting-item" @click="openHelp">
              <div class="setting-icon" style="background: rgba(34, 197, 94, 0.08);">
                <ion-icon :icon="helpCircleOutline" style="color: var(--ion-color-success);"></ion-icon>
              </div>
              <div class="setting-body">
                <span class="setting-title">Help & Support</span>
                <span class="setting-desc">Get assistance</span>
              </div>
              <ion-icon :icon="chevronForwardOutline" class="setting-chevron"></ion-icon>
            </button>

            <button class="setting-item" @click="showAbout = true">
              <div class="setting-icon" style="background: var(--app-primary-ultra-light);">
                <ion-icon :icon="informationCircleOutline" style="color: var(--app-primary);"></ion-icon>
              </div>
              <div class="setting-body">
                <span class="setting-title">About</span>
                <span class="setting-desc">Version 0.1.0</span>
              </div>
              <ion-icon :icon="chevronForwardOutline" class="setting-chevron"></ion-icon>
            </button>
          </div>
        </div>

        <!-- Logout -->
        <button class="logout-btn" @click="showLogout = true">
          <ion-icon :icon="logOutOutline"></ion-icon>
          <span>Log Out</span>
        </button>

        <!-- Version -->
        <p class="version-text">Echobit v0.1.0</p>
      </div>

      <!-- Edit Profile Modal -->
      <ion-modal :is-open="showEditProfile" @didDismiss="showEditProfile = false">
        <ion-content class="ion-padding">
          <div class="modal-content">
            <div class="modal-header">
              <h2>Edit Profile</h2>
              <button class="modal-close" @click="showEditProfile = false">
                <ion-icon :icon="closeOutline"></ion-icon>
              </button>
            </div>

            <div class="form-group">
              <label>Name</label>
              <div class="form-field">
                <ion-icon :icon="personOutline" class="form-field-icon"></ion-icon>
                <input type="text" v-model="editName" placeholder="Your name">
              </div>
            </div>

            <div class="form-group">
              <label>Email</label>
              <div class="form-field disabled">
                <ion-icon :icon="mailOutline" class="form-field-icon"></ion-icon>
                <input type="email" v-model="editEmail" placeholder="Your email" disabled>
              </div>
              <small>Email cannot be changed</small>
            </div>

            <button class="save-btn" @click="saveProfile" :disabled="saving">
              <ion-spinner v-if="saving" name="crescent"></ion-spinner>
              <span v-else>Save Changes</span>
            </button>
          </div>
        </ion-content>
      </ion-modal>

      <!-- Storage Modal -->
      <ion-modal :is-open="showStorage" @didDismiss="showStorage = false">
        <ion-content class="ion-padding">
          <div class="modal-content">
            <div class="modal-header">
              <h2>Storage</h2>
              <button class="modal-close" @click="showStorage = false">
                <ion-icon :icon="closeOutline"></ion-icon>
              </button>
            </div>

            <div class="storage-visual">
              <div class="storage-ring">
                <svg viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" class="ring-track" />
                  <circle cx="60" cy="60" r="50" class="ring-value" :style="{ strokeDashoffset: storageRingOffset }" />
                </svg>
                <div class="storage-center">
                  <span class="storage-pct">{{ storagePercent }}%</span>
                  <span class="storage-label">used</span>
                </div>
              </div>
              <p class="storage-text">{{ storageUsed }} of 5 GB used</p>
            </div>

            <div class="storage-list">
              <div class="storage-row">
                <div class="storage-row-icon" style="background: var(--app-primary-ultra-light);">
                  <ion-icon :icon="micOutline" style="color: var(--app-primary);"></ion-icon>
                </div>
                <span class="storage-row-label">Audio Files</span>
                <span class="storage-row-size">{{ audioSize }}</span>
              </div>
              <div class="storage-row">
                <div class="storage-row-icon" style="background: rgba(99, 102, 241, 0.08);">
                  <ion-icon :icon="documentTextOutline" style="color: var(--ion-color-tertiary);"></ion-icon>
                </div>
                <span class="storage-row-label">Transcripts</span>
                <span class="storage-row-size">{{ textSize }}</span>
              </div>
            </div>
          </div>
        </ion-content>
      </ion-modal>

      <!-- About Modal -->
      <ion-modal :is-open="showAbout" @didDismiss="showAbout = false">
        <ion-content class="ion-padding">
          <div class="modal-content">
            <div class="modal-header">
              <h2>About</h2>
              <button class="modal-close" @click="showAbout = false">
                <ion-icon :icon="closeOutline"></ion-icon>
              </button>
            </div>

            <div class="about-hero">
              <div class="about-logo">
                <img src="/logo.png" alt="App Logo" style="width: 58px; height: 58px; object-fit: contain;" />
              </div>
              <h3>Echobit</h3>
              <p class="about-version">Version 0.1.0</p>
              <p class="about-desc">Your intelligent voice recorder with AI-powered transcription, summaries, and meeting minutes.</p>
              <p class="about-copy">&copy; 2024 Echobit. All rights reserved.</p>
            </div>
          </div>
        </ion-content>
      </ion-modal>

      <!-- Logout Alert -->
      <ion-alert
        :is-open="showLogout"
        header="Log Out?"
        message="Are you sure you want to log out?"
        :buttons="logoutButtons"
        @didDismiss="showLogout = false"
      ></ion-alert>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonContent, IonIcon, IonToggle, IonModal, IonAlert, IonSpinner, toastController } from '@ionic/vue';
import {
  chevronBackOutline, chevronForwardOutline, personOutline, cloudOutline,
  sunnyOutline, moonOutline, notificationsOutline, helpCircleOutline,
  informationCircleOutline, logOutOutline, closeOutline, micOutline,
  documentTextOutline, mailOutline
} from 'ionicons/icons';
import { useAuthStore } from '@/stores/auth';
import { useRecordingsStore } from '@/stores/recordings';

const router = useRouter();
const authStore = useAuthStore();
const recordingsStore = useRecordingsStore();

const showEditProfile = ref(false);
const showStorage = ref(false);
const showAbout = ref(false);
const showLogout = ref(false);
const notifications = ref(true);
const isDark = ref(false);
const saving = ref(false);

const editName = ref('');
const editEmail = ref('');

const user = computed(() => authStore.user);

const userInitials = computed(() => {
  const name = user.value?.name || 'User';
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
});

const totalRecordings = computed(() => recordingsStore.recordings.length);
const totalTranscribed = computed(() => recordingsStore.recordings.filter(r => r.transcript).length);
const totalMinutes = computed(() => {
  const secs = recordingsStore.recordings.reduce((sum, r) => sum + (r.duration || 0), 0);
  return Math.round(secs / 60);
});

const storageUsed = computed(() => '1.2 GB');
const storagePercent = computed(() => 24);
const audioSize = computed(() => '1.1 GB');
const textSize = computed(() => '100 MB');

const storageRingOffset = computed(() => {
  const circumference = 2 * Math.PI * 50;
  return circumference * (1 - storagePercent.value / 100);
});

const logoutButtons = [
  { text: 'Cancel', role: 'cancel' },
  {
    text: 'Log Out',
    role: 'destructive',
    handler: async () => {
      await authStore.logout();
      router.replace('/login');
    }
  }
];

onMounted(() => {
  recordingsStore.fetchRecordings();
  // Reflect actual dark state: manual override OR system preference
  isDark.value = document.body.classList.contains('dark') ||
    (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  if (user.value) {
    editName.value = user.value.name;
    editEmail.value = user.value.email;
  }
});

function toggleTheme() {
  isDark.value = !isDark.value;
  if (isDark.value) {
    document.body.classList.add('dark');
    document.body.classList.remove('light');
  } else {
    document.body.classList.remove('dark');
    document.body.classList.add('light'); // explicitly override system dark preference
  }
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
}

async function saveProfile() {
  saving.value = true;
  try {
    await authStore.updateProfile({ name: editName.value });
    const toast = await toastController.create({ message: 'Profile updated', duration: 1500, position: 'bottom', color: 'success' });
    await toast.present();
    showEditProfile.value = false;
  } catch {
    const toast = await toastController.create({ message: 'Failed to update', duration: 1500, position: 'bottom', color: 'danger' });
    await toast.present();
  } finally {
    saving.value = false;
  }
}

function openHelp() {
  window.open('mailto:no.reply.echobit@gmail.com', '_blank');
}
</script>

<style scoped>
.profile-page {
  padding: calc(20px + env(safe-area-inset-top, 0px)) 20px 40px;
}

/* Header */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.page-header h1 {
  font-size: 18px;
  font-weight: 700;
  color: var(--app-text);
  margin: 0;
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

/* Profile Hero */
.profile-hero {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 24px 24px;
  margin-bottom: 4px;
  overflow: hidden;
}

.hero-bg-pattern {
  position: absolute;
  top: 0;
  left: -20px;
  right: -20px;
  height: 120px;
  background: var(--app-gradient-subtle);
  border-radius: 0 0 var(--radius-2xl) var(--radius-2xl);
}

.avatar-wrapper {
  position: relative;
  z-index: 1;
  margin-bottom: 16px;
}

.avatar-ring {
  padding: 4px;
  border-radius: 50%;
  background: var(--app-gradient);
  box-shadow: var(--shadow-primary);
}

.avatar-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--app-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4px solid var(--app-bg);
}

.avatar-large span {
  font-size: 28px;
  font-weight: 800;
  color: white;
}

.profile-hero h2 {
  position: relative;
  z-index: 1;
  font-size: 22px;
  font-weight: 800;
  color: var(--app-text);
  margin: 0 0 4px;
}

.user-email {
  position: relative;
  z-index: 1;
  font-size: 14px;
  color: var(--app-text-muted);
  margin: 0;
}

/* Stats Row */
.stats-row {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--radius-2xl);
  margin-bottom: 24px;
  box-shadow: var(--shadow-xs);
}

.stat-pill {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.pill-value {
  font-size: 24px;
  font-weight: 800;
  color: var(--app-primary);
  line-height: 1;
}

.pill-label {
  font-size: 11px;
  color: var(--app-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  font-weight: 600;
}

.stat-divider {
  width: 1px;
  height: 32px;
  background: var(--app-border);
}

/* Settings Group */
.settings-group {
  margin-bottom: 20px;
}

.group-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--app-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin: 0 0 10px 4px;
}

.settings-card {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--radius-2xl);
  overflow: hidden;
  box-shadow: var(--shadow-xs);
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.setting-item:not(:last-child) {
  border-bottom: 1px solid var(--app-border);
}

.setting-item:active {
  background: var(--app-surface-hover);
}

.setting-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.setting-icon ion-icon { font-size: 20px; }

.setting-body {
  flex: 1;
  min-width: 0;
}

.setting-title {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: var(--app-text);
}

.setting-desc {
  display: block;
  font-size: 12px;
  color: var(--app-text-muted);
  margin-top: 2px;
}

.setting-chevron {
  font-size: 18px;
  color: var(--app-text-muted);
  flex-shrink: 0;
}

/* Theme Toggle */
.theme-toggle {
  width: 48px;
  height: 28px;
  border-radius: 14px;
  background: var(--app-border);
  position: relative;
  cursor: pointer;
  transition: background var(--transition-base);
  flex-shrink: 0;
}

.theme-toggle.dark {
  background: var(--app-primary);
}

.toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: white;
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition-base);
}

.theme-toggle.dark .toggle-thumb {
  transform: translateX(20px);
}

.setting-item ion-toggle {
  --background: var(--app-border);
  --background-checked: var(--app-primary);
}

/* Logout */
.logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px;
  background: rgba(239, 68, 68, 0.06);
  border: 1px solid rgba(239, 68, 68, 0.12);
  border-radius: var(--radius-2xl);
  color: var(--ion-color-danger);
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  margin-bottom: 20px;
  transition: all var(--transition-fast);
}

.logout-btn:active {
  transform: scale(0.98);
  background: rgba(239, 68, 68, 0.1);
}

.logout-btn ion-icon { font-size: 20px; }

.version-text {
  text-align: center;
  font-size: 12px;
  color: var(--app-text-muted);
  margin: 0;
}

/* Modal Styles */
ion-modal { --background: var(--app-bg); }

.modal-content {
  max-width: 400px;
  margin: 0 auto;
  padding-top: 20px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
}

.modal-header h2 {
  font-size: 22px;
  font-weight: 800;
  color: var(--app-text);
  margin: 0;
}

.modal-close {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1px solid var(--app-border);
  background: var(--app-surface);
  color: var(--app-text);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.modal-close ion-icon { font-size: 20px; }

/* Form */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--app-text-secondary);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-field {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  height: 52px;
  background: var(--app-surface);
  border: 2px solid transparent;
  border-radius: var(--radius-lg);
  transition: all var(--transition-fast);
}

.form-field:focus-within {
  border-color: var(--app-primary);
  box-shadow: 0 0 0 4px var(--app-primary-ultra-light);
}

.form-field.disabled {
  opacity: 0.6;
}

.form-field-icon {
  font-size: 20px;
  color: var(--app-text-muted);
  flex-shrink: 0;
}

.form-field input {
  flex: 1;
  border: none;
  background: none;
  font-size: 15px;
  color: var(--app-text);
  outline: none;
}

.form-field input::placeholder { color: var(--app-text-muted); }
.form-field input:disabled { color: var(--app-text-muted); }

.form-group small {
  display: block;
  font-size: 12px;
  color: var(--app-text-muted);
  margin-top: 6px;
}

.save-btn {
  width: 100%;
  height: 54px;
  background: var(--app-gradient);
  border: none;
  border-radius: var(--radius-lg);
  color: white;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-primary);
  transition: all var(--transition-fast);
}

.save-btn:active:not(:disabled) { transform: scale(0.98); }
.save-btn:disabled { opacity: 0.6; }
.save-btn ion-spinner { width: 22px; height: 22px; color: white; }

/* Storage */
.storage-visual {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 28px;
}

.storage-ring {
  position: relative;
  width: 120px;
  height: 120px;
  margin-bottom: 16px;
}

.storage-ring svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring-track {
  fill: none;
  stroke: var(--app-border);
  stroke-width: 8;
}

.ring-value {
  fill: none;
  stroke: url(#gradient) var(--app-primary);
  stroke-width: 8;
  stroke-linecap: round;
  stroke-dasharray: 314.16;
  transition: stroke-dashoffset 0.8s ease-out;
}

.storage-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.storage-pct {
  font-size: 24px;
  font-weight: 800;
  color: var(--app-primary);
  line-height: 1;
}

.storage-label {
  font-size: 11px;
  color: var(--app-text-muted);
  text-transform: uppercase;
  font-weight: 600;
}

.storage-text {
  font-size: 14px;
  color: var(--app-text-secondary);
  margin: 0;
}

.storage-list {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.storage-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
}

.storage-row:not(:last-child) {
  border-bottom: 1px solid var(--app-border);
}

.storage-row-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.storage-row-icon ion-icon { font-size: 18px; }
.storage-row-label { flex: 1; font-size: 15px; color: var(--app-text); font-weight: 500; }
.storage-row-size { font-size: 14px; color: var(--app-text-muted); font-weight: 600; }

/* About */
.about-hero {
  text-align: center;
  padding: 24px 0;
}

.about-logo {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  background: var(--app-gradient);
  border-radius: var(--radius-2xl);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-primary-lg);
}

.about-logo ion-icon { font-size: 40px; color: white; }

.about-hero h3 {
  font-size: 26px;
  font-weight: 800;
  color: var(--app-text);
  margin: 0 0 4px;
}

.about-version {
  font-size: 14px;
  color: var(--app-text-muted);
  margin: 0 0 24px;
}

.about-desc {
  font-size: 15px;
  color: var(--app-text-secondary);
  line-height: 1.6;
  margin: 0 0 24px;
}

.about-copy {
  font-size: 12px;
  color: var(--app-text-muted);
  margin: 0;
}
</style>
