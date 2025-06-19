
#!/bin/bash

echo "🔧 Fixing Capacitor iOS integration..."

# Ensure we're in the project root
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Step 1: Clean everything thoroughly
echo "🧹 Cleaning project..."
rm -rf node_modules/
rm -rf dist/
rm -rf ios/
rm -rf package-lock.json

# Step 2: Install dependencies
echo "📦 Installing dependencies..."
npm install

# Step 3: Install Capacitor iOS specifically
echo "📱 Installing Capacitor iOS..."
npm install @capacitor/ios@latest

# Step 4: Build web app
echo "🏗️ Building web app..."
npm run build

# Step 5: Initialize Capacitor (in case it's not initialized)
echo "⚡ Initializing Capacitor..."
npx cap init "ISKCON Management Portal" "com.iskcon.bbtportal" --web-dir=dist

# Step 6: Add iOS platform
echo "📱 Adding iOS platform..."
npx cap add ios

# Step 7: Sync with enhanced iOS support
echo "🔄 Syncing Capacitor..."
npx cap sync ios

# Step 8: Update iOS dependencies
echo "📱 Updating iOS dependencies..."
npx cap update ios

# Step 9: Install CocoaPods with proper setup
echo "🍎 Setting up CocoaPods..."
cd ios/App
pod deintegrate 2>/dev/null || true
pod cache clean --all 2>/dev/null || true
pod install --repo-update --clean-install
cd ../..

echo "✅ Capacitor iOS integration complete!"
echo ""
echo "📋 Next steps:"
echo "1. Run: npx cap open ios"
echo "2. In Xcode:"
echo "   - Clean Build Folder (Cmd+Shift+K)"
echo "   - Set Development Team in Signing & Capabilities"
echo "   - Set Deployment Target to iOS 14.0 or higher" 
echo "   - Build and run the project"
echo ""
echo "🔍 If you still see 'No such module Capacitor' error:"
echo "   - Check that ios/App/Podfile contains Capacitor pods"
echo "   - Verify ios/App/App/AppDelegate.swift imports Capacitor correctly"
echo "   - Make sure your Xcode version is up to date"
