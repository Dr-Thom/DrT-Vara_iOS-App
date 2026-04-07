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
