#!/bin/bash

# Test Web Build Script
# This script tests if your web build works correctly before deployment

echo "🧪 Testing Web Build for Admin Dashboard"
echo "========================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js found:${NC} $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm found:${NC} $(npm --version)"

echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Dependencies installed${NC}"

echo ""
echo "🏗️  Building web version..."
npm run build:web

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    echo ""
    echo "Common issues:"
    echo "1. Missing dependencies - run: npm install"
    echo "2. React Native components not compatible with web"
    echo "3. Environment variables not set"
    exit 1
fi

# Check if dist directory was created
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build directory (dist) not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful!${NC}"
echo ""

# Check for index.html
if [ ! -f "dist/index.html" ]; then
    echo -e "${RED}❌ index.html not found in dist directory${NC}"
    exit 1
fi
echo -e "${GREEN}✅ index.html created${NC}"

# Check build size
BUILD_SIZE=$(du -sh dist | cut -f1)
echo -e "${GREEN}✅ Build size:${NC} $BUILD_SIZE"

echo ""
echo "🎉 Web build test completed successfully!"
echo ""
echo "Next steps:"
echo "1. Test locally: npm run serve:web"
echo "2. Visit: http://localhost:3000"
echo "3. Deploy: npm run deploy:vercel"
echo ""

