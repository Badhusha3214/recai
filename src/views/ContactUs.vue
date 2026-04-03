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
          <router-link to="/register" class="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-full text-sm font-semibold transition">
            Get Started
          </router-link>
        </div>
      </div>
    </nav>

    <!-- Hero -->
    <div class="pt-28 pb-12 px-4 sm:px-6 text-center animate-fadeinup">
      <p class="text-emerald-400 text-sm font-semibold uppercase tracking-widest mb-3">Get In Touch</p>
      <h1 class="text-4xl sm:text-5xl font-bold mb-4">Contact Us</h1>
      <p class="text-white/60 text-base sm:text-lg max-w-xl mx-auto">
        Have a question, feedback, or need help with Echobit? We'd love to hear from you.
      </p>
    </div>

    <!-- Content -->
    <div class="max-w-5xl mx-auto px-4 sm:px-6 pb-20 grid grid-cols-1 md:grid-cols-2 gap-8">

      <!-- Contact Form -->
      <div class="animate-fadeinup-delay bg-white/10 backdrop-blur-sm border border-emerald-500/20 rounded-2xl p-6 sm:p-8">
        <h2 class="text-xl font-semibold mb-6">Send us a message</h2>

        <div v-if="submitted" class="text-center py-8">
          <div class="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 class="text-white text-lg font-semibold mb-2">Message Sent!</h3>
          <p class="text-white/60 text-sm">We'll get back to you at <strong class="text-white">{{ form.email }}</strong> within 24 hours.</p>
          <button @click="submitted = false" class="mt-5 text-emerald-400 underline text-sm">Send another</button>
        </div>

        <form v-else @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-white/70 text-sm mb-1">Your Name</label>
            <input
              v-model="form.name"
              type="text"
              required
              placeholder="John Doe"
              class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            />
          </div>
          <div>
            <label class="block text-white/70 text-sm mb-1">Email Address</label>
            <input
              v-model="form.email"
              type="email"
              required
              placeholder="you@example.com"
              class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            />
          </div>
          <div>
            <label class="block text-white/70 text-sm mb-1">Subject</label>
            <select
              v-model="form.subject"
              required
              class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition appearance-none"
            >
              <option value="" class="bg-gray-900" disabled>Select a topic…</option>
              <option value="General Inquiry" class="bg-gray-900">General Inquiry</option>
              <option value="Technical Support" class="bg-gray-900">Technical Support</option>
              <option value="Account &amp; Data" class="bg-gray-900">Account &amp; Data</option>
              <option value="Privacy &amp; Deletion" class="bg-gray-900">Privacy &amp; Deletion</option>
              <option value="Feature Request" class="bg-gray-900">Feature Request</option>
              <option value="Bug Report" class="bg-gray-900">Bug Report</option>
              <option value="Other" class="bg-gray-900">Other</option>
            </select>
          </div>
          <div>
            <label class="block text-white/70 text-sm mb-1">Message</label>
            <textarea
              v-model="form.message"
              required
              rows="5"
              placeholder="Tell us what's on your mind…"
              class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition resize-none"
            ></textarea>
          </div>

          <div v-if="errorMsg" class="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-red-300 text-sm">
            {{ errorMsg }}
          </div>

          <button
            type="submit"
            :disabled="sending"
            class="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
          >
            <svg v-if="sending" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            {{ sending ? 'Sending…' : 'Send Message' }}
          </button>
        </form>
      </div>

      <!-- Info cards -->
      <div class="flex flex-col gap-5 animate-fadeinup-delay2">

        <!-- Email -->
        <div class="bg-white/10 backdrop-blur-sm border border-emerald-500/20 rounded-2xl p-6 flex items-start gap-4">
          <div class="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 class="font-semibold text-white mb-1">Email Support</h3>
            <p class="text-white/50 text-sm mb-2">We typically respond within 24 hours.</p>
            <a href="mailto:no.reply.echobit@gmail.com" class="text-emerald-400 hover:text-emerald-300 text-sm font-medium underline transition">
              no.reply.echobit@gmail.com
            </a>
          </div>
        </div>

        <!-- Account deletion -->
        <div class="bg-white/10 backdrop-blur-sm border border-emerald-500/20 rounded-2xl p-6 flex items-start gap-4">
          <div class="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div>
            <h3 class="font-semibold text-white mb-1">Account &amp; Data Deletion</h3>
            <p class="text-white/50 text-sm mb-2">Want to delete your account and all data?</p>
          <router-link to="/request-deletion" class="text-emerald-400 hover:text-emerald-300 text-sm font-medium underline transition">
            Submit a deletion request →
            </router-link>
          </div>
        </div>

        <!-- Privacy -->
        <div class="bg-white/10 backdrop-blur-sm border border-emerald-500/20 rounded-2xl p-6 flex items-start gap-4">
          <div class="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h3 class="font-semibold text-white mb-1">Privacy Policy</h3>
            <p class="text-white/50 text-sm mb-2">Learn how we collect and protect your data.</p>
            <router-link to="/privacy-policy" class="text-emerald-400 hover:text-emerald-300 text-sm font-medium underline transition">
              Read our Privacy Policy →
            </router-link>
          </div>
        </div>

        <!-- Developer -->
        <div class="bg-white/10 backdrop-blur-sm border border-emerald-500/20 rounded-2xl p-6 flex items-start gap-4">
          <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <div>
            <h3 class="font-semibold text-white mb-1">Developed by Devmorphix</h3>
            <p class="text-white/50 text-sm">Echobit is built and maintained by Devmorphix. We're a small team passionate about AI-powered productivity tools.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="border-t border-white/10 py-6 text-center">
      <p class="text-white/30 text-sm">
        © {{ new Date().getFullYear() }} <span class="text-white/50 font-medium">Devmorphix</span>. All rights reserved.
        &nbsp;·&nbsp; Echobit — AI Meeting Companion
      </p>
      <div class="flex justify-center gap-6 mt-3 text-xs text-white/30">
        <router-link to="/" class="hover:text-emerald-400 transition">Home</router-link>
        <router-link to="/privacy-policy" class="hover:text-emerald-400 transition">Privacy Policy</router-link>
        <router-link to="/login" class="hover:text-emerald-400 transition">Sign In</router-link>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';

const form = reactive({ name: '', email: '', subject: '', message: '' });
const sending = ref(false);
const submitted = ref(false);
const errorMsg = ref('');

async function handleSubmit() {
  sending.value = true;
  errorMsg.value = '';
  try {
    // Open default mail client with pre-filled details as fallback
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\nSubject: ${form.subject}\n\n${form.message}`
    );
    const mailto = `mailto:no.reply.echobit@gmail.com?subject=${encodeURIComponent('[Echobit] ' + form.subject)}&body=${body}`;
    window.location.href = mailto;
    // Mark as submitted after a short delay
    setTimeout(() => { submitted.value = true; }, 400);
  } catch {
    errorMsg.value = 'Something went wrong. Please email us directly.';
  } finally {
    sending.value = false;
  }
}
</script>

<style scoped>
@keyframes fadeinup {
  from { opacity: 0; transform: translateY(32px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0)   scale(1); }
}
.animate-fadeinup {
  animation: fadeinup 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.animate-fadeinup-delay {
  animation: fadeinup 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both;
}
.animate-fadeinup-delay2 {
  animation: fadeinup 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.3s both;
}
</style>
