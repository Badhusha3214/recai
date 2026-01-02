import mongoose from 'mongoose';

const recordingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    default: function() {
      return `Recording ${new Date().toLocaleDateString()}`;
    }
  },
  // Cloudflare R2 storage info
  audioKey: {
    type: String,
    default: null // R2 object key
  },
  audioUrl: {
    type: String,
    default: null // Public or signed URL
  },
  audioSize: {
    type: Number,
    default: 0 // File size in bytes
  },
  audioMimeType: {
    type: String,
    default: 'audio/webm'
  },
  duration: {
    type: Number,
    default: 0 // Duration in seconds
  },
  transcript: {
    type: String,
    default: ''
  },
  summary: {
    type: String,
    default: ''
  },
  minutes: {
    type: String,
    default: ''
  },
  actionItems: [{
    task: String,
    assignee: String,
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium'
    },
    deadline: String,
    completed: {
      type: Boolean,
      default: false
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'transcribing', 'transcribed', 'summarizing', 'summarized', 'completed', 'failed'],
    default: 'pending'
  },
  tags: [{
    type: String,
    trim: true
  }],
  metadata: {
    type: Map,
    of: String,
    default: {}
  }
}, {
  timestamps: true
});

// Index for faster queries
recordingSchema.index({ user: 1, createdAt: -1 });
recordingSchema.index({ user: 1, status: 1 });

// Virtual for formatted duration
recordingSchema.virtual('formattedDuration').get(function() {
  const mins = Math.floor(this.duration / 60);
  const secs = this.duration % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
});

// Ensure virtuals are included in JSON
recordingSchema.set('toJSON', { virtuals: true });
recordingSchema.set('toObject', { virtuals: true });

const Recording = mongoose.model('Recording', recordingSchema);
export default Recording;
