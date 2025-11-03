#!/bin/bash
echo "🔧 Rebuilding Android native modules..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf android/build
rm -rf android/app/build

# Regenerate native code with Expo
echo "🔄 Regenerating native code..."
npx expo prebuild --platform android --clean

echo "✅ Native code regenerated!"
echo ""
echo "Now run one of these:"
echo "  Option 1 (Development Build):"
echo "    npx expo run:android"
echo ""
echo "  Option 2 (EAS Build):"
echo "    eas build --profile development --platform android"

