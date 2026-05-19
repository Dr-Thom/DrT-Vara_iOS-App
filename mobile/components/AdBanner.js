/**
 * AdBanner — anchored adaptive banner using Google's TEST ad unit IDs.
 * Swap ADMOB_CONFIG.BANNER_AD_UNIT to your real unit ID in /app/mobile/config.js
 * once your AdMob account is active.
 */
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { ADMOB_CONFIG } from '../config';

// In dev, always use Google's TestIds (safest — no risk of policy violations).
// In production builds, use the configured unit ID (still a test ID until you swap).
const BANNER_UNIT_ID = __DEV__ ? TestIds.BANNER : ADMOB_CONFIG.BANNER_AD_UNIT;

const AdBanner = ({ style }) => {
  return (
    <View style={[styles.wrapper, style]}>
      <BannerAd
        unitId={BANNER_UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdFailedToLoad={(e) => {
          if (__DEV__) console.log('[Banner] failed:', e?.message);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
});

export default AdBanner;
