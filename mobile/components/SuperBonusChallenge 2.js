import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { referralsAPI } from '../services/api';

const SuperBonusChallenge = ({ reloadKey = 0 }) => {
  const [data, setData] = useState(null);
  const [now, setNow] = useState(Date.now());

  const load = useCallback(async () => {
    try {
      const r = await referralsAPI.getChallenge();
      setData(r);
    } catch {
      setData(null);
    }
  }, []);

  useEffect(() => { load(); }, [load, reloadKey]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!data) return null;

  const { target, super_bonus_amount, qualified_count, completed, week_end } = data;
  const pct = Math.min(100, (qualified_count / target) * 100);
  const remaining = Math.max(0, target - qualified_count);

  const diffMs = Math.max(0, new Date(week_end).getTime() - now);
  const days = Math.floor(diffMs / 86_400_000);
  const hours = Math.floor((diffMs % 86_400_000) / 3_600_000);
  const countdown = days >= 1 ? `${days}d ${hours}h` : `${hours}h`;

  const bgStyle = completed ? styles.bgCompleted : styles.bgActive;
  const accent = completed ? '#10B981' : '#8B5CF6';

  return (
    <View style={[styles.card, bgStyle]}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={[styles.icon, { backgroundColor: accent }]}>
            <Text style={styles.iconText}>{completed ? '✓' : '🚀'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>WEEKLY SUPER BONUS</Text>
            <Text style={styles.title}>
              {completed ? `$${super_bonus_amount.toFixed(0)} Unlocked! 🎉` : `Unlock $${super_bonus_amount.toFixed(0)} this week`}
            </Text>
          </View>
        </View>
        {!completed && (
          <View style={styles.countdownPill}>
            <Text style={styles.countdownText}>Resets in {countdown}</Text>
          </View>
        )}
      </View>

      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>
          {qualified_count} of {target} friends qualified
        </Text>
        <Text style={[styles.progressPct, { color: accent }]}>{pct.toFixed(0)}%</Text>
      </View>
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: accent }]} />
      </View>

      <Text style={styles.hint}>
        {completed
          ? '✨ Nice! You earned this week\'s $5 super bonus. Resets Monday — do it again!'
          : qualified_count === 0
            ? '✨ Share your code — every friend who completes 1 task this week counts.'
            : `✨ ${remaining} more friend${remaining !== 1 ? 's' : ''} to complete 1 task and you unlock $${super_bonus_amount.toFixed(0)}.`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { borderRadius: 14, padding: 16, borderWidth: 2 },
  bgActive: { backgroundColor: '#FAF5FF', borderColor: '#C084FC' },
  bgCompleted: { backgroundColor: '#ECFDF5', borderColor: '#6EE7B7' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  icon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 20, color: '#fff' },
  eyebrow: { fontSize: 10, fontWeight: '800', color: '#6B7280', letterSpacing: 1 },
  title: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginTop: 2 },
  countdownPill: { backgroundColor: 'rgba(255,255,255,0.8)', borderWidth: 1, borderColor: '#E9D5FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  countdownText: { fontSize: 11, fontWeight: '700', color: '#7C3AED' },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 13, fontWeight: '600', color: '#374151' },
  progressPct: { fontSize: 14, fontWeight: '700' },
  progressBg: { height: 10, backgroundColor: '#fff', borderRadius: 5, borderWidth: 1, borderColor: '#E9D5FF', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5 },
  hint: { fontSize: 12, color: '#374151', marginTop: 10, lineHeight: 17 },
});

export default SuperBonusChallenge;
