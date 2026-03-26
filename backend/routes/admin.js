import express from 'express';
import User from '../models/User.js';
import Recording from '../models/Recording.js';
import { requireAdmin } from '../middleware/auth.js';

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
        .select('name email isVerified privacyAccepted privacyAcceptedAt role createdAt lastLoginAt loginCount googleId')
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
      .select('name email isVerified privacyAccepted privacyAcceptedAt role createdAt lastLoginAt loginCount googleId');
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
    await Recording.deleteMany({ user: user._id });
    await User.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
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

    const [recentUsers, recentRecordings] = await Promise.all([
      User.find().select('name email createdAt isVerified privacyAccepted googleId').sort({ createdAt: -1 }).limit(limit).lean(),
      Recording.find().populate('user', 'name email').select('title status createdAt user').sort({ createdAt: -1 }).limit(limit).lean(),
    ]);

    const events = [
      ...recentUsers.map(u => ({
        type: 'register',
        icon: 'user',
        text: `${u.name} (${u.email}) registered${u.googleId ? ' via Google' : ''}`,
        verified: u.isVerified,
        privacyAccepted: u.privacyAccepted,
        timestamp: u.createdAt,
      })),
      ...recentRecordings.map(r => ({
        type: 'recording',
        icon: 'mic',
        text: `${r.user?.name || 'Unknown'} created "${r.title}"`,
        status: r.status,
        timestamp: r.createdAt,
      })),
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);

    res.json({ events });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

export default router;
