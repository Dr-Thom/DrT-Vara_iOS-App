# 🚀 VARA — EAS Build Guide (Android APK + AAB)

Everything in `/app/mobile/` is now **100% build-ready**. You just need to run 4 commands from a desktop with Node.js installed.

---

## ✅ Pre-flight Checklist (Already Done For You)

- ✅ Custom ADA-compliant app icon baked into `/app/mobile/assets/icon.png`, `adaptive-icon.png`, `splash-icon.png`
- ✅ `eas.json` created with `preview` (APK) + `production` (AAB) profiles
- ✅ `app.json` fixed (correct splash path, Google Mobile Ads plugin configured)
- ✅ Package versions aligned with Expo SDK 54 (expo-doctor: 17/17 passing)
- ✅ Backend auth now returns tokens in the response body (required for React Native)
- ✅ `AuthContext` saves `accessToken` / `refreshToken` to AsyncStorage
- ✅ Stale `package-lock.json` removed (EAS will use `yarn.lock`)

---

## 🖥️ What You Need on Your Desktop

1. **Node.js 18+** → https://nodejs.org/
2. **Git** → https://git-scm.com/
3. **An Expo account** (free) → https://expo.dev/signup

---

## 📦 Step 1 — Get the code onto your desktop

From Emergent chat, click **"Save to GitHub"** to push the repo, then on your desktop:
```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>/mobile
```

Install dependencies:
```bash
npm install -g eas-cli
yarn install
```

---

## 🔐 Step 2 — Log in to Expo
```bash
eas login
```
(enter your Expo email + password)

---

## 🆔 Step 3 — Link this project to your Expo account

```bash
eas init
```
When prompted:
- **Create a new project?** → **Yes**
- **Project name** → `vara` (or keep default)

This writes an `extra.eas.projectId` into `app.json`. Commit it afterward.

---

## 🛠️ Step 4 — Build the APK (Preview)

```bash
eas build -p android --profile preview
```

**What happens:**
- Your code is uploaded to Expo's cloud build servers
- They compile the native Android project with Gradle
- You get a **downloadable APK link** when it finishes (~15–20 min)
- Download, install on your phone (enable "Install from unknown sources"), and test!

---

## 🏪 Step 5 — Build the AAB (Play Store)

Once the APK works, build the production AAB for Play Store upload:

```bash
eas build -p android --profile production
```

This produces an `.aab` file — exactly what Google Play Console requires.

---

## 💰 Step 6 — Replace AdMob Test IDs (Before Production!)

**Test IDs are in place now. They make ads appear but generate ZERO revenue.**

Once your AdMob account is approved (Google Support has fixed the country mismatch), update these 2 files with your real IDs:

### `/app/mobile/config.js`
```javascript
export const ADMOB_CONFIG = {
  APP_ID: 'ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX',
  BANNER_AD_UNIT: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
  INTERSTITIAL_AD_UNIT: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
  REWARDED_AD_UNIT: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
};
```

### `/app/mobile/app.json` (two places)
```json
"android": {
  "config": {
    "googleMobileAdsAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX"
  }
},
"plugins": [
  ["react-native-google-mobile-ads", {
    "androidAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX",
    "iosAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX"
  }]
]
```

Then rebuild with `eas build -p android --profile production`.

---

## 🐛 Troubleshooting

| Symptom | Fix |
|---|---|
| `eas login` fails | Double-check email/password at https://expo.dev/ |
| Build fails with "projectId not found" | Run `eas init` again |
| Build fails with dependency error | `rm -rf node_modules && yarn install` |
| APK installs but crashes instantly | Verify `googleMobileAdsAppId` matches in **both** `app.json` places |
| Ads not showing | Test IDs work immediately — real IDs take 1–2 hrs to activate |

---

## 📱 What Your APK Includes

- Login / Signup (connected to production backend)
- Dashboard w/ live earnings
- Tasks list — $0.10 per task
- $1.00 bonus unlock at 10 tasks
- Withdrawal screen ($5 minimum)
- **Banner ads** on tasks/dashboard
- **Rewarded video ads** before task completion
- **Interstitial ads** every 3 tasks

---

## 🎯 Play Store Submission (after AAB is ready)

1. Pay the one-time **$25 Google Play Developer fee** → https://play.google.com/console/signup
2. Create a new app in Play Console
3. Upload the `.aab` from your EAS build
4. Copy the copy from `/app/PLAY_STORE_LISTING.md`
5. Upload screenshots + the icon from `/app/mobile/assets/icon.png`
6. Submit for review (1–7 days)

---

## 🆘 Stuck?

Paste the exact error message back in the Emergent chat and I'll debug it with you in real time.
