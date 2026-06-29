import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import connectDB from './config/database.js';
import authRoutes from './routes/auth.js';
import recordingsRoutes from './routes/recordings.js';
import adminRoutes from './routes/admin.js';
import paymentsRoutes from './routes/payments.js';
import { authenticateToken } from './middleware/auth.js';
import PlanConfig from './models/PlanConfig.js';

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS - Allow configured origins (comma-separated ALLOWED_ORIGINS env var, falls back to localhost in dev)
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:4173'];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    // Same-origin or non-browser clients (mobile app, curl, etc.)
    res.header('Access-Control-Allow-Origin', '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Middleware
app.use(express.json({ limit: '150mb' }));
app.use(express.urlencoded({ extended: true, limit: '150mb' }));

// Default features seeded on first request if DB has none
const DEFAULT_PRICES = {
  free:    { monthlyPrice: '₹0',   annualMonthly: '₹0',   annualTotal: '₹0',      monthlyPaise: 0    },
  starter: { monthlyPrice: '₹149', annualMonthly: '₹99',  annualTotal: '₹1,188',  monthlyPaise: 14900 },
  pro:     { monthlyPrice: '₹499', annualMonthly: '₹399', annualTotal: '₹4,788',  monthlyPaise: 49900 },
  growth:  { monthlyPrice: '₹999', annualMonthly: '₹799', annualTotal: '₹9,588',  monthlyPaise: 99900 },
  team:    { monthlyPrice: '₹799', annualMonthly: '₹599', annualTotal: '₹7,188',  monthlyPaise: 79900 },
};

const DEFAULT_FEATURES = {
  free: [
    { text: 'Unlimited recordings', included: true },
    { text: 'Up to 20 min per recording', included: true },
    { text: 'AI transcription (English + Malayalam)', included: true },
    { text: 'Basic AI summary', included: true },
    { text: 'Meeting minutes', included: false },
    { text: 'PDF export', included: false },
  ],
  starter: [
    { text: 'Unlimited recordings', included: true },
    { text: 'Up to 45 min per recording', included: true },
    { text: 'AI transcription (English + Hindi + Malayalam)', included: true },
    { text: 'AI summary + notes', included: true },
    { text: 'Meeting minutes', included: false },
    { text: 'PDF export', included: false },
  ],
  pro: [
    { text: 'Unlimited recordings', included: true },
    { text: 'Up to 2 hours per recording', included: true },
    { text: 'AI transcription (15+ languages)', included: true },
    { text: 'AI summary + meeting minutes', included: true },
    { text: 'Action item extraction', included: true },
    { text: 'PDF export', included: true },
  ],
  growth: [
    { text: 'Unlimited recordings', included: true },
    { text: 'Up to 3 hours per recording', included: true },
    { text: 'AI transcription (20+ languages)', included: true },
    { text: 'Everything in Pro', included: true },
    { text: '25 GB storage', included: true },
    { text: 'Priority processing + support', included: true },
  ],
  team: [
    { text: 'Unlimited recordings', included: true },
    { text: 'Up to 3 hours per recording', included: true },
    { text: 'All 11 Indian languages', included: true },
    { text: 'AI summaries + meeting minutes', included: true },
    { text: 'PDF export', included: true },
    { text: 'Priority support', included: true },
  ],
};

// Public: get plan features (used by pricing pages)
app.get('/api/plans', async (req, res) => {
  try {
    const configs = await PlanConfig.find().lean();
    const result = {};
    for (const plan of ['free', 'starter', 'pro', 'growth', 'team']) {
      const found = configs.find(c => c.plan === plan);
      const def = DEFAULT_PRICES[plan];
      result[plan] = {
        features:      found?.features      ?? DEFAULT_FEATURES[plan],
        monthlyPrice:  found?.monthlyPrice  || def.monthlyPrice,
        annualMonthly: found?.annualMonthly || def.annualMonthly,
        annualTotal:   found?.annualTotal   || def.annualTotal,
        monthlyPaise:  found?.monthlyPaise  || def.monthlyPaise,
        gates:         found?.gates         ?? {},
      };
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load plan features' });
  }
});

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/recordings', authenticateToken, recordingsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    dbState: mongoose.connection.readyState
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`); 
});



