import React from 'react';
import { howItWorksSteps } from '../data/mock';
import { UserPlus, CheckSquare, Gift, DollarSign } from 'lucide-react';
import { Card, CardContent } from './ui/card';

const iconMap = {
  UserPlus,
  CheckSquare,
  Gift,
  DollarSign
};

const HowItWorks = () => {
  return (
    <section className="py-20 bg-white" id="how-it-works">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600">
            Start earning in 4 simple steps. It's easy, fast, and completely free.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {howItWorksSteps.map((step, index) => {
            const Icon = iconMap[step.icon];
            return (
              <Card 
                key={step.step}
                className="relative border-2 border-gray-100 hover:border-blue-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white group"
              >
                <CardContent className="p-6">
                  {/* Step Number */}
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                    {step.step}
                  </div>

                  {/* Icon */}
                  <div className="mt-6 mb-6 flex justify-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-10 h-10 text-blue-600" />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-center leading-relaxed">
                    {step.description}
                  </p>

                  {/* Connector Line (except last item) */}
                  {index < howItWorksSteps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-8 w-16 h-0.5 bg-gradient-to-r from-blue-300 to-transparent"></div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-lg text-gray-600 mb-4">
            Ready to start earning? Join thousands of users already making money.
          </p>
          
          {/* High-impact reassurance */}
          <div className="inline-block bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-xl px-8 py-4 mt-4">
            <p className="text-lg font-bold text-gray-900 flex items-center gap-2 justify-center">
              <span className="text-2xl">💡</span>
              Most users complete their first 5 tasks in under 30 minutes
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
