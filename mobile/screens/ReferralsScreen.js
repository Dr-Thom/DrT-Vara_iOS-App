import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Share,
  RefreshControl,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { referralsAPI } from '../services/api';
import { API_CONFIG } from '../config';

const ReferralsScreen = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await referralsAPI.getMe();
      setData(r);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const shareLink = data?.referral_code
    ? `${API_CONFIG.BACKEND_URL}/signup?ref=${data.referral_code}`
    : '';

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join me on VARA and earn USD from simple tasks! Use my code ${data?.referral_code}: ${shareLink}`,
        url: shareLink,
      });
    } catch { /* cancelled */ }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Unable to load.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>Refer & Earn</Text>
      <Text style={styles.subtitle}>
        Earn 10% of every friend's first $100. Up to $10 per friend.
      </Text>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard label="Friends" value={data.referred_count || 0} color="#8B5CF6" />
        <StatCard
          label="Earned"
          value={`$${(data.referral_earnings || 0).toFixed(2)}`}
          color="#10B981"
        />
      </View>

      {/* Your code */}
      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>Your Referral Code</Text>
        <Text style={styles.code}>{data.referral_code}</Text>
      </View>

      {/* Link + actions */}
      <View style={styles.linkCard}>
        <Text style={styles.linkLabel}>Your referral link</Text>
        <Text style={styles.linkText} numberOfLines={2}>{shareLink}</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.btn, styles.btnSecondary]}
            onPress={handleCopy}
          >
            <Text style={styles.btnSecondaryText}>{copied ? '✓ Copied' : 'Copy Link'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={handleShare}>
            <Text style={styles.btnPrimaryText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent payouts */}
      <View style={styles.payoutsCard}>
        <Text style={styles.payoutsTitle}>Recent Earnings</Text>
        {(!data.recent_payouts || data.recent_payouts.length === 0) ? (
          <Text style={styles.empty}>No referral earnings yet. Share your code to start earning!</Text>
        ) : (
          data.recent_payouts.map((p) => (
            <View key={p._id} style={styles.payoutRow}>
              <View>
                <Text style={styles.payoutEmail}>{p.referred_email}</Text>
                <Text style={styles.payoutDate}>
                  {p.created_at ? new Date(p.created_at).toLocaleDateString() : ''}
                </Text>
              </View>
              <Text style={styles.payoutAmount}>+${p.amount.toFixed(2)}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const StatCard = ({ label, value, color }) => (
  <View style={[styles.stat, { borderLeftColor: color }]}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 20, gap: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
  loadingText: { color: '#6B7280', fontSize: 16 },
  title: { fontSize: 26, fontWeight: '700', color: '#1F2937' },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 8 },
  statsRow: { flexDirection: 'row', gap: 12 },
  stat: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, borderLeftWidth: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  statLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600', textTransform: 'uppercase' },
  statValue: { fontSize: 28, fontWeight: '700', marginTop: 4 },
  codeCard: { backgroundColor: '#1E3A8A', borderRadius: 16, padding: 24, alignItems: 'center' },
  codeLabel: { color: '#BFDBFE', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  code: { color: '#FBBF24', fontSize: 36, fontWeight: '700', letterSpacing: 6, marginTop: 8 },
  linkCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  linkLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600', textTransform: 'uppercase', marginBottom: 6 },
  linkText: { fontSize: 13, color: '#374151', backgroundColor: '#F9FAFB', padding: 10, borderRadius: 8, fontFamily: 'monospace', marginBottom: 12 },
  actionRow: { flexDirection: 'row', gap: 8 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  btnPrimary: { backgroundColor: '#8B5CF6' },
  btnPrimaryText: { color: '#fff', fontWeight: '600' },
  btnSecondary: { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#D1D5DB' },
  btnSecondaryText: { color: '#374151', fontWeight: '600' },
  payoutsCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  payoutsTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 12 },
  empty: { color: '#9CA3AF', fontSize: 13, textAlign: 'center', paddingVertical: 20 },
  payoutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  payoutEmail: { fontSize: 14, color: '#1F2937', fontWeight: '500' },
  payoutDate: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  payoutAmount: { fontSize: 16, fontWeight: '700', color: '#10B981' },
});

export default ReferralsScreen;
