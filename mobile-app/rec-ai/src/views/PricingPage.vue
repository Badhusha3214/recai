<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="pricing-page">

        <!-- Header -->
        <header class="page-header">
          <button class="back-btn" @click="router.back()">
            <ion-icon :icon="chevronBackOutline"></ion-icon>
          </button>
          <h1>Plans & Pricing</h1>
          <div style="width: 42px;"></div>
        </header>

        <!-- Hero -->
        <div class="pricing-hero">
          <div class="hero-badge">
            <ion-icon :icon="flashOutline"></ion-icon>
            <span>Upgrade Today</span>
          </div>
          <h2>Unlock the full<br>power of Echobits</h2>
          <p>Transcribe more, export smarter, collaborate better.</p>
        </div>

        <!-- Current Plan Badge -->
        <div class="current-plan-row" v-if="currentPlan !== 'free'">
          <ion-icon :icon="checkmarkCircleOutline" class="cp-icon"></ion-icon>
          <span>You're on the <strong>{{ PLAN_LABELS[currentPlan] || currentPlan }}</strong> plan</span>
          <span v-if="daysRemaining > 0" class="cp-days">{{ daysRemaining }}d left</span>
        </div>

        <!-- Billing Toggle -->
        <div class="billing-toggle">
          <button :class="{ active: cycle === 'monthly' }" @click="cycle = 'monthly'">Monthly</button>
          <button :class="{ active: cycle === 'annual' }" @click="cycle = 'annual'">
            Annual
            <span class="save-badge">Save 33%</span>
          </button>
        </div>

        <!-- Plan Cards -->
        <div class="plans-list">

          <!-- Free -->
          <div class="plan-card" :class="{ current: currentPlan === 'free' }">
            <div class="plan-header">
              <div class="plan-icon free-icon">
                <ion-icon :icon="personOutline"></ion-icon>
              </div>
              <div class="plan-title-group">
                <span class="plan-name">Free</span>
                <span class="plan-tagline">Try it out</span>
              </div>
              <div class="plan-price-group">
                <span class="plan-price">₹0</span>
                <span class="plan-per">forever</span>
              </div>
            </div>
            <ul class="feature-list">
              <li v-for="f in freeFeatures" :key="f.text" :class="{ disabled: !f.included }">
                <ion-icon :icon="f.included ? checkmarkOutline : closeOutline"></ion-icon>
                <span>{{ f.text }}</span>
              </li>
            </ul>
            <button class="plan-btn free-btn" disabled>
              {{ currentPlan === 'free' ? 'Current Plan' : 'Free' }}
            </button>
          </div>

          <!-- Starter -->
          <div class="plan-card" :class="{ current: currentPlan === 'starter' }">
            <div class="plan-header">
              <div class="plan-icon starter-icon">
                <ion-icon :icon="sparklesOutline"></ion-icon>
              </div>
              <div class="plan-title-group">
                <span class="plan-name">Starter</span>
                <span class="plan-tagline">For regular users</span>
              </div>
              <div class="plan-price-group">
                <span class="plan-price">{{ cycle === 'monthly' ? starterMonthly : starterAnnualMo }}</span>
                <span class="plan-per">/mo</span>
              </div>
            </div>
            <p v-if="cycle === 'annual'" class="annual-note">Billed {{ starterAnnualTt }}/year</p>
            <ul class="feature-list">
              <li v-for="f in starterFeatures" :key="f.text" :class="{ disabled: !f.included }">
                <ion-icon :icon="f.included ? checkmarkOutline : closeOutline"></ion-icon>
                <span>{{ f.text }}</span>
              </li>
            </ul>
            <button class="plan-btn starter-btn" @click="subscribe('starter')" :disabled="currentPlan === 'starter'">
              {{ currentPlan === 'starter' ? 'Current Plan' : 'Get Starter' }}
            </button>
          </div>

          <!-- Pro — highlighted -->
          <div class="plan-card pro-card" :class="{ current: currentPlan === 'pro' }">
            <div class="popular-tag">Most Popular</div>
            <div class="plan-header">
              <div class="plan-icon pro-icon">
                <ion-icon :icon="flashOutline"></ion-icon>
              </div>
              <div class="plan-title-group">
                <span class="plan-name">Pro</span>
                <span class="plan-tagline">For power users</span>
              </div>
              <div class="plan-price-group">
                <span class="plan-price">{{ cycle === 'monthly' ? proMonthly : proAnnualMo }}</span>
                <span class="plan-per">/mo</span>
              </div>
            </div>
            <p v-if="cycle === 'annual'" class="annual-note">Billed {{ proAnnualTt }}/year</p>
            <ul class="feature-list">
              <li v-for="f in proFeatures" :key="f.text" :class="{ disabled: !f.included }">
                <ion-icon :icon="f.included ? checkmarkOutline : closeOutline"></ion-icon>
                <span>{{ f.text }}</span>
              </li>
            </ul>
            <button class="plan-btn pro-btn" @click="subscribe('pro')" :disabled="currentPlan === 'pro'">
              {{ currentPlan === 'pro' ? 'Current Plan' : 'Get Pro' }}
            </button>
          </div>

          <!-- Growth -->
          <div class="plan-card" :class="{ current: currentPlan === 'growth' }">
            <div class="plan-header">
              <div class="plan-icon growth-icon">
                <ion-icon :icon="trendingUpOutline"></ion-icon>
              </div>
              <div class="plan-title-group">
                <span class="plan-name">Growth</span>
                <span class="plan-tagline">Unlimited power</span>
              </div>
              <div class="plan-price-group">
                <span class="plan-price">{{ cycle === 'monthly' ? growthMonthly : growthAnnualMo }}</span>
                <span class="plan-per">/mo</span>
              </div>
            </div>
            <p v-if="cycle === 'annual'" class="annual-note">Billed {{ growthAnnualTt }}/year</p>
            <ul class="feature-list">
              <li v-for="f in growthFeatures" :key="f.text" :class="{ disabled: !f.included }">
                <ion-icon :icon="f.included ? checkmarkOutline : closeOutline"></ion-icon>
                <span>{{ f.text }}</span>
              </li>
            </ul>
            <button class="plan-btn growth-btn" @click="subscribe('growth')" :disabled="currentPlan === 'growth'">
              {{ currentPlan === 'growth' ? 'Current Plan' : 'Get Growth' }}
            </button>
          </div>

        </div>

        <!-- Footnote -->
        <p class="footnote">
          Payment is processed securely on our website. Cancel anytime.
        </p>

      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonContent, IonIcon } from '@ionic/vue';
import {
  chevronBackOutline, flashOutline, personOutline,
  checkmarkOutline, closeOutline, checkmarkCircleOutline,
  sparklesOutline, trendingUpOutline
} from 'ionicons/icons';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/services/api';

const router = useRouter();
const authStore = useAuthStore();

const PLAN_LABELS: Record<string, string> = {
  free: 'Free', starter: 'Starter', pro: 'Pro', growth: 'Growth', team: 'Team',
};

const cycle = ref<'monthly' | 'annual'>('monthly');
const user = computed(() => authStore.user);
const currentPlan = computed(() => user.value?.plan || 'free');

const daysRemaining = computed(() => {
  if (!user.value?.planExpiresAt) return 0;
  const diff = new Date(user.value.planExpiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

type Feature = { text: string; included: boolean };
type PlanData = { features: Feature[]; monthlyPrice: string; annualMonthly: string; annualTotal: string };

const DEFAULT_FEATURES: Record<string, Feature[]> = {
  free: [
    { text: 'Unlimited recordings',                   included: true  },
    { text: 'Up to 20 min per recording',             included: true  },
    { text: 'AI transcription (English + Malayalam)', included: true  },
    { text: 'Basic AI summary',                       included: true  },
    { text: 'Meeting minutes',                        included: false },
    { text: 'Action items',                           included: false },
    { text: 'PDF export',                             included: false },
  ],
  starter: [
    { text: 'Unlimited recordings',                            included: true  },
    { text: 'Up to 45 min per recording',                     included: true  },
    { text: 'AI transcription (English + Hindi + Malayalam)', included: true  },
    { text: 'AI summary + notes',                             included: true  },
    { text: 'Meeting minutes',                                included: false },
    { text: 'Action items',                                   included: false },
    { text: 'PDF export',                                     included: false },
  ],
  pro: [
    { text: 'Unlimited recordings',           included: true  },
    { text: 'Up to 2 hours per recording',    included: true  },
    { text: 'AI transcription (15+ languages)', included: true },
    { text: 'AI summary + meeting minutes',   included: true  },
    { text: 'Action item extraction',         included: true  },
    { text: 'PDF export',                     included: true  },
    { text: 'Priority processing',            included: true  },
  ],
  growth: [
    { text: 'Unlimited recordings',             included: true },
    { text: 'Up to 3 hours per recording',      included: true },
    { text: 'AI transcription (20+ languages)', included: true },
    { text: 'Everything in Pro',                included: true },
    { text: '25 GB storage',                    included: true },
    { text: 'Priority processing + support',    included: true },
  ],
};

const plans = ref<Record<string, PlanData>>({});

const freeFeatures    = computed(() => plans.value.free?.features    ?? DEFAULT_FEATURES.free);
const starterFeatures = computed(() => plans.value.starter?.features ?? DEFAULT_FEATURES.starter);
const proFeatures     = computed(() => plans.value.pro?.features     ?? DEFAULT_FEATURES.pro);
const growthFeatures  = computed(() => plans.value.growth?.features  ?? DEFAULT_FEATURES.growth);

const starterMonthly  = computed(() => plans.value.starter?.monthlyPrice  || '₹149');
const starterAnnualMo = computed(() => plans.value.starter?.annualMonthly || '₹99');
const starterAnnualTt = computed(() => plans.value.starter?.annualTotal   || '₹1,188');
const proMonthly      = computed(() => plans.value.pro?.monthlyPrice      || '₹499');
const proAnnualMo     = computed(() => plans.value.pro?.annualMonthly     || '₹399');
const proAnnualTt     = computed(() => plans.value.pro?.annualTotal       || '₹4,788');
const growthMonthly   = computed(() => plans.value.growth?.monthlyPrice   || '₹999');
const growthAnnualMo  = computed(() => plans.value.growth?.annualMonthly  || '₹799');
const growthAnnualTt  = computed(() => plans.value.growth?.annualTotal    || '₹9,588');

onMounted(async () => {
  try {
    plans.value = await api.getPlans();
  } catch { /* keep defaults */ }
});

function subscribe(plan: 'starter' | 'pro' | 'growth') {
  const token = authStore.token;
  const url = `https://echobits.devmorphix.com/pricing?plan=${plan}&cycle=${cycle.value}&token=${token}`;
  window.open(url, '_blank');
}
</script>

<style scoped>
.pricing-page {
  padding: calc(var(--page-top) + 12px) 20px 48px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 18px;
  font-weight: 700;
  color: var(--app-text);
  margin: 0;
}

.back-btn {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--app-border);
  background: var(--app-surface);
  color: var(--app-text);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: var(--shadow-xs);
  transition: all var(--transition-fast);
}

.back-btn:active { transform: scale(0.93); }
.back-btn ion-icon { font-size: 22px; }

.pricing-hero {
  text-align: center;
  margin-bottom: 24px;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--app-primary-ultra-light);
  color: var(--app-primary);
  font-size: 12px;
  font-weight: 700;
  padding: 6px 14px;
  border-radius: var(--radius-full);
  margin-bottom: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.hero-badge ion-icon { font-size: 14px; }

.pricing-hero h2 {
  font-size: 26px;
  font-weight: 800;
  color: var(--app-text);
  line-height: 1.25;
  margin: 0 0 10px;
}

.pricing-hero p {
  font-size: 14px;
  color: var(--app-text-muted);
  margin: 0;
}

.current-plan-row {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--app-primary-ultra-light);
  border: 1px solid rgba(5, 150, 105, 0.15);
  border-radius: var(--radius-xl);
  padding: 12px 16px;
  margin-bottom: 20px;
  font-size: 14px;
  color: var(--app-text-secondary);
}

.cp-icon { font-size: 18px; color: var(--app-primary); flex-shrink: 0; }
.current-plan-row strong { color: var(--app-primary); }
.cp-days {
  margin-left: auto;
  font-size: 12px;
  font-weight: 700;
  color: var(--app-primary);
  background: var(--app-surface);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.billing-toggle {
  display: flex;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--radius-full);
  padding: 4px;
  margin-bottom: 24px;
  gap: 4px;
}

.billing-toggle button {
  flex: 1;
  height: 38px;
  border: none;
  border-radius: var(--radius-full);
  font-size: 14px;
  font-weight: 600;
  color: var(--app-text-muted);
  background: transparent;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.billing-toggle button.active {
  background: var(--app-gradient);
  color: white;
  box-shadow: var(--shadow-primary);
}

.save-badge {
  font-size: 10px;
  font-weight: 700;
  background: rgba(255,255,255,0.25);
  padding: 2px 6px;
  border-radius: var(--radius-full);
}

.billing-toggle button:not(.active) .save-badge {
  background: rgba(5, 150, 105, 0.12);
  color: var(--app-primary);
}

.plans-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.plan-card {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--radius-2xl);
  padding: 20px;
  position: relative;
  box-shadow: var(--shadow-xs);
  transition: all var(--transition-base);
}

.plan-card.current {
  border-color: var(--app-primary);
  box-shadow: 0 0 0 1px var(--app-primary), var(--shadow-md);
}

.pro-card {
  border-color: var(--app-primary);
  box-shadow: var(--shadow-primary);
}

.popular-tag {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--app-gradient);
  color: white;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 14px;
  border-radius: var(--radius-full);
  letter-spacing: 0.4px;
  white-space: nowrap;
  box-shadow: var(--shadow-primary);
}

.plan-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.plan-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 20px;
}

.free-icon    { background: var(--app-surface-hover); color: var(--app-text-muted); }
.starter-icon { background: rgba(59, 130, 246, 0.1);  color: #3b82f6; }
.pro-icon     { background: var(--app-gradient); color: white; box-shadow: var(--shadow-primary); }
.growth-icon  { background: rgba(139, 92, 246, 0.1);  color: #8b5cf6; }

.plan-title-group { flex: 1; min-width: 0; }

.plan-name {
  display: block;
  font-size: 17px;
  font-weight: 800;
  color: var(--app-text);
  line-height: 1.2;
}

.plan-tagline {
  display: block;
  font-size: 12px;
  color: var(--app-text-muted);
  margin-top: 2px;
}

.plan-price-group { text-align: right; flex-shrink: 0; }

.plan-price {
  display: block;
  font-size: 22px;
  font-weight: 800;
  color: var(--app-text);
  line-height: 1.1;
}

.plan-per { font-size: 11px; color: var(--app-text-muted); }

.annual-note {
  font-size: 11px;
  color: var(--app-text-muted);
  margin: 2px 0 14px;
  text-align: right;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 14px 0 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.feature-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--app-text-secondary);
}

.feature-list li ion-icon {
  font-size: 16px;
  flex-shrink: 0;
  color: var(--app-primary);
}

.feature-list li.disabled { opacity: 0.4; }
.feature-list li.disabled ion-icon { color: var(--app-text-muted); }

.plan-btn {
  width: 100%;
  height: 48px;
  border-radius: var(--radius-full);
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  transition: all var(--transition-fast);
}

.plan-btn:active:not(:disabled) { transform: scale(0.97); }
.plan-btn:disabled { opacity: 0.55; cursor: default; }

.free-btn {
  background: var(--app-surface-hover);
  color: var(--app-text-muted);
  border: 1px solid var(--app-border);
}

.starter-btn {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.25);
}

.pro-btn {
  background: var(--app-gradient);
  color: white;
  box-shadow: var(--shadow-primary);
}

.growth-btn {
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
  border: 1px solid rgba(139, 92, 246, 0.25);
}

.footnote {
  text-align: center;
  font-size: 12px;
  color: var(--app-text-muted);
  margin: 24px 0 0;
  line-height: 1.5;
}
</style>
