<template>
  <ion-page>
    <ion-content :fullscreen="true" :scroll-y="false">
      <div class="login-page">
        <!-- Animated Background -->
        <div class="bg-decoration">
          <div class="blob blob-1"></div>
          <div class="blob blob-2"></div>
          <div class="blob blob-3"></div>
        </div>

        <div class="login-container">
          <!-- Logo Section -->
          <div class="logo-section">
            <div class="logo-wrapper">
              <div class="logo">
                <img src="/logo.png" alt="App Logo" style="width: 66px; height: 66px; object-fit: contain;" />
              </div>
              <div class="logo-glow"></div>
            </div>
            <h1>Echobit</h1>
            <p class="tagline">Record. Transcribe. Understand.</p>
          </div>

          <!-- Form Card -->
          <div class="form-card">

            <!-- PRIMARY: Google Sign-In -->
            <button class="google-btn-primary" @click="handleGoogleLogin" :disabled="googleLoading || loading">
              <ion-spinner v-if="googleLoading" name="crescent"></ion-spinner>
              <template v-else>
                <svg class="google-icon" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
              </template>
            </button>

            <!-- Divider -->
            <div class="divider">
              <span class="divider-line"></span>
              <span class="divider-text">or use email</span>
              <span class="divider-line"></span>
            </div>

            <!-- SECONDARY: Email/Password -->
            <form @submit.prevent="handleLogin">
              <div class="input-wrapper">
                <div class="input-field" :class="{ focused: emailFocused, error: error && !email }">
                  <ion-icon :icon="mailOutline" class="field-icon"></ion-icon>
                  <input
                    v-model="email"
                    type="email"
                    placeholder="Email address"
                    :disabled="loading || googleLoading"
                    @focus="emailFocused = true"
                    @blur="emailFocused = false"
                    autocomplete="email"
                  />
                </div>
              </div>

              <div class="input-wrapper">
                <div class="input-field" :class="{ focused: passwordFocused, error: error && !password }">
                  <ion-icon :icon="lockClosedOutline" class="field-icon"></ion-icon>
                  <input
                    v-model="password"
                    :type="showPassword ? 'text' : 'password'"
                    placeholder="Password"
                    :disabled="loading || googleLoading"
                    @focus="passwordFocused = true"
                    @blur="passwordFocused = false"
                    autocomplete="current-password"
                  />
                  <button type="button" class="toggle-pw" @click="showPassword = !showPassword" tabindex="-1">
                    <ion-icon :icon="showPassword ? eyeOffOutline : eyeOutline"></ion-icon>
                  </button>
                </div>
              </div>

              <div v-if="error" class="error-banner">
                <ion-icon :icon="alertCircleOutline"></ion-icon>
                <span>{{ error }}</span>
              </div>

              <div class="forgot-row">
                <router-link to="/forgot-password" class="forgot-link">Forgot password?</router-link>
              </div>

              <button type="submit" class="submit-btn" :disabled="loading || googleLoading">
                <ion-spinner v-if="loading" name="crescent"></ion-spinner>
                <template v-else>
                  <span>Sign In with Email</span>
                  <ion-icon :icon="arrowForwardOutline"></ion-icon>
                </template>
              </button>
            </form>
          </div>

          <!-- Footer -->
          <p class="register-link">
            Don't have an account?
            <router-link to="/register">Create one</router-link>
          </p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonContent, IonIcon, IonSpinner } from '@ionic/vue';
import { mailOutline, lockClosedOutline, eyeOutline, eyeOffOutline, alertCircleOutline, arrowForwardOutline } from 'ionicons/icons';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const auth = useAuthStore();

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);
const googleLoading = ref(false);
const error = ref('');
const emailFocused = ref(false);
const passwordFocused = ref(false);

async function handleLogin() {
  if (!email.value || !password.value) {
    error.value = 'Please fill in all fields';
    return;
  }

  loading.value = true;
  error.value = '';

  const success = await auth.login(email.value, password.value);

  if (success) {
    router.replace('/home');
  } else {
    // If email not verified, redirect to verify page
    if (auth.error === 'Email not verified') {
      router.replace({ path: '/verify-email', query: { email: email.value } });
      return;
    }
    error.value = auth.error || 'Login failed';
  }

  loading.value = false;
}

function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).google?.accounts?.id) { resolve(); return; }
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load Google Sign-In'));
    document.head.appendChild(s);
  });
}

async function handleGoogleLogin() {
  googleLoading.value = true;
  error.value = '';

  if (!Capacitor.isNativePlatform()) {
    // Web browser: Google Identity Services (One Tap)
    try {
      await loadGoogleScript();
    } catch {
      error.value = 'Failed to load Google Sign-In';
      googleLoading.value = false;
      return;
    }

    (window as any).google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      use_fedcm_for_prompt: false, // fall back to classic popup when FedCM is blocked
      callback: async (resp: { credential: string }) => {
        const success = await auth.googleLogin(resp.credential);
        googleLoading.value = false;
        if (success) {
          router.replace('/home');
        } else {
          error.value = auth.error || 'Google sign-in failed';
        }
      },
    });

    (window as any).google.accounts.id.prompt((n: any) => {
      if (n.isNotDisplayed()) {
        error.value = 'Google sign-in could not open. Enable third-party cookies or try Chrome.';
        googleLoading.value = false;
      } else if (n.isSkippedMoment() || n.isDismissedMoment()) {
        googleLoading.value = false;
      }
    });
    return; // loading is managed inside callback / prompt notification
  }

  // Native (Android / iOS): Capacitor GoogleAuth plugin
  try {
    const googleUser = await GoogleAuth.signIn();
    const idToken = googleUser?.authentication?.idToken;
    if (!idToken) throw new Error('No ID token from Google');

    const success = await auth.googleLogin(idToken);
    if (success) {
      router.replace('/home');
    } else {
      error.value = auth.error || 'Google sign-in failed';
    }
  } catch (err: any) {
    if (err?.error !== 'popup_closed_by_user' && err?.error !== 'access_denied') {
      error.value = err?.message || 'Google sign-in failed';
    }
  } finally {
    googleLoading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--app-bg);
  position: relative;
  overflow: hidden;
  padding-top: env(safe-area-inset-top, 0px);
}

.bg-decoration {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
  animation: float 20s ease-in-out infinite;
}

.blob-1 {
  width: 300px; height: 300px;
  background: rgba(5, 150, 105, 0.2);
  top: -100px; right: -80px;
}
.blob-2 {
  width: 250px; height: 250px;
  background: rgba(16, 185, 129, 0.15);
  bottom: -60px; left: -60px;
  animation-delay: -7s;
}
.blob-3 {
  width: 200px; height: 200px;
  background: rgba(52, 211, 153, 0.12);
  top: 40%; left: 50%;
  animation-delay: -14s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(30px, -20px) scale(1.05); }
  50% { transform: translate(-20px, 20px) scale(0.95); }
  75% { transform: translate(15px, 10px) scale(1.02); }
}

.login-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 400px;
  padding: 24px;
}

/* Logo */
.logo-section {
  text-align: center;
  margin-bottom: 36px;
}

.logo-wrapper {
  position: relative;
  display: inline-flex;
  margin-bottom: 20px;
}

.logo {
  width: 88px;
  height: 88px;
  border-radius: 28px;
  background: var(--app-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
  box-shadow: var(--shadow-primary-lg);
}

.logo-glow {
  position: absolute;
  inset: -8px;
  border-radius: 32px;
  background: var(--app-gradient);
  opacity: 0.2;
  filter: blur(16px);
  animation: glow-pulse 3s ease-in-out infinite;
}

@keyframes glow-pulse {
  0%, 100% { opacity: 0.2; transform: scale(1); }
  50% { opacity: 0.35; transform: scale(1.05); }
}

.logo-section h1 {
  font-size: 36px;
  font-weight: 800;
  color: var(--app-text);
  margin: 0 0 8px;
  letter-spacing: -0.5px;
}

.tagline {
  font-size: 15px;
  color: var(--app-text-muted);
  margin: 0;
  letter-spacing: 0.3px;
}

/* Form Card */
.form-card {
  background: var(--app-surface);
  border-radius: var(--radius-2xl);
  padding: 24px;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--app-border);
}

/* Google Primary Button */
.google-btn-primary {
  width: 100%;
  height: 56px;
  border: none;
  border-radius: var(--radius-lg);
  background: white;
  color: #1f1f1f;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.18);
  transition: all var(--transition-fast);
}

.google-btn-primary:active:not(:disabled) {
  transform: scale(0.98);
  box-shadow: 0 1px 5px rgba(0,0,0,0.12);
}

.google-btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.google-btn-primary ion-spinner {
  width: 22px;
  height: 22px;
  color: #1f1f1f;
}

.google-icon {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
}

/* Divider */
.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 20px 0;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: var(--app-border);
}

.divider-text {
  font-size: 12px;
  color: var(--app-text-muted);
  font-weight: 500;
  white-space: nowrap;
}

/* Inputs */
.input-wrapper {
  margin-bottom: 12px;
}

.input-field {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  height: 50px;
  background: var(--app-bg);
  border: 2px solid transparent;
  border-radius: var(--radius-lg);
  transition: all var(--transition-fast);
}

.input-field.focused {
  border-color: var(--app-primary);
  background: var(--app-surface);
  box-shadow: 0 0 0 4px var(--app-primary-ultra-light);
}

.input-field.error {
  border-color: var(--ion-color-danger);
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.08);
}

.field-icon {
  font-size: 18px;
  color: var(--app-text-muted);
  flex-shrink: 0;
  transition: color var(--transition-fast);
}

.input-field.focused .field-icon {
  color: var(--app-primary);
}

.input-field input {
  flex: 1;
  border: none;
  background: none;
  font-size: 15px;
  color: var(--app-text);
  outline: none;
  min-width: 0;
}

.input-field input::placeholder {
  color: var(--app-text-muted);
}

.toggle-pw {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  display: flex;
  color: var(--app-text-muted);
}

.toggle-pw ion-icon { font-size: 18px; }

/* Error Banner */
.error-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.15);
  border-radius: var(--radius-md);
  margin-bottom: 14px;
  animation: shake 0.4s ease-in-out;
}

.error-banner ion-icon {
  font-size: 18px;
  color: var(--ion-color-danger);
  flex-shrink: 0;
}

.error-banner span {
  font-size: 13px;
  color: var(--ion-color-danger);
  font-weight: 500;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(6px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}

/* Email Sign-In Button (secondary) */
.submit-btn {
  width: 100%;
  height: 50px;
  border: 1.5px solid var(--app-border);
  border-radius: var(--radius-lg);
  background: transparent;
  color: var(--app-text-secondary);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all var(--transition-base);
  margin-top: 4px;
}

.submit-btn:active:not(:disabled) {
  background: var(--app-surface-hover);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.submit-btn ion-icon { font-size: 18px; }
.submit-btn ion-spinner { width: 20px; height: 20px; }

/* Forgot password */
.forgot-row {
  text-align: right;
  margin-bottom: 12px;
  margin-top: -4px;
}
.forgot-link {
  font-size: 13px;
  color: var(--app-primary);
  text-decoration: none;
  font-weight: 600;
}

/* Register Link */
.register-link {
  text-align: center;
  margin-top: 24px;
  color: var(--app-text-muted);
  font-size: 15px;
}

.register-link a {
  color: var(--app-primary);
  text-decoration: none;
  font-weight: 700;
}
</style>
