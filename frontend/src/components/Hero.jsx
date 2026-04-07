import React, { useState } from 'react';
import { heroData, statsData } from '../data/mock';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ArrowRight, Sparkles } from 'lucide-react';

const Hero = ({ onGetStarted }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-left space-y-8">
            {/* Bonus Badge */}
            <Badge 
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 text-sm font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-300 hover:scale-105"
            >
              <Sparkles className="w-4 h-4" />
              Limited Time: {heroData.bonusAmount} Welcome Bonus
            </Badge>

            {/* Main Headline */}
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight text-gray-900">
              {heroData.headline.split('+')[0]}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600">
                + {heroData.headline.split('+')[1]}
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-gray-600 leading-relaxed">
              {heroData.subheadline}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                onClick={onGetStarted}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                {heroData.ctaText}
                <ArrowRight className={`ml-2 w-5 h-5 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
              </Button>
              
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 border-gray-300 text-gray-700 px-8 py-6 text-lg font-semibold hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300"
              >
                Watch Demo
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center gap-6 pt-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-green-400 border-2 border-white"></div>
                ))}
              </div>
              <div className="text-sm text-gray-600">
                <p className="font-semibold text-gray-900">50,000+ happy users</p>
                <p>earning daily from their phones</p>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl hover:shadow-3xl transition-shadow duration-500">
              <img 
                src={heroData.heroImage} 
                alt="Earn money from your phone" 
                className="w-full h-auto object-cover rounded-3xl transform hover:scale-105 transition-transform duration-700"
              />
              
              {/* Floating bonus card */}
              <div className="absolute bottom-8 left-8 right-8 bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-green-200 animate-float">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Your Welcome Bonus</p>
                    <p className="text-3xl font-bold text-green-600">{heroData.bonusAmount}</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Unlocks after 5 tasks</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 pt-12 border-t border-gray-200">
          {statsData.map((stat, index) => (
            <div key={index} className="text-center hover:transform hover:scale-110 transition-transform duration-300">
              <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600">
                {stat.value}
              </p>
              <p className="text-sm text-gray-600 mt-2 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
