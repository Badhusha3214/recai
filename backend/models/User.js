import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  googleId: {
    type: String,
    default: null,
  },
  avatar: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationOTP: { type: String, default: null, select: false },
  verificationOTPExpires: { type: Date, default: null },
  resetPasswordOTP: { type: String, default: null, select: false },
  resetPasswordOTPExpires: { type: Date, default: null },
  privacyAccepted: { type: Boolean, default: false },
  privacyAcceptedAt: { type: Date, default: null },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  lastLoginAt: { type: Date, default: null },
  loginCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.verificationOTP;
  delete user.resetPasswordOTP;
  return user;
};

const User = mongoose.model('User', userSchema);
export default User;
