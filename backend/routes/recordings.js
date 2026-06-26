import express from 'express';
import mongoose from 'mongoose';
import Recording from '../models/Recording.js';
import User from '../models/User.js';
import { uploadAudio, getAudioUrl, deleteAudio, getUploadUrl } from '../config/storage.js';
import { transcribeAudio, transcribeFromUrl } from '../config/transcription.js';
import { transcribeAudioSarvam, transcribeFromUrlSarvam, translateText, LANG_TO_SARVAM_CODE } from '../config/sarvam.js';
import { generateSummary, generateMeetingMinutes, extractActionItems, generateTitle } from '../config/gemini.js';
import { getPlanLimits, getActivePlan, getEffectiveLimits } from '../utils/planLimits.js';
import { logError } from '../utils/logError.js';

// ─── Plan limit helpers ──────────────────────────────────────────────────────

const startOfCurrentMonth = () => {
  const d = new Date();
  d.setDate(1); d.setHours(0, 0, 0, 0);
  return d;
};

const getUserStorageUsed = async (userId) => {
  const result = await Recording.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: null, total: { $sum: '$audioSize' } } },
  ]);
  return result[0]?.total || 0;
};

/**
 * Checks recording count + duration + storage limits.
 * Returns { ok: true } or { ok: false, status, error, code }.
 */
const checkCreateLimits = async (userId, userDoc, durationSecs, incomingBytes) => {
  const limits = await getEffectiveLimits(userDoc);

  if (limits.recordingsPerMonth !== null) {
    const count = await Recording.countDocuments({
      user: userId,
      createdAt: { $gte: startOfCurrentMonth() },
    });
    if (count >= limits.recordingsPerMonth) {
      return {
        ok: false, status: 403,
        error: `You've reached the ${limits.recordingsPerMonth} recordings/month limit on your current plan. Upgrade to unlock more recordings.`,
        code: 'PLAN_LIMIT_RECORDINGS',
      };
    }
  }

  if (durationSecs && durationSecs > limits.maxDurationSecs) {
    const maxMins = Math.floor(limits.maxDurationSecs / 60);
    return {
      ok: false, status: 403,
      error: `Recording is ${Math.ceil(durationSecs / 60)} min — exceeds the ${maxMins} min limit on your plan. Upgrade to Pro for up to 3 hours.`,
      code: 'PLAN_LIMIT_DURATION',
    };
  }

  if (incomingBytes > 0) {
    const used = await getUserStorageUsed(userId);
    if (used + incomingBytes > limits.maxStorageBytes) {
      const limitGB = (limits.maxStorageBytes / 1_073_741_824).toFixed(0);
      return {
        ok: false, status: 403,
        error: `Storage limit of ${limitGB} GB reached. Delete old recordings or upgrade your plan.`,
        code: 'PLAN_LIMIT_STORAGE',
      };
    }
  }

  return { ok: true };
};

// ────────────────────────────────────────────────────────────────────────────

// Returns true if this user should use Sarvam AI (Indian users or no country set)
const isIndianUser = (user) => {
  if (!user) return true; // no user record → default to Sarvam
  const country = (user.country || '').toLowerCase().trim();
  if (!country) return true; // no country set → default to Sarvam
  return country === 'india' || country === 'in' || country === 'भारत';
};

// Translate transcript to English if user is Indian (so Gemini always gets English)
const toEnglishTranscript = async (transcript, user) => {
  if (!isIndianUser(user) || !user?.preferredLanguage) return transcript;
  const lang = (user.preferredLanguage || '').toLowerCase().trim();
  if (lang === 'english' || lang === 'en') return transcript; // already English
  const sourceLangCode = LANG_TO_SARVAM_CODE[lang];
  if (!sourceLangCode || !process.env.SARVAM_API_KEY) return transcript;
  try {
    console.log(`[Translate] Translating transcript from ${sourceLangCode} to en-IN`);
    return await translateText(transcript, sourceLangCode, 'en-IN');
  } catch (e) {
    console.error('[Translate] Failed, using original transcript:', e.message);
    return transcript;
  }
};

// Translate AI output back to user's preferred summary language (if not English)
const toPreferredLanguage = async (text, user) => {
  if (!user?.summaryLanguage) return text; // default = English, no translation needed
  const lang = user.summaryLanguage.toLowerCase().trim();
  if (lang === 'english' || lang === 'en') return text;
  const targetLangCode = LANG_TO_SARVAM_CODE[lang];
  if (!targetLangCode || !process.env.SARVAM_API_KEY) return text;
  try {
    console.log(`[Translate] Translating output to ${targetLangCode}`);
    return await translateText(text, 'en-IN', targetLangCode);
  } catch (e) {
    console.error('[Translate] Output translation failed, returning English:', e.message);
    return text;
  }
};

// Pick language code for Sarvam based on user's preferredLanguage
const getSarvamLanguageCode = (user) => {
  if (!user?.preferredLanguage) return null;
  const lang = user.preferredLanguage.toLowerCase();
  const map = {
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
  return map[lang] || null;
};

const router = express.Router();

// ─── Chunked-upload helpers ─────────────────────────────────────────────────
// Stores in-flight chunks for native clients that can't send one large request.
const chunkStore = new Map(); // uploadId → { chunks[], totalChunks, userId, createdAt }

// Sweep stale uploads every 10 minutes (discard anything older than 30 min)
setInterval(() => {
  const cutoff = Date.now() - 30 * 60 * 1000;
  for (const [id, entry] of chunkStore.entries()) {
    if (entry.createdAt < cutoff) chunkStore.delete(id);
  }
}, 10 * 60 * 1000);

// POST /upload-chunk  — receive one base64 slice (web or mobile client)
// totalChunks is optional: omit for streaming mode (web), provide for fixed-size mode (mobile)
router.post('/upload-chunk', async (req, res) => {
  try {
    const { uploadId, chunkIndex, totalChunks, chunk } = req.body;
    if (!uploadId || chunkIndex === undefined || chunk === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let entry = chunkStore.get(uploadId);
    if (!entry) {
      // streaming mode uses a plain object keyed by index; fixed mode uses a pre-sized array
      entry = {
        chunks: totalChunks ? new Array(totalChunks).fill(null) : {},
        totalChunks: totalChunks || null,
        userId: req.user.id,
        createdAt: Date.now(),
      };
      chunkStore.set(uploadId, entry);
    }

    if (entry.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    entry.chunks[chunkIndex] = chunk;
    console.log(`[upload-chunk] id=${uploadId} idx=${chunkIndex}/${totalChunks ?? '?'} len=${chunk?.length ?? 'null'}`);
    res.json({ ok: true, received: chunkIndex });
  } catch (error) {
    console.error('Chunk upload error:', error);
    res.status(500).json({ error: 'Failed to store chunk' });
  }
});

// POST /finalize-upload — assemble chunks, push to R2, create DB record, kick off transcription
router.post('/finalize-upload', async (req, res) => {
  try {
    const { uploadId, duration, mimeType, title, tempUpload, audioSize: clientReportedSize, freeSpaceBytes } = req.body;

    const entry = chunkStore.get(uploadId);
    if (!entry) return res.status(404).json({ error: 'Upload not found or expired' });
    if (entry.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const userDoc = await User.findById(req.user.id);
    const check = await checkCreateLimits(req.user.id, userDoc, duration || 0, 0);
    if (!check.ok) {
      chunkStore.delete(uploadId);
      return res.status(check.status).json({ error: check.error, code: check.code });
    }

    // Assemble: decode each chunk independently then concatenate.
    // Joining base64 strings first causes Buffer.from() to stop at the first "=="
    // padding character — which appears at the end of every chunk whose byte-length
    // is not divisible by 3 (e.g. Java's 256 KB chunks: 262144 = 3×87381+1).
    const chunks = entry.chunks;
    let audioBuffer;
    if (Array.isArray(chunks)) {
      const missing = chunks.findIndex(c => c === null);
      if (missing !== -1) return res.status(400).json({ error: `Missing chunk ${missing}` });
      audioBuffer = Buffer.concat(chunks.map(c => Buffer.from((c || '').replace(/^data:[^,]+,/, ''), 'base64')));
    } else {
      const sorted = Object.keys(chunks).map(Number).sort((a, b) => a - b);
      audioBuffer = Buffer.concat(sorted.map(k => Buffer.from((chunks[k] || '').replace(/^data:[^,]+,/, ''), 'base64')));
    }

    chunkStore.delete(uploadId);
    const numChunks = Array.isArray(chunks) ? chunks.length : Object.keys(chunks).length;
    const freeMB = freeSpaceBytes != null && freeSpaceBytes >= 0 ? (freeSpaceBytes / 1024 / 1024).toFixed(1) + ' MB' : 'unknown';
    console.log(`[finalize-upload] Assembled buffer size: ${audioBuffer.length} bytes (${numChunks} chunks, mimeType: ${mimeType}, clientReportedDuration: ${duration}s, deviceFileSize: ${clientReportedSize ?? 'unknown'}, deviceFreeSpace: ${freeMB})`);

    const storageCheck = await checkCreateLimits(req.user.id, userDoc, duration || 0, tempUpload ? 0 : audioBuffer.length);
    if (!storageCheck.ok) {
      return res.status(storageCheck.status).json({ error: storageCheck.error, code: storageCheck.code });
    }

    let audioInfo = { audioKey: null, audioUrl: null, audioSize: 0 };
    if (process.env.R2_ACCESS_KEY_ID && !tempUpload) {
      const uploaded = await uploadAudio(audioBuffer, req.user.id, mimeType || 'audio/webm');
      audioInfo = { audioKey: uploaded.key, audioUrl: uploaded.url, audioSize: uploaded.size };
      console.log('[finalize-upload] R2 upload:', audioInfo.audioKey);
    }

    const finalTitle = title || `Recording ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
    const limits = getPlanLimits(userDoc);
    const inlineBuffer = tempUpload ? audioBuffer : null;
    const willTranscribe = (audioInfo.audioKey || inlineBuffer) && (process.env.OPENAI_API_KEY || process.env.SARVAM_API_KEY);

    const recording = await Recording.create({
      user: req.user.id,
      title: finalTitle,
      ...audioInfo,
      audioMimeType: mimeType || 'audio/webm',
      duration: duration || 0,
      transcript: '',
      status: willTranscribe ? 'pending' : 'transcribed',
    });

    res.status(201).json({ recording: recording.toJSON() });

    if (willTranscribe) {
      transcribeInBackground(recording._id, audioInfo.audioKey, inlineBuffer, mimeType || 'audio/webm', userDoc, limits)
        .catch(err => console.error('[finalize-upload BG]', err));
    }
  } catch (error) {
    console.error('[finalize-upload] Error:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Failed to finalize upload' });
  }
});
// ────────────────────────────────────────────────────────────────────────────

// GET /recordings/limits — current usage vs plan limits
router.get('/limits', async (req, res) => {
  try {
    const userDoc = await User.findById(req.user.id);
    const limits = await getEffectiveLimits(userDoc);
    const plan = getActivePlan(userDoc);

    const [monthlyCount, storageUsed] = await Promise.all([
      Recording.countDocuments({ user: req.user.id, createdAt: { $gte: startOfCurrentMonth() } }),
      getUserStorageUsed(req.user.id),
    ]);

    res.json({
      plan,
      usage: {
        recordingsThisMonth: monthlyCount,
        storageUsedBytes: storageUsed,
      },
      limits: {
        recordingsPerMonth: limits.recordingsPerMonth,
        maxDurationSecs: limits.maxDurationSecs,
        maxStorageBytes: limits.maxStorageBytes,
        indianLanguages: limits.indianLanguages,
        meetingMinutes: limits.meetingMinutes,
        actionItems: limits.actionItems,
        pdfExport: limits.pdfExport,
      },
    });
  } catch (error) {
    console.error('Error fetching limits:', error);
    res.status(500).json({ error: 'Failed to fetch usage limits' });
  }
});

// Get all recordings for user
router.get('/', async (req, res) => {
  try {
    const recordings = await Recording.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .lean({ virtuals: true });

    // Refresh signed URLs for audio files
    const recordingsWithUrls = await Promise.all(
      recordings.map(async (recording) => {
        if (recording.audioKey) {
          try {
            recording.audioUrl = await getAudioUrl(recording.audioKey);
          } catch (e) {
            recording.audioUrl = null;
          }
        }
        return recording;
      })
    );

    res.json({ recordings: recordingsWithUrls });
  } catch (error) {
    console.error('Error fetching recordings:', error);
    res.status(500).json({ error: 'Failed to fetch recordings' });
  }
});

// Get single recording
router.get('/:id', async (req, res) => {
  try {
    const recording = await Recording.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!recording) {
      return res.status(404).json({ error: 'Recording not found' });
    }

    // Refresh signed URL
    if (recording.audioKey) {
      try {
        recording.audioUrl = await getAudioUrl(recording.audioKey);
      } catch (e) {
        // Keep existing URL if refresh fails
      }
    }

    res.json({ recording });
  } catch (error) {
    console.error('Error fetching recording:', error);
    res.status(500).json({ error: 'Failed to fetch recording' });
  }
});

// Get presigned upload URL (for direct client upload to R2)
router.post('/upload-url', async (req, res) => {
  try {
    const { mimeType, duration } = req.body;
    const userDoc = await User.findById(req.user.id);
    const check = await checkCreateLimits(req.user.id, userDoc, duration || 0, 0);
    if (!check.ok) return res.status(check.status).json({ error: check.error, code: check.code });

    const { uploadUrl, key } = await getUploadUrl(req.user.id, mimeType);
    res.json({ uploadUrl, key, plan: getActivePlan(userDoc) });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

// Background transcription — runs after response is sent to avoid proxy timeouts
const transcribeInBackground = async (recordingId, audioKey, inlineBuffer, mimeType, userDoc, limits) => {
  try {
    await Recording.findByIdAndUpdate(recordingId, { status: 'transcribing' });

    let audioBuffer = inlineBuffer;
    if (!audioBuffer && audioKey) {
      const audioUrl = await getAudioUrl(audioKey);
      const response = await fetch(audioUrl);
      if (!response.ok) throw new Error(`Failed to download audio: ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      audioBuffer = Buffer.from(arrayBuffer);
    }

    if (!audioBuffer || audioBuffer.length < 1000) {
      throw new Error('Audio file is too small or corrupted');
    }

    const hasSarvamKey = !!process.env.SARVAM_API_KEY;
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
    const usesSarvam = isIndianUser(userDoc) && hasSarvamKey && limits.indianLanguages;
    const langCode = getSarvamLanguageCode(userDoc);

    let finalTranscript, transcriptionDuration;
    if (usesSarvam) {
      console.log(`[BG ${recordingId}] Using Sarvam AI, lang:`, langCode || 'auto-detect');
      const result = await transcribeAudioSarvam(audioBuffer, mimeType, langCode);
      finalTranscript = result.text;
      transcriptionDuration = result.duration || 0;

      // Sarvam returned empty — fall back to Whisper for better noise/accent handling
      if (!finalTranscript && hasOpenAIKey) {
        console.log(`[BG ${recordingId}] Sarvam returned empty transcript, falling back to Whisper`);
        const fallback = await transcribeAudio(audioBuffer, mimeType);
        finalTranscript = fallback.text;
        transcriptionDuration = fallback.duration || 0;
        console.log(`[BG ${recordingId}] Whisper result length: ${finalTranscript?.length ?? 0}`);
      }

      if (!finalTranscript) {
        console.warn(`[BG ${recordingId}] Both Sarvam and Whisper returned empty — audio likely has no speech`);
      }
    } else if (hasOpenAIKey) {
      console.log(`[BG ${recordingId}] Using OpenAI Whisper`);
      const result = await transcribeAudio(audioBuffer, mimeType);
      finalTranscript = result.text;
      transcriptionDuration = result.duration || 0;
      console.log(`[BG ${recordingId}] Whisper result length: ${finalTranscript?.length ?? 0}`);
    } else {
      throw new Error('No transcription API key configured');
    }

    const update = { transcript: finalTranscript || '', duration: transcriptionDuration, status: 'transcribed' };

    if (finalTranscript && finalTranscript.length > 20 && process.env.GEMINI_API_KEY) {
      try {
        update.title = await generateTitle(finalTranscript);
      } catch (e) {
        console.error(`[BG ${recordingId}] Title generation failed:`, e.message);
      }
    }

    await Recording.findByIdAndUpdate(recordingId, update);
    console.log(`[BG ${recordingId}] Transcription complete`);
  } catch (error) {
    console.error(`[BG ${recordingId}] Transcription failed:`, error.message);
    // Incomplete MP4 (moov atom missing) means the audio upload was cut short.
    // Don't mark as 'failed' — save the recording with an empty transcript so
    // the user can still access it and retry manually.
    const isCorruptAudio = /moov atom|invalid.*corrupt|corrupt.*audio|ffprobe exited|ffmpeg exited/i.test(error.message);
    if (isCorruptAudio) {
      console.warn(`[BG ${recordingId}] Audio file incomplete/corrupt — saving with placeholder transcript`);
      await Recording.findByIdAndUpdate(recordingId, {
        status: 'transcribed',
        transcript: '[Audio recording was incomplete or corrupted and could not be transcribed. Please re-record.]'
      }).catch(() => {});
    } else {
      await Recording.findByIdAndUpdate(recordingId, { status: 'failed' }).catch(() => {});
    }
  }
};

// Create new recording
router.post('/', async (req, res) => {
  try {
    const { title, audioData, audioKey, audioSize: clientAudioSize, duration, transcript, mimeType, autoTranscribe, tempUpload } = req.body;

    console.log('Creating recording:', {
      title,
      hasAudioData: !!audioData,
      audioKey,
      duration,
      mimeType,
      tempUpload: !!tempUpload,
      hasR2Config: !!process.env.R2_ACCESS_KEY_ID,
    });

    // Plan limit checks
    const userDoc = await User.findById(req.user.id);
    const incomingBytes = (audioData && !tempUpload)
      ? Buffer.byteLength(audioData, 'base64')
      : (audioKey ? (clientAudioSize || 0) : 0);
    const check = await checkCreateLimits(req.user.id, userDoc, duration || 0, incomingBytes);
    if (!check.ok) return res.status(check.status).json({ error: check.error, code: check.code });
    const limits = getPlanLimits(userDoc);

    let audioInfo = { audioKey: null, audioUrl: null, audioSize: 0 };
    let inlineBuffer = null; // only set for the base64/tempUpload path

    // Option 1: Direct upload key provided (file already uploaded to R2)
    if (audioKey && process.env.R2_ACCESS_KEY_ID) {
      audioInfo.audioKey = audioKey;
      audioInfo.audioUrl = await getAudioUrl(audioKey);
      audioInfo.audioSize = clientAudioSize || 0;
    }
    // Option 2: Base64 audioData provided (mobile / legacy path)
    else if (audioData) {
      try {
        const base64Data = audioData.replace(/^data:[^,]+,/, '');
        inlineBuffer = Buffer.from(base64Data, 'base64');
        console.log('Audio buffer size:', inlineBuffer.length);

        if (process.env.R2_ACCESS_KEY_ID && !tempUpload) {
          const uploaded = await uploadAudio(inlineBuffer, req.user.id, mimeType || 'audio/webm');
          audioInfo = { audioKey: uploaded.key, audioUrl: uploaded.url, audioSize: uploaded.size };
          // buffer is still needed for background transcription; clear it after that
        }
      } catch (uploadError) {
        console.error('Audio processing error:', uploadError);
      }
    } else {
      console.log('Skipping audio operations:', { hasAudioData: !!audioData, hasAudioKey: !!audioKey, hasR2Config: !!process.env.R2_ACCESS_KEY_ID });
    }

    const willTranscribe = autoTranscribe !== false
      && (audioInfo.audioKey || inlineBuffer)
      && (process.env.OPENAI_API_KEY || process.env.SARVAM_API_KEY);

    const now = new Date();
    const initialTitle = title || `Recording ${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const recording = await Recording.create({
      user: req.user.id,
      title: initialTitle,
      ...audioInfo,
      audioMimeType: mimeType || 'audio/webm',
      duration: duration || 0,
      transcript: transcript || '',
      status: willTranscribe ? 'pending' : 'transcribed',
    });

    // Respond immediately — transcription runs in the background
    res.status(201).json({ recording: recording.toJSON() });

    if (willTranscribe) {
      // inlineBuffer for Option 2 (no R2 or tempUpload); null for Option 1 (background will fetch from R2)
      const bufferForBg = (inlineBuffer && (!audioInfo.audioKey || tempUpload)) ? inlineBuffer : null;
      transcribeInBackground(recording._id, audioInfo.audioKey || null, bufferForBg, mimeType || 'audio/webm', userDoc, limits)
        .catch(err => console.error('[BG] Unhandled error:', err));
    }
  } catch (error) {
    console.error('Error creating recording:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to create recording' });
    }
  }
});

// Update recording
router.patch('/:id', async (req, res) => {
  try {
    const { title, transcript, summary, minutes, status, tags, actionItems } = req.body;

    const recording = await Recording.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      {
        ...(title !== undefined && { title }),
        ...(transcript !== undefined && { transcript }),
        ...(summary !== undefined && { summary }),
        ...(minutes !== undefined && { minutes }),
        ...(status !== undefined && { status }),
        ...(tags !== undefined && { tags }),
        ...(actionItems !== undefined && { actionItems })
      },
      { new: true, runValidators: true }
    );

    if (!recording) {
      return res.status(404).json({ error: 'Recording not found' });
    }

    res.json({ recording });
  } catch (error) {
    console.error('Error updating recording:', error);
    res.status(500).json({ error: 'Failed to update recording' });
  }
});

// Delete recording
router.delete('/:id', async (req, res) => {
  try {
    const recording = await Recording.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!recording) {
      return res.status(404).json({ error: 'Recording not found' });
    }

    // Delete audio from R2 if configured
    if (recording.audioKey && process.env.R2_ACCESS_KEY_ID) {
      try {
        await deleteAudio(recording.audioKey);
      } catch (e) {
        console.error('Failed to delete audio from R2:', e);
      }
    }

    await recording.deleteOne();

    res.json({ message: 'Recording deleted successfully' });
  } catch (error) {
    console.error('Error deleting recording:', error);
    res.status(500).json({ error: 'Failed to delete recording' });
  }
});

// Transcribe an existing recording with Whisper
router.post('/:id/transcribe', async (req, res) => {
  // Set a longer timeout for this endpoint (5 minutes)
  req.setTimeout(300000);
  res.setTimeout(300000);
  
  try {
    console.log('Transcribe request for recording:', req.params.id);
    
    const recording = await Recording.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!recording) {
      return res.status(404).json({ error: 'Recording not found' });
    }

    if (!recording.audioKey && !recording.audioUrl) {
      return res.status(400).json({ error: 'No audio file found for this recording' });
    }

    if (!process.env.OPENAI_API_KEY && !process.env.SARVAM_API_KEY) {
      return res.status(500).json({ error: 'No transcription API key configured' });
    }

    // Update status to transcribing
    recording.status = 'transcribing';
    await recording.save();
    console.log('Status updated to transcribing');

    try {
      // Get fresh audio URL and transcribe
      console.log('Getting audio URL for key:', recording.audioKey);
      const audioUrl = await getAudioUrl(recording.audioKey);
      console.log('Downloading and transcribing audio...');

      const userDoc = await User.findById(req.user.id);
      const limits = getPlanLimits(userDoc);
      const usesSarvam = isIndianUser(userDoc) && !!process.env.SARVAM_API_KEY && limits.indianLanguages;
      const langCode = getSarvamLanguageCode(userDoc);

      const startTime = Date.now();
      let result;
      if (usesSarvam) {
        console.log('[Transcription] Using Sarvam AI, lang:', langCode || 'auto-detect');
        result = await transcribeFromUrlSarvam(audioUrl, recording.audioMimeType, langCode);

        // Sarvam returned empty — fall back to Whisper for better noise/accent handling
        if (!result.text && process.env.OPENAI_API_KEY) {
          console.log('[Transcription] Sarvam returned empty, falling back to Whisper');
          result = await transcribeFromUrl(audioUrl, recording.audioMimeType);
        }
      } else {
        console.log('[Transcription] Using OpenAI Whisper');
        result = await transcribeFromUrl(audioUrl, recording.audioMimeType);
      }
      console.log(`Transcription completed in ${(Date.now() - startTime) / 1000}s`);

      recording.transcript = result.text;
      recording.duration = result.duration || recording.duration;
      recording.status = 'transcribed';
      await recording.save();

      res.json({
        transcript: result.text,
        duration: result.duration,
        recording
      });
    } catch (transcribeError) {
      const isCorruptAudio = /moov atom|invalid.*corrupt|corrupt.*audio|ffprobe exited|ffmpeg exited/i.test(transcribeError.message);
      if (isCorruptAudio) {
        console.warn('Transcription skipped — audio file is incomplete/corrupt (moov atom missing)');
        recording.transcript = '[Audio recording was incomplete or corrupted and could not be transcribed. Please re-record.]';
        recording.status = 'transcribed';
        await recording.save();
        return res.json({ transcript: recording.transcript, duration: recording.duration, recording });
      }
      console.error('Transcription error:', transcribeError.message);
      recording.status = 'failed';
      await recording.save();
      logError('transcription_failed', transcribeError.message, { userId: req.user.id, recordingId: recording._id });
      throw transcribeError;
    }
  } catch (error) {
    console.error('Error transcribing recording:', error);
    res.status(500).json({ error: 'Failed to transcribe recording: ' + error.message });
  }
});

// Generate summary using Gemini AI
router.post('/:id/summarize', async (req, res) => {
  try {
    const recording = await Recording.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!recording) {
      return res.status(404).json({ error: 'Recording not found' });
    }

    const transcript = recording.transcript || req.body.transcript || '';

    if (!transcript || transcript.length < 50) {
      return res.status(400).json({ error: 'Transcript too short to summarize' });
    }

    console.log('Generating summary for recording:', recording._id);
    const userDoc = await User.findById(req.user.id);
    const englishTranscript = await toEnglishTranscript(transcript, userDoc);
    let summary = await generateSummary(englishTranscript);
    summary = await toPreferredLanguage(summary, userDoc);

    recording.summary = summary;
    recording.status = 'summarized';
    await recording.save();

    res.json({ summary, recording });
  } catch (error) {
    console.error('Error generating summary:', error);
    logError('summary_failed', error.message, { userId: req.user.id });
    res.status(500).json({ error: 'Failed to generate summary: ' + error.message });
  }
});

// Generate meeting minutes using Gemini AI — Pro/Team only
router.post('/:id/minutes', async (req, res) => {
  try {
    const userDoc = await User.findById(req.user.id);
    const limits = await getEffectiveLimits(userDoc);
    if (!limits.meetingMinutes) {
      return res.status(403).json({
        error: 'Meeting minutes require a Pro or Team plan. Upgrade to unlock this feature.',
        code: 'PLAN_LIMIT_MINUTES',
      });
    }

    const recording = await Recording.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!recording) {
      return res.status(404).json({ error: 'Recording not found' });
    }

    if (!recording.transcript || recording.transcript.length < 50) {
      return res.status(400).json({ error: 'Transcript too short to generate minutes' });
    }

    console.log('Generating minutes for recording:', recording._id);

    // Determine output language — let Gemini handle it natively instead of
    // post-translating via Sarvam (which breaks markdown with 900-char chunks)
    const LANG_LABELS = {
      hindi: 'Hindi', tamil: 'Tamil', telugu: 'Telugu', bengali: 'Bengali',
      kannada: 'Kannada', malayalam: 'Malayalam', marathi: 'Marathi',
      gujarati: 'Gujarati', punjabi: 'Punjabi', odia: 'Odia',
    };
    const prefLang = userDoc?.summaryLanguage?.toLowerCase().trim();
    const outputLanguage = (prefLang && prefLang !== 'english' && prefLang !== 'en')
      ? (LANG_LABELS[prefLang] || null)
      : null;

    const minutes = await generateMeetingMinutes(
      recording.transcript,   // pass raw transcript — Gemini handles any language
      recording.summary,
      recording.title,
      outputLanguage          // null = English output
    );

    recording.minutes = minutes;
    recording.status = 'completed';
    await recording.save();

    res.json({ minutes, recording });
  } catch (error) {
    console.error('Error generating minutes:', error);
    logError('minutes_failed', error.message, { userId: req.user.id });
    res.status(500).json({ error: 'Failed to generate minutes: ' + error.message });
  }
});

// Extract action items using Gemini AI — Pro/Team only
router.post('/:id/actions', async (req, res) => {
  try {
    const userDoc = await User.findById(req.user.id);
    const limits = await getEffectiveLimits(userDoc);
    if (!limits.actionItems) {
      return res.status(403).json({
        error: 'Action item extraction requires a Pro or Team plan. Upgrade to unlock this feature.',
        code: 'PLAN_LIMIT_ACTIONS',
      });
    }

    const recording = await Recording.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!recording) {
      return res.status(404).json({ error: 'Recording not found' });
    }

    if (!recording.transcript || recording.transcript.length < 50) {
      return res.status(400).json({ error: 'Transcript too short to extract actions' });
    }

    console.log('Extracting action items for recording:', recording._id);
    const actionItems = await extractActionItems(recording.transcript);

    recording.actionItems = actionItems;
    await recording.save();

    res.json({ actionItems, recording });
  } catch (error) {
    console.error('Error extracting action items:', error);
    logError('actions_failed', error.message, { userId: req.user.id });
    res.status(500).json({ error: 'Failed to extract action items: ' + error.message });
  }
});

// Generate AI title from transcript
router.post('/:id/generate-title', async (req, res) => {
  try {
    const recording = await Recording.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!recording) {
      return res.status(404).json({ error: 'Recording not found' });
    }

    if (!recording.transcript || recording.transcript.length < 20) {
      return res.status(400).json({ error: 'Transcript too short to generate title' });
    }

    console.log('Generating AI title for recording:', recording._id);
    const title = await generateTitle(recording.transcript);

    recording.title = title;
    await recording.save();

    res.json({ title, recording });
  } catch (error) {
    console.error('Error generating title:', error);
    res.status(500).json({ error: 'Failed to generate title: ' + error.message });
  }
});

export default router;
