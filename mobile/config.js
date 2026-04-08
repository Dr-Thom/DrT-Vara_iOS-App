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

// App Configuration
export const APP_CONFIG = {
  TASKS_BEFORE_INTERSTITIAL: 5, // Show interstitial ad after every 5 tasks
  BONUS_TASK_COUNT: 5, // Unlock $2 bonus after 5 tasks
  BONUS_AMOUNT: 2.0,
};
