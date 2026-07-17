//  API Configuration
export const API_CONFIG = {
  BACKEND_URL: 'https://drt-vara-ios-app.onrender.com',
};

// ─── AdMob Ad-Mode Resolver ───────────────────────────────
// TEST ads in: development, debug, internal testing, closed testing
// LIVE ads in: production builds only (EXPO_PUBLIC_AD_MODE=live in eas.json)
const ENV_AD_MODE = (process.env.EXPO_PUBLIC_AD_MODE || '').toLowerCase();
// eslint-disable-next-line no-undef
export const IS_TEST_ADS = __DEV__ || ENV_AD_MODE !== 'live';
export const AD_MODE_LABEL = IS_TEST_ADS ? 'TEST' : 'LIVE';

// Startup log (printed once when the module first loads)
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

// SAMSON Reward Economics
export const APP_CONFIG = {
  REWARD_PER_TASK: 0.10,
  BONUS_INTERVAL: 5,
  BONUS_AMOUNT: 1.0,
  SUPER_BONUS_INTERVAL: 25,
  SUPER_BONUS_AMOUNT: 10.0,
  REWARDED_VIDEO_BONUS: 0.05,
  MINIMUM_WITHDRAWAL: 5.0,
  DAILY_GOAL_TASKS: 5,
  REFERRAL_GOAL: 3,
  REFERRAL_BONUS: 10.0,
  REFERRAL_PCT: 0.10,
  REFERRAL_CAP: 10.0,
  TASKS_BEFORE_INTERSTITIAL: 3,
};

export const STREAK_TIERS = [
  { days: 14, multiplier: 1.5, label: 'Blazing' },
  { days: 7, multiplier: 1.25, label: 'Hot' },
  { days: 3, multiplier: 1.1, label: 'Warming' },
];

export function streakMultiplier(days) {
  for (const t of STREAK_TIERS) if (days >= t.days) return t.multiplier;
  return 1.0;
}

export function nextBonusInfo(tasksCompleted) {
  const cyclePosition = tasksCompleted % APP_CONFIG.BONUS_INTERVAL;
  const remaining = cyclePosition === 0 ? APP_CONFIG.BONUS_INTERVAL : APP_CONFIG.BONUS_INTERVAL - cyclePosition;
  return { amount: APP_CONFIG.BONUS_AMOUNT, cycleSize: APP_CONFIG.BONUS_INTERVAL, inCycle: cyclePosition, remaining, threshold: tasksCompleted + remaining };
}

export function nextSuperBonusInfo(tasksCompleted) {
  const cyclePosition = tasksCompleted % APP_CONFIG.SUPER_BONUS_INTERVAL;
  const remaining = cyclePosition === 0 ? APP_CONFIG.SUPER_BONUS_INTERVAL : APP_CONFIG.SUPER_BONUS_INTERVAL - cyclePosition;
  return { amount: APP_CONFIG.SUPER_BONUS_AMOUNT, cycleSize: APP_CONFIG.SUPER_BONUS_INTERVAL, inCycle: cyclePosition, remaining, threshold: tasksCompleted + remaining };
}

export function computeBonusesEarned(tasksCompleted) {
  return Math.floor(tasksCompleted / APP_CONFIG.BONUS_INTERVAL);
}

export function nextBonusThreshold(tasksCompleted) {
  return nextBonusInfo(tasksCompleted).threshold;
}

export const BONUS_MILESTONES = [{ threshold: APP_CONFIG.BONUS_INTERVAL, amount: APP_CONFIG.BONUS_AMOUNT }];
export const RECURRING_BONUS = { interval: APP_CONFIG.BONUS_INTERVAL, amount: APP_CONFIG.BONUS_AMOUNT };

APP_CONFIG.FIRST_BONUS_AT = APP_CONFIG.BONUS_INTERVAL;
APP_CONFIG.RECURRING_BONUS_INTERVAL = APP_CONFIG.BONUS_INTERVAL;
