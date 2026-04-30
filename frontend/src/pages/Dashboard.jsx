import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { DollarSign, CheckCircle, Gift, TrendingUp, ArrowRight, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TrustFeed from '../components/TrustFeed';
import SuperBonusChallenge from '../components/SuperBonusChallenge';
import ProgressionStrip from '../components/ProgressionStrip';
import { nextBonusMilestone } from '../config/economics';

const FIRST_BONUS_AT = 5;
const BONUS_AMOUNT = 1.0;  // Kept for "Welcome" copy — actual amount comes from nextBonusMilestone

/**
 * Given current tasks_completed, return the next bonus {threshold, amount}.
 * Uses new milestone ladder: 5→$1, 10→$2, 25→$5, 50→$10, 100→$25, then $25/100.
 */
function getNextBonus(tasksCompleted) {
  return nextBonusMilestone(tasksCompleted);
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const tasksCompleted = user?.tasks_completed || 0;
  const bonusesEarned = user?.bonuses_earned || 0;
  const nextBonus = getNextBonus(tasksCompleted);
  const nextThreshold = nextBonus.threshold;
  const nextAmount = nextBonus.amount;
  const tasksRemaining = Math.max(0, nextThreshold - tasksCompleted);

  // Progress bar window: from previous milestone to the next
  const MILESTONES = [0, 5, 10, 25, 50, 100];
  let windowStart = 0;
  for (const m of MILESTONES) {
    if (m < nextThreshold && m <= tasksCompleted) windowStart = m;
  }
  if (tasksCompleted >= 100) windowStart = Math.floor(tasksCompleted / 100) * 100;
  const windowSize = Math.max(1, nextThreshold - windowStart);
  const progress = Math.min(100, ((tasksCompleted - windowStart) / windowSize) * 100);

  const headerMsg = tasksCompleted === 0
    ? `Complete your first 5 tasks to earn a $${BONUS_AMOUNT.toFixed(2)} bonus!`
    : tasksCompleted < FIRST_BONUS_AT
      ? `Just ${tasksRemaining} more task${tasksRemaining !== 1 ? 's' : ''} for your first $${BONUS_AMOUNT.toFixed(2)} bonus!`
      : `You've earned ${bonusesEarned} bonus${bonusesEarned !== 1 ? 'es' : ''}! Next: $${nextAmount} at task #${nextThreshold}.`;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900" data-testid="dashboard-greeting">
          Welcome back, {user?.name || 'User'}! 👋
        </h1>
        <p className="text-gray-600 mt-1">{headerMsg}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        {/* Balance */}
        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50" data-testid="dashboard-balance-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600" data-testid="dashboard-balance-amount">
              ${(user?.earnings || 0).toFixed(2)}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Lifetime: ${(user?.total_earned || 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>

        {/* Tasks Completed */}
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Tasks Done
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600" data-testid="dashboard-tasks-count">
              {tasksCompleted}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {tasksRemaining} until next bonus
            </p>
          </CardContent>
        </Card>

        {/* Bonuses Earned */}
        <Card className="border-2 border-amber-200 bg-gradient-to-br from-yellow-50 to-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Gift className="w-4 h-4" />
              Bonuses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600" data-testid="dashboard-bonuses-count">
              {bonusesEarned}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              ${(bonusesEarned * BONUS_AMOUNT).toFixed(2)} earned
            </p>
          </CardContent>
        </Card>

        {/* Referrals */}
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 cursor-pointer" onClick={() => navigate('/app/referrals')} data-testid="dashboard-referrals-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Referrals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {user?.referred_count || 0}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              ${(user?.referral_earnings || 0).toFixed(2)} earned
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progression strip: trust / streak / next bonus */}
      <ProgressionStrip />

      {/* Weekly Super Bonus Challenge */}
      <SuperBonusChallenge />

      {/* Bonus Progress Bar */}
      <Card data-testid="dashboard-progress-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Progress to Next ${nextAmount.toFixed(0)} Milestone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                {tasksCompleted} / {nextThreshold} tasks
              </span>
              <span className="font-semibold text-blue-600" data-testid="dashboard-progress-pct">
                {progress.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-600 to-green-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
                data-testid="dashboard-progress-bar"
              />
            </div>
            <p className="text-sm text-gray-600">
              💡 {tasksRemaining} more task{tasksRemaining !== 1 ? 's' : ''} → unlock ${nextAmount}.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/app/tasks')} data-testid="dashboard-tasks-cta">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg text-gray-900">Start Earning</h3>
                <p className="text-sm text-gray-600 mt-1">Complete tasks · $0.10 each</p>
              </div>
              <ArrowRight className="w-6 h-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/app/calculator')} data-testid="dashboard-calculator-cta">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg text-gray-900">Earnings Calculator</h3>
                <p className="text-sm text-gray-600 mt-1">See your monthly potential</p>
              </div>
              <ArrowRight className="w-6 h-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/app/withdrawal')} data-testid="dashboard-withdraw-cta">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg text-gray-900">Withdraw</h3>
                <p className="text-sm text-gray-600 mt-1">Min $5 · GCash / PayPal / Bank</p>
              </div>
              <ArrowRight className="w-6 h-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Social Proof */}
      <TrustFeed />

      {/* Welcome message for new users */}
      {tasksCompleted === 0 && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <h3 className="font-bold text-lg text-gray-900 mb-2">🎉 Get Started!</h3>
            <p className="text-gray-700 mb-4">
              Welcome to VARA! Complete your first 5 tasks to unlock a $1 USD bonus. Most users finish in under 30 minutes.
            </p>
            <Button
              onClick={() => navigate('/app/tasks')}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="dashboard-start-first-task"
            >
              Start Your First Task
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
