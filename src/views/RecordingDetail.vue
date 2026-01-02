<template>
  <div class="max-w-5xl mx-auto">
    <!-- Template Editor Modal -->
    <div v-if="showTemplateEditor" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6 border-b border-gray-100">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-bold text-gray-900">
              {{ editingTemplate?.key && !editingTemplate?.isDefault ? 'Edit Template' : editingTemplate?.isDefault ? 'Customize Template' : 'Create Template' }}
            </h2>
            <button @click="showTemplateEditor = false" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p v-if="editingTemplate?.isDefault" class="text-sm text-amber-600 mt-2">
            Default templates can't be modified. Your changes will be saved as a new template.
          </p>
        </div>
        
        <div class="p-6 space-y-5">
          <!-- Template Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
            <input 
              v-model="newTemplateName"
              type="text"
              placeholder="My Custom Template"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            />
          </div>
          
          <!-- Accent Color -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
            <div class="flex items-center space-x-3">
              <input 
                v-model="editingTemplate.accentColor"
                type="color"
                class="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-200"
              />
              <input 
                v-model="editingTemplate.accentColor"
                type="text"
                class="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition font-mono text-sm"
              />
              <div class="flex space-x-1">
                <button 
                  v-for="color in ['#16a34a', '#2563eb', '#9333ea', '#dc2626', '#ea580c', '#0891b2']" 
                  :key="color"
                  @click="editingTemplate.accentColor = color"
                  class="w-8 h-8 rounded-lg border-2 transition"
                  :class="editingTemplate.accentColor === color ? 'border-gray-900 scale-110' : 'border-transparent hover:scale-105'"
                  :style="{ backgroundColor: color }"
                ></button>
              </div>
            </div>
          </div>
          
          <!-- Text Color -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Text Color</label>
            <div class="flex items-center space-x-3">
              <input 
                v-model="editingTemplate.textColor"
                type="color"
                class="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-200"
              />
              <input 
                v-model="editingTemplate.textColor"
                type="text"
                class="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition font-mono text-sm"
              />
              <div class="flex space-x-1">
                <button 
                  v-for="color in ['#111827', '#374151', '#1e293b', '#0f172a']" 
                  :key="color"
                  @click="editingTemplate.textColor = color"
                  class="w-8 h-8 rounded-lg border-2 transition"
                  :class="editingTemplate.textColor === color ? 'border-gray-400 scale-110' : 'border-gray-200 hover:scale-105'"
                  :style="{ backgroundColor: color }"
                ></button>
              </div>
            </div>
          </div>
          
          <!-- Header Style -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Header Style</label>
            <div class="grid grid-cols-2 gap-3">
              <button 
                v-for="style in [
                  { value: 'simple', label: 'Simple', desc: 'Clean, no decoration' },
                  { value: 'underlined', label: 'Underlined', desc: 'Accent color border' },
                  { value: 'boxed', label: 'Boxed', desc: 'Background highlight' },
                  { value: 'centered', label: 'Centered', desc: 'Center-aligned text' }
                ]"
                :key="style.value"
                @click="editingTemplate.headerStyle = style.value"
                class="p-3 border-2 rounded-xl text-left transition"
                :class="editingTemplate.headerStyle === style.value ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'"
              >
                <div class="font-medium text-sm text-gray-900">{{ style.label }}</div>
                <div class="text-xs text-gray-500">{{ style.desc }}</div>
              </button>
            </div>
          </div>
          
          <!-- Preview -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Preview</label>
            <div class="border border-gray-200 rounded-xl p-4 bg-white">
              <div 
                class="pb-3 mb-3"
                :class="{
                  'border-b-2': editingTemplate.headerStyle === 'underlined',
                  'text-center': editingTemplate.headerStyle === 'centered',
                  'bg-gray-50 -mx-4 -mt-4 px-4 py-3 rounded-t-xl': editingTemplate.headerStyle === 'boxed'
                }"
                :style="editingTemplate.headerStyle === 'underlined' ? { borderColor: editingTemplate.accentColor } : {}"
              >
                <h3 class="font-bold" :style="{ color: editingTemplate.textColor }">Meeting Title</h3>
                <p class="text-xs text-gray-500">January 1, 2026</p>
              </div>
              <p class="text-sm" :style="{ color: editingTemplate.textColor }">
                This is how your minutes content will appear...
              </p>
            </div>
          </div>
        </div>
        
        <div class="p-6 border-t border-gray-100 flex items-center justify-between">
          <div>
            <button 
              v-if="editingTemplate?.key && !editingTemplate?.isDefault"
              @click="deleteTemplate(editingTemplate.key); showTemplateEditor = false"
              class="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition text-sm font-medium"
            >
              Delete Template
            </button>
          </div>
          <div class="flex items-center space-x-3">
            <button 
              @click="showTemplateEditor = false"
              class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition text-sm"
            >
              Cancel
            </button>
            <button 
              @click="saveTemplate"
              class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
            >
              {{ editingTemplate?.isDefault ? 'Save as New' : 'Save Template' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Back Button -->
    <button 
      @click="$router.push('/dashboard/recordings')" 
      class="flex items-center text-gray-600 hover:text-gray-900 mb-4 sm:mb-6 mt-6 transition text-sm sm:text-base"
    >
      <svg class="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      Back to Recordings
    </button>

    <div v-if="loading" class="bg-white rounded-2xl p-8 sm:p-12 text-center">
      <div class="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto"></div>
      <p class="text-gray-500 mt-2">Loading recording...</p>
    </div>

    <div v-else-if="!recording" class="bg-white rounded-2xl p-8 sm:p-12 text-center">
      <p class="text-gray-500">Recording not found.</p>
    </div>

    <template v-else>
      <!-- Header -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-4 sm:mb-6">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div class="min-w-0 flex-1">
            <h1 class="text-xl sm:text-2xl font-bold text-gray-900 break-words">{{ recording.title }}</h1>
            <p class="text-gray-500 mt-1 text-sm sm:text-base">{{ formatDate(recording.createdAt) }}</p>
          </div>
          <span 
            class="self-start px-3 py-1 text-sm font-medium rounded-full whitespace-nowrap"
            :class="statusClass(recording.status)"
          >
            {{ recording.status }}
          </span>
        </div>
      </div>

      <!-- Audio Player -->
      <div v-if="recording.audioUrl || recording.audioData" class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-4 sm:mb-6">
        <h2 class="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Audio Recording</h2>
        <audio :src="recording.audioUrl || recording.audioData" controls class="w-full"></audio>
        <p v-if="recording.duration" class="text-xs sm:text-sm text-gray-500 mt-2">Duration: {{ formatDuration(recording.duration) }}</p>
      </div>

      <!-- Transcript -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-4 sm:mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 class="font-semibold text-gray-900 text-sm sm:text-base">Transcript</h2>
          <div class="flex items-center space-x-3 flex-wrap gap-2">
            <button 
              v-if="recording.audioUrl || recording.audioKey"
              @click="transcribeWithAI"
              :disabled="transcribing"
              class="text-emerald-600 hover:text-emerald-700 text-xs sm:text-sm font-medium flex items-center space-x-1"
            >
              <svg v-if="transcribing" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span>{{ transcribing ? 'Transcribing...' : 'Transcribe with AI' }}</span>
            </button>
            <button 
              v-if="!editingTranscript"
              @click="editingTranscript = true"
              class="text-gray-600 hover:text-gray-700 text-xs sm:text-sm font-medium"
            >
              Edit
            </button>
          </div>
        </div>
        
        <div v-if="editingTranscript">
          <textarea 
            v-model="editedTranscript"
            rows="8"
            class="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition resize-none text-sm sm:text-base"
          ></textarea>
          <div class="flex justify-end space-x-2 mt-3 sm:mt-4">
            <button 
              @click="editingTranscript = false; editedTranscript = recording.transcript"
              class="px-3 sm:px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
            >
              Cancel
            </button>
            <button 
              @click="saveTranscript"
              class="px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm"
            >
              Save
            </button>
          </div>
        </div>
        <div v-else>
          <div v-if="recording.transcript">
            <p 
              class="text-gray-700 whitespace-pre-wrap text-sm sm:text-base"
              :class="{ 'line-clamp-4': !transcriptExpanded }"
            >{{ recording.transcript }}</p>
            <button 
              v-if="isTranscriptLong"
              @click="transcriptExpanded = !transcriptExpanded"
              class="mt-2 text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center space-x-1"
            >
              <span>{{ transcriptExpanded ? 'Show less' : 'Show more' }}</span>
              <svg 
                class="w-4 h-4 transition-transform" 
                :class="{ 'rotate-180': transcriptExpanded }"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          <p v-else class="text-gray-400 italic text-sm sm:text-base">No transcript available. Click Edit to add one.</p>
        </div>
      </div>

      <!-- AI Features Section -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 mb-4 sm:mb-6">
        <!-- Tab Navigation -->
        <div class="flex border-b border-gray-100">
          <button 
            @click="activeAITab = 'summary'"
            :class="[
              'flex-1 py-3 sm:py-4 px-4 text-sm sm:text-base font-medium transition-colors relative',
              activeAITab === 'summary' 
                ? 'text-emerald-600' 
                : 'text-gray-500 hover:text-gray-700'
            ]"
          >
            <div class="flex items-center justify-center space-x-2">
              <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span>Summary</span>
              <span v-if="recording.summary" class="w-2 h-2 bg-emerald-500 rounded-full"></span>
            </div>
            <div v-if="activeAITab === 'summary'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600"></div>
          </button>
          
          <button 
            @click="activeAITab = 'minutes'"
            :class="[
              'flex-1 py-3 sm:py-4 px-4 text-sm sm:text-base font-medium transition-colors relative',
              activeAITab === 'minutes' 
                ? 'text-green-600' 
                : 'text-gray-500 hover:text-gray-700'
            ]"
          >
            <div class="flex items-center justify-center space-x-2">
              <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Minutes</span>
              <span v-if="recording.minutes" class="w-2 h-2 bg-green-500 rounded-full"></span>
            </div>
            <div v-if="activeAITab === 'minutes'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600"></div>
          </button>
          
          <button 
            @click="activeAITab = 'actions'"
            :class="[
              'flex-1 py-3 sm:py-4 px-4 text-sm sm:text-base font-medium transition-colors relative',
              activeAITab === 'actions' 
                ? 'text-purple-600' 
                : 'text-gray-500 hover:text-gray-700'
            ]"
          >
            <div class="flex items-center justify-center space-x-2">
              <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span>Actions</span>
              <span v-if="recording.actionItems?.length" class="w-2 h-2 bg-purple-500 rounded-full"></span>
            </div>
            <div v-if="activeAITab === 'actions'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"></div>
          </button>
        </div>

        <!-- Tab Content -->
        <div class="p-4 sm:p-6">
          <!-- Summary Tab -->
          <div v-if="activeAITab === 'summary'">
            <div v-if="recording.summary">
              <div class="prose prose-emerald max-w-none text-sm sm:text-base" v-html="formatMarkdown(recording.summary)"></div>
              <button 
                @click="generateSummary"
                :disabled="summarizing || !recording.transcript"
                class="mt-4 px-4 py-2 text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition disabled:opacity-50 flex items-center space-x-2 text-sm"
              >
                <svg v-if="summarizing" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                <span>{{ summarizing ? 'Regenerating...' : 'Regenerate Summary' }}</span>
              </button>
            </div>
            <div v-else class="text-center py-8">
              <div class="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 class="font-semibold text-gray-900 mb-2">Generate AI Summary</h3>
              <p class="text-gray-500 text-sm mb-4">Get key points and insights from your recording</p>
              <button 
                @click="generateSummary"
                :disabled="summarizing || !recording.transcript"
                class="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition disabled:opacity-50 flex items-center space-x-2 mx-auto"
              >
                <svg v-if="summarizing" class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                <span>{{ summarizing ? 'Generating...' : 'Generate Summary' }}</span>
              </button>
            </div>
          </div>

          <!-- Minutes Tab -->
          <div v-if="activeAITab === 'minutes'">
            <div v-if="recording.minutes">
              <!-- Download Options -->
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-4 border-b border-gray-100">
                <div class="flex items-center space-x-2">
                  <label class="text-sm text-gray-600">Template:</label>
                  <select 
                    v-model="selectedTemplate"
                    class="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option v-for="(template, key) in customTemplates" :key="key" :value="key">
                      {{ template.name }}
                    </option>
                  </select>
                  <button 
                    @click="openTemplateEditor(selectedTemplate)"
                    class="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                    title="Edit template"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button 
                    @click="openTemplateEditor()"
                    class="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition"
                    title="Create new template"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
                <div class="flex items-center space-x-2">
                  <button 
                    @click="downloadMinutesPDF"
                    :disabled="generatingPDF"
                    class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center space-x-2 text-sm font-medium"
                  >
                    <svg v-if="generatingPDF" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>{{ generatingPDF ? 'Generating...' : 'Download PDF' }}</span>
                  </button>
                  <button 
                    @click="downloadMinutesMD"
                    class="px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition flex items-center space-x-2 text-sm"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Markdown</span>
                  </button>
                </div>
              </div>
              
              <!-- PDF Preview -->
              <div 
                ref="minutesPreview"
                class="bg-white rounded-xl border border-gray-200 p-6 sm:p-8"
              >
                <div 
                  class="pb-4 mb-4"
                  :class="{
                    'border-b-2': customTemplates[selectedTemplate]?.headerStyle === 'underlined',
                    'text-center': customTemplates[selectedTemplate]?.headerStyle === 'centered',
                    'bg-gray-50 -mx-6 sm:-mx-8 -mt-6 sm:-mt-8 px-6 sm:px-8 py-4 rounded-t-xl': customTemplates[selectedTemplate]?.headerStyle === 'boxed'
                  }"
                  :style="customTemplates[selectedTemplate]?.headerStyle === 'underlined' ? { borderColor: customTemplates[selectedTemplate]?.accentColor } : {}"
                >
                  <h1 class="text-xl sm:text-2xl font-bold mb-2" :style="{ color: customTemplates[selectedTemplate]?.textColor }">{{ recording.title }}</h1>
                  <p class="text-sm text-gray-500">{{ formatDate(recording.createdAt) }}</p>
                </div>
                <div 
                  class="prose max-w-none mt-6 text-sm sm:text-base" 
                  :style="{ color: customTemplates[selectedTemplate]?.textColor }"
                  v-html="formatMarkdown(recording.minutes)"
                ></div>
              </div>
              
              <button 
                @click="generateMinutes"
                :disabled="generatingMinutes || !recording.transcript"
                class="mt-4 px-4 py-2 text-green-600 border border-green-200 rounded-lg hover:bg-green-50 transition disabled:opacity-50 flex items-center space-x-2 text-sm"
              >
                <svg v-if="generatingMinutes" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                <span>{{ generatingMinutes ? 'Regenerating...' : 'Regenerate Minutes' }}</span>
              </button>
            </div>
            <div v-else class="text-center py-8">
              <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 class="font-semibold text-gray-900 mb-2">Generate Meeting Minutes</h3>
              <p class="text-gray-500 text-sm mb-4">Create formal, structured meeting minutes</p>
              <button 
                @click="generateMinutes"
                :disabled="generatingMinutes || !recording.transcript"
                class="px-6 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition disabled:opacity-50 flex items-center space-x-2 mx-auto"
              >
                <svg v-if="generatingMinutes" class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                <span>{{ generatingMinutes ? 'Generating...' : 'Generate Minutes' }}</span>
              </button>
            </div>
          </div>

          <!-- Actions Tab -->
          <div v-if="activeAITab === 'actions'">
            <div v-if="recording.actionItems?.length">
              <div class="space-y-2 sm:space-y-3">
                <div 
                  v-for="(item, index) in recording.actionItems" 
                  :key="index"
                  class="flex items-start space-x-3 p-2.5 sm:p-3 bg-gray-50 rounded-xl"
                >
                  <div class="flex-shrink-0 mt-0.5">
                    <div 
                      class="w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition"
                      :class="item.completed ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 hover:border-emerald-500'"
                      @click="toggleActionItem(index)"
                    >
                      <svg v-if="item.completed" class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p 
                      class="text-sm text-gray-900"
                      :class="{ 'line-through text-gray-400': item.completed }"
                    >{{ item.task }}</p>
                    <div class="flex flex-wrap items-center gap-2 mt-1">
                      <span 
                        class="text-xs px-2 py-0.5 rounded-full"
                        :class="priorityClass(item.priority)"
                      >{{ item.priority }}</span>
                      <span v-if="item.assignee && item.assignee !== 'Unassigned'" class="text-xs text-gray-500">
                        👤 {{ item.assignee }}
                      </span>
                      <span v-if="item.deadline" class="text-xs text-gray-500">
                        📅 {{ item.deadline }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <button 
                @click="extractActions"
                :disabled="extractingActions || !recording.transcript"
                class="mt-4 px-4 py-2 text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 transition disabled:opacity-50 flex items-center space-x-2 text-sm"
              >
                <svg v-if="extractingActions" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                <span>{{ extractingActions ? 'Re-extracting...' : 'Re-extract Actions' }}</span>
              </button>
            </div>
            <div v-else class="text-center py-8">
              <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 class="font-semibold text-gray-900 mb-2">Extract Action Items</h3>
              <p class="text-gray-500 text-sm mb-4">Find tasks and to-dos from your recording</p>
              <button 
                @click="extractActions"
                :disabled="extractingActions || !recording.transcript"
                class="px-6 py-2.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition disabled:opacity-50 flex items-center space-x-2 mx-auto"
              >
                <svg v-if="extractingActions" class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                <span>{{ extractingActions ? 'Extracting...' : 'Extract Actions' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { recordingsApi } from '../api';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const route = useRoute();
const recording = ref(null);
const loading = ref(true);
const editingTranscript = ref(false);
const editedTranscript = ref('');
const summarizing = ref(false);
const generatingMinutes = ref(false);
const transcribing = ref(false);
const transcriptExpanded = ref(false);
const extractingActions = ref(false);
const activeAITab = ref('summary');
const selectedTemplate = ref('professional');
const generatingPDF = ref(false);
const minutesPreview = ref(null);
const showTemplateEditor = ref(false);
const editingTemplate = ref(null);
const newTemplateName = ref('');

// Custom templates (stored in localStorage)
const defaultTemplates = {
  professional: {
    name: 'Professional',
    accentColor: '#16a34a',
    textColor: '#111827',
    headerStyle: 'underlined',
    isDefault: true
  },
  minimal: {
    name: 'Minimal',
    accentColor: '#6b7280',
    textColor: '#374151',
    headerStyle: 'simple',
    isDefault: true
  },
  corporate: {
    name: 'Corporate',
    accentColor: '#2563eb',
    textColor: '#1e293b',
    headerStyle: 'boxed',
    isDefault: true
  },
  creative: {
    name: 'Creative',
    accentColor: '#9333ea',
    textColor: '#111827',
    headerStyle: 'centered',
    isDefault: true
  }
};

const customTemplates = ref(loadTemplates());

function loadTemplates() {
  const saved = localStorage.getItem('pdfTemplates');
  if (saved) {
    return { ...defaultTemplates, ...JSON.parse(saved) };
  }
  return { ...defaultTemplates };
}

function saveTemplates() {
  const custom = {};
  Object.entries(customTemplates.value).forEach(([key, value]) => {
    if (!value.isDefault) {
      custom[key] = value;
    }
  });
  localStorage.setItem('pdfTemplates', JSON.stringify(custom));
}

function openTemplateEditor(templateKey = null) {
  if (templateKey && customTemplates.value[templateKey]) {
    editingTemplate.value = {
      key: templateKey,
      ...JSON.parse(JSON.stringify(customTemplates.value[templateKey]))
    };
    newTemplateName.value = customTemplates.value[templateKey].name;
  } else {
    editingTemplate.value = {
      key: null,
      name: '',
      accentColor: '#16a34a',
      textColor: '#111827',
      headerStyle: 'underlined',
      isDefault: false
    };
    newTemplateName.value = '';
  }
  showTemplateEditor.value = true;
}

function saveTemplate() {
  if (!newTemplateName.value.trim()) {
    alert('Please enter a template name');
    return;
  }
  
  const key = editingTemplate.value.key || newTemplateName.value.toLowerCase().replace(/\s+/g, '-');
  
  // Don't allow editing default templates - create a copy instead
  if (editingTemplate.value.isDefault && editingTemplate.value.key) {
    const newKey = key + '-custom';
    customTemplates.value[newKey] = {
      ...editingTemplate.value,
      name: newTemplateName.value,
      key: newKey,
      isDefault: false
    };
    selectedTemplate.value = newKey;
  } else {
    customTemplates.value[key] = {
      ...editingTemplate.value,
      name: newTemplateName.value,
      isDefault: false
    };
    selectedTemplate.value = key;
  }
  
  saveTemplates();
  showTemplateEditor.value = false;
}

function deleteTemplate(key) {
  if (customTemplates.value[key]?.isDefault) {
    alert('Cannot delete default templates');
    return;
  }
  
  if (confirm(`Delete template "${customTemplates.value[key].name}"?`)) {
    delete customTemplates.value[key];
    if (selectedTemplate.value === key) {
      selectedTemplate.value = 'professional';
    }
    saveTemplates();
  }
}

// Check if transcript is long enough to need truncation (more than ~4 lines)
const isTranscriptLong = computed(() => {
  if (!recording.value?.transcript) return false;
  const lines = recording.value.transcript.split('\n').length;
  const charCount = recording.value.transcript.length;
  return lines > 4 || charCount > 400;
});

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDuration = (seconds) => {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const statusClass = (status) => {
  const classes = {
    pending: 'bg-yellow-100 text-yellow-800',
    transcribing: 'bg-blue-100 text-blue-800',
    transcribed: 'bg-emerald-100 text-emerald-800',
    summarizing: 'bg-purple-100 text-purple-800',
    summarized: 'bg-indigo-100 text-indigo-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800'
  };
  return classes[status] || classes.pending;
};

const formatMarkdown = (text) => {
  if (!text) return '';
  return text
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-6 mb-3">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- \[ \] (.*$)/gim, '<div class="flex items-center space-x-2 my-1"><input type="checkbox" class="rounded" disabled><span>$1</span></div>')
    .replace(/^- \[x\] (.*$)/gim, '<div class="flex items-center space-x-2 my-1"><input type="checkbox" class="rounded" checked disabled><span class="line-through">$1</span></div>')
    .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal">$1</li>')
    .replace(/^---$/gim, '<hr class="my-4 border-gray-200">')
    .replace(/\n/g, '<br>');
};

const saveTranscript = async () => {
  try {
    const result = await recordingsApi.update(recording.value._id || recording.value.id, { transcript: editedTranscript.value });
    recording.value = result.recording;
    editingTranscript.value = false;
  } catch (error) {
    console.error('Error saving transcript:', error);
    alert('Failed to save transcript.');
  }
};

const transcribeWithAI = async () => {
  transcribing.value = true;
  try {
    const result = await recordingsApi.transcribe(recording.value._id || recording.value.id);
    recording.value = result.recording;
    editedTranscript.value = result.transcript || '';
  } catch (error) {
    console.error('Error transcribing:', error);
    alert('Failed to transcribe: ' + error.message);
  } finally {
    transcribing.value = false;
  }
};

const generateSummary = async () => {
  summarizing.value = true;
  try {
    const result = await recordingsApi.summarize(recording.value._id || recording.value.id, recording.value.transcript);
    recording.value = result.recording;
  } catch (error) {
    console.error('Error generating summary:', error);
    alert('Failed to generate summary.');
  } finally {
    summarizing.value = false;
  }
};

const generateMinutes = async () => {
  generatingMinutes.value = true;
  try {
    const result = await recordingsApi.generateMinutes(recording.value._id || recording.value.id);
    recording.value = result.recording;
  } catch (error) {
    console.error('Error generating minutes:', error);
    alert('Failed to generate minutes.');
  } finally {
    generatingMinutes.value = false;
  }
};

const downloadMinutesMD = () => {
  const blob = new Blob([recording.value.minutes], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${recording.value.title}-minutes.md`;
  a.click();
  URL.revokeObjectURL(url);
};

const downloadMinutesPDF = async () => {
  generatingPDF.value = true;
  
  try {
    // Get the current template settings
    const template = customTemplates.value[selectedTemplate.value] || customTemplates.value.professional;
    
    const marginMm = 5;
    const pageWidthMm = 210;
    const pageHeightMm = 297;
    const contentWidthMm = pageWidthMm - (marginMm * 2);
    const contentHeightMm = pageHeightMm - (marginMm * 2);
    
    // Render width in pixels (higher for better quality)
    const renderWidth = 800;
    
    // Format minutes content as HTML with inline styles
    const formattedContent = recording.value.minutes
      .replace(/^### (.*$)/gim, `<h3 style="font-size: 16px; font-weight: 600; margin: 16px 0 8px 0; color: ${template.textColor};">$1</h3>`)
      .replace(/^## (.*$)/gim, `<h2 style="font-size: 18px; font-weight: 600; margin: 20px 0 10px 0; color: ${template.textColor};">$1</h2>`)
      .replace(/^# (.*$)/gim, `<h1 style="font-size: 22px; font-weight: 700; margin: 24px 0 12px 0; color: ${template.textColor};">$1</h1>`)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*$)/gim, `<div style="display: flex; margin-bottom: 6px; color: ${template.textColor};"><span style="margin-right: 8px;">•</span><span>$1</span></div>`)
      .replace(/^(\d+)\. (.*$)/gim, `<div style="display: flex; margin-bottom: 6px; color: ${template.textColor};"><span style="min-width: 24px;">$1.</span><span>$2</span></div>`)
      .replace(/^---$/gim, `<hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">`)
      .replace(/\n/g, '<br>');
    
    const headerStyle = template.headerStyle === 'centered' ? 'text-align: center;' : '';
    const headerBorder = template.headerStyle === 'underlined' ? `border-bottom: 3px solid ${template.accentColor};` : '';
    const headerBg = template.headerStyle === 'boxed' ? `background: ${template.accentColor}15; border-radius: 8px; padding: 20px; margin: -20px -20px 24px -20px;` : '';
    
    // Create a temporary container
    const tempContainer = document.createElement('div');
    tempContainer.style.cssText = `position: absolute; left: -9999px; top: 0; width: ${renderWidth}px; padding: 20px; background: #ffffff; font-family: system-ui, -apple-system, sans-serif; box-sizing: border-box;`;
    
    tempContainer.innerHTML = `
      <div style="${headerBg} ${headerBorder} padding-bottom: 20px; margin-bottom: 28px; ${headerStyle}">
        <h1 style="font-size: 26px; font-weight: 700; margin: 0 0 10px 0; color: ${template.textColor};">${recording.value.title}</h1>
        <p style="font-size: 14px; color: #6b7280; margin: 0;">${formatDate(recording.value.createdAt)}</p>
      </div>
      <div style="color: ${template.textColor}; line-height: 1.8; font-size: 14px;">
        ${formattedContent}
      </div>
      <div style="margin-top: 48px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; ${headerStyle}">
        Generated by RecAI • ${new Date().toLocaleDateString()}
      </div>
    `;
    
    document.body.appendChild(tempContainer);
    
    // Capture the content
    const canvas = await html2canvas(tempContainer, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    
    document.body.removeChild(tempContainer);
    
    // Calculate dimensions
    const imgWidthMm = contentWidthMm;
    const imgHeightMm = (canvas.height * contentWidthMm) / canvas.width;
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    if (imgHeightMm <= contentHeightMm) {
      // Content fits on one page
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', marginMm, marginMm, imgWidthMm, imgHeightMm);
    } else {
      // Multi-page: render each page separately
      const pxPerMm = canvas.width / contentWidthMm;
      const pageHeightPx = contentHeightMm * pxPerMm;
      const totalPages = Math.ceil(canvas.height / pageHeightPx);
      
      for (let i = 0; i < totalPages; i++) {
        if (i > 0) pdf.addPage();
        
        const srcY = i * pageHeightPx;
        const srcH = Math.min(pageHeightPx, canvas.height - srcY);
        
        // Create page canvas
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = srcH;
        
        const ctx = pageCanvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);
        
        const sliceHeightMm = srcH / pxPerMm;
        pdf.addImage(pageCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', marginMm, marginMm, imgWidthMm, sliceHeightMm);
      }
    }
    
    pdf.save(`${recording.value.title}-minutes.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF. Please try again.');
  } finally {
    generatingPDF.value = false;
  }
};

const extractActions = async () => {
  extractingActions.value = true;
  try {
    const result = await recordingsApi.extractActions(recording.value._id || recording.value.id);
    recording.value = result.recording;
  } catch (error) {
    console.error('Error extracting actions:', error);
    alert('Failed to extract action items.');
  } finally {
    extractingActions.value = false;
  }
};

const toggleActionItem = async (index) => {
  const item = recording.value.actionItems[index];
  item.completed = !item.completed;
  try {
    await recordingsApi.update(recording.value._id || recording.value.id, {
      actionItems: recording.value.actionItems
    });
  } catch (error) {
    console.error('Error updating action item:', error);
    item.completed = !item.completed; // Revert on error
  }
};

const priorityClass = (priority) => {
  const classes = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-green-100 text-green-700'
  };
  return classes[priority] || classes.medium;
};

onMounted(async () => {
  try {
    const result = await recordingsApi.getOne(route.params.id);
    recording.value = result.recording;
    editedTranscript.value = result.recording.transcript || '';
  } catch (error) {
    console.error('Failed to load recording:', error);
  } finally {
    loading.value = false;
  }
});
</script>
