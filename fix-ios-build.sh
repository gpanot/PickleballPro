#!/bin/bash

echo "🧹 Cleaning iOS build..."

# Navigate to project root
cd "$(dirname "$0")"

# Step 1: Clean Xcode derived data
echo "📦 Cleaning Xcode derived data..."
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# Step 2: Clean iOS build folder
echo "🗑️  Removing iOS build folder..."
rm -rf ios/build

# Step 3: Remove Pods and Podfile.lock
echo "🗑️  Removing Pods..."
cd ios
rm -rf Pods
rm -rf Podfile.lock
rm -rf .xcode.env.local

# Step 4: Clean CocoaPods cache
echo "🧹 Cleaning CocoaPods cache..."
pod cache clean --all

# Step 5: Deintegrate and reinstall pods
echo "📦 Deintegrating CocoaPods..."
pod deintegrate || true

echo "📦 Installing Pods..."
pod install --repo-update

cd ..

echo "✅ Done! Now try building in Xcode again."
echo ""
echo "Additional steps if the issue persists:"
echo "1. In Xcode: Product > Clean Build Folder (Cmd+Shift+K)"
echo "2. Close and reopen Xcode"
echo "3. Try building again"

