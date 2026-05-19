// API Configuration
export const API_CONFIG = {
  BACKEND_URL: 'https://vara-landing-v1.preview.emergentagent.com',
};

// AdMob Configuration (REAL production IDs — VARA AdMob account)
export const ADMOB_CONFIG = {
  // VARA AdMob App ID
  APP_ID: 'ca-app-pub-2444447122681811~9772357899',

  // Banner Ad Unit ID
  BANNER_AD_UNIT: 'ca-app-pub-2444447122681811/6825110443',

  // Interstitial Ad Unit ID
  INTERSTITIAL_AD_UNIT: 'ca-app-pub-2444447122681811/8220741143',

  // Rewarded Video Ad Unit ID
  REWARDED_AD_UNIT: 'ca-app-pub-2444447122681811/9291491680',
};

// App Configuration (keep in sync with backend /app/backend/utils/economics.py)
export const APP_CONFIG = {
  REWARD_PER_TASK: 0.10,
  TASKS_BEFORE_INTERSTITIAL: 3,     // Show interstitial every 3 tasks
  MINIMUM_WITHDRAWAL: 5.0,          // $5.00 minimum withdrawal

  // Referral economics
  REFERRAL_PCT: 0.10,               // 10% of referred user's earnings
  REFERRAL_CAP: 10.0,               // Capped at $10 per referred user
};

// Bonus milestone ladder — must match backend
export const BONUS_MILESTONES = [
  { threshold: 5, amount: 1 },
  { threshold: 10, amount: 2 },
  { threshold: 25, amount: 5 },
  { threshold: 50, amount: 10 },
  { threshold: 100, amount: 25 },
];
export const RECURRING_BONUS = { interval: 100, amount: 25 };

// Streak tiers
export const STREAK_TIERS = [
  { days: 14, multiplier: 1.5, label: 'Blazing' },
  { days: 7, multiplier: 1.25, label: 'Hot' },
  { days: 3, multiplier: 1.1, label: 'Warming' },
];

export function streakMultiplier(days) {
  for (const t of STREAK_TIERS) if (days >= t.days) return t.multiplier;
  return 1.0;
}

// Next bonus milestone helper
export function nextBonusMilestone(tasksCompleted) {
  for (const m of BONUS_MILESTONES) {
    if (tasksCompleted < m.threshold) return m;
  }
  const last = BONUS_MILESTONES[BONUS_MILESTONES.length - 1].threshold;
  const nextHundred = (Math.floor(tasksCompleted / RECURRING_BONUS.interval) + 1) * RECURRING_BONUS.interval;
  return { threshold: nextHundred, amount: RECURRING_BONUS.amount };
}

// Trust tier helper
export function trustTier(score) {
  if (score >= 75) return { key: 'trusted', label: 'Trusted', color: '#10B981' };
  if (score >= 50) return { key: 'building', label: 'Building', color: '#3B82F6' };
  return { key: 'low', label: 'New', color: '#F59E0B' };
}

// Legacy cumulative bonus count (some mobile screens still reference this)
export function computeBonusesEarned(tasksCompleted) {
  let count = 0;
  for (const m of BONUS_MILESTONES) if (tasksCompleted >= m.threshold) count += 1;
  const last = BONUS_MILESTONES[BONUS_MILESTONES.length - 1].threshold;
  if (tasksCompleted > last) count += Math.floor((tasksCompleted - last) / RECURRING_BONUS.interval);
  return count;
}

// Legacy next threshold helper (mobile Dashboard uses this for progress bar)
export function nextBonusThreshold(tasksCompleted) {
  return nextBonusMilestone(tasksCompleted).threshold;
}

// Keep APP_CONFIG backwards-compatible for screens that still read these fields
APP_CONFIG.BONUS_AMOUNT = 1.0;
APP_CONFIG.FIRST_BONUS_AT = 5;
APP_CONFIG.RECURRING_BONUS_INTERVAL = 10;
