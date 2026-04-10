# Build Your VARA Android App - Step by Step

## 🚀 Quick Build Process (15 minutes)

### **Step 1: Install EAS CLI**
Open your terminal on this Emergent environment and run:
```bash
npm install -g eas-cli
```

### **Step 2: Login to Expo**
```bash
eas login
```

**Don't have an Expo account?**
- Create one for FREE at: https://expo.dev/signup
- Just need email + password

### **Step 3: Configure Your Project**
```bash
cd /app/mobile
eas build:configure
```

When prompted, choose:
- Platform: **Android**
- Create a new project? **Yes**

### **Step 4: Build the APK**
```bash
eas build -p android --profile preview
```

This will:
- Upload your code to Expo's build servers
- Build the APK in the cloud
- Give you a download link

**⏱ Build time:** 15-20 minutes

### **Step 5: Download & Install**

Once the build completes, you'll get a link like:
```
✅ Build finished!
Download: https://expo.dev/accounts/[your-account]/builds/[build-id]
```

1. Click the link
2. Download the APK file to your phone
3. Install it (you may need to allow "Install from unknown sources")

---

## 📱 **What You'll Get**

Your APK will include:
- ✅ Login/Signup screens
- ✅ Dashboard with earnings
- ✅ Tasks list ($0.10 per task)
- ✅ $1.00 bonus after 10 tasks
- ✅ Withdrawal screen ($5 minimum)
- ✅ **Banner Ads** (top/bottom of screens)
- ✅ **Rewarded Video Ads** (before task completion)
- ✅ **Interstitial Ads** (after every 3 tasks)

---

## ⚙️ **Before Building - Update AdMob IDs**

**IMPORTANT:** Replace test AdMob IDs with your real ones!

1. **Get your AdMob IDs** from https://admob.google.com/

2. **Update `/app/mobile/config.js`:**
```javascript
export const ADMOB_CONFIG = {
  APP_ID: 'ca-app-pub-YOUR-REAL-APP-ID',
  BANNER_AD_UNIT: 'ca-app-pub-YOUR-BANNER-ID',
  INTERSTITIAL_AD_UNIT: 'ca-app-pub-YOUR-INTERSTITIAL-ID',
  REWARDED_AD_UNIT: 'ca-app-pub-YOUR-REWARDED-ID',
};
```

3. **Update `/app/mobile/app.json`:**
```json
"android": {
  "config": {
    "googleMobileAdsAppId": "ca-app-pub-YOUR-REAL-APP-ID"
  }
}
```

**Don't have AdMob IDs yet?**
- The app will build fine with test IDs
- Ads won't show real revenue
- Replace later and rebuild

---

## 🐛 **Troubleshooting**

### Build fails?
Check the build logs for specific errors

### Can't install APK?
Enable "Install from unknown sources" in phone settings

### Ads not showing?
- Wait 1-2 hours after creating new AdMob ad units
- Check AdMob dashboard for ad serving status
- Test IDs work immediately (no revenue)

---

## 🎯 **Next: Google Play Store**

Once your APK works, deploy to Play Store:

```bash
eas build -p android --profile production
```

This creates an AAB file for Play Store submission.

**Cost:** $25 one-time Google Play Developer fee

---

## 📞 **Need Help?**

Ask me to:
- Run the build commands for you
- Fix any build errors
- Update AdMob configuration
- Create Play Store assets

**Your mobile app code is 100% ready - just needs to be built!** 🚀
