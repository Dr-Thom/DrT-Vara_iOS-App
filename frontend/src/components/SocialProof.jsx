import React from 'react';
import { testimonials } from '../data/mock';
import { Card, CardContent } from './ui/card';
import { Star, TrendingUp } from 'lucide-react';

const SocialProof = () => {
  return (
    <section className="py-20 bg-white" id="testimonials">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Real People, Real Earnings
          </h2>
          <p className="text-xl text-gray-600">
            Join thousands of Filipinos already earning USD from their phones
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {testimonials.map((testimonial) => (
            <Card 
              key={testimonial.id}
              className="border-2 border-gray-100 hover:border-blue-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white"
            >
              <CardContent className="p-6">
                {/* Rating Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Comment */}
                <p className="text-gray-700 leading-relaxed mb-6 italic">
                  "{testimonial.comment}"
                </p>

                {/* User Info */}
                <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-green-400 flex-shrink-0">
                    <img 
                      src={testimonial.avatar} 
                      alt={testimonial.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.location}</p>
                  </div>
                </div>

                {/* Earnings Badge */}
                <div className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-2 rounded-full border border-green-200">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-700">
                    Total Earned: {testimonial.earnings}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">98%</div>
            <div className="text-sm text-gray-600">Satisfaction Rate</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">24h</div>
            <div className="text-sm text-gray-600">Avg. Payout Time</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">50K+</div>
            <div className="text-sm text-gray-600">Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">4.8★</div>
            <div className="text-sm text-gray-600">App Rating</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
