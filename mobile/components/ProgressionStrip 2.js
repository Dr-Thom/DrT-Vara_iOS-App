import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { usersAPI } from '../services/api';

const ProgressionStrip = ({ reloadKey = 0 }) => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    usersAPI.getMyStats().then(setStats).catch(() => setStats(null));
  }, [reloadKey]);

  if (!stats) return null;

  const { trust, streak, bonuses } = stats;
  const trustColor = trust.tier === 'trusted' ? '#10B981' : trust.tier === 'building' ? '#3B82F6' : '#F59E0B';
  const streakActive = streak.current > 0;

  return (
    <View style={styles.row}>
      {/* Trust */}
      <View style={[styles.card, { borderColor: trustColor, backgroundColor: trustColor + '12' }]}>
        <Text style={styles.eyebrow}>TRUST</Text>
        <Text style={[styles.value, { color: trustColor }]}>{trust.score}<Text style={styles.sub}>/100</Text></Text>
        <Text style={[styles.tier, { color: trustColor }]}>
          {trust.tier.toUpperCase()}
        </Text>
        <Text style={styles.note}>
          {trust.withdrawal_delay_hours === 0 ? 'Instant withdraw' : `${trust.withdrawal_delay_hours}h hold`}
        </Text>
      </View>

      {/* Streak */}
      <View style={[styles.card, { borderColor: streakActive ? '#F97316' : '#D1D5DB', backgroundColor: streakActive ? '#FFF7ED' : '#F9FAFB' }]}>
        <Text style={styles.eyebrow}>STREAK 🔥</Text>
        <Text style={[styles.value, { color: streakActive ? '#EA580C' : '#9CA3AF' }]}>
          {streak.current}<Text style={styles.sub}>d</Text>
        </Text>
        {streak.multiplier > 1 ? (
          <View style={styles.multPill}>
            <Text style={styles.multText}>{streak.multiplier}× rewards</Text>
          </View>
        ) : (
          <Text style={styles.note}>{Math.max(0, 3 - streak.current)}d to 1.1×</Text>
        )}
      </View>

      {/* Next Bonus */}
      <View style={[styles.card, { borderColor: '#A855F7', backgroundColor: '#FAF5FF' }]}>
        <Text style={styles.eyebrow}>NEXT</Text>
        <Text style={[styles.value, { color: '#7C3AED' }]}>${bonuses.next.amount}</Text>
        <Text style={[styles.tier, { color: '#7C3AED' }]}>at #{bonuses.next.threshold}</Text>
        <Text style={styles.note}>{bonuses.earned_count} earned</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 12, gap: 8 },
  card: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 2 },
  eyebrow: { fontSize: 10, fontWeight: '800', color: '#6B7280', letterSpacing: 1 },
  value: { fontSize: 22, fontWeight: '800', marginTop: 2 },
  sub: { fontSize: 11, fontWeight: '400', color: '#9CA3AF' },
  tier: { fontSize: 10, fontWeight: '800', marginTop: 1, textTransform: 'uppercase' },
  note: { fontSize: 10, color: '#6B7280', marginTop: 2 },
  multPill: { backgroundColor: '#F97316', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, alignSelf: 'flex-start', marginTop: 2 },
  multText: { fontSize: 9, fontWeight: '800', color: '#fff' },
});

export default ProgressionStrip;
