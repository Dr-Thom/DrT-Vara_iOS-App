import React from 'react';
import { appStoreLinks, socialLinks } from '../data/mock';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Apple, PlaySquare } from 'lucide-react';

const AppStoreSection = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
            
            <div className="relative z-10 text-center space-y-8">
              {/* Coming Soon Badge */}
              {appStoreLinks.comingSoon && (
                <Badge className="inline-flex px-4 py-2 bg-green-500 text-white border-0 text-sm font-semibold">
                  Coming Soon - May 2026
                </Badge>
              )}

              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Download VARA & Start Earning
                </h2>
                <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                  Available on iOS and Android. Join the waitlist to be notified when we launch!
                </p>
              </div>

              {/* App Store Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  size="lg"
                  disabled={appStoreLinks.comingSoon}
                  className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-6 text-lg font-semibold flex items-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed min-w-[200px]"
                >
                  <Apple className="w-6 h-6" />
                  <div className="text-left">
                    <div className="text-xs">Download on the</div>
                    <div className="text-base font-bold">App Store</div>
                  </div>
                </Button>

                <Button
                  size="lg"
                  disabled={appStoreLinks.comingSoon}
                  className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-6 text-lg font-semibold flex items-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed min-w-[200px]"
                >
                  <PlaySquare className="w-6 h-6" />
                  <div className="text-left">
                    <div className="text-xs">Get it on</div>
                    <div className="text-base font-bold">Google Play</div>
                  </div>
                </Button>
              </div>

              {/* Feature highlights */}
              <div className="grid md:grid-cols-3 gap-6 pt-8 border-t border-white/20">
                <div>
                  <p className="text-3xl font-bold mb-1">Free</p>
                  <p className="text-sm text-blue-100">No hidden costs</p>
                </div>
                <div>
                  <p className="text-3xl font-bold mb-1">10MB</p>
                  <p className="text-sm text-blue-100">Small app size</p>
                </div>
                <div>
                  <p className="text-3xl font-bold mb-1">4.8★</p>
                  <p className="text-sm text-blue-100">Highly rated</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppStoreSection;
