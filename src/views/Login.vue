<template>
  <div class="min-h-screen bg-gradient-to-br from-black via-gray-900 to-emerald-950 flex items-center justify-center px-4 py-8">
    <div class="max-w-md w-full">
      <!-- Logo -->
      <div class="text-center mb-6 sm:mb-8">
        <router-link to="/" class="inline-flex items-center space-x-2">
          <div class="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <span class="text-2xl sm:text-3xl font-bold text-white">RecAI</span>
        </router-link>
      </div>

      <!-- Login Card -->
      <div class="bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-emerald-500/20 shadow-2xl">
        <h2 class="text-xl sm:text-2xl font-bold text-white mb-2">Welcome back</h2>
        <p class="text-white/60 mb-6 sm:mb-8 text-sm sm:text-base">Sign in to access your recordings</p>

        <form @submit.prevent="handleLogin" class="space-y-4 sm:space-y-5">
          <div>
            <label class="block text-white/80 text-sm font-medium mb-2">Email</label>
            <input 
              v-model="email" 
              type="email" 
              required
              class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label class="block text-white/80 text-sm font-medium mb-2">Password</label>
            <input 
              v-model="password" 
              type="password" 
              required
              class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              placeholder="••••••••"
            />
          </div>

          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <label class="flex items-center">
              <input type="checkbox" class="w-4 h-4 rounded bg-white/10 border-white/20 text-emerald-500 focus:ring-emerald-500">
              <span class="ml-2 text-white/60 text-sm">Remember me</span>
            </label>
            <a href="#" class="text-emerald-400 hover:text-emerald-300 text-sm transition">Forgot password?</a>
          </div>

          <div v-if="error" class="bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl text-sm">
            {{ error }}
          </div>

          <button 
            type="submit" 
            :disabled="loading"
            class="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <svg v-if="loading" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ loading ? 'Signing in...' : 'Sign In' }}</span>
          </button>
        </form>

        <div class="mt-6 sm:mt-8 text-center">
          <p class="text-white/60 text-sm sm:text-base">
            Don't have an account? 
            <router-link to="/register" class="text-emerald-400 hover:text-emerald-300 font-medium transition">Sign up</router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { authApi } from '../api';

const router = useRouter();
const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

const handleLogin = async () => {
  error.value = '';
  loading.value = true;
  
  try {
    await authApi.login(email.value, password.value);
    router.push('/dashboard');
  } catch (err) {
    error.value = err.message || 'Login failed. Please try again.';
  } finally {
    loading.value = false;
  }
};
</script>
