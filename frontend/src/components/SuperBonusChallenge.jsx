import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import API_CONFIG from '../config/api';
import { Card, CardContent } from './ui/card';
import { Rocket, CheckCircle2, Clock, Sparkles } from 'lucide-react';

/**
 * Weekly Super Bonus Challenge card.
 * Shows progress toward $5 super bonus for inviting 3 friends this week.
 */
const SuperBonusChallenge = ({ reloadKey = 0 }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  const load = useCallback(async () => {
    try {
      const r = await axios.get(`${API_CONFIG.BACKEND_URL}/api/referrals/challenge`, { withCredentials: true });
      setData(r.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, reloadKey]);

  // Tick every minute for the countdown
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (loading || !data) return null;

  const { target, super_bonus_amount, qualified_count, completed, week_end } = data;
  const pct = Math.min(100, (qualified_count / target) * 100);
  const remaining = Math.max(0, target - qualified_count);

  // Time remaining
  const weekEndMs = week_end ? new Date(week_end).getTime() : 0;
  const diffMs = Math.max(0, weekEndMs - now);
  const days = Math.floor(diffMs / 86_400_000);
  const hours = Math.floor((diffMs % 86_400_000) / 3_600_000);
  const mins = Math.floor((diffMs % 3_600_000) / 60_000);
  const countdown =
    days >= 1 ? `${days}d ${hours}h` :
    hours >= 1 ? `${hours}h ${mins}m` :
    `${mins}m`;

  return (
    <Card
      className={`relative overflow-hidden border-2 ${
        completed
          ? 'border-green-300 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50'
          : 'border-purple-300 bg-gradient-to-br from-purple-50 via-fuchsia-50 to-pink-50'
      }`}
      data-testid="super-bonus-challenge"
    >
      {/* Decorative sparkles */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-200/40 to-transparent rounded-full -mr-10 -mt-10" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-200/30 to-transparent rounded-full -ml-8 -mb-8" />

      <CardContent className="relative p-5">
        <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                completed ? 'bg-green-500' : 'bg-gradient-to-br from-purple-500 to-pink-500'
              }`}
            >
              {completed ? (
                <CheckCircle2 className="w-6 h-6 text-white" />
              ) : (
                <Rocket className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider font-bold text-gray-500">
                Weekly Super Bonus
              </div>
              <div className="text-lg font-bold text-gray-900">
                {completed ? `$${super_bonus_amount.toFixed(0)} Unlocked! 🎉` : `Unlock $${super_bonus_amount.toFixed(0)} this week`}
              </div>
            </div>
          </div>
          {!completed && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 border border-purple-200 text-sm font-semibold text-purple-700" data-testid="super-bonus-countdown">
              <Clock className="w-3.5 h-3.5" />
              Resets in {countdown}
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="mb-2">
          <div className="flex justify-between text-sm mb-1.5">
            <span className="font-semibold text-gray-700">
              {qualified_count} of {target} friends qualified
            </span>
            <span className="font-bold text-purple-700" data-testid="super-bonus-pct">
              {pct.toFixed(0)}%
            </span>
          </div>
          <div className="w-full h-3 bg-white/70 rounded-full overflow-hidden border border-purple-200">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                completed
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                  : 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500'
              }`}
              style={{ width: `${pct}%` }}
              data-testid="super-bonus-progress-bar"
            />
          </div>
        </div>

        <div className="text-sm text-gray-700 mt-3 flex items-start gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          {completed ? (
            <span>
              <strong>Nice!</strong> You've earned this week's $5 super bonus. Resets Monday — do it again!
            </span>
          ) : qualified_count === 0 ? (
            <span>
              Share your code now — every friend who completes <strong>just 1 task</strong> this week counts.
            </span>
          ) : (
            <span>
              <strong>{remaining} more friend{remaining !== 1 ? 's' : ''}</strong> to complete 1 task this week and you unlock <strong>${super_bonus_amount.toFixed(0)}</strong>.
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SuperBonusChallenge;
