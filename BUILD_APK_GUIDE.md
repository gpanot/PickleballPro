# PicklePro Mobile - APK Build Guide

## 📋 Prerequisites

### Required Software
1. **Node.js** (v18 or higher)
2. **Java 17** (specifically - avoid Java 21 due to compatibility issues)
3. **Android SDK** with Android Studio
4. **Expo CLI** and **EAS CLI**

### Environment Setup
```bash
# Install Java 17 (if not already installed)
brew install openjdk@17

# Install EAS CLI
npm install -g eas-cli

# Set up Android SDK environment variables
export ANDROID_HOME=~/Library/Android/sdk
export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
export PATH=$JAVA_HOME/bin:$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools:$ANDROID_HOME/tools/bin
```

## 🏗️ Build Process

### Method 1: Local Gradle Build (Recommended for Development)

1. **Navigate to project root and install dependencies:**
   ```bash
   cd /Users/guillaumepanot/Documents/CODE/Pickleball_Hero
   npm install
   ```

2. **Export the Expo app:**
   ```bash
   npx expo export --platform android
   ```

3. **Set environment variables and build:**
   ```bash
   export ANDROID_HOME=~/Library/Android/sdk
   export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
   export PATH=$JAVA_HOME/bin:$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools:$ANDROID_HOME/tools/bin
   
   cd android
   ./gradlew clean
   ./gradlew assembleRelease
   ```

4. **Find your APK:**
   ```bash
   # APK will be located at:
   android/app/build/outputs/apk/release/app-release.apk
   ```

### Method 2: EAS Build (Cloud Build)

1. **Build APK via EAS:**
   ```bash
   npx eas build --platform android --profile preview
   ```

2. **Download APK from EAS dashboard or provided link**

## 📱 Installation

### Install on Connected Device
```bash
export ANDROID_HOME=~/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Check connected devices
adb devices

# Install APK
cd android
adb install app/build/outputs/apk/release/app-release.apk
```

### Manual Installation
1. Transfer APK file to device
2. Enable "Install from Unknown Sources" in device settings
3. Tap APK file to install

## 🔧 Configuration Files

### Key Configuration Files:
- `app.json` - Expo configuration
- `eas.json` - EAS build profiles
- `android/app/build.gradle` - Android build configuration
- `package.json` - Dependencies and scripts

### Build Profiles (eas.json):
```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

## 🐛 Troubleshooting

### Common Issues:

1. **Java Version Compatibility:**
   - **Problem:** Build fails with Java 21
   - **Solution:** Use Java 17 specifically
   ```bash
   export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
   ```

2. **Expo Modules Compatibility:**
   - **Problem:** expo-modules-autolinking compatibility issues
   - **Solution:** Fix package versions
   ```bash
   npx expo install --fix
   ```

3. **Android SDK Issues:**
   - **Problem:** Build fails with SDK errors
   - **Solution:** Ensure ANDROID_HOME is set correctly
   ```bash
   export ANDROID_HOME=~/Library/Android/sdk
   ```

4. **Build Cache Issues:**
   - **Problem:** Stale build artifacts
   - **Solution:** Clean before building
   ```bash
   cd android
   ./gradlew clean
   ```

## 📦 App Details

- **Package Name:** `com.picklepro`
- **App Name:** PicklePro
- **Build Type:** Release (debug signed)
- **Typical APK Size:** ~66MB
- **App Icon:** Bright yellow pickleball icon (1024x1024 PNG)
- **Icon Location:** `./assets/images/icon.png`

## 🔄 Quick Build Script

Create a `build-apk.sh` script for easy building:

```bash
#!/bin/bash

# Set environment
export ANDROID_HOME=~/Library/Android/sdk
export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
export PATH=$JAVA_HOME/bin:$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools:$ANDROID_HOME/tools/bin

# Navigate to project root
cd /Users/guillaumepanot/Documents/CODE/Pickleball_Hero

# Install dependencies
npm install

# Export for Android
npx expo export --platform android

# Build APK
cd android
./gradlew clean
./gradlew assembleRelease

echo "✅ APK built successfully!"
echo "📍 Location: android/app/build/outputs/apk/release/app-release.apk"
```

## 🚀 Production Notes

For Google Play Store deployment:
1. Generate a production keystore
2. Update `android/app/build.gradle` with release signing config
3. Use `./gradlew assembleRelease` with production keystore
4. Or use EAS Build production profile

## 📝 Build Log

- **Last Successful Build:** September 26, 2025
- **Build Time:** ~1 minute 20 seconds
- **Java Version Used:** OpenJDK 17.0.7
- **Android SDK Version:** API 34
- **Expo SDK:** 50.0.20
- **App Icon:** Updated to pickleball icon

## 🔗 Useful Commands

```bash
# Check Java version
java -version

# Check Android devices
adb devices

# Check APK info
aapt dump badging app-release.apk

# Uninstall app from device
adb uninstall com.picklepro

# View device logs
adb logcat

# Install and launch app
adb install app-release.apk && adb shell am start -n com.picklepro/.MainActivity
```

---

**💡 Tip:** Save this guide and refer to it for future builds. The key is using Java 17 and ensuring all environment variables are properly set!
