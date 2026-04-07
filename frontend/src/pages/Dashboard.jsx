import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { DollarSign, CheckCircle, Gift, TrendingUp, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const tasksRemaining = Math.max(0, 5 - (user?.tasks_completed || 0));
  const bonusProgress = Math.min(100, ((user?.tasks_completed || 0) / 5) * 100);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name || 'User'}! 👋
        </h1>
        <p className="text-gray-600 mt-1">
          {user?.bonus_unlocked 
            ? 'Great job! You\'ve unlocked your bonus. Keep earning!' 
            : `Complete ${tasksRemaining} more task${tasksRemaining !== 1 ? 's' : ''} to unlock your $2 bonus!`
          }
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Total Earnings */}
        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Earned:</span>
                <span className="text-lg font-semibold text-gray-900">
                  ${(user?.total_earned || 0).toFixed(2)} USD
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Withdrawn:</span>
                <span className="text-lg font-semibold text-red-600">
                  -${(user?.total_withdrawn || 0).toFixed(2)} USD
                </span>
              </div>
              <div className="border-t border-green-300 pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Balance:</span>
                  <span className="text-2xl font-bold text-green-600">
                    ${(user?.earnings || 0).toFixed(2)} USD
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-1">≈ ₱{((user?.earnings || 0) * 55).toFixed(2)} PHP</p>
            </div>
          </CardContent>
        </Card>

        {/* Tasks Completed */}
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Tasks Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-600">
              {user?.tasks_completed || 0}
            </div>
            <p className="text-sm text-gray-600 mt-2">{user?.bonus_unlocked ? 'Bonus unlocked! 🎉' : `${tasksRemaining} until bonus`}</p>
          </CardContent>
        </Card>

        {/* Bonus Status */}
        <Card className={`border-2 ${user?.bonus_unlocked ? 'border-yellow-300 bg-gradient-to-br from-yellow-50 to-amber-50' : 'border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50'}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Gift className="w-4 h-4" />
              Bonus Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-4xl font-bold ${user?.bonus_unlocked ? 'text-yellow-600' : 'text-purple-600'}`}>
              {user?.bonus_unlocked ? '✓ $2 USD' : '$2 USD'}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {user?.bonus_unlocked ? 'Unlocked!' : 'Pending'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bonus Progress Bar */}
      {!user?.bonus_unlocked && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Progress to $2 Bonus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{user?.tasks_completed || 0} / 5 tasks completed</span>
                <span className="font-semibold text-blue-600">{bonusProgress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-green-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${bonusProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">
                💡 Complete {tasksRemaining} more task{tasksRemaining !== 1 ? 's' : ''} to unlock your bonus instantly!
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/app/tasks')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg text-gray-900">Browse Tasks</h3>
                <p className="text-sm text-gray-600 mt-1">Start earning by completing simple tasks</p>
              </div>
              <ArrowRight className="w-6 h-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/app/withdrawal')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg text-gray-900">Withdraw Earnings</h3>
                <p className="text-sm text-gray-600 mt-1">Cash out via GCash, PayPal, or Bank</p>
              </div>
              <ArrowRight className="w-6 h-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Welcome Message for New Users */}
      {(user?.tasks_completed || 0) === 0 && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <h3 className="font-bold text-lg text-gray-900 mb-2">🎉 Get Started!</h3>
            <p className="text-gray-700 mb-4">
              Welcome to VARA! Complete your first 5 tasks to unlock your $2 USD bonus. Most users finish in under 30 minutes!
            </p>
            <Button 
              onClick={() => navigate('/app/tasks')}
              className="bg-blue-600 hover:bg-blue-700"
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
