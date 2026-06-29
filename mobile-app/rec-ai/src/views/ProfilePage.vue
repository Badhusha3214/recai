<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="profile-page">
        <!-- Header -->
        <header class="page-header">
          <h1>Profile</h1>
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

        <!-- Subscription Status / Upgrade Banner -->
        <div v-if="isPaid" class="sub-card">
          <div class="sub-card-header">
            <div class="sub-badge">
              <ion-icon :icon="flashOutline"></ion-icon>
              <span>{{ planLabel }} Plan</span>
            </div>
            <span class="sub-status-dot"></span>
          </div>
          <div class="sub-details">
            <div class="sub-detail-row">
              <span class="sub-detail-label">Billing</span>
              <span class="sub-detail-value">{{ billingCycleLabel }}</span>
            </div>
            <div class="sub-detail-row">
              <span class="sub-detail-label">Expires</span>
              <span class="sub-detail-value">{{ expiryDateLabel }}</span>
            </div>
            <div class="sub-detail-row">
              <span class="sub-detail-label">Days left</span>
              <span class="sub-detail-value sub-days-left">{{ daysLeft }} days</span>
            </div>
          </div>
          <button class="sub-manage-btn" @click="subscribe">Manage Plan</button>
        </div>

        <div v-else class="upgrade-banner" @click="subscribe">
          <div class="upgrade-icon">
            <ion-icon :icon="flashOutline"></ion-icon>
          </div>
          <div class="upgrade-body">
            <p class="upgrade-title">Upgrade to Pro</p>
            <p class="upgrade-sub">Unlimited recordings · All languages · PDF export</p>
          </div>
          <ion-icon :icon="chevronForwardOutline" class="upgrade-chevron"></ion-icon>
        </div>

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
          <h3 class="group-label">AI & Recording</h3>
          <div class="settings-card">
            <div class="setting-item">
              <div class="setting-icon" style="background: rgba(16, 185, 129, 0.08);">
                <ion-icon :icon="saveOutline" style="color: var(--app-primary);"></ion-icon>
              </div>
              <div class="setting-body">
                <span class="setting-title">Auto-save & Transcribe</span>
                <span class="setting-desc">Transcribe automatically after recording</span>
              </div>
              <ion-toggle :checked="autoSave" @ionChange="onAutoSaveChange($event.detail.checked)" mode="ios"></ion-toggle>
            </div>

            <div class="setting-item">
              <div class="setting-icon" :style="cloudSyncEnabled ? 'background: rgba(16, 185, 129, 0.08);' : 'background: rgba(99, 102, 241, 0.08);'">
                <ion-icon :icon="cloudSyncEnabled ? cloudUploadOutline : lockClosedOutline" :style="cloudSyncEnabled ? 'color: var(--app-primary);' : 'color: var(--ion-color-tertiary);'"></ion-icon>
              </div>
              <div class="setting-body">
                <span class="setting-title">Cloud Sync</span>
                <span class="setting-desc">{{ cloudSyncEnabled ? 'Audio uploaded to cloud' : 'Audio saved on device only' }}</span>
              </div>
              <ion-toggle :checked="cloudSyncEnabled" @ionChange="onCloudSyncChange($event.detail.checked)" mode="ios"></ion-toggle>
            </div>
            <div v-if="!cloudSyncEnabled" class="cloud-sync-warning">
              <ion-icon :icon="warningOutline" class="warning-icon"></ion-icon>
              <span>Audio files are stored privately on this device and cannot be recovered if the app is uninstalled.</span>
            </div>

            <div class="setting-item" v-if="isIndianUser">
              <div class="setting-icon" style="background: rgba(99, 102, 241, 0.08);">
                <ion-icon :icon="languageOutline" style="color: var(--ion-color-tertiary);"></ion-icon>
              </div>
              <div class="setting-body">
                <span class="setting-title">Summary Language</span>
                <span class="setting-desc">{{ summaryLanguageLabel }}</span>
              </div>
              <select v-model="summaryLanguage" @change="onSummaryLangChange" class="lang-select-inline">
                <option value="">English</option>
                <option value="hindi">Hindi (हिन्दी)</option>
                <option value="tamil">Tamil (தமிழ்)</option>
                <option value="telugu">Telugu (తెలుగు)</option>
                <option value="bengali">Bengali (বাংলা)</option>
                <option value="kannada">Kannada (ಕನ್ನಡ)</option>
                <option value="malayalam">Malayalam (മലയാളം)</option>
                <option value="marathi">Marathi (मराठी)</option>
                <option value="gujarati">Gujarati (ગુજરાતી)</option>
                <option value="punjabi">Punjabi (ਪੰਜਾਬੀ)</option>
                <option value="odia">Odia (ଓଡ଼ିଆ)</option>
              </select>
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
                <span class="setting-desc">Version {{ appVersion }} ({{ appBuild }})</span>
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
        <p class="version-text">Echobits v{{ appVersion }}</p>
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
              <h3>Echobits</h3>
              <p class="about-version">Version {{ appVersion }} (build {{ appBuild }})</p>
              <p class="about-desc">Your intelligent voice recorder with AI-powered transcription, summaries, and meeting minutes.</p>
              <p class="about-copy">&copy; 2024 Echobits. All rights reserved.</p>
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
import { ref, computed, onMounted, onBeforeMount } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonContent, IonIcon, IonToggle, IonModal, IonAlert, IonSpinner, toastController } from '@ionic/vue';
import {
  chevronBackOutline, chevronForwardOutline, personOutline, cloudOutline,
  sunnyOutline, moonOutline, notificationsOutline, helpCircleOutline,
  informationCircleOutline, logOutOutline, closeOutline, micOutline,
  documentTextOutline, mailOutline, saveOutline, languageOutline, flashOutline,
  cloudUploadOutline, lockClosedOutline, warningOutline
} from 'ionicons/icons';
import { useAuthStore } from '@/stores/auth';
import { useRecordingsStore } from '@/stores/recordings';

const router = useRouter();
const authStore = useAuthStore();
const recordingsStore = useRecordingsStore();

const appVersion = ref('1.3.0');
const appBuild   = ref('9');

onBeforeMount(async () => {
  try {
    const { App: CapApp } = await import('@capacitor/app');
    const info = await CapApp.getInfo();
    appVersion.value = info.version;
    appBuild.value   = info.build;
  } catch { /* web/dev — keep defaults */ }
});

const showEditProfile = ref(false);
const showStorage = ref(false);
const showAbout = ref(false);
const showLogout = ref(false);
const notifications = ref(true);
const isDark = ref(false);
const saving = ref(false);
const autoSave = ref(true);
const cloudSyncEnabled = ref(true);
const summaryLanguage = ref('');

const editName = ref('');
const editEmail = ref('');

const isIndianUser = computed(() => {
  const c = (user.value?.country || '').toLowerCase();
  return c === 'india' || c === 'in';
});

const LANG_LABELS: Record<string, string> = {
  '': 'English', hindi: 'Hindi', tamil: 'Tamil', telugu: 'Telugu',
  bengali: 'Bengali', kannada: 'Kannada', malayalam: 'Malayalam',
  marathi: 'Marathi', gujarati: 'Gujarati', punjabi: 'Punjabi', odia: 'Odia',
};
const summaryLanguageLabel = computed(() => LANG_LABELS[summaryLanguage.value] || 'English');

const user = computed(() => authStore.user);

const isPaid = computed(() => {
  if (!user.value?.plan || user.value.plan === 'free') return false;
  if (!user.value.planExpiresAt) return false;
  return new Date(user.value.planExpiresAt) > new Date();
});

const planLabel = computed(() => {
  const labels: Record<string, string> = {
    free: 'Free', starter: 'Starter', pro: 'Pro', growth: 'Growth', team: 'Team',
  };
  return labels[user.value?.plan || 'free'] || 'Free';
});

const billingCycleLabel = computed(() => {
  const c = user.value?.planBillingCycle;
  if (c === 'monthly') return 'Monthly';
  if (c === 'annual') return 'Annual';
  return '—';
});

const expiryDateLabel = computed(() => {
  if (!user.value?.planExpiresAt) return '—';
  return new Date(user.value.planExpiresAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
});

const daysLeft = computed(() => {
  if (!user.value?.planExpiresAt) return 0;
  const diff = new Date(user.value.planExpiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

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
  isDark.value = document.body.classList.contains('dark') ||
    (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  if (user.value) {
    editName.value = user.value.name;
    editEmail.value = user.value.email;
    autoSave.value = user.value.autoSave !== false;
    cloudSyncEnabled.value = user.value.cloudSync !== false;
    summaryLanguage.value = user.value.summaryLanguage || '';
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

function subscribe() {
  const token = authStore.token;
  const url = `https://echobits.devmorphix.com/pricing?token=${token}`;
  window.open(url, '_blank');
}

async function onAutoSaveChange(val: boolean) {
  autoSave.value = val;
  localStorage.setItem('autoSave', val ? 'true' : 'false');
  await authStore.updateProfile({ autoSave: val });
}

async function onCloudSyncChange(val: boolean) {
  cloudSyncEnabled.value = val;
  await authStore.updateProfile({ cloudSync: val });
}

async function onSummaryLangChange() {
  localStorage.setItem('summaryLanguage', summaryLanguage.value);
  await authStore.updateProfile({ summaryLanguage: summaryLanguage.value });
}

function openHelp() {
  window.open('mailto:no.reply.Echobits@gmail.com', '_blank');
}

function openPricing() {
  router.push('/pricing');
}
</script>

<style scoped>
.profile-page {
  padding: var(--page-top) 20px calc(96px + env(safe-area-inset-bottom, 0px));
}

/* Header */
.page-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.page-header h1 {
  font-size: 22px;
  font-weight: 800;
  color: var(--app-text);
  margin: 0;
}

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

/* Subscription Card */
.sub-card {
  background: var(--app-surface);
  border: 1.5px solid var(--app-primary);
  border-radius: var(--radius-2xl);
  padding: 18px;
  margin-bottom: 24px;
  box-shadow: var(--shadow-primary);
}

.sub-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.sub-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--app-gradient);
  color: white;
  font-size: 13px;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: var(--radius-full);
}

.sub-badge ion-icon { font-size: 14px; }

.sub-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--app-primary);
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.2);
  animation: pulse-dot 2s infinite;
}

@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.2); }
  50%       { box-shadow: 0 0 0 6px rgba(5, 150, 105, 0.08); }
}

.sub-details {
  background: var(--app-bg);
  border-radius: var(--radius-lg);
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
}

.sub-detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sub-detail-label {
  font-size: 12px;
  color: var(--app-text-muted);
  font-weight: 500;
}

.sub-detail-value {
  font-size: 13px;
  color: var(--app-text);
  font-weight: 600;
}

.sub-days-left { color: var(--app-primary); }

.sub-manage-btn {
  width: 100%;
  height: 40px;
  border-radius: var(--radius-full);
  background: var(--app-primary-ultra-light);
  border: 1.5px solid var(--app-primary);
  color: var(--app-primary);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.sub-manage-btn:active { background: var(--app-primary); color: white; }

/* Upgrade Banner */
.upgrade-banner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
  margin-bottom: 24px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: var(--radius-2xl);
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.35);
  cursor: pointer;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.upgrade-banner:active {
  transform: scale(0.97);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
}

.upgrade-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.upgrade-icon ion-icon {
  font-size: 22px;
  color: white;
}

.upgrade-body {
  flex: 1;
  min-width: 0;
}

.upgrade-title {
  font-size: 16px;
  font-weight: 700;
  color: white;
  margin: 0 0 2px;
  line-height: 1.2;
}

.upgrade-sub {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  line-height: 1.3;
}

.upgrade-chevron {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.7);
  flex-shrink: 0;
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

.lang-select-inline {
  background: var(--app-bg);
  border: 1px solid var(--app-border);
  color: var(--app-text);
  border-radius: var(--radius-md);
  padding: 4px 8px;
  font-size: 13px;
  outline: none;
  cursor: pointer;
  max-width: 130px;
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

.cloud-sync-warning {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 4px 0 8px 0;
  padding: 10px 12px;
  background: rgba(251, 191, 36, 0.08);
  border: 1px solid rgba(251, 191, 36, 0.2);
  border-radius: 10px;
  font-size: 12px;
  color: #fbbf24;
  line-height: 1.5;
}

.cloud-sync-warning .warning-icon {
  font-size: 15px;
  flex-shrink: 0;
  margin-top: 1px;
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
