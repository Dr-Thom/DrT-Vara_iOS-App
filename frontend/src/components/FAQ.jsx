import React from 'react';
import { faqData } from '../data/mock';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';

const FAQ = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50" id="faq">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600">
            Everything you need to know about VARA and earning your bonus
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqData.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-white border-2 border-gray-100 rounded-xl px-6 hover:border-blue-300 transition-colors duration-300"
              >
                <AccordionTrigger className="text-left text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors duration-300 py-6">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-700 leading-relaxed pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Still have questions CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            Still have questions? We're here to help!
          </p>
          <a 
            href="mailto:support@vara.app" 
            className="text-blue-600 hover:text-blue-700 font-semibold text-lg hover:underline transition-all duration-300"
          >
            Contact Support →
          </a>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
