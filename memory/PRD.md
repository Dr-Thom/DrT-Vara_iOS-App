# VARA Landing Page - Product Requirements Document

## Original Problem Statement
Build a landing page for VARA - an app where users can earn USD from their phone by completing simple tasks. The landing page must clearly showcase the $2 USD bonus offer and convert visitors into waitlist signups.

**Key Message:**
- Headline: "Earn USD From Your Phone + Unlock a $2 USD Bonus"
- Sub: "Complete simple tasks and unlock your $2 USD reward after your first 5 tasks"

**Target Audience:** Phase 1 - Philippines

## User Personas
1. **Maria (Mobile Earner)**
   - Age: 25-35
   - Looking for legitimate ways to earn extra income from phone
   - Values trust and quick payouts
   - Needs: Simple tasks, fast payments, clear earning potential

2. **Juan (Side Hustler)**
   - Age: 20-30
   - Wants flexible earning opportunities
   - Tech-savvy, uses mobile apps daily
   - Needs: Transparency, good user experience, immediate rewards

## Core Requirements (Static)
### Design Requirements
- Trustworthy vibe with modern gradient style and animations
- Conversion-optimized layout with psychological triggers
- Mobile-responsive design
- Agency-quality aesthetics ($20,000+ level)
- Light gradients only (following 80/20 rule - max 20% gradient coverage)
- No dark purple/pink gradients
- Micro-animations on all interactions

### Required Sections
1. ✅ Hero Section (with $2 bonus prominently displayed above the fold)
2. ✅ How It Works (4-step process)
3. ✅ Bonus Explanation (detailed breakdown)
4. ✅ Social Proof (testimonials with real earnings)
5. ✅ Email Waitlist Form
6. ✅ App Store Badges Section (Coming Soon - Jan 2026)
7. ✅ FAQ Section
8. ✅ Footer with links and contact info

### Technical Requirements
- React frontend with Shadcn UI components
- Mock data implementation (frontend-only for phase 1)
- Smooth scroll behavior
- Toast notifications for form submissions
- Fixed header with navigation

## What's Been Implemented (December 2025)

### ✅ Phase 1: Frontend Landing Page with Mock Data (Completed)

**Date: December 7, 2025**

#### Components Created:
1. **Header.jsx** - Fixed navigation with smooth scroll to sections
2. **Hero.jsx** - Main hero section with animated background, bonus badge, CTA buttons, and floating bonus card
3. **HowItWorks.jsx** - 4-step process cards with icons and animations
4. **BonusExplained.jsx** - Detailed bonus breakdown with visual card and feature list
5. **SocialProof.jsx** - 3 testimonial cards with user avatars, ratings, and total earnings
6. **WaitlistForm.jsx** - Email capture form with success states and toast notifications
7. **AppStoreSection.jsx** - App store buttons (disabled, coming soon)
8. **FAQ.jsx** - Accordion-style FAQ using Shadcn accordion component
9. **Footer.jsx** - Complete footer with links, social icons, and contact info

#### Data Layer:
- **mock.js** - All mock data including hero content, stats, testimonials, FAQ, task types

#### Styling:
- Custom animations: blob, float
- Inter font family (Google Fonts)
- Smooth transitions on all interactive elements
- Mobile-responsive breakpoints
- Blue/Green color scheme for trust (avoiding prohibited gradients)

#### Features:
- Smooth scroll navigation
- Toast notifications (using Sonner)
- Hover animations and micro-interactions
- Mobile hamburger menu
- Form validation
- Responsive grid layouts (proper 2x2, 3x1 layouts)

#### Images Used:
- Hero: Mobile earning image from Unsplash
- Testimonials: 3 diverse user photos
- All images optimized and relevant to Philippines market

## Prioritized Backlog

### P0 Features (Must Have - Next Phase)
- [ ] Backend API setup (FastAPI)
- [ ] MongoDB database models
- [ ] Email collection API endpoint
- [ ] Email service integration (SendGrid/MailChimp)
- [ ] Analytics tracking (Google Analytics/Mixpanel)

### P1 Features (Should Have)
- [ ] Contact form functionality
- [ ] Admin dashboard for waitlist management
- [ ] Email notification system for waitlist users
- [ ] Social media sharing functionality
- [ ] SEO optimization (meta tags, Open Graph)
- [ ] Performance optimization (lazy loading images)

### P2 Features (Nice to Have)
- [ ] Multi-language support (English/Tagalog)
- [ ] A/B testing for different messaging
- [ ] Video explainer section
- [ ] Live chat support widget
- [ ] Blog section for content marketing
- [ ] Referral program landing page

## Next Action Items

### Immediate Next Steps:
1. **User Review & Feedback** - Get user approval on current design and functionality
2. **Backend Development** (if approved):
   - Create waitlist email collection API
   - Set up MongoDB model for email storage
   - Integrate email service provider
   - Add basic analytics tracking
3. **Testing** - Run full testing suite once backend is added
4. **SEO Setup** - Add meta tags, sitemap, robots.txt
5. **Launch Preparation** - Domain setup, hosting configuration

### Enhancement Opportunities:
- **Conversion Boost**: Add exit-intent popup with special early bird bonus ($3 instead of $2)
- **Social Proof**: Display live counter of waitlist signups to create FOMO
- **Trust Building**: Add "As Featured In" section with media logos
- **Engagement**: Add countdown timer to launch date

## API Contracts (For Future Backend)

### POST /api/waitlist
**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully joined waitlist",
  "position": 12543
}
```

### GET /api/stats
**Response:**
```json
{
  "totalUsers": 50000,
  "totalEarned": "$500K+",
  "tasksCompleted": "1M+",
  "avgRating": 4.8,
  "waitlistCount": 12543
}
```

## Notes
- Frontend is fully functional with mock data
- All interactive elements working (navigation, forms, animations)
- Mobile-responsive and tested on multiple screen sizes
- Ready for backend integration
- Design follows all specified guidelines (no dark gradients, trustworthy colors, modern animations)
