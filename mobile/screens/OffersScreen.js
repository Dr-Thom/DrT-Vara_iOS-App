
📝 FILE 4: mobile/screens/OffersScreen.js (NEW)
👉 Open: https://github.com/Dr-Thom/DrT-Vara_iOS-App/new/main/mobile/screens

Name: OffersScreen.js

SAMSON: Offerwall screens, LoginScreen fix, AdMob env switching, dashboard beta
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { offerwallAPI } from '../services/api';

const OFFER_PROVIDERS = [
  {
    key: 'adgate',
    title: '💎 AdGate Offers',
    subtitle: 'Apps, signups, free trials',
    earnings: 'Earn $0.50 – $5.00 per offer',
    title: 'AdGate Offers',
    subtitle: 'Apps, signups, free trials',
    earnings: 'Earn $0.50 - $5.00 per offer',
SAMSON: Offerwall screens, LoginScreen fix, AdMob env switching, dashboard beta
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  {
    key: 'cpx',

    title: '📋 CPX Surveys',
    subtitle: 'Quick surveys, 5–15 minutes',
    earnings: 'Earn $0.10 – $2.00 per survey',
    title: 'CPX Surveys',
    subtitle: 'Quick surveys, 5-15 minutes',
    earnings: 'Earn $0.10 - $2.00 per survey',
SAMSON: Offerwall screens, LoginScreen fix, AdMob env switching, dashboard beta
    color: '#7C3AED',
    bgColor: '#FAF5FF',
    borderColor: '#E9D5FF',
  },
];

const OffersScreen = ({ navigation }) => {
  const [activeProvider, setActiveProvider] = useState(null);
  const [webviewUrl, setWebviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const openProvider = async (key) => {
    setLoading(true);
    setActiveProvider(key);
    try {
      const data = key === 'adgate'
        ? await offerwallAPI.getAdgateUrl()
        : await offerwallAPI.getCpxUrl();
      setWebviewUrl(data.url);
    } catch (e) {
      const detail = e?.response?.data?.detail || 'Offerwall not configured yet';
      Alert.alert(
        'Coming Soon',
        detail === 'Offerwall not configured yet' || detail === 'Offerwall not configured'
        detail.includes('not configured')
SAMSON: Offerwall screens, LoginScreen fix, AdMob env switching, dashboard beta
          ? 'This offerwall is being set up. Check back in a few days!'
          : detail,
      );
      setActiveProvider(null);
    } finally {
      setLoading(false);
    }
  };

  const closeWebView = () => {
    setActiveProvider(null);
    setWebviewUrl(null);
  };

  if (activeProvider && webviewUrl) {
    return (
      <View style={{ flex: 1 }}>
        <View style={styles.webHeader}>
          <TouchableOpacity onPress={closeWebView} data-testid="close-webview-btn">
            <Text style={styles.webClose}>✕ Close</Text>
          <TouchableOpacity onPress={closeWebView}>
            <Text style={styles.webClose}>X Close</Text>
SAMSON: Offerwall screens, LoginScreen fix, AdMob env switching, dashboard beta
          </TouchableOpacity>
          <Text style={styles.webTitle}>
            {OFFER_PROVIDERS.find((p) => p.key === activeProvider)?.title}
          </Text>
          <View style={{ width: 60 }} />
        </View>
        <WebView
          source={{ uri: webviewUrl }}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.webLoader}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.webLoaderText}>Loading offers…</Text>
              <Text style={styles.webLoaderText}>Loading offers...</Text>
SAMSON: Offerwall screens, LoginScreen fix, AdMob env switching, dashboard beta
            </View>
          )}
          onError={() => {
            Alert.alert('Error', 'Could not load offerwall. Please try again.');
            closeWebView();
          }}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} data-testid="offers-screen">
      <View style={styles.intro}>
        <Text style={styles.heading}>💎 Earn More with Offers</Text>
        <Text style={styles.subheading}>
          Premium offers and surveys — beyond your daily tasks. Rewards credited automatically within minutes.
    <ScrollView style={styles.container}>
      <View style={styles.intro}>
        <Text style={styles.heading}>Earn More with Offers</Text>
        <Text style={styles.subheading}>
          Premium offers and surveys - beyond your daily tasks. Rewards credited automatically within minutes.
SAMSON: Offerwall screens, LoginScreen fix, AdMob env switching, dashboard beta
        </Text>
      </View>

      {OFFER_PROVIDERS.map((p) => (
        <TouchableOpacity
          key={p.key}
          style={[styles.providerCard, { backgroundColor: p.bgColor, borderColor: p.borderColor }]}
          onPress={() => openProvider(p.key)}
          disabled={loading}
          data-testid={`offer-provider-${p.key}-btn`}
SAMSON: Offerwall screens, LoginScreen fix, AdMob env switching, dashboard beta
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.providerTitle, { color: p.color }]}>{p.title}</Text>
            <Text style={styles.providerSub}>{p.subtitle}</Text>
            <Text style={[styles.providerEarn, { color: p.color }]}>{p.earnings}</Text>
          </View>
          <Text style={[styles.providerArrow, { color: p.color }]}>
            {loading && activeProvider === p.key ? '⏳' : '→'}
            {loading && activeProvider === p.key ? '...' : '>'}
SAMSON: Offerwall screens, LoginScreen fix, AdMob env switching, dashboard beta
          </Text>
        </TouchableOpacity>
      ))}

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>How it works</Text>
        <Text style={styles.infoBullet}>1. Pick an offer or survey</Text>
        <Text style={styles.infoBullet}>2. Complete the steps</Text>
        <Text style={styles.infoBullet}>3. Reward credits to your balance automatically</Text>
        <Text style={styles.infoBullet}>4. Most credit within 5 minutes; some up to 24h</Text>
      </View>

      <View style={styles.warningBox}>
        <Text style={styles.warningText}>
          ⚠️ Only complete offers you're genuinely interested in. Be honest in surveys — providers can reverse rewards for inaccurate answers.
          Only complete offers you are genuinely interested in. Be honest in surveys - providers can reverse rewards for inaccurate answers.
SAMSON: Offerwall screens, LoginScreen fix, AdMob env switching, dashboard beta
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  intro: { padding: 20, paddingBottom: 12 },
  heading: { fontSize: 22, fontWeight: '700', color: '#1F2937', marginBottom: 6 },
  subheading: { fontSize: 14, color: '#6B7280', lineHeight: 20 },
  providerCard: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 12,
    padding: 18, borderRadius: 14, borderWidth: 2,
  },
  providerTitle: { fontSize: 18, fontWeight: '700' },
  providerSub: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  providerEarn: { fontSize: 13, fontWeight: '600', marginTop: 6 },
  providerArrow: { fontSize: 22, fontWeight: '700', marginLeft: 12 },
  infoBox: {
    backgroundColor: '#fff', marginHorizontal: 20, marginTop: 8, padding: 16, borderRadius: 12,
  },
  infoTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937', marginBottom: 8 },
  infoBullet: { fontSize: 13, color: '#4B5563', marginBottom: 4 },
  warningBox: {
    backgroundColor: '#FEF3C7', marginHorizontal: 20, marginTop: 12, marginBottom: 20,
    padding: 12, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: '#F59E0B',
  },
  warningText: { fontSize: 12, color: '#78350F', lineHeight: 18 },
  webHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, backgroundColor: '#3B82F6',
  },
  webClose: { color: '#fff', fontSize: 15, fontWeight: '600', width: 60 },
  webTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  webLoader: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff',
  },
  webLoaderText: { marginTop: 12, color: '#6B7280' },
});

Agent is waiting...
export default OffersScreen;
SAMSON: Offerwall screens, LoginScreen fix, AdMob env switching, dashboard beta
