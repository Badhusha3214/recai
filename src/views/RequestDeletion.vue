<template>
  <div class="min-h-screen bg-gradient-to-br from-black via-gray-900 to-emerald-950 text-white">

    <!-- Fixed Nav -->
    <nav class="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-4 bg-black/30 backdrop-blur-md border-b border-white/5">
      <div class="max-w-7xl mx-auto flex justify-between items-center">
        <router-link to="/" class="flex items-center space-x-2">
          <img src="/favicon.png" alt="Echobit" class="w-8 h-8 rounded-xl object-contain" />
          <span class="text-xl font-bold text-white">Echobit</span>
        </router-link>
        <div class="flex items-center space-x-3">
          <router-link to="/login" class="text-white/70 hover:text-white text-sm transition">Sign In</router-link>
          <router-link to="/privacy-policy" class="text-white/70 hover:text-white text-sm transition hidden sm:block">Privacy Policy</router-link>
        </div>
      </div>
    </nav>

    <!-- Content -->
    <div class="pt-28 pb-20 px-4 sm:px-6">
      <div class="max-w-lg mx-auto">

        <!-- Header -->
        <div class="text-center mb-8 animate-fadeinup">
          <div class="w-16 h-16 bg-red-600/20 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h1 class="text-3xl sm:text-4xl font-bold mb-2">Request Account Deletion</h1>
          <p class="text-white/50 text-sm sm:text-base max-w-md mx-auto">
            Fill in the form below and we'll delete your Echobit account and all associated data within 7 business days.
          </p>
        </div>

        <!-- Success State -->
        <div v-if="submitted" class="animate-fadeinup bg-green-900/30 border border-green-600/40 rounded-2xl p-8 text-center">
          <div class="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 class="text-white text-xl font-semibold mb-2">Request Submitted</h2>
          <p class="text-white/60 text-sm mb-1">
            We've received your deletion request for <strong class="text-white">{{ form.email }}</strong>.
          </p>
          <p class="text-white/50 text-sm mb-6">
            A confirmation email has been sent to you. Our team will process the request within <strong class="text-white/70">7 business days</strong>.
          </p>
          <div class="text-xs text-white/30 border-t border-white/10 pt-4">
            Questions? Email us at
            <a href="mailto:no.reply.echobit@gmail.com" class="text-emerald-400 underline">no.reply.echobit@gmail.com</a>
          </div>
        </div>

        <!-- Form -->
        <div v-else class="animate-fadeinup bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8">

          <!-- Info banner -->
          <div class="bg-red-900/20 border border-red-500/20 rounded-xl px-4 py-3 mb-6 flex gap-3">
            <svg class="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p class="text-red-300 text-xs leading-relaxed">
              This will permanently delete your account, all recordings, transcripts, and AI-generated notes.
              <strong class="text-red-200">This action cannot be undone.</strong>
            </p>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div>
              <label class="block text-white/70 text-sm mb-1">Full Name <span class="text-red-400">*</span></label>
              <input
                v-model="form.name"
                type="text"
                required
                placeholder="John Doe"
                class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
              />
            </div>

            <div>
              <label class="block text-white/70 text-sm mb-1">
                Email Address (used to sign up / Google account)
                <span class="text-red-400">*</span>
              </label>
              <input
                v-model="form.email"
                type="email"
                required
                placeholder="you@gmail.com"
                class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
              />
            </div>

            <div>
              <label class="block text-white/70 text-sm mb-1">Reason for Deletion <span class="text-red-400">*</span></label>
              <select
                v-model="form.reason"
                required
                class="w-full bg-gray-900 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition appearance-none"
              >
                <option value="" disabled>Select a reason…</option>
                <option value="No longer using the app">No longer using the app</option>
                <option value="Privacy concerns">Privacy concerns</option>
                <option value="Switching to another service">Switching to another service</option>
                <option value="Technical issues">Technical issues</option>
                <option value="Created account by mistake">Created account by mistake</option>
                <option value="Data protection / GDPR request">Data protection / GDPR request</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label class="block text-white/70 text-sm mb-1">Additional Information <span class="text-white/30">(optional)</span></label>
              <textarea
                v-model="form.additionalInfo"
                rows="3"
                placeholder="Any other details you'd like us to know…"
                class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-red-500 transition resize-none"
              ></textarea>
            </div>

            <div class="flex items-start gap-3 pt-1">
              <input
                v-model="confirmed"
                type="checkbox"
                id="confirm-del"
                required
                class="mt-1 w-4 h-4 accent-red-500 flex-shrink-0"
              />
              <label for="confirm-del" class="text-white/60 text-sm cursor-pointer leading-relaxed">
                I understand that submitting this request will lead to the permanent deletion of my Echobit account and all my data, and that this cannot be reversed.
              </label>
            </div>

            <div v-if="errorMsg" class="bg-red-900/30 border border-red-600/40 rounded-xl px-4 py-3 text-red-300 text-sm">
              {{ errorMsg }}
            </div>

            <button
              type="submit"
              :disabled="!confirmed || loading"
              class="w-full bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
            >
              <svg v-if="loading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              {{ loading ? 'Submitting…' : 'Submit Deletion Request' }}
            </button>
          </form>

          <p class="text-center text-white/30 text-xs mt-5">
            Already have your password?
            <router-link to="/login" class="text-emerald-400 underline hover:text-emerald-300 transition">Sign in to delete instantly →</router-link>
          </p>
        </div>

        <!-- Footer links -->
        <div class="mt-8 text-center text-xs text-white/30 flex flex-wrap justify-center gap-4">
          <router-link to="/" class="hover:text-emerald-400 transition">Home</router-link>
          <router-link to="/privacy-policy" class="hover:text-emerald-400 transition">Privacy Policy</router-link>
          <router-link to="/contact" class="hover:text-emerald-400 transition">Contact Us</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';

const form = reactive({ name: '', email: '', reason: '', additionalInfo: '' });
const confirmed = ref(false);
const loading = ref(false);
const submitted = ref(false);
const errorMsg = ref('');

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function handleSubmit() {
  if (!confirmed.value) return;
  loading.value = true;
  errorMsg.value = '';
  try {
    const res = await fetch(`${API_BASE}/auth/request-deletion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        reason: form.reason,
        additionalInfo: form.additionalInfo,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit request');
    submitted.value = true;
  } catch (err) {
    errorMsg.value = err.message;
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
@keyframes fadeinup {
  from { opacity: 0; transform: translateY(28px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.animate-fadeinup {
  animation: fadeinup 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
}
</style>
