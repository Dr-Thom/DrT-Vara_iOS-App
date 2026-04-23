import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_CONFIG from '../config/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Gift, Users, DollarSign, Copy, Share2, CheckCircle2, Trophy, Crown, Medal } from 'lucide-react';
import { toast } from 'sonner';
import SuperBonusChallenge from '../components/SuperBonusChallenge';

const Referrals = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [leaderPeriod, setLeaderPeriod] = useState('month');
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderYou, setLeaderYou] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await axios.get(`${API_CONFIG.BACKEND_URL}/api/referrals/me`, { withCredentials: true });
        setData(r.data);
      } catch {
        toast.error('Failed to load referral info');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const r = await axios.get(
          `${API_CONFIG.BACKEND_URL}/api/referrals/leaderboard?period=${leaderPeriod}&limit=10`,
          { withCredentials: true }
        );
        setLeaderboard(r.data.leaderboard || []);
        setLeaderYou(r.data.you || null);
      } catch {
        setLeaderboard([]);
        setLeaderYou(null);
      }
    };
    loadLeaderboard();
  }, [leaderPeriod]);

  const shareLink = data?.referral_code
    ? `${window.location.origin}/signup?ref=${data.referral_code}`
    : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Copy failed');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Earn USD on VARA',
          text: `Join me on VARA and earn USD from simple tasks. Use my code: ${data?.referral_code}`,
          url: shareLink,
        });
      } catch { /* user cancelled */ }
    } else {
      handleCopy();
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading…</div>;
  }

  if (!data) {
    return <div className="text-center py-12 text-gray-500">Unable to load referral info.</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Gift className="w-8 h-8 text-purple-600" />
          Refer & Earn
        </h1>
        <p className="text-gray-600 mt-2">
          Earn <strong>10%</strong> of every friend's first <strong>$100</strong> in VARA earnings. That's up to <strong>$10</strong> per friend.
        </p>
      </div>

      {/* Weekly $5 super bonus challenge */}
      <SuperBonusChallenge />

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Friends Referred
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-purple-600" data-testid="referrals-count">
              {data.referred_count || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Earned from Referrals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600" data-testid="referrals-earnings">
              ${(data.referral_earnings || 0).toFixed(2)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Up to ${data.cap_per_referral}/friend</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Gift className="w-4 h-4" />
              Your Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 tracking-widest" data-testid="referral-code">
              {data.referral_code}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Share Link */}
      <Card>
        <CardHeader>
          <CardTitle>Your Referral Link</CardTitle>
          <CardDescription>Share this link anywhere — WhatsApp, Facebook, email.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 break-all" data-testid="referral-link">
              {shareLink}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCopy}
                className="flex items-center gap-2"
                data-testid="copy-referral-link"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
                data-testid="share-referral-link"
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Payouts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Referral Earnings</CardTitle>
          <CardDescription>10% of each friend's earnings, capped at $10/friend.</CardDescription>
        </CardHeader>
        <CardContent>
          {(!data.recent_payouts || data.recent_payouts.length === 0) ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No referral earnings yet. Share your code to start earning!
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {data.recent_payouts.map((p) => (
                <div key={p._id} className="flex justify-between items-center py-3" data-testid="payout-row">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{p.referred_email}</div>
                    <div className="text-xs text-gray-500">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString() : ''}
                    </div>
                  </div>
                  <div className="text-lg font-bold text-green-600">+${p.amount.toFixed(2)}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 via-white to-yellow-50">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Top Referrers
              </CardTitle>
              <CardDescription>Climb the ranks and keep earning.</CardDescription>
            </div>
            <div className="inline-flex rounded-lg border border-amber-200 p-0.5 bg-white" data-testid="leaderboard-period-toggle">
              <button
                type="button"
                onClick={() => setLeaderPeriod('month')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${leaderPeriod === 'month' ? 'bg-amber-500 text-white' : 'text-gray-600 hover:bg-amber-50'}`}
                data-testid="leaderboard-month-btn"
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => setLeaderPeriod('all')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${leaderPeriod === 'all' ? 'bg-amber-500 text-white' : 'text-gray-600 hover:bg-amber-50'}`}
                data-testid="leaderboard-all-btn"
              >
                All-time
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {leaderboard.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No referrers yet {leaderPeriod === 'month' ? 'this month' : ''}. Be the first!
            </div>
          ) : (
            <div className="space-y-2" data-testid="leaderboard-list">
              {leaderboard.map((row) => (
                <LeaderRow key={row.rank + row.display_name} row={row} />
              ))}
              {leaderYou && (
                <>
                  <div className="text-center text-xs text-gray-400 py-1">···</div>
                  <LeaderRow row={leaderYou} />
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const rankStyles = (rank) => {
  if (rank === 1) return 'bg-gradient-to-r from-yellow-100 to-amber-100 border-amber-300';
  if (rank === 2) return 'bg-gradient-to-r from-gray-100 to-slate-100 border-gray-300';
  if (rank === 3) return 'bg-gradient-to-r from-orange-100 to-amber-50 border-orange-300';
  return 'bg-white border-gray-200';
};

const rankIcon = (rank) => {
  if (rank === 1) return <Crown className="w-5 h-5 text-amber-500" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-500" />;
  if (rank === 3) return <Medal className="w-5 h-5 text-orange-500" />;
  return <span className="w-5 text-center text-sm font-bold text-gray-400">#{rank}</span>;
};

const LeaderRow = ({ row }) => (
  <div
    className={`flex items-center justify-between rounded-lg border p-3 transition-all ${rankStyles(row.rank)} ${row.is_you ? 'ring-2 ring-blue-400 ring-offset-1' : ''}`}
    data-testid={`leaderboard-row-${row.rank}`}
  >
    <div className="flex items-center gap-3 min-w-0">
      <div className="flex-shrink-0">{rankIcon(row.rank)}</div>
      <div className="min-w-0">
        <div className="font-semibold text-gray-900 truncate flex items-center gap-2">
          {row.display_name}
          {row.is_you && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">YOU</span>
          )}
        </div>
        <div className="text-xs text-gray-500">
          {row.referral_count} friend{row.referral_count !== 1 ? 's' : ''} referred
        </div>
      </div>
    </div>
    <div className="text-lg font-bold text-green-600">${row.total_earned.toFixed(2)}</div>
  </div>
);

export default Referrals;
