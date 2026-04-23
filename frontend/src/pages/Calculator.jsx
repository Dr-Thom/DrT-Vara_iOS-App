import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Calculator as CalcIcon, TrendingUp, Calendar, DollarSign, Trophy, Zap } from 'lucide-react';

// Economics constants — keep in sync with backend
const REWARD_PER_TASK = 0.10;
const BONUS_AMOUNT = 1.00;
const FIRST_BONUS_AT = 5;
const RECURRING_BONUS_INTERVAL = 10;

function computeBonusesForTasks(totalTasks) {
  if (totalTasks < FIRST_BONUS_AT) return 0;
  return 1 + Math.max(0, Math.floor((totalTasks - FIRST_BONUS_AT) / RECURRING_BONUS_INTERVAL));
}

const Calculator = () => {
  const [tasksPerDay, setTasksPerDay] = useState(10);
  const [daysActive, setDaysActive] = useState(7); // days per week

  const projections = useMemo(() => {
    const daily = {
      tasks: tasksPerDay,
      taskEarnings: tasksPerDay * REWARD_PER_TASK,
      bonuses: computeBonusesForTasks(tasksPerDay) * BONUS_AMOUNT,
    };
    daily.total = daily.taskEarnings + daily.bonuses;

    // For weekly/monthly, bonuses compound over cumulative task count
    const weekly = (() => {
      const totalTasks = tasksPerDay * daysActive;
      const bonusCount = computeBonusesForTasks(totalTasks);
      return {
        tasks: totalTasks,
        taskEarnings: totalTasks * REWARD_PER_TASK,
        bonuses: bonusCount * BONUS_AMOUNT,
        total: totalTasks * REWARD_PER_TASK + bonusCount * BONUS_AMOUNT,
        bonusCount,
      };
    })();

    const monthly = (() => {
      const totalTasks = tasksPerDay * daysActive * 4.33;
      const rounded = Math.round(totalTasks);
      const bonusCount = computeBonusesForTasks(rounded);
      return {
        tasks: rounded,
        taskEarnings: rounded * REWARD_PER_TASK,
        bonuses: bonusCount * BONUS_AMOUNT,
        total: rounded * REWARD_PER_TASK + bonusCount * BONUS_AMOUNT,
        bonusCount,
      };
    })();

    return { daily, weekly, monthly };
  }, [tasksPerDay, daysActive]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <CalcIcon className="w-8 h-8 text-blue-600" />
          Earnings Calculator
        </h1>
        <p className="text-gray-600 mt-2">See exactly how much you can earn on VARA.</p>
      </div>

      {/* Sliders */}
      <Card>
        <CardHeader>
          <CardTitle>Your Activity</CardTitle>
          <CardDescription>Adjust the sliders to match your usage.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold text-gray-700">
                Tasks per day
              </label>
              <span className="text-2xl font-bold text-blue-600" data-testid="calc-tasks-per-day-value">
                {tasksPerDay}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={50}
              value={tasksPerDay}
              onChange={(e) => setTasksPerDay(parseInt(e.target.value, 10))}
              className="w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-600"
              data-testid="calc-tasks-slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1 task</span>
              <span>50 tasks</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold text-gray-700">
                Days per week
              </label>
              <span className="text-2xl font-bold text-green-600" data-testid="calc-days-per-week-value">
                {daysActive}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={7}
              value={daysActive}
              onChange={(e) => setDaysActive(parseInt(e.target.value, 10))}
              className="w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer accent-green-600"
              data-testid="calc-days-slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1 day</span>
              <span>7 days</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projections */}
      <div className="grid md:grid-cols-3 gap-4">
        <ProjectionCard
          icon={<Zap className="w-5 h-5" />}
          label="Daily"
          total={projections.daily.total}
          tasks={projections.daily.tasks}
          bonusCount={computeBonusesForTasks(projections.daily.tasks)}
          taskEarnings={projections.daily.taskEarnings}
          bonusEarnings={projections.daily.bonuses}
          color="blue"
          testid="calc-daily-card"
        />
        <ProjectionCard
          icon={<Calendar className="w-5 h-5" />}
          label="Weekly"
          total={projections.weekly.total}
          tasks={projections.weekly.tasks}
          bonusCount={projections.weekly.bonusCount}
          taskEarnings={projections.weekly.taskEarnings}
          bonusEarnings={projections.weekly.bonuses}
          color="green"
          testid="calc-weekly-card"
        />
        <ProjectionCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Monthly"
          total={projections.monthly.total}
          tasks={projections.monthly.tasks}
          bonusCount={projections.monthly.bonusCount}
          taskEarnings={projections.monthly.taskEarnings}
          bonusEarnings={projections.monthly.bonuses}
          color="purple"
          highlight
          testid="calc-monthly-card"
        />
      </div>

      {/* How it works */}
      <Card className="bg-gradient-to-br from-blue-50 to-green-50 border-blue-200">
        <CardContent className="p-6">
          <h3 className="font-bold text-lg text-gray-900 mb-3 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            How Earnings Work
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <DollarSign className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>$0.10 per task</strong> — earned immediately after completion</span>
            </li>
            <li className="flex items-start gap-2">
              <Trophy className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <span><strong>$1 bonus at task #5</strong>, then every 10 tasks after (15, 25, 35…)</span>
            </li>
            <li className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <span><strong>Refer friends</strong> and earn 10% of their first $100 ($10 per friend)</span>
            </li>
          </ul>
          <p className="text-xs text-gray-500 mt-4">
            * Projections assume steady task availability. Actual earnings depend on tasks available each day.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

const colorClasses = {
  blue: 'border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-600',
  green: 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 text-green-600',
  purple: 'border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 text-purple-700',
};

const ProjectionCard = ({ icon, label, total, tasks, bonusCount, taskEarnings, bonusEarnings, color, highlight, testid }) => (
  <Card className={`border-2 ${colorClasses[color]} ${highlight ? 'ring-2 ring-purple-400 shadow-lg' : ''}`} data-testid={testid}>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
        {icon}
        {label} Earnings
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-4xl font-bold mb-2" data-testid={`${testid}-total`}>
        ${total.toFixed(2)}
      </div>
      <div className="text-xs text-gray-600 space-y-1">
        <div className="flex justify-between">
          <span>{tasks} tasks</span>
          <span>${taskEarnings.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>{bonusCount} bonus{bonusCount !== 1 ? 'es' : ''}</span>
          <span>${bonusEarnings.toFixed(2)}</span>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default Calculator;
