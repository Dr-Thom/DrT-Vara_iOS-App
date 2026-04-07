import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { X, Sparkles, Clock, TrendingUp, Mail } from 'lucide-react';
import { toast } from 'sonner';

const ExitIntentPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes countdown

  useEffect(() => {
    // Check if user has already seen the popup
    const hasSeenPopup = localStorage.getItem('vara_exit_popup_seen');
    if (hasSeenPopup) return;

    // Exit intent detection
    const handleMouseLeave = (e) => {
      // Detect when mouse leaves from top of viewport (indicating exit intent)
      if (e.clientY <= 0 && !isOpen) {
        setIsOpen(true);
        localStorage.setItem('vara_exit_popup_seen', 'true');
      }
    };

    // Add delay before enabling exit intent (prevent immediate trigger)
    const timer = setTimeout(() => {
      document.addEventListener('mouseleave', handleMouseLeave);
    }, 5000); // 5 seconds delay

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isOpen]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success('🎉 Exclusive $3 bonus locked in! Check your email for details.');
      setIsOpen(false);
      setEmail('');
    }, 1500);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border-0 gap-0">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 z-50 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <X className="h-5 w-5 text-white" />
          <span className="sr-only">Close</span>
        </button>

        {/* Header with gradient background */}
        <div className="bg-gradient-to-br from-green-500 via-emerald-500 to-green-600 text-white p-8 pb-6 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>

          <div className="relative z-10">
            {/* Badge */}
            <Badge className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white border-0 text-sm font-semibold mb-4 animate-pulse">
              <Sparkles className="w-4 h-4" />
              Exclusive Offer - Limited Time
            </Badge>

            <DialogHeader>
              <DialogTitle className="text-3xl md:text-4xl font-bold text-white mb-3">
                Wait! Get an Extra $1 Bonus! 🎁
              </DialogTitle>
              <DialogDescription className="text-lg text-white/90">
                Join our waitlist in the next <span className="font-bold text-white">{formatTime(timeLeft)}</span> and unlock a special <span className="font-bold text-white text-xl">$3 USD bonus</span> instead of $2!
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 bg-white">
          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="flex flex-col items-center text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-3">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <p className="text-2xl font-bold text-blue-700">$3 USD</p>
              <p className="text-xs text-gray-600">Welcome Bonus</p>
            </div>

            <div className="flex flex-col items-center text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-3">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <p className="text-2xl font-bold text-green-700">50% More</p>
              <p className="text-xs text-gray-600">Than Regular</p>
            </div>

            <div className="flex flex-col items-center text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mb-3">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <p className="text-2xl font-bold text-purple-700">{formatTime(timeLeft)}</p>
              <p className="text-xs text-gray-600">Time Left</p>
            </div>
          </div>

          {/* Why join now section */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-green-500">✓</span> What You'll Get:
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span><strong>$3 USD bonus</strong> (50% more than standard $2)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span><strong>Early access</strong> to VARA before public launch</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span><strong>Priority support</strong> from our team</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span><strong>Exclusive updates</strong> and earning tips</span>
              </li>
            </ul>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="email"
                placeholder="Enter your email to claim $3 bonus"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                className="h-14 pl-12 pr-6 text-base border-2 border-gray-200 focus:border-green-500"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || timeLeft === 0}
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {isSubmitting ? (
                'Securing Your Bonus...'
              ) : timeLeft === 0 ? (
                'Offer Expired'
              ) : (
                <>
                  Claim My $3 Bonus Now
                  <Sparkles className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* Trust indicators */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="text-green-500">🔒</span>
                <span>Secure & Private</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✉️</span>
                <span>No Spam Ever</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">🎯</span>
                <span>12,543 Joined</span>
              </div>
            </div>
          </div>

          {/* Urgency message */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              ⚡ Only <strong className="text-red-500">{Math.max(0, 100 - Math.floor(timeLeft / 3))}</strong> spots left at this bonus level
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExitIntentPopup;
