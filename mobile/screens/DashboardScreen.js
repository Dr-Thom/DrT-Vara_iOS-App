import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import AdBanner from '../components/AdBanner';
import SuperBonusChallenge from '../components/SuperBonusChallenge';
import { APP_CONFIG, nextBonusThreshold } from '../config';

const DashboardScreen = ({ navigation }) => {
  const { user, refreshUser, logout } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refreshUser();
    setRefreshing(false);
  }, [refreshUser]);

  const tasksCompleted = user?.tasks_completed || 0;
  const bonusesEarned = user?.bonuses_earned || 0;
  const nextThreshold = nextBonusThreshold(tasksCompleted);
  const tasksRemaining = Math.max(0, nextThreshold - tasksCompleted);

  // Progress within current bonus window
  const windowStart = tasksCompleted < APP_CONFIG.FIRST_BONUS_AT
    ? 0
    : nextThreshold - APP_CONFIG.RECURRING_BONUS_INTERVAL;
  const windowSize = nextThreshold - windowStart;
  const progressPct = Math.min(100, ((tasksCompleted - windowStart) / windowSize) * 100);

  const headerMsg = tasksCompleted === 0
    ? `Complete 5 tasks to earn your first $${APP_CONFIG.BONUS_AMOUNT.toFixed(2)} bonus!`
    : tasksCompleted < APP_CONFIG.FIRST_BONUS_AT
      ? `${tasksRemaining} more task${tasksRemaining !== 1 ? 's' : ''} → $${APP_CONFIG.BONUS_AMOUNT.toFixed(2)} bonus!`
      : `You've earned ${bonusesEarned} bonus${bonusesEarned !== 1 ? 'es' : ''}! Next at task #${nextThreshold}.`;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <AdBanner />

      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>Hi, {user?.name || 'there'}! 👋</Text>
          <Text style={styles.subtitle}>{headerMsg}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Balance Card */}
      <View style={[styles.card, styles.balanceCard]}>
        <Text style={styles.cardLabel}>Balance</Text>
        <Text style={styles.balanceAmount}>${(user?.earnings || 0).toFixed(2)}</Text>
        <Text style={styles.balanceSub}>
          Lifetime earned: ${(user?.total_earned || 0).toFixed(2)} · Withdrawn: ${(user?.total_withdrawn || 0).toFixed(2)}
        </Text>
      </View>

      {/* Stats grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { borderLeftColor: '#3B82F6' }]}>
          <Text style={styles.statLabel}>Tasks</Text>
          <Text style={styles.statValue}>{tasksCompleted}</Text>
          <Text style={styles.statSub}>{tasksRemaining} → bonus</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#F59E0B' }]}>
          <Text style={styles.statLabel}>Bonuses</Text>
          <Text style={styles.statValue}>{bonusesEarned}</Text>
          <Text style={styles.statSub}>${(bonusesEarned * APP_CONFIG.BONUS_AMOUNT).toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.statCard, { borderLeftColor: '#8B5CF6' }]}
          onPress={() => navigation.navigate('Referrals')}
        >
          <Text style={styles.statLabel}>Referrals</Text>
          <Text style={styles.statValue}>{user?.referred_count || 0}</Text>
          <Text style={styles.statSub}>${(user?.referral_earnings || 0).toFixed(2)}</Text>
        </TouchableOpacity>
      </View>

      {/* Weekly Super Bonus Challenge */}
      <View style={{ marginHorizontal: 20, marginTop: 12 }}>
        <SuperBonusChallenge />
      </View>

      {/* Progress */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Progress to next ${APP_CONFIG.BONUS_AMOUNT.toFixed(2)} bonus</Text>
          <Text style={styles.progressPct}>{progressPct.toFixed(0)}%</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
        </View>
        <Text style={styles.progressNote}>
          {tasksCompleted} / {nextThreshold} tasks
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryAction]}
          onPress={() => navigation.navigate('Tasks')}
        >
          <Text style={styles.primaryActionText}>🚀  Start Earning</Text>
          <Text style={styles.primaryActionSub}>$0.10 per task</Text>
        </TouchableOpacity>

        <View style={styles.secondaryRow}>
          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={() => navigation.navigate('Calculator')}
          >
            <Text style={styles.secondaryActionText}>📊  Calculator</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={() => navigation.navigate('Referrals')}
          >
            <Text style={styles.secondaryActionText}>🎁  Refer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={() => navigation.navigate('Withdrawal')}
          >
            <Text style={styles.secondaryActionText}>💸  Withdraw</Text>
          </TouchableOpacity>
        </View>
      </View>

      <AdBanner style={styles.bottomAd} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { padding: 20, flexDirection: 'row', alignItems: 'flex-start' },
  greeting: { fontSize: 22, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6B7280' },
  logoutButton: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#F3F4F6', borderRadius: 6, borderWidth: 1, borderColor: '#D1D5DB' },
  logoutText: { color: '#6B7280', fontSize: 13, fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginHorizontal: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 3 },
  balanceCard: { backgroundColor: '#ECFDF5', borderWidth: 2, borderColor: '#A7F3D0' },
  cardLabel: { fontSize: 12, color: '#059669', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  balanceAmount: { fontSize: 44, fontWeight: '700', color: '#10B981', marginTop: 4 },
  balanceSub: { fontSize: 12, color: '#065F46', marginTop: 6 },
  statsGrid: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 12, gap: 8 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 12, borderLeftWidth: 3, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 2, elevation: 1 },
  statLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600', textTransform: 'uppercase' },
  statValue: { fontSize: 24, fontWeight: '700', color: '#1F2937', marginTop: 2 },
  statSub: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  progressCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginHorizontal: 20, marginTop: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  progressTitle: { fontSize: 13, fontWeight: '600', color: '#374151' },
  progressPct: { fontSize: 16, fontWeight: '700', color: '#3B82F6' },
  progressBarBg: { height: 10, backgroundColor: '#E5E7EB', borderRadius: 5, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#3B82F6', borderRadius: 5 },
  progressNote: { fontSize: 12, color: '#6B7280', marginTop: 6 },
  actions: { padding: 20, gap: 12 },
  actionButton: { backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  primaryAction: { backgroundColor: '#3B82F6', alignItems: 'center' },
  primaryActionText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  primaryActionSub: { fontSize: 13, color: '#DBEAFE', marginTop: 2 },
  secondaryRow: { flexDirection: 'row', gap: 8 },
  secondaryAction: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 2, elevation: 1 },
  secondaryActionText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  bottomAd: { marginTop: 20, marginBottom: 20 },
});

export default DashboardScreen;
