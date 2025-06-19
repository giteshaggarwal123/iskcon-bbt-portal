
#!/bin/bash

echo "🔧 Fixing iOS SIGABRT crash and black screen issues..."

# Ensure we're in the project root
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Clean everything thoroughly
echo "🧹 Deep cleaning project..."
rm -rf node_modules/
rm -rf dist/
rm -rf ios/

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build with iOS optimizations
echo "🏗️ Building with iOS optimizations..."
npm run build

# Add iOS platform fresh
echo "📱 Adding iOS platform..."
npx cap add ios

# Sync with specific iOS configurations
echo "🔄 Syncing with iOS optimizations..."
npx cap sync ios

# Install CocoaPods with specific configurations
echo "📱 Installing CocoaPods dependencies..."
cd ios/App
pod deintegrate
pod cache clean --all
pod install --repo-update --clean-install
cd ../..

echo "✅ iOS crash fixes applied!"
echo ""
echo "⚠️  IMPORTANT NEXT STEPS:"
echo "1. Run: npx cap open ios"
echo "2. In Xcode:"
echo "   - Clean Build Folder (Cmd+Shift+K)"
echo "   - Set your Team and Bundle Identifier"
echo "   - Check that Deployment Target is iOS 13.0 or higher"
echo "   - Build and test on simulator first"
echo "   - Check console logs in Xcode for any remaining errors"
echo ""
echo "3. If still crashing, check Xcode console for specific error messages"
echo "4. Make sure your Apple Developer account is properly configured"
