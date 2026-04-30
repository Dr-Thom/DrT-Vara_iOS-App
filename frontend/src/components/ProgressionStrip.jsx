import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API_CONFIG from '../config/api';
import { Card, CardContent } from './ui/card';
import { ShieldCheck, Shield, ShieldAlert, Flame, Target } from 'lucide-react';

/**
 * Progression strip — trust score, streak, and next bonus milestone.
 * Appears on Dashboard at a glance.
 */
const ProgressionStrip = ({ reloadKey = 0 }) => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    axios.get(`${API_CONFIG.BACKEND_URL}/api/users/me/stats`, { withCredentials: true })
      .then((r) => setStats(r.data))
      .catch(() => setStats(null));
  }, [reloadKey]);

  if (!stats) return null;

  const { trust, streak, bonuses } = stats;
  return (
    <div className="grid md:grid-cols-3 gap-4" data-testid="progression-strip">
      {/* Trust Score */}
      <TrustCard trust={trust} />
      {/* Streak */}
      <StreakCard streak={streak} />
      {/* Next Bonus */}
      <NextBonusCard bonuses={bonuses} />
    </div>
  );
};

const trustBadge = (tier) => {
  if (tier === 'trusted') return { Icon: ShieldCheck, label: 'Trusted', bg: 'from-green-50 to-emerald-50', border: 'border-green-300', text: 'text-green-700', iconBg: 'bg-green-500' };
  if (tier === 'building') return { Icon: Shield, label: 'Building', bg: 'from-blue-50 to-cyan-50', border: 'border-blue-300', text: 'text-blue-700', iconBg: 'bg-blue-500' };
  return { Icon: ShieldAlert, label: 'New', bg: 'from-amber-50 to-yellow-50', border: 'border-amber-300', text: 'text-amber-700', iconBg: 'bg-amber-500' };
};

const TrustCard = ({ trust }) => {
  const t = trustBadge(trust.tier);
  const { Icon } = t;
  const delayCopy = trust.withdrawal_delay_hours === 0
    ? 'Instant withdrawals'
    : `${trust.withdrawal_delay_hours}h withdrawal hold`;
  return (
    <Card className={`border-2 ${t.border} bg-gradient-to-br ${t.bg}`} data-testid="trust-card">
      <CardContent className="p-4 flex items-start gap-3">
        <div className={`w-10 h-10 ${t.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs uppercase tracking-wider font-bold text-gray-500">Trust Score</div>
          <div className={`text-2xl font-bold ${t.text}`} data-testid="trust-score">
            {trust.score} <span className="text-sm font-normal text-gray-500">/100</span>
          </div>
          <div className={`text-xs font-semibold ${t.text} mt-0.5`}>{t.label} tier · {delayCopy}</div>
          <div className="text-xs text-gray-500 mt-1">Max ${trust.max_daily_withdrawal}/24h</div>
        </div>
      </CardContent>
    </Card>
  );
};

const StreakCard = ({ streak }) => {
  const active = streak.current > 0;
  const mult = streak.multiplier;
  return (
    <Card
      className={`border-2 ${active ? 'border-orange-300 bg-gradient-to-br from-orange-50 via-red-50 to-pink-50' : 'border-gray-200 bg-gray-50'}`}
      data-testid="streak-card"
    >
      <CardContent className="p-4 flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${active ? 'bg-gradient-to-br from-orange-500 to-red-500' : 'bg-gray-300'}`}>
          <Flame className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs uppercase tracking-wider font-bold text-gray-500">Daily Streak</div>
          <div className="text-2xl font-bold text-orange-600" data-testid="streak-current">
            {streak.current} <span className="text-sm font-normal text-gray-500">day{streak.current !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            {mult > 1 ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full" data-testid="streak-multiplier">
                {mult}× rewards
              </span>
            ) : (
              <span className="text-xs text-gray-500">
                {3 - streak.current} days to 1.1× rewards
              </span>
            )}
          </div>
          {streak.longest > 0 && (
            <div className="text-xs text-gray-500 mt-1">Longest: {streak.longest} days</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const NextBonusCard = ({ bonuses }) => {
  const next = bonuses.next;
  return (
    <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50" data-testid="next-bonus-card">
      <CardContent className="p-4 flex items-start gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
          <Target className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs uppercase tracking-wider font-bold text-gray-500">Next Milestone</div>
          <div className="text-2xl font-bold text-purple-700" data-testid="next-bonus-amount">
            ${next.amount}
          </div>
          <div className="text-xs font-semibold text-purple-700 mt-0.5">
            at task #{next.threshold}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {bonuses.earned_count} bonus{bonuses.earned_count !== 1 ? 'es' : ''} earned so far
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressionStrip;
