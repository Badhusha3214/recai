import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// Whisper API limit is 25MB, we'll use 20MB to be safe
const MAX_FILE_SIZE = 20 * 1024 * 1024;
// Chunk duration in seconds (10 minutes per chunk)
const CHUNK_DURATION = 600;

// Lazy initialization of OpenAI client
let openai = null;
const getOpenAIClient = () => {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
};

/**
 * Get audio duration using ffprobe
 */
const getAudioDuration = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) reject(err);
      else resolve(metadata.format.duration || 0);
    });
  });
};

/**
 * Split audio file into chunks
 */
const splitAudioIntoChunks = async (inputPath, outputDir, chunkDuration = CHUNK_DURATION) => {
  const duration = await getAudioDuration(inputPath);
  const numChunks = Math.ceil(duration / chunkDuration);
  const chunks = [];
  
  console.log(`Audio duration: ${duration}s, splitting into ${numChunks} chunks`);
  
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
        .on('end', () => {
          console.log(`Created chunk ${i + 1}/${numChunks}: ${chunkPath}`);
          resolve();
        })
        .on('error', reject)
        .run();
    });
    
    chunks.push({ path: chunkPath, startTime });
  }
  
  return chunks;
};

/**
 * Compress audio to reduce file size
 */
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

/**
 * Transcribe a single audio file (must be under 25MB)
 */
const transcribeSingleFile = async (filePath, language = null) => {
  const fileStream = fs.createReadStream(filePath);
  
  const options = {
    file: fileStream,
    model: 'whisper-1',
    response_format: 'verbose_json',
  };
  if (language) {
    options.language = language;
  }
  
  const transcription = await getOpenAIClient().audio.transcriptions.create(options);
  return transcription;
};

/**
 * Transcribe audio using OpenAI Whisper API
 * Handles large files by compressing and/or splitting into chunks
 * @param {Buffer} audioBuffer - Audio file buffer
 * @param {string} mimeType - Audio MIME type (audio/webm, audio/mp3, etc.)
 * @param {string} language - Optional language code (e.g., 'en', 'es')
 * @returns {Promise<{text: string, duration: number}>}
 */
export const transcribeAudio = async (audioBuffer, mimeType = 'audio/webm', language = null) => {
  const extension = getExtensionFromMimeType(mimeType);
  const tempDir = path.join(os.tmpdir(), `whisper-${uuidv4()}`);
  const tempFilePath = path.join(tempDir, `original.${extension}`);
  const compressedPath = path.join(tempDir, 'compressed.mp3');
  
  // Create temp directory
  fs.mkdirSync(tempDir, { recursive: true });
  
  console.log('Transcribing audio:', {
    bufferSize: audioBuffer.length,
    bufferSizeMB: (audioBuffer.length / (1024 * 1024)).toFixed(2) + ' MB',
    mimeType,
    extension,
    tempDir
  });
  
  try {
    // Write buffer to temp file
    fs.writeFileSync(tempFilePath, audioBuffer);
    console.log('Temp file written, size:', fs.statSync(tempFilePath).size);
    
    // First, try to compress the audio
    console.log('Compressing audio...');
    await compressAudio(tempFilePath, compressedPath);
    const compressedSize = fs.statSync(compressedPath).size;
    console.log(`Compressed size: ${(compressedSize / (1024 * 1024)).toFixed(2)} MB`);
    
    let fullText = '';
    let totalDuration = 0;
    let detectedLanguage = null;
    let allSegments = [];
    
    if (compressedSize <= MAX_FILE_SIZE) {
      // File is small enough, transcribe directly
      console.log('Calling Whisper API (single file)...');
      const transcription = await transcribeSingleFile(compressedPath, language);
      console.log('Whisper response received, duration:', transcription.duration);
      
      fullText = transcription.text;
      totalDuration = transcription.duration || 0;
      detectedLanguage = transcription.language;
      allSegments = transcription.segments || [];
    } else {
      // File is too large, split into chunks
      console.log('File too large, splitting into chunks...');
      const chunks = await splitAudioIntoChunks(compressedPath, tempDir);
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(`Transcribing chunk ${i + 1}/${chunks.length}...`);
        
        const transcription = await transcribeSingleFile(chunk.path, language);
        
        fullText += (fullText ? ' ' : '') + transcription.text;
        totalDuration += transcription.duration || 0;
        if (!detectedLanguage) detectedLanguage = transcription.language;
        
        // Adjust segment timestamps
        if (transcription.segments) {
          const adjustedSegments = transcription.segments.map(seg => ({
            ...seg,
            start: seg.start + chunk.startTime,
            end: seg.end + chunk.startTime
          }));
          allSegments.push(...adjustedSegments);
        }
      }
      
      console.log(`Transcribed ${chunks.length} chunks, total duration: ${totalDuration}s`);
    }

    return {
      text: fullText,
      duration: totalDuration,
      language: detectedLanguage,
      segments: allSegments
    };
  } catch (error) {
    console.error('Whisper transcription error:', error);
    throw new Error(`Transcription failed: ${error.message}`);
  } finally {
    // Clean up temp directory
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {
      console.error('Failed to delete temp directory:', e);
    }
  }
};

/**
 * Transcribe audio from a URL (downloads first then transcribes)
 * @param {string} audioUrl - URL of the audio file
 * @param {string} mimeType - Audio MIME type
 * @returns {Promise<{text: string, duration: number}>}
 */
export const transcribeFromUrl = async (audioUrl, mimeType = 'audio/webm') => {
  try {
    // Download the audio file
    console.log('Downloading audio file...');
    const startDownload = Date.now();
    const response = await fetch(audioUrl);
    if (!response.ok) {
      throw new Error(`Failed to download audio file: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log(`Downloaded ${buffer.length} bytes in ${(Date.now() - startDownload) / 1000}s`);
    
    if (buffer.length < 1000) {
      throw new Error(`Audio file too small: ${buffer.length} bytes`);
    }
    
    console.log('Sending to Whisper API...');
    return await transcribeAudio(buffer, mimeType);
  } catch (error) {
    console.error('Error transcribing from URL:', error);
    throw error;
  }
};

/**
 * Get file extension from MIME type
 */
function getExtensionFromMimeType(mimeType) {
  const mimeMap = {
    'audio/webm': 'webm',
    'audio/mp3': 'mp3',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/wave': 'wav',
    'audio/ogg': 'ogg',
    'audio/flac': 'flac',
    'audio/m4a': 'm4a',
    'audio/mp4': 'm4a',
    'audio/x-m4a': 'm4a',
    'video/webm': 'webm',
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
  };
  return mimeMap[mimeType] || 'webm';
}

export default openai;
