"""Public legal pages (privacy policy, terms) — required by Play Store/App Store."""
from fastapi import APIRouter
from fastapi.responses import HTMLResponse

router = APIRouter(tags=["legal"])

PRIVACY_HTML = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>SAMSON — Privacy Policy</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
           max-width: 760px; margin: 0 auto; padding: 32px 24px; color: #1f2937; line-height: 1.6; }
    h1 { color: #1E3A8A; margin-bottom: 4px; }
    h2 { color: #1E3A8A; margin-top: 32px; border-bottom: 2px solid #E5E7EB; padding-bottom: 4px; }
    .meta { color: #6B7280; font-size: 14px; margin-bottom: 24px; }
    code { background: #F3F4F6; padding: 2px 6px; border-radius: 4px; }
    a { color: #2563EB; }
  </style>
</head>
<body>
  <h1>SAMSON Privacy Policy</h1>
  <div class="meta">Last updated: May 30, 2026</div>

  <p>This Privacy Policy describes how SAMSON ("we", "us", "our") collects, uses, and protects
     information when you use our mobile application and related services (the "Service").</p>

  <h2>1. Information We Collect</h2>
  <ul>
    <li><strong>Account information</strong> — email address and a securely hashed password.</li>
    <li><strong>Profile data</strong> — display name, referral code, country/timezone, optional language preference.</li>
    <li><strong>Earnings activity</strong> — tasks completed, bonuses earned, ads watched, withdrawals
        requested, referrals made. We use this to operate the rewards system and detect fraud.</li>
    <li><strong>Device data</strong> — Android/iOS version, app version, device push token (Expo/FCM) for sending notifications.</li>
    <li><strong>Advertising identifiers</strong> — Google Advertising ID via Google Mobile Ads SDK, used solely
        to serve ads and prevent fraud. You may reset this ID in your device settings at any time.</li>
  </ul>

  <h2>2. How We Use Your Information</h2>
  <ul>
    <li>Operate your account, credit earnings, process withdrawals, and pay referral commissions.</li>
    <li>Send transactional and re-engagement notifications (you can disable notifications in your device settings).</li>
    <li>Show ads through Google AdMob in accordance with their policies.</li>
    <li>Detect and prevent abuse, multi-accounting, and fraudulent activity.</li>
    <li>Comply with legal obligations.</li>
  </ul>

  <h2>3. Sharing of Information</h2>
  <p>We do not sell your personal information. We share data only with:</p>
  <ul>
    <li><strong>Google AdMob</strong> — to deliver ads. <a href="https://policies.google.com/technologies/ads" target="_blank">AdMob policy</a>.</li>
    <li><strong>Firebase / Expo Push</strong> — to deliver push notifications.</li>
    <li><strong>Service providers</strong> — cloud hosting, fraud detection — strictly bound by confidentiality.</li>
    <li><strong>Authorities</strong> — when required by law or to protect the safety of users.</li>
  </ul>

  <h2>4. Data Retention</h2>
  <p>We keep your account data as long as your account is active and for up to 24 months after closure for
     audit and anti-fraud purposes. You may request deletion at any time via the contact below.</p>

  <h2>5. Your Rights</h2>
  <ul>
    <li>Access, correct, or delete your personal information.</li>
    <li>Export your earnings history.</li>
    <li>Opt out of personalized advertising (device settings → Reset Advertising ID).</li>
    <li>Withdraw consent to processing where applicable.</li>
  </ul>
  <p>To exercise these rights, email <a href="mailto:support@varaplatforms.com">support@varaplatforms.com</a>.</p>

  <h2>6. Security</h2>
  <p>We use industry-standard JWT authentication, bcrypt password hashing, encrypted transport (HTTPS), and
     least-privilege access controls for our systems.</p>

  <h2>7. Children</h2>
  <p>SAMSON is intended for users 18 years and older. We do not knowingly collect data from anyone under 18.</p>

  <h2>8. International Users</h2>
  <p>Your data is processed in the United States. By using the Service, you consent to this transfer.</p>

  <h2>9. Changes to This Policy</h2>
  <p>We may update this policy occasionally. Material changes will be communicated in-app or via email.</p>

  <h2>10. Contact</h2>
  <p>Questions? Email <a href="mailto:support@varaplatforms.com">support@varaplatforms.com</a>.</p>
</body>
</html>"""

TERMS_HTML = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>SAMSON — Terms of Service</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
           max-width: 760px; margin: 0 auto; padding: 32px 24px; color: #1f2937; line-height: 1.6; }
    h1 { color: #1E3A8A; margin-bottom: 4px; }
    h2 { color: #1E3A8A; margin-top: 32px; border-bottom: 2px solid #E5E7EB; padding-bottom: 4px; }
    .meta { color: #6B7280; font-size: 14px; margin-bottom: 24px; }
    a { color: #2563EB; }
  </style>
</head>
<body>
  <h1>SAMSON Terms of Service</h1>
  <div class="meta">Last updated: May 30, 2026</div>

  <h2>1. Eligibility</h2>
  <p>You must be at least 18 years old and able to enter into a binding contract to use SAMSON.
     You agree to provide accurate registration information and to use one account per person.</p>

  <h2>2. Earnings & Rewards</h2>
  <ul>
    <li>Task rewards, bonuses, streak multipliers, and referral commissions are credited to your in-app balance.</li>
    <li>The minimum withdrawal threshold is $5.00 USD. Higher trust scores unlock faster payouts and larger limits.</li>
    <li>We reserve the right to reverse credits obtained through fraud, abuse, or duplicate accounts.</li>
  </ul>

  <h2>3. Prohibited Conduct</h2>
  <ul>
    <li>Creating multiple accounts.</li>
    <li>Using bots, scripts, emulators, click farms, or other automation.</li>
    <li>Manipulating the referral system.</li>
    <li>Attempting to interfere with ads, the trust system, or anti-fraud measures.</li>
  </ul>
  <p>Violation results in immediate forfeiture of balance and account termination.</p>

  <h2>4. Withdrawals</h2>
  <p>Withdrawals are processed within the time window indicated by your trust tier (0h, 24h, or 48h).
     You are responsible for any local taxes on amounts you earn.</p>

  <h2>5. Advertising</h2>
  <p>SAMSON shows ads via Google AdMob. By using the app, you consent to seeing ads and to AdMob's
     processing as described in our Privacy Policy.</p>

  <h2>6. Disclaimer</h2>
  <p>SAMSON is provided "as is." We do not guarantee a specific amount of earnings — actual earnings depend on
     task availability, ad fill rates, and your activity. We may modify rewards, tasks, and features at any time.</p>

  <h2>7. Limitation of Liability</h2>
  <p>To the maximum extent permitted by law, SAMSON's total liability to you for any claim is limited to
     the lesser of your unpaid balance or US $50.</p>

  <h2>8. Termination</h2>
  <p>You may close your account at any time. We may suspend or terminate accounts for violations of these terms.</p>

  <h2>9. Governing Law</h2>
  <p>These Terms are governed by the laws of the United States.</p>

  <h2>10. Contact</h2>
  <p>Questions? Email <a href="mailto:support@varaplatforms.com">support@varaplatforms.com</a>.</p>
</body>
</html>"""


@router.get("/privacy", response_class=HTMLResponse)
async def privacy_policy():
    return HTMLResponse(content=PRIVACY_HTML)


@router.get("/terms", response_class=HTMLResponse)
async def terms_of_service():
    return HTMLResponse(content=TERMS_HTML)
