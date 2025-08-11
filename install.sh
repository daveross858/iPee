#!/bin/bash

# iPee Bathroom Finder App - Installation Script
# This script will help you set up the development environment

echo "🚽 Welcome to iPee - GPS Bathroom Finder App! 🚽"
echo "=================================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version $NODE_VERSION detected. Please upgrade to v16 or higher."
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not available. Please install npm."
    exit 1
fi

echo "✅ npm $(npm -v) detected"

# Check if Expo CLI is installed
if ! command -v expo &> /dev/null; then
    echo "📦 Installing Expo CLI globally..."
    npm install -g @expo/cli
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install Expo CLI. Please try manually: npm install -g @expo/cli"
        exit 1
    fi
fi

echo "✅ Expo CLI installed"

# Install project dependencies
echo "📦 Installing project dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies. Please check the error above."
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Create assets directory if it doesn't exist
if [ ! -d "assets" ]; then
    mkdir assets
    echo "📁 Created assets directory"
fi

echo ""
echo "🎉 Installation completed successfully!"
echo ""
echo "🚀 To start the development server, run:"
echo "   npm start"
echo ""
echo "📱 To run on your device:"
echo "   1. Install Expo Go app on your phone"
echo "   2. Scan the QR code that appears"
echo ""
echo "💻 To run on simulators:"
echo "   - Press 'i' for iOS simulator"
echo "   - Press 'a' for Android emulator"
echo ""
echo "📚 For more information, check the README.md file"
echo ""
echo "Happy coding! 🚽✨"
