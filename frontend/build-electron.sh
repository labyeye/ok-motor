#!/bin/bash

# OK Motor - Electron Build Script
# This script builds the Electron app for your platform

set -e  # Exit on error

echo "🚀 OK Motor - Electron Build Script"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
red='\033[0;31m'
NC='\033[0m' # No Color

# Detect OS
OS="$(uname -s)"
case "${OS}" in
    Darwin*)    PLATFORM="Mac";;
    Linux*)     PLATFORM="Linux";;
    MINGW*|MSYS*|CYGWIN*)    PLATFORM="Windows";;
    *)          PLATFORM="Unknown";;
esac

echo -e "${BLUE}Detected Platform: ${PLATFORM}${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${red}❌ Error: package.json not found!${NC}"
    echo "Please run this script from the frontend/ directory:"
    echo "  cd frontend"
    echo "  ./build-electron.sh"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules not found. Installing dependencies...${NC}"
    npm install
    echo ""
fi

# Ask user what to build
echo "What would you like to build?"
echo ""
echo "1) Build for ${PLATFORM} only (Quick)"
echo "2) Build for Mac (Intel + Apple Silicon)"
echo "3) Build for Windows (64-bit + 32-bit + Portable)"
echo "4) Build for Linux (AppImage + .deb)"
echo "5) Build for ALL platforms"
echo "6) Just build React app (no Electron packaging)"
echo ""
read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        echo ""
        echo -e "${BLUE}🔨 Building for ${PLATFORM}...${NC}"
        echo ""
        
        # Build React app first
        echo -e "${YELLOW}Step 1/2: Building React app...${NC}"
        npm run build
        echo ""
        
        # Build Electron app
        echo -e "${YELLOW}Step 2/2: Packaging Electron app...${NC}"
        case "${PLATFORM}" in
            Mac)
                npm run electron:build:mac
                ;;
            Windows)
                npm run electron:build:win
                ;;
            Linux)
                npm run electron:build:linux
                ;;
            *)
                echo -e "${red}❌ Unsupported platform${NC}"
                exit 1
                ;;
        esac
        ;;
    2)
        echo ""
        echo -e "${BLUE}🔨 Building for Mac (Universal)...${NC}"
        echo ""
        echo -e "${YELLOW}Step 1/2: Building React app...${NC}"
        npm run build
        echo ""
        echo -e "${YELLOW}Step 2/2: Packaging Electron app...${NC}"
        npm run electron:build:mac
        ;;
    3)
        echo ""
        echo -e "${BLUE}🔨 Building for Windows...${NC}"
        echo ""
        if [ "${PLATFORM}" = "Mac" ]; then
            echo -e "${YELLOW}⚠️  Cross-platform build: Mac → Windows${NC}"
            echo "Checking for Wine..."
            if ! command -v wine &> /dev/null; then
                echo -e "${red}❌ Wine not found!${NC}"
                echo "Install with: brew install --cask wine-stable"
                echo ""
                read -p "Would you like to install Wine now? (y/n): " install_wine
                if [ "$install_wine" = "y" ]; then
                    brew install --cask wine-stable
                else
                    echo "Skipping Wine installation. Build may fail."
                fi
            else
                echo -e "${GREEN}✅ Wine found${NC}"
            fi
            echo ""
        fi
        echo -e "${YELLOW}Step 1/2: Building React app...${NC}"
        npm run build
        echo ""
        echo -e "${YELLOW}Step 2/2: Packaging Electron app...${NC}"
        npm run electron:build:win
        ;;
    4)
        echo ""
        echo -e "${BLUE}🔨 Building for Linux...${NC}"
        echo ""
        echo -e "${YELLOW}Step 1/2: Building React app...${NC}"
        npm run build
        echo ""
        echo -e "${YELLOW}Step 2/2: Packaging Electron app...${NC}"
        npm run electron:build:linux
        ;;
    5)
        echo ""
        echo -e "${BLUE}🔨 Building for ALL platforms...${NC}"
        echo -e "${YELLOW}⚠️  This will take a while!${NC}"
        echo ""
        echo -e "${YELLOW}Step 1/4: Building React app...${NC}"
        npm run build
        echo ""
        echo -e "${YELLOW}Step 2/4: Building for Mac...${NC}"
        npm run electron:build:mac
        echo ""
        echo -e "${YELLOW}Step 3/4: Building for Windows...${NC}"
        npm run electron:build:win
        echo ""
        echo -e "${YELLOW}Step 4/4: Building for Linux...${NC}"
        npm run electron:build:linux
        ;;
    6)
        echo ""
        echo -e "${BLUE}🔨 Building React app only...${NC}"
        echo ""
        npm run build
        echo ""
        echo -e "${GREEN}✅ Done! Build folder created at: frontend/build/${NC}"
        exit 0
        ;;
    *)
        echo -e "${red}❌ Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}✅ Build Complete!${NC}"
echo ""
echo "📁 Build files are in: frontend/dist/"
echo ""
echo "Next steps:"
echo "  1. Check the dist/ folder for your builds"
echo "  2. Test the app before distributing"
echo "  3. See ELECTRON_BUILD_GUIDE.md for distribution instructions"
echo ""
echo -e "${BLUE}Build Summary:${NC}"
ls -lh dist/ 2>/dev/null || echo "No files found in dist/"
echo ""
echo "🎉 Ready to distribute!"
