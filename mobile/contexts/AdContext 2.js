/**
 * AdContext — wraps Google Mobile Ads interstitial + rewarded.
 *
 * Behavior:
 *  - Interstitial: preloaded; shown after every N task completions (TASKS_BEFORE_INTERSTITIAL).
 *  - Rewarded:     preloaded; user-initiated via showRewardedAd(); resolves
 *                  { success: true, amount, type } only when EARNED_REWARD fires.
 *
 * All ad failures are non-fatal: callers always get a resolved promise so the
 * task / bonus flow keeps moving even if AdMob has no fill.
 */
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import mobileAds, {
  InterstitialAd,
  RewardedAd,
  AdEventType,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import { ADMOB_CONFIG, APP_CONFIG, IS_TEST_ADS } from '../config';

const INTERSTITIAL_ID = IS_TEST_ADS ? TestIds.INTERSTITIAL : ADMOB_CONFIG.INTERSTITIAL_AD_UNIT;
const REWARDED_ID = IS_TEST_ADS ? TestIds.REWARDED : ADMOB_CONFIG.REWARDED_AD_UNIT;

const TASKS_BEFORE_INTERSTITIAL = APP_CONFIG.TASKS_BEFORE_INTERSTITIAL || 3;

const AdContext = createContext({});

export const AdProvider = ({ children }) => {
  const interstitialRef = useRef(null);
  const rewardedRef = useRef(null);
  const rewardResolver = useRef(null);
  const tasksSinceLastInterstitial = useRef(0);

  const [interstitialLoaded, setInterstitialLoaded] = useState(false);
  const [rewardedLoaded, setRewardedLoaded] = useState(false);

  // ── Initialize the SDK once ───────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await mobileAds().initialize();
      } catch (e) {
        if (__DEV__) console.warn('[Ads] init failed:', e?.message);
      }
      if (cancelled) return;
      setupInterstitial();
      setupRewarded();
    })();
    return () => {
      cancelled = true;
      // No need to teardown — instances are app-scoped.
    };
  }, []);

  // ── Interstitial setup ────────────────────────────────────────────────
  const setupInterstitial = () => {
    const ad = InterstitialAd.createForAdRequest(INTERSTITIAL_ID, {
      requestNonPersonalizedAdsOnly: true,
    });
    interstitialRef.current = ad;

    ad.addAdEventListener(AdEventType.LOADED, () => setInterstitialLoaded(true));
    ad.addAdEventListener(AdEventType.CLOSED, () => {
      setInterstitialLoaded(false);
      try { ad.load(); } catch {}
    });
    ad.addAdEventListener(AdEventType.ERROR, (e) => {
      setInterstitialLoaded(false);
      if (__DEV__) console.warn('[Interstitial] error:', e?.message);
      // Retry once on a small delay
      setTimeout(() => { try { ad.load(); } catch {} }, 5000);
    });

    try { ad.load(); } catch {}
  };

  // ── Rewarded setup ────────────────────────────────────────────────────
  const setupRewarded = () => {
    const ad = RewardedAd.createForAdRequest(REWARDED_ID, {
      requestNonPersonalizedAdsOnly: true,
    });
    rewardedRef.current = ad;

    ad.addAdEventListener(RewardedAdEventType.LOADED, () => setRewardedLoaded(true));

    ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
      // Resolve the pending showRewardedAd() promise with success
      if (rewardResolver.current) {
        rewardResolver.current.resolve({
          success: true,
          amount: reward?.amount ?? 1,
          type: reward?.type ?? 'reward',
        });
        rewardResolver.current = null;
      }
    });

    ad.addAdEventListener(AdEventType.CLOSED, () => {
      setRewardedLoaded(false);
      // If user closed BEFORE earning reward, resolve as not-earned
      if (rewardResolver.current) {
        rewardResolver.current.resolve({ success: false, reason: 'closed_early' });
        rewardResolver.current = null;
      }
      try { ad.load(); } catch {}
    });

    ad.addAdEventListener(AdEventType.ERROR, (e) => {
      setRewardedLoaded(false);
      if (__DEV__) console.warn('[Rewarded] error:', e?.message);
      if (rewardResolver.current) {
        rewardResolver.current.resolve({ success: false, reason: 'error' });
        rewardResolver.current = null;
      }
      setTimeout(() => { try { ad.load(); } catch {} }, 5000);
    });

    try { ad.load(); } catch {}
  };

  // ── Public API ────────────────────────────────────────────────────────
  const showInterstitialAd = () => {
    const ad = interstitialRef.current;
    if (ad && interstitialLoaded) {
      try { ad.show(); } catch (e) {
        if (__DEV__) console.warn('[Interstitial] show failed:', e?.message);
      }
    }
  };

  /**
   * Track a task completion. Returns true if an interstitial was just shown.
   */
  const trackTaskCompletion = () => {
    tasksSinceLastInterstitial.current += 1;
    if (tasksSinceLastInterstitial.current >= TASKS_BEFORE_INTERSTITIAL) {
      tasksSinceLastInterstitial.current = 0;
      showInterstitialAd();
      return true;
    }
    return false;
  };

  /**
   * Show a rewarded ad. Always resolves (never rejects):
   *  { success: true,  amount, type }  — user earned the reward
   *  { success: false, reason }        — user closed early, error, or not loaded
   */
  const showRewardedAd = () => {
    return new Promise((resolve) => {
      const ad = rewardedRef.current;
      if (!ad || !rewardedLoaded) {
        resolve({ success: false, reason: 'not_loaded' });
        return;
      }
      rewardResolver.current = { resolve };
      try {
        ad.show();
      } catch (e) {
        if (__DEV__) console.warn('[Rewarded] show failed:', e?.message);
        rewardResolver.current = null;
        resolve({ success: false, reason: 'show_failed' });
      }
    });
  };

  return (
    <AdContext.Provider
      value={{
        showInterstitialAd,
        showRewardedAd,
        trackTaskCompletion,
        rewardedLoaded,
        interstitialLoaded,
      }}
    >
      {children}
    </AdContext.Provider>
  );
};

export const useAds = () => useContext(AdContext);
