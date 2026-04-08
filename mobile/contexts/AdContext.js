import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import {
  InterstitialAd,
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import { ADMOB_CONFIG, APP_CONFIG } from '../config';

const AdContext = createContext({});

// Initialize Interstitial Ad
const interstitialAd = InterstitialAd.createForAdRequest(ADMOB_CONFIG.INTERSTITIAL_AD_UNIT, {
  requestNonPersonalizedAdsOnly: false,
});

// Initialize Rewarded Ad
const rewardedAd = RewardedAd.createForAdRequest(ADMOB_CONFIG.REWARDED_AD_UNIT, {
  requestNonPersonalizedAdsOnly: false,
});

export const AdProvider = ({ children }) => {
  const [interstitialLoaded, setInterstitialLoaded] = useState(false);
  const [rewardedLoaded, setRewardedLoaded] = useState(false);
  const tasksCompletedRef = useRef(0);

  useEffect(() => {
    // Interstitial Ad Listeners
    const unsubscribeInterstitialLoaded = interstitialAd.addAdEventListener(
      AdEventType.LOADED,
      () => {
        setInterstitialLoaded(true);
      }
    );

    const unsubscribeInterstitialClosed = interstitialAd.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        setInterstitialLoaded(false);
        interstitialAd.load(); // Reload for next time
      }
    );

    // Rewarded Ad Listeners
    const unsubscribeRewardedLoaded = rewardedAd.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        setRewardedLoaded(true);
      }
    );

    const unsubscribeRewardedClosed = rewardedAd.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        setRewardedLoaded(false);
        rewardedAd.load(); // Reload for next time
      }
    );

    // Load ads initially
    interstitialAd.load();
    rewardedAd.load();

    return () => {
      unsubscribeInterstitialLoaded();
      unsubscribeInterstitialClosed();
      unsubscribeRewardedLoaded();
      unsubscribeRewardedClosed();
    };
  }, []);

  const showInterstitialAd = () => {
    if (interstitialLoaded) {
      interstitialAd.show();
    }
  };

  const showRewardedAd = () => {
    return new Promise((resolve, reject) => {
      if (rewardedLoaded) {
        const unsubscribeEarned = rewardedAd.addAdEventListener(
          RewardedAdEventType.EARNED_REWARD,
          (reward) => {
            resolve(reward);
          }
        );

        const unsubscribeClosed = rewardedAd.addAdEventListener(
          AdEventType.CLOSED,
          () => {
            unsubscribeEarned();
            unsubscribeClosed();
          }
        );

        rewardedAd.show();
      } else {
        reject(new Error('Rewarded ad not loaded'));
      }
    });
  };

  const trackTaskCompletion = () => {
    tasksCompletedRef.current += 1;
    if (tasksCompletedRef.current % APP_CONFIG.TASKS_BEFORE_INTERSTITIAL === 0) {
      showInterstitialAd();
    }
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
