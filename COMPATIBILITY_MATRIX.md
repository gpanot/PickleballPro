# PicklePro Mobile - Compatibility Matrix

## 📱 Project Configuration Overview

This document tracks all version compatibility information for the PicklePro mobile app to ensure successful builds and Google Play Store compliance.

---

## 🔧 Current Configuration (September 2025)

### **Core Framework Versions**
| Component | Version | Notes |
|-----------|---------|-------|
| **Expo SDK** | `52.0.0` | Stable, supports API 35 via expo-build-properties |
| **React Native** | `0.76.3` | Bundled with Expo SDK 52 |
| **React** | `18.3.1` | Compatible with RN 0.76.3 |
| **TypeScript** | `^5.3.0` | Latest stable |

### **Android Build Configuration**
| Component | Version | Notes |
|-----------|---------|-------|
| **Target API Level** | `35` | **Required by Google Play Store (Aug 2025+)** |
| **Compile SDK** | `35` | Must match target API |
| **Min SDK** | `23` | Android 6.0+ support |
| **Build Tools** | `35.0.0` | Latest for API 35 |
| **NDK** | `25.1.8937393` | Stable version |

### **Build System Versions**
| Component | Version | Notes |
|-----------|---------|-------|
| **Gradle** | `8.7` | Required for SDK 54 + API 35 |
| **Kotlin** | `1.9.10` | Compatible with Gradle 8.7 |
| **Java** | `OpenJDK 17` | Recommended for Expo SDK 54 |
| **Android Gradle Plugin** | Auto-managed | Via React Native |

### **Key Dependencies**
| Package | Version | Compatibility Notes |
|---------|---------|-------------------|
| `expo-build-properties` | `~0.12.5` | **NEW: Enables API 35 targeting** |
| `expo-dev-client` | `~4.0.26` | SDK 52 compatible |
| `expo-font` | `~12.0.9` | SDK 52 compatible |
| `expo-image-picker` | `~15.0.7` | SDK 52 compatible |
| `expo-location` | `~17.0.1` | SDK 52 compatible |
| `react-native-maps` | `1.18.0` | ✅ Compatible with RN 0.76.3 |
| `react-native-screens` | `~3.34.0` | ✅ Compatible with RN 0.76.3 |
| `react-native-gesture-handler` | `~2.20.2` | SDK 52 compatible |

---

## 🚨 Known Compatibility Issues & Solutions

### **1. React Native Maps Version Conflict**
- **Issue**: `react-native-maps@^1.18.0` requires RN >= 0.76.0
- **Solution**: Downgraded to `^1.10.0` (compatible with RN 0.75.4)
- **Impact**: Some newer map features may not be available

### **2. Local Gradle Build Issues**
- **Issue**: Kotlin compilation errors with expo-modules-core
- **Solution**: Use EAS Build (cloud builds) instead of local builds
- **Reason**: Complex dependency resolution handled automatically

### **3. API Level 35 Requirement**
- **Issue**: Google Play Store mandates API 35 (August 2025+)
- **Solution**: Upgraded to Expo SDK 54 which supports API 35
- **Status**: ✅ Compliant

---

## 🛠 Build Commands & Environment

### **Environment Setup**
```bash
export ANDROID_HOME=~/Library/Android/sdk
export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
export PATH=$JAVA_HOME/bin:$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools:$ANDROID_HOME/tools/bin
```

### **Local Build Commands**
```bash
# Clean build
cd android && ./gradlew clean

# APK (for testing)
./gradlew assembleRelease

# AAB (for Play Store) - May fail due to dependency issues
./gradlew bundleRelease
```

### **EAS Build Commands (Recommended)**
```bash
# Install EAS CLI
npm install -g eas-cli

# Build AAB for production
npx eas-cli build --platform android --profile production
```

---

## 📦 App Configuration

### **App Identity**
| Property | Value |
|----------|-------|
| **Package ID** | `com.picklepro.mobile` |
| **App Name** | PicklePro |
| **Version Name** | `1.0.4` |
| **Version Code** | `5` |

### **Permissions (Minimal Set)**
- `android.permission.INTERNET`
- `android.permission.ACCESS_FINE_LOCATION`
- `android.permission.ACCESS_COARSE_LOCATION`
- `android.permission.READ_EXTERNAL_STORAGE`
- `android.permission.WRITE_EXTERNAL_STORAGE`
- `android.permission.SYSTEM_ALERT_WINDOW`
- `android.permission.VIBRATE`
- `android.permission.WAKE_LOCK`

### **Blocked Permissions**
- `android.permission.CAMERA` ❌ (Removed to avoid privacy policy requirement)
- `android.permission.RECORD_AUDIO` ❌

---

## 🔄 Version History

### **v1.0.4 (Current) - September 2025**
- ✅ Upgraded to Expo SDK 54
- ✅ Updated to Android API level 35
- ✅ Fixed dependency conflicts
- ✅ Removed camera permissions
- ✅ Google Play Store compliant

### **v1.0.3 - Previous**
- Expo SDK 50
- Android API level 34
- Camera permission issues

### **v1.0.2 - Previous**
- Initial release configuration
- Basic functionality

---

## 🚀 Google Play Store Compliance

### **Current Status: ✅ COMPLIANT**
- ✅ **API Level 35**: Required for new submissions
- ✅ **AAB Format**: Using Android App Bundle
- ✅ **Permissions**: Minimal set, no privacy policy needed
- ✅ **Signing**: Production keystore configured
- ✅ **Version**: Incremental version codes

### **Submission Checklist**
- [ ] Build AAB with EAS Build
- [ ] Test on physical devices
- [ ] Upload to Google Play Console
- [ ] Complete store listing
- [ ] Submit for review

---

## 🔧 Troubleshooting

### **Common Issues**

1. **Gradle Build Fails Locally**
   - **Solution**: Use EAS Build instead
   - **Reason**: Complex dependency resolution

2. **Version Conflicts**
   - **Check**: `npm ls` for duplicate packages
   - **Fix**: Use `--legacy-peer-deps` flag

3. **API Level Errors**
   - **Verify**: All build.gradle files use API 35
   - **Check**: Android SDK is installed for API 35

### **Useful Commands**
```bash
# Check dependency tree
npm ls

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install --legacy-peer-deps

# Check Expo configuration
npx expo-doctor
```

---

## 📝 Notes

- **EAS Build Recommended**: Local builds may fail due to complex dependency issues
- **Keep Dependencies Minimal**: Avoid unnecessary packages that may cause conflicts
- **Version Pinning**: Use exact versions for critical dependencies
- **Regular Updates**: Monitor Expo SDK releases for API level support

---

*Last Updated: September 28, 2025*  
*Project: PicklePro Mobile App*  
*Platform: React Native + Expo*
