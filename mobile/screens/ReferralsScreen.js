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
import SuperBonusChallenge from '../components/SuperBonusChallenge';

const ReferralsScreen = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderYou, setLeaderYou] = useState(null);
  const [leaderPeriod, setLeaderPeriod] = useState('month');

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

  const loadLb = useCallback(async (period) => {
    try {
      const r = await referralsAPI.getLeaderboard(period, 10);
      setLeaderboard(r?.leaderboard || []);
      setLeaderYou(r?.you || null);
    } catch {
      setLeaderboard([]);
      setLeaderYou(null);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadLb(leaderPeriod); }, [leaderPeriod, loadLb]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
    loadLb(leaderPeriod);
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

      {/* Weekly $5 super bonus challenge */}
      <SuperBonusChallenge />

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

      {/* Leaderboard */}
      <View style={styles.leaderCard}>
        <View style={styles.leaderHeader}>
          <Text style={styles.leaderTitle}>🏆  Top Referrers</Text>
          <View style={styles.periodToggle}>
            <TouchableOpacity
              onPress={() => setLeaderPeriod('month')}
              style={[styles.periodBtn, leaderPeriod === 'month' && styles.periodBtnActive]}
            >
              <Text style={[styles.periodBtnText, leaderPeriod === 'month' && styles.periodBtnTextActive]}>Month</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setLeaderPeriod('all')}
              style={[styles.periodBtn, leaderPeriod === 'all' && styles.periodBtnActive]}
            >
              <Text style={[styles.periodBtnText, leaderPeriod === 'all' && styles.periodBtnTextActive]}>All-time</Text>
            </TouchableOpacity>
          </View>
        </View>

        {leaderboard.length === 0 ? (
          <Text style={styles.empty}>No referrers {leaderPeriod === 'month' ? 'this month' : ''} yet. Be the first!</Text>
        ) : (
          <>
            {leaderboard.map((row) => <LeaderRow key={`${row.rank}-${row.display_name}`} row={row} />)}
            {leaderYou && (
              <>
                <Text style={styles.leaderDivider}>···</Text>
                <LeaderRow row={leaderYou} />
              </>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
};

const rankEmoji = (rank) => {
  if (rank === 1) return '👑';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
};

const rankStyle = (rank) => {
  if (rank === 1) return { backgroundColor: '#FEF3C7', borderColor: '#FBBF24' };
  if (rank === 2) return { backgroundColor: '#F3F4F6', borderColor: '#9CA3AF' };
  if (rank === 3) return { backgroundColor: '#FFEDD5', borderColor: '#FB923C' };
  return { backgroundColor: '#fff', borderColor: '#E5E7EB' };
};

const LeaderRow = ({ row }) => (
  <View
    style={[
      styles.leaderRow,
      rankStyle(row.rank),
      row.is_you && { borderWidth: 2, borderColor: '#3B82F6' },
    ]}
  >
    <View style={styles.leaderLeft}>
      <Text style={styles.leaderRank}>{rankEmoji(row.rank)}</Text>
      <View style={{ flex: 1 }}>
        <View style={styles.leaderNameRow}>
          <Text style={styles.leaderName} numberOfLines={1}>{row.display_name}</Text>
          {row.is_you && <Text style={styles.leaderYou}>YOU</Text>}
        </View>
        <Text style={styles.leaderSub}>
          {row.referral_count} friend{row.referral_count !== 1 ? 's' : ''}
        </Text>
      </View>
    </View>
    <Text style={styles.leaderAmount}>${row.total_earned.toFixed(2)}</Text>
  </View>
);

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
  leaderCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 2, borderWidth: 1, borderColor: '#FDE68A' },
  leaderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 },
  leaderTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  periodToggle: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 8, padding: 2 },
  periodBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  periodBtnActive: { backgroundColor: '#F59E0B' },
  periodBtnText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  periodBtnTextActive: { color: '#fff' },
  leaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderRadius: 8, borderWidth: 1, marginBottom: 6 },
  leaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  leaderRank: { fontSize: 20, fontWeight: '700', color: '#6B7280', minWidth: 32, textAlign: 'center' },
  leaderNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  leaderName: { fontSize: 14, fontWeight: '600', color: '#1F2937', flexShrink: 1 },
  leaderYou: { fontSize: 10, fontWeight: '700', color: '#fff', backgroundColor: '#3B82F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  leaderSub: { fontSize: 11, color: '#6B7280', marginTop: 1 },
  leaderAmount: { fontSize: 15, fontWeight: '700', color: '#10B981' },
  leaderDivider: { textAlign: 'center', color: '#9CA3AF', fontSize: 12, marginVertical: 4 },
});

export default ReferralsScreen;
