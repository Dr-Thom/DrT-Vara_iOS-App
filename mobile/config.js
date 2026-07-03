// API Configuration
export const API_CONFIG = {
  // Production backend on Render (https://drt-vara-ios-app.onrender.com)
  // Backed by MongoDB Atlas cluster Samson-prod
  BACKEND_URL: 'https://drt-vara-ios-app.onrender.com',
};

// ─── AdMob Ad-Mode Resolver ───────────────────────────────
// TEST ads in: development, debug, internal testing, closed testing
// LIVE ads in: production builds only (EXPO_PUBLIC_AD_MODE=live in eas.json)
//
// Source of truth (highest priority first):
//   1. __DEV__               → Expo Go / dev client  → TEST
//   2. EXPO_PUBLIC_AD_MODE   → Set per eas.json build profile
//                              "test" → TEST ads
//                              "live" → LIVE ads
//   3. Default               → TEST (safer — never accidentally click live ads in testing)
const ENV_AD_MODE = (process.env.EXPO_PUBLIC_AD_MODE || '').toLowerCase();
export const IS_TEST_ADS =
  // eslint-disable-next-line no-undef
  __DEV__ || ENV_AD_MODE !== 'live';
export const AD_MODE_LABEL = IS_TEST_ADS ? 'TEST' : 'LIVE';

// Startup log (printed once when the module first loads)
// Tells QA + Play Store reviewers + developers which ad mode is active.
// eslint-disable-next-line no-console
console.log(
  `[SAMSON AdMob] Running in ${AD_MODE_LABEL} ADS mode ` +
  `(EXPO_PUBLIC_AD_MODE="${process.env.EXPO_PUBLIC_AD_MODE || 'unset'}", __DEV__=${typeof __DEV__ !== 'undefined' ? __DEV__ : 'unknown'})`
);

// AdMob Configuration (REAL production IDs — VARA AdMob account)
// These are ONLY served when IS_TEST_ADS === false (i.e. production builds)
export const ADMOB_CONFIG = {
  APP_ID: 'ca-app-pub-2444447122681811~9772357899',
  BANNER_AD_UNIT: 'ca-app-pub-2444447122681811/6825110443',
  INTERSTITIAL_AD_UNIT: 'ca-app-pub-2444447122681811/8220741143',
  REWARDED_AD_UNIT: 'ca-app-pub-2444447122681811/9291491680',
};

// SAMSON Reward Economics (Beta MVP spec — single source of truth)
// Must match /app/backend/utils/economics.py
export const APP_CONFIG = {
  // Core reward values
  REWARD_PER_TASK: 0.10,             // $0.10 per completed task
  BONUS_INTERVAL: 5,                 // Every 5 tasks → $1 bonus
  BONUS_AMOUNT: 1.0,                 // $1 per bonus cycle
  SUPER_BONUS_INTERVAL: 25,          // Every 25 tasks → $10 super bonus
  SUPER_BONUS_AMOUNT: 10.0,          // $10 per super bonus cycle
  REWARDED_VIDEO_BONUS: 0.05,        // $0.05 per rewarded video
  MINIMUM_WITHDRAWAL: 5.0,           // $5 minimum cash-out
  DAILY_GOAL_TASKS: 5,               // Daily goal: 5 tasks

  // Referrals (Beta MVP)
  REFERRAL_GOAL: 3,                  // 3 qualified friends
  REFERRAL_BONUS: 10.0,              // $10 awarded when goal reached
  REFERRAL_PCT: 0.10,                // 10% of referred user's earnings (legacy/ongoing)
  REFERRAL_CAP: 10.0,                // Capped at $10 per referred user (legacy)

  // Misc
  TASKS_BEFORE_INTERSTITIAL: 3,
};

// Streak tiers (display only — backend is source of truth)
export const STREAK_TIERS = [
  { days: 14, multiplier: 1.5, label: 'Blazing' },
  { days: 7, multiplier: 1.25, label: 'Hot' },
  { days: 3, multiplier: 1.1, label: 'Warming' },
];

export function streakMultiplier(days) {
  for (const t of STREAK_TIERS) if (days >= t.days) return t.multiplier;
  return 1.0;
}

// Helper: next $1 bonus target — always within current 5-task cycle
export function nextBonusInfo(tasksCompleted) {
  const cyclePosition = tasksCompleted % APP_CONFIG.BONUS_INTERVAL;
  const remaining = cyclePosition === 0 ? APP_CONFIG.BONUS_INTERVAL : APP_CONFIG.BONUS_INTERVAL - cyclePosition;
  return {
    amount: APP_CONFIG.BONUS_AMOUNT,
    cycleSize: APP_CONFIG.BONUS_INTERVAL,
    inCycle: cyclePosition,
    remaining,
    threshold: tasksCompleted + remaining,
  };
}

// Helper: next $10 super bonus target
export function nextSuperBonusInfo(tasksCompleted) {
  const cyclePosition = tasksCompleted % APP_CONFIG.SUPER_BONUS_INTERVAL;
  const remaining = cyclePosition === 0 ? APP_CONFIG.SUPER_BONUS_INTERVAL : APP_CONFIG.SUPER_BONUS_INTERVAL - cyclePosition;
  return {
    amount: APP_CONFIG.SUPER_BONUS_AMOUNT,
    cycleSize: APP_CONFIG.SUPER_BONUS_INTERVAL,
    inCycle: cyclePosition,
    remaining,
    threshold: tasksCompleted + remaining,
  };
}

// Legacy helpers (kept so older screens like Calculator/Dashboard imports don't break)
export function computeBonusesEarned(tasksCompleted) {
  return Math.floor(tasksCompleted / APP_CONFIG.BONUS_INTERVAL);
}

export function nextBonusThreshold(tasksCompleted) {
  return nextBonusInfo(tasksCompleted).threshold;
}

// Legacy: provide BONUS_MILESTONES array for any old code (single recurring rule)
export const BONUS_MILESTONES = [
  { threshold: APP_CONFIG.BONUS_INTERVAL, amount: APP_CONFIG.BONUS_AMOUNT },
];
export const RECURRING_BONUS = {
  interval: APP_CONFIG.BONUS_INTERVAL,
  amount: APP_CONFIG.BONUS_AMOUNT,
};

// Legacy fields used by older screens that still read APP_CONFIG.BONUS_AMOUNT, etc.
APP_CONFIG.FIRST_BONUS_AT = APP_CONFIG.BONUS_INTERVAL;
APP_CONFIG.RECURRING_BONUS_INTERVAL = APP_CONFIG.BONUS_INTERVAL;

