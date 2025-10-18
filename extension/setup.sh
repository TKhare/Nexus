#!/bin/bash

# AI Research Assistant - Setup Script
# This script helps you set up the Chrome extension for development

set -e  # Exit on error

echo "🚀 AI Research Assistant - Setup Script"
echo "========================================"
echo ""

# Check Node.js installation
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Check npm installation
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

echo "✅ npm $(npm -v) detected"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi
echo ""

# Check for API key configuration
if [ ! -f "utils/apiConfig.js" ]; then
    echo "❌ utils/apiConfig.js not found"
    exit 1
fi

API_KEY=$(grep "CLAUDE_API_KEY" utils/apiConfig.js | grep -o "'[^']*'" | sed "s/'//g")

if [ "$API_KEY" = "YOUR_API_KEY_HERE" ]; then
    echo "⚠️  WARNING: API key not configured!"
    echo ""
    echo "Please edit utils/apiConfig.js and add your Claude API key:"
    echo "  export const CLAUDE_API_KEY = 'your-actual-api-key-here';"
    echo ""
    echo "Get your API key from: https://console.anthropic.com/"
    echo ""
    read -p "Do you want to continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✅ API key configured"
fi
echo ""

# Create placeholder icons if they don't exist
ICONS_DIR="public/icons"
if [ ! -f "$ICONS_DIR/icon16.png" ] || [ ! -f "$ICONS_DIR/icon48.png" ] || [ ! -f "$ICONS_DIR/icon128.png" ]; then
    echo "⚠️  Icons not found in $ICONS_DIR"
    echo ""
    echo "Creating placeholder icons..."

    # Check if ImageMagick is installed
    if command -v convert &> /dev/null; then
        convert -size 16x16 xc:#4A90E2 "$ICONS_DIR/icon16.png"
        convert -size 48x48 xc:#4A90E2 "$ICONS_DIR/icon48.png"
        convert -size 128x128 xc:#4A90E2 "$ICONS_DIR/icon128.png"
        echo "✅ Placeholder icons created"
    else
        echo "❌ ImageMagick not found. Please create icons manually."
        echo "   See $ICONS_DIR/README.md for instructions"
        echo ""
        read -p "Do you want to continue without icons? (y/n) " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
else
    echo "✅ Icons found"
fi
echo ""

# Build the extension
echo "🔨 Building extension..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Extension built successfully"
else
    echo "❌ Failed to build extension"
    exit 1
fi
echo ""

# Success message
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Open Chrome and navigate to chrome://extensions/"
echo "2. Enable 'Developer mode' (toggle in top right)"
echo "3. Click 'Load unpacked'"
echo "4. Select the 'dist' folder inside this directory"
echo ""
echo "Development tips:"
echo "- Run 'npm run dev' for watch mode (auto-rebuild on changes)"
echo "- Run 'npm run build' for production build"
echo "- Press Ctrl+Shift+S (or Cmd+Shift+S on Mac) to capture screenshots"
echo ""
echo "Happy capturing! 📸"
