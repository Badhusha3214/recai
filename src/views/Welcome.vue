<template>
  <div class="min-h-screen bg-gradient-to-br from-black via-gray-900 to-emerald-950">
    <!-- Navigation -->
    <nav class="absolute top-0 left-0 right-0 z-10 px-4 sm:px-6 py-4">
      <div class="max-w-7xl mx-auto flex justify-between items-center">
        <div class="flex items-center space-x-2">
          <div class="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-xl flex items-center justify-center">
            <svg class="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <span class="text-xl sm:text-2xl font-bold text-white">RecAI</span>
        </div>
        <div class="flex items-center space-x-2 sm:space-x-4">
          <router-link to="/login" class="text-white/80 hover:text-white transition px-3 sm:px-4 py-2 text-sm sm:text-base">
            Sign In
          </router-link>
          <router-link to="/register" class="bg-emerald-500 text-white px-4 sm:px-6 py-2 rounded-full font-semibold hover:bg-emerald-400 transition shadow-lg text-sm sm:text-base">
            Get Started
          </router-link>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <div class="relative min-h-screen flex items-center justify-center px-4 sm:px-6 pt-20 pb-12">
      <!-- Animated Background Elements -->
      <div class="absolute inset-0 overflow-hidden">
        <div class="absolute -top-40 -right-40 w-60 sm:w-80 h-60 sm:h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div class="absolute -bottom-40 -left-40 w-60 sm:w-80 h-60 sm:h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-1000"></div>
        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-emerald-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-500"></div>
      </div>

      <div class="relative z-10 max-w-5xl mx-auto text-center">
        <div class="inline-flex items-center px-3 sm:px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/80 text-xs sm:text-sm mb-6 sm:mb-8">
          <span class="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
          AI-Powered Voice Recording
        </div>
        
        <h1 class="text-3xl sm:text-5xl md:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight px-2">
          Transform Your
          <span class="bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent"> Voice </span>
          Into Insights
        </h1>
        
        <p class="text-base sm:text-xl text-white/70 mb-8 sm:mb-10 max-w-2xl mx-auto px-4">
          Record meetings, lectures, or conversations. Let AI instantly transcribe, summarize, 
          and generate meeting minutes.
        </p>

        <div class="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-16 px-4">
          <router-link to="/register" class="w-full sm:w-auto group bg-emerald-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg hover:bg-emerald-400 hover:shadow-2xl transition-all duration-300 flex items-center justify-center space-x-2">
            <span>Start Recording Free</span>
            <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </router-link>
          <button class="w-full sm:w-auto text-white/80 hover:text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg border border-white/20 hover:border-white/40 transition flex items-center justify-center space-x-2">
            <svg class="w-5 sm:w-6 h-5 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Watch Demo</span>
          </button>
        </div>

        <!-- Feature Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mt-8 px-2">
          <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-5 sm:p-6 text-left border border-emerald-500/20 hover:bg-white/15 hover:border-emerald-500/40 transition">
            <div class="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
              <svg class="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h3 class="text-white font-semibold text-base sm:text-lg mb-2">Voice Recording</h3>
            <p class="text-white/60 text-sm">Crystal-clear audio capture with noise reduction for professional results.</p>
          </div>
          
          <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-5 sm:p-6 text-left border border-emerald-500/20 hover:bg-white/15 hover:border-emerald-500/40 transition">
            <div class="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
              <svg class="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 class="text-white font-semibold text-base sm:text-lg mb-2">AI Summarization</h3>
            <p class="text-white/60 text-sm">Intelligent summaries that capture key points and action items automatically.</p>
          </div>
          
          <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-5 sm:p-6 text-left border border-emerald-500/20 hover:bg-white/15 hover:border-emerald-500/40 transition sm:col-span-2 md:col-span-1">
            <div class="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-teal-500 to-green-600 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
              <svg class="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 class="text-white font-semibold text-base sm:text-lg mb-2">Meeting Minutes</h3>
            <p class="text-white/60 text-sm">Professional meeting minutes generated instantly, ready to share.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="absolute bottom-0 left-0 right-0 py-6">
      <div class="max-w-7xl mx-auto px-6 text-center text-white/40 text-sm">
        © 2025 RecAI. Transform the way you capture and process voice.
      </div>
    </footer>
  </div>
</template>

<script setup>
</script>

<style scoped>
.delay-500 {
  animation-delay: 500ms;
}
.delay-1000 {
  animation-delay: 1000ms;
}
</style>
