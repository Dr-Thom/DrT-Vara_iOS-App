import React from 'react';
import { socialLinks } from '../data/mock';
import { Facebook, Twitter, Instagram, Youtube, Mail, MapPin, Phone } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { label: 'How It Works', href: '#how-it-works' },
      { label: 'Pricing', href: '#' },
      { label: 'Features', href: '#' },
      { label: 'Testimonials', href: '#testimonials' }
    ],
    company: [
      { label: 'About Us', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Press Kit', href: '#' }
    ],
    support: [
      { label: 'Help Center', href: '#' },
      { label: 'FAQ', href: '#faq' },
      { label: 'Contact Us', href: '#' },
      { label: 'Report Issue', href: '#' }
    ],
    legal: [
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
      { label: 'Cookie Policy', href: '#' },
      { label: 'Disclaimer', href: '#' }
    ]
  };

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="text-2xl font-bold text-white mb-4">
              VARA
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Earn USD from your phone by completing simple tasks. Join thousands already making money daily.
            </p>
            <div className="flex gap-3">
              <a href={socialLinks.facebook} className="w-10 h-10 bg-gray-800 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors duration-300">
                <Facebook className="w-5 h-5" />
              </a>
              <a href={socialLinks.twitter} className="w-10 h-10 bg-gray-800 hover:bg-blue-400 rounded-full flex items-center justify-center transition-colors duration-300">
                <Twitter className="w-5 h-5" />
              </a>
              <a href={socialLinks.instagram} className="w-10 h-10 bg-gray-800 hover:bg-pink-600 rounded-full flex items-center justify-center transition-colors duration-300">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors duration-300">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-sm hover:text-blue-400 transition-colors duration-300">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-sm hover:text-blue-400 transition-colors duration-300">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-sm hover:text-blue-400 transition-colors duration-300">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm">
                <Mail className="w-4 h-4 mt-1 flex-shrink-0 text-blue-400" />
                <a href="mailto:support@vara.app" className="hover:text-blue-400 transition-colors duration-300">
                  support@vara.app
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Phone className="w-4 h-4 mt-1 flex-shrink-0 text-blue-400" />
                <span>+63 123 456 7890</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 mt-1 flex-shrink-0 text-blue-400" />
                <span>Manila, Philippines</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              © {currentYear} VARA. All rights reserved.
            </p>
            <div className="flex gap-6">
              {footerLinks.legal.map((link, index) => (
                <a 
                  key={index}
                  href={link.href} 
                  className="text-sm text-gray-400 hover:text-blue-400 transition-colors duration-300"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
