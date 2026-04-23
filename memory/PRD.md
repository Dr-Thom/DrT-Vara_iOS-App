# VARA Landing Page - Product Requirements Document

## Original Problem Statement
Build a landing page for VARA - an app where users can earn USD from their phone by completing simple tasks. The landing page must clearly showcase the $2 USD bonus offer and convert visitors into waitlist signups.

**Key Message:**
- Headline: "Earn $2 USD in 30 Minutes From Your Phone"
- Sub: "Complete 5 simple tasks. No experience needed. Withdraw instantly."

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

## What's Been Implemented

### ✅ Phase 1: Frontend Landing Page with Mock Data (Completed - Dec 7, 2025)
- All conversion-optimized sections (Hero, How It Works, Bonus, Social Proof, Waitlist, FAQ, Footer)
- Exit-intent popup with $3 bonus offer
- PHP currency conversions for Philippines market
- Mobile-responsive design
- All psychological triggers implemented

### 🔄 Phase 2: Backend Development (In Progress)

## Backend API Contracts

### 1. POST /api/waitlist
**Purpose:** Collect email addresses for waitlist signup

**Request:**
```json
{
  "email": "user@example.com",
  "source": "exit_popup" // optional: "main_form", "exit_popup", "hero_cta"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Successfully joined the waitlist!",
  "data": {
    "email": "user@example.com",
    "position": 12544,
    "bonusType": "standard" // "standard" ($2) or "early_access" ($3)
  }
}
```

**Response (Already Exists):**
```json
{
  "success": true,
  "message": "You're already on the waitlist!",
  "data": {
    "email": "user@example.com",
    "position": 12543
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Invalid email address",
  "error": "INVALID_EMAIL"
}
```

### 2. GET /api/waitlist/stats
**Purpose:** Get current waitlist statistics (for display on landing page)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSignups": 12543,
    "todaySignups": 234,
    "avgSignupsPerDay": 150
  }
}
```

### 3. GET /api/health
**Purpose:** Health check endpoint

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-07T10:30:00Z"
}
```

## Database Models

### WaitlistEntry
```python
{
  "_id": ObjectId,
  "email": String (unique, required),
  "source": String (optional: "main_form", "exit_popup", "hero_cta"),
  "bonusType": String ("standard" or "early_access"),
  "position": Integer,
  "createdAt": DateTime,
  "updatedAt": DateTime,
  "ipAddress": String (optional),
  "userAgent": String (optional)
}
```

### Indexes
- email: unique index
- createdAt: for sorting and analytics
- source: for conversion tracking

## Frontend-Backend Integration Plan

### Mock Data to Remove:
- `/app/frontend/src/data/mock.js` - Keep for hero/static content, remove for dynamic data

### Components to Update:
1. **WaitlistForm.jsx**
   - Replace mock API call with real POST /api/waitlist
   - Handle real success/error responses
   - Show actual waitlist position

2. **ExitIntentPopup.jsx**
   - Replace mock API call with real POST /api/waitlist
   - Pass source: "exit_popup"
   - Handle real responses

3. **Stats Display** (if we add dynamic stats)
   - Fetch from GET /api/waitlist/stats
   - Update in real-time

## Implementation Checklist

### Backend Tasks:
- [ ] Create WaitlistEntry MongoDB model
- [ ] Implement POST /api/waitlist endpoint
  - [ ] Email validation
  - [ ] Duplicate check
  - [ ] Position calculation
  - [ ] Database insertion
- [ ] Implement GET /api/waitlist/stats endpoint
- [ ] Implement GET /api/health endpoint
- [ ] Add error handling and logging
- [ ] Test all endpoints

### Frontend Integration:
- [ ] Update WaitlistForm to use real API
- [ ] Update ExitIntentPopup to use real API
- [ ] Add error handling UI
- [ ] Test form submissions
- [ ] Test error scenarios

### Testing:
- [ ] Test email validation
- [ ] Test duplicate email handling
- [ ] Test successful signup flow
- [ ] Test error scenarios
- [ ] Test from multiple devices
- [ ] Run testing_agent_v3 for full E2E testing

## Error Scenarios to Handle

1. **Invalid Email Format**
   - Show: "Please enter a valid email address"

2. **Duplicate Email**
   - Show: "You're already on the waitlist! Check your email for updates."

3. **Server Error**
   - Show: "Oops! Something went wrong. Please try again."

4. **Network Error**
   - Show: "Connection issue. Please check your internet and try again."

## Validation Rules

### Email Validation:
- Must contain @ symbol
- Must have valid domain
- Must not be a temporary/disposable email (optional)
- Max length: 255 characters

## Security Considerations

1. **Rate Limiting:** Prevent spam submissions (max 3 per IP per hour)
2. **CORS:** Already configured, verify it works
3. **Input Sanitization:** Clean email input
4. **SQL Injection:** Using MongoDB ORM prevents this
5. **XSS:** React handles this automatically

## Analytics to Track (Future)

- Signup source (main_form vs exit_popup)
- Conversion rate
- Time on page before signup
- Bounce rate
- Device type (mobile vs desktop)

## Next Steps After Backend

1. **Email Integration** (Phase 3)
   - Welcome email on signup
   - Email verification (optional)
   - Launch notification email

2. **Admin Dashboard** (Phase 4)
   - View all waitlist entries
   - Export to CSV
   - Analytics dashboard

3. **Launch Preparation** (Phase 5)
   - Domain setup
   - SSL certificate
   - Production deployment
   - Performance optimization

## Notes
- All mock data preserved for static content (testimonials, FAQ, features)
- Only dynamic data (waitlist) connected to backend
- Frontend already optimized for conversions
- Backend focused on data collection and validation


---

## 📱 Mobile App (React Native / Expo) — Updated Feb 2026

### Build Readiness (Feb 23, 2026)
- ✅ `/app/mobile/app.json` configured with correct splash path, adaptive icon, Google Mobile Ads plugin (android+iOS App IDs)
- ✅ `/app/mobile/eas.json` created with `preview` (APK) and `production` (AAB) build profiles
- ✅ Custom ADA-compliant app icon rendered to `icon.png` / `adaptive-icon.png` / `splash-icon.png` @ 1024x1024 PNG from `vara-icon-final.svg`
- ✅ Dependencies aligned with Expo SDK 54 (expo-doctor: 17/17 checks passing)
- ✅ Stale `package-lock.json` removed; `yarn.lock` is the single source of truth for EAS
- ✅ Backend `/api/auth/login`, `/api/auth/register`, `/api/auth/refresh` now return `access_token` + `refresh_token` in the response body (required for React Native, which can't read httpOnly cookies)
- ✅ Mobile `AuthContext` persists tokens to AsyncStorage on login/register
- ✅ Web auth (cookie-based) unchanged and still functional
- ✅ Access-token cookie max_age unified to 4 hours across login/register/refresh

### Current AdMob Config
- **Test IDs** in `/app/mobile/config.js` and `/app/mobile/app.json`
- Real IDs pending Google Support resolution of user's AdMob account country mismatch

### What Ships in the APK/AAB
- Login / Signup, Dashboard, Tasks ($0.10 each), Withdrawal ($5 min), $1 bonus at 10 tasks
- Banner ads on dashboard & tasks
- Rewarded video ads before task completion
- Interstitial ad every 3 tasks

### User Action Required
- Run from desktop: `eas login` → `eas init` → `eas build -p android --profile preview` (APK) → `eas build -p android --profile production` (AAB)
- Full instructions: `/app/MOBILE_APP_BUILD_INSTRUCTIONS.md`

### Backlog / Next Tasks
- **P0**: User runs EAS build commands on desktop, receives APK, installs, validates
- **P1**: User provides real AdMob IDs; update `config.js` + `app.json`, rebuild AAB
- **P1**: Google Play Developer account registration ($25)
- **P2**: Upload AAB to Play Store; use `/app/PLAY_STORE_LISTING.md` + `/app/PRIVACY_POLICY.md` + `icon.png` for listing
- **P2**: Post-launch analytics + revenue tracking


---

## 🔥 v2.1 — New Economy & Referral System (Feb 23, 2026)

Aligned web + mobile with user's expanded build spec:

### Updated Economics
- **Tasks**: $0.10 each (unchanged)
- **Bonus**: $1 at task #5 (first), then every 10 tasks after (#15, #25, #35…)
  - Was: $1 at 10 tasks (one-time)
- **Referral**: 10% of referred user's earnings, capped at $10 per referral (~first $100)
- **Withdrawal**: $5 minimum (unchanged)

### New Pages (Web)
- `/app/calculator` — Interactive earnings calculator (1–50 tasks/day slider × 1–7 days/week) with daily/weekly/monthly projections
- `/app/referrals` — User's referral code, shareable link (copy + native share), referral stats, recent payouts feed
- Signup page — optional referral code input with live validation (green check for valid, red for invalid); accepts `?ref=CODE` URL param

### New Pages (Mobile / React Native)
- `CalculatorScreen` — Same as web, with `@react-native-community/slider`
- `ReferralsScreen` — Code display, Share API + Clipboard copy, payout feed
- `SignupScreen` — Added referral_code field with live validation
- `DashboardScreen` — Redesigned with 4-stat grid (Balance, Tasks, Bonuses, Referrals) + progress bar toward next bonus

### New Backend Endpoints
- `POST /api/auth/register` — now accepts optional `referral_code`, generates unique `referral_code` for new user, increments referrer's `referred_count`
- `GET /api/referrals/me` (auth) — returns referral code, stats, recent payouts with masked emails
- `GET /api/referrals/validate/{code}` (public) — live code validation for signup form
- `GET /api/stats/total-paid-out` (public) — trust counter (sum of completed withdrawals + optional `TOTAL_PAID_OUT_BASE` env seed)
- `GET /api/stats/recent-withdrawals?limit=N` (public) — social proof feed with masked emails

### Data Model Changes
- `users` collection new fields: `referral_code` (unique), `referred_by` (code), `referred_by_user_id`, `referral_earnings`, `referred_count`, `referrer_earnings_paid` (for cap enforcement), `bonuses_earned`
- New collection: `referral_payouts` (ledger) — referrer_user_id, referred_user_id, referred_email, amount, triggered_by_earned, created_at

### Token Changes
- `POST /api/auth/login`, `/register`, `/refresh` now return `access_token` + `refresh_token` in body (mobile support) AND set httpOnly cookies (web)
- Web auth flow unchanged; mobile clients save tokens to AsyncStorage

### Testing Status
- **Backend**: 18/18 pytest tests pass (bonus math, referral cap, token flows, stats endpoints)
- **Frontend (web)**: 7/7 flows pass (login, dashboard, calculator sliders, referrals page, signup with ref code, trust feed)
- **Mobile**: Code complete, lint clean, expo-doctor 17/17 — not tested in emulator (requires EAS build)

### Known Issues / Non-Bugs
- Admin user's `bonuses_earned=0` despite 8 completed tasks (seeded pre-field). New users track correctly. Not affecting users.
- `/api/stats/recent-withdrawals` does N+1 user lookups — acceptable at current scale

### Next Tasks
- **P0**: User pushes to GitHub + runs EAS build on desktop
- **P1**: Replace AdMob test IDs once user's Google account country issue is resolved
- **P1**: Landing page copy update ($2 bonus → new economics messaging) — deferred, minor
- **P2**: Play Store submission


---

## 🏆 v2.2 — Leaderboard + Copy Alignment (Feb 23, 2026)

### Added
- **Referral leaderboard** on `/app/referrals` page (web + mobile):
  - Top 10 referrers by earnings with Month / All-time toggle
  - Crown (rank 1), silver/bronze medals (2/3), YOU badge on own row
  - If user is outside top 10, their rank shown separately below
  - Backend: `GET /api/referrals/leaderboard?period=month|all&limit=N` (auth required, max limit 50)
  - Data source: aggregation over `referral_payouts` collection

### Copy Updates ($2 → $1 economics alignment)
- Landing: Header badge, Hero headline + CTA, BonusExplained, WaitlistForm, mock.js (hero, FAQ, testimonials, task earnings)
- App: Tasks page bonus unlock message, Dashboard welcome copy
- Mobile: SignupScreen bonus badge, TasksScreen, LoginScreen
- ExitIntentPopup intentionally kept as "$2 first bonus" (2× waitlist boost) — upgraded from "$3 vs $2"

### Testing
- Backend: 26/26 pytest tests pass (8 new leaderboard + 18 regression)
- Frontend: Initial render bug caught by testing agent (missing Trophy/Crown/Medal imports + state hooks) — fixed inside iteration. Verified working: admin rank 1 with Crown + YOU badge, masked email, 7 friends, $1.23 earned. Month/All-time toggle works.
