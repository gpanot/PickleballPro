# iOS Rebuild Guide - Fixing QR Scanner

## Current Status
✅ **App won't crash** - Graceful fallback is already implemented
⚠️ QR scanning on iOS requires native module to be properly linked

## Quick Fix: Rebuild iOS with Native Modules

### Step 1: Update app.json (Already done)
The `expo-barcode-scanner` plugin has been added to `app.json`.

### Step 2: Rebuild Native Code

**Option A: Use the script (Recommended)**
```bash
cd /Users/guillaumepanot/Documents/CODE/Pickleball_Hero
./rebuild_ios.sh
```

**Option B: Manual steps**
```bash
# 1. Clean previous builds
rm -rf ios/build ios/Pods ios/Podfile.lock

# 2. Regenerate native code
npx expo prebuild --platform ios --clean

# 3. Install CocoaPods
cd ios
pod install
cd ..
```

### Step 3: Open in Xcode
```bash
open ios/PicklePro.xcworkspace
```

**In Xcode:**
1. Select your target device/simulator
2. **Product > Clean Build Folder** (⌘+Shift+K)
3. **Product > Build** (⌘+B)
4. **Product > Run** (⌘+R)

---

## Alternative: Keep Current Setup (No QR on iOS)

If you don't want to deal with native modules, the current setup is fine:

✅ App works perfectly
✅ Android has QR scanning
✅ iOS shows friendly fallback message
✅ Users can manually enter join codes

**No action needed** - everything works as-is.

---

## Troubleshooting

### Error: "No native module found"
- Run `npx expo prebuild --clean` again
- Make sure `expo-barcode-scanner` is in `app.json` plugins

### Error: Pod install fails
```bash
cd ios
pod deintegrate
pod install
cd ..
```

### Error: Xcode build fails
1. Clean: **Product > Clean Build Folder**
2. Delete Derived Data: `rm -rf ~/Library/Developer/Xcode/DerivedData`
3. Rebuild: **Product > Build**

---

## Recommended Approach

**Keep the fallback UI** - It's working great and avoids native module complexity!

