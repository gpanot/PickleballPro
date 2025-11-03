# Build Requirements for QR Scanner

## Current Situation

**Running in Expo Go**: The app is currently running in Expo Go, which does **NOT** include custom native modules like `expo-barcode-scanner`.

## Solution

You need to create a **development build** to use native modules like the QR scanner.

---

## For Android

### Option 1: Build with `expo run:android` (Recommended)

```bash
# This creates a development build with all native modules
npx expo run:android
```

This will:
1. Create a custom development build
2. Include `expo-barcode-scanner` and all other native modules
3. Install on your connected device/emulator
4. Start Metro bundler

### Option 2: Build with EAS (Cloud Build)

```bash
# Build in the cloud
eas build --profile development --platform android

# After build, install APK
# Then start with:
npx expo start --dev-client
```

---

## For iOS

### Build with `expo run:ios`

```bash
# This creates a development build with all native modules
npx expo run:ios
```

Or build manually:

```bash
# Already done - native modules installed
cd ios
pod install
cd ..

# Open in Xcode
open ios/PicklePro.xcworkspace
```

**In Xcode:**
1. Select device/simulator
2. Product > Clean Build Folder (⌘+Shift+K)
3. Product > Run (⌘+R)

---

## Current Fallback (Works in Expo Go)

Since you're running in Expo Go, the app will:

✅ **Show manual code entry automatically** when scanner isn't available
✅ **No crashes** - graceful fallback
✅ **Users can still join games** via manual code entry

---

## Summary

**To get QR scanning working:**
- Build development build: `npx expo run:android` or `npx expo run:ios`
- **Don't use**: `expo start` with Expo Go

**Current workaround:**
- Manual code entry works everywhere
- QR scanning works in dev builds only

---

## Quick Test

Run this to test if native modules are available:

```bash
npx expo run:android  # For Android dev build
# OR
npx expo run:ios      # For iOS dev build
```

Then tap "Scan to Join" - if the camera opens, you're in a dev build! 🎉

