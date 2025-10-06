# Pickleball Hero - Android Build Configuration

## 📊 Current Version Configuration

**Last Updated:** January 29, 2025

### 🔧 Core Build Tools

| Component | Version | Location | Status |
|-----------|---------|----------|---------|
| **Gradle** | `8.13` | `android/gradle/wrapper/gradle-wrapper.properties` | ✅ Stable |
| **Android Gradle Plugin** | `8.7.2` | `android/build.gradle` | ✅ Latest |
| **Kotlin** | `2.2.0` | `android/build.gradle` | ✅ Latest |
| **Java** | `17.0.14` | `android/gradle.properties` | ✅ Compatible |

### 📱 Android Configuration

| Setting | Value | Location | Notes |
|---------|-------|----------|-------|
| **Build Tools** | `35.0.0` | `android/build.gradle` | Latest stable |
| **Compile SDK** | `35` | `android/build.gradle` | Android 15 |
| **Target SDK** | `35` | `android/build.gradle` | Updated to match Compile SDK |
| **Min SDK** | `24` | `android/build.gradle` | Android 7.0+ |
| **NDK** | `29.0.14033849` | `android/build.gradle` | Latest stable |

### ⚛️ React Native & Expo

| Component | Version | Location | Notes |
|-----------|---------|----------|-------|
| **React Native** | `0.81.4` | `package.json` | Latest stable |
| **Expo SDK** | `54.0.12` | `package.json` | Compatible with RN 0.81 |
| **React** | `19.1.0` | `package.json` | Latest stable |
| **TypeScript** | `5.3.0` | `package.json` | Latest stable |

### 🎯 Build Features

| Feature | Status | Configuration |
|---------|--------|---------------|
| **Hermes Engine** | ✅ Enabled | `hermesEnabled=true` |
| **New Architecture** | ❌ Disabled | `newArchEnabled=false` |
| **GIF Support** | ✅ Enabled | `expo.gif.enabled=true` |
| **WebP Support** | ✅ Enabled | `expo.webp.enabled=true` |
| **Animated WebP** | ❌ Disabled | `expo.webp.animated=false` |
| **AndroidX** | ✅ Enabled | `android.useAndroidX=true` |

### 🚀 Performance Optimizations

```properties
# Gradle Performance Settings
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m -XX:+HeapDumpOnOutOfMemoryError
org.gradle.daemon=true
org.gradle.parallel=true
org.gradle.configureondemand=true
```

### 🏗️ Architecture Support

| Architecture | Status | Notes |
|--------------|--------|-------|
| **ARMv7** | ✅ Supported | `armeabi-v7a` |
| **ARM64** | ✅ Supported | `arm64-v8a` |
| **x86** | ✅ Supported | `x86` |
| **x86_64** | ✅ Supported | `x86_64` |

## 📁 Key Configuration Files

### 1. `android/build.gradle`
- **Gradle Version**: 8.13
- **Kotlin Version**: 2.2.0
- **Android Gradle Plugin**: 8.7.2
- **Build Tools**: 35.0.0
- **Compile SDK**: 35
- **Target SDK**: 35
- **Min SDK**: 24
- **NDK**: 29.0.14033849

### 2. `android/gradle.properties`
- **Java Home**: `/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home`
- **Android Home**: `/Users/guillaumepanot/Library/Android/sdk`
- **Memory Settings**: 4GB heap, 512MB metaspace
- **Performance**: Parallel builds, daemon enabled

### 3. `android/gradle/wrapper/gradle-wrapper.properties`
- **Gradle Distribution**: `gradle-8.13-bin.zip`
- **Network Timeout**: 10000ms

### 4. `package.json`
- **React Native**: 0.81.4
- **Expo SDK**: 54.0.12
- **React**: 19.1.0
- **TypeScript**: 5.3.0

## 🔧 Environment Variables

```bash
export ANDROID_HOME=~/Library/Android/sdk
export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
export PATH=$JAVA_HOME/bin:$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools:$ANDROID_HOME/tools/bin
```

## 📋 Build Commands

### Local Build
```bash
cd /Users/guillaumepanot/Documents/CODE/Pickleball_Hero/android
./gradlew clean
./gradlew assembleRelease
```

### EAS Build (Recommended)
```bash
cd /Users/guillaumepanot/Documents/CODE/Pickleball_Hero
npx eas build --platform android --profile preview
```

## 📍 Output Locations

- **APK**: `android/app/build/outputs/apk/release/app-release.apk`
- **AAB**: `android/app/build/outputs/bundle/release/app-release.aab`

## ⚠️ Known Issues

1. **Lint Warning**: "SoftwareComponent with name 'release' not found"
   - **Status**: Cosmetic warning, doesn't affect build
   - **Cause**: Expo modules compatibility with Gradle 8.13
   - **Solution**: Use EAS Build or ignore warning

2. **Kotlin Compose Plugin**: Version 2.2.0 compatibility
   - **Status**: Resolved with current configuration
   - **Solution**: Updated to Kotlin 2.2.0 + Gradle 8.13

## 🎯 Compatibility Matrix

| React Native | Expo SDK | Gradle | Kotlin | Java | Status |
|--------------|----------|--------|--------|------|--------|
| 0.81.4 | 54.0.12 | 8.13 | 2.2.0 | 17 | ✅ Compatible |

## 📝 Notes

- **Last Successful Build**: Configuration ready for testing
- **Build Time**: ~2-3 minutes (with optimizations)
- **APK Size**: ~66MB (estimated)
- **Supported Devices**: Android 7.0+ (API 24+)

---

**💡 Tip**: Always use EAS Build for production releases as it handles dependency resolution automatically and provides better reliability than local builds.

## Memory Management (Claude.ai recommendations)

**Do 1**: Increase Gradle Memory 
Create or edit android/gradle.properties and add/update these lines:
propertiesorg.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m -XX:+HeapDumpOnOutOfMemoryError
org.gradle.daemon=true
org.gradle.parallel=true
org.gradle.configureondemand=true

**Do 2**: Disable Lint for Release Build 
Edit android/app/build.gradle and add this inside the android block:
gradleandroid {
    ndkVersion rootProject.ext.ndkVersion

    buildToolsVersion rootProject.ext.buildToolsVersion
    compileSdk 35

    namespace 'com.picklepro.mobile'
    
    // Add this lint options block
    lint {
        checkReleaseBuilds false
        abortOnError false
    }
    
    defaultConfig {
        // ... rest of your config
    }
    // ... rest of android block
}

I recommend doing BOTH options - increase the memory AND disable lint for release builds.

## Build.gradle important V35 build:

**Update android/app/build.gradle**
Change this section:

gradleandroid {
    ndkVersion rootProject.ext.ndkVersion

    buildToolsVersion rootProject.ext.buildToolsVersion
    compileSdk rootProject.ext.compileSdkVersion  // Change this line

To this:
gradleandroid {
    ndkVersion rootProject.ext.ndkVersion

    buildToolsVersion rootProject.ext.buildToolsVersion
    compileSdk 35  // Explicitly set to 35