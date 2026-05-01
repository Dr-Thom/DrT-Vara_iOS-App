/**
 * AdContext — STUBBED (AdMob temporarily disabled to ship working APK).
 * All ad calls are no-ops; rewarded ads auto-resolve immediately.
 * Re-enable react-native-google-mobile-ads once Google account country issue resolved.
 */
import React, { createContext, useContext } from 'react';

const AdContext = createContext({});

export const AdProvider = ({ children }) => {
  const showInterstitialAd = () => { /* no-op */ };

  // Auto-resolve so task completion flow continues unblocked
  const showRewardedAd = () => Promise.resolve({ amount: 1, type: 'stub' });

  const trackTaskCompletion = () => { /* no-op */ };

  return (
    <AdContext.Provider
      value={{
        showInterstitialAd,
        showRewardedAd,
        trackTaskCompletion,
        rewardedLoaded: true,
        interstitialLoaded: true,
      }}
    >
      {children}
    </AdContext.Provider>
  );
};

export const useAds = () => useContext(AdContext);
