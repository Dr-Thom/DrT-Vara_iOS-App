# VARA - Android Earning App

**Complete React Native app with maximum monetization (Banner Ads + Rewarded Video Ads + Interstitial Ads)**

## 📱 App Features

✅ **User Authentication**
- Login/Signup with JWT tokens
- Session persistence (4-hour access tokens)
- Automatic token refresh

✅ **Task System**
- Browse available earning tasks
- Rewarded video ads before task completion (YOU earn money)
- Complete tasks and earn rewards
- $2 USD bonus unlock after 5 tasks

✅ **Dashboard**
- Earnings breakdown (Earned/Withdrawn/Balance)
- Tasks completed counter
- Bonus status tracking

✅ **Withdrawal System**
- Mock withdrawal via GCash, PayPal, Bank
- Balance tracking

✅ **Maximum AdMob Monetization**
1. **Banner Ads** - Top and bottom of Dashboard & Tasks screens
2. **Rewarded Video Ads** - User watches 30-sec ad before each task completion
3. **Interstitial Ads** - Full-screen ads after every 5 tasks completed

---

## 🔧 Tech Stack

- **Framework**: React Native (Expo)
- **Navigation**: React Navigation
- **API**: FastAPI backend (existing)
- **Ads**: Google AdMob (react-native-google-mobile-ads)
- **Storage**: AsyncStorage

---

## 🚀 How to Build & Deploy

### **Prerequisites**

1. **Install Expo CLI** (if not already installed):
   ```bash
   npm install -g expo-cli
   ```

2. **Get Real AdMob IDs**:
   - Go to https://admob.google.com/
   - Create an app
   - Create ad units: Banner, Interstitial, Rewarded Video
   - Copy your App ID and Ad Unit IDs

### **Step 1: Update AdMob IDs**

Replace test IDs in `/app/mobile/config.js`:

```javascript
export const ADMOB_CONFIG = {
  // Replace with YOUR real AdMob IDs
  APP_ID: 'ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY',
  BANNER_AD_UNIT: 'ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ',
  INTERSTITIAL_AD_UNIT: 'ca-app-pub-XXXXXXXXXXXXXXXX/AAAAAAAAAA',
  REWARDED_AD_UNIT: 'ca-app-pub-XXXXXXXXXXXXXXXX/BBBBBBBBBB',
};
```

Also update in `/app/mobile/app.json`:
```json
"android": {
  "config": {
    "googleMobileAdsAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY"
  }
}
```

### **Step 2: Install EAS CLI** (for building APK)

```bash
npm install -g eas-cli
```

### **Step 3: Login to Expo**

```bash
eas login
```

### **Step 4: Configure Build**

```bash
cd /app/mobile
eas build:configure
```

### **Step 5: Build APK**

```bash
eas build -p android --profile preview
```

This will:
- Build the APK on Expo's servers
- Give you a download link when done (~15-20 minutes)

### **Step 6: Test the APK**

- Download the APK from the link
- Install on your Android phone
- Test all features

---

## 📦 For Play Store Deployment

### **1. Build Production AAB** (Android App Bundle):

```bash
eas build -p android --profile production
```

### **2. Google Play Console Setup**:

1. Go to https://play.google.com/console/
2. Create new app
3. Fill in app details:
   - **App Name**: VARA
   - **Category**: Lifestyle / Finance
   - **Description**: (Use your landing page copy)

4. Upload screenshots (you'll need):
   - 2 phone screenshots
   - 1 tablet screenshot (optional)
   - Feature graphic (1024x500px)
   - App icon (512x512px)

5. Upload the AAB file
6. Set up pricing (Free)
7. Complete content rating questionnaire
8. Add privacy policy URL
9. Submit for review

---

## 💰 Monetization Strategy

### **Revenue Calculation Per User**:

**Your Earnings (from ads):**
- 5 Rewarded Videos = $0.15 - $0.25
- Banner Ads (impressions) = $0.05 - $0.10
- 1 Interstitial Ad = $0.05 - $0.10
- **Total per user** = ~$0.25 - $0.45

**User Earnings (task rewards):**
- 5 tasks @ $0.30 avg = $1.50
- $2 bonus = $2.00
- **Total payout** = ~$3.50

**Net Cost Per User**: $3.05 - $3.25

### **Break-Even Strategy**:
- Focus on user retention (daily active users)
- Add more banner ads impressions
- Increase interstitial ad frequency (after 3 tasks instead of 5)
- Add rewarded videos for bonus unlock

---

## 🔑 Test Credentials

**Admin Account**:
- Email: admin@vara.com
- Password: vara_admin_2026

**Create New User**:
- Use Signup screen in app

---

## 📱 Local Development

To test in Expo Go app (faster development):

```bash
cd /app/mobile
expo start
```

Then scan QR code with Expo Go app on your phone.

**Note**: AdMob ads won't show in Expo Go (only in built APK).

---

## 🛠️ Troubleshooting

### **Ads Not Showing**:
1. Check if you replaced test IDs with real AdMob IDs
2. Wait 1-2 hours after creating new AdMob ad units
3. Check AdMob dashboard for ad serving status

### **Build Errors**:
1. Make sure all dependencies are installed
2. Clear cache: `expo start -c`
3. Check EAS build logs for specific errors

### **API Connection Issues**:
1. Verify `BACKEND_URL` in `/app/mobile/config.js`
2. Check if backend is accessible
3. Test API endpoints manually

---

## 📊 App Configuration

**Package Name**: `com.vara.app`
**Version**: 1.0.0
**Min SDK**: Android 5.0 (API 21)
**Target SDK**: Android 13 (API 33)

---

## 🎯 Next Steps After Deployment

1. **Monitor AdMob Dashboard**:
   - Track ad impressions
   - Monitor eCPM (earnings per 1000 impressions)
   - Adjust ad placement based on performance

2. **User Feedback**:
   - Monitor Play Store reviews
   - Track task completion rates
   - Optimize user experience

3. **Scaling**:
   - Add more tasks
   - Increase ad frequency if eCPM is high
   - Consider adding more ad networks via AdMob mediation

---

## 📞 Support

For any issues or questions, refer to:
- Expo Docs: https://docs.expo.dev/
- AdMob Docs: https://developers.google.com/admob/android/quick-start
- React Native Docs: https://reactnative.dev/

---

**Built with ❤️ using Emergent AI**
