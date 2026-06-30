/**
 * AdBanner — anchored adaptive banner using Google's TEST ad unit IDs.
 * Swap ADMOB_CONFIG.BANNER_AD_UNIT to your real unit ID in /app/mobile/config.js
 * once your AdMob account is active.
 */
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { ADMOB_CONFIG, IS_TEST_ADS } from '../config';
// Use Google's TestIds for any non-production build (dev/debug/preview/internal/closed testing).
// Switch to LIVE production banner only when IS_TEST_ADS === false (eas.json production profile).
const BANNER_UNIT_ID = IS_TEST_ADS ? TestIds.BANNER : ADMOB_CONFIG.BANNER_AD_UNIT;

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
