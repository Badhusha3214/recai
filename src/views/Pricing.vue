<template>
  <!-- Fixed elements outside overflow-x-hidden to avoid Android WebView fixed-positioning bug -->

  <!-- Payment status toast -->
  <transition name="fade">
    <div v-if="paymentStatus"
      class="fixed top-4 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-sm font-medium max-w-sm w-full"
      :class="paymentStatus.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'"
    >
      <svg v-if="paymentStatus.type === 'success'" class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
      </svg>
      <svg v-else class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
      <span class="flex-1">{{ paymentStatus.message }}</span>
      <button @click="paymentStatus = null" class="opacity-70 hover:opacity-100 text-lg leading-none ml-2">×</button>
    </div>
  </transition>

  <!-- Fixed Navigation -->
  <nav class="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-4 pt-9 bg-black/30 backdrop-blur-md border-b border-white/5">
    <div class="max-w-7xl mx-auto flex justify-between items-center">
      <router-link to="/" class="flex items-center space-x-2">
        <img src="/favicon.png" alt="Echobit" class="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-contain" />
        <span class="text-xl sm:text-2xl font-bold text-white">Echobit</span>
      </router-link>
      <div class="flex items-center space-x-2 sm:space-x-4">
        <router-link to="/contact" class="text-white/70 hover:text-white transition px-3 py-2 text-sm hidden sm:block">
          Contact
        </router-link>
        <template v-if="authState.isAuthenticated">
          <router-link to="/dashboard" class="text-white/80 hover:text-white transition px-3 sm:px-4 py-2 text-sm sm:text-base hidden sm:block">
            Dashboard
          </router-link>
          <router-link to="/dashboard" class="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3 py-2 rounded-full transition text-sm font-medium">
            <div class="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-xs font-bold leading-none">
              {{ (authState.user?.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) }}
            </div>
            <span class="hidden sm:inline">{{ authState.user?.name?.split(' ')[0] }}</span>
          </router-link>
        </template>
        <template v-else>
          <router-link to="/login" class="text-white/80 hover:text-white transition px-3 sm:px-4 py-2 text-sm sm:text-base">
            Sign In
          </router-link>
          <router-link to="/register" class="bg-emerald-500 text-white px-4 sm:px-6 py-2 rounded-full font-semibold hover:bg-emerald-400 transition shadow-lg text-sm sm:text-base">
            Get Started
          </router-link>
        </template>
      </div>
    </div>
  </nav>

  <div class="bg-gradient-to-br from-black via-gray-900 to-emerald-950 min-h-screen overflow-x-hidden">

    <!-- Hero -->
    <section class="pt-40 pb-16 px-4 sm:px-6 text-center relative overflow-hidden">
      <div class="absolute inset-0 pointer-events-none overflow-hidden">
        <div class="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div class="absolute -bottom-20 -left-40 w-80 h-80 bg-green-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
      </div>
      <div class="relative z-10 max-w-3xl mx-auto">
        <div class="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/80 text-sm mb-6">
          <span class="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
          Simple, transparent pricing
        </div>
        <h1 class="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
          Plans for every
          <span class="bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent"> need</span>
        </h1>
        <p class="text-lg sm:text-xl text-white/70 max-w-xl mx-auto">
          Start free and upgrade when you're ready. No credit card required.
        </p>

        <!-- Billing toggle -->
        <div class="flex items-center justify-center mt-8">
          <div class="flex bg-white/10 backdrop-blur-sm rounded-full p-1 border border-white/10">
            <button
              @click="annual = false"
              class="px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200"
              :class="!annual ? 'bg-white text-gray-900 shadow-md' : 'text-white/60 hover:text-white'"
            >
              Monthly
            </button>
            <button
              @click="annual = true"
              class="px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-2"
              :class="annual ? 'bg-white text-gray-900 shadow-md' : 'text-white/60 hover:text-white'"
            >
              Annual
              <span
                class="text-xs px-2 py-0.5 rounded-full border transition-all duration-200"
                :class="annual ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'"
              >Save up to 33%</span>
            </button>
          </div>
        </div>

        <!-- Coupon input -->
        <div class="flex items-center justify-center mt-6">
          <div class="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl px-4 py-2.5 w-full max-w-sm">
            <svg class="w-4 h-4 text-white/50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a2 2 0 012-2z" />
            </svg>
            <input
              v-model="couponInput"
              @keyup.enter="applyCoupon"
              placeholder="Coupon code"
              :disabled="couponApplied"
              class="flex-1 bg-transparent text-white placeholder-white/40 text-sm outline-none uppercase tracking-widest"
            />
            <button
              v-if="!couponApplied"
              @click="applyCoupon"
              :disabled="!couponInput.trim() || couponValidating"
              class="text-xs font-bold text-emerald-400 hover:text-emerald-300 disabled:opacity-40 transition shrink-0"
            >
              {{ couponValidating ? '…' : 'Apply' }}
            </button>
            <button
              v-else
              @click="removeCoupon"
              class="text-xs font-bold text-red-400 hover:text-red-300 transition shrink-0"
            >
              Remove
            </button>
          </div>
        </div>
        <div v-if="couponError" class="text-red-400 text-xs text-center mt-2">{{ couponError }}</div>
        <div v-if="couponApplied" class="flex items-center justify-center gap-1.5 mt-2">
          <span class="inline-flex items-center gap-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
            {{ couponApplied.discountType === 'percent' ? couponApplied.discountValue + '% off' : '₹' + (couponApplied.discountValue / 100) + ' off' }} applied
          </span>
        </div>
      </div>
    </section>

    <!-- Pricing Cards -->
    <section class="pb-24 px-4 sm:px-6">
      <div class="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">

        <!-- FREE -->
        <div class="relative bg-white/5 backdrop-blur-sm border rounded-3xl p-7 flex flex-col transition-all duration-300 hover:-translate-y-1"
          :class="isCurrentPlan('free') ? 'border-white/30 hover:border-white/40' : 'border-white/10 hover:border-white/20'">
          <div v-if="isCurrentPlan('free')" class="absolute -top-4 left-1/2 -translate-x-1/2">
            <span class="bg-white/20 backdrop-blur text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
              Your Plan
            </span>
          </div>
          <div class="mb-5">
            <div class="w-11 h-11 bg-white/10 rounded-2xl flex items-center justify-center mb-3">
              <svg class="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <h3 class="text-lg font-bold text-white mb-0.5">Free</h3>
            <p class="text-white/50 text-xs">Try it out, no card needed</p>
          </div>
          <div class="mb-5">
            <div class="flex items-end gap-1">
              <span class="text-4xl font-bold text-white">₹0</span>
              <span class="text-white/50 mb-1.5">/mo</span>
            </div>
          </div>
          <ul class="space-y-2.5 flex-1 mb-7">
            <li v-for="f in freeFeatures" :key="f.text" :class="['flex items-start gap-2.5 text-sm', f.included ? 'text-white/70' : 'text-white/30']">
              <svg v-if="f.included" class="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
              <svg v-else class="w-4 h-4 text-white/25 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              {{ f.text }}
            </li>
          </ul>
          <div v-if="isCurrentPlan('free')" class="rounded-2xl bg-white/5 border border-white/20 px-4 py-3 text-center">
            <div class="flex items-center justify-center gap-2 text-white/70 font-semibold text-sm">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              Current Plan
            </div>
          </div>
          <router-link v-else to="/register" class="block text-center py-3 rounded-2xl border border-white/20 text-white/80 font-semibold hover:bg-white/10 transition text-sm">
            Get Started Free
          </router-link>
        </div>

        <!-- STARTER -->
        <div class="relative bg-white/5 backdrop-blur-sm border rounded-3xl p-7 flex flex-col transition-all duration-300 hover:-translate-y-1"
          :class="isCurrentPlan('starter') ? 'border-blue-400/50 hover:border-blue-400/70' : 'border-white/10 hover:border-white/20'">
          <div v-if="isCurrentPlan('starter')" class="absolute -top-4 left-1/2 -translate-x-1/2">
            <span class="bg-blue-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
              Your Plan
            </span>
          </div>
          <div class="mb-5">
            <div class="w-11 h-11 bg-blue-500/15 rounded-2xl flex items-center justify-center mb-3">
              <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h3 class="text-lg font-bold text-white mb-0.5">Starter</h3>
            <p class="text-white/50 text-xs">For regular users</p>
          </div>
          <div class="mb-5">
            <div class="flex items-end gap-1.5">
              <span v-if="couponApplied" class="text-2xl font-bold text-white/40 line-through">{{ annual ? starterAnnualMo : starterMonthly }}</span>
              <span class="text-4xl font-bold text-white">{{ couponApplied ? applyDiscount(annual ? starterAnnualMo : starterMonthly) : (annual ? starterAnnualMo : starterMonthly) }}</span>
              <span class="text-white/50 mb-1.5">/mo</span>
            </div>
            <p v-if="annual" class="text-blue-400 text-xs mt-1">Billed {{ starterAnnualTt }}/year</p>
          </div>
          <ul class="space-y-2.5 flex-1 mb-7">
            <li v-for="f in starterFeatures" :key="f.text" :class="['flex items-start gap-2.5 text-sm', f.included ? 'text-white/70' : 'text-white/30']">
              <svg v-if="f.included" class="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
              <svg v-else class="w-4 h-4 text-white/25 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              {{ f.text }}
            </li>
          </ul>
          <div v-if="isCurrentPlan('starter')" class="rounded-2xl bg-blue-500/10 border border-blue-500/30 px-4 py-3 text-center">
            <div class="flex items-center justify-center gap-2 text-blue-300 font-semibold text-sm">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              Current Plan
            </div>
            <p class="text-xs text-white/40 mt-1">{{ subscription.daysRemaining }}d remaining · expires {{ expiryLabel }}</p>
          </div>
          <button v-else
            @click="pay(annual ? 'starter_annual' : 'starter_monthly')"
            :disabled="paying"
            class="block w-full text-center py-3 rounded-2xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 font-semibold transition text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {{ paying && activePlan?.startsWith('starter') ? 'Processing…' : 'Get Starter' }}
          </button>
        </div>

        <!-- PRO (highlighted) -->
        <div class="relative bg-gradient-to-b from-emerald-500/20 to-emerald-600/10 backdrop-blur-sm border border-emerald-500/40 rounded-3xl p-7 flex flex-col hover:-translate-y-2 transition-all duration-300 shadow-2xl shadow-emerald-500/10">
          <div class="absolute -top-4 left-1/2 -translate-x-1/2">
            <span v-if="isCurrentPlan('pro')" class="bg-emerald-400 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
              Your Plan
            </span>
            <span v-else class="bg-emerald-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">Most Popular</span>
          </div>
          <div class="mb-5">
            <div class="w-11 h-11 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-3">
              <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 class="text-lg font-bold text-white mb-0.5">Pro</h3>
            <p class="text-white/50 text-xs">For power users</p>
          </div>
          <div class="mb-5">
            <div class="flex items-end gap-1.5">
              <span v-if="couponApplied" class="text-2xl font-bold text-white/40 line-through">{{ annual ? proAnnualMo : proMonthly }}</span>
              <span class="text-4xl font-bold text-white">{{ couponApplied ? applyDiscount(annual ? proAnnualMo : proMonthly) : (annual ? proAnnualMo : proMonthly) }}</span>
              <span class="text-white/50 mb-1.5">/mo</span>
            </div>
            <p v-if="annual" class="text-emerald-400 text-xs mt-1">Billed {{ proAnnualTt }}/year</p>
          </div>
          <ul class="space-y-2.5 flex-1 mb-7">
            <li v-for="f in proFeatures" :key="f.text" :class="['flex items-start gap-2.5 text-sm', f.included ? 'text-white/80' : 'text-white/30']">
              <svg v-if="f.included" class="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
              <svg v-else class="w-4 h-4 text-white/25 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              {{ f.text }}
            </li>
          </ul>
          <div v-if="isCurrentPlan('pro')" class="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-center">
            <div class="flex items-center justify-center gap-2 text-emerald-300 font-semibold text-sm">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              Current Plan
            </div>
            <p class="text-xs text-white/40 mt-1">{{ subscription.daysRemaining }}d remaining · expires {{ expiryLabel }}</p>
          </div>
          <button v-else
            @click="pay(annual ? 'pro_annual' : 'pro_monthly')"
            :disabled="paying"
            class="block w-full text-center py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold transition shadow-lg shadow-emerald-500/30 disabled:opacity-60 disabled:cursor-not-allowed text-sm"
          >
            {{ paying && activePlan?.startsWith('pro') ? 'Processing…' : 'Get Pro' }}
          </button>
        </div>

        <!-- GROWTH -->
        <div class="relative bg-gradient-to-b from-purple-500/15 to-purple-600/5 backdrop-blur-sm border rounded-3xl p-7 flex flex-col transition-all duration-300 hover:-translate-y-1"
          :class="isCurrentPlan('growth') ? 'border-purple-400/60' : 'border-purple-500/20 hover:border-purple-500/40'">
          <div v-if="isCurrentPlan('growth')" class="absolute -top-4 left-1/2 -translate-x-1/2">
            <span class="bg-purple-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
              Your Plan
            </span>
          </div>
          <div class="mb-5">
            <div class="w-11 h-11 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-3">
              <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 class="text-lg font-bold text-white mb-0.5">Growth</h3>
            <p class="text-white/50 text-xs">Unlimited power</p>
          </div>
          <div class="mb-5">
            <div class="flex items-end gap-1.5">
              <span v-if="couponApplied" class="text-2xl font-bold text-white/40 line-through">{{ annual ? growthAnnualMo : growthMonthly }}</span>
              <span class="text-4xl font-bold text-white">{{ couponApplied ? applyDiscount(annual ? growthAnnualMo : growthMonthly) : (annual ? growthAnnualMo : growthMonthly) }}</span>
              <span class="text-white/50 mb-1.5">/mo</span>
            </div>
            <p v-if="annual" class="text-purple-400 text-xs mt-1">Billed {{ growthAnnualTt }}/year</p>
          </div>
          <ul class="space-y-2.5 flex-1 mb-7">
            <li v-for="f in growthFeatures" :key="f.text" :class="['flex items-start gap-2.5 text-sm', f.included ? 'text-white/80' : 'text-white/30']">
              <svg v-if="f.included" class="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
              <svg v-else class="w-4 h-4 text-white/25 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              {{ f.text }}
            </li>
          </ul>
          <div v-if="isCurrentPlan('growth')" class="rounded-2xl bg-purple-500/10 border border-purple-500/30 px-4 py-3 text-center">
            <div class="flex items-center justify-center gap-2 text-purple-300 font-semibold text-sm">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              Current Plan
            </div>
            <p class="text-xs text-white/40 mt-1">{{ subscription.daysRemaining }}d remaining · expires {{ expiryLabel }}</p>
          </div>
          <button v-else
            @click="pay(annual ? 'growth_annual' : 'growth_monthly')"
            :disabled="paying"
            class="block w-full text-center py-3 rounded-2xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 font-semibold transition text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {{ paying && activePlan?.startsWith('growth') ? 'Processing…' : 'Get Growth' }}
          </button>
        </div>

      </div>
    </section>

    <!-- Feature Comparison -->
    <section class="pb-24 px-4 sm:px-6">
      <div class="max-w-5xl mx-auto">
        <h2 class="text-2xl sm:text-3xl font-bold text-white text-center mb-12">Full feature comparison</h2>

        <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl overflow-hidden overflow-x-auto">
          <!-- Header -->
          <div class="grid grid-cols-5 min-w-[600px] px-6 py-4 border-b border-white/10 text-sm font-semibold">
            <div class="text-white/50">Feature</div>
            <div class="text-center text-white/70">Free</div>
            <div class="text-center text-blue-400">Starter</div>
            <div class="text-center text-emerald-400">Pro</div>
            <div class="text-center text-purple-400">Growth</div>
          </div>

          <!-- Rows -->
          <div v-for="(row, i) in comparison" :key="i"
               class="grid grid-cols-5 min-w-[600px] px-6 py-4 text-sm"
               :class="i % 2 === 0 ? '' : 'bg-white/[0.02]'">
            <div class="text-white/60">{{ row.feature }}</div>
            <div v-for="col in ['free', 'starter', 'pro', 'growth']" :key="col" class="text-center">
              <span v-if="row[col] === true">
                <svg class="w-5 h-5 text-emerald-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span v-else-if="row[col] === false">
                <svg class="w-5 h-5 text-white/20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </span>
              <span v-else :class="col === 'pro' ? 'text-emerald-400 font-medium' : col === 'growth' ? 'text-purple-400 font-medium' : col === 'starter' ? 'text-blue-400 font-medium' : 'text-white/60'">{{ row[col] }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="pb-24 px-4 sm:px-6">
      <div class="max-w-2xl mx-auto">
        <h2 class="text-2xl sm:text-3xl font-bold text-white text-center mb-12">Frequently asked questions</h2>
        <div class="space-y-4">
          <div v-for="(faq, i) in faqs" :key="i"
               class="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <button
              class="w-full flex items-center justify-between px-6 py-5 text-left"
              @click="openFaq = openFaq === i ? -1 : i"
            >
              <span class="text-white font-medium">{{ faq.q }}</span>
              <svg class="w-5 h-5 text-white/50 flex-shrink-0 transition-transform duration-200"
                   :class="openFaq === i ? 'rotate-180' : ''"
                   fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div v-if="openFaq === i" class="px-6 pb-5 text-white/60 text-sm leading-relaxed">
              {{ faq.a }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="pb-32 px-4 sm:px-6 text-center">
      <div class="max-w-2xl mx-auto bg-gradient-to-br from-emerald-500/10 to-green-600/5 border border-emerald-500/20 rounded-3xl p-12">
        <h2 class="text-3xl sm:text-4xl font-bold text-white mb-4">
          {{ authState.isAuthenticated ? 'Ready to do more?' : 'Start for free today' }}
        </h2>
        <p class="text-white/60 mb-8">
          {{ authState.isAuthenticated ? 'Upgrade your plan anytime from your dashboard.' : 'No credit card required. Upgrade anytime.' }}
        </p>
        <router-link :to="authState.isAuthenticated ? '/dashboard' : '/register'"
          class="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-4 rounded-full font-semibold text-lg transition shadow-xl shadow-emerald-500/30">
          {{ authState.isAuthenticated ? 'Go to Dashboard' : 'Create Free Account' }}
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </router-link>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-white/5 px-4 sm:px-6 py-8">
      <div class="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        <div class="flex items-center space-x-2">
          <img src="/favicon.png" alt="Echobit" class="w-7 h-7 rounded-lg object-contain" />
          <span class="text-white/70 font-semibold">Echobit</span>
        </div>
        <div class="flex items-center gap-6 text-white/40 text-sm">
          <router-link to="/privacy-policy" class="hover:text-white/70 transition">Privacy</router-link>
          <router-link to="/contact" class="hover:text-white/70 transition">Contact</router-link>
          <router-link to="/request-deletion" class="hover:text-white/70 transition">Data Deletion</router-link>
        </div>
        <p class="text-white/30 text-sm">&copy; 2025 Echobit. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { paymentsApi, authApi, authState, plansApi } from '@/api';
import { useRouter } from 'vue-router';

const annual = ref(false);
const openFaq = ref(-1);
const router = useRouter();

const paying = ref(false);
const activePlan = ref<string | null>(null);
const paymentStatus = ref<{ type: 'success' | 'error'; message: string } | null>(null);

// Coupon
const couponInput = ref('');
const couponValidating = ref(false);
const couponError = ref('');
const couponApplied = ref<{ discountType: string; discountValue: number } | null>(null);

async function applyCoupon() {
  const code = couponInput.value.trim();
  if (!code) return;
  couponValidating.value = true;
  couponError.value = '';
  // Try all paid plans — coupon may be restricted to a specific one
  const plansToTry = ['pro_monthly', 'starter_monthly', 'growth_monthly', 'pro_annual', 'starter_annual', 'growth_annual'];
  let lastError = 'Invalid coupon code';
  for (const plan of plansToTry) {
    try {
      const res = await paymentsApi.validateCoupon(code, plan);
      couponApplied.value = { discountType: res.discountType, discountValue: res.discountValue };
      couponValidating.value = false;
      return;
    } catch (err: any) {
      lastError = err.message || lastError;
    }
  }
  couponError.value = lastError;
  couponApplied.value = null;
  couponValidating.value = false;
}

function removeCoupon() {
  couponApplied.value = null;
  couponInput.value = '';
  couponError.value = '';
}

function applyDiscount(priceStr: string): string {
  if (!couponApplied.value || !priceStr) return priceStr;
  const num = parseFloat(priceStr.replace(/[₹,]/g, ''));
  if (isNaN(num)) return priceStr;
  const paise = Math.round(num * 100);
  let final = paise;
  if (couponApplied.value.discountType === 'percent') {
    final = Math.round(paise * (1 - couponApplied.value.discountValue / 100));
  } else {
    final = Math.max(0, paise - couponApplied.value.discountValue);
  }
  return '₹' + Math.round(final / 100);
}

function buildSubFromUser(user: any) {
  if (!user) return null;
  const exp = user.planExpiresAt;
  const active = user.plan && user.plan !== 'free' && exp && new Date(exp) > new Date();
  return {
    plan: user.plan || 'free',
    isActive: !!active,
    daysRemaining: active ? Math.ceil((new Date(exp).getTime() - Date.now()) / 86400000) : 0,
    planExpiresAt: exp || null,
    planBillingCycle: user.planBillingCycle || null,
  };
}

const subscription = ref(
  buildSubFromUser(authState.user) ?? { plan: 'free', isActive: false, daysRemaining: 0, planExpiresAt: null as string | null, planBillingCycle: null as string | null }
);

const isCurrentPlan = (tier: string) => {
  if (tier === 'free') return !subscription.value.isActive;
  return subscription.value.plan === tier && subscription.value.isActive;
};

const expiryLabel = computed(() => {
  if (!subscription.value.planExpiresAt) return '';
  return new Date(subscription.value.planExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
});

onMounted(async () => {
  // Auto-login when coming from the mobile app (?token=...)
  const params = new URLSearchParams(window.location.search);
  const appToken = params.get('token');
  if (appToken) {
    // Always attempt login with the app token — it's fresher than any cached session
    await authApi.loginWithToken(appToken);
    // Strip token from URL immediately so it doesn't sit in browser history
    params.delete('token');
    const clean = params.toString() ? `${window.location.pathname}?${params}` : window.location.pathname;
    window.history.replaceState({}, '', clean);
  }

  // Load admin-editable plan features
  try {
    const data = await plansApi.getAll();
    planData.value = data;
  } catch { /* keep empty defaults */ }

  if (authState.isAuthenticated) {
    try { subscription.value = await paymentsApi.getStatus(); } catch { /* keep default */ }
  }
});

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).Razorpay) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout'));
    document.head.appendChild(script);
  });
}

const PLAN_LABELS: Record<string, string> = {
  starter_monthly: 'Echobit Starter – Monthly',
  starter_annual:  'Echobit Starter – Annual',
  pro_monthly:     'Echobit Pro – Monthly',
  pro_annual:      'Echobit Pro – Annual',
  growth_monthly:  'Echobit Growth – Monthly',
  growth_annual:   'Echobit Growth – Annual',
};

async function pay(plan: string) {
  if (!authState.isAuthenticated) {
    router.push('/login');
    return;
  }

  paying.value = true;
  activePlan.value = plan;
  paymentStatus.value = null;

  try {
    await loadRazorpayScript();

    const order = await paymentsApi.createOrder(plan, couponApplied.value ? couponInput.value.trim() : undefined);

    if (order.mock) {
      paymentStatus.value = { type: 'success', message: `[Mock] ${PLAN_LABELS[plan]} order created (ID: ${order.order_id}). Razorpay keys pending activation.` };
      paying.value = false;
      activePlan.value = null;
      return;
    }

    const options: Record<string, any> = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: 'Echobit',
      description: order.description || PLAN_LABELS[plan],
      image: '/favicon.png',
      order_id: order.order_id,
      prefill: {
        name: authState.user?.name || '',
        email: authState.user?.email || '',
      },
      theme: { color: '#10b981' },
      config_id: import.meta.env.VITE_RAZORPAY_CONFIG_ID || undefined,
      webview_intent: true,
      handler: async (response: any) => {
        try {
          await paymentsApi.verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          }, plan);
          paymentStatus.value = { type: 'success', message: `Payment successful! Your ${PLAN_LABELS[plan]} plan is now active.` };
          try {
            const status = await paymentsApi.getStatus();
            subscription.value = status;
            if (authState.user) {
              authState.user.plan = status.plan;
              authState.user.planExpiresAt = status.planExpiresAt;
              authState.user.planBillingCycle = status.planBillingCycle;
              localStorage.setItem('user', JSON.stringify(authState.user));
            }
          } catch { /* ignore */ }
        } catch {
          paymentStatus.value = { type: 'error', message: 'Payment received but verification failed. Please contact support.' };
        } finally {
          paying.value = false;
          activePlan.value = null;
        }
      },
      modal: {
        ondismiss() {
          paying.value = false;
          activePlan.value = null;
        },
      },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.on('payment.failed', (response: any) => {
      paymentStatus.value = { type: 'error', message: response.error?.description || 'Payment failed. Please try again.' };
      paying.value = false;
      activePlan.value = null;
    });
    rzp.open();
  } catch (err: any) {
    paymentStatus.value = { type: 'error', message: err.message || 'Could not initiate payment. Please try again.' };
    paying.value = false;
    activePlan.value = null;
  }
}

// auto-dismiss payment toast after 6 s
let toastTimer: ReturnType<typeof setTimeout> | null = null;
watch(paymentStatus, (val) => {
  if (toastTimer) clearTimeout(toastTimer);
  if (val) toastTimer = setTimeout(() => { paymentStatus.value = null; }, 6000);
});

// Plan data loaded from API (admin-editable features + prices)
type PlanData = { features: { text: string; included: boolean }[]; monthlyPrice: string; annualMonthly: string; annualTotal: string; gates?: { maxDurationMins?: number | null; recordingsPerMonth?: number | null; maxStorageGB?: number | null } };
const planData = ref<Record<string, PlanData>>({});
const freeFeatures    = computed(() => planData.value.free?.features    ?? []);
const starterFeatures = computed(() => planData.value.starter?.features ?? []);
const proFeatures     = computed(() => planData.value.pro?.features     ?? []);
const growthFeatures  = computed(() => planData.value.growth?.features  ?? []);

const pd = (key: string): PlanData => planData.value[key] ?? { features: [], monthlyPrice: '', annualMonthly: '', annualTotal: '' };
const starterMonthly  = computed(() => pd('starter').monthlyPrice  || '₹149');
const starterAnnualMo = computed(() => pd('starter').annualMonthly || '₹99');
const starterAnnualTt = computed(() => pd('starter').annualTotal   || '₹1,188');
const proMonthly      = computed(() => pd('pro').monthlyPrice      || '₹499');
const proAnnualMo     = computed(() => pd('pro').annualMonthly     || '₹399');
const proAnnualTt     = computed(() => pd('pro').annualTotal       || '₹4,788');
const growthMonthly   = computed(() => pd('growth').monthlyPrice   || '₹999');
const growthAnnualMo  = computed(() => pd('growth').annualMonthly  || '₹799');
const growthAnnualTt  = computed(() => pd('growth').annualTotal    || '₹9,588');

function fmtMins(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = mins / 60;
  return `${h % 1 === 0 ? h : h.toFixed(1)} hour${h !== 1 ? 's' : ''}`;
}

const comparison = computed(() => {
  const gates = (plan: string) => planData.value[plan]?.gates ?? {};
  const dur = (plan: string, fallbackMins: number): string => {
    const m = gates(plan).maxDurationMins;
    return fmtMins(m != null ? m : fallbackMins);
  };
  return [
    { feature: 'Recordings / month',    free: '3',        starter: '15',       pro: '40',        growth: 'Unlimited' },
    { feature: 'Max recording length',  free: dur('free', 20), starter: dur('starter', 45), pro: dur('pro', 120), growth: dur('growth', 180) },
    { feature: 'AI Transcription',      free: true,       starter: true,       pro: true,        growth: true        },
    { feature: 'Languages',             free: 'Eng+Mal',  starter: '3 langs',  pro: '15+',       growth: '20+'       },
    { feature: 'AI Summary',            free: true,       starter: true,       pro: true,        growth: true        },
    { feature: 'AI Notes',              free: false,      starter: true,       pro: true,        growth: true        },
    { feature: 'Meeting Minutes',       free: false,      starter: false,      pro: true,        growth: true        },
    { feature: 'Action Items',          free: false,      starter: false,      pro: true,        growth: true        },
    { feature: 'PDF Export',            free: false,      starter: false,      pro: true,        growth: true        },
    { feature: 'Priority Processing',   free: false,      starter: false,      pro: true,        growth: true        },
    { feature: 'Priority Support',      free: false,      starter: false,      pro: false,       growth: true        },
    { feature: 'Storage',               free: '1 GB',     starter: '3 GB',     pro: '10 GB',     growth: '25 GB'     },
  ];
});

const faqs = [
  {
    q: 'Is the free plan really free forever?',
    a: 'Yes! The free plan is free forever with no credit card required. You get unlimited recordings (up to 20 min each) and basic AI features to explore what Echobit can do.',
  },
  {
    q: 'Can I change or cancel my plan anytime?',
    a: 'Absolutely. You can upgrade, downgrade, or cancel at any time from your account settings. Upgrades take effect immediately.',
  },
  {
    q: 'What languages are supported?',
    a: 'English and Malayalam are available on Free. Starter adds Hindi. Pro unlocks 15+ languages and Growth unlocks 20+ languages including Tamil, Telugu, Bengali, Kannada, Marathi, Gujarati, Punjabi, and more.',
  },
  {
    q: 'How does annual billing work?',
    get a() {
      return `Annual plans are billed as a single payment upfront — Starter at ${starterAnnualTt.value}/yr, Pro at ${proAnnualTt.value}/yr, and Growth at ${growthAnnualTt.value}/yr — saving you up to 33% versus monthly billing.`;
    },
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. Your recordings and transcripts are stored securely and are only accessible to you. We never sell your data. See our Privacy Policy for full details.',
  },
];
</script>
