<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="search-page">

        <!-- Header -->
        <header class="page-header">
          <h1>Search</h1>
          <p class="header-sub">Find recordings by what was said</p>
        </header>

        <!-- Search bar -->
        <div class="search-bar-wrap" :class="{ focused: inputFocused }">
          <ion-icon :icon="searchOutline" class="bar-icon" />
          <input
            ref="inputRef"
            v-model="query"
            type="text"
            placeholder="Type a word or phrase..."
            autocomplete="off"
            autocorrect="off"
            spellcheck="false"
            @focus="inputFocused = true"
            @blur="inputFocused = false"
          />
          <button v-if="query" class="clear-btn" @click="query = ''">
            <ion-icon :icon="closeCircleOutline" />
          </button>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="state-wrap">
          <div class="spinner"></div>
          <p>Searching transcripts…</p>
        </div>

        <!-- Empty (no query yet) -->
        <div v-else-if="!query" class="state-wrap">
          <div class="state-icon-wrap">
            <ion-icon :icon="chatbubblesOutline" />
          </div>
          <h3>Search your recordings</h3>
          <p>Find any word or phrase spoken in your meetings</p>
        </div>

        <!-- No results -->
        <div v-else-if="results.length === 0 && hasSearched" class="state-wrap">
          <div class="state-icon-wrap dim">
            <ion-icon :icon="searchOutline" />
          </div>
          <h3>No results</h3>
          <p>No recordings mention "{{ query }}"</p>
        </div>

        <!-- Results -->
        <div v-else class="results-list">
          <div
            v-for="result in results"
            :key="result._id"
            class="result-card"
            @click="openRecording(result._id)"
          >
            <div class="result-meta">
              <span class="result-title">{{ result.title }}</span>
              <span class="result-date">{{ formatDate(result.createdAt) }}</span>
            </div>
            <p v-if="result.snippet" class="result-snippet" v-html="highlight(result.snippet, query)" />
            <p v-else class="result-snippet dim">Title match</p>
          </div>
        </div>

      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonContent, IonIcon, onIonViewWillEnter } from '@ionic/vue';
import { searchOutline, closeCircleOutline, chatbubblesOutline } from 'ionicons/icons';
import { api } from '@/services/api';
import type { SearchResult } from '@/services/api';

const router = useRouter();
const inputRef = ref<HTMLInputElement | null>(null);
const query = ref('');
const results = ref<SearchResult[]>([]);
const loading = ref(false);
const hasSearched = ref(false);
const inputFocused = ref(false);

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

watch(query, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer);
  if (!val.trim()) {
    results.value = [];
    hasSearched.value = false;
    loading.value = false;
    return;
  }
  loading.value = true;
  debounceTimer = setTimeout(() => doSearch(val.trim()), 350);
});

async function doSearch(q: string) {
  try {
    results.value = await api.searchRecordings(q);
    hasSearched.value = true;
  } catch {
    results.value = [];
  } finally {
    loading.value = false;
  }
}

function openRecording(id: string) {
  router.push(`/recording/${id}`);
}

function highlight(snippet: string, q: string): string {
  if (!q) return snippet;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return snippet.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

onIonViewWillEnter(() => {
  setTimeout(() => inputRef.value?.focus(), 150);
});
</script>

<style scoped>
.search-page {
  padding: var(--page-top) 20px calc(96px + env(safe-area-inset-bottom, 0px));
}

/* Header */
.page-header { margin-bottom: 20px; }
.page-header h1 { font-size: 28px; font-weight: 800; color: var(--app-text); margin: 0 0 4px; }
.header-sub { font-size: 14px; color: var(--app-text-muted); margin: 0; }

/* Search bar */
.search-bar-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--app-surface);
  border: 1.5px solid var(--app-border);
  border-radius: var(--radius-xl);
  padding: 0 14px;
  height: 52px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  margin-bottom: 24px;
}
.search-bar-wrap.focused {
  border-color: var(--app-primary);
  box-shadow: 0 0 0 3px var(--app-primary-ultra-light);
}
.bar-icon { font-size: 20px; color: var(--app-text-muted); flex-shrink: 0; }
.search-bar-wrap input {
  flex: 1;
  border: none;
  background: none;
  font-size: 16px;
  color: var(--app-text);
  outline: none;
}
.search-bar-wrap input::placeholder { color: var(--app-text-muted); }
.clear-btn {
  background: none;
  border: none;
  padding: 4px;
  color: var(--app-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 18px;
}

/* States */
.state-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 48px 20px;
  gap: 8px;
}
.state-icon-wrap {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--app-primary-ultra-light);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}
.state-icon-wrap ion-icon { font-size: 32px; color: var(--app-primary); }
.state-icon-wrap.dim { background: var(--app-surface-hover); }
.state-icon-wrap.dim ion-icon { color: var(--app-text-muted); }
.state-wrap h3 { font-size: 18px; font-weight: 700; color: var(--app-text); margin: 0; }
.state-wrap p { font-size: 14px; color: var(--app-text-secondary); margin: 0; }

/* Spinner */
.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--app-border);
  border-top-color: var(--app-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  margin-bottom: 12px;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Results */
.results-list { display: flex; flex-direction: column; gap: 10px; }

.result-card {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--radius-lg);
  padding: 14px 16px;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}
.result-card:active {
  background: var(--app-surface-hover);
  transform: scale(0.985);
}

.result-meta {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 6px;
}
.result-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--app-text);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.result-date { font-size: 12px; color: var(--app-text-muted); flex-shrink: 0; }

.result-snippet {
  font-size: 13px;
  color: var(--app-text-secondary);
  line-height: 1.55;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.result-snippet.dim { color: var(--app-text-muted); font-style: italic; }

.result-snippet :deep(mark) {
  background: rgba(5, 150, 105, 0.18);
  color: var(--app-primary);
  border-radius: 3px;
  padding: 0 2px;
  font-weight: 600;
}
</style>
