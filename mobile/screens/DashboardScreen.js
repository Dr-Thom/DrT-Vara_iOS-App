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

const DashboardScreen = ({ navigation }) => {
  const { user, refreshUser, logout } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refreshUser();
    setRefreshing(false);
  }, []);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Banner Ad at Top */}
      <AdBanner />

      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back, {user?.name || 'User'}! 👋</Text>
          {user?.bonus_unlocked ? (
            <Text style={styles.subtitle}>Great job! You've unlocked your bonus. Keep earning!</Text>
          ) : (
            <Text style={styles.subtitle}>
              Complete {Math.max(0, 5 - (user?.tasks_completed || 0))} more tasks to unlock your $2 bonus!
            </Text>
          )}
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Earnings Cards */}
      <View style={styles.cardsContainer}>
        <View style={[styles.card, styles.earnedCard]}>
          <Text style={styles.cardIcon}>💰</Text>
          <Text style={styles.cardLabel}>Total Earnings</Text>
          <Text style={styles.cardTitle}>Earned:</Text>
          <Text style={styles.cardAmount}>${(user?.total_earned || 0).toFixed(2)}</Text>
          <Text style={styles.cardSubtext}>Withdrawn: -${(user?.total_withdrawn || 0).toFixed(2)}</Text>
          <View style={styles.divider} />
          <Text style={styles.cardBalance}>Balance: ${(user?.earnings || 0).toFixed(2)}</Text>
          <Text style={styles.cardPeso}>≈ ₱{((user?.earnings || 0) * 55).toFixed(2)} PHP</Text>
        </View>

        <View style={[styles.card, styles.tasksCard]}>
          <Text style={styles.cardIcon}>✅</Text>
          <Text style={styles.cardLabel}>Tasks Completed</Text>
          <Text style={styles.cardNumber}>{user?.tasks_completed || 0}</Text>
          {user?.bonus_unlocked && <Text style={styles.bonusText}>Bonus unlocked! 🎉</Text>}
        </View>

        <View style={[styles.card, styles.bonusCard]}>
          <Text style={styles.cardIcon}>🎁</Text>
          <Text style={styles.cardLabel}>Bonus Status</Text>
          <Text style={[styles.bonusAmount, user?.bonus_unlocked && styles.bonusUnlocked]}>
            $2 USD
          </Text>
          <Text style={styles.bonusStatus}>
            {user?.bonus_unlocked ? 'Unlocked!' : `${user?.tasks_completed || 0}/5 tasks`}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Tasks')}
        >
          <Text style={styles.actionIcon}>📋</Text>
          <Text style={styles.actionTitle}>Browse Tasks</Text>
          <Text style={styles.actionSubtitle}>Start earning by completing simple tasks</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Withdrawal')}
        >
          <Text style={styles.actionIcon}>💸</Text>
          <Text style={styles.actionTitle}>Withdraw Earnings</Text>
          <Text style={styles.actionSubtitle}>Cash out via GCash, PayPal, or Bank</Text>
        </TouchableOpacity>
      </View>

      {/* Banner Ad at Bottom */}
      <AdBanner style={styles.bottomAd} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    maxWidth: '80%',
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#EF4444',
    borderRadius: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cardsContainer: {
    padding: 20,
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  earnedCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  tasksCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  bonusCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  cardIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  cardAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 8,
  },
  cardSubtext: {
    fontSize: 14,
    color: '#EF4444',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  cardBalance: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 4,
  },
  cardPeso: {
    fontSize: 12,
    color: '#6B7280',
  },
  cardNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: '#3B82F6',
    marginTop: 8,
  },
  bonusText: {
    fontSize: 14,
    color: '#10B981',
    marginTop: 8,
    fontWeight: '600',
  },
  bonusAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#D97706',
    marginTop: 8,
  },
  bonusUnlocked: {
    color: '#10B981',
  },
  bonusStatus: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  actions: {
    padding: 20,
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  bottomAd: {
    marginTop: 20,
    marginBottom: 20,
  },
});

export default DashboardScreen;
