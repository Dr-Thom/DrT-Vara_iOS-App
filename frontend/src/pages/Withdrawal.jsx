import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { DollarSign, CheckCircle2, AlertCircle, Loader2, Clock, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import API_CONFIG from '../config/api';

const Withdrawal = () => {
  const { user, refreshUser } = useAuth();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');
  const [accountDetails, setAccountDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [withdrawalSuccess, setWithdrawalSuccess] = useState(false);
  const [trust, setTrust] = useState(null);

  useEffect(() => {
    axios.get(`${API_CONFIG.BACKEND_URL}/api/users/me/stats`, { withCredentials: true })
      .then((r) => setTrust(r.data?.trust || null))
      .catch(() => setTrust(null));
  }, []);

  const currentBalance = user?.earnings || 0;
  const minWithdrawal = trust?.min_withdrawal ?? 5;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!amount || !method || !accountDetails) {
      toast.error('Please fill in all fields');
      return;
    }

    const withdrawAmount = parseFloat(amount);
    
    if (withdrawAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (withdrawAmount > currentBalance) {
      toast.error('Insufficient balance');
      return;
    }

    if (currentBalance >= 5 && withdrawAmount < 5) {
      toast.error('Minimum withdrawal is $5 USD');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post(
        `${API_CONFIG.BACKEND_URL}/api/withdrawal/request`,
        {
          amount: withdrawAmount,
          method,
          account_details: accountDetails
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        setWithdrawalSuccess(true);
        await refreshUser();
        
        // Reset form
        setAmount('');
        setMethod('');
        setAccountDetails('');
        
        setTimeout(() => setWithdrawalSuccess(false), 5000);
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      const errorMsg = error.response?.data?.detail || 'Withdrawal request failed';
      toast.error(typeof errorMsg === 'string' ? errorMsg : 'Withdrawal failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const methodPlaceholders = {
    gcash: '09XXXXXXXXX',
    paypal: 'your@email.com',
    bank: 'Account Number / IBAN'
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Withdraw Earnings</h1>
        <p className="text-gray-600 mt-1">Request a withdrawal to your preferred payment method</p>
      </div>

      {/* Balance Card */}
      <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Available Balance</p>
              <div className="text-4xl font-bold text-green-600">
                ${currentBalance.toFixed(2)}
              </div>
              <p className="text-sm text-gray-600 mt-1">≈ ₱{(currentBalance * 55).toFixed(2)} PHP</p>
            </div>
            <DollarSign className="w-16 h-16 text-green-600 opacity-20" />
          </div>
        </CardContent>
      </Card>

      {/* Trust Tier Info */}
      {trust && (
        <Card
          className={`border-2 ${
            trust.tier === 'trusted' ? 'border-green-300 bg-green-50'
            : trust.tier === 'building' ? 'border-blue-200 bg-blue-50'
            : 'border-amber-200 bg-amber-50'
          }`}
          data-testid="withdrawal-trust-info"
        >
          <CardContent className="p-4 flex items-start gap-3">
            {trust.withdrawal_delay_hours === 0 ? (
              <ShieldCheck className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <Clock className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-sm">
              <div className="font-semibold text-gray-900 mb-1 capitalize">
                {trust.tier} tier · Trust score {trust.score}/100
              </div>
              {trust.withdrawal_delay_hours === 0 ? (
                <p className="text-gray-700">
                  <strong>Instant withdrawals.</strong> Up to ${trust.max_daily_withdrawal}/24h.
                </p>
              ) : (
                <p className="text-gray-700">
                  Your withdrawals have a <strong>{trust.withdrawal_delay_hours}h hold</strong>.
                  Daily cap: <strong>${trust.max_daily_withdrawal}</strong>.
                  Complete tasks to raise your trust score and unlock instant withdrawals at 75+.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Withdrawal Form */}
      <Card>
        <CardHeader>
          <CardTitle>Withdrawal Request</CardTitle>
          <CardDescription>
            {currentBalance >= 5 
              ? 'Minimum withdrawal: $5 USD' 
              : 'No minimum for your bonus! Withdraw any amount.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentBalance === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">You don't have any earnings to withdraw yet.</p>
              <p className="text-sm text-gray-500 mt-2">Complete tasks to start earning!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (USD)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    max={currentBalance}
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(currentBalance.toFixed(2))}
                  >
                    Max: ${currentBalance.toFixed(2)}
                  </Button>
                  {currentBalance >= 5 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount('5.00')}
                    >
                      Min: $5.00
                    </Button>
                  )}
                </div>
              </div>

              {/* Method */}
              <div className="space-y-2">
                <Label htmlFor="method">Withdrawal Method</Label>
                <Select value={method} onValueChange={setMethod} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gcash">GCash</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Account Details */}
              <div className="space-y-2">
                <Label htmlFor="account">Account Details</Label>
                <Input
                  id="account"
                  type="text"
                  placeholder={method ? methodPlaceholders[method] : 'Select method first'}
                  value={accountDetails}
                  onChange={(e) => setAccountDetails(e.target.value)}
                  disabled={!method}
                  required
                />
                <p className="text-xs text-gray-500">
                  {method === 'gcash' && 'Enter your GCash mobile number'}
                  {method === 'paypal' && 'Enter your PayPal email address'}
                  {method === 'bank' && 'Enter your bank account number'}
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting || currentBalance === 0}
                className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Request Withdrawal
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Success Message */}
      {withdrawalSuccess && (
        <Card className="border-2 border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900">Withdrawal Approved!</p>
                <p className="text-sm text-green-700 mt-1">
                  Your funds will be sent within 24-48 hours. Check your email for confirmation.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Box */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Withdrawal Information</h4>
          <ul className="space-y-1 text-sm text-gray-700">
            <li>✓ Processing time: 24-48 hours</li>
            <li>✓ No fees for your first withdrawal</li>
            <li>✓ Minimum $5 USD (or full balance if less)</li>
            <li>✓ Secure and verified transactions</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default Withdrawal;
