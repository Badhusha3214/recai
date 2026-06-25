import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';

ffmpeg.setFfprobePath(ffprobeInstaller.path);
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const SARVAM_API_URL = 'https://api.sarvam.ai/speech-to-text';
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const CHUNK_DURATION = 25; // 25 seconds (Sarvam max is 30s)

const getSarvamKey = () => process.env.SARVAM_API_KEY;

// Indian language codes supported by Sarvam AI
export const SARVAM_LANGUAGES = {
  'hi': 'hi-IN',
  'bn': 'bn-IN',
  'kn': 'kn-IN',
  'ml': 'ml-IN',
  'mr': 'mr-IN',
  'od': 'od-IN',
  'pa': 'pa-IN',
  'ta': 'ta-IN',
  'te': 'te-IN',
  'gu': 'gu-IN',
  'en': 'en-IN',
};

const getAudioDuration = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) reject(err);
      else resolve(metadata.format.duration || 0);
    });
  });
};

const compressAudio = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioBitrate('64k')
      .audioChannels(1)
      .audioFrequency(16000)
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .run();
  });
};

const splitAudioIntoChunks = async (inputPath, outputDir, chunkDuration = CHUNK_DURATION) => {
  const duration = await getAudioDuration(inputPath);
  const numChunks = Math.ceil(duration / chunkDuration);
  const chunks = [];

  for (let i = 0; i < numChunks; i++) {
    const startTime = i * chunkDuration;
    const chunkPath = path.join(outputDir, `chunk_${i}.mp3`);

    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .setStartTime(startTime)
        .setDuration(Math.min(chunkDuration, duration - startTime))
        .audioBitrate('64k')
        .audioChannels(1)
        .audioFrequency(16000)
        .output(chunkPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    chunks.push({ path: chunkPath, startTime });
  }
  return chunks;
};

const transcribeSarvamChunk = async (filePath, languageCode = null) => {
  const key = getSarvamKey();
  if (!key) throw new Error('SARVAM_API_KEY is not configured');

  const fileBuffer = fs.readFileSync(filePath);
  console.log(`[Sarvam] Sending file: ${filePath}, size: ${fileBuffer.length} bytes, lang: ${languageCode || 'auto'}`);

  const blob = new Blob([fileBuffer], { type: 'audio/mp3' });

  const formData = new FormData();
  formData.append('file', blob, 'audio.mp3');
  formData.append('model', 'saarika:v2.5');
  if (languageCode) formData.append('language_code', languageCode);

  const response = await fetch(SARVAM_API_URL, {
    method: 'POST',
    headers: { 'api-subscription-key': key },
    body: formData,
  });

  const rawText = await response.text();
  console.log(`[Sarvam] Response status: ${response.status}, body: ${rawText}`);

  if (!response.ok) {
    throw new Error(`Sarvam API error ${response.status}: ${rawText}`);
  }

  const result = JSON.parse(rawText);
  return result;
};

/**
 * Transcribe audio using Sarvam AI (for Indian language users)
 * @param {Buffer} audioBuffer
 * @param {string} mimeType
 * @param {string|null} languageCode - e.g. 'hi-IN', 'ta-IN'
 */
export const transcribeAudioSarvam = async (audioBuffer, mimeType = 'audio/webm', languageCode = null) => {
  // Handle compound mime types like "audio/webm;codecs=opus" → "webm"
  const ext = mimeType.split('/')[1]?.split(';')[0]?.replace('x-', '') || 'webm';
  const tempDir = path.join(os.tmpdir(), `sarvam-${uuidv4()}`);
  const tempFilePath = path.join(tempDir, `original.${ext}`);
  const compressedPath = path.join(tempDir, 'compressed.mp3');

  fs.mkdirSync(tempDir, { recursive: true });

  try {
    if (!audioBuffer || audioBuffer.length < 1000) {
      throw new Error(`Audio buffer too small or empty: ${audioBuffer?.length ?? 0} bytes`);
    }

    fs.writeFileSync(tempFilePath, audioBuffer);
    console.log('[Sarvam] Compressing audio...');

    // Validate file is parseable before attempting compress
    await getAudioDuration(tempFilePath).catch((err) => {
      const firstLine = err.message.split('\n')[0];
      throw new Error(`Invalid or corrupt audio file (ffprobe failed): ${firstLine}`);
    });

    await compressAudio(tempFilePath, compressedPath);

    // Use duration-based splitting — Sarvam limit is 30s per request
    const audioDuration = await getAudioDuration(compressedPath);
    console.log(`[Sarvam] Compressed audio duration: ${audioDuration.toFixed(1)}s`);

    let fullText = '';
    let detectedLanguage = null;

    if (audioDuration <= CHUNK_DURATION) {
      console.log('[Sarvam] Transcribing single file...');
      const result = await transcribeSarvamChunk(compressedPath, languageCode);
      fullText = result.transcript || result.text || '';
      detectedLanguage = result.language_code || languageCode;
    } else {
      console.log(`[Sarvam] Audio too long (${audioDuration.toFixed(1)}s), splitting into ${CHUNK_DURATION}s chunks...`);
      const chunks = await splitAudioIntoChunks(compressedPath, tempDir);

      for (let i = 0; i < chunks.length; i++) {
        console.log(`[Sarvam] Transcribing chunk ${i + 1}/${chunks.length}...`);
        const result = await transcribeSarvamChunk(chunks[i].path, languageCode);
        fullText += (fullText ? ' ' : '') + (result.transcript || result.text || '');
        if (!detectedLanguage) detectedLanguage = result.language_code || languageCode;
      }
    }

    console.log(`[Sarvam] Transcription complete. text length: ${fullText.length}, detected lang: ${detectedLanguage}`);
    return {
      text: fullText,
      language: detectedLanguage,
      duration: 0, // Sarvam doesn't return duration
    };
  } catch (error) {
    console.error('[Sarvam] Transcription error:', error);
    throw new Error(`Sarvam transcription failed: ${error.message}`);
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {
      console.error('[Sarvam] Failed to delete temp dir:', e);
    }
  }
};

const SARVAM_TRANSLATE_URL = 'https://api.sarvam.ai/translate';

// Map short language names to Sarvam language codes
export const LANG_TO_SARVAM_CODE = {
  hindi: 'hi-IN', hi: 'hi-IN',
  bengali: 'bn-IN', bn: 'bn-IN',
  kannada: 'kn-IN', kn: 'kn-IN',
  malayalam: 'ml-IN', ml: 'ml-IN',
  marathi: 'mr-IN', mr: 'mr-IN',
  odia: 'od-IN', od: 'od-IN',
  punjabi: 'pa-IN', pa: 'pa-IN',
  tamil: 'ta-IN', ta: 'ta-IN',
  telugu: 'te-IN', te: 'te-IN',
  gujarati: 'gu-IN', gu: 'gu-IN',
  english: 'en-IN', en: 'en-IN',
};

/**
 * Translate text using Sarvam AI
 * @param {string} text - Text to translate
 * @param {string} sourceLangCode - e.g. 'hi-IN'
 * @param {string} targetLangCode - e.g. 'en-IN'
 */
export const translateText = async (text, sourceLangCode, targetLangCode = 'en-IN') => {
  if (!text || sourceLangCode === targetLangCode) return text;

  const key = getSarvamKey();
  if (!key) throw new Error('SARVAM_API_KEY is not configured');

  // Sarvam translate supports max ~1000 chars per call; chunk if needed
  const MAX_CHUNK = 900;
  const chunks = [];
  for (let i = 0; i < text.length; i += MAX_CHUNK) {
    chunks.push(text.slice(i, i + MAX_CHUNK));
  }

  const translated = [];
  for (const chunk of chunks) {
    const response = await fetch(SARVAM_TRANSLATE_URL, {
      method: 'POST',
      headers: {
        'api-subscription-key': key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: chunk,
        source_language_code: sourceLangCode,
        target_language_code: targetLangCode,
        speaker_gender: 'Male',
        mode: 'formal',
        model: 'mayura:v1',
        enable_preprocessing: false,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error(`[Sarvam Translate] Error ${response.status}: ${err}`);
      // Fall back to original chunk on error
      translated.push(chunk);
      continue;
    }

    const data = await response.json();
    translated.push(data.translated_text || chunk);
  }

  return translated.join(' ');
};

/**
 * Transcribe audio from URL using Sarvam AI
 */
export const transcribeFromUrlSarvam = async (audioUrl, mimeType = 'audio/webm', languageCode = null) => {
  const response = await fetch(audioUrl);
  if (!response.ok) throw new Error(`Failed to download audio: ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  if (buffer.length < 1000) throw new Error(`Audio file too small: ${buffer.length} bytes`);
  return await transcribeAudioSarvam(buffer, mimeType, languageCode);
};
