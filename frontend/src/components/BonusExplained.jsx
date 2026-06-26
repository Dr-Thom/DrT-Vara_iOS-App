import React from 'react';
import { bonusDetails } from '../data/mock';
import { Zap, Shield, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from './ui/card';

const iconMap = {
  Zap,
  Shield,
  TrendingUp
};

const BonusExplained = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-green-50 via-emerald-50 to-blue-50" id="bonus">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
          {/* Left Content */}
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                {bonusDetails.title}
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                {bonusDetails.description}
              </p>
            </div>

            {/* Bonus Features */}
            <div className="space-y-6">
              {bonusDetails.features.map((feature, index) => {
                const Icon = iconMap[feature.icon];
                return (
                  <div 
                    key={index}
                    className="flex gap-4 items-start group hover:translate-x-2 transition-transform duration-300"
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl shadow-md flex items-center justify-center group-hover:shadow-lg transition-shadow duration-300">
                      <Icon className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Additional Benefits */}
            <Card className="border-2 border-green-200 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Why Our Bonus is Different
                </h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2 text-gray-700">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>$5 minimum cash-out — withdraw via GCash, PayPal, or Bank</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-700">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>$1 Bonus unlocks every 5 tasks · $10 Super Bonus every 25 tasks</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-700">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Real USD rewards — fully transparent earnings</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Right Visual */}
          <div className="relative">
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white overflow-hidden">
              <CardContent className="p-12 relative">
                {/* Decorative circles */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>
                
                <div className="relative z-10 text-center space-y-8">
                  <div className="inline-block p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
                    <Zap className="w-16 h-16 text-white" />
                  </div>
                  
                  <div>
                    <p className="text-white/90 text-lg mb-2">Your Welcome Bonus</p>
                    <p className="text-7xl font-bold mb-2">$1</p>
                    <p className="text-2xl font-semibold">USD</p>
                    <p className="text-3xl font-bold text-white/90 mt-3">+ $1 every 5 tasks · $10 every 25 tasks</p>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-white/20">
                    <div className="flex justify-between items-center">
                      <span className="text-white/90">Tasks Required:</span>
                      <span className="font-bold text-xl">5</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/90">Average Time:</span>
                      <span className="font-bold text-xl">5 mins</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/90">Withdrawal:</span>
                      <span className="font-bold text-xl">$5 min</span>
                    </div>
                  </div>

                  <div className="pt-6">
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                      <p className="text-sm text-white/90">
                        💡 <span className="font-semibold">Pro Tip:</span> Complete 5 tasks today and withdraw your bonus tomorrow!
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Floating stats */}
            <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-xl p-6 border border-gray-100 animate-float">
              <p className="text-sm text-gray-600 mb-1">Average first day earnings</p>
              <p className="text-3xl font-bold text-green-600">$44 USD</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BonusExplained;
