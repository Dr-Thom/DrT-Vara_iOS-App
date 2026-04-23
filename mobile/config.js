// API Configuration
export const API_CONFIG = {
  BACKEND_URL: 'https://vara-landing-v1.preview.emergentagent.com',
};

// AdMob Configuration (Test IDs - Replace with real IDs in production)
export const ADMOB_CONFIG = {
  // Test AdMob App ID
  APP_ID: 'ca-app-pub-3940256099942544~3347511713',

  // Banner Ad Unit IDs (Test)
  BANNER_AD_UNIT: 'ca-app-pub-3940256099942544/6300978111',

  // Interstitial Ad Unit ID (Test)
  INTERSTITIAL_AD_UNIT: 'ca-app-pub-3940256099942544/1033173712',

  // Rewarded Video Ad Unit ID (Test)
  REWARDED_AD_UNIT: 'ca-app-pub-3940256099942544/5224354917',
};

// App Configuration (keep in sync with backend /app/backend/routes/tasks.py)
export const APP_CONFIG = {
  REWARD_PER_TASK: 0.10,
  BONUS_AMOUNT: 1.0,
  FIRST_BONUS_AT: 5,                // First $1 bonus at task #5
  RECURRING_BONUS_INTERVAL: 10,     // Then every 10 tasks: #15, #25, #35...
  TASKS_BEFORE_INTERSTITIAL: 3,     // Show interstitial every 3 tasks
  MINIMUM_WITHDRAWAL: 5.0,          // $5.00 minimum withdrawal

  // Referral economics
  REFERRAL_PCT: 0.10,               // 10% of referred user's earnings
  REFERRAL_CAP: 10.0,               // Capped at $10 per referred user
};

// Compute cumulative bonuses earned at a given task count
export function computeBonusesEarned(tasksCompleted) {
  if (tasksCompleted < APP_CONFIG.FIRST_BONUS_AT) return 0;
  return 1 + Math.max(0, Math.floor((tasksCompleted - APP_CONFIG.FIRST_BONUS_AT) / APP_CONFIG.RECURRING_BONUS_INTERVAL));
}

// Compute the next task number that will award a bonus
export function nextBonusThreshold(tasksCompleted) {
  if (tasksCompleted < APP_CONFIG.FIRST_BONUS_AT) return APP_CONFIG.FIRST_BONUS_AT;
  const since = tasksCompleted - APP_CONFIG.FIRST_BONUS_AT;
  const nextOffset = Math.floor(since / APP_CONFIG.RECURRING_BONUS_INTERVAL) + 1;
  return APP_CONFIG.FIRST_BONUS_AT + nextOffset * APP_CONFIG.RECURRING_BONUS_INTERVAL;
}
