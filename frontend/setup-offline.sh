#!/bin/bash

# OK Motor - Offline Setup Script
# This script installs all necessary dependencies for offline/online hybrid functionality

echo "🚀 Setting up OK Motor Hybrid Offline/Online App..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the frontend directory."
    exit 1
fi

echo "📦 Installing Electron and related dependencies..."
npm install --save-dev electron@^28.0.0 electron-builder@^24.9.1 electron-store@^8.1.0 concurrently@^8.2.2 wait-on@^7.2.0

echo ""
echo "✅ Dependencies installed successfully!"
echo ""
echo "📝 Next steps:"
echo ""
echo "1. Update your App.js to include the NetworkStatus component:"
echo "   import NetworkStatus from './components/NetworkStatus';"
echo "   <NetworkStatus />"
echo ""
echo "2. Add Settings route to your router:"
echo "   import SettingsPage from './pages/SettingsPage';"
echo "   <Route path=\"/settings\" element={<SettingsPage />} />"
echo ""
echo "3. Update your existing components to use the new services:"
echo "   - Replace 'import axios' with 'import apiService from ./services/apiService'"
echo "   - Replace axios.get() with apiService.get()"
echo "   - Replace axios.post() with apiService.post()"
echo "   - Use pdfService for PDF generation"
echo ""
echo "4. Run the app:"
echo "   - Web: npm start"
echo "   - Electron: npm run electron:dev"
echo "   - Build: npm run electron:build:mac (or :win, :linux)"
echo ""
echo "📖 For detailed instructions, see OFFLINE_IMPLEMENTATION_GUIDE.md"
echo ""
echo "🎉 Setup complete! Your app is now ready for offline functionality!"
