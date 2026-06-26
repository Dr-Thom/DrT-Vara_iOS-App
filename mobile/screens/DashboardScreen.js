import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useAds } from '../contexts/AdContext';
import AdBanner from '../components/AdBanner';
import { usersAPI } from '../services/api';

const formatUSD = (n) => `$${(Number(n) || 0).toFixed(2)}`;

// ─── Reusable progress bar ────────────────────────────────
const ProgressBar = ({ percent, color = '#3B82F6' }) => (
  <View style={styles.progressBarBg}>
    <View style={[styles.progressBarFill, { width: `${Math.max(0, Math.min(100, percent))}%`, backgroundColor: color }]} />
  </View>
);

// ─── Info icon (ⓘ) ─────────────────────────────────────────
const InfoIcon = ({ onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.infoIcon} data-testid="info-icon" hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
    <Text style={styles.infoIconText}>ⓘ</Text>
  </TouchableOpacity>
);

// ─── How SAMSON Rewards Work Modal ────────────────────────
const RewardsInfoModal = ({ visible, onClose }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose}>
      <TouchableOpacity activeOpacity={1} style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
        <Text style={styles.modalTitle}>How SAMSON Rewards Work</Text>
        <View style={styles.modalDivider} />
        <Text style={styles.modalBullet}>• Earn <Text style={styles.modalBold}>$0.10</Text> for every completed task.</Text>
        <Text style={styles.modalBullet}>• Earn a <Text style={styles.modalBold}>$1 Bonus</Text> every 5 completed tasks.</Text>
        <Text style={styles.modalBullet}>• Earn a <Text style={styles.modalBold}>$10 Super Bonus</Text> every 25 completed tasks.</Text>
        <Text style={styles.modalBullet}>• Watch <Text style={styles.modalBold}>Rewarded Videos</Text> to earn an additional <Text style={styles.modalBold}>$0.05</Text> each.</Text>
        <Text style={styles.modalBullet}>• <Text style={styles.modalBold}>Cash Out</Text> becomes available once your Available Balance reaches <Text style={styles.modalBold}>$5.00</Text>.</Text>
        <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose} data-testid="info-modal-close">
          <Text style={styles.modalCloseText}>Got it</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </TouchableOpacity>
  </Modal>
);

const DashboardScreen = ({ navigation }) => {
  const { refreshUser, logout } = useAuth();
  const { showRewardedAd, rewardedLoaded } = useAds();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claimingAd, setClaimingAd] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      const data = await usersAPI.getDashboard();
      setDashboard(data);
    } catch (e) {
      // Silent — keep previous data
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Auto-refresh dashboard whenever the screen is focused
  // (i.e. when user navigates back from Tasks / Withdrawal / Referrals)
  useFocusEffect(
    useCallback(() => {
      loadDashboard();
      refreshUser();
    }, [loadDashboard, refreshUser])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshUser(), loadDashboard()]);
  }, [refreshUser, loadDashboard]);

  const handleWatchRewardedVideo = async () => {
    if (claimingAd) return;
    if (!rewardedLoaded) {
      Alert.alert('Video not ready', 'Please try again in a moment.');
      return;
    }
    setClaimingAd(true);
    try {
      const result = await showRewardedAd();
      if (result?.success) {
        const credit = await usersAPI.claimAdReward(result.amount);
        await Promise.all([refreshUser(), loadDashboard()]);
        Alert.alert(
          '🎉 You earned an extra $0.05!',
          `New balance: ${formatUSD(credit.new_balance)}\n${credit.daily_remaining ?? 0} more videos available today.`,
        );
      } else if (result?.reason === 'closed_early') {
        Alert.alert('Reward not earned', 'You closed the video before finishing — no credit this time.');
      }
    } catch (e) {
      const msg = e?.response?.data?.detail || 'Could not credit reward.';
      Alert.alert('Hmm', typeof msg === 'string' ? msg : 'Could not credit reward.');
    } finally {
      setClaimingAd(false);
    }
  };

  if (loading || !dashboard) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.loadingText}>Loading your dashboard…</Text>
      </View>
    );
  }

  const {
    balance, today, next_bonus, super_bonus, streak,
    account_status, referrals, totals,
  } = dashboard;

  // Progress percentages
  const nextBonusPct = (next_bonus.in_cycle / next_bonus.cycle_size) * 100;
  const superBonusPct = (super_bonus.in_cycle / super_bonus.cycle_size) * 100;
  const dailyGoalPct = (Math.min(today.tasks_completed, today.goal_tasks) / today.goal_tasks) * 100;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      data-testid="dashboard-screen"
    >
      <AdBanner />

      {/* ─── WELCOME HEADER ────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.greeting} data-testid="welcome-header">Welcome back! 👋</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={logout} data-testid="logout-btn">
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* ─── BALANCE CARD ──────────────────────────────── */}
      <View style={[styles.card, styles.balanceCard]} data-testid="balance-card">
        <View style={styles.balanceTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardLabel}>Available Balance</Text>
            <Text style={styles.balanceAmount} data-testid="available-balance">{formatUSD(balance.available)}</Text>
          </View>
          <InfoIcon onPress={() => setShowInfo(true)} />
        </View>
        <View style={styles.balanceMeta}>
          <Text style={styles.balanceMetaText}>Lifetime Earnings: <Text style={styles.balanceMetaBold}>{formatUSD(balance.lifetime_earnings)}</Text></Text>
          <Text style={styles.balanceMetaText}>Total Withdrawn: <Text style={styles.balanceMetaBold}>{formatUSD(balance.total_withdrawn)}</Text></Text>
        </View>
        <View style={styles.balanceDivider} />
        <View style={styles.cashOutRow}>
          <Text style={styles.cashOutLabel}>Next Cash Out</Text>
          <Text style={styles.cashOutAmount} data-testid="next-cashout-remaining">
            {balance.next_cash_out_remaining > 0 ? `${formatUSD(balance.next_cash_out_remaining)} Remaining` : '✓ Ready to Cash Out'}
          </Text>
        </View>
      </View>

      {/* ─── TODAY'S EARNINGS ─────────────────────────── */}
      <View style={[styles.card, styles.todayCard]} data-testid="today-earnings-card">
        <Text style={styles.cardLabel}>💰 Today's Earnings</Text>
        <Text style={styles.todayAmount} data-testid="today-earnings">{formatUSD(today.earnings)}</Text>
      </View>

      {/* ─── DAILY GOAL ────────────────────────────────── */}
      <View style={[styles.card, styles.dailyGoalCard]} data-testid="daily-goal-card">
        <Text style={styles.cardLabel}>🎯 Today's Goal</Text>
        <Text style={styles.dailyGoalTitle}>Complete {today.goal_tasks} Tasks</Text>
        <ProgressBar percent={dailyGoalPct} color="#10B981" />
        <View style={styles.dailyGoalFooter}>
          <Text style={styles.dailyGoalProgress} data-testid="daily-goal-progress">{today.tasks_completed} of {today.goal_tasks} Completed</Text>
          <Text style={styles.dailyGoalReward}>Reward Today: <Text style={styles.dailyGoalBold}>{formatUSD(today.goal_reward)}</Text></Text>
        </View>
      </View>

      {/* ─── NEXT BONUS ────────────────────────────────── */}
      <View style={[styles.card, styles.nextBonusCard]} data-testid="next-bonus-card">
        <View style={styles.bonusHeaderRow}>
          <Text style={styles.cardLabel}>NEXT BONUS</Text>
          <InfoIcon onPress={() => setShowInfo(true)} />
        </View>
        <Text style={styles.bonusAmount} data-testid="next-bonus-amount">{formatUSD(next_bonus.amount)}</Text>
        <Text style={styles.bonusSubtitle}>
          {next_bonus.remaining === next_bonus.cycle_size
            ? `Complete ${next_bonus.cycle_size} Tasks`
            : `Complete ${next_bonus.remaining} More Task${next_bonus.remaining === 1 ? '' : 's'}`}
        </Text>
        <ProgressBar percent={nextBonusPct} color="#3B82F6" />
        <Text style={styles.bonusFooter} data-testid="next-bonus-progress">
          {next_bonus.in_cycle} of {next_bonus.cycle_size} Completed
        </Text>
      </View>

      {/* ─── PROGRESS CARD (mirror of Next Bonus) ──────── */}
      <View style={[styles.card, styles.progressCard]} data-testid="progress-card">
        <Text style={styles.progressTitle}>Progress to Next {formatUSD(next_bonus.amount)} Bonus</Text>
        <ProgressBar percent={nextBonusPct} color="#3B82F6" />
        <View style={styles.progressFooter}>
          <Text style={styles.progressFooterText}>{next_bonus.in_cycle} of {next_bonus.cycle_size} Tasks Completed</Text>
          <Text style={styles.progressFooterText}>{next_bonus.remaining} Tasks Remaining</Text>
        </View>
      </View>

      {/* ─── SUPER BONUS ───────────────────────────────── */}
      <View style={[styles.card, styles.superBonusCard]} data-testid="super-bonus-card">
        <View style={styles.bonusHeaderRow}>
          <Text style={styles.superBonusTitle}>🚀 SUPER BONUS</Text>
          <InfoIcon onPress={() => setShowInfo(true)} />
        </View>
        <Text style={styles.superBonusSub}>Complete {super_bonus.cycle_size} Tasks</Text>
        <Text style={styles.superBonusProgress} data-testid="super-bonus-progress">
          {super_bonus.in_cycle} of {super_bonus.cycle_size} Completed
        </Text>
        <ProgressBar percent={superBonusPct} color="#F59E0B" />
        <View style={styles.superBonusRewardRow}>
          <Text style={styles.superBonusRewardLabel}>Reward</Text>
          <Text style={styles.superBonusRewardAmount}>{formatUSD(super_bonus.amount)}</Text>
        </View>
        {totals.super_bonuses_earned > 0 && (
          <Text style={styles.superBonusLifetime} data-testid="super-bonus-lifetime">
            🏆 Total super bonuses earned: {totals.super_bonuses_earned} (${(totals.super_bonuses_earned * super_bonus.amount).toFixed(2)})
          </Text>
        )}
      </View>

      {/* ─── REWARDED VIDEO ────────────────────────────── */}
      <TouchableOpacity
        style={[styles.watchVideoCard, !rewardedLoaded && styles.watchVideoDisabled]}
        onPress={handleWatchRewardedVideo}
        disabled={claimingAd || !rewardedLoaded}
        data-testid="watch-rewarded-video-btn"
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.watchVideoTitle}>📺 Watch Rewarded Video</Text>
          <Text style={styles.watchVideoSub}>
            {claimingAd ? 'Loading…' : `Earn an Extra ${formatUSD(0.05)}`}
          </Text>
        </View>
        <Text style={styles.watchVideoArrow}>→</Text>
      </TouchableOpacity>

      {/* ─── ACCOUNT STATUS + STREAK ROW ───────────────── */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderLeftColor: '#10B981' }]} data-testid="account-status-card">
          <Text style={styles.statLabel}>Account Status</Text>
          <Text style={styles.statValue}>{account_status.verified ? 'Verified' : 'Pending'}</Text>
          {account_status.instant_cash_out_eligible && (
            <Text style={styles.statSub}>Instant Cash Out Eligible</Text>
          )}
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#F59E0B' }]} data-testid="streak-card">
          <Text style={styles.statLabel}>🔥 Current Streak</Text>
          <Text style={styles.statValue}>{streak.current} Day{streak.current === 1 ? '' : 's'}</Text>
          <Text style={styles.statSub}>Tomorrow's Multiplier: {streak.tomorrows_multiplier}×</Text>
        </View>
      </View>
      <Text style={styles.streakHint}>
        Keep your streak alive by completing one task tomorrow.
      </Text>

      {/* ─── REFERRAL CARD ─────────────────────────────── */}
      <View style={[styles.card, styles.referralCard]} data-testid="referral-card">
        <Text style={styles.referralTitle}>Invite 3 Friends</Text>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.referralRow}>
            <Text style={styles.referralCheckbox}>
              {referrals.qualified_count >= i ? '☑' : '☐'}
            </Text>
            <Text style={[styles.referralFriend, referrals.qualified_count >= i && styles.referralFriendDone]}>
              Friend {i}
            </Text>
          </View>
        ))}
        <View style={styles.referralRewardRow}>
          <Text style={styles.referralRewardLabel}>Reward</Text>
          <Text style={styles.referralRewardAmount}>{formatUSD(referrals.bonus_amount)} Bonus</Text>
        </View>
        <TouchableOpacity style={styles.referralButton} onPress={() => navigation.navigate('Referrals')} data-testid="invite-friends-btn">
          <Text style={styles.referralButtonText}>Invite Friends →</Text>
        </TouchableOpacity>
      </View>

      {/* ─── QUICK ACTIONS ─────────────────────────────── */}
      <TouchableOpacity
        style={styles.primaryAction}
        onPress={() => navigation.navigate('Tasks')}
        data-testid="start-earning-btn"
      >
        <Text style={styles.primaryActionText}>🚀  Start Earning</Text>
        <Text style={styles.primaryActionSub}>{formatUSD(0.10)} per task</Text>
      </TouchableOpacity>

      <View style={styles.secondaryRow}>
        <TouchableOpacity style={styles.secondaryAction} onPress={() => navigation.navigate('Calculator')} data-testid="earnings-calculator-btn">
          <Text style={styles.secondaryActionEmoji}>📊</Text>
          <Text style={styles.secondaryActionText}>Earnings{'\n'}Calculator</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryAction} onPress={() => navigation.navigate('Referrals')} data-testid="invite-friends-quick-btn">
          <Text style={styles.secondaryActionEmoji}>🎁</Text>
          <Text style={styles.secondaryActionText}>Invite{'\n'}Friends</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryAction} onPress={() => navigation.navigate('Withdrawal')} data-testid="cash-out-btn">
          <Text style={styles.secondaryActionEmoji}>💸</Text>
          <Text style={styles.secondaryActionText}>Cash{'\n'}Out</Text>
        </TouchableOpacity>
      </View>

      {/* Totals footer */}
      <View style={styles.totalsFooter}>
        <Text style={styles.totalsText}>
          {totals.tasks_completed} tasks · {totals.bonuses_earned} bonuses · {totals.super_bonuses_earned} super bonuses
        </Text>
      </View>

      <AdBanner style={styles.bottomAd} />

      <RewardsInfoModal visible={showInfo} onClose={() => setShowInfo(false)} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  loadingText: { fontSize: 16, color: '#6B7280' },
  header: {
    padding: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: { fontSize: 24, fontWeight: '700', color: '#1F2937' },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  logoutText: { color: '#6B7280', fontSize: 13, fontWeight: '600' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  cardLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  // Balance card
  balanceCard: { backgroundColor: '#ECFDF5', borderWidth: 2, borderColor: '#A7F3D0' },
  balanceTopRow: { flexDirection: 'row', alignItems: 'flex-start' },
  balanceAmount: { fontSize: 44, fontWeight: '700', color: '#059669', marginTop: 4 },
  balanceMeta: { marginTop: 12 },
  balanceMetaText: { fontSize: 13, color: '#065F46', marginTop: 2 },
  balanceMetaBold: { fontWeight: '700', color: '#064E3B' },
  balanceDivider: { height: 1, backgroundColor: '#A7F3D0', marginVertical: 12 },
  cashOutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cashOutLabel: { fontSize: 13, fontWeight: '600', color: '#065F46' },
  cashOutAmount: { fontSize: 14, fontWeight: '700', color: '#059669' },

  // Today's earnings
  todayCard: { backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A' },
  todayAmount: { fontSize: 32, fontWeight: '700', color: '#92400E', marginTop: 4 },

  // Daily goal
  dailyGoalCard: { backgroundColor: '#fff' },
  dailyGoalTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginTop: 4, marginBottom: 8 },
  dailyGoalFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  dailyGoalProgress: { fontSize: 13, color: '#374151' },
  dailyGoalReward: { fontSize: 13, color: '#059669' },
  dailyGoalBold: { fontWeight: '700' },

  // Next bonus
  nextBonusCard: { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' },
  bonusHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bonusAmount: { fontSize: 40, fontWeight: '700', color: '#1E40AF', marginTop: 4 },
  bonusSubtitle: { fontSize: 14, color: '#1E40AF', marginBottom: 10, marginTop: 2, fontWeight: '500' },
  bonusFooter: { fontSize: 12, color: '#1E40AF', marginTop: 6, fontWeight: '600' },

  // Progress card
  progressCard: { backgroundColor: '#fff' },
  progressTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 10 },
  progressFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  progressFooterText: { fontSize: 12, color: '#6B7280' },

  // Super bonus
  superBonusCard: { backgroundColor: '#FEF3C7', borderWidth: 2, borderColor: '#F59E0B' },
  superBonusTitle: { fontSize: 14, fontWeight: '700', color: '#92400E', textTransform: 'uppercase', letterSpacing: 0.6 },
  superBonusSub: { fontSize: 18, fontWeight: '600', color: '#78350F', marginTop: 4 },
  superBonusProgress: { fontSize: 13, color: '#92400E', marginVertical: 8, fontWeight: '500' },
  superBonusRewardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  superBonusRewardLabel: { fontSize: 13, color: '#78350F', fontWeight: '600' },
  superBonusRewardAmount: { fontSize: 22, fontWeight: '700', color: '#B45309' },
  superBonusLifetime: { fontSize: 12, color: '#78350F', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(180, 83, 9, 0.2)', fontWeight: '600', textAlign: 'center' },

  // Watch video
  watchVideoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#BBF7D0',
  },
  watchVideoDisabled: { opacity: 0.55 },
  watchVideoTitle: { fontSize: 15, fontWeight: '700', color: '#065F46' },
  watchVideoSub: { fontSize: 13, color: '#047857', marginTop: 2, fontWeight: '500' },
  watchVideoArrow: { fontSize: 22, color: '#065F46', fontWeight: '700', marginLeft: 8 },

  // Stats row
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 4 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  statLabel: { fontSize: 11, color: '#6B7280', fontWeight: '700', textTransform: 'uppercase' },
  statValue: { fontSize: 22, fontWeight: '700', color: '#1F2937', marginTop: 2 },
  statSub: { fontSize: 11, color: '#6B7280', marginTop: 4 },
  streakHint: { fontSize: 12, color: '#6B7280', textAlign: 'center', marginHorizontal: 20, marginTop: 6, marginBottom: 12, fontStyle: 'italic' },

  // Progress bar
  progressBarBg: { height: 10, backgroundColor: '#E5E7EB', borderRadius: 5, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 5 },

  // Referral card
  referralCard: { backgroundColor: '#FAF5FF', borderWidth: 1, borderColor: '#E9D5FF' },
  referralTitle: { fontSize: 18, fontWeight: '700', color: '#581C87', marginBottom: 12 },
  referralRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  referralCheckbox: { fontSize: 20, color: '#7C3AED', marginRight: 10, width: 26 },
  referralFriend: { fontSize: 15, color: '#374151' },
  referralFriendDone: { color: '#7C3AED', fontWeight: '600' },
  referralRewardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#E9D5FF' },
  referralRewardLabel: { fontSize: 13, fontWeight: '600', color: '#581C87' },
  referralRewardAmount: { fontSize: 18, fontWeight: '700', color: '#7C3AED' },
  referralButton: { backgroundColor: '#7C3AED', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 12 },
  referralButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Primary CTA
  primaryAction: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryActionText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  primaryActionSub: { fontSize: 13, color: '#DBEAFE', marginTop: 2 },

  // Secondary row
  secondaryRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 16 },
  secondaryAction: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  secondaryActionEmoji: { fontSize: 22 },
  secondaryActionText: { fontSize: 12, fontWeight: '600', color: '#374151', marginTop: 4, textAlign: 'center' },

  // Totals footer
  totalsFooter: { paddingVertical: 12, alignItems: 'center' },
  totalsText: { fontSize: 12, color: '#9CA3AF' },

  // Info icon
  infoIcon: { paddingHorizontal: 6, paddingVertical: 2 },
  infoIconText: { fontSize: 18, color: '#6B7280' },

  // Modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', textAlign: 'center' },
  modalDivider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 },
  modalBullet: { fontSize: 14, color: '#374151', marginBottom: 8, lineHeight: 20 },
  modalBold: { fontWeight: '700', color: '#1F2937' },
  modalCloseBtn: { backgroundColor: '#3B82F6', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 12 },
  modalCloseText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  bottomAd: { marginTop: 12, marginBottom: 20 },
});

export default DashboardScreen;
