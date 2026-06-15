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
### 🛠 Mobile Build Fix (May 4, 2026) — OTA Update Crash
- Problem: APK launched with red `Uncaught Error: java.io.IOException: Failed to download remote update`. The OTA fetch was failing because no JS bundle was published to the `preview` channel.
- Fix: Disabled Expo OTA in `/app/mobile/app.json` (`updates.enabled: false`, `checkAutomatically: NEVER`, `runtimeVersion.policy: appVersion`). Bundle is now fully embedded in the APK.
- Bumped `version` to `1.0.1` and Android `versionCode` to `2` so the new APK installs cleanly over the old one.
- Right call for VARA's target regions (developing markets) — APK now opens instantly, offline-safe.

### 🛠 Mobile Crash Fix (May 4, 2026) — Missing ProgressionStrip Import
- Problem: APK launched, login worked, then Dashboard crashed with `ReferenceError: Property 'ProgressionStrip' doesn't exist`.
- Fix: Added missing `import ProgressionStrip from '../components/ProgressionStrip'` in `screens/DashboardScreen.js`.
- Bumped to `1.0.2` (versionCode 3). User confirmed dashboard fully renders with Trust/Streak/Next bonus cards + Weekly Super Bonus + balance.

### 🚀 Push Notifications (May 4, 2026) — All 5 Notification Types Wired
- Mobile: `expo-notifications` + `expo-device` installed (SDK 54-compatible versions). New `services/notifications.js` handles permissions, token registration, foreground banners, and tap-to-deep-link routing (`vara://tasks`, `vara://referrals`, etc.).
- AuthContext registers token on login + on app open; unregisters on logout.
- Backend: New `utils/push.py` (httpx + Expo Push API, batched ≤100, auto-cleans stale `DeviceNotRegistered` tokens). New `utils/notification_scheduler.py` (APScheduler hourly streak job that respects user's IANA `timezone`, Monday 9am UTC weekly super-bonus blast). Endpoints: `POST /api/users/push-token` (validates `ExponentPushToken[…]` format), `DELETE /api/users/push-token`.
- Triggers wired in: bonus unlock (in `tasks.py`), referral payout (in `tasks.py` `pay_referrer`), withdrawal approved/pending (in `withdrawal.py`), daily streak reminder (scheduler), weekly super bonus (scheduler).
- Firebase setup completed by user. FCM service account uploaded to EAS. Permission popup wired with `POST_NOTIFICATIONS` permission + `extra.eas.projectId` in app.json.

### 🏷️ Rebrand VARA → SAMSON (May 30, 2026)
- All user-facing strings changed: app name (app.json), dashboard header (App.js), login/signup logos, calculator, referrals share text, network error messages, notification channel name.
- App icon redesigned in SVG (`assets/samson-icon.svg`) — same shield, three yellow stars, deep blue background; replaced "VARA: USD" ribbon with "SAMSON: USD"; removed the green chart line.
- All 4 PNG assets regenerated via cairosvg at 1024x1024 (icon.png, adaptive-icon.png, splash-icon.png, favicon.png).
- Internal Android package stays `com.vara.app` (changing would invalidate Firebase + AdMob + EAS keystore — purely display rebrand).
- Bumped to v1.0.7 / versionCode 8. User confirmed install on Android: SAMSON name + new icon (no green) ✅.

### 🌐 Production Backend Deployment (June 15, 2026) — Render + MongoDB Atlas
- Goal: Move backend off transient Emergent preview URL onto a stable production host before public Play Store launch.
- **Database**: Created free-tier MongoDB Atlas cluster `Samson-prod` (qrjbiyl.mongodb.net). DB name `samson_prod`. IP allowlist set to `0.0.0.0/0` for Render's dynamic outbound IPs.
- **Backend Host**: Deployed FastAPI app to Render Free tier as `drt-vara-ios-app` Web Service from GitHub `Dr-Thom/DrT-Vara_iOS-App` (root dir `backend/`, branch `main`).
  - **Live URL**: https://drt-vara-ios-app.onrender.com
  - Build Command: `pip install -r requirements.txt`
  - Start Command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
  - Env: `PYTHON_VERSION=3.11.9`, `MONGO_URL`, `DB_NAME=samson_prod`, `JWT_SECRET`, `CORS_ORIGINS=*`
- **Slim requirements.txt** (13 packages) — created `/app/backend/requirements.dev.txt` as backup of the full freeze. Production now only ships fastapi/uvicorn/motor/pymongo/pydantic/bcrypt/pyjwt/httpx/apscheduler/pytz/python-dotenv/email-validator/python-multipart. Avoids `emergentintegrations`, `cairocffi`, `google-genai` which broke Render builds.
- **Issues solved during deploy**: GitHub repo access (user re-authorized Render in GitHub OAuth), case-sensitive root dir (`Backend` → `backend`), heavy dev deps failing pip build, Python 3.14 default → pinned 3.11.9 via PYTHON_VERSION env var, pre-deploy command leftover from paid tier defaults (auto-removed on Free instance switch), Atlas IP allowlist (0.0.0.0/0), Start Command typo (`gunicorn server.app` → `uvicorn server:app`).
- **Verified live**: `GET /api/health` → connected ✅, `POST /api/auth/login` admin → returns JWT ✅, `GET /privacy` + `/terms` → 200 OK ✅. Production admin referral code: `7NH6D382`.
- **Mobile config updated**: `/app/mobile/config.js` BACKEND_URL → `https://drt-vara-ios-app.onrender.com`. User must run `eas build -p android --profile preview` to bake the production URL into the next APK/AAB.


### 📄 Privacy + Terms pages (May 30, 2026)
- New `/app/backend/routes/legal.py` serves HTML pages at:
  - `https://vara-landing-v1.preview.emergentagent.com/privacy`
  - `https://vara-landing-v1.preview.emergentagent.com/terms`
- Required by Google Play submission. Pages branded as SAMSON, cover all required disclosures (data collection, AdMob, push tokens, retention, user rights, contact).

### 🚀 Google Play Internal Testing Setup (Jun 8, 2026 — IN PROGRESS)
- App created in Play Console: "SAMSON: Earn Cash for Tasks"
- Internal Testing track set up with 8 testers
- Privacy policy URL ready: `/privacy`
- Listing copy drafted (title, short desc, full desc, content rating, target audience 18+)
- Waiting on: production AAB build (`eas build -p android --profile production`) to upload
- After AAB upload: Save and publish → Google emails opt-in link to testers → install from Play Store within ~5 min.

### 💰 AdMob Re-integration (May 19, 2026) — Banner + Interstitial + Rewarded
- Reinstalled `react-native-google-mobile-ads@^16.3.3` (SDK 54-compatible). App.json plugin block with TEST `androidAppId` / `iosAppId` (`ca-app-pub-3940256099942544~3347511713`) — swap to real AdMob IDs when account is set up.
- `components/AdBanner.js` — anchored adaptive banner using `BannerAdSize.ANCHORED_ADAPTIVE_BANNER` + Google's TEST ad unit IDs (no fill risk, no policy violations).
- `contexts/AdContext.js` — full provider with: SDK initialization, preloaded interstitial (auto-shown every 3 tasks via `trackTaskCompletion()`), preloaded rewarded ad (`showRewardedAd()` resolves `{success, amount, type}` only on `EARNED_REWARD`; gracefully handles closed_early / errors / not_loaded).
- Dashboard: New "📺 Watch ad → Earn $0.05" CTA button. Disabled until rewarded ad is loaded.
- Backend: `POST /api/users/ad-reward` credits $0.05, enforces 20/day cap and 25s throttle, writes to `ad_rewards` audit ledger. Tested live ✅.
- App version bumped to **1.0.5 / versionCode 6** for next EAS build.



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

---

## 🚀 v2.3 — Weekly Super Bonus Challenge (Feb 23, 2026)

### Added
- **Weekly $5 Super Bonus**: Referrers get $5 when 3 distinct friends each complete ≥1 earning task in the same UTC calendar week (Mon 00:00 – Sun 23:59)
- Backend: `utils/weekly_challenge.py` handles atomic dedup ($addToSet) + single-shot $5 credit (guarded update)
- Backend: `GET /api/referrals/challenge` returns progress + deadline
- `pay_referrer()` now records qualifying referral after payout (wrapped in try/except so failures never block task complete)
- `super_bonuses_earned` counter added to user doc
- New collection: `weekly_referral_challenges` (referrer_user_id, week_start, qualified_referreds, super_bonus_paid)

### UI (web + mobile)
- New `SuperBonusChallenge` component on `/app/referrals` and `/app/dashboard`
- Progress bar 0/3 → 3/3, countdown pill "Resets in Xd Yh"
- State toggles: purple/rocket (active) ↔ green/checkmark (unlocked)

### Testing
- Backend: 33/33 pytest tests pass (7 new challenge + 26 regression)
- Frontend: Admin shows completed state on both pages, progress 3/3, no countdown (correctly hidden), no console errors
- Idempotency + concurrency: atomic $set-if-not-paid guarantees single payout even under race conditions
- Dedup: same friend completing multiple tasks counts as 1 qualifier

### Smoke test result
Admin balance went $5.88 → $10.91 after 3 fresh friends completed 1 task each. Delta = $5.03 (3×$0.01 referral + $5.00 super bonus) ✓

- Frontend: Initial render bug caught by testing agent (missing Trophy/Crown/Medal imports + state hooks) — fixed inside iteration. Verified working: admin rank 1 with Crown + YOU badge, masked email, 7 friends, $1.23 earned. Month/All-time toggle works.


---

## 🧠 v2.4 — Bonus Ladder + Trust Score + Daily Streak (Feb 24, 2026)

Aligned VARA with the user's 4-engine architecture spec (Phase 1 → Phase 2 retention layer).

### Updated Bonus Ladder
Replaces `$1@5, $1 every 10` with explicit milestones:
| Tasks | Bonus |
|-------|-------|
| 5 | $1 |
| 10 | $2 |
| 25 | $5 |
| 50 | $10 |
| 100 | $25 |
| +100 | +$25 repeating |

Source of truth: `/app/backend/utils/economics.py` (`total_bonuses_earned`, `bonus_awarded_for_completion`, `next_bonus_milestone`).

### Daily Streak System
- `current_streak`, `longest_streak`, `last_active_date` on user
- Incremented when user completes a task on a new UTC date; reset to 1 on gap
- **Multiplier tiers** applied to base task reward only (NOT milestone bonuses):
  - 3 days → 1.1×
  - 7 days → 1.25× (+5 trust one-time)
  - 14 days → 1.5×
- Logic in `/app/backend/utils/streak.py`

### Trust Score System
- Starts at **50**, range [0, 100]
- Positive events: +1/task, +5 crossing 7-day streak, +2 per successful withdrawal
- Negative events (hooks defined, not yet applied): −10 failed withdrawal, −20 fraud flag
- **Tiers gate withdrawals**:
  - Low (0-49): 48h hold, $10/24h cap
  - Building (50-74): 24h hold, $25/24h cap
  - Trusted (75+): Instant, $100/24h cap
- Logic in `/app/backend/utils/trust.py`

### New Endpoint
`GET /api/users/me/stats` returns `{trust, streak, bonuses}` — used by frontend ProgressionStrip

### UI
- **Web**: New `ProgressionStrip` component (3 cards: Trust 📊, Streak 🔥, Next Milestone 🎯) at top of Dashboard
- **Web**: Withdrawal page now shows trust-tier info card with delay + daily cap
- **Mobile**: Mirror component `/app/mobile/components/ProgressionStrip.js` wired into DashboardScreen
- Bonus progress bar header updated to show next dollar amount ("Progress to Next $2 Milestone")

### Testing
- Backend: **51/51 pytest pass** (18 new iter7 tests + 33 regression)
- Frontend: After testing agent fixed 2 missing imports in Dashboard.jsx (my search_replace didn't apply), all 3 progression cards render with live API data and 0 console errors
- Bonus math verified exact: task #5 → $1.10 reward, task #10 → $2.10 reward, total $4.00 after 10 fresh tasks
- Streak verified: same-day no-increment, 3-day gap resets to 1, multiplier correctly applied
- Tier gating verified: building tier $20 + $10 request blocked with "Daily cap $25" message

### Architecture Progress (vs user's spec)
Phase 1 (Bare Minimum) ✅ Task feed, wallet, basic bonus, simple referrals
Phase 2 (Optimization Layer) — **partial**:
- ✅ Trust scoring
- ✅ Streak retention loop
- ⏳ Task ranking engine (next)
- ⏳ User segmentation
- ⏳ Ad mediation
Phase 3 (Scale Layer) — not started (offerwalls, AI matching, dynamic pricing)

### Backlog for Next Round
- **P1** Task ranking engine (score = revenue×0.4 + completion×0.3 + retention×0.2 − fraud×0.3) per user
- **P1** User segmentation (new → easy tasks + high ad freq, active → balanced, trusted → premium offers)
- **P2** Admin KPI dashboard (DAU, retention D1/D7, fraud rate)
- **P2** Fraud signal detection (VPN, multi-account fingerprint)
- **P2** Make /api/auth/refresh return trust/streak (currently only /me does)
- **P3** Offerwall integration, ad mediation, dynamic pricing
