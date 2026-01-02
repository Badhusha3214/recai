 import express from 'express';
import Recording from '../models/Recording.js';
import { uploadAudio, getAudioUrl, deleteAudio, getUploadUrl } from '../config/storage.js';
import { transcribeAudio, transcribeFromUrl } from '../config/transcription.js';
import { generateSummary, generateMeetingMinutes, extractActionItems } from '../config/gemini.js';

const router = express.Router();

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
    const { mimeType } = req.body;
    const { uploadUrl, key } = await getUploadUrl(req.user.id, mimeType);
    res.json({ uploadUrl, key });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

// Create new recording
router.post('/', async (req, res) => {
  try {
    const { title, audioData, audioKey, duration, transcript, mimeType, autoTranscribe } = req.body;

    console.log('Creating recording:', {
      title,
      hasAudioData: !!audioData,
      audioDataLength: audioData ? audioData.length : 0,
      audioKey,
      duration,
      mimeType,
      hasR2Config: !!process.env.R2_ACCESS_KEY_ID,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY
    });

    let audioInfo = { audioKey: null, audioUrl: null, audioSize: 0 };
    let audioBuffer = null;

    // Option 1: Direct upload key provided (file already uploaded to R2)
    if (audioKey && process.env.R2_ACCESS_KEY_ID) {
      console.log('Using pre-uploaded file with key:', audioKey);
      audioInfo.audioKey = audioKey;
      audioInfo.audioUrl = await getAudioUrl(audioKey);
      
      // Download from R2 to transcribe
      if (autoTranscribe !== false && process.env.OPENAI_API_KEY) {
        try {
          console.log('Downloading audio from R2 for transcription...');
          const response = await fetch(audioInfo.audioUrl);
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            audioBuffer = Buffer.from(arrayBuffer);
            console.log('Downloaded audio buffer size:', audioBuffer.length);
          }
        } catch (downloadError) {
          console.error('Failed to download audio for transcription:', downloadError);
        }
      }
    }
    // Option 2: Base64 audioData provided (upload to R2)
    else if (audioData && process.env.R2_ACCESS_KEY_ID) {
      try {
        console.log('Uploading audio to R2...');
        const base64Data = audioData.replace(/^data:audio\/[^;]+;base64,/, '');
        audioBuffer = Buffer.from(base64Data, 'base64');
        console.log('Audio buffer size:', audioBuffer.length);
        const uploaded = await uploadAudio(audioBuffer, req.user.id, mimeType || 'audio/webm');
        audioInfo = {
          audioKey: uploaded.key,
          audioUrl: uploaded.url,
          audioSize: uploaded.size
        };
        console.log('R2 upload success:', audioInfo.audioKey);
      } catch (uploadError) {
        console.error('R2 upload error:', uploadError);
        // Continue without audio if R2 is not configured
      }
    } else {
      console.log('Skipping R2 operations:', { hasAudioData: !!audioData, hasAudioKey: !!audioKey, hasR2Config: !!process.env.R2_ACCESS_KEY_ID });
    }

    // Auto-transcribe if requested and we have audio
    let finalTranscript = transcript || '';
    let transcriptionDuration = duration || 0;
    let recordingStatus = 'pending';

    if (autoTranscribe !== false && audioBuffer && process.env.OPENAI_API_KEY) {
      try {
        console.log('Starting auto-transcription with Whisper...');
        console.log('Audio buffer size for transcription:', audioBuffer.length, 'bytes');
        console.log('MIME type for transcription:', mimeType || 'audio/webm');
        
        // Validate buffer is not empty
        if (audioBuffer.length < 1000) {
          console.error('Audio buffer too small, likely corrupted:', audioBuffer.length);
          throw new Error('Audio file is too small or corrupted');
        }
        
        const transcriptionResult = await transcribeAudio(audioBuffer, mimeType || 'audio/webm');
        finalTranscript = transcriptionResult.text;
        transcriptionDuration = transcriptionResult.duration || duration || 0;
        recordingStatus = 'transcribed';
        console.log('Transcription complete:', finalTranscript.substring(0, 100) + '...');
      } catch (transcribeError) {
        console.error('Auto-transcription failed:', transcribeError);
        // Continue without transcript
      }
    }

    const recording = await Recording.create({
      user: req.user.id,
      title: title || `Recording ${new Date().toLocaleDateString()}`,
      ...audioInfo,
      audioMimeType: mimeType || 'audio/webm',
      duration: transcriptionDuration,
      transcript: finalTranscript,
      status: recordingStatus
    });

    // Convert to JSON to include virtuals
    res.status(201).json({ recording: recording.toJSON() });
  } catch (error) {
    console.error('Error creating recording:', error);
    res.status(500).json({ error: 'Failed to create recording' });
  }
});

// Update recording
router.patch('/:id', async (req, res) => {
  try {
    const { title, transcript, summary, minutes, status, tags } = req.body;

    const recording = await Recording.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { 
        ...(title && { title }),
        ...(transcript && { transcript }),
        ...(summary && { summary }),
        ...(minutes && { minutes }),
        ...(status && { status }),
        ...(tags && { tags })
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

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
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
      
      const startTime = Date.now();
      const result = await transcribeFromUrl(audioUrl, recording.audioMimeType);
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
      console.error('Transcription error:', transcribeError.message);
      recording.status = 'failed';
      await recording.save();
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
    const summary = await generateSummary(transcript);

    recording.summary = summary;
    recording.status = 'summarized';
    await recording.save();

    res.json({ summary, recording });
  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({ error: 'Failed to generate summary: ' + error.message });
  }
});

// Generate meeting minutes using Gemini AI
router.post('/:id/minutes', async (req, res) => {
  try {
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
    const minutes = await generateMeetingMinutes(
      recording.transcript,
      recording.summary,
      recording.title
    );

    recording.minutes = minutes;
    recording.status = 'completed';
    await recording.save();

    res.json({ minutes, recording });
  } catch (error) {
    console.error('Error generating minutes:', error);
    res.status(500).json({ error: 'Failed to generate minutes: ' + error.message });
  }
});

// Extract action items using Gemini AI
router.post('/:id/actions', async (req, res) => {
  try {
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
    res.status(500).json({ error: 'Failed to extract action items: ' + error.message });
  }
});

export default router;
