export const PLAN_LIMITS = {
  free: {
    recordingsPerMonth: null,         // unlimited recordings; duration per session is the gate
    maxDurationSecs: 1200,            // 20 min per recording
    maxStorageBytes: 1_073_741_824,   // 1 GB
    languageTier: 'basic_indian',     // English + Malayalam
    indianLanguages: true,            // includes Malayalam via Sarvam
    meetingMinutes: false,
    actionItems: false,
    pdfExport: false,
    priorityProcessing: false,
  },
  starter: {
    recordingsPerMonth: null,         // unlimited
    maxDurationSecs: 2700,            // 45 min per recording
    maxStorageBytes: 3_221_225_472,   // 3 GB
    languageTier: 'basic_indian',     // English + Hindi + Malayalam
    indianLanguages: true,
    meetingMinutes: false,
    actionItems: false,
    pdfExport: false,
    priorityProcessing: false,
  },
  pro: {
    recordingsPerMonth: null,         // unlimited
    maxDurationSecs: 7200,            // 2 hours per recording
    maxStorageBytes: 10_737_418_240,  // 10 GB
    languageTier: 'extended',         // 15+ languages
    indianLanguages: true,
    meetingMinutes: true,
    actionItems: true,
    pdfExport: true,
    priorityProcessing: true,
  },
  growth: {
    recordingsPerMonth: null,         // unlimited
    maxDurationSecs: 10_800,          // 3 hours
    maxStorageBytes: 26_843_545_600,  // 25 GB
    languageTier: 'full',             // 20+ languages
    indianLanguages: true,
    meetingMinutes: true,
    actionItems: true,
    pdfExport: true,
    priorityProcessing: true,
  },
  // kept for existing users; no longer sold
  team: {
    recordingsPerMonth: null,
    maxDurationSecs: 10_800,
    maxStorageBytes: 53_687_091_200,  // 50 GB
    languageTier: 'full',
    indianLanguages: true,
    meetingMinutes: true,
    actionItems: true,
    pdfExport: true,
    priorityProcessing: true,
  },
};

/** Returns the user's currently active plan key, falling back to 'free' if expired. */
export const getActivePlan = (user) => {
  if (!user?.plan || user.plan === 'free') return 'free';
  if (!user.planExpiresAt || new Date(user.planExpiresAt) < new Date()) return 'free';
  return user.plan;
};

export const getPlanLimits = (user) => PLAN_LIMITS[getActivePlan(user)] ?? PLAN_LIMITS.free;

/**
 * Like getPlanLimits but merges admin-configured gate overrides from the DB.
 * Use this in routes that gate Pro/paid features (minutes, actions, etc.).
 */
export const getEffectiveLimits = async (user) => {
  const base = getPlanLimits(user);
  const plan = getActivePlan(user);

  // Tier 2: plan-wide admin overrides from PlanConfig
  let limits = base;
  try {
    const PlanConfig = (await import('../models/PlanConfig.js')).default;
    const cfg = await PlanConfig.findOne({ plan }).select('gates').lean();
    if (cfg?.gates) {
      const g = cfg.gates;
      limits = {
        ...base,
        meetingMinutes:    g.meetingMinutes    ?? base.meetingMinutes,
        actionItems:       g.actionItems       ?? base.actionItems,
        pdfExport:         g.pdfExport         ?? base.pdfExport,
        indianLanguages:   g.indianLanguages   ?? base.indianLanguages,
        recordingsPerMonth: g.recordingsPerMonth != null
          ? (g.recordingsPerMonth === 0 ? null : g.recordingsPerMonth)
          : base.recordingsPerMonth,
        maxDurationSecs: g.maxDurationMins != null
          ? g.maxDurationMins * 60
          : base.maxDurationSecs,
        maxStorageBytes: g.maxStorageGB != null
          ? g.maxStorageGB * 1_073_741_824
          : base.maxStorageBytes,
      };
    }
  } catch {
    // DB unavailable — keep hardcoded defaults
  }

  // Tier 3: per-user overrides (highest priority, set via admin)
  const ov = user?.featureOverrides;
  if (ov) {
    if (ov.meetingMinutes  != null) limits = { ...limits, meetingMinutes:  ov.meetingMinutes };
    if (ov.actionItems     != null) limits = { ...limits, actionItems:     ov.actionItems };
    if (ov.pdfExport       != null) limits = { ...limits, pdfExport:       ov.pdfExport };
    if (ov.indianLanguages != null) limits = { ...limits, indianLanguages: ov.indianLanguages };
  }

  return limits;
};
