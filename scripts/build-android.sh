
#!/bin/bash

echo "🤖 Building ISKCON Management Portal for Android..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/
rm -rf android/app/src/main/assets/public/

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build for production
echo "🏗️ Building for production..."
npm run build

# Sync with Capacitor
echo "📱 Syncing with Capacitor..."
npx cap sync android

# Update Android dependencies
echo "🔄 Updating Android dependencies..."
npx cap update android

echo "✅ Android build complete!"
echo ""
echo "Next steps:"
echo "1. Run: npx cap open android"
echo "2. In Android Studio, clean and rebuild the project"
echo "3. Make sure you have a connected device or emulator"
echo "4. Click the Run button in Android Studio"
echo ""
echo "If you still get 'App not found', make sure:"
echo "- Your device/emulator is connected"
echo "- USB debugging is enabled (for physical devices)"
echo "- The app is properly installed on the device"
