import express from 'express';
import User from '../models/User.js';
import Recording from '../models/Recording.js';
import Coupon from '../models/Coupon.js';
import PlanConfig from '../models/PlanConfig.js';
import ErrorLog from '../models/ErrorLog.js';
import { requireAdmin } from '../middleware/auth.js';
import { deleteAudio } from '../config/storage.js';

const router = express.Router();

// All admin routes require admin role
router.use(requireAdmin);

// ── Stats overview ───────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOf7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers, verifiedUsers, privacyAccepted, todayUsers,
      totalRecordings, todayRecordings, transcribedRecordings,
      weeklyUsers, weeklyRecordings
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isVerified: true }),
      User.countDocuments({ privacyAccepted: true }),
      User.countDocuments({ createdAt: { $gte: startOfToday } }),
      Recording.countDocuments(),
      Recording.countDocuments({ createdAt: { $gte: startOfToday } }),
      Recording.countDocuments({ transcript: { $exists: true, $ne: '' } }),
      User.countDocuments({ createdAt: { $gte: startOf7Days } }),
      Recording.countDocuments({ createdAt: { $gte: startOf7Days } }),
    ]);

    res.json({
      users: { total: totalUsers, verified: verifiedUsers, privacyAccepted, today: todayUsers, week: weeklyUsers },
      recordings: { total: totalRecordings, today: todayRecordings, transcribed: transcribedRecordings, week: weeklyRecordings },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ── Users list ───────────────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const search = (req.query.search || '').trim();

    const query = search
      ? { $or: [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] }
      : {};

    const [users, total] = await Promise.all([
      User.find(query)
        .select('name email isVerified privacyAccepted privacyAcceptedAt role plan planBillingCycle planStartDate planExpiresAt createdAt lastLoginAt loginCount googleId featureOverrides')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    // Attach recording counts
    const userIds = users.map(u => u._id);
    const recordingCounts = await Recording.aggregate([
      { $match: { user: { $in: userIds } } },
      { $group: { _id: '$user', count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(recordingCounts.map(r => [r._id.toString(), r.count]));
    const usersWithCounts = users.map(u => ({ ...u, recordingCount: countMap[u._id.toString()] || 0 }));

    res.json({ users: usersWithCounts, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ── Single user detail ───────────────────────────────────────────────────────
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('name email isVerified privacyAccepted privacyAcceptedAt role plan planBillingCycle planStartDate planExpiresAt createdAt lastLoginAt loginCount googleId featureOverrides');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const recordings = await Recording.find({ user: user._id })
      .select('title duration status createdAt transcript')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.json({ user, recordings });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ── Delete user + their recordings ──────────────────────────────────────────
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    // Prevent deleting other admins
    if (user.role === 'admin') return res.status(403).json({ error: 'Cannot delete admin accounts' });

    // Delete audio files from R2 before removing DB records
    if (process.env.R2_ACCESS_KEY_ID) {
      const recordings = await Recording.find({ user: user._id }).select('audioKey').lean();
      await Promise.allSettled(recordings.filter(r => r.audioKey).map(r => deleteAudio(r.audioKey)));
    }

    await Recording.deleteMany({ user: user._id });
    await User.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ── Per-user feature overrides ───────────────────────────────────────────────
router.patch('/users/:id/overrides', async (req, res) => {
  try {
    const FIELDS = ['meetingMinutes', 'actionItems', 'pdfExport', 'indianLanguages'];
    const update = {};
    for (const f of FIELDS) {
      if (f in req.body) update[`featureOverrides.${f}`] = req.body[f] ?? null;
    }
    if (Object.keys(update).length === 0)
      return res.status(400).json({ error: 'No valid fields provided' });
    const user = await User.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (error) {
    console.error('Override update error:', error);
    res.status(500).json({ error: 'Failed to update overrides' });
  }
});

// ── Recordings list ──────────────────────────────────────────────────────────
router.get('/recordings', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const search = (req.query.search || '').trim();

    const query = search ? { title: { $regex: search, $options: 'i' } } : {};

    const [recordings, total] = await Promise.all([
      Recording.find(query)
        .populate('user', 'name email')
        .select('title duration status createdAt audioSize audioMimeType transcript user')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Recording.countDocuments(query),
    ]);

    res.json({ recordings, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recordings' });
  }
});

// ── Analytics ──────────────────────────────────────────────────────────────
router.get('/analytics', async (req, res) => {
  try {
    const days = Math.min(90, Math.max(7, parseInt(req.query.days) || 30));
    const startDate = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000);
    startDate.setHours(0, 0, 0, 0);

    const [
      usersPerDayRaw,
      recordingsPerDayRaw,
      statusBreakdown,
      googleUsers,
      totalDurationResult,
      topUsersRaw,
      totalUsers,
      privacyAccepted,
    ] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Recording.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Recording.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      User.countDocuments({ googleId: { $ne: null } }),
      Recording.aggregate([{ $group: { _id: null, totalSeconds: { $sum: '$duration' }, totalSize: { $sum: '$audioSize' } } }]),
      Recording.aggregate([
        { $group: { _id: '$user', count: { $sum: 1 }, totalDuration: { $sum: '$duration' } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'u' } },
        { $unwind: { path: '$u', preserveNullAndEmptyArrays: true } },
        { $project: { name: '$u.name', email: '$u.email', count: 1, totalDuration: 1 } },
      ]),
      User.countDocuments(),
      User.countDocuments({ privacyAccepted: true }),
    ]);

    // Fill every day in range with 0 if missing
    const fillDays = (raw) => {
      const map = Object.fromEntries(raw.map(d => [d._id, d.count]));
      return Array.from({ length: days }, (_, i) => {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        const key = d.toISOString().split('T')[0];
        return { date: key, count: map[key] || 0 };
      });
    };

    const emailUsers = totalUsers - googleUsers;

    res.json({
      signupsPerDay: fillDays(usersPerDayRaw),
      recordingsPerDay: fillDays(recordingsPerDayRaw),
      statusBreakdown,
      authMethods: { google: googleUsers, email: emailUsers },
      topUsers: topUsersRaw,
      totalDuration: totalDurationResult[0]?.totalSeconds || 0,
      totalSize: totalDurationResult[0]?.totalSize || 0,
      privacyConsentRate: totalUsers ? Math.round((privacyAccepted / totalUsers) * 100) : 0,
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// ── Recent activity feed ─────────────────────────────────────────────────────
router.get('/activity', async (req, res) => {
  try {
    const limit = Math.min(50, parseInt(req.query.limit) || 30);

    const [recentUsers, recentRecordings, recentErrors] = await Promise.all([
      User.find().select('name email createdAt isVerified privacyAccepted googleId').sort({ createdAt: -1 }).limit(limit).lean(),
      Recording.find().populate('user', 'name email').select('title status createdAt user').sort({ createdAt: -1 }).limit(limit).lean(),
      ErrorLog.find().populate('userId', 'name email').sort({ createdAt: -1 }).limit(limit).lean(),
    ]);

    const TYPE_LABEL = {
      transcription_failed: 'Transcription failed',
      summary_failed:       'Summary generation failed',
      minutes_failed:       'Minutes generation failed',
      actions_failed:       'Action items failed',
    };

    const events = [
      ...recentUsers.map(u => ({
        type: 'register',
        text: `${u.name} (${u.email}) registered${u.googleId ? ' via Google' : ''}`,
        verified: u.isVerified,
        privacyAccepted: u.privacyAccepted,
        timestamp: u.createdAt,
      })),
      ...recentRecordings.map(r => ({
        type: 'recording',
        text: `${r.user?.name || 'Unknown'} created "${r.title}"`,
        status: r.status,
        timestamp: r.createdAt,
      })),
      ...recentErrors.map(e => ({
        type: 'error',
        text: `${TYPE_LABEL[e.type] || e.type}${e.userId?.name ? ` — ${e.userId.name}` : ''}: ${e.message}`,
        errorType: e.type,
        timestamp: e.createdAt,
      })),
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);

    res.json({ events });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// ── API Costs & Company Expenses ─────────────────────────────────────────────
router.get('/costs', async (req, res) => {
  try {
    const days = Math.min(90, Math.max(7, parseInt(req.query.days) || 30));
    const startDate = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000);
    startDate.setHours(0, 0, 0, 0);

    // Pricing (USD) — overridable via env vars
    const SARVAM_COST_PER_MIN   = parseFloat(process.env.SARVAM_COST_PER_MIN    || '0.003');
    const GEMINI_INPUT_PER_1M   = parseFloat(process.env.GEMINI_INPUT_PER_1M    || '0.075');
    const GEMINI_OUTPUT_PER_1M  = parseFloat(process.env.GEMINI_OUTPUT_PER_1M   || '0.30');
    const R2_COST_PER_GB_MONTH  = parseFloat(process.env.R2_COST_PER_GB_MONTH   || '0.015');
    const CHARS_PER_TOKEN = 4;

    // ── All-time totals ──────────────────────────────────────────────────────
    const [transcribedRecs, storageAgg] = await Promise.all([
      Recording.find({ transcript: { $exists: true, $ne: '' } })
        .select('duration transcript summary minutes audioSize createdAt user')
        .lean(),
      Recording.aggregate([{ $group: { _id: null, total: { $sum: '$audioSize' } } }]),
    ]);

    let totalSarvamMinutes = 0, totalGeminiIn = 0, totalGeminiOut = 0;
    for (const rec of transcribedRecs) {
      totalSarvamMinutes += (rec.duration || 0) / 60;
      totalGeminiIn      += (rec.transcript?.length || 0) / CHARS_PER_TOKEN;
      totalGeminiOut     += ((rec.summary?.length || 0) + (rec.minutes?.length || 0)) / CHARS_PER_TOKEN;
    }
    const totalStorageBytes = storageAgg[0]?.total || 0;

    const sarvamCost        = totalSarvamMinutes * SARVAM_COST_PER_MIN;
    const geminiCost        = (totalGeminiIn / 1e6) * GEMINI_INPUT_PER_1M + (totalGeminiOut / 1e6) * GEMINI_OUTPUT_PER_1M;
    const storageCostMonthly = (totalStorageBytes / (1024 ** 3)) * R2_COST_PER_GB_MONTH;
    const totalCost         = sarvamCost + geminiCost + storageCostMonthly;

    // ── Per-day cost breakdown ───────────────────────────────────────────────
    const recentRecs = await Recording.find({
      createdAt: { $gte: startDate },
      transcript: { $exists: true, $ne: '' },
    }).select('duration transcript summary minutes createdAt').lean();

    const dayMap = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      dayMap[key] = { date: key, sarvam: 0, gemini: 0, total: 0 };
    }
    for (const rec of recentRecs) {
      const key = new Date(rec.createdAt).toISOString().split('T')[0];
      if (!dayMap[key]) continue;
      const s = ((rec.duration || 0) / 60) * SARVAM_COST_PER_MIN;
      const g = ((rec.transcript?.length || 0) / CHARS_PER_TOKEN / 1e6) * GEMINI_INPUT_PER_1M
              + (((rec.summary?.length || 0) + (rec.minutes?.length || 0)) / CHARS_PER_TOKEN / 1e6) * GEMINI_OUTPUT_PER_1M;
      dayMap[key].sarvam += s;
      dayMap[key].gemini += g;
      dayMap[key].total  += s + g;
    }

    // ── Top users by cost ────────────────────────────────────────────────────
    const topUserAgg = await Recording.aggregate([
      { $match: { transcript: { $exists: true, $ne: '' } } },
      { $group: {
        _id: '$user',
        totalMinutes:       { $sum: { $divide: ['$duration', 60] } },
        transcriptChars:    { $sum: { $strLenCP: { $ifNull: ['$transcript', ''] } } },
        summaryChars:       { $sum: { $add: [
          { $strLenCP: { $ifNull: ['$summary',  ''] } },
          { $strLenCP: { $ifNull: ['$minutes', ''] } },
        ] } },
        recordingCount: { $sum: 1 },
      }},
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'u' } },
      { $unwind: { path: '$u', preserveNullAndEmptyArrays: true } },
      { $project: { name: '$u.name', email: '$u.email', totalMinutes: 1, transcriptChars: 1, summaryChars: 1, recordingCount: 1 } },
      { $sort: { totalMinutes: -1 } },
      { $limit: 10 },
    ]);

    const topUsers = topUserAgg.map(u => {
      const sarvam = u.totalMinutes * SARVAM_COST_PER_MIN;
      const gemini = (u.transcriptChars / CHARS_PER_TOKEN / 1e6) * GEMINI_INPUT_PER_1M
                   + (u.summaryChars    / CHARS_PER_TOKEN / 1e6) * GEMINI_OUTPUT_PER_1M;
      return { ...u, sarvamCost: sarvam, geminiCost: gemini, totalCost: sarvam + gemini };
    });

    res.json({
      allTime: {
        sarvamCost, geminiCost, storageCostMonthly, totalCost,
        sarvamMinutes:       Math.round(totalSarvamMinutes * 10) / 10,
        geminiInputTokens:   Math.round(totalGeminiIn),
        geminiOutputTokens:  Math.round(totalGeminiOut),
        storageGB:           totalStorageBytes / (1024 ** 3),
      },
      costsPerDay: Object.values(dayMap),
      topUsers,
      pricing: { SARVAM_COST_PER_MIN, GEMINI_INPUT_PER_1M, GEMINI_OUTPUT_PER_1M, R2_COST_PER_GB_MONTH },
    });
  } catch (error) {
    console.error('Admin costs error:', error);
    res.status(500).json({ error: 'Failed to fetch costs' });
  }
});

// ── Subscriptions / Revenue ───────────────────────────────────────────────────
router.get('/subscriptions', async (req, res) => {
  try {
    const now = new Date();
    const allUsers = await User.find()
      .select('name email plan planBillingCycle planStartDate planExpiresAt createdAt isVerified')
      .lean();

    const activePaid = allUsers.filter(u =>
      u.plan && u.plan !== 'free' && u.planExpiresAt && new Date(u.planExpiresAt) > now
    );
    const churned = allUsers.filter(u =>
      u.plan && u.plan !== 'free' && u.planExpiresAt && new Date(u.planExpiresAt) <= now
    );
    const freeUsers = allUsers.filter(u => !u.plan || u.plan === 'free');

    // Use admin-configured prices if available, else fall back to defaults
    const planConfigs = await PlanConfig.find().lean();
    const DEFAULT_PAISE = { free: 0, starter: 14900, pro: 49900, growth: 99900, team: 79900 };
    const planPaise = {};
    for (const key of ['free','starter','pro','growth','team']) {
      const cfg = planConfigs.find(c => c.plan === key);
      planPaise[key] = cfg?.monthlyPaise || DEFAULT_PAISE[key];
    }
    let mrr = 0;
    for (const u of activePaid) {
      const monthly = planPaise[u.plan] || 0;
      const value = u.planBillingCycle === 'annual'
        ? Math.round(monthly * 12 / 12)  // annual subscribers count monthly equivalent
        : monthly;
      mrr += value;
    }
    mrr = Math.round(mrr / 100); // convert paise to rupees

    const arr = mrr * 12;
    const arpu = activePaid.length > 0 ? Math.round(mrr / activePaid.length) : 0;
    const churnRate = allUsers.length > 0
      ? Math.round((churned.length / allUsers.length) * 100)
      : 0;

    res.json({
      stats: {
        totalUsers:   allUsers.length,
        activePaid:   activePaid.length,
        activePro:    activePaid.filter(u => u.plan === 'pro').length,
        activeTeam:   activePaid.filter(u => u.plan === 'team').length,
        freeUsers:    freeUsers.length,
        churnedUsers: churned.length,
        mrrInr:       mrr,
        arrInr:       arr,
        arpuInr:      arpu,
        churnRate,
      },
      planBreakdown: {
        pro:     activePaid.filter(u => u.plan === 'pro').length,
        team:    activePaid.filter(u => u.plan === 'team').length,
        expired: churned.length,
        free:    freeUsers.length,
      },
      subscribers:  activePaid.sort((a, b) => new Date(b.planStartDate || 0) - new Date(a.planStartDate || 0)),
      churned:      churned.sort((a, b) => new Date(b.planExpiresAt) - new Date(a.planExpiresAt)).slice(0, 30),
      freeUsersList: freeUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 50),
    });
  } catch (error) {
    console.error('Admin subscriptions error:', error);
    res.status(500).json({ error: 'Failed to fetch subscription data' });
  }
});

// ── Coupons ───────────────────────────────────────────────────────────────────
router.get('/coupons', async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    res.json({ coupons });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
});

router.post('/coupons', async (req, res) => {
  try {
    const { code, discountType, discountValue, applicablePlans, maxUses, expiresAt } = req.body;
    if (!code || !discountType || discountValue == null) {
      return res.status(400).json({ error: 'code, discountType, and discountValue are required' });
    }
    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      discountType,
      discountValue: Number(discountValue),
      applicablePlans: applicablePlans || [],
      maxUses: maxUses ? Number(maxUses) : null,
      expiresAt: expiresAt || null,
    });
    res.status(201).json({ coupon });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'Coupon code already exists' });
    res.status(500).json({ error: 'Failed to create coupon' });
  }
});

router.patch('/coupons/:id', async (req, res) => {
  try {
    const { isActive, maxUses, expiresAt } = req.body;
    const update = {};
    if (isActive !== undefined) update.isActive = isActive;
    if (maxUses !== undefined) update.maxUses = maxUses ? Number(maxUses) : null;
    if (expiresAt !== undefined) update.expiresAt = expiresAt || null;
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
    res.json({ coupon });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update coupon' });
  }
});

router.delete('/coupons/:id', async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete coupon' });
  }
});

// ── Plan feature config ──────────────────────────────────────────────────────
router.get('/plans', async (req, res) => {
  try {
    const configs = await PlanConfig.find().lean();
    res.json(configs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load plan configs' });
  }
});

router.put('/plans/:plan', async (req, res) => {
  const { plan } = req.params;
  if (!['free', 'starter', 'pro', 'growth', 'team'].includes(plan)) {
    return res.status(400).json({ error: 'Invalid plan' });
  }
  const { features, monthlyPrice, annualMonthly, annualTotal, monthlyPaise, gates } = req.body;
  if (!Array.isArray(features)) {
    return res.status(400).json({ error: 'features must be an array' });
  }
  try {
    const update = { features };
    if (monthlyPrice  !== undefined) update.monthlyPrice  = monthlyPrice;
    if (annualMonthly !== undefined) update.annualMonthly = annualMonthly;
    if (annualTotal   !== undefined) update.annualTotal   = annualTotal;
    if (monthlyPaise  !== undefined) update.monthlyPaise  = Number(monthlyPaise);
    if (gates         !== undefined) update.gates         = gates;
    const config = await PlanConfig.findOneAndUpdate(
      { plan },
      update,
      { upsert: true, new: true }
    );
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save plan config' });
  }
});

export default router;
