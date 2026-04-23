import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { APP_CONFIG, computeBonusesEarned } from '../config';

const CalculatorScreen = () => {
  const [tasksPerDay, setTasksPerDay] = useState(10);
  const [daysActive, setDaysActive] = useState(7);

  const { daily, weekly, monthly } = useMemo(() => {
    const d = {
      tasks: tasksPerDay,
      bonuses: computeBonusesEarned(tasksPerDay),
    };
    d.total = tasksPerDay * APP_CONFIG.REWARD_PER_TASK + d.bonuses * APP_CONFIG.BONUS_AMOUNT;

    const weeklyTasks = tasksPerDay * daysActive;
    const w = {
      tasks: weeklyTasks,
      bonuses: computeBonusesEarned(weeklyTasks),
    };
    w.total = weeklyTasks * APP_CONFIG.REWARD_PER_TASK + w.bonuses * APP_CONFIG.BONUS_AMOUNT;

    const monthlyTasks = Math.round(tasksPerDay * daysActive * 4.33);
    const m = {
      tasks: monthlyTasks,
      bonuses: computeBonusesEarned(monthlyTasks),
    };
    m.total = monthlyTasks * APP_CONFIG.REWARD_PER_TASK + m.bonuses * APP_CONFIG.BONUS_AMOUNT;

    return { daily: d, weekly: w, monthly: m };
  }, [tasksPerDay, daysActive]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Earnings Calculator</Text>
      <Text style={styles.subtitle}>See how much you can earn on VARA.</Text>

      <View style={styles.card}>
        <View style={styles.sliderRow}>
          <Text style={styles.label}>Tasks per day</Text>
          <Text style={styles.value}>{tasksPerDay}</Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={1}
          maximumValue={50}
          step={1}
          value={tasksPerDay}
          onValueChange={setTasksPerDay}
          minimumTrackTintColor="#3B82F6"
          maximumTrackTintColor="#E5E7EB"
          thumbTintColor="#3B82F6"
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabelText}>1</Text>
          <Text style={styles.sliderLabelText}>50</Text>
        </View>

        <View style={[styles.sliderRow, { marginTop: 16 }]}>
          <Text style={styles.label}>Days per week</Text>
          <Text style={styles.value}>{daysActive}</Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={1}
          maximumValue={7}
          step={1}
          value={daysActive}
          onValueChange={setDaysActive}
          minimumTrackTintColor="#10B981"
          maximumTrackTintColor="#E5E7EB"
          thumbTintColor="#10B981"
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabelText}>1</Text>
          <Text style={styles.sliderLabelText}>7</Text>
        </View>
      </View>

      <ProjectionCard label="Daily" total={daily.total} tasks={daily.tasks} bonuses={daily.bonuses} color="#3B82F6" />
      <ProjectionCard label="Weekly" total={weekly.total} tasks={weekly.tasks} bonuses={weekly.bonuses} color="#10B981" />
      <ProjectionCard label="Monthly" total={monthly.total} tasks={monthly.tasks} bonuses={monthly.bonuses} color="#8B5CF6" highlight />

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>How it works</Text>
        <Text style={styles.infoBullet}>• ${APP_CONFIG.REWARD_PER_TASK.toFixed(2)} per completed task</Text>
        <Text style={styles.infoBullet}>• ${APP_CONFIG.BONUS_AMOUNT.toFixed(2)} bonus at task #{APP_CONFIG.FIRST_BONUS_AT}, then every {APP_CONFIG.RECURRING_BONUS_INTERVAL}</Text>
        <Text style={styles.infoBullet}>• Refer friends → 10% of their first $100 (up to $10 each)</Text>
        <Text style={styles.disclaimer}>* Earnings depend on daily task availability.</Text>
      </View>
    </ScrollView>
  );
};

const ProjectionCard = ({ label, total, tasks, bonuses, color, highlight }) => (
  <View style={[styles.projCard, { borderLeftColor: color }, highlight && styles.projHighlight]}>
    <Text style={styles.projLabel}>{label}</Text>
    <Text style={[styles.projTotal, { color }]}>${total.toFixed(2)}</Text>
    <Text style={styles.projSub}>
      {tasks} tasks · {bonuses} bonus{bonuses !== 1 ? 'es' : ''}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 20, gap: 12 },
  title: { fontSize: 26, fontWeight: '700', color: '#1F2937' },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  sliderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 14, fontWeight: '600', color: '#374151' },
  value: { fontSize: 24, fontWeight: '700', color: '#3B82F6' },
  slider: { width: '100%', height: 40 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, marginTop: -8 },
  sliderLabelText: { fontSize: 11, color: '#9CA3AF' },
  projCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderLeftWidth: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  projHighlight: { borderWidth: 2, borderColor: '#8B5CF6', borderLeftWidth: 4 },
  projLabel: { fontSize: 12, color: '#6B7280', textTransform: 'uppercase', fontWeight: '600', letterSpacing: 0.5 },
  projTotal: { fontSize: 32, fontWeight: '700', marginTop: 4 },
  projSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  infoCard: { backgroundColor: '#EFF6FF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#DBEAFE', marginTop: 8 },
  infoTitle: { fontSize: 15, fontWeight: '700', color: '#1E3A8A', marginBottom: 8 },
  infoBullet: { fontSize: 13, color: '#374151', marginBottom: 4, lineHeight: 18 },
  disclaimer: { fontSize: 11, color: '#9CA3AF', marginTop: 8, fontStyle: 'italic' },
});

export default CalculatorScreen;
