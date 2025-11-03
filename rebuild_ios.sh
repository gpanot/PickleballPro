#!/bin/bash
echo "🔧 Rebuilding iOS native modules..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf ios/build
rm -rf ios/Pods
rm -rf ios/Podfile.lock

# Regenerate native code with Expo
echo "🔄 Regenerating native code..."
npx expo prebuild --platform ios --clean

# Install CocoaPods dependencies
echo "📦 Installing CocoaPods dependencies..."
cd ios
pod install
cd ..

echo "✅ Done! Now open the project in Xcode:"
echo "   open ios/PicklePro.xcworkspace"
echo ""
echo "Then in Xcode:"
echo "   1. Select your target device/simulator"
echo "   2. Product > Clean Build Folder (Cmd+Shift+K)"
echo "   3. Product > Build (Cmd+B)"
