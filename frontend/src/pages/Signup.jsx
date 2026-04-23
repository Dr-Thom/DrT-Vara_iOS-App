import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Mail, Lock, User, AlertCircle, Gift, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import API_CONFIG from '../config/api';

const Signup = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [referralCode, setReferralCode] = useState(searchParams.get('ref')?.toUpperCase() || '');
  const [referralStatus, setReferralStatus] = useState(null); // null | 'valid' | 'invalid'
  const [referrerName, setReferrerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { signup } = useAuth();
  const navigate = useNavigate();

  // Validate referral code live (debounced)
  useEffect(() => {
    const code = (referralCode || '').trim().toUpperCase();
    if (!code) {
      setReferralStatus(null);
      return;
    }
    if (code.length < 4) {
      setReferralStatus(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const r = await axios.get(`${API_CONFIG.BACKEND_URL}/api/referrals/validate/${encodeURIComponent(code)}`);
        if (r.data?.valid) {
          setReferralStatus('valid');
          setReferrerName(r.data.referrer_name || 'a VARA user');
        } else {
          setReferralStatus('invalid');
        }
      } catch {
        setReferralStatus('invalid');
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [referralCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      await signup(email, password, name, referralCode);
      toast.success('Account created successfully!');
      navigate('/app/dashboard');
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Signup failed. Please try again.';
      setError(typeof errorMsg === 'string' ? errorMsg : 'Signup failed');
      toast.error(typeof errorMsg === 'string' ? errorMsg : 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600 mb-2">
            VARA
          </div>
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>Start earning USD from your phone today</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="signup-form">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2" data-testid="signup-error">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {referralStatus === 'valid' && (
              <div className="bg-green-50 border-2 border-green-300 rounded-lg p-3 flex items-start gap-2" data-testid="referral-valid">
                <Gift className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-800">Referred by {referrerName}!</p>
                  <p className="text-xs text-green-700">They'll earn 10% of your first $100 in VARA earnings.</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Name (Optional)</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                  data-testid="signup-name-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  data-testid="signup-email-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  data-testid="signup-password-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                Referral Code <span className="text-xs text-gray-400">(Optional)</span>
              </label>
              <div className="relative">
                <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="e.g. ABCD1234"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  className="pl-10 pr-10 uppercase tracking-wider"
                  maxLength={12}
                  data-testid="signup-referral-input"
                />
                {referralStatus === 'valid' && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-600" />
                )}
                {referralStatus === 'invalid' && (
                  <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                )}
              </div>
              {referralStatus === 'invalid' && (
                <p className="text-xs text-red-600">That referral code doesn't exist — it's okay to leave blank.</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white h-12 text-lg font-semibold"
              data-testid="signup-submit-button"
            >
              {isLoading ? 'Creating Account...' : 'Sign Up & Start Earning'}
            </Button>

            <div className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold" data-testid="login-link">
                Log In
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;
