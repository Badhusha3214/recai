<template>
  <div class="min-h-screen bg-gray-950 text-gray-300 px-4 py-12">
    <div class="max-w-3xl mx-auto">
      <div class="mb-10">
        <h1 class="text-3xl font-bold text-white">Echobit</h1>
        <p class="text-gray-500 text-sm mt-1">Privacy Policy</p>
      </div>

      <p class="text-sm text-gray-500 mb-8">Last updated: 6 March 2026</p>

      <section class="mb-8">
        <h2 class="text-white text-lg font-semibold mb-3">1. Introduction</h2>
        <p class="text-sm leading-relaxed">
          Echobit ("we", "us", or "our") operates the Echobit mobile application (the "App"). This Privacy Policy
          explains how we collect, use, and protect your personal information when you use our App. By using
          Echobit, you agree to the terms described in this policy.
        </p>
      </section>

      <section class="mb-8">
        <h2 class="text-white text-lg font-semibold mb-3">2. Information We Collect</h2>
        <ul class="text-sm leading-relaxed space-y-2 list-disc list-inside">
          <li><strong class="text-white">Account information</strong> — your name and email address when you register or sign in with Google.</li>
          <li><strong class="text-white">Audio recordings</strong> — audio files you record within the App, stored securely in the cloud.</li>
          <li><strong class="text-white">Transcriptions and notes</strong> — text generated from your recordings, including AI-generated summaries and custom notes.</li>
          <li><strong class="text-white">Device information</strong> — basic device and operating system information for compatibility and debugging purposes.</li>
        </ul>
      </section>

      <section class="mb-8">
        <h2 class="text-white text-lg font-semibold mb-3">3. How We Use Your Information</h2>
        <ul class="text-sm leading-relaxed space-y-2 list-disc list-inside">
          <li>To provide and operate the App's core features (recording, transcription, and note-taking).</li>
          <li>To authenticate your account and keep it secure.</li>
          <li>To send transactional emails such as email verification and password reset codes.</li>
          <li>To improve and maintain the App.</li>
        </ul>
        <p class="text-sm leading-relaxed mt-3">
          We do not sell your personal data to third parties, and we do not use your data for advertising purposes.
        </p>
      </section>

      <section class="mb-8">
        <h2 class="text-white text-lg font-semibold mb-3">4. Third-Party Services</h2>
        <p class="text-sm leading-relaxed mb-3">We use the following third-party services to operate the App:</p>
        <ul class="text-sm leading-relaxed space-y-2 list-disc list-inside">
          <li><strong class="text-white">Google Sign-In</strong> — for optional OAuth authentication. Governed by Google's Privacy Policy.</li>
          <li><strong class="text-white">Cloudflare R2</strong> — for secure cloud storage of audio files.</li>
          <li><strong class="text-white">OpenAI / Whisper</strong> — for speech-to-text transcription of your recordings. Audio is sent to OpenAI's API for processing.</li>
          <li><strong class="text-white">Google Gemini</strong> — for AI-generated summaries and insights from your transcriptions.</li>
          <li><strong class="text-white">Gmail (via Nodemailer)</strong> — to send verification and password reset emails.</li>
          <li><strong class="text-white">MongoDB Atlas</strong> — for secure cloud storage of account and recording metadata.</li>
        </ul>
      </section>

      <section class="mb-8">
        <h2 class="text-white text-lg font-semibold mb-3">5. Data Retention</h2>
        <p class="text-sm leading-relaxed">
          Your data is retained for as long as your account remains active. You may delete your account at any time
          (see Section 7), after which all your personal data and recordings are permanently deleted from our systems.
          Deletion is processed immediately upon request.
        </p>
      </section>

      <section class="mb-8">
        <h2 class="text-white text-lg font-semibold mb-3">6. Data Security</h2>
        <p class="text-sm leading-relaxed">
          We implement industry-standard security measures including HTTPS encryption for all data in transit,
          bcrypt password hashing, and JWT-based authentication. Audio files are stored with access controls on
          Cloudflare R2. While we take reasonable steps to protect your data, no method of transmission over the
          internet is 100% secure.
        </p>
      </section>

      <section class="mb-8">
        <h2 class="text-white text-lg font-semibold mb-3">7. Your Rights and Account Deletion</h2>
        <p class="text-sm leading-relaxed mb-3">You have the right to:</p>
        <ul class="text-sm leading-relaxed space-y-2 list-disc list-inside mb-3">
          <li>Access the personal data we hold about you.</li>
          <li>Correct inaccurate personal data.</li>
          <li>Request deletion of your account and all associated data.</li>
        </ul>
        <p class="text-sm leading-relaxed">
          To delete your account, visit our
          <a href="/delete-account" class="text-blue-400 underline hover:text-blue-300">account deletion page</a>
          or contact us at
          <a href="mailto:no.reply.echobit@gmail.com" class="text-blue-400 underline hover:text-blue-300">no.reply.echobit@gmail.com</a>.
          Deleting your account permanently removes all your recordings, transcriptions, and personal data.
        </p>
      </section>

      <section class="mb-8">
        <h2 class="text-white text-lg font-semibold mb-3">8. Children's Privacy</h2>
        <p class="text-sm leading-relaxed">
          Echobit is not directed at children under the age of 13. We do not knowingly collect personal information
          from children under 13. If you believe a child has provided us with personal data, please contact us and
          we will delete it promptly.
        </p>
      </section>

      <section class="mb-8">
        <h2 class="text-white text-lg font-semibold mb-3">9. Changes to This Policy</h2>
        <p class="text-sm leading-relaxed">
          We may update this Privacy Policy from time to time. When we do, we will update the "Last updated" date
          at the top of this page. We encourage you to review this policy periodically. Continued use of the App
          after changes constitutes acceptance of the updated policy.
        </p>
      </section>

      <section class="mb-12">
        <h2 class="text-white text-lg font-semibold mb-3">10. Contact Us</h2>
        <p class="text-sm leading-relaxed">
          If you have any questions or concerns about this Privacy Policy, please contact us at:<br />
          <a href="mailto:no.reply.echobit@gmail.com" class="text-blue-400 underline hover:text-blue-300">no.reply.echobit@gmail.com</a>
        </p>
      </section>

      <div class="border-t border-gray-800 pt-6 text-center text-xs text-gray-600">
        © {{ new Date().getFullYear() }} Echobit. All rights reserved.
        <span class="mx-2">·</span>
        <a href="/delete-account" class="underline hover:text-gray-400">Delete Account</a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Static page — no logic needed
</script>
