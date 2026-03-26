import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api, Recording } from '@/services/api';

export const useRecordingsStore = defineStore('recordings', () => {
  const recordings = ref<Recording[]>([]);
  const currentRecording = ref<Recording | null>(null);
  const loading = ref(false);
  const processing = ref(false);
  const error = ref<string | null>(null);

  const sortedRecordings = computed(() => {
    return [...recordings.value].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  });

  async function fetchRecordings() {
    loading.value = true;
    error.value = null;
    try {
      recordings.value = await api.getRecordings();
    } catch (err: any) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  async function fetchRecording(id: string) {
    loading.value = true;
    error.value = null;
    try {
      currentRecording.value = await api.getRecording(id);
      return currentRecording.value;
    } catch (err: any) {
      error.value = err.message;
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function createRecording(data: {
    audioData?: string;
    audioKey?: string;
    duration: number;
    mimeType: string;
    title?: string;
    autoTranscribe?: boolean;
  }) {
    processing.value = true;
    error.value = null;
    try {
      const recording = await api.createRecording(data);
      recordings.value.unshift(recording);
      currentRecording.value = recording;
      return recording;
    } catch (err: any) {
      error.value = err.message;
      return null;
    } finally {
      processing.value = false;
    }
  }

  async function createRecordingNative(params: {
    audioData: string;
    duration: number;
    mimeType: string;
    title?: string;
    onProgress?: (percent: number) => void;
  }) {
    processing.value = true;
    error.value = null;
    try {
      const recording = await api.createRecordingNative(params);
      recordings.value.unshift(recording);
      currentRecording.value = recording;
      return recording;
    } catch (err: any) {
      error.value = err.message;
      return null;
    } finally {
      processing.value = false;
    }
  }

  async function updateRecording(id: string, updates: Partial<Recording>) {
    error.value = null;
    try {
      const updated = await api.updateRecording(id, updates);
      const index = recordings.value.findIndex((r) => r._id === id);
      if (index !== -1) recordings.value[index] = updated;
      if (currentRecording.value?._id === id) currentRecording.value = updated;
      return updated;
    } catch (err: any) {
      error.value = err.message;
      return null;
    }
  }

  async function deleteRecording(id: string) {
    error.value = null;
    try {
      await api.deleteRecording(id);
      recordings.value = recordings.value.filter((r) => r._id !== id);
      if (currentRecording.value?._id === id) currentRecording.value = null;
      return true;
    } catch (err: any) {
      error.value = err.message;
      return false;
    }
  }

  async function transcribeRecording(id: string) {
    processing.value = true;
    error.value = null;
    try {
      const updated = await api.transcribeRecording(id);
      updateLocalRecording(id, updated);
      return updated;
    } catch (err: any) {
      error.value = err.message;
      return null;
    } finally {
      processing.value = false;
    }
  }

  async function summarizeRecording(id: string) {
    processing.value = true;
    error.value = null;
    try {
      const updated = await api.summarizeRecording(id);
      updateLocalRecording(id, updated);
      return updated;
    } catch (err: any) {
      error.value = err.message;
      return null;
    } finally {
      processing.value = false;
    }
  }

  async function generateMinutes(id: string) {
    processing.value = true;
    error.value = null;
    try {
      const updated = await api.generateMinutes(id);
      updateLocalRecording(id, updated);
      return updated;
    } catch (err: any) {
      error.value = err.message;
      return null;
    } finally {
      processing.value = false;
    }
  }

  async function generateActionItems(id: string) {
    processing.value = true;
    error.value = null;
    try {
      const updated = await api.generateActionItems(id);
      updateLocalRecording(id, updated);
      return updated;
    } catch (err: any) {
      error.value = err.message;
      return null;
    } finally {
      processing.value = false;
    }
  }

  function updateLocalRecording(id: string, updated: Recording) {
    const index = recordings.value.findIndex((r) => r._id === id);
    if (index !== -1) recordings.value[index] = updated;
    if (currentRecording.value?._id === id) currentRecording.value = updated;
  }

  return {
    recordings,
    currentRecording,
    loading,
    processing,
    error,
    sortedRecordings,
    fetchRecordings,
    fetchRecording,
    createRecording,
    createRecordingNative,
    updateRecording,
    deleteRecording,
    transcribeRecording,
    summarizeRecording,
    generateMinutes,
    generateActionItems,
  };
});