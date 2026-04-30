/**
 * VARA economics — source of truth for frontend. Keep in sync with:
 *  - /app/backend/utils/economics.py
 *  - /app/backend/utils/streak.py
 *  - /app/backend/utils/trust.py
 *  - /app/mobile/config.js
 */

export const BONUS_MILESTONES = [
  { threshold: 5, amount: 1 },
  { threshold: 10, amount: 2 },
  { threshold: 25, amount: 5 },
  { threshold: 50, amount: 10 },
  { threshold: 100, amount: 25 },
];

export const RECURRING_BONUS = { interval: 100, amount: 25 };

export const STREAK_TIERS = [
  { days: 14, multiplier: 1.5, label: 'Blazing 🔥🔥🔥' },
  { days: 7, multiplier: 1.25, label: 'Hot 🔥🔥' },
  { days: 3, multiplier: 1.1, label: 'Warming 🔥' },
];

export function streakMultiplier(days) {
  for (const t of STREAK_TIERS) if (days >= t.days) return t.multiplier;
  return 1.0;
}

export function streakTier(days) {
  for (const t of STREAK_TIERS) if (days >= t.days) return t;
  return { days: 0, multiplier: 1.0, label: 'Start your streak' };
}

export function trustTier(score) {
  if (score >= 75) return { key: 'trusted', label: 'Trusted', color: 'green' };
  if (score >= 50) return { key: 'building', label: 'Building', color: 'blue' };
  return { key: 'low', label: 'New', color: 'amber' };
}

export function nextBonusMilestone(tasksCompleted) {
  for (const m of BONUS_MILESTONES) {
    if (tasksCompleted < m.threshold) return m;
  }
  const last = BONUS_MILESTONES[BONUS_MILESTONES.length - 1].threshold;
  const nextHundred = (Math.floor(tasksCompleted / RECURRING_BONUS.interval) + 1) * RECURRING_BONUS.interval;
  return { threshold: nextHundred, amount: RECURRING_BONUS.amount };
}
