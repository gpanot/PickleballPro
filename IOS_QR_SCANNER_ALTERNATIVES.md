# iOS QR Scanner Alternatives

Since `expo-barcode-scanner` is causing native module issues on iOS, here are the alternatives:

## Option 1: Disable QR Scanning for iOS (Simplest - Recommended)

**Current Status**: Already implemented with graceful fallback UI.

The app will:
- Show a friendly message on iOS when "Scan to Join" is tapped
- Suggest using the join code manually
- Work perfectly on Android

**No action needed** - this is already in place with the conditional import we added.

---

## Option 2: Use React Native Vision Camera (More Complex)

If you want QR scanning on iOS, you can use `react-native-vision-camera`:

### Installation:
```bash
npm install react-native-vision-camera
npm install vision-camera-code-scanner  # QR code plugin
cd ios && pod install
```

### Note:
- Requires manual native linking
- More complex setup
- Requires iOS 13+
- Better performance but more overhead

---

## Option 3: Fix Expo Native Module (Rebuild Required)

The issue is likely that the native module isn't properly linked. To fix:

### Steps:
1. **Clean and reinstall pods:**
   ```bash
   cd ios
   rm -rf Pods Podfile.lock
   pod install
   cd ..
   ```

2. **Ensure expo-barcode-scanner is in app.json plugins:**
   ```json
   "plugins": [
     "expo-font",
     "expo-barcode-scanner",
     ...
   ]
   ```

3. **Rebuild the app:**
   ```bash
   npx expo prebuild --clean
   cd ios
   pod install
   ```
   
4. **Open in Xcode and rebuild:**
   ```bash
   open ios/YourApp.xcworkspace
   ```

---

## Recommended Approach

**Use Option 1** - The fallback UI is already implemented and works well. Users can:
- See the join code on the setup screen
- Enter it manually
- Still use QR scanning on Android where it works

This avoids native module complexity and keeps the app stable.

