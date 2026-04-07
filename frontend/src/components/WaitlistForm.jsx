import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Mail, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import API_CONFIG from '../config/api';

const WaitlistForm = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [position, setPosition] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      const apiUrl = `${API_CONFIG.BACKEND_URL}${API_CONFIG.ENDPOINTS.WAITLIST}`;
      console.log('Submitting to:', apiUrl); // Debug log
      
      const response = await axios.post(apiUrl, {
        email: email,
        source: 'main_form'
      });

      if (response.data.success) {
        setIsSubmitted(true);
        setPosition(response.data.data.position);
        
        if (response.data.message.includes('already')) {
          toast.success(response.data.message);
        } else {
          toast.success(`🎉 ${response.data.message} You're #${response.data.data.position} on the waitlist!`);
        }
        
        // Reset after 5 seconds
        setTimeout(() => {
          setEmail('');
          setIsSubmitted(false);
          setPosition(null);
        }, 5000);
      } else {
        toast.error(response.data.message || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Waitlist submission error:', error);
      
      if (error.response?.status === 429) {
        toast.error('Too many requests. Please try again later.');
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Connection issue. Please check your internet and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-overlay filter blur-3xl opacity-30"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-500 rounded-full mix-blend-overlay filter blur-3xl opacity-30"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <Card className="max-w-3xl mx-auto border-0 shadow-2xl bg-white/10 backdrop-blur-lg">
          <CardContent className="p-8 md:p-12">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6">
                <Mail className="w-8 h-8 text-white" />
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Start Earning USD Today — Unlock Your $2 USD Bonus
              </h2>
              <p className="text-lg text-blue-100 leading-relaxed">
                Be among the first to access VARA when we launch. Get exclusive early access and an extra bonus!
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting || isSubmitted}
                  className="flex-1 h-14 px-6 bg-white/90 border-0 text-gray-900 placeholder:text-gray-500 text-lg focus:ring-2 focus:ring-white"
                />
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting || isSubmitted}
                  className={`h-14 px-8 text-lg font-semibold transition-all duration-300 ${
                    isSubmitted 
                      ? 'bg-green-600 hover:bg-green-600' 
                      : 'bg-green-500 hover:bg-green-600'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Joining...
                    </>
                  ) : isSubmitted ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Joined!
                    </>
                  ) : (
                    'Get Started Now'
                  )}
                </Button>
              </div>
              
              <p className="text-sm text-blue-100 text-center">
                🎁 Early access members get an additional <span className="font-bold text-white">$1 USD bonus</span> on launch day!
              </p>
            </form>

            {/* Trust indicators */}
            <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-white/20">
              <div className="text-center">
                <p className="text-2xl font-bold">12K+</p>
                <p className="text-sm text-blue-100">On Waitlist</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">Jan 2026</p>
                <p className="text-sm text-blue-100">Launch Date</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">100%</p>
                <p className="text-sm text-blue-100">Free Forever</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default WaitlistForm;
