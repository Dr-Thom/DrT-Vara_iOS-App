/**
 * Local Expo config plugin to inject AdMob meta-data into AndroidManifest.
 * Bypasses react-native-google-mobile-ads' app.plugin.js (which has resolution
 * issues with certain yarn/SDK combinations).
 *
 * This is functionally identical to what react-native-google-mobile-ads'
 * built-in plugin does — adds the APPLICATION_ID meta-data tag that AdMob
 * SDK requires at runtime.
 */
const { withAndroidManifest, AndroidConfig } = require('@expo/config-plugins');

function addMeta(manifest, name, value) {
  AndroidConfig.Manifest.ensureToolsAvailable(manifest);
  const app = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
  app['meta-data'] = app['meta-data'] || [];

  const existing = app['meta-data'].find(
    (m) => m.$ && m.$['android:name'] === name
  );
  const newEntry = {
    $: {
      'android:name': name,
      'android:value': value,
      'tools:replace': 'android:value',
    },
  };
  if (existing) {
    existing.$['android:value'] = value;
    existing.$['tools:replace'] = 'android:value';
  } else {
    app['meta-data'].push(newEntry);
  }
  return manifest;
}

module.exports = function withAdMob(config, props = {}) {
  return withAndroidManifest(config, (cfg) => {
    if (props.androidAppId) {
      addMeta(
        cfg.modResults,
        'com.google.android.gms.ads.APPLICATION_ID',
        props.androidAppId
      );
    }
    // Optimization: delay app measurement until SDK init (recommended for ads apps)
    addMeta(
      cfg.modResults,
      'com.google.android.gms.ads.DELAY_APP_MEASUREMENT_INIT',
      'true'
    );
    return cfg;
  });
};
