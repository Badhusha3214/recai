<template>
  <div class="bg-gradient-to-br from-black via-gray-900 to-emerald-950 overflow-x-hidden">

    <!-- Fixed Navigation -->
    <nav class="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-4 bg-black/30 backdrop-blur-md border-b border-white/5">
      <div class="max-w-7xl mx-auto flex justify-between items-center">
        <div class="flex items-center space-x-2">
          <img src="/favicon.png" alt="Echobit" class="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-contain" />
          <span class="text-xl sm:text-2xl font-bold text-white">Echobit</span>
        </div>
        <div class="flex items-center space-x-2 sm:space-x-4">
          <router-link to="/contact" class="text-white/70 hover:text-white transition px-3 py-2 text-sm hidden sm:block">
            Contact
          </router-link>
          <router-link to="/login" class="text-white/80 hover:text-white transition px-3 sm:px-4 py-2 text-sm sm:text-base">
            Sign In
          </router-link>
          <router-link to="/register" class="bg-emerald-500 text-white px-4 sm:px-6 py-2 rounded-full font-semibold hover:bg-emerald-400 transition shadow-lg text-sm sm:text-base">
            Get Started
          </router-link>
        </div>
      </div>
    </nav>

    <!-- ─── Section 1: Hero ─── -->
    <section ref="sec0" class="relative h-screen flex items-center justify-center px-4 sm:px-6 overflow-hidden section-anim"
             :class="{ 'section-visible': visible[0] }">
      <!-- Background blobs -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-40 -right-40 w-72 sm:w-96 h-72 sm:h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div class="absolute -bottom-40 -left-40 w-72 sm:w-96 h-72 sm:h-96 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-1000"></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-[28rem] h-80 sm:h-[28rem] bg-emerald-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-500"></div>
      </div>

      <div class="relative z-10 max-w-4xl mx-auto text-center">
        <div class="inline-flex items-center px-3 sm:px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/80 text-xs sm:text-sm mb-6">
          <span class="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
          AI-Powered Mobile Meeting Companion · by Devmorphix
        </div>

        <h1 class="text-4xl sm:text-5xl md:text-7xl font-bold text-white mb-5 leading-tight">
          Your AI
          <span class="bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent"> Meeting </span>
          Companion
        </h1>

        <p class="text-base sm:text-xl text-white/70 mb-10 max-w-2xl mx-auto">
          Echobit records your meetings & lectures on Android, then instantly transcribes,
          summarises, and generates professional meeting minutes — hands-free.
        </p>

        <div class="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <router-link to="/register" class="w-full sm:w-auto group bg-emerald-500 text-white px-7 py-3.5 rounded-full font-semibold text-base sm:text-lg hover:bg-emerald-400 hover:shadow-2xl transition-all duration-300 flex items-center justify-center space-x-2">
            <span>Create Free Account</span>
            <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </router-link>
          <router-link to="/login" class="w-full sm:w-auto text-white/80 hover:text-white px-7 py-3.5 rounded-full font-semibold text-base sm:text-lg border border-white/20 hover:border-white/50 transition flex items-center justify-center">
            Sign In
          </router-link>
        </div>
      </div>

      <!-- Scroll hint -->
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/30 text-xs animate-bounce">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
        <span>Scroll</span>
      </div>
    </section>

    <!-- ─── Section 2: Features ─── -->
    <section ref="sec1" class="relative h-screen flex items-center justify-center px-4 sm:px-6 border-t border-white/5 section-anim"
             :class="{ 'section-visible': visible[1] }">
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute top-1/3 right-0 w-64 h-64 bg-teal-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-500"></div>
        <div class="absolute bottom-1/4 left-0 w-64 h-64 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      </div>

      <div class="relative z-10 max-w-5xl mx-auto w-full">
        <div class="text-center mb-10">
          <p class="text-emerald-400 text-sm font-semibold uppercase tracking-widest mb-2">What Echobit Does</p>
          <h2 class="text-3xl sm:text-4xl md:text-5xl font-bold text-white">Everything your meetings need</h2>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
          <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-left border border-emerald-500/20 hover:bg-white/15 hover:border-emerald-500/40 transition-all duration-300">
            <div class="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h3 class="text-white font-semibold text-lg mb-2">Mobile Recording</h3>
            <p class="text-white/60 text-sm leading-relaxed">Record meetings directly from your Android device. Crystal-clear capture with background processing.</p>
          </div>

          <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-left border border-emerald-500/20 hover:bg-white/15 hover:border-emerald-500/40 transition-all duration-300">
            <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 class="text-white font-semibold text-lg mb-2">AI Transcription &amp; Summary</h3>
            <p class="text-white/60 text-sm leading-relaxed">Powered by OpenAI Whisper and Google Gemini — full transcripts and intelligent summaries in seconds.</p>
          </div>

          <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-left border border-emerald-500/20 hover:bg-white/15 hover:border-emerald-500/40 transition-all duration-300">
            <div class="w-12 h-12 bg-gradient-to-br from-teal-500 to-green-600 rounded-xl flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 class="text-white font-semibold text-lg mb-2">Meeting Minutes</h3>
            <p class="text-white/60 text-sm leading-relaxed">Professional formatted meeting minutes generated instantly and exported as PDF, ready to share.</p>
          </div>
        </div>
      </div>

      <!-- Scroll hint -->
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/20 text-xs animate-bounce">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>

    <!-- ─── Section 3: About / Footer ─── -->
    <section ref="sec2" class="relative h-screen flex flex-col items-center justify-center px-4 sm:px-6 border-t border-white/5 section-anim"
             :class="{ 'section-visible': visible[2] }">
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-700 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse"></div>
      </div>

      <div class="relative z-10 max-w-3xl mx-auto w-full text-center flex-1 flex flex-col items-center justify-center">
        <img src="/favicon.png" alt="Echobit" class="w-16 h-16 rounded-2xl object-contain mx-auto mb-6 shadow-2xl" />

        <h2 class="text-3xl sm:text-4xl font-bold text-white mb-4">About Echobit</h2>
        <p class="text-white/60 text-base sm:text-lg leading-relaxed mb-8 max-w-2xl">
          Echobit — AI Meeting Companion is an Android application developed by
          <strong class="text-emerald-400">Devmorphix</strong>. We build tools that help professionals,
          students, and teams stay focused during meetings while AI handles the note-taking.
        </p>

        <div class="flex flex-col sm:flex-row gap-3 justify-center mb-12">
          <router-link to="/register" class="bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-3 rounded-full font-semibold transition shadow-lg">
            Get Started Free
          </router-link>
          <router-link to="/privacy-policy" class="border border-white/20 hover:border-white/40 text-white/80 hover:text-white px-8 py-3 rounded-full font-semibold transition">
            Privacy Policy
          </router-link>
        </div>

        <div class="flex flex-wrap justify-center gap-6 text-sm text-white/40 mb-8">
          <router-link to="/privacy-policy" class="hover:text-emerald-400 transition underline">Privacy Policy</router-link>
          <router-link to="/request-deletion" class="hover:text-emerald-400 transition underline">Delete Account</router-link>
          <router-link to="/contact" class="hover:text-emerald-400 transition underline">Contact Us</router-link>
          <router-link to="/login" class="hover:text-emerald-400 transition underline">Sign In</router-link>
        </div>
      </div>

      <!-- Footer bar -->
      <footer class="relative z-10 w-full py-6 border-t border-white/10 text-center">
        <p class="text-white/30 text-sm">
          © {{ new Date().getFullYear() }} <span class="text-white/50 font-medium">Devmorphix</span>. All rights reserved.
          &nbsp;·&nbsp; Echobit — AI Meeting Companion
        </p>
      </footer>
    </section>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const sec0 = ref(null);
const sec1 = ref(null);
const sec2 = ref(null);
const visible = ref([false, false, false]);

let observer;

onMounted(() => {
  const sections = [sec0.value, sec1.value, sec2.value];
  // Hero is immediately visible
  visible.value[0] = true;
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const idx = sections.indexOf(entry.target);
        if (idx !== -1 && entry.isIntersecting) {
          visible.value[idx] = true;
        }
      });
    },
    { threshold: 0.15 }
  );
  sections.forEach((el) => el && observer.observe(el));
});

onUnmounted(() => observer && observer.disconnect());
</script>

<style scoped>
/* Per-section jump entrance */
.section-anim {
  opacity: 0;
  transform: translateY(60px) scale(0.96);
  transition:
    opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
}
/* First section is visible immediately on load */
.section-anim:first-of-type {
  opacity: 0;
  transform: translateY(40px) scale(0.97);
}
.section-visible {
  opacity: 1 !important;
  transform: translateY(0) scale(1) !important;
}

/* Stagger children inside each visible section */
.section-visible .anim-child {
  animation: jumpIn 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.section-visible .anim-child:nth-child(2) { animation-delay: 0.1s; }
.section-visible .anim-child:nth-child(3) { animation-delay: 0.2s; }
.section-visible .anim-child:nth-child(4) { animation-delay: 0.3s; }

@keyframes jumpIn {
  0%   { opacity: 0; transform: translateY(36px) scale(0.95); }
  60%  { transform: translateY(-6px) scale(1.02); }
  80%  { transform: translateY(3px) scale(0.99); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

.delay-500  { animation-delay: 500ms; }
.delay-1000 { animation-delay: 1000ms; }
</style>
