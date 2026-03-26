<template>
  <div class="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md">
      <!-- Logo / App name -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-white">Echobit</h1>
        <p class="text-gray-400 mt-1 text-sm">Account Deletion Request</p>
      </div>

      <!-- Success state -->
      <div v-if="deleted" class="bg-green-900/30 border border-green-700 rounded-2xl p-8 text-center">
        <div class="text-green-400 text-5xl mb-4">✓</div>
        <h2 class="text-white text-xl font-semibold mb-2">Account Deleted</h2>
        <p class="text-gray-300 text-sm">
          Your account and all associated data (recordings, transcripts, notes) have been permanently deleted.
        </p>
      </div>

      <!-- Form -->
      <div v-else class="bg-gray-900 border border-gray-800 rounded-2xl p-8">
        <h2 class="text-white text-xl font-semibold mb-1">Delete Your Account</h2>
        <p class="text-gray-400 text-sm mb-6">
          This will permanently delete your account and all your recordings, transcripts, and data. This action cannot be undone.
        </p>

        <div v-if="errorMsg" class="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-4 text-red-300 text-sm">
          {{ errorMsg }}
        </div>

        <form @submit.prevent="handleDelete">
          <div class="mb-4">
            <label class="block text-gray-300 text-sm mb-1">Email address</label>
            <input
              v-model="email"
              type="email"
              required
              placeholder="you@example.com"
              class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
            />
          </div>

          <div class="mb-6">
            <label class="block text-gray-300 text-sm mb-1">Password</label>
            <input
              v-model="password"
              type="password"
              required
              placeholder="Your account password"
              class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
            />
          </div>

          <div class="mb-6 flex items-start gap-3">
            <input
              v-model="confirmed"
              type="checkbox"
              id="confirm"
              class="mt-1 accent-red-500"
            />
            <label for="confirm" class="text-gray-400 text-sm cursor-pointer">
              I understand that deleting my account is permanent and all my data will be lost.
            </label>
          </div>

          <button
            type="submit"
            :disabled="!confirmed || loading"
            class="w-full bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {{ loading ? 'Deleting...' : 'Delete My Account' }}
          </button>
        </form>

        <p class="text-center text-gray-600 text-xs mt-6">
          If you signed in with Google, please contact
          <a href="mailto:no.reply.echobit@gmail.com" class="text-gray-400 underline">no.reply.echobit@gmail.com</a>
          to delete your account.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const email = ref('');
const password = ref('');
const confirmed = ref(false);
const loading = ref(false);
const errorMsg = ref('');
const deleted = ref(false);

const API_BASE = import.meta.env.VITE_API_URL ;

async function handleDelete() {
  if (!confirmed.value) return;
  loading.value = true;
  errorMsg.value = '';

  try {
    const res = await fetch(`${API_BASE}/auth/delete-account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete account');
    deleted.value = true;
  } catch (err: any) {
    errorMsg.value = err.message;
  } finally {
    loading.value = false;
  }
}
</script>
