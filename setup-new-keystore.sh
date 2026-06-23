#!/bin/bash

# Setup New Keystore for PicklePro
# This script helps you configure the new upload keystore

set -e

echo "🔐 PicklePro - New Keystore Setup"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if keystore exists
if [ ! -f "android/app/picklepro-upload-key.jks" ]; then
    echo -e "${RED}❌ Error: picklepro-upload-key.jks not found!${NC}"
    exit 1
fi

if [ ! -f "android/app/picklepro-upload-key.pem" ]; then
    echo -e "${RED}❌ Error: picklepro-upload-key.pem not found!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Keystore files found${NC}"
echo ""

# Display certificate info
echo "📋 Certificate Information:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
keytool -list -v -keystore android/app/picklepro-upload-key.jks -storepass "Singapore2025@" 2>/dev/null | grep -A 3 "SHA1:" || true
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo -e "${YELLOW}⚠️  IMPORTANT: Complete these steps IN ORDER:${NC}"
echo ""
echo "📍 STEP 1: Register Upload Key with Google Play Console"
echo "   ↳ This MUST be done BEFORE building with the new key!"
echo ""
echo "   1. Go to: https://play.google.com/console"
echo "   2. Select your app: PicklePro"
echo "   3. Navigate to: Setup → App signing"
echo "   4. Confirm 'App signing by Google Play' is enabled"
echo "   5. Register new upload key:"
echo "      • Upload: android/app/picklepro-upload-key.pem"
echo "      • OR enter SHA-256 fingerprint manually"
echo ""
echo -e "${YELLOW}⏸️  Press ENTER after you've completed Step 1...${NC}"
read -r

echo ""
echo "📍 STEP 2: Upload Keystore to EAS"
echo ""
echo "Opening EAS credentials configuration..."
echo ""

# Try to configure EAS credentials
npx eas-cli credentials -p android || {
    echo ""
    echo -e "${RED}❌ Could not configure automatically${NC}"
    echo ""
    echo "Please configure manually:"
    echo "1. Run: npx eas-cli credentials"
    echo "2. Select: Android → production"
    echo "3. Choose: Set up a new keystore"
    echo "4. Upload: android/app/picklepro-upload-key.jks"
    echo "   Alias: picklepro"
    echo "   Store password: Singapore2025@"
    echo "   Key password: Singapore2025@"
    echo ""
    echo "OR use EAS Dashboard:"
    echo "https://expo.dev/accounts/guigui77/projects/picklepro-mobile/credentials"
    exit 1
}

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "📍 STEP 3: Build with New Keystore"
echo ""
echo "Run this command to build:"
echo -e "${GREEN}npx eas-cli build --platform android --profile production${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📚 For complete documentation, see: KEYSTORE_CREDENTIALS.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

