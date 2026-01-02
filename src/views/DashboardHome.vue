<template>
  <div>
    <!-- Header -->
    <div class="mb-6 sm:mb-8 mt-6">
      <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
      <p class="text-gray-600 mt-1 text-sm sm:text-base">Welcome back, {{ userName }}! Here's your recording overview.</p>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
      <div class="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-xs sm:text-sm">Total Recordings</p>
            <p class="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{{ stats.total }}</p>
          </div>
          <div class="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
            <svg class="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-xs sm:text-sm">Summarized</p>
            <p class="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{{ stats.summarized }}</p>
          </div>
          <div class="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <svg class="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 sm:col-span-2 md:col-span-1">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-xs sm:text-sm">Minutes Generated</p>
            <p class="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{{ stats.minutes }}</p>
          </div>
          <div class="w-10 h-10 sm:w-12 sm:h-12 bg-teal-100 rounded-xl flex items-center justify-center">
            <svg class="w-5 h-5 sm:w-6 sm:h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="bg-gradient-to-r from-emerald-600 to-green-700 rounded-2xl p-5 sm:p-8 mb-6 sm:mb-8 text-white">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Ready to record?</h2>
          <p class="text-white/80 text-sm sm:text-base">Start a new recording and let AI handle the rest.</p>
        </div>
        <router-link 
          to="/dashboard/record" 
          class="bg-white text-emerald-600 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold hover:bg-opacity-90 transition flex items-center justify-center sm:justify-start space-x-2 w-full sm:w-auto"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          <span>New Recording</span>
        </router-link>
      </div>
    </div>

    <!-- Recent Recordings -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100">
      <div class="p-4 sm:p-6 border-b border-gray-100">
        <div class="flex items-center justify-between">
          <h2 class="text-lg sm:text-xl font-bold text-gray-900">Recent Recordings</h2>
          <router-link to="/dashboard/recordings" class="text-emerald-600 hover:text-emerald-700 text-xs sm:text-sm font-medium">
            View All →
          </router-link>
        </div>
      </div>

      <div v-if="loading" class="p-6 sm:p-8 text-center">
        <div class="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto"></div>
        <p class="text-gray-500 mt-2 text-sm">Loading recordings...</p>
      </div>

      <div v-else-if="recordings.length === 0" class="p-8 sm:p-12 text-center">
        <div class="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </div>
        <h3 class="text-gray-900 font-semibold mb-1 text-sm sm:text-base">No recordings yet</h3>
        <p class="text-gray-500 mb-4 text-sm">Start your first recording to see it here.</p>
        <router-link to="/dashboard/record" class="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Create Recording
        </router-link>
      </div>

      <div v-else class="divide-y divide-gray-100">
        <div 
          v-for="recording in recordings.slice(0, 5)" 
          :key="recording._id"
          class="p-3 sm:p-4 hover:bg-gray-50 transition cursor-pointer"
          @click="$router.push(`/dashboard/recordings/${recording._id}`)"
        >
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center space-x-3 sm:space-x-4 min-w-0">
              <div class="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg class="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <div class="min-w-0 flex-1">
                <h3 class="font-medium text-gray-900 text-sm sm:text-base truncate">{{ recording.title }}</h3>
                <p class="text-xs sm:text-sm text-gray-500">{{ formatDate(recording.createdAt) }}</p>
              </div>
            </div>
            <div class="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
              <span 
                class="px-2 py-1 text-xs font-medium rounded-full hidden sm:inline-block"
                :class="statusClass(recording.status)"
              >
                {{ recording.status }}
              </span>
              <svg class="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { authState, recordingsApi } from '../api';

const recordings = ref([]);
const loading = ref(true);

const userName = computed(() => authState.user?.name?.split(' ')[0] || 'User');

const stats = computed(() => ({
  total: recordings.value.length,
  summarized: recordings.value.filter(r => r.summary).length,
  minutes: recordings.value.filter(r => r.minutes).length
}));

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const statusClass = (status) => {
  const classes = {
    pending: 'bg-yellow-100 text-yellow-800',
    summarized: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800'
  };
  return classes[status] || classes.pending;
};

onMounted(async () => {
  try {
    const data = await recordingsApi.getAll();
    recordings.value = data.recordings || [];
  } catch (error) {
    console.error('Failed to load recordings:', error);
  } finally {
    loading.value = false;
  }
});
</script>
